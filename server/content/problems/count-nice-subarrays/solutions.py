APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers, k):
    n = len(numbers)
    total = 0
    for i in range(n):
        odd = 0
        for j in range(i, n):
            odd += numbers[j] % 2
            if odd == k:
                total += 1
            elif odd > k:
                break
    return total


def optimal(numbers, k):
    seen = [0] * (len(numbers) + 2)
    seen[0] = 1
    odd = 0
    total = 0
    for x in numbers:
        odd += x % 2
        if odd - k >= 0:
            total += seen[odd - k]
        seen[odd] += 1
    return total


def gen(rng):
    return [[rng.randint(1, 9) for _ in range(rng.randint(0, 11))], rng.randint(1, 4)]
