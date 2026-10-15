APPROACHES = {"brute": ("O(answer * k)", "O(count)"), "optimal": ("O(n * k log n)", "O(n)")}


def brute(n, primes):
    limit = 2
    while True:
        numbers = {1}
        for p in primes:
            grown = set()
            for x in numbers:
                v = x
                while v <= limit:
                    grown.add(v)
                    v *= p
            numbers = grown
        if len(numbers) >= n:
            return sorted(numbers)[n - 1]
        limit *= 2


def optimal(n, primes):
    import heapq

    heap = [1]
    seen = {1}
    x = 1
    for _ in range(n):
        x = heapq.heappop(heap)
        for p in primes:
            if x * p not in seen:
                seen.add(x * p)
                heapq.heappush(heap, x * p)
    return x


def gen(rng):
    pool = [2, 3, 5, 7, 11, 13]
    while True:
        chosen = sorted(rng.sample(pool, rng.randint(1, 4)))
        n = rng.randint(1, 30)
        if optimal(n, chosen) <= 2147483647:
            return [n, chosen]
