APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(heights):
    n = len(heights)
    best = 0
    for i in range(n):
        for j in range(i + 2, n):
            part = heights[i:j + 1]
            peak = part.index(max(part))
            if 0 < peak < len(part) - 1 and all(part[k] < part[k + 1] for k in range(peak)) and all(part[k] > part[k + 1] for k in range(peak, len(part) - 1)):
                best = max(best, len(part))
    return best


def optimal(heights):
    n = len(heights)
    best = 0
    for i in range(1, n - 1):
        if heights[i - 1] < heights[i] > heights[i + 1]:
            left = i - 1
            while left > 0 and heights[left - 1] < heights[left]:
                left -= 1
            right = i + 1
            while right < n - 1 and heights[right] > heights[right + 1]:
                right += 1
            best = max(best, right - left + 1)
    return best


def gen(rng):
    return [[rng.randint(0, 4) for _ in range(rng.randint(1, 10))]]
