APPROACHES = {"brute": ("O(m^(k+1))", "O(k)"), "optimal": ("O(k * m)", "O(n)")}
EXPECT_SLOW = {"brute"}  # trying every route is exponential on purpose


def BRUTE_OK(args):
    return len(args[1]) <= 12 and args[4] <= 4


def brute(n, flights, src, dst, k):
    best = [None]

    def go(city, cost, flights_used):
        if best[0] is not None and cost >= best[0]:
            return
        if city == dst:
            best[0] = cost
            return
        if flights_used == k + 1:
            return
        for a, b, price in flights:
            if a == city:
                go(b, cost + price, flights_used + 1)

    go(src, 0, 0)
    return -1 if best[0] is None else best[0]


def optimal(n, flights, src, dst, k):
    inf = float("inf")
    price = [inf] * n
    price[src] = 0
    for _ in range(k + 1):
        nxt = price[:]
        for a, b, p in flights:
            if price[a] + p < nxt[b]:
                nxt[b] = price[a] + p
        price = nxt
    return -1 if price[dst] == inf else price[dst]


def gen(rng):
    n = rng.randint(2, 5)
    flights = []
    for _ in range(rng.randint(0, 9)):
        a, b = rng.randrange(n), rng.randrange(n)
        if a != b:
            flights.append([a, b, rng.randint(1, 9)])
    src = rng.randrange(n)
    dst = rng.choice([c for c in range(n) if c != src])
    return [n, flights, src, dst, rng.randint(0, 3)]
