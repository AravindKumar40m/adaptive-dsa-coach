APPROACHES = {"brute": ("O(r * c * (r + c))", "O(1)"), "optimal": ("O(r * c)", "O(r + c)")}


def brute(matrix):
    rows, cols = len(matrix), len(matrix[0])
    out = []
    for r in range(rows):
        for c in range(cols):
            v = matrix[r][c]
            if all(v <= matrix[r][j] for j in range(cols)) and all(v >= matrix[i][c] for i in range(rows)):
                out.append(v)
    return sorted(out)


def optimal(matrix):
    rows, cols = len(matrix), len(matrix[0])
    row_min = [min(row) for row in matrix]
    col_max = [max(matrix[r][c] for r in range(rows)) for c in range(cols)]
    out = [matrix[r][c] for r in range(rows) for c in range(cols) if matrix[r][c] == row_min[r] and matrix[r][c] == col_max[c]]
    return sorted(out)


def gen(rng):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    return [[[rng.randint(1, 5) for _ in range(cols)] for _ in range(rows)]]
