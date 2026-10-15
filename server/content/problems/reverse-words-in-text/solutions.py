APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    words = []
    current = ""
    for ch in text:
        if ch == " ":
            if current:
                words.append(current)
                current = ""
        else:
            current += ch
    if current:
        words.append(current)
    return " ".join(words[::-1])


def optimal(text):
    return " ".join(reversed(text.split()))


def gen(rng):
    return ["".join(rng.choice("abc  ") for _ in range(rng.randint(0, 14)))]
