APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    for length in range(len(text), 0, -1):
        prefix = text[:length]
        if prefix == prefix[::-1]:
            return len(text) - length
    return len(text)


def optimal(text):
    s = text + "#" + text[::-1]
    fail = [0] * len(s)
    for i in range(1, len(s)):
        k = fail[i - 1]
        while k > 0 and s[i] != s[k]:
            k = fail[k - 1]
        if s[i] == s[k]:
            k += 1
        fail[i] = k
    return len(text) - fail[-1]


def gen(rng):
    return ["".join(rng.choice("ab") for _ in range(rng.randint(1, 10)))]
