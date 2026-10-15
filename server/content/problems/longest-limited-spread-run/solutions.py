APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers, limit):
    best = 0
    n = len(numbers)
    for i in range(n):
        low = high = numbers[i]
        for j in range(i, n):
            low = min(low, numbers[j])
            high = max(high, numbers[j])
            if high - low > limit:
                break
            best = max(best, j - i + 1)
    return best


def optimal(numbers, limit):
    from collections import deque

    big = deque()
    small = deque()
    left = 0
    best = 0
    for right, x in enumerate(numbers):
        while big and numbers[big[-1]] <= x:
            big.pop()
        big.append(right)
        while small and numbers[small[-1]] >= x:
            small.pop()
        small.append(right)
        while numbers[big[0]] - numbers[small[0]] > limit:
            left += 1
            if big[0] < left:
                big.popleft()
            if small[0] < left:
                small.popleft()
        best = max(best, right - left + 1)
    return best


def gen(rng):
    return [[rng.randint(1, 12) for _ in range(rng.randint(0, 10))], rng.randint(0, 8)]
