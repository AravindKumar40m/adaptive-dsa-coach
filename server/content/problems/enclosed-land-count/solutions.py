APPROACHES = {"brute": ("O(cells^2)", "O(cells)"), "optimal": ("O(cells)", "O(cells)")}


def brute(grid):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1:
                continue
            seen = {(r, c)}
            stack = [(r, c)]
            escapes = False
            while stack and not escapes:
                x, y = stack.pop()
                if x == 0 or y == 0 or x == rows - 1 or y == cols - 1:
                    escapes = True
                    break
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if grid[nx][ny] == 1 and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            if not escapes:
                count += 1
    return count


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    marked = [[False] * cols for _ in range(rows)]
    stack = []
    for r in range(rows):
        for c in range(cols):
            if (r == 0 or c == 0 or r == rows - 1 or c == cols - 1) and grid[r][c] == 1:
                marked[r][c] = True
                stack.append((r, c))
    while stack:
        r, c = stack.pop()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not marked[nr][nc]:
                marked[nr][nc] = True
                stack.append((nr, nc))
    return sum(1 for r in range(rows) for c in range(cols) if grid[r][c] == 1 and not marked[r][c])


def gen(rng):
    rows, cols = rng.randint(4, 9), rng.randint(4, 9)
    p = rng.choice([0.3, 0.4, 0.5])
    return [[[1 if rng.random() < p else 0 for _ in range(cols)] for _ in range(rows)]]
