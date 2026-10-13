APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    n = len(numbers)
    if n == 0:
        return 0
    up = [1] * n
    down = [1] * n
    for i in range(n):
        for j in range(i):
            if numbers[j] < numbers[i]:
                up[i] = max(up[i], down[j] + 1)
            elif numbers[j] > numbers[i]:
                down[i] = max(down[i], up[j] + 1)
    return max(max(up), max(down))


def optimal(numbers):
    if not numbers:
        return 0
    up = down = 1
    for i in range(1, len(numbers)):
        if numbers[i] > numbers[i - 1]:
            up = down + 1
        elif numbers[i] < numbers[i - 1]:
            down = up + 1
    return max(up, down)


def gen(rng):
    return [[rng.randint(0, 5) for _ in range(rng.randint(0, 9))]]
