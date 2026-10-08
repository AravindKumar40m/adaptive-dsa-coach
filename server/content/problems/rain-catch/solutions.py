APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(heights):
    total = 0
    for i in range(len(heights)):
        left = max(heights[:i + 1])
        right = max(heights[i:])
        total += min(left, right) - heights[i]
    return total


def optimal(heights):
    left, right = 0, len(heights) - 1
    left_max = right_max = total = 0
    while left < right:
        if heights[left] < heights[right]:
            left_max = max(left_max, heights[left])
            total += left_max - heights[left]
            left += 1
        else:
            right_max = max(right_max, heights[right])
            total += right_max - heights[right]
            right -= 1
    return total


def gen(rng):
    return [[rng.randint(0, 6) for _ in range(rng.randint(1, 12))]]
