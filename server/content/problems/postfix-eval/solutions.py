APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(expr):
    # repeatedly replace the first 'a b op' triple with its value
    tokens = expr.split(" ")
    while len(tokens) > 1:
        for i in range(2, len(tokens)):
            if tokens[i] in ("+", "-", "*"):
                a, b = int(tokens[i - 2]), int(tokens[i - 1])
                value = a + b if tokens[i] == "+" else a - b if tokens[i] == "-" else a * b
                tokens[i - 2:i + 1] = [str(value)]
                break
    return int(tokens[0])


def optimal(expr):
    stack = []
    for token in expr.split(" "):
        if token in ("+", "-", "*"):
            b = stack.pop()
            a = stack.pop()
            stack.append(a + b if token == "+" else a - b if token == "-" else a * b)
        else:
            stack.append(int(token))
    return stack[0]


def _build(rng, depth):
    if depth == 0 or rng.random() < 0.3:
        return [str(rng.randint(0, 9))]
    return _build(rng, depth - 1) + _build(rng, depth - 1) + [rng.choice(["+", "-", "*"])]


def gen(rng):
    return [" ".join(_build(rng, 3))]
