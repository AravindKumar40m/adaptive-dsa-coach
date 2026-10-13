APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(ops):
    stack = []
    out = []
    for op in ops:
        if op > 0:
            stack.append(op)
        elif op == 0:
            if stack:
                stack.pop()
        else:
            out.append(min(stack) if stack else 0)
    return out


def optimal(ops):
    values = []
    mins = []
    out = []
    for op in ops:
        if op > 0:
            values.append(op)
            mins.append(min(op, mins[-1]) if mins else op)
        elif op == 0:
            if values:
                values.pop()
                mins.pop()
        else:
            out.append(mins[-1] if mins else 0)
    return out


def gen(rng):
    return [[rng.choice([rng.randint(1, 9)] * 6 + [0, 0, -1, -1]) for _ in range(rng.randint(0, 14))]]
