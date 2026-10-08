APPROACHES = {"brute": ("O(n * k)", "O(n)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # one turn at a time is slow for huge k, on purpose


def BRUTE_OK(args):
    return args[1] <= 1000


def brute(nums, k):
    nums = list(nums)
    for _ in range(k):
        nums.insert(0, nums.pop())
    return nums


def optimal(nums, k):
    n = len(nums)
    k %= n
    nums = list(nums)

    def reverse(lo, hi):
        while lo < hi:
            nums[lo], nums[hi] = nums[hi], nums[lo]
            lo += 1
            hi -= 1

    reverse(0, n - 1)
    reverse(0, k - 1)
    reverse(k, n - 1)
    return nums


def better(nums, k):
    k %= len(nums)
    return nums[len(nums) - k:] + nums[:len(nums) - k]


def gen(rng):
    n = rng.randint(1, 8)
    return [[rng.randint(-9, 9) for _ in range(n)], rng.choice([rng.randint(0, 20), rng.randint(1000000, 1000000000)])]
