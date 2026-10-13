APPROACHES = {"brute": ("O(n * m log m)", "O(m)"), "optimal": ("O(n)", "O(1)")}


def brute(text, pattern):
    m = len(pattern)
    target = sorted(pattern)
    return sum(1 for i in range(len(text) - m + 1) if sorted(text[i:i + m]) == target)


def optimal(text, pattern):
    m = len(pattern)
    if len(text) < m:
        return 0
    need = [0] * 26
    have = [0] * 26
    for ch in pattern:
        need[ord(ch) - 97] += 1
    for ch in text[:m]:
        have[ord(ch) - 97] += 1
    result = 1 if have == need else 0
    for i in range(m, len(text)):
        have[ord(text[i]) - 97] += 1
        have[ord(text[i - m]) - 97] -= 1
        if have == need:
            result += 1
    return result


def gen(rng):
    return ["".join(rng.choice("abc") for _ in range(rng.randint(0, 10))), "".join(rng.choice("abc") for _ in range(rng.randint(1, 3)))]
