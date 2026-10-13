APPROACHES = {"brute": ("O(2^n * n log n)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(jobs):
    n = len(jobs)
    best = 0
    for mask in range(1 << n):
        chosen = [jobs[i] for i in range(n) if mask >> i & 1]
        chosen.sort()
        if all(deadline >= i + 1 for i, (deadline, profit) in enumerate(chosen)):
            best = max(best, sum(profit for deadline, profit in chosen))
    return best


def optimal(jobs):
    import heapq

    heap = []
    for deadline, profit in sorted(jobs):
        heapq.heappush(heap, profit)
        if len(heap) > deadline:
            heapq.heappop(heap)
    return sum(heap)


def gen(rng):
    return [[[rng.randint(1, 5), rng.randint(0, 9)] for _ in range(rng.randint(0, 8))]]
