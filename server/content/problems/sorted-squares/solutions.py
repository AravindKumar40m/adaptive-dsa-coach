APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(nums):
    return sorted(x * x for x in nums)


def optimal(nums):
    n = len(nums)
    result = [0] * n
    i, j = 0, n - 1
    for pos in range(n - 1, -1, -1):
        if abs(nums[i]) > abs(nums[j]):
            result[pos] = nums[i] * nums[i]
            i += 1
        else:
            result[pos] = nums[j] * nums[j]
            j -= 1
    return result


def gen(rng):
    return [sorted(rng.randint(-9, 9) for _ in range(rng.randint(1, 10)))]
