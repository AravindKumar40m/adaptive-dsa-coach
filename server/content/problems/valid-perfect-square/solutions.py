APPROACHES = {"brute": ("O(sqrt(num))", "O(1)"), "optimal": ("O(log num)", "O(1)")}


def brute(num):
    i = 1
    while i * i <= num:
        if i * i == num:
            return True
        i += 1
    return False


def optimal(num):
    lo, hi = 1, min(num, 46341)
    while lo <= hi:
        mid = (lo + hi) // 2
        square = mid * mid
        if square == num:
            return True
        if square < num:
            lo = mid + 1
        else:
            hi = mid - 1
    return False


def gen(rng):
    if rng.random() < 0.5:
        return [rng.randint(1, 300) ** 2]
    return [rng.randint(1, 100000)]
