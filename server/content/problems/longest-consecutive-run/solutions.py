APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(nums):
    best = 0
    for x in nums:
        length = 1
        while (x + length) in nums:
            length += 1
        best = max(best, length)
    return best


def optimal(nums):
    values = set(nums)
    best = 0
    for x in values:
        if x - 1 not in values:
            length = 1
            while x + length in values:
                length += 1
            best = max(best, length)
    return best


def gen(rng):
    return [[rng.randint(0, 14) for _ in range(rng.randint(1, 10))]]
