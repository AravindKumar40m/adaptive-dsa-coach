APPROACHES = {"brute": ("O(n^2)", "O(1)"), "better": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    candidate = 1
    while candidate in numbers:
        candidate += 1
    return candidate


def better(numbers):
    seen = set(numbers)
    candidate = 1
    while candidate in seen:
        candidate += 1
    return candidate


def optimal(numbers):
    a = list(numbers)
    n = len(a)
    for i in range(n):
        while 1 <= a[i] <= n and a[a[i] - 1] != a[i]:
            j = a[i] - 1
            a[i], a[j] = a[j], a[i]
    for i in range(n):
        if a[i] != i + 1:
            return i + 1
    return n + 1


def gen(rng):
    n = rng.randint(1, 10)
    k = rng.randint(0, n)  # the list holds 1..k, so the answer is usually above 1
    values = list(range(1, k + 1)) + [rng.randint(-3, 15) for _ in range(n - k)]
    rng.shuffle(values)
    return [values]
