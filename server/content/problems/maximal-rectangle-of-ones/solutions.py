APPROACHES = {"brute": ("O(r^2 * c^2)", "O(r * c)"), "optimal": ("O(r * c)", "O(c)")}


def brute(grid):
    rows, cols = len(grid), len(grid[0])
    prefix = [[0] * (cols + 1) for _ in range(rows + 1)]
    for r in range(rows):
        for c in range(cols):
            prefix[r + 1][c + 1] = prefix[r][c + 1] + prefix[r + 1][c] - prefix[r][c] + grid[r][c]
    best = 0
    for r1 in range(rows):
        for r2 in range(r1, rows):
            for c1 in range(cols):
                for c2 in range(c1, cols):
                    area = (r2 - r1 + 1) * (c2 - c1 + 1)
                    ones = prefix[r2 + 1][c2 + 1] - prefix[r1][c2 + 1] - prefix[r2 + 1][c1] + prefix[r1][c1]
                    if ones == area:
                        best = max(best, area)
    return best


def optimal(grid):
    rows, cols = len(grid), len(grid[0])
    heights = [0] * cols
    best = 0
    for row in grid:
        for c in range(cols):
            heights[c] = heights[c] + 1 if row[c] == 1 else 0
        stack = []
        for i in range(cols + 1):
            h = heights[i] if i < cols else 0
            while stack and heights[stack[-1]] >= h:
                top = stack.pop()
                width = i if not stack else i - stack[-1] - 1
                best = max(best, heights[top] * width)
            stack.append(i)
    return best


def gen(rng):
    rows, cols = rng.randint(1, 6), rng.randint(1, 6)
    p = rng.choice([0.55, 0.7, 0.85])
    return [[[1 if rng.random() < p else 0 for _ in range(cols)] for _ in range(rows)]]
