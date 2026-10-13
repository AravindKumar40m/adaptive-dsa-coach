APPROACHES = {"brute": ("O(number * d)", "O(1)"), "better": ("O(d^2)", "O(d)"), "optimal": ("O(d)", "O(d)")}


def BRUTE_OK(args):
    return args[0] <= 200000


def brute(number):
    x = number
    while x > 0:
        s = str(x)
        if all(s[i] <= s[i + 1] for i in range(len(s) - 1)):
            return x
        x -= 1
    return 0


def better(number):
    s = str(number)

    def rising(t):
        return all(t[i] <= t[i + 1] for i in range(len(t) - 1))

    if rising(s):
        return number
    best = 0
    for i in range(len(s)):
        if s[i] == "0":
            continue
        candidate = s[:i] + str(int(s[i]) - 1) + "9" * (len(s) - i - 1)
        if rising(candidate):
            best = max(best, int(candidate))
    return best


def optimal(number):
    digits = [int(c) for c in str(number)]
    mark = len(digits)
    for i in range(len(digits) - 1, 0, -1):
        if digits[i - 1] > digits[i]:
            digits[i - 1] -= 1
            mark = i
    for i in range(mark, len(digits)):
        digits[i] = 9
    return int("".join(str(d) for d in digits))


def gen(rng):
    return [rng.randint(0, 10 ** rng.choice([2, 3, 4, 5]))]
