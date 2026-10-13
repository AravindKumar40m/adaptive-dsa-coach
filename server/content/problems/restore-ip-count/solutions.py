APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(3^4)", "O(1)")}


def brute(digits):
    from itertools import combinations

    n = len(digits)
    count = 0
    for cuts in combinations(range(1, n), 3):
        parts = [digits[a:b] for a, b in zip((0,) + cuts, cuts + (n,))]
        if all(len(p) == 1 or p[0] != "0" for p in parts) and all(int(p) <= 255 for p in parts):
            count += 1
    return count


def optimal(digits):
    def go(pos, parts):
        if parts == 4:
            return 1 if pos == len(digits) else 0
        total = 0
        for size in (1, 2, 3):
            if pos + size > len(digits):
                break
            part = digits[pos:pos + size]
            if (size > 1 and part[0] == "0") or int(part) > 255:
                continue
            total += go(pos + size, parts + 1)
        return total

    return go(0, 0)


def gen(rng):
    alphabet = rng.choice(["0125", "0123456789", "0155"])
    return ["".join(rng.choice(alphabet) for _ in range(rng.randint(4, 12)))]
