APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    best = 0
    for i in range(len(text)):
        seen = set()
        for j in range(i, len(text)):
            if text[j] in seen:
                break
            seen.add(text[j])
        best = max(best, len(seen))
    return best


def optimal(text):
    last = {}
    start = best = 0
    for i, ch in enumerate(text):
        if last.get(ch, -1) >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best


def gen(rng):
    return ["".join(rng.choice("abcde") for _ in range(rng.randint(1, 12)))]
