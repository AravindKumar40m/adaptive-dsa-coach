APPROACHES = {"brute": ("O(10^n * n)", "O(1)"), "better": ("O(n^2)", "O(n)"), "optimal": ("O(n^2)", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 5


def brute(n):
    count = 0
    for x in range(10 ** n):
        s = str(x)
        if len(set(s)) == len(s):
            count += 1
    return count


def better(n):
    def arrangements(positions, digits):
        if positions == 0:
            return 1
        return digits * arrangements(positions - 1, digits - 1)

    total = 1
    for length in range(1, n + 1):
        total += 9 * arrangements(length - 1, 9)
    return total


def optimal(n):
    total = 1
    for length in range(1, n + 1):
        ways = 9
        available = 9
        for _ in range(length - 1):
            ways *= available
            available -= 1
        total += ways
    return total


def gen(rng):
    return [rng.randint(0, 5)]
