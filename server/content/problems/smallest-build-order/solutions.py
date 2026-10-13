APPROACHES = {"brute": ("O(n! * m)", "O(n)"), "optimal": ("O((n + m) log n)", "O(n + m)")}


def brute(n, pairs):
    from itertools import permutations

    for order in permutations(range(n)):
        position = {job: i for i, job in enumerate(order)}
        if all(position[a] < position[b] for a, b in pairs):
            return list(order)
    return []


def optimal(n, pairs):
    import heapq

    count = [0] * n
    later = [[] for _ in range(n)]
    for a, b in pairs:
        count[b] += 1
        later[a].append(b)
    heap = [job for job in range(n) if count[job] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        job = heapq.heappop(heap)
        order.append(job)
        for b in later[job]:
            count[b] -= 1
            if count[b] == 0:
                heapq.heappush(heap, b)
    return order if len(order) == n else []


def gen(rng):
    n = rng.randint(1, 6)
    ranking = list(range(n))
    rng.shuffle(ranking)
    pairs = []
    if n > 1:
        for _ in range(rng.randint(0, 8)):
            a, b = rng.sample(range(n), 2)
            if rng.random() < 0.85 and ranking.index(a) > ranking.index(b):
                a, b = b, a
            pairs.append([a, b])
    return [n, pairs]
