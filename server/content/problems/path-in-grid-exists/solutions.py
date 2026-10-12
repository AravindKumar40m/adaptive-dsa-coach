APPROACHES = {"brute": ("O(cells * 3^len)", "O(len)"), "optimal": ("O(cells * 3^len)", "O(cells)")}


def brute(grid, word):
    rows, cols = len(grid), len(grid[0])
    length = len(word)

    def paths(r, c, used, path):
        path = path + [grid[r][c]]
        if len(path) == length:
            return path == word
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in used:
                if paths(nr, nc, used | {(nr, nc)}, path):
                    return True
        return False

    return any(paths(r, c, {(r, c)}, []) for r in range(rows) for c in range(cols))


def optimal(grid, word):
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]

    def go(r, c, k):
        if grid[r][c] != word[k]:
            return False
        if k == len(word) - 1:
            return True
        seen[r][c] = True
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc] and go(nr, nc, k + 1):
                seen[r][c] = False
                return True
        seen[r][c] = False
        return False

    return any(go(r, c, 0) for r in range(rows) for c in range(cols))


def gen(rng):
    rows, cols = rng.randint(1, 3), rng.randint(1, 3)
    grid = [[rng.randint(1, 3) for _ in range(cols)] for _ in range(rows)]
    if rng.random() < 0.5:
        r, c = rng.randrange(rows), rng.randrange(cols)
        used, word = {(r, c)}, [grid[r][c]]
        for _ in range(rng.randint(0, 6)):
            options = [(r + dr, c + dc) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= r + dr < rows and 0 <= c + dc < cols and (r + dr, c + dc) not in used]
            if not options:
                break
            r, c = rng.choice(options)
            used.add((r, c))
            word.append(grid[r][c])
    else:
        word = [rng.randint(1, 3) for _ in range(rng.randint(1, 6))]
    return [grid, word]
