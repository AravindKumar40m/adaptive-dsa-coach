APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    previous = None
    while previous != text:
        previous = text
        text = text.replace("()", "").replace("[]", "").replace("{}", "")
    return text == ""


def optimal(text):
    match = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack.pop() != match[ch]:
            return False
    return not stack


def gen(rng):
    pairs = ["()", "[]", "{}"]
    if rng.random() < 0.5:
        s = ""
        for _ in range(rng.randint(1, 6)):
            cut = rng.randint(0, len(s))
            s = s[:cut] + rng.choice(pairs) + s[cut:]
        if rng.random() < 0.4:
            i = rng.randrange(len(s))
            s = s[:i] + rng.choice("()[]{}") + s[i + 1:]
        return [s]
    return ["".join(rng.choice("()[]{}") for _ in range(rng.randint(1, 12)))]
