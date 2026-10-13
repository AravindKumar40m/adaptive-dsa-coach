APPROACHES = {"brute": ("O(n * m * log(n * m))", "O(n * m)"), "optimal": ("O(k log k)", "O(k)")}


def brute(first, second, k):
    return sorted(x + y for x in first for y in second)[:k]


def optimal(first, second, k):
    import heapq

    out = []
    if not first or not second:
        return out
    heap = [(first[i] + second[0], i, 0) for i in range(min(len(first), k))]
    heapq.heapify(heap)
    while heap and len(out) < k:
        total, i, j = heapq.heappop(heap)
        out.append(total)
        if j + 1 < len(second):
            heapq.heappush(heap, (first[i] + second[j + 1], i, j + 1))
    return out


def gen(rng):
    return [sorted(rng.randint(-5, 9) for _ in range(rng.randint(0, 5))), sorted(rng.randint(-5, 9) for _ in range(rng.randint(0, 5))), rng.randint(1, 8)]
