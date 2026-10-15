APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(numbers):
    items = list(numbers)
    swaps = 0
    for i in range(len(items)):
        smallest = i
        for j in range(i + 1, len(items)):
            if items[j] < items[smallest]:
                smallest = j
        if smallest != i:
            items[i], items[smallest] = items[smallest], items[i]
            swaps += 1
    return swaps


def optimal(numbers):
    n = len(numbers)
    order = sorted(range(n), key=lambda i: numbers[i])
    target = [0] * n
    for rank, i in enumerate(order):
        target[i] = rank
    visited = [False] * n
    cycles = 0
    for i in range(n):
        if not visited[i]:
            cycles += 1
            j = i
            while not visited[j]:
                visited[j] = True
                j = target[j]
    return n - cycles


def gen(rng):
    return [rng.sample(range(-9, 20), rng.randint(0, 8))]
