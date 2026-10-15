APPROACHES = {"brute": ("O(5^(n/2) * n)", "O(5^(n/2) * n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 10


def brute(n):
    def build(length, top):
        if length == 0:
            return [""]
        if length == 1:
            return ["0", "1", "8"]
        inner = build(length - 2, False)
        pairs = [("1", "1"), ("6", "9"), ("8", "8"), ("9", "6")] + ([] if top else [("0", "0")])
        return [a + middle + b for a, b in pairs for middle in inner]

    return len(build(n, True))


def better(n):
    def count(length, top):
        if length == 0:
            return 1
        if length == 1:
            return 3
        return (4 if top else 5) * count(length - 2, False)

    return count(n, True)


def optimal(n):
    if n == 1:
        return 3
    pairs = n // 2
    result = 3 if n % 2 else 1
    for i in range(pairs):
        result *= 4 if i == 0 else 5
    return result


def gen(rng):
    return [rng.randint(1, 14)]
