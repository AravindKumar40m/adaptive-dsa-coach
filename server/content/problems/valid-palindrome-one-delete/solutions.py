APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    if text == text[::-1]:
        return True
    for i in range(len(text)):
        cut = text[:i] + text[i + 1:]
        if cut == cut[::-1]:
            return True
    return False


def optimal(text):
    def pal(l, r):
        while l < r:
            if text[l] != text[r]:
                return False
            l += 1
            r -= 1
        return True

    l, r = 0, len(text) - 1
    while l < r:
        if text[l] != text[r]:
            return pal(l + 1, r) or pal(l, r - 1)
        l += 1
        r -= 1
    return True


def gen(rng):
    n = rng.randint(1, 5)
    half = "".join(rng.choice("abc") for _ in range(n))
    text = half + half[::-1][rng.randint(0, 1):]
    if rng.random() < 0.5:
        i = rng.randint(0, len(text))
        text = text[:i] + rng.choice("abc") + text[i:]
    for _ in range(rng.choice([0, 0, 1, 2, 3])):  # more changes make "false" likely
        i = rng.randrange(len(text))
        text = text[:i] + rng.choice("abc") + text[i + 1:]
    return [text]
