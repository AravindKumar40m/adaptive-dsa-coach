APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n log n)", "O(n)")}


def brute(numbers):
    n = len(numbers)
    return [sum(1 for j in range(i + 1, n) if numbers[j] < numbers[i]) for i in range(n)]


def optimal(numbers):
    n = len(numbers)
    values = sorted(set(numbers))
    rank = {v: i + 1 for i, v in enumerate(values)}
    size = len(values)
    tree = [0] * (size + 1)
    out = [0] * n
    for i in range(n - 1, -1, -1):
        r = rank[numbers[i]]
        total = 0
        k = r - 1
        while k > 0:
            total += tree[k]
            k -= k & -k
        out[i] = total
        k = r
        while k <= size:
            tree[k] += 1
            k += k & -k
    return out


def gen(rng):
    return [[rng.randint(-5, 9) for _ in range(rng.randint(0, 10))]]
