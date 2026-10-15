APPROACHES = {"brute": ("O(answer)", "O(n)"), "better": ("O(n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}


def BRUTE_OK(args):
    return args[1] <= 100000 and (max(args[0]) if args[0] else 0) <= 100000


def brute(numbers, k):
    present = set(numbers)
    x = 0
    while k > 0:
        x += 1
        if x not in present:
            k -= 1
    return x


def better(numbers, k):
    for x in numbers:
        if x <= k:
            k += 1
        else:
            break
    return k


def optimal(numbers, k):
    lo, hi = 0, len(numbers)
    while lo < hi:
        mid = (lo + hi) // 2
        if numbers[mid] - (mid + 1) >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo + k


def gen(rng):
    numbers = sorted(rng.sample(range(1, 30), rng.randint(0, 8)))
    return [numbers, rng.randint(1, 15)]
