APPROACHES = {"brute": ("O((amount / min)^n)", "O(n)"), "optimal": ("O(n * amount)", "O(amount)")}


def brute(coins, amount):
    def count(i, left):
        if left == 0:
            return 1
        if i == len(coins):
            return 0
        total = 0
        used = 0
        while used * coins[i] <= left:
            total += count(i + 1, left - used * coins[i])
            used += 1
        return total

    return count(0, amount)


def optimal(coins, amount):
    ways = [0] * (amount + 1)
    ways[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            ways[a] += ways[a - c]
    return ways[amount]


def gen(rng):
    return [rng.sample(range(1, 8), rng.randint(1, 4)), rng.randint(0, 14)]
