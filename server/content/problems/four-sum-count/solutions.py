APPROACHES = {"brute": ("O(n^4)", "O(1)"), "optimal": ("O(n^2)", "O(n^2)")}


def brute(first, second, third, fourth):
    count = 0
    for a in first:
        for b in second:
            for c in third:
                for d in fourth:
                    if a + b + c + d == 0:
                        count += 1
    return count


def optimal(first, second, third, fourth):
    sums = {}
    for a in first:
        for b in second:
            sums[a + b] = sums.get(a + b, 0) + 1
    total = 0
    for c in third:
        for d in fourth:
            total += sums.get(-(c + d), 0)
    return total


def gen(rng):
    n = rng.randint(1, 4)
    return [[rng.randint(-3, 3) for _ in range(n)] for _ in range(4)]
