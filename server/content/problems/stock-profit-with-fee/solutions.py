APPROACHES = {"brute": ("O(3^n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def BRUTE_OK(args):
    return len(args[0]) <= 10


def brute(prices, fee):
    n = len(prices)

    def go(i, holding):
        if i == n:
            return 0
        best = go(i + 1, holding)
        if holding:
            best = max(best, prices[i] - fee + go(i + 1, False))
        else:
            best = max(best, -prices[i] + go(i + 1, True))
        return best

    return go(0, False)


def optimal(prices, fee):
    cash = 0
    hold = -10 ** 9
    for price in prices:
        cash = max(cash, hold + price - fee)
        hold = max(hold, cash - price)
    return cash


def gen(rng):
    return [[rng.randint(1, 9) for _ in range(rng.randint(0, 9))], rng.randint(0, 4)]
