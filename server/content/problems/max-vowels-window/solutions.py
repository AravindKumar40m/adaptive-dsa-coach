APPROACHES = {"brute": ("O(n * k)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(text, k):
    return max(sum(1 for ch in text[i:i + k] if ch in "aeiou") for i in range(len(text) - k + 1))


def optimal(text, k):
    vowels = "aeiou"
    count = sum(1 for ch in text[:k] if ch in vowels)
    best = count
    for i in range(k, len(text)):
        if text[i] in vowels:
            count += 1
        if text[i - k] in vowels:
            count -= 1
        best = max(best, count)
    return best


def gen(rng):
    n = rng.randint(1, 12)
    return ["".join(rng.choice("abcde") for _ in range(n)), rng.randint(1, n)]
