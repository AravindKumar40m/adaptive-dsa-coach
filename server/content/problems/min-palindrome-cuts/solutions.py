APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "better": ("O(n^3)", "O(n)"), "optimal": ("O(n^2)", "O(n)")}


def BRUTE_OK(args):
    return len(args[0]) <= 12


def brute(text):
    n = len(text)
    best = n - 1
    for mask in range(1 << (n - 1)):
        start = 0
        ok = True
        for i in range(n):
            if i == n - 1 or (mask >> i) & 1:
                piece = text[start:i + 1]
                if piece != piece[::-1]:
                    ok = False
                    break
                start = i + 1
        if ok:
            best = min(best, bin(mask).count("1"))
    return best


def better(text):
    n = len(text)
    memo = {}

    def go(i):
        if i == n:
            return -1
        if i in memo:
            return memo[i]
        best = n
        for j in range(i, n):
            piece = text[i:j + 1]
            if piece == piece[::-1]:
                best = min(best, go(j + 1) + 1)
        memo[i] = best
        return best

    return go(0)


def optimal(text):
    n = len(text)
    cuts = [i - 1 for i in range(n + 1)]
    for center in range(n):
        for left, right in ((center, center), (center, center + 1)):
            while left >= 0 and right < n and text[left] == text[right]:
                cuts[right + 1] = min(cuts[right + 1], cuts[left] + 1)
                left -= 1
                right += 1
    return cuts[n]


def gen(rng):
    alphabet = rng.choice(["ab", "abc", "abcd"])
    return ["".join(rng.choice(alphabet) for _ in range(rng.randint(1, 11)))]
