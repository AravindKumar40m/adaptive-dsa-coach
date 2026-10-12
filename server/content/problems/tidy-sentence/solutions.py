APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    return " ".join(reversed(text.split()))


def optimal(text):
    words = []
    i = len(text) - 1
    while i >= 0:
        while i >= 0 and text[i] == " ":
            i -= 1
        if i < 0:
            break
        j = i
        while i >= 0 and text[i] != " ":
            i -= 1
        words.append(text[i + 1:j + 1])
    return " ".join(words)


def gen(rng):
    return ["".join(rng.choice(["a", "b", "c", " ", " "]) for _ in range(rng.randint(0, 14)))]
