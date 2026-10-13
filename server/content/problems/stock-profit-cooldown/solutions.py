APPROACHES = {"brute": ("O(2^n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(prices):
    n = len(prices)

    def go(i, holding):
        if i >= n:
            return 0
        best = go(i + 1, holding)
        if holding:
            best = max(best, prices[i] + go(i + 2, False))
        else:
            best = max(best, -prices[i] + go(i + 1, True))
        return best

    return go(0, False)


def optimal(prices):
    hold = -10 ** 9
    sold = 0
    rest = 0
    for price in prices:
        previous_sold = sold
        sold = hold + price
        hold = max(hold, rest - price)
        rest = max(rest, previous_sold)
    return max(sold, rest)


def gen(rng):
    return [[rng.randint(1, 9) for _ in range(rng.randint(0, 11))]]
