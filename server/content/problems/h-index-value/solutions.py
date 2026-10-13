APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(citations):
    n = len(citations)
    for h in range(n, 0, -1):
        if sum(1 for c in citations if c >= h) >= h:
            return h
    return 0


def optimal(citations):
    n = len(citations)
    buckets = [0] * (n + 1)
    for c in citations:
        buckets[min(c, n)] += 1
    papers = 0
    for h in range(n, -1, -1):
        papers += buckets[h]
        if papers >= h:
            return h
    return 0


def gen(rng):
    return [[rng.randint(0, 12) for _ in range(rng.randint(1, 9))]]
