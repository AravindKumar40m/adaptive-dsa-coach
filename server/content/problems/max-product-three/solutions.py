APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n log n)", "O(1)")}


def brute(nums):
    best = None
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                p = nums[i] * nums[j] * nums[k]
                if best is None or p > best:
                    best = p
    return best


def optimal(nums):
    a = sorted(nums)
    return max(a[-1] * a[-2] * a[-3], a[0] * a[1] * a[-1])


def gen(rng):
    return [[rng.randint(-9, 9) for _ in range(rng.randint(3, 8))]]
