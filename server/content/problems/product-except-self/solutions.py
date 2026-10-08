APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(nums):
    result = []
    for i in range(len(nums)):
        product = 1
        for j in range(len(nums)):
            if j != i:
                product *= nums[j]
        result.append(product)
    return result


def optimal(nums):
    n = len(nums)
    result = [1] * n
    left = 1
    for i in range(n):
        result[i] = left
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        result[i] *= right
        right *= nums[i]
    return result


def gen(rng):
    return [[rng.randint(-4, 4) for _ in range(rng.randint(2, 8))]]
