APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers, limit):
    count = 0
    for i in range(len(numbers)):
        product = 1
        for j in range(i, len(numbers)):
            product *= numbers[j]
            if product >= limit:
                break
            count += 1
    return count


def optimal(numbers, limit):
    if limit <= 1:
        return 0
    product = 1
    left = 0
    count = 0
    for right, x in enumerate(numbers):
        product *= x
        while product >= limit:
            product //= numbers[left]
            left += 1
        count += right - left + 1
    return count


def gen(rng):
    return [[rng.randint(1, 6) for _ in range(rng.randint(1, 9))], rng.randint(0, 60)]
