APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    n = len(numbers)
    best = min(n, 1)
    for i in range(n):
        length = 1
        previous_sign = 0
        for j in range(i + 1, n):
            sign = (numbers[j] > numbers[j - 1]) - (numbers[j] < numbers[j - 1])
            if sign == 0 or sign == previous_sign:
                break
            length += 1
            previous_sign = sign
        best = max(best, length)
    return best


def optimal(numbers):
    if not numbers:
        return 0
    up = down = 1
    best = 1
    for i in range(1, len(numbers)):
        if numbers[i] > numbers[i - 1]:
            up, down = down + 1, 1
        elif numbers[i] < numbers[i - 1]:
            up, down = 1, up + 1
        else:
            up = down = 1
        best = max(best, up, down)
    return best


def gen(rng):
    return [[rng.randint(1, 5) for _ in range(rng.randint(0, 10))]]
