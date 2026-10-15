APPROACHES = {"brute": ("O(1.84^n)", "O(n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 22


def brute(n):
    if n == 0:
        return 0
    if n <= 2:
        return 1
    return brute(n - 1) + brute(n - 2) + brute(n - 3)


def better(n):
    table = [0, 1, 1]
    for i in range(3, n + 1):
        table.append(table[i - 1] + table[i - 2] + table[i - 3])
    return table[n]


def optimal(n):
    if n == 0:
        return 0
    a, b, c = 0, 1, 1
    for _ in range(3, n + 1):
        a, b, c = b, c, a + b + c
    return c


def gen(rng):
    return [rng.randint(0, 20)]
