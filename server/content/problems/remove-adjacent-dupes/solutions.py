APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    changed = True
    while changed:
        changed = False
        for i in range(len(text) - 1):
            if text[i] == text[i + 1]:
                text = text[:i] + text[i + 2:]
                changed = True
                break
    return text


def optimal(text):
    stack = []
    for ch in text:
        if stack and stack[-1] == ch:
            stack.pop()
        else:
            stack.append(ch)
    return "".join(stack)


def gen(rng):
    return ["".join(rng.choice("abc") for _ in range(rng.randint(1, 12)))]
