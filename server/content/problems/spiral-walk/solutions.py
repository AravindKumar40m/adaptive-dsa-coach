APPROACHES = {"brute": ("O(rows * columns)", "O(rows * columns)"), "optimal": ("O(rows * columns)", "O(1)")}


def brute(grid):
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    r = c = 0
    dr, dc = 0, 1
    out = []
    for _ in range(rows * cols):
        out.append(grid[r][c])
        seen[r][c] = True
        nr, nc = r + dr, c + dc
        if not (0 <= nr < rows and 0 <= nc < cols) or seen[nr][nc]:
            dr, dc = dc, -dr
            nr, nc = r + dr, c + dc
        r, c = nr, nc
    return out


def optimal(grid):
    top, bottom = 0, len(grid) - 1
    left, right = 0, len(grid[0]) - 1
    out = []
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(grid[top][c])
        for r in range(top + 1, bottom + 1):
            out.append(grid[r][right])
        if top < bottom and left < right:
            for c in range(right - 1, left - 1, -1):
                out.append(grid[bottom][c])
            for r in range(bottom - 1, top, -1):
                out.append(grid[r][left])
        top += 1
        bottom -= 1
        left += 1
        right -= 1
    return out


def gen(rng):
    rows, cols = rng.randint(1, 5), rng.randint(1, 5)
    return [[[rng.randint(0, 99) for _ in range(cols)] for _ in range(rows)]]
