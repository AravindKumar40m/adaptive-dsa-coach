APPROACHES = {"brute": ("O(n * m)", "O(1)"), "optimal": ("O(n + m)", "O(n)")}


def brute(n, trust):
    for person in range(1, n + 1):
        trusts_someone = any(a == person for a, b in trust)
        trusted_by = sum(1 for a, b in trust if b == person)
        if not trusts_someone and trusted_by == n - 1:
            return person
    return -1


def optimal(n, trust):
    score = [0] * (n + 1)
    for a, b in trust:
        score[a] -= 1
        score[b] += 1
    for person in range(1, n + 1):
        if score[person] == n - 1:
            return person
    return -1


def gen(rng):
    n = rng.randint(1, 6)
    pairs = set()
    if rng.random() < 0.85:
        judge = rng.randint(1, n)
        for p in range(1, n + 1):
            if p != judge:
                pairs.add((p, judge))
        for _ in range(rng.randint(0, 3)):
            a, b = rng.randint(1, n), rng.randint(1, n)
            if a != b and a != judge:
                pairs.add((a, b))
        if n > 1 and rng.random() < 0.15:  # break it: the judge trusts someone
            pairs.add((judge, rng.choice([p for p in range(1, n + 1) if p != judge])))
    else:
        for _ in range(rng.randint(0, 6)):
            a, b = rng.randint(1, n), rng.randint(1, n)
            if a != b:
                pairs.add((a, b))
    return [n, [list(p) for p in sorted(pairs)]]
