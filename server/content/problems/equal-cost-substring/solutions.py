APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(s, t, max_cost):
    n = len(s)
    best = 0
    for i in range(n):
        total = 0
        for j in range(i, n):
            total += abs(ord(s[j]) - ord(t[j]))
            if total > max_cost:
                break
            best = max(best, j - i + 1)
    return best


def optimal(s, t, max_cost):
    left = 0
    total = 0
    best = 0
    for right in range(len(s)):
        total += abs(ord(s[right]) - ord(t[right]))
        while total > max_cost:
            total -= abs(ord(s[left]) - ord(t[left]))
            left += 1
        best = max(best, right - left + 1)
    return best


def gen(rng):
    n = rng.randint(0, 9)
    return ["".join(rng.choice("abcdef") for _ in range(n)), "".join(rng.choice("abcdef") for _ in range(n)), rng.randint(0, 9)]
