APPROACHES = {"brute": ("O(n! * n)", "O(n)"), "optimal": ("O(n log n * L)", "O(n * L)")}
EXPECT_SLOW = {"brute"}  # trying every order is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 6


def brute(nums):
    from itertools import permutations

    best = max("".join(str(x) for x in p) for p in permutations(nums))
    return str(int(best))


def optimal(nums):
    from functools import cmp_to_key

    words = [str(x) for x in nums]
    words.sort(key=cmp_to_key(lambda a, b: -1 if a + b > b + a else (1 if a + b < b + a else 0)))
    result = "".join(words)
    return "0" if result[0] == "0" else result


def gen(rng):
    return [[rng.choice([rng.randint(0, 12), rng.randint(0, 130)]) for _ in range(rng.randint(1, 5))]]
