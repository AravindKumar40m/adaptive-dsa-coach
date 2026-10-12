APPROACHES = {"brute": ("O((rows*columns)^2)", "O(rows * columns)"), "optimal": ("O(rows * columns)", "O(rows * columns)")}


def brute(grid, row, col):
    rows, cols = len(grid), len(grid[0])
    colour = grid[row][col]
    mark = [[False] * cols for _ in range(rows)]
    mark[row][col] = True
    changed = True
    while changed:
        changed = False
        for r in range(rows):
            for c in range(cols):
                if not mark[r][c] and grid[r][c] == colour:
                    for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                        if 0 <= nr < rows and 0 <= nc < cols and mark[nr][nc]:
                            mark[r][c] = True
                            changed = True
                            break
    return sum(line.count(True) for line in mark)


def optimal(grid, row, col):
    rows, cols = len(grid), len(grid[0])
    colour = grid[row][col]
    seen = {(row, col)}
    stack = [(row, col)]
    while stack:
        r, c = stack.pop()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and grid[nr][nc] == colour:
                seen.add((nr, nc))
                stack.append((nr, nc))
    return len(seen)


def gen(rng):
    rows, cols = rng.randint(1, 5), rng.randint(1, 5)
    grid = [[rng.randint(0, 2) for _ in range(cols)] for _ in range(rows)]
    return [grid, rng.randrange(rows), rng.randrange(cols)]
