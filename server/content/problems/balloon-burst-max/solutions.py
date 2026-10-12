APPROACHES = {"brute": ("O(n! * n)", "O(n^2)"), "optimal": ("O(n^3)", "O(n^2)")}


def brute(balloons):
    def best(arr):
        if not arr:
            return 0
        top = 0
        for i in range(len(arr)):
            left = arr[i - 1] if i > 0 else 1
            right = arr[i + 1] if i + 1 < len(arr) else 1
            gain = left * arr[i] * right + best(arr[:i] + arr[i + 1:])
            if gain > top:
                top = gain
        return top

    return best(balloons)


def optimal(balloons):
    nums = [1] + balloons + [1]
    n = len(nums)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):
        for lo in range(0, n - length):
            hi = lo + length
            top = 0
            for k in range(lo + 1, hi):
                gain = dp[lo][k] + nums[lo] * nums[k] * nums[hi] + dp[k][hi]
                if gain > top:
                    top = gain
            dp[lo][hi] = top
    return dp[0][n - 1]


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(1, 7))]]
