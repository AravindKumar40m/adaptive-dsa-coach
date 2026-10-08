APPROACHES = {"brute": ("O(n * k)", "O(1)"), "optimal": ("O(n)", "O(k)")}


def brute(temps, k):
    return sum(max(temps[i:i + k]) for i in range(len(temps) - k + 1))


def optimal(temps, k):
    from collections import deque

    window = deque()
    total = 0
    for i, x in enumerate(temps):
        while window and temps[window[-1]] <= x:
            window.pop()
        window.append(i)
        if window[0] <= i - k:
            window.popleft()
        if i >= k - 1:
            total += temps[window[0]]
    return total


def gen(rng):
    n = rng.randint(1, 12)
    return [[rng.randint(-9, 9) for _ in range(n)], rng.randint(1, n)]
