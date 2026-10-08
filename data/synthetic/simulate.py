"""Synthetic DSA learner simulator (stdlib only).

Each learner has a hidden skill (0..1) per topic that grows with practice,
decays when a topic is left alone, and is observed only through noisy
attempts (slips and guesses). Output: one row per problem attempt.

Usage: python3 simulate.py --learners 3000 --days 90 --seed 7
"""
import argparse, csv, json, math, random

# topic -> (prerequisites, optimal complexity class typical for the topic)
TOPICS = {
    "arrays":         ([], "O(n)"),
    "strings":        (["arrays"], "O(n)"),
    "hashing":        (["arrays"], "O(n)"),
    "two_pointers":   (["arrays"], "O(n)"),
    "sorting":        (["arrays"], "O(n log n)"),
    "sliding_window": (["two_pointers", "hashing"], "O(n)"),
    "stack_queue":    (["arrays"], "O(n)"),
    "linked_list":    (["arrays"], "O(n)"),
    "recursion":      (["arrays"], "O(2^n)"),
    "binary_search":  (["sorting"], "O(log n)"),
    "trees":          (["recursion", "linked_list"], "O(n)"),
    "heaps":          (["trees", "sorting"], "O(n log n)"),
    "graphs":         (["trees", "stack_queue"], "O(V+E)"),
    "greedy":         (["sorting"], "O(n log n)"),
    "backtracking":   (["recursion"], "O(2^n)"),
    "dp":             (["recursion", "arrays"], "O(n^2)"),
}
COMPLEXITY_LADDER = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)", "O(n^3)", "O(2^n)", "O(n!)"]
DIFF_LABEL = lambda d: "easy" if d <= 3 else ("medium" if d <= 7 else "hard")

ARCHETYPES = {  # name: (weight, initial skill range, learning rate range)
    "zero_knowledge": (0.35, (0.00, 0.10), (0.08, 0.18)),
    "beginner":       (0.30, (0.10, 0.35), (0.06, 0.15)),
    "intermediate":   (0.25, (0.35, 0.65), (0.06, 0.14)),
    "advanced":       (0.10, (0.65, 0.90), (0.06, 0.14)),
}

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

def worse_complexity(c, steps):
    if c == "O(V+E)":  # graph solutions degrade to quadratic-ish
        return "O(V^2)" if steps == 1 else "O(V^3)"
    i = COMPLEXITY_LADDER.index(c)
    return COMPLEXITY_LADDER[min(i + steps, len(COMPLEXITY_LADDER) - 1)]

def make_learner(lid, rng):
    names = list(ARCHETYPES)
    arch = rng.choices(names, weights=[ARCHETYPES[n][0] for n in names])[0]
    _, (lo, hi), (lr_lo, lr_hi) = ARCHETYPES[arch]
    skill = {}
    for t, (pre, _) in TOPICS.items():
        base = rng.uniform(lo, hi)
        if pre:  # advanced topics start lower than fundamentals
            base *= rng.uniform(0.5, 0.9)
        skill[t] = min(0.98, base)
    return {
        "id": f"u{lid:05d}", "archetype": arch, "skill": skill,
        "learn_rate": rng.uniform(lr_lo, lr_hi),
        "forget_rate": rng.uniform(0.01, 0.04),  # fraction of unconsolidated skill lost per idle day
        "slip": rng.uniform(0.03, 0.12),
        "guess": rng.uniform(0.02, 0.10),
        "speed": rng.lognormvariate(0, 0.3),        # >1 = slower
        "hint_affinity": rng.uniform(0.1, 0.9),
        "consistency": rng.uniform(0.4, 0.95),      # chance of practicing on a given day
        "last_seen": {},
        "peak": dict(skill),
    }

def pick_topic(L, rng):
    # unlocked = prerequisites reasonably solid; prefer weakest unlocked topic
    unlocked = [t for t, (pre, _) in TOPICS.items() if all(L["skill"][p] > 0.4 for p in pre)]
    if rng.random() < 0.2:
        return rng.choice(unlocked)
    weights = [(1.05 - L["skill"][t]) ** 2 for t in unlocked]
    return rng.choices(unlocked, weights=weights)[0]

def simulate(n_learners, n_days, seed):
    rng = random.Random(seed)
    rows, learners = [], []
    pid_counter = 0
    for lid in range(n_learners):
        L = make_learner(lid, rng)
        start_skill = {t: round(v, 4) for t, v in L["skill"].items()}
        for day in range(n_days):
            if rng.random() > L["consistency"]:
                continue
            for _ in range(rng.randint(2, 7)):  # problems per session
                t = pick_topic(L, rng)
                # forgetting: exponential decay over idle days since this topic was last practiced
                idle = day - L["last_seen"].get(t, day)
                floor = 0.85 * L["peak"].get(t, 0.0)  # consolidated knowledge is not forgotten
                L["skill"][t] = floor + (L["skill"][t] - floor) * (1 - L["forget_rate"]) ** idle
                L["last_seen"][t] = day
                s = L["skill"][t]
                # recommender picks difficulty near current skill, with noise
                diff = max(1, min(10, round(1 + 9 * s + rng.gauss(0, 1.5))))
                d01 = (diff - 1) / 9
                p_know = sigmoid(8 * (s - d01 + 0.1))
                hints = 0
                if p_know < 0.6 and rng.random() < L["hint_affinity"]:
                    hints = rng.randint(1, 3)
                    p_know = min(1, p_know + 0.12 * hints)
                p_pass = L["guess"] + (1 - L["slip"] - L["guess"]) * p_know
                passed = rng.random() < p_pass
                attempts = 1 + (0 if passed and rng.random() < p_know else
                                min(9, int(rng.expovariate(1 / (1 + 3 * (1 - p_know))))))
                time_sec = int(L["speed"] * (120 + 90 * diff) * (1.6 - s) * rng.lognormvariate(0, 0.35)
                               + 45 * (attempts - 1))
                optimal = TOPICS[t][1]
                if passed and rng.random() < sigmoid(6 * (s - d01)):
                    est = optimal
                else:
                    est = worse_complexity(optimal, rng.choice([1, 1, 2]))
                pid_counter += 1
                rows.append({
                    "learner_id": L["id"], "day": day, "topic": t,
                    "problem_id": f"{t}-{diff}-{rng.randint(1, 40):02d}",
                    "difficulty": diff, "difficulty_label": DIFF_LABEL(diff),
                    "time_taken_sec": time_sec, "attempts": attempts,
                    "hints_used": hints, "passed": int(passed),
                    "optimal_complexity": optimal, "estimated_complexity": est,
                    "is_optimal": int(est == optimal),
                    "true_skill_before": round(s, 4),  # hidden; evaluation only
                })
                # learning: bigger gain on success, near-own-level problems, fewer hints
                gain = L["learn_rate"] * (1.0 if passed else 0.4) * (1 - 0.2 * hints)
                gain *= 1.0 - abs(s - d01)  # too easy/too hard teaches less
                L["skill"][t] = min(0.99, s + gain * (1 - s))
                L["peak"][t] = max(L["peak"].get(t, 0.0), L["skill"][t])
        rec = {k: (round(v, 4) if isinstance(v, float) else v)
               for k, v in L.items() if k not in ("skill", "last_seen", "peak")}
        rec["start_skill"] = start_skill
        rec["end_skill"] = {t: round(v, 4) for t, v in L["skill"].items()}
        learners.append(rec)
    return rows, learners

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--learners", type=int, default=3000)
    ap.add_argument("--days", type=int, default=90)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default=".")
    a = ap.parse_args()
    rows, learners = simulate(a.learners, a.days, a.seed)
    with open(f"{a.out}/attempts.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    with open(f"{a.out}/learners.jsonl", "w") as f:
        for L in learners:
            f.write(json.dumps(L) + "\n")
    print(f"{len(learners)} learners, {len(rows)} attempts")
