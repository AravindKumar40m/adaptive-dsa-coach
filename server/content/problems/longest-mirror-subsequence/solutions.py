APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(n^2)", "O(n^2)")}


def brute(text):
    n = len(text)
    best = 0
    for mask in range(1, 1 << n):
        s = [text[i] for i in range(n) if mask >> i & 1]
        if len(s) > best and s == s[::-1]:
            best = len(s)
    return best


def optimal(text):
    n = len(text)
    dp = [[0] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        dp[i][i] = 1
        for j in range(i + 1, n):
            if text[i] == text[j]:
                dp[i][j] = dp[i + 1][j - 1] + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1]


def gen(rng):
    return ["".join(rng.choice("abc") for _ in range(rng.randint(1, 10)))]
