APPROACHES = {"brute": ("exponential", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    from itertools import product

    letters = sorted(set(text))
    positions = [[i for i, c in enumerate(text) if c == letter] for letter in letters]
    best = None
    for choice in product(*positions):
        candidate = "".join(text[i] for i in sorted(choice))
        if best is None or candidate < best:
            best = candidate
    return best if best is not None else ""


def optimal(text):
    last = {c: i for i, c in enumerate(text)}
    stack = []
    in_stack = set()
    for i, c in enumerate(text):
        if c in in_stack:
            continue
        while stack and stack[-1] > c and last[stack[-1]] > i:
            in_stack.discard(stack.pop())
        stack.append(c)
        in_stack.add(c)
    return "".join(stack)


def gen(rng):
    return ["".join(rng.choice("abcd"[:rng.randint(2, 4)]) for _ in range(rng.randint(0, 10)))]
