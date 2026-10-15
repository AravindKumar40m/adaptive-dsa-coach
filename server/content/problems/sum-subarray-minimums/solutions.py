APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    total = 0
    n = len(numbers)
    for i in range(n):
        smallest = numbers[i]
        for j in range(i, n):
            smallest = min(smallest, numbers[j])
            total += smallest
    return total % 1000000007


def optimal(numbers):
    n = len(numbers)
    left = [0] * n
    right = [0] * n
    stack = []
    for i in range(n):
        while stack and numbers[stack[-1]] > numbers[i]:
            stack.pop()
        left[i] = i - (stack[-1] if stack else -1)
        stack.append(i)
    stack = []
    for i in range(n - 1, -1, -1):
        while stack and numbers[stack[-1]] >= numbers[i]:
            stack.pop()
        right[i] = (stack[-1] if stack else n) - i
        stack.append(i)
    total = 0
    for i in range(n):
        total += numbers[i] * left[i] * right[i]
    return total % 1000000007


def gen(rng):
    return [[rng.randint(1, 9) for _ in range(rng.randint(0, 10))]]
