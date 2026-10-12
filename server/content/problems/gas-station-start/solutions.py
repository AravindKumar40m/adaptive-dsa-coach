APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(gas, cost):
    n = len(gas)
    for s in range(n):
        tank = 0
        ok = True
        for step in range(n):
            i = (s + step) % n
            tank += gas[i] - cost[i]
            if tank < 0:
                ok = False
                break
        if ok:
            return s
    return -1


def optimal(gas, cost):
    total = 0
    tank = 0
    start = 0
    for i in range(len(gas)):
        gain = gas[i] - cost[i]
        total += gain
        tank += gain
        if tank < 0:
            start = i + 1
            tank = 0
    return start if total >= 0 else -1


def gen(rng):
    n = rng.randint(2, 8)
    gas = [rng.randint(0, 6) for _ in range(n)]
    cost = [rng.randint(0, 6) for _ in range(n)]
    if rng.random() < 0.55 and sum(gas) < sum(cost):
        gas[rng.randrange(n)] += sum(cost) - sum(gas)
    shift = rng.randrange(n)  # rotate the circle so the answer is not always near station 0
    return [gas[shift:] + gas[:shift], cost[shift:] + cost[:shift]]
