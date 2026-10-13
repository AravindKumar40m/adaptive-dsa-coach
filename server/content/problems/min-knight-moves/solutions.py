APPROACHES = {"brute": ("O(size^4)", "O(size^2)"), "optimal": ("O(size^2)", "O(size^2)")}


def brute(size, start_row, start_col, target_row, target_col):
    moves = ((1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2))
    INF = 10 ** 9
    dist = [[INF] * size for _ in range(size)]
    dist[start_row][start_col] = 0
    changed = True
    while changed:
        changed = False
        for r in range(size):
            for c in range(size):
                if dist[r][c] == INF:
                    continue
                for dr, dc in moves:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < size and 0 <= nc < size and dist[r][c] + 1 < dist[nr][nc]:
                        dist[nr][nc] = dist[r][c] + 1
                        changed = True
    return -1 if dist[target_row][target_col] == INF else dist[target_row][target_col]


def optimal(size, start_row, start_col, target_row, target_col):
    from collections import deque

    moves = ((1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2))
    dist = [[-1] * size for _ in range(size)]
    dist[start_row][start_col] = 0
    queue = deque([(start_row, start_col)])
    while queue:
        r, c = queue.popleft()
        if r == target_row and c == target_col:
            return dist[r][c]
        for dr, dc in moves:
            nr, nc = r + dr, c + dc
            if 0 <= nr < size and 0 <= nc < size and dist[nr][nc] < 0:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return -1


def gen(rng):
    size = rng.randint(1, 8)
    return [size, rng.randrange(size), rng.randrange(size), rng.randrange(size), rng.randrange(size)]
