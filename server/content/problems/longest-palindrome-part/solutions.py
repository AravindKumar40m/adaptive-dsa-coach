APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(1)")}


def brute(text):
    best = 0
    for i in range(len(text)):
        for j in range(i, len(text)):
            part = text[i:j + 1]
            if part == part[::-1]:
                best = max(best, len(part))
    return best


def optimal(text):
    n = len(text)
    best = 1
    for centre in range(2 * n - 1):
        lo = centre // 2
        hi = lo + centre % 2
        while lo >= 0 and hi < n and text[lo] == text[hi]:
            best = max(best, hi - lo + 1)
            lo -= 1
            hi += 1
    return best


def gen(rng):
    return ["".join(rng.choice("ab") for _ in range(rng.randint(1, 10)))]
