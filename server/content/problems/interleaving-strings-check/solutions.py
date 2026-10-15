APPROACHES = {"brute": ("O(2^(a+b))", "O(a+b)"), "optimal": ("O(a * b)", "O(b)")}


def BRUTE_OK(args):
    return len(args[2]) <= 14


def brute(a, b, c):
    if len(a) + len(b) != len(c):
        return False

    def go(i, j):
        if i == len(a) and j == len(b):
            return True
        k = i + j
        if i < len(a) and a[i] == c[k] and go(i + 1, j):
            return True
        if j < len(b) and b[j] == c[k] and go(i, j + 1):
            return True
        return False

    return go(0, 0)


def optimal(a, b, c):
    if len(a) + len(b) != len(c):
        return False
    m, n = len(a), len(b)
    row = [False] * (n + 1)
    row[0] = True
    for j in range(1, n + 1):
        row[j] = row[j - 1] and b[j - 1] == c[j - 1]
    for i in range(1, m + 1):
        row[0] = row[0] and a[i - 1] == c[i - 1]
        for j in range(1, n + 1):
            row[j] = (row[j] and a[i - 1] == c[i + j - 1]) or (row[j - 1] and b[j - 1] == c[i + j - 1])
    return row[n]


def gen(rng):
    a = "".join(rng.choice("ab") for _ in range(rng.randint(0, 5)))
    b = "".join(rng.choice("ab") for _ in range(rng.randint(0, 5)))
    if rng.random() < 0.55:
        i = j = 0
        c = ""
        while i < len(a) or j < len(b):
            if j >= len(b) or (i < len(a) and rng.random() < 0.5):
                c += a[i]
                i += 1
            else:
                c += b[j]
                j += 1
        if rng.random() < 0.3 and c:
            pos = rng.randrange(len(c))
            c = c[:pos] + rng.choice("ab") + c[pos + 1:]
        return [a, b, c]
    return [a, b, "".join(rng.choice("ab") for _ in range(len(a) + len(b)))]
