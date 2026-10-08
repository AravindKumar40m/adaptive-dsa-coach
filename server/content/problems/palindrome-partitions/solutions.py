APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(n^3)", "O(n)")}


def brute(text):
    def go(start):
        if start == len(text):
            return 1
        total = 0
        for end in range(start + 1, len(text) + 1):
            piece = text[start:end]
            if piece == piece[::-1]:
                total += go(end)
        return total

    return go(0)


def optimal(text):
    n = len(text)
    ways = [1] + [0] * n
    for end in range(1, n + 1):
        for start in range(end):
            piece = text[start:end]
            if piece == piece[::-1]:
                ways[end] += ways[start]
    return ways[n]


def gen(rng):
    return ["".join(rng.choice("ab") for _ in range(rng.randint(1, 10)))]
