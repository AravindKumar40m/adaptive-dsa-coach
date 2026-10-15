APPROACHES = {"brute": ("O((n-1)! * n)", "O(n)"), "better": ("O((n-1)!) pruned", "O(n)"), "optimal": ("O(2^n * n^2)", "O(2^n * n)")}


def BRUTE_OK(args):
    return len(args[0]) <= 8


def brute(dist):
    from itertools import permutations

    n = len(dist)
    best = None
    for order in permutations(range(1, n)):
        cost = 0
        here = 0
        for city in order:
            cost += dist[here][city]
            here = city
        if best is None or cost < best:
            best = cost
    return best


def better(dist):
    n = len(dist)
    best = [None]
    visited = [False] * n
    visited[0] = True

    def go(here, count, cost):
        if best[0] is not None and cost >= best[0]:
            return
        if count == n:
            best[0] = cost
            return
        for nxt in range(n):
            if not visited[nxt]:
                visited[nxt] = True
                go(nxt, count + 1, cost + dist[here][nxt])
                visited[nxt] = False

    go(0, 1, 0)
    return best[0]


def optimal(dist):
    n = len(dist)
    INF = 10 ** 9
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0
    for mask in range(1, 1 << n):
        if not mask & 1:
            continue
        for last in range(n):
            if dp[mask][last] >= INF:
                continue
            for nxt in range(n):
                if not mask & (1 << nxt):
                    cost = dp[mask][last] + dist[last][nxt]
                    if cost < dp[mask | (1 << nxt)][nxt]:
                        dp[mask | (1 << nxt)][nxt] = cost
    return min(dp[(1 << n) - 1])


def gen(rng):
    n = rng.randint(1, 6)
    return [[[0 if i == j else rng.randint(1, 20) for j in range(n)] for i in range(n)]]
