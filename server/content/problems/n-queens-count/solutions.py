APPROACHES = {"brute": ("O(n! * n^2)", "O(n)"), "better": ("O(n!)", "O(n)"), "optimal": ("O(n!)", "O(n)")}
EXPECT_SLOW = {"brute"}  # trying every column permutation is slow for bigger boards, on purpose


def BRUTE_OK(args):
    return args[0] <= 7


def brute(n):
    from itertools import permutations

    count = 0
    for cols in permutations(range(n)):  # cols[row] = column of the queen in that row
        if all(abs(cols[i] - cols[j]) != j - i for i in range(n) for j in range(i + 1, n)):
            count += 1
    return count


def better(n):
    cols = []

    def place(row):
        if row == n:
            return 1
        total = 0
        for c in range(n):
            if all(c != cols[r] and abs(c - cols[r]) != row - r for r in range(row)):
                cols.append(c)
                total += place(row + 1)
                cols.pop()
        return total

    return place(0)


def optimal(n):
    full = (1 << n) - 1

    def place(cols, diag, anti):
        if cols == full:
            return 1
        total = 0
        free = full & ~(cols | diag | anti)
        while free:
            bit = free & -free
            free -= bit
            total += place(cols | bit, ((diag | bit) << 1) & full, (anti | bit) >> 1)
        return total

    return place(0, 0, 0)


def gen(rng):
    return [rng.randint(1, 9)]
