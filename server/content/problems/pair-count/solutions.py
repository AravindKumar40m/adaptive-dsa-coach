APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(prices, budget):
    total = 0
    for i in range(len(prices)):
        for j in range(i + 1, len(prices)):
            if prices[i] + prices[j] == budget:
                total += 1
    return total


def optimal(prices, budget):
    count = {}
    total = 0
    for p in prices:
        total += count.get(budget - p, 0)
        count[p] = count.get(p, 0) + 1
    return total


def gen(rng):
    n = rng.randint(2, 20)
    return [[rng.randint(-5, 8) for _ in range(n)], rng.randint(-3, 12)]
