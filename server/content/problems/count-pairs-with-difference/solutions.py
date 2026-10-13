APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers, gap):
    n = len(numbers)
    return sum(1 for i in range(n) for j in range(i + 1, n) if numbers[j] - numbers[i] == gap)


def optimal(numbers, gap):
    count = 0
    j = 0
    for i in range(len(numbers)):
        if j <= i:
            j = i + 1
        while j < len(numbers) and numbers[j] - numbers[i] < gap:
            j += 1
        if j < len(numbers) and numbers[j] - numbers[i] == gap:
            count += 1
    return count


def gen(rng):
    values = sorted(rng.sample(range(-10, 21), rng.randint(0, 8)))
    if len(values) >= 2 and rng.random() < 0.6:
        a, b = rng.sample(values, 2)
        gap = abs(a - b)
    else:
        gap = rng.randint(1, 8)
    return [values, gap]
