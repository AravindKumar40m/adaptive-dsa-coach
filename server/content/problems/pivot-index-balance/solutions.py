APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    for i in range(len(numbers)):
        if sum(numbers[:i]) == sum(numbers[i + 1:]):
            return i
    return -1


def optimal(numbers):
    total = sum(numbers)
    left = 0
    for i, x in enumerate(numbers):
        if left == total - left - x:
            return i
        left += x
    return -1


def gen(rng):
    if rng.random() < 0.6:
        left = [rng.randint(-3, 4) for _ in range(rng.randint(0, 4))]
        right = [rng.randint(-3, 4) for _ in range(rng.randint(0, 3))]
        right.append(sum(left) - sum(right))
        return [left + [rng.randint(-3, 4)] + right]
    return [[rng.randint(-3, 4) for _ in range(rng.randint(0, 9))]]
