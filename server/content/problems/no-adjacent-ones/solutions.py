APPROACHES = {"brute": ("O(2^n * n)", "O(1)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # checking every string is exponential on purpose


def BRUTE_OK(args):
    return args[0] <= 20


def brute(n):
    count = 0
    for mask in range(1 << n):
        if mask & (mask >> 1) == 0:  # no two neighbouring 1 bits
            count += 1
    return count


def better(n):
    memo = {}

    def go(remaining, last_is_one):
        if remaining == 0:
            return 1
        key = (remaining, last_is_one)
        if key not in memo:
            total = go(remaining - 1, False)
            if not last_is_one:
                total += go(remaining - 1, True)
            memo[key] = total
        return memo[key]

    return go(n, False)


def optimal(n):
    ends_zero, ends_one = 1, 1
    for _ in range(n - 1):
        ends_zero, ends_one = ends_zero + ends_one, ends_zero
    return ends_zero + ends_one


def gen(rng):
    return [rng.randint(1, 30)]
