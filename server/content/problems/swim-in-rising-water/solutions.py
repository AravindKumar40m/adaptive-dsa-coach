APPROACHES = {"brute": ("O(values * n^2)", "O(n^2)"), "better": ("O(n^2 log(values))", "O(n^2)"), "optimal": ("O(n^2 log n)", "O(n^2)")}


def BRUTE_OK(args):
    return len(args[0]) <= 8


def brute(grid):
    n = len(grid)
    for t in range(0, max(max(row) for row in grid) + 1):
        seen = set()
        if grid[0][0] > t:
            continue
        seen.add((0, 0))
        stack = [(0, 0)]
        found = False
        while stack:
            x, y = stack.pop()
            if (x, y) == (n - 1, n - 1):
                found = True
                break
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < n and 0 <= ny < n and (nx, ny) not in seen and grid[nx][ny] <= t:
                    seen.add((nx, ny))
                    stack.append((nx, ny))
        if found:
            return t
    return max(max(row) for row in grid)


def better(grid):
    n = len(grid)

    def reachable(t):
        if grid[0][0] > t:
            return False
        seen = {(0, 0)}
        stack = [(0, 0)]
        while stack:
            x, y = stack.pop()
            if (x, y) == (n - 1, n - 1):
                return True
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < n and 0 <= ny < n and (nx, ny) not in seen and grid[nx][ny] <= t:
                    seen.add((nx, ny))
                    stack.append((nx, ny))
        return False

    lo, hi = 0, max(max(row) for row in grid)
    while lo < hi:
        mid = (lo + hi) // 2
        if reachable(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo


def optimal(grid):
    import heapq

    n = len(grid)
    heap = [(grid[0][0], 0, 0)]
    visited = [[False] * n for _ in range(n)]
    visited[0][0] = True
    while heap:
        t, x, y = heapq.heappop(heap)
        if x == n - 1 and y == n - 1:
            return t
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < n and 0 <= ny < n and not visited[nx][ny]:
                visited[nx][ny] = True
                heapq.heappush(heap, (max(t, grid[nx][ny]), nx, ny))
    return 0


def gen(rng):
    n = rng.randint(1, 5)
    return [[[rng.randint(0, 12) for _ in range(n)] for _ in range(n)]]
