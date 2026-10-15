APPROACHES = {"brute": ("O(2^n * n log n)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(courses):
    n = len(courses)
    best = 0
    for mask in range(1 << n):
        chosen = sorted((courses[i] for i in range(n) if mask >> i & 1), key=lambda c: c[1])
        time = 0
        ok = True
        for duration, last in chosen:
            time += duration
            if time > last:
                ok = False
                break
        if ok:
            best = max(best, len(chosen))
    return best


def optimal(courses):
    import heapq

    heap = []
    total = 0
    for duration, last in sorted(courses, key=lambda c: c[1]):
        total += duration
        heapq.heappush(heap, -duration)
        if total > last:
            total += heapq.heappop(heap)
    return len(heap)


def gen(rng):
    return [[[rng.randint(1, 6), rng.randint(1, 12)] for _ in range(rng.randint(0, 8))]]
