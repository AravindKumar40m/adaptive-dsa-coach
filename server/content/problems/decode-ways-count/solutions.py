APPROACHES = {"brute": ("O(2^n)", "O(n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def BRUTE_OK(args):
    return len(args[0]) <= 18


def brute(digits):
    n = len(digits)

    def ways(i):
        if i == n:
            return 1
        if digits[i] == "0":
            return 0
        total = ways(i + 1)
        if i + 1 < n and 10 <= int(digits[i:i + 2]) <= 26:
            total += ways(i + 2)
        return total

    return ways(0)


def better(digits):
    n = len(digits)
    memo = {}

    def ways(i):
        if i == n:
            return 1
        if digits[i] == "0":
            return 0
        if i in memo:
            return memo[i]
        total = ways(i + 1)
        if i + 1 < n and 10 <= int(digits[i:i + 2]) <= 26:
            total += ways(i + 2)
        memo[i] = total
        return total

    return ways(0)


def optimal(digits):
    previous2, previous1 = 1, 1
    if digits[0] == "0":
        return 0
    for i in range(1, len(digits)):
        current = 0
        if digits[i] != "0":
            current += previous1
        if 10 <= int(digits[i - 1:i + 1]) <= 26:
            current += previous2
        previous2, previous1 = previous1, current
    return previous1


def gen(rng):
    alphabet = rng.choice(["0112", "12", "1236", "0123456789"])
    return ["".join(rng.choice(alphabet) for _ in range(rng.randint(1, 12)))]
