APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(log n)", "O(1)")}


def brute(nums):
    return min(nums)


def optimal(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]


def gen(rng):
    nums = sorted(rng.sample(range(-10, 20), rng.randint(1, 10)))
    cut = rng.randint(0, len(nums) - 1)
    return [nums[cut:] + nums[:cut]]
