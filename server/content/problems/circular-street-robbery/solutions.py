APPROACHES = {"brute": ("O(2^n * n)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(loot):
    n = len(loot)
    best = 0
    for mask in range(1 << n):
        ok = True
        total = 0
        for i in range(n):
            if mask >> i & 1:
                if n > 1 and mask >> ((i + 1) % n) & 1:
                    ok = False
                    break
                total += loot[i]
        if ok and total > best:
            best = total
    return best


def optimal(loot):
    def line(a):
        take, skip = 0, 0
        for x in a:
            take, skip = skip + x, max(take, skip)
        return max(take, skip)

    if len(loot) == 1:
        return loot[0]
    return max(line(loot[1:]), line(loot[:-1]))


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(1, 11))]]
