APPROACHES = {"brute": ("O(rows * columns)", "O(1)"), "optimal": ("O(log(rows * columns))", "O(1)")}


def brute(matrix, target):
    return any(target in row for row in matrix)


def optimal(matrix, target):
    cols = len(matrix[0])
    lo, hi = 0, len(matrix) * cols - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        value = matrix[mid // cols][mid % cols]
        if value == target:
            return True
        if value < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False


def gen(rng):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    value = rng.randint(-5, 5)
    grid = []
    for _ in range(rows):
        row = []
        for _ in range(cols):
            value += rng.randint(1, 3)
            row.append(value)
        grid.append(row)
    flat = [x for row in grid for x in row]
    target = rng.choice(flat) if rng.random() < 0.5 else rng.randint(flat[0] - 2, flat[-1] + 2)
    return [grid, target]
