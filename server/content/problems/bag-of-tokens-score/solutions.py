APPROACHES = {"brute": ("O(3^n)", "O(n)"), "optimal": ("O(n log n)", "O(1)")}


def BRUTE_OK(args):
    return len(args[0]) <= 8


def brute(tokens, power):
    n = len(tokens)

    def go(mask, power, score):
        best = score
        for i in range(n):
            if mask >> i & 1:
                continue
            if power >= tokens[i]:
                best = max(best, go(mask | 1 << i, power - tokens[i], score + 1))
            if score >= 1:
                best = max(best, go(mask | 1 << i, power + tokens[i], score - 1))
        return best

    return go(0, power, 0)


def optimal(tokens, power):
    a = sorted(tokens)
    lo, hi = 0, len(a) - 1
    score = best = 0
    while lo <= hi:
        if power >= a[lo]:
            power -= a[lo]
            lo += 1
            score += 1
            best = max(best, score)
        elif score > 0:
            power += a[hi]
            hi -= 1
            score -= 1
        else:
            break
    return best


def gen(rng):
    return [[rng.randint(1, 12) for _ in range(rng.randint(0, 7))], rng.randint(0, 15)]
