APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(heights):
    best = 0
    for i in range(len(heights)):
        lowest = heights[i]
        for j in range(i, len(heights)):
            lowest = min(lowest, heights[j])
            best = max(best, lowest * (j - i + 1))
    return best


def optimal(heights):
    stack = []
    best = 0
    for i, h in enumerate(heights + [0]):
        while stack and heights[stack[-1]] >= h:
            height = heights[stack.pop()]
            left = stack[-1] if stack else -1
            best = max(best, height * (i - left - 1))
        stack.append(i)
    return best


def gen(rng):
    return [[rng.randint(0, 7) for _ in range(rng.randint(1, 10))]]
