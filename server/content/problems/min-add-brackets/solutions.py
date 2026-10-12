APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    while "()" in text:
        text = text.replace("()", "")
    return len(text)


def optimal(text):
    waiting = 0
    fixes = 0
    for ch in text:
        if ch == "(":
            waiting += 1
        elif waiting:
            waiting -= 1
        else:
            fixes += 1
    return fixes + waiting


def gen(rng):
    return ["".join(rng.choice("()") for _ in range(rng.randint(0, 12)))]
