APPROACHES = {"brute": ("O(4^empty * 12)", "O(empty)"), "optimal": ("O(4^empty)", "O(empty)")}


def brute(board):
    grid = [row[:] for row in board]

    def ok(r, c, v):
        for k in range(4):
            if grid[r][k] == v or grid[k][c] == v:
                return False
        br, bc = r // 2 * 2, c // 2 * 2
        for i in range(br, br + 2):
            for j in range(bc, bc + 2):
                if grid[i][j] == v:
                    return False
        return True

    def solve(pos):
        while pos < 16 and grid[pos // 4][pos % 4]:
            pos += 1
        if pos == 16:
            return 1
        r, c = pos // 4, pos % 4
        total = 0
        for v in range(1, 5):
            if ok(r, c, v):
                grid[r][c] = v
                total += solve(pos + 1)
                grid[r][c] = 0
        return total

    return solve(0)


def optimal(board):
    rows = [0] * 4
    cols = [0] * 4
    boxes = [0] * 4
    empty = []
    for r in range(4):
        for c in range(4):
            v = board[r][c]
            if v:
                bit = 1 << v
                rows[r] |= bit
                cols[c] |= bit
                boxes[r // 2 * 2 + c // 2] |= bit
            else:
                empty.append((r, c))

    def fill(i):
        if i == len(empty):
            return 1
        r, c = empty[i]
        b = r // 2 * 2 + c // 2
        total = 0
        for v in range(1, 5):
            bit = 1 << v
            if not (rows[r] & bit or cols[c] & bit or boxes[b] & bit):
                rows[r] |= bit
                cols[c] |= bit
                boxes[b] |= bit
                total += fill(i + 1)
                rows[r] ^= bit
                cols[c] ^= bit
                boxes[b] ^= bit
        return total

    return fill(0)


def gen(rng):
    base = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]]
    digits = [1, 2, 3, 4]
    rng.shuffle(digits)
    order = [0, 1, 2, 3]
    if rng.random() < 0.5:
        order[0], order[1] = order[1], order[0]
    if rng.random() < 0.5:
        order[2], order[3] = order[3], order[2]
    board = [[digits[base[r][c] - 1] for c in range(4)] for r in order]
    keep = rng.choice([0.2, 0.35, 0.5, 0.7])
    return [[[v if rng.random() < keep else 0 for v in row] for row in board]]
