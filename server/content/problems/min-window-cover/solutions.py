APPROACHES = {"brute": ("O(n^2 * m)", "O(1)"), "optimal": ("O(n + m)", "O(1)")}


def brute(text, need):
    from collections import Counter

    need_count = Counter(need)
    best = 0
    for i in range(len(text)):
        for j in range(i, len(text)):
            window = Counter(text[i:j + 1])
            if all(window[c] >= k for c, k in need_count.items()):
                if best == 0 or j - i + 1 < best:
                    best = j - i + 1
                break
    return best


def optimal(text, need):
    count = [0] * 26
    for ch in need:
        count[ord(ch) - 97] += 1
    missing = len(need)
    left = 0
    best = 0
    for right, ch in enumerate(text):
        idx = ord(ch) - 97
        if count[idx] > 0:
            missing -= 1
        count[idx] -= 1
        while missing == 0:
            if best == 0 or right - left + 1 < best:
                best = right - left + 1
            lidx = ord(text[left]) - 97
            count[lidx] += 1
            if count[lidx] > 0:
                missing += 1
            left += 1
    return best


def gen(rng):
    return ["".join(rng.choice("abc") for _ in range(rng.randint(1, 10))), "".join(rng.choice("abc") for _ in range(rng.randint(1, 3)))]
