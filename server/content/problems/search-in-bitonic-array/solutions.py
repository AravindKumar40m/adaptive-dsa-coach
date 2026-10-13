APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}


def brute(numbers, target):
    for i, v in enumerate(numbers):
        if v == target:
            return i
    return -1


def optimal(numbers, target):
    n = len(numbers)
    if n == 0:
        return -1
    lo, hi = 0, n - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if numbers[mid] < numbers[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    peak = lo
    lo, hi = 0, peak
    while lo <= hi:
        mid = (lo + hi) // 2
        if numbers[mid] == target:
            return mid
        if numbers[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    lo, hi = peak + 1, n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if numbers[mid] == target:
            return mid
        if numbers[mid] > target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1


def gen(rng):
    values = sorted(rng.sample(range(-10, 30), rng.randint(0, 8)))
    if values:
        top = values.pop()
        up = [v for v in values if rng.random() < 0.5]
        down = [v for v in values if v not in up]
        arr = up + [top] + down[::-1]
    else:
        arr = []
    target = rng.choice(arr) if arr and rng.random() < 0.6 else rng.randint(-12, 32)
    return [arr, target]
