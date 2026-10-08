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
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1


def gen(rng):
    nums = sorted(rng.sample(range(-10, 20), rng.randint(1, 10)))
    cut = rng.randint(0, len(nums) - 1)
    rotated = nums[cut:] + nums[:cut]
    return [rotated, rng.choice([rng.choice(nums), rng.randint(-12, 22)])]
