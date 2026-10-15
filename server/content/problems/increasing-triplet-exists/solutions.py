APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    n = len(numbers)
    for i in range(n):
        for j in range(i + 1, n):
            if numbers[i] < numbers[j]:
                for k in range(j + 1, n):
                    if numbers[j] < numbers[k]:
                        return True
    return False


def optimal(numbers):
    first = second = float("inf")
    for x in numbers:
        if x <= first:
            first = x
        elif x <= second:
            second = x
        else:
            return True
    return False


def gen(rng):
    return [[rng.randint(1, 7) for _ in range(rng.randint(0, 9))]]
