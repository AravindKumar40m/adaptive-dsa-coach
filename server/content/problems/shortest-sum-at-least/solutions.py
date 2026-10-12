APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers, target):
    n = len(numbers)
    best = n + 1
    for i in range(n):
        total = 0
        for j in range(i, n):
            total += numbers[j]
            if total >= target:
                best = min(best, j - i + 1)
                break
    return best if best <= n else -1


def optimal(numbers, target):
    from collections import deque

    prefix = [0]
    for x in numbers:
        prefix.append(prefix[-1] + x)
    best = len(numbers) + 1
    window = deque()
    for j, p in enumerate(prefix):
        while window and p - prefix[window[0]] >= target:
            best = min(best, j - window.popleft())
        while window and prefix[window[-1]] >= p:
            window.pop()
        window.append(j)
    return best if best <= len(numbers) else -1


def gen(rng):
    return [[rng.randint(-5, 9) for _ in range(rng.randint(1, 10))], rng.randint(1, 15)]
