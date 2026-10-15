APPROACHES = {"brute": ("O((R*C)^2)", "O(R*C)"), "optimal": ("O(R*C log(R*C))", "O(R*C)")}


def brute(heights):
    rows, cols = len(heights), len(heights[0])
    INF = 10 ** 9
    level = [[heights[r][c] if r in (0, rows - 1) or c in (0, cols - 1) else INF for c in range(cols)] for r in range(rows)]
    changed = True
    while changed:
        changed = False
        for r in range(1, rows - 1):
            for c in range(1, cols - 1):
                lowest = min(level[r + 1][c], level[r - 1][c], level[r][c + 1], level[r][c - 1])
                new = max(heights[r][c], lowest)
                if new < level[r][c]:
                    level[r][c] = new
                    changed = True
    return sum(level[r][c] - heights[r][c] for r in range(rows) for c in range(cols))


def optimal(heights):
    import heapq

    rows, cols = len(heights), len(heights[0])
    seen = [[False] * cols for _ in range(rows)]
    heap = []
    for r in range(rows):
        for c in range(cols):
            if r in (0, rows - 1) or c in (0, cols - 1):
                heapq.heappush(heap, (heights[r][c], r, c))
                seen[r][c] = True
    total = 0
    while heap:
        h, r, c = heapq.heappop(heap)
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc]:
                seen[nr][nc] = True
                total += max(0, h - heights[nr][nc])
                heapq.heappush(heap, (max(h, heights[nr][nc]), nr, nc))
    return total


def gen(rng):
    rows, cols = rng.randint(3, 6), rng.randint(3, 6)
    grid = [[rng.randint(0, 6) if 0 < r < rows - 1 and 0 < c < cols - 1 else rng.randint(3, 7) for c in range(cols)] for r in range(rows)]
    return [grid]
