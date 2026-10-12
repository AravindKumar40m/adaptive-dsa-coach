APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(1)")}


def brute(text):
    n = len(text)
    count = 0
    for i in range(n):
        for j in range(i + 1, n + 1):
            piece = text[i:j]
            if piece == piece[::-1]:
                count += 1
    return count


def optimal(text):
    n = len(text)
    count = 0
    for center in range(2 * n - 1):
        left = center // 2
        right = left + center % 2
        while left >= 0 and right < n and text[left] == text[right]:
            count += 1
            left -= 1
            right += 1
    return count


def gen(rng):
    return ["".join(rng.choice("ab") for _ in range(rng.randint(1, 10)))]
