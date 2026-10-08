APPROACHES = {"brute": ("O(2^n)", "O(n)"), "better": ("O(n)", "O(1)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # trying every buy/sell choice is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 14


def brute(prices):
    def go(day, holding):
        if day == len(prices):
            return 0
        best = go(day + 1, holding)  # do nothing today
        if holding:
            best = max(best, prices[day] + go(day + 1, False))  # sell
        else:
            best = max(best, -prices[day] + go(day + 1, True))  # buy
        return best

    return go(0, False)


def better(prices):
    cash, held = 0, -prices[0]
    for p in prices[1:]:
        cash, held = max(cash, held + p), max(held, cash - p)
    return cash


def optimal(prices):
    profit = 0
    for i in range(1, len(prices)):
        if prices[i] > prices[i - 1]:
            profit += prices[i] - prices[i - 1]
    return profit


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.choice([rng.randint(1, 10), rng.randint(15, 25)]))]]
