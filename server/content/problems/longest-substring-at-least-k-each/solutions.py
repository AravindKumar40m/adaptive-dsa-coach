APPROACHES = {"brute": ("O(26 * n^2)", "O(1)"), "optimal": ("O(26 * n)", "O(1)")}


def brute(text, k):
    best = 0
    n = len(text)
    for i in range(n):
        freq = [0] * 26
        for j in range(i, n):
            freq[ord(text[j]) - 97] += 1
            if all(c == 0 or c >= k for c in freq):
                best = max(best, j - i + 1)
    return best


def optimal(text, k):
    best = 0
    for target in range(1, 27):
        freq = [0] * 26
        left = 0
        unique = 0
        enough = 0
        for right, ch in enumerate(text):
            c = ord(ch) - 97
            if freq[c] == 0:
                unique += 1
            freq[c] += 1
            if freq[c] == k:
                enough += 1
            while unique > target:
                d = ord(text[left]) - 97
                if freq[d] == k:
                    enough -= 1
                freq[d] -= 1
                if freq[d] == 0:
                    unique -= 1
                left += 1
            if unique == target and enough == target:
                best = max(best, right - left + 1)
    return best


def gen(rng):
    return ["".join(rng.choice("abcd"[:rng.randint(2, 4)]) for _ in range(rng.randint(0, 14))), rng.randint(1, 3)]
