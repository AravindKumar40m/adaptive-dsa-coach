APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    for i in range(len(text)):
        if text.count(text[i]) == 1:
            return i
    return -1


def optimal(text):
    count = [0] * 26
    for ch in text:
        count[ord(ch) - 97] += 1
    for i, ch in enumerate(text):
        if count[ord(ch) - 97] == 1:
            return i
    return -1


def gen(rng):
    return ["".join(rng.choice("abcd") for _ in range(rng.randint(1, 10)))]
