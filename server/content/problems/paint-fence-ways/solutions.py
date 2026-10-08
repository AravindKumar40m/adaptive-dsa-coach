APPROACHES = {"brute": ("O(colors^posts * posts)", "O(posts)"), "better": ("O(posts)", "O(posts)"), "optimal": ("O(posts)", "O(1)")}
EXPECT_SLOW = {"brute"}  # trying every painting is exponential on purpose


def BRUTE_OK(args):
    return args[0] <= 7 and args[1] <= 4


def brute(posts, colors):
    from itertools import product

    count = 0
    for paint in product(range(colors), repeat=posts):
        if all(not (paint[i] == paint[i + 1] == paint[i + 2]) for i in range(posts - 2)):
            count += 1
    return count


def better(posts, colors):
    memo = {}

    def go(remaining, run):  # run = how many equal posts end the fence so far (1 or 2)
        if remaining == 0:
            return 1
        if (remaining, run) not in memo:
            total = go(remaining - 1, 1) * (colors - 1)  # a different color
            if run == 1:
                total += go(remaining - 1, 2)  # the same color again
            memo[(remaining, run)] = total
        return memo[(remaining, run)]

    return colors * go(posts - 1, 1)


def optimal(posts, colors):
    if posts == 1:
        return colors
    same, diff = colors, colors * (colors - 1)
    for _ in range(posts - 2):
        same, diff = diff, (same + diff) * (colors - 1)
    return same + diff


def gen(rng):
    return [rng.randint(1, 10), rng.randint(1, 6)]
