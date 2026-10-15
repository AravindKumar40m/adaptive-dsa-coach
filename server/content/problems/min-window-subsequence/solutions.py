APPROACHES = {"brute": ("O(n^2 * m)", "O(1)"), "optimal": ("O(n * m)", "O(1)")}


def brute(s, t):
    if not t:
        return 0
    best = 0
    n = len(s)
    for i in range(n):
        j = 0
        for k in range(i, n):
            if s[k] == t[j]:
                j += 1
                if j == len(t):
                    length = k - i + 1
                    if best == 0 or length < best:
                        best = length
                    break
    return best


def optimal(s, t):
    if not t:
        return 0
    n, m = len(s), len(t)
    best = 0
    i = 0
    while i < n:
        j = 0
        k = i
        while k < n and j < m:
            if s[k] == t[j]:
                j += 1
            k += 1
        if j < m:
            break
        end = k - 1
        j = m - 1
        k = end
        while j >= 0:
            if s[k] == t[j]:
                j -= 1
            k -= 1
        start = k + 1
        length = end - start + 1
        if best == 0 or length < best:
            best = length
        i = start + 1
    return best


def gen(rng):
    return ["".join(rng.choice("abc") for _ in range(rng.randint(0, 12))), "".join(rng.choice("abc") for _ in range(rng.randint(0, 3)))]
