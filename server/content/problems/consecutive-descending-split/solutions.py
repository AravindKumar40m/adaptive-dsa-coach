APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(n^2)", "O(n)")}


def brute(digits):
    n = len(digits)
    for mask in range(1, 1 << (n - 1)):
        pieces = []
        start = 0
        for i in range(n - 1):
            if (mask >> i) & 1:
                pieces.append(int(digits[start:i + 1]))
                start = i + 1
        pieces.append(int(digits[start:]))
        if all(pieces[i] - 1 == pieces[i + 1] for i in range(len(pieces) - 1)):
            return True
    return False


def optimal(digits):
    n = len(digits)

    def go(start, previous):
        if start == n:
            return True
        for end in range(start + 1, n + 1):
            v = int(digits[start:end])
            if v == previous - 1 and go(end, v):
                return True
            if v > previous - 1:
                break
        return False

    for end in range(1, n):
        if go(end, int(digits[:end])):
            return True
    return False


def gen(rng):
    if rng.random() < 0.5:
        start = rng.randint(2, 30)
        text = ""
        for k in range(rng.randint(2, 4)):
            if start - k < 0:
                break
            text += rng.choice(["", "0"]) + str(start - k)
        if len(text) > 1:
            if rng.random() < 0.3:
                pos = rng.randrange(len(text))
                text = text[:pos] + rng.choice("0123456789") + text[pos + 1:]
            return [text]
    return ["".join(rng.choice("0123456789") for _ in range(rng.randint(1, 8)))]
