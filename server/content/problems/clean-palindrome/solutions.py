APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    cleaned = [c.lower() for c in text if c.isalnum()]
    return cleaned == cleaned[::-1]


def optimal(text):
    i, j = 0, len(text) - 1
    while i < j:
        if not text[i].isalnum():
            i += 1
        elif not text[j].isalnum():
            j -= 1
        elif text[i].lower() != text[j].lower():
            return False
        else:
            i += 1
            j -= 1
    return True


def gen(rng):
    if rng.random() < 0.5:
        half = "".join(rng.choice("abcAB12") for _ in range(rng.randint(1, 8)))
        mid = rng.choice(["", "x", " ", "7"])
        noisy = lambda t: "".join(c + rng.choice([" ", ",", ""]) for c in t)
        return [noisy(half) + mid + noisy(half[::-1].swapcase())]
    alphabet = "abcAB12 ,.:!-"
    return ["".join(rng.choice(alphabet) for _ in range(rng.randint(1, 20)))]
