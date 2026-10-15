APPROACHES = {"brute": ("O(d^2)", "O(d)"), "optimal": ("O(10 * d)", "O(1)")}


def brute(num):
    s = str(num)
    best = num
    for i in range(len(s)):
        for j in range(i + 1, len(s)):
            t = list(s)
            t[i], t[j] = t[j], t[i]
            best = max(best, int("".join(t)))
    return best


def optimal(num):
    digits = list(str(num))
    last = {int(c): i for i, c in enumerate(digits)}
    for i, c in enumerate(digits):
        for d in range(9, int(c), -1):
            if last.get(d, -1) > i:
                digits[i], digits[last[d]] = digits[last[d]], digits[i]
                return int("".join(digits))
    return num


def gen(rng):
    return [rng.choice([rng.randint(0, 99), rng.randint(0, 99999), rng.randint(0, 99999999)])]
