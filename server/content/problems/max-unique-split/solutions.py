APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(2^n) pruned", "O(n)")}


def brute(text):
    n = len(text)
    if n == 0:
        return 0
    best = 1
    for mask in range(1 << (n - 1)):
        pieces = []
        start = 0
        for i in range(n - 1):
            if (mask >> i) & 1:
                pieces.append(text[start:i + 1])
                start = i + 1
        pieces.append(text[start:])
        if len(set(pieces)) == len(pieces):
            best = max(best, len(pieces))
    return best


def optimal(text):
    n = len(text)
    best = [0]
    used = set()

    def go(start, count):
        if count + (n - start) <= best[0]:
            return
        if start == n:
            best[0] = max(best[0], count)
            return
        for end in range(start + 1, n + 1):
            piece = text[start:end]
            if piece not in used:
                used.add(piece)
                go(end, count + 1)
                used.remove(piece)

    go(0, 0)
    return best[0]


def gen(rng):
    return ["".join(rng.choice("abc"[:rng.randint(1, 3)]) for _ in range(rng.randint(0, 11)))]
