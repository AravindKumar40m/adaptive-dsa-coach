APPROACHES = {"brute": ("O(n * m)", "O(1)"), "optimal": ("O(n + m)", "O(m)")}


def brute(text, pattern):
    m = len(pattern)
    return sum(1 for i in range(len(text) - m + 1) if text[i:i + m] == pattern)


def optimal(text, pattern):
    m = len(pattern)
    fail = [0] * m
    k = 0
    for i in range(1, m):
        while k and pattern[i] != pattern[k]:
            k = fail[k - 1]
        if pattern[i] == pattern[k]:
            k += 1
        fail[i] = k
    count = 0
    k = 0
    for ch in text:
        while k and ch != pattern[k]:
            k = fail[k - 1]
        if ch == pattern[k]:
            k += 1
        if k == m:
            count += 1
            k = fail[k - 1]
    return count


def gen(rng):
    text = "".join(rng.choice("ab") for _ in range(rng.randint(0, 14)))
    if text and rng.random() < 0.6:
        i = rng.randrange(len(text))
        pattern = text[i:i + rng.randint(1, 4)]
    else:
        pattern = "".join(rng.choice("ab") for _ in range(rng.randint(1, 4)))
    return [text, pattern]
