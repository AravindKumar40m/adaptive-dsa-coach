APPROACHES = {"brute": ("O(2^row)", "O(2^row)"), "better": ("O(log n)", "O(1)"), "optimal": ("O(row)", "O(row)")}


def BRUTE_OK(args):
    return args[0] <= 12


def brute(row, position):
    line = "0"
    for _ in range(row - 1):
        line = "".join("01" if ch == "0" else "10" for ch in line)
    return int(line[position - 1])


def better(row, position):
    return bin(position - 1).count("1") % 2


def optimal(row, position):
    if row == 1:
        return 0
    parent = optimal(row - 1, (position + 1) // 2)
    return parent if position % 2 == 1 else 1 - parent


def gen(rng):
    row = rng.randint(1, 12)
    want = rng.randint(0, 1)  # the answer is only ever 0 or 1: aim for both about equally often
    for _ in range(20):
        position = rng.randint(1, 2 ** (row - 1))
        if bin(position - 1).count("1") % 2 == want:
            break
    return [row, position]
