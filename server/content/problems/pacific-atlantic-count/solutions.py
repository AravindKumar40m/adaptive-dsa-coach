APPROACHES = {"brute": ("O(cells^2)", "O(cells)"), "optimal": ("O(cells)", "O(cells)")}


def brute(heights):
    rows, cols = len(heights), len(heights[0])

    def can_reach(r, c, pacific):
        seen = {(r, c)}
        stack = [(r, c)]
        while stack:
            x, y = stack.pop()
            if pacific and (x == 0 or y == 0):
                return True
            if not pacific and (x == rows - 1 or y == cols - 1):
                return True
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < rows and 0 <= ny < cols and (nx, ny) not in seen and heights[nx][ny] <= heights[x][y]:
                    seen.add((nx, ny))
                    stack.append((nx, ny))
        return False

    return sum(1 for r in range(rows) for c in range(cols) if can_reach(r, c, True) and can_reach(r, c, False))


def optimal(heights):
    rows, cols = len(heights), len(heights[0])

    def reach(starts):
        marked = set(starts)
        stack = list(starts)
        while stack:
            x, y = stack.pop()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < rows and 0 <= ny < cols and (nx, ny) not in marked and heights[nx][ny] >= heights[x][y]:
                    marked.add((nx, ny))
                    stack.append((nx, ny))
        return marked

    pacific = reach([(0, c) for c in range(cols)] + [(r, 0) for r in range(rows)])
    atlantic = reach([(rows - 1, c) for c in range(cols)] + [(r, cols - 1) for r in range(rows)])
    return len(pacific & atlantic)


def gen(rng):
    rows, cols = rng.randint(1, 5), rng.randint(1, 5)
    return [[[rng.randint(0, 6) for _ in range(cols)] for _ in range(rows)]]
