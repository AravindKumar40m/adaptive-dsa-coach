APPROACHES = {"brute": ("O(cells * 4^len)", "O(len)"), "optimal": ("O(cells * 3^len)", "O(len)")}


def brute(grid, word):
    rows, cols = len(grid), len(grid[0])
    m = len(word)
    if m == 0:
        return True

    def extend(path):
        if len(path) == m:
            return [grid[r][c] for r, c in path] == list(word)
        r, c = path[-1]
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in path:
                if extend(path + [(nr, nc)]):
                    return True
        return False

    return any(extend([(r, c)]) for r in range(rows) for c in range(cols))


def optimal(grid, word):
    rows, cols = len(grid), len(grid[0])
    m = len(word)
    if m == 0:
        return True
    used = [[False] * cols for _ in range(rows)]

    def go(r, c, i):
        if i == m - 1:
            return True
        used[r][c] = True
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and not used[nr][nc] and grid[nr][nc] == word[i + 1]:
                if go(nr, nc, i + 1):
                    used[r][c] = False
                    return True
        used[r][c] = False
        return False

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == word[0] and go(r, c, 0):
                return True
    return False


def gen(rng):
    rows, cols = rng.randint(1, 3), rng.randint(1, 3)
    grid = [[rng.randint(1, 3) for _ in range(cols)] for _ in range(rows)]
    if rng.random() < 0.5:
        r, c = rng.randrange(rows), rng.randrange(cols)
        word = [grid[r][c]]
        seen = {(r, c)}
        for _ in range(rng.randint(0, 4)):
            options = [(nr, nc) for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)) if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen]
            if not options:
                break
            r, c = rng.choice(options)
            seen.add((r, c))
            word.append(grid[r][c])
        if rng.random() < 0.25:
            word[-1] = rng.randint(1, 3)
    else:
        word = [rng.randint(1, 3) for _ in range(rng.randint(0, 5))]
    return [grid, word]
