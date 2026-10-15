APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    stack = [""]
    for c in text:
        if c == "(":
            stack.append("")
        elif c == ")":
            piece = stack.pop()
            stack[-1] += piece[::-1]
        else:
            stack[-1] += c
    return stack[-1]


def optimal(text):
    n = len(text)
    partner = {}
    opens = []
    for i, c in enumerate(text):
        if c == "(":
            opens.append(i)
        elif c == ")":
            j = opens.pop()
            partner[i] = j
            partner[j] = i
    out = []
    i, step = 0, 1
    while 0 <= i < n:
        if text[i] in "()":
            i = partner[i]
            step = -step
        else:
            out.append(text[i])
        i += step
    return "".join(out)


def gen(rng):
    def build(depth):
        out = ""
        for _ in range(rng.randint(0, 3)):
            if depth > 0 and rng.random() < 0.4:
                out += "(" + build(depth - 1) + ")"
            else:
                out += "".join(rng.choice("abcdef") for _ in range(rng.randint(1, 2)))
        return out

    return [build(3)]
