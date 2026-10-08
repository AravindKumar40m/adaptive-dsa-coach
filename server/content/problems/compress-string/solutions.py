APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    from itertools import groupby

    return "".join(ch + str(len(list(group))) for ch, group in groupby(text))


def optimal(text):
    result = []
    i = 0
    while i < len(text):
        j = i
        while j < len(text) and text[j] == text[i]:
            j += 1
        result.append(text[i] + str(j - i))
        i = j
    return "".join(result)


def gen(rng):
    text = ""
    for _ in range(rng.randint(1, 5)):
        text += rng.choice("abc") * rng.randint(1, 12)
    return [text]
