"""Baseline knowledge-tracing models on the synthetic attempts (stdlib only).

Task: predict `passed` for each attempt using only that learner's earlier attempts.
Split: 80% of learners for training, 20% held out entirely.
Models: global pass rate, Elo (learner x topic ability vs difficulty), logistic regression.

Usage: python3 baseline_model.py [attempts.csv]
"""
import csv, json, math, random, sys
from collections import defaultdict

def sig(x):
    return 1 / (1 + math.exp(-max(-30, min(30, x))))

def load(path):
    by_learner = defaultdict(list)
    with open(path) as f:
        for r in csv.DictReader(f):
            by_learner[r["learner_id"]].append(r)
    return by_learner

class Elo:
    """Online Elo: ability per (learner, topic) seeded by learner's global ability."""
    def __init__(self, k=0.4, k_diff=0.02):
        self.k, self.k_diff = k, k_diff
        self.diff = defaultdict(float)  # difficulty level -> offset, learned on train only
    def run(self, rows, learn_difficulty):
        glob, theta, preds = 0.0, {}, []
        for r in rows:
            t, d = r["topic"], int(r["difficulty"])
            th = theta.get(t, glob)
            p = sig(th - self.diff[d])
            y = int(r["passed"])
            preds.append(p)
            theta[t] = th + self.k * (y - p)
            glob += 0.1 * self.k * (y - p)
            if learn_difficulty:
                self.diff[d] -= self.k_diff * (y - p)
        return preds, theta

def features(rows):
    """Yield (x, y) per attempt using history only (no hints/time/attempts of the current try)."""
    n_all, p_all = 0, 0
    topic = defaultdict(lambda: {"n": 0, "p": 0, "last": None, "recent": []})
    for r in rows:
        s, d, day = topic[r["topic"]], int(r["difficulty"]), int(r["day"])
        gap = 0 if s["last"] is None else day - s["last"]
        recent = sum(s["recent"]) / len(s["recent"]) if s["recent"] else 0.5
        x = [1.0, d / 10, (d / 10) ** 2,
             math.log1p(s["n"]), (s["p"] + 1) / (s["n"] + 2), recent,
             (p_all + 1) / (n_all + 2), math.log1p(n_all), math.log1p(gap),
             1.0 if s["n"] == 0 else 0.0]
        y = int(r["passed"])
        yield x, y
        s["n"] += 1; s["p"] += y; s["last"] = day
        s["recent"] = (s["recent"] + [y])[-5:]
        n_all += 1; p_all += y

FEATURE_NAMES = ["bias", "difficulty", "difficulty^2", "log_topic_attempts", "topic_pass_rate",
                 "topic_recent5_pass_rate", "overall_pass_rate", "log_total_attempts",
                 "log_days_since_topic", "first_time_on_topic"]

def train_lr(X, Y, epochs=3, lr=0.05, l2=1e-5, seed=0):
    w = [0.0] * len(X[0]); idx = list(range(len(X))); rng = random.Random(seed)
    for ep in range(epochs):
        rng.shuffle(idx)
        for i in idx:
            x = X[i]; g = sig(sum(a * b for a, b in zip(w, x))) - Y[i]
            for j in range(len(w)):
                w[j] -= lr / (1 + ep) * (g * x[j] + l2 * w[j])
    return w

def metrics(p, y):
    acc = sum((pi >= 0.5) == yi for pi, yi in zip(p, y)) / len(y)
    ll = -sum(math.log(max(1e-9, pi if yi else 1 - pi)) for pi, yi in zip(p, y)) / len(y)
    pos = sorted(range(len(p)), key=lambda i: p[i])  # AUC via rank sum
    ranks = [0] * len(p)
    for r_, i in enumerate(pos):
        ranks[i] = r_ + 1
    n1 = sum(y); n0 = len(y) - n1
    auc = (sum(r_ for r_, yi in zip(ranks, y) if yi) - n1 * (n1 + 1) / 2) / (n1 * n0)
    return {"accuracy": round(acc, 4), "auc": round(auc, 4), "log_loss": round(ll, 4)}

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "attempts.csv"
    data = load(path)
    ids = sorted(data); random.Random(42).shuffle(ids)
    cut = int(0.8 * len(ids)); train_ids, test_ids = ids[:cut], ids[cut:]

    # Global rate baseline
    tr_y = [int(r["passed"]) for u in train_ids for r in data[u]]
    te_y = [int(r["passed"]) for u in test_ids for r in data[u]]
    rate = sum(tr_y) / len(tr_y)
    results = {"global_pass_rate": metrics([rate] * len(te_y), te_y)}

    # Elo: difficulty offsets learned on train learners, then frozen for test learners
    elo = Elo()
    for _ in range(2):
        for u in train_ids:
            elo.run(data[u], learn_difficulty=True)
    elo_p = []
    for u in test_ids:
        elo_p += elo.run(data[u], learn_difficulty=False)[0]
    results["elo"] = metrics(elo_p, te_y)

    # Logistic regression on history features
    X, Y = [], []
    for u in train_ids:
        for x, y in features(data[u]):
            X.append(x); Y.append(y)
    w = train_lr(X, Y)
    lr_p = [sig(sum(a * b for a, b in zip(w, x))) for u in test_ids for x, _ in features(data[u])]
    results["logistic_regression"] = metrics(lr_p, te_y)

    # Oracle: uses the simulator's hidden skill, i.e. the ceiling no real model can see
    orc_X, orc_Y = [], []
    for u in train_ids:
        for r in data[u]:
            s, d = float(r["true_skill_before"]), (int(r["difficulty"]) - 1) / 9
            orc_X.append([1.0, s, d, s - d]); orc_Y.append(int(r["passed"]))
    wo = train_lr(orc_X, orc_Y, epochs=2)
    orc_p = [sig(wo[0] + wo[1] * float(r["true_skill_before"]) + wo[2] * ((int(r["difficulty"]) - 1) / 9)
                 + wo[3] * (float(r["true_skill_before"]) - (int(r["difficulty"]) - 1) / 9))
             for u in test_ids for r in data[u]]
    results["oracle_hidden_skill (ceiling)"] = metrics(orc_p, te_y)

    out = {"train_learners": len(train_ids), "test_learners": len(test_ids),
           "test_attempts": len(te_y), "test_pass_rate": round(sum(te_y) / len(te_y), 4),
           "results": results,
           "logistic_regression_weights": dict(zip(FEATURE_NAMES, [round(v, 4) for v in w])),
           "elo_difficulty_offsets": {d: round(v, 3) for d, v in sorted(elo.diff.items())}}
    print(json.dumps(out, indent=2))
    with open("baseline_results.json", "w") as f:
        json.dump(out, f, indent=2)
