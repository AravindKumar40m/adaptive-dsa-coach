APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}


def brute(nums, target):
    for i, x in enumerate(nums):
        if x == target:
            return i
    return -1


def optimal(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1


def gen(rng):
    nums = sorted(rng.sample(range(-10, 20), rng.randint(1, 10)))
    return [nums, rng.choice([rng.choice(nums), rng.randint(-12, 22)])]
