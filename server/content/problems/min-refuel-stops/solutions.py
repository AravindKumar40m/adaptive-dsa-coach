APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(target, start_fuel, stations):
    n = len(stations)
    dp = [start_fuel] + [0] * n
    for i, (pos, fuel) in enumerate(stations):
        for t in range(i, -1, -1):
            if dp[t] >= pos:
                dp[t + 1] = max(dp[t + 1], dp[t] + fuel)
    for t in range(n + 1):
        if dp[t] >= target:
            return t
    return -1


def optimal(target, start_fuel, stations):
    import heapq

    heap = []
    reach = start_fuel
    stops = 0
    i = 0
    while reach < target:
        while i < len(stations) and stations[i][0] <= reach:
            heapq.heappush(heap, -stations[i][1])
            i += 1
        if not heap:
            return -1
        reach += -heapq.heappop(heap)
        stops += 1
    return stops


def gen(rng):
    target = rng.randint(2, 40)
    count = rng.randint(min(2, target - 1), min(7, target - 1))
    positions = sorted(rng.sample(range(1, target), count))
    return [target, rng.randint(1, 15), [[p, rng.randint(3, 20)] for p in positions]]
