APPROACHES = {"brute": ("O(2^(n+m))", "O(n + m)"), "better": ("O(n * m)", "O(n * m)"), "optimal": ("O(n * m)", "O(m)")}


def BRUTE_OK(args):
    return len(args[0]) + len(args[1]) <= 14


def brute(s1, s2):
    def cost(i, j):
        if i == len(s1):
            return sum(ord(c) for c in s2[j:])
        if j == len(s2):
            return sum(ord(c) for c in s1[i:])
        if s1[i] == s2[j]:
            return cost(i + 1, j + 1)
        return min(ord(s1[i]) + cost(i + 1, j), ord(s2[j]) + cost(i, j + 1))

    return cost(0, 0)


def better(s1, s2):
    n, m = len(s1), len(s2)
    table = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        table[i][m] = table[i + 1][m] + ord(s1[i])
    for j in range(m - 1, -1, -1):
        table[n][j] = table[n][j + 1] + ord(s2[j])
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            if s1[i] == s2[j]:
                table[i][j] = table[i + 1][j + 1]
            else:
                table[i][j] = min(ord(s1[i]) + table[i + 1][j], ord(s2[j]) + table[i][j + 1])
    return table[0][0]


def optimal(s1, s2):
    n, m = len(s1), len(s2)
    keep = [0] * (m + 1)
    for i in range(1, n + 1):
        previous_diagonal = 0
        for j in range(1, m + 1):
            saved = keep[j]
            if s1[i - 1] == s2[j - 1]:
                keep[j] = previous_diagonal + ord(s1[i - 1])
            else:
                keep[j] = max(keep[j], keep[j - 1])
            previous_diagonal = saved
    return sum(ord(c) for c in s1) + sum(ord(c) for c in s2) - 2 * keep[m]


def gen(rng):
    return ["".join(rng.choice("abcd") for _ in range(rng.randint(0, 7))), "".join(rng.choice("abcd") for _ in range(rng.randint(0, 7)))]
