APPROACHES = {"brute": ("O(n * rows)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(text, rows):
    if rows == 1:
        return text
    cycle = 2 * (rows - 1)
    out = []
    for r in range(rows):
        for i, ch in enumerate(text):
            pos = i % cycle
            row = pos if pos < rows else cycle - pos
            if row == r:
                out.append(ch)
    return "".join(out)


def optimal(text, rows):
    if rows == 1 or rows >= len(text):
        return text
    lines = [[] for _ in range(rows)]
    row, step = 0, 1
    for ch in text:
        lines[row].append(ch)
        if row == 0:
            step = 1
        elif row == rows - 1:
            step = -1
        row += step
    return "".join("".join(line) for line in lines)


def gen(rng):
    return ["".join(rng.choice("abcdefghij") for _ in range(rng.randint(0, 12))), rng.randint(1, 6)]
