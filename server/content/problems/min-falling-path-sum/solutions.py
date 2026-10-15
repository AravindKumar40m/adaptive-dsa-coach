APPROACHES = {"brute": ("O(3^rows * columns)", "O(rows)"), "optimal": ("O(rows * columns)", "O(columns)")}


def BRUTE_OK(args):
    return len(args[0]) <= 7


def brute(matrix):
    rows, cols = len(matrix), len(matrix[0])

    def go(r, c):
        if r == rows - 1:
            return matrix[r][c]
        options = [go(r + 1, c + d) for d in (-1, 0, 1) if 0 <= c + d < cols]
        return matrix[r][c] + min(options)

    return min(go(0, c) for c in range(cols))


def optimal(matrix):
    rows, cols = len(matrix), len(matrix[0])
    best = list(matrix[0])
    for r in range(1, rows):
        new = []
        for c in range(cols):
            new.append(matrix[r][c] + min(best[c + d] for d in (-1, 0, 1) if 0 <= c + d < cols))
        best = new
    return min(best)


def gen(rng):
    rows, cols = rng.randint(1, 5), rng.randint(1, 5)
    return [[[rng.randint(-9, 9) for _ in range(cols)] for _ in range(rows)]]
