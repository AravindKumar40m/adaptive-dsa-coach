APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    return sorted(numbers)


def optimal(numbers):
    a = list(numbers)
    low, mid, high = 0, 0, len(a) - 1
    while mid <= high:
        if a[mid] == 0:
            a[low], a[mid] = a[mid], a[low]
            low += 1
            mid += 1
        elif a[mid] == 1:
            mid += 1
        else:
            a[mid], a[high] = a[high], a[mid]
            high -= 1
    return a


def gen(rng):
    return [[rng.randint(0, 2) for _ in range(rng.randint(0, 12))]]
