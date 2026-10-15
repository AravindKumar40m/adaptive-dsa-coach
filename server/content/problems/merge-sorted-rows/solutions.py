APPROACHES = {"brute": ("O(N log N)", "O(N)"), "optimal": ("O(N log k)", "O(k)")}


def brute(rows):
    return sorted(x for row in rows for x in row)


def optimal(rows):
    import heapq

    heap = [(row[0], r, 0) for r, row in enumerate(rows) if row]
    heapq.heapify(heap)
    out = []
    while heap:
        value, r, c = heapq.heappop(heap)
        out.append(value)
        if c + 1 < len(rows[r]):
            heapq.heappush(heap, (rows[r][c + 1], r, c + 1))
    return out


def gen(rng):
    return [[sorted(rng.randint(-5, 9) for _ in range(rng.randint(0, 4))) for _ in range(rng.randint(0, 4))]]
