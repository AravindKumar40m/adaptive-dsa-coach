APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n * 22)", "O(n)")}


def brute(numbers):
    powers = {1 << k for k in range(23)}
    n = len(numbers)
    return sum(1 for i in range(n) for j in range(i + 1, n) if numbers[i] + numbers[j] in powers)


def optimal(numbers):
    powers = [1 << k for k in range(22)]
    seen = {}
    total = 0
    for x in numbers:
        for p in powers:
            need = p - x
            if need >= 0:
                total += seen.get(need, 0)
        seen[x] = seen.get(x, 0) + 1
    return total


def gen(rng):
    return [[rng.randint(0, 20) for _ in range(rng.randint(0, 10))]]
