APPROACHES = {"brute": ("O(2^(n+m))", "O(n + m)"), "better": ("O(n * m)", "O(n * m)"), "optimal": ("O(n * m)", "O(n * m)")}


def BRUTE_OK(args):
    return len(args[0]) + len(args[1]) <= 14


def brute(text, pattern):
    def match(i, j):
        if j == len(pattern):
            return i == len(text)
        first = i < len(text) and (pattern[j] == text[i] or pattern[j] == ".")
        if j + 1 < len(pattern) and pattern[j + 1] == "*":
            return match(i, j + 2) or (first and match(i + 1, j))
        return first and match(i + 1, j + 1)

    return match(0, 0)


def better(text, pattern):
    memo = {}

    def match(i, j):
        if (i, j) in memo:
            return memo[(i, j)]
        if j == len(pattern):
            result = i == len(text)
        else:
            first = i < len(text) and (pattern[j] == text[i] or pattern[j] == ".")
            if j + 1 < len(pattern) and pattern[j + 1] == "*":
                result = match(i, j + 2) or (first and match(i + 1, j))
            else:
                result = first and match(i + 1, j + 1)
        memo[(i, j)] = result
        return result

    return match(0, 0)


def optimal(text, pattern):
    n, m = len(text), len(pattern)
    table = [[False] * (m + 1) for _ in range(n + 1)]
    table[0][0] = True
    for j in range(1, m + 1):
        if pattern[j - 1] == "*":
            table[0][j] = table[0][j - 2]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if pattern[j - 1] == "*":
                table[i][j] = table[i][j - 2] or ((pattern[j - 2] == "." or pattern[j - 2] == text[i - 1]) and table[i - 1][j])
            else:
                table[i][j] = (pattern[j - 1] == "." or pattern[j - 1] == text[i - 1]) and table[i - 1][j - 1]
    return table[n][m]


def gen(rng):
    tokens = []
    for _ in range(rng.randint(0, 4)):
        tokens.append(rng.choice("ab.") + rng.choice(["", "", "*"]))
    pattern = "".join(tokens)
    text = "".join(rng.choice("ab") for _ in range(rng.randint(0, 6)))
    return [text, pattern]
