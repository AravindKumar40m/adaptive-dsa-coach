APPROACHES = {"brute": ("O(k^n)", "O(k)"), "better": ("O(2^n * n)", "O(2^n)"), "optimal": ("O(k^n) with pruning", "O(n)")}
EXPECT_SLOW = {"brute"}  # trying every assignment is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 8 and args[1] <= 4


def brute(nums, k):
    total = sum(nums)
    if total % k != 0:
        return False
    target = total // k
    sums = [0] * k

    def go(i):
        if i == len(nums):
            return all(s == target for s in sums)
        for g in range(k):
            sums[g] += nums[i]
            found = go(i + 1)
            sums[g] -= nums[i]
            if found:
                return True
        return False

    return go(0)


def better(nums, k):
    total = sum(nums)
    if total % k != 0:
        return False
    target = total // k
    n = len(nums)
    if max(nums) > target:
        return False
    partial = [-1] * (1 << n)  # partial[mask] = sum of the group currently being filled (mod target)
    partial[0] = 0
    for mask in range(1 << n):
        if partial[mask] == -1:
            continue
        for i in range(n):
            if not mask & (1 << i) and partial[mask] + nums[i] <= target:
                nxt = mask | (1 << i)
                if partial[nxt] == -1:
                    partial[nxt] = (partial[mask] + nums[i]) % target
    return partial[(1 << n) - 1] == 0


def optimal(nums, k):
    total = sum(nums)
    if total % k != 0:
        return False
    target = total // k
    nums = sorted(nums, reverse=True)
    if nums[0] > target:
        return False
    groups = [0] * k

    def place(i):
        if i == len(nums):
            return True
        tried = set()
        for g in range(k):
            if groups[g] + nums[i] <= target and groups[g] not in tried:
                tried.add(groups[g])
                groups[g] += nums[i]
                if place(i + 1):
                    return True
                groups[g] -= nums[i]
        return False

    return place(0)


def gen(rng):
    n = rng.randint(1, 10)
    return [[rng.randint(1, 6) for _ in range(n)], rng.randint(1, min(n, 4))]
