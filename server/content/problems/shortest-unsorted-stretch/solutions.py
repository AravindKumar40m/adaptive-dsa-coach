APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    ordered = sorted(numbers)
    different = [i for i in range(len(numbers)) if numbers[i] != ordered[i]]
    return 0 if not different else different[-1] - different[0] + 1


def optimal(numbers):
    n = len(numbers)
    end = -1
    biggest = None
    for i in range(n):
        if biggest is not None and numbers[i] < biggest:
            end = i
        else:
            biggest = numbers[i]
    start = 0
    smallest = None
    for i in range(n - 1, -1, -1):
        if smallest is not None and numbers[i] > smallest:
            start = i
        else:
            smallest = numbers[i]
    return end - start + 1


def gen(rng):
    return [[rng.randint(1, 8) for _ in range(rng.randint(0, 10))]]
