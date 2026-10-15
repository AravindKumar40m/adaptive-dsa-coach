APPROACHES = {"brute": ("O(cells^2)", "O(cells)"), "optimal": ("O(cells)", "O(cells)")}


def brute(grid):
    rows, cols = len(grid), len(grid[0])
    best = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1:
                continue
            seen = {(r, c)}
            queue = [(r, c)]
            for x, y in queue:
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == 1 and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            best = max(best, len(seen))
    return best


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    visited = [[False] * cols for _ in range(rows)]
    best = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and not visited[r][c]:
                visited[r][c] = True
                stack = [(r, c)]
                size = 0
                while stack:
                    x, y = stack.pop()
                    size += 1
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == 1 and not visited[nx][ny]:
                            visited[nx][ny] = True
                            stack.append((nx, ny))
                best = max(best, size)
    return best


def gen(rng):
    rows, cols = rng.randint(1, 6), rng.randint(1, 6)
    p = rng.choice([0.35, 0.5, 0.65])
    return [[[1 if rng.random() < p else 0 for _ in range(cols)] for _ in range(rows)]]
