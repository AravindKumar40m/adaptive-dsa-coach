APPROACHES = {"brute": ("O(length)", "O(1)"), "better": ("O(log length)", "O(1)"), "optimal": ("O(log length)", "O(log length)")}


def BRUTE_OK(args):
    return args[0] <= 100000


def brute(length):
    result = 1
    for i in range(length):
        result = result * (5 if i % 2 == 0 else 4) % 1000000007
    return result


def better(length):
    return pow(5, (length + 1) // 2, 1000000007) * pow(4, length // 2, 1000000007) % 1000000007


def optimal(length):
    MOD = 1000000007

    def power(base, exponent):
        if exponent == 0:
            return 1
        half = power(base, exponent // 2)
        result = half * half % MOD
        return result * base % MOD if exponent % 2 else result

    return power(5, (length + 1) // 2) * power(4, length // 2) % MOD


def gen(rng):
    return [rng.randint(1, 80)]
