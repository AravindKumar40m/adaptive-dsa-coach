APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(numbers):
    return sorted(numbers, key=lambda x: (bin(x).count("1"), x))


def optimal(numbers):
    def bits(x):
        count = 0
        while x > 0:
            x &= x - 1
            count += 1
        return count

    keyed = sorted((bits(x), x) for x in numbers)
    return [x for _, x in keyed]


def gen(rng):
    return [[rng.randint(0, 40) for _ in range(rng.randint(0, 10))]]
