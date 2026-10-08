APPROACHES = {"brute": ("O((rows*cols)^2)", "O(rows * cols)"), "optimal": ("O(rows * cols)", "O(rows * cols)")}


def brute(grid):
    # label propagation: every land cell starts with its own label and copies the smallest neighbour label until stable
    rows, cols = len(grid), len(grid[0])
    label = {(r, c): r * cols + c for r in range(rows) for c in range(cols) if grid[r][c] == 1}
    changed = True
    while changed:
        changed = False
        for (r, c) in label:
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nb = (r + dr, c + dc)
                if nb in label and label[nb] < label[(r, c)]:
                    label[(r, c)] = label[nb]
                    changed = True
    return len(set(label.values()))


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    islands = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and not seen[r][c]:
                islands += 1
                seen[r][c] = True
                stack = [(r, c)]
                while stack:
                    cr, cc = stack.pop()
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:
                            seen[nr][nc] = True
                            stack.append((nr, nc))
    return islands


def gen(rng):
    rows, cols = rng.randint(1, 5), rng.randint(1, 5)
    return [[[1 if rng.random() < 0.5 else 0 for _ in range(cols)] for _ in range(rows)]]
