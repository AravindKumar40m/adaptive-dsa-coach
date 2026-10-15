APPROACHES = {"brute": ("O(r * c)", "O(r * c)"), "optimal": ("O(r * c)", "O(1)")}


def brute(matrix):
    rows, cols = len(matrix), len(matrix[0])
    out = []
    for d in range(rows + cols - 1):
        cells = [matrix[r][d - r] for r in range(rows) if 0 <= d - r < cols]
        if d % 2 == 0:
            cells.reverse()
        out += cells
    return out


def optimal(matrix):
    rows, cols = len(matrix), len(matrix[0])
    out = []
    r = c = 0
    up = True
    for _ in range(rows * cols):
        out.append(matrix[r][c])
        if up:
            if c == cols - 1:
                r += 1
                up = False
            elif r == 0:
                c += 1
                up = False
            else:
                r -= 1
                c += 1
        else:
            if r == rows - 1:
                c += 1
                up = True
            elif c == 0:
                r += 1
                up = True
            else:
                r += 1
                c -= 1
    return out


def gen(rng):
    rows, cols = rng.randint(1, 5), rng.randint(1, 5)
    return [[[rng.randint(-9, 9) for _ in range(cols)] for _ in range(rows)]]
