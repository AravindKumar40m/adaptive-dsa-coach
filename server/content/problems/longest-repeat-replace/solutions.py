APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(text, k):
    best = 0
    for i in range(len(text)):
        counts = {}
        for j in range(i, len(text)):
            counts[text[j]] = counts.get(text[j], 0) + 1
            if (j - i + 1) - max(counts.values()) <= k:
                best = max(best, j - i + 1)
    return best


def optimal(text, k):
    count = [0] * 26
    left = max_freq = best = 0
    for right, ch in enumerate(text):
        idx = ord(ch) - 97
        count[idx] += 1
        max_freq = max(max_freq, count[idx])
        while (right - left + 1) - max_freq > k:
            count[ord(text[left]) - 97] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best


def gen(rng):
    n = rng.randint(1, 12)
    return ["".join(rng.choice("abc") for _ in range(n)), rng.randint(0, 4)]
