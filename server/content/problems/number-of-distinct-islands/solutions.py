APPROACHES = {"brute": ("O(cells)", "O(cells)"), "optimal": ("O(cells)", "O(cells)")}


def brute(grid):
    rows, cols = len(grid), len(grid[0])
    seen = set()
    shapes = set()
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and (r, c) not in seen:
                cells = [(r, c)]
                seen.add((r, c))
                for x, y in cells:
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == 1 and (nx, ny) not in seen:
                            seen.add((nx, ny))
                            cells.append((nx, ny))
                top = min(x for x, y in cells)
                left = min(y for x, y in cells)
                shapes.add(tuple(sorted((x - top, y - left) for x, y in cells)))
    return len(shapes)


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    visited = [[False] * cols for _ in range(rows)]
    shapes = set()

    def walk(x, y, direction, path):
        if not (0 <= x < rows and 0 <= y < cols) or grid[x][y] != 1 or visited[x][y]:
            return
        visited[x][y] = True
        path.append(direction)
        walk(x + 1, y, "d", path)
        walk(x - 1, y, "u", path)
        walk(x, y + 1, "r", path)
        walk(x, y - 1, "l", path)
        path.append("b")

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and not visited[r][c]:
                path = []
                walk(r, c, "o", path)
                shapes.add("".join(path))
    return len(shapes)


def gen(rng):
    rows, cols = rng.randint(4, 9), rng.randint(4, 9)
    p = rng.choice([0.3, 0.4])
    return [[[1 if rng.random() < p else 0 for _ in range(cols)] for _ in range(rows)]]
