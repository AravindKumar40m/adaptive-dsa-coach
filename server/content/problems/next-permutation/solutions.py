APPROACHES = {"brute": ("O(n! * n)", "O(n!)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # listing every arrangement is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 7


def brute(nums):
    from itertools import permutations

    arrangements = sorted(set(permutations(nums)))
    index = arrangements.index(tuple(nums))
    return list(arrangements[(index + 1) % len(arrangements)])


def optimal(nums):
    a = list(nums)
    n = len(a)
    i = n - 2
    while i >= 0 and a[i] >= a[i + 1]:
        i -= 1
    if i >= 0:
        j = n - 1
        while a[j] <= a[i]:
            j -= 1
        a[i], a[j] = a[j], a[i]
    a[i + 1:] = reversed(a[i + 1:])
    return a


def gen(rng):
    return [[rng.randint(1, 4) for _ in range(rng.randint(1, 6))]]
