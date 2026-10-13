APPROACHES = {"brute": ("O(2^n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    def total(i, current):
        if i == len(numbers):
            return current
        return total(i + 1, current) + total(i + 1, current ^ numbers[i])

    return total(0, 0)


def optimal(numbers):
    if not numbers:
        return 0
    combined = 0
    for x in numbers:
        combined |= x
    return combined * 2 ** (len(numbers) - 1)


def gen(rng):
    return [[rng.randint(0, 15) for _ in range(rng.randint(0, 8))]]
