APPROACHES = {"brute": ("O(2^n * n)", "O(1)"), "optimal": ("O(n * total)", "O(total)")}


def brute(numbers):
    total = sum(numbers)
    if total % 2:
        return False
    n = len(numbers)
    for mask in range(1 << n):
        s = 0
        for i in range(n):
            if mask >> i & 1:
                s += numbers[i]
        if s * 2 == total:
            return True
    return False


def optimal(numbers):
    total = sum(numbers)
    if total % 2:
        return False
    half = total // 2
    reachable = [False] * (half + 1)
    reachable[0] = True
    for x in numbers:
        for s in range(half, x - 1, -1):
            if reachable[s - x]:
                reachable[s] = True
    return reachable[half]


def gen(rng):
    n = rng.randint(1, 5)
    nums = [rng.randint(1, 9) for _ in range(n)]
    if n >= 2 and rng.random() < 0.55:
        extra = sum(nums)
        while extra > 0:
            p = rng.randint(1, min(9, extra))
            nums.append(p)
            extra -= p
        rng.shuffle(nums)
    return [nums]
