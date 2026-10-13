APPROACHES = {"brute": ("O(2^n)", "O(n)"), "optimal": ("O(n * k)", "O(k)")}


def brute(k, prices):
    n = len(prices)

    def go(i, left, holding):
        if i == n:
            return 0
        best = go(i + 1, left, holding)
        if holding:
            best = max(best, prices[i] + go(i + 1, left, False))
        elif left > 0:
            best = max(best, -prices[i] + go(i + 1, left - 1, True))
        return best

    return go(0, k, False)


def optimal(k, prices):
    buy = [-10 ** 9] * (k + 1)
    sell = [0] * (k + 1)
    for price in prices:
        for t in range(1, k + 1):
            buy[t] = max(buy[t], sell[t - 1] - price)
            sell[t] = max(sell[t], buy[t] + price)
    return sell[k]


def gen(rng):
    return [rng.randint(1, 3), [rng.randint(1, 9) for _ in range(rng.randint(0, 10))]]
