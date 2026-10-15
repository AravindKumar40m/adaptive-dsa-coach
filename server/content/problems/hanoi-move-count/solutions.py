APPROACHES = {"brute": ("O(2^n)", "O(n)"), "better": ("O(n)", "O(1)"), "optimal": ("O(1)", "O(1)")}


def BRUTE_OK(args):
    return args[0] <= 16


def brute(n):
    def move(count):
        if count == 0:
            return 0
        return move(count - 1) + 1 + move(count - 1)

    return move(n)


def better(n):
    moves = 0
    for _ in range(n):
        moves = 2 * moves + 1
    return moves


def optimal(n):
    return (1 << n) - 1


def gen(rng):
    return [rng.randint(0, 14)]
