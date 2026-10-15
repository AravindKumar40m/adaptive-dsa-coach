APPROACHES = {"brute": ("O(n * k)", "O(1)"), "optimal": ("O(n + k log n)", "O(n)")}


def brute(gifts, k):
    from math import isqrt

    piles = list(gifts)
    for _ in range(k):
        if not piles:
            break
        i = piles.index(max(piles))
        piles[i] = isqrt(piles[i])
    return sum(piles)


def optimal(gifts, k):
    import heapq
    from math import isqrt

    heap = [-g for g in gifts]
    heapq.heapify(heap)
    for _ in range(k):
        if not heap:
            break
        x = -heapq.heappop(heap)
        heapq.heappush(heap, -isqrt(x))
    return -sum(heap)


def gen(rng):
    return [[rng.randint(1, 200) for _ in range(rng.randint(0, 6))], rng.randint(0, 8)]
