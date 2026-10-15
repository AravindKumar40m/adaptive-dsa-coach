APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    n = len(numbers)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                if numbers[i] < numbers[k] < numbers[j]:
                    return True
    return False


def optimal(numbers):
    third = float("-inf")
    stack = []
    for x in reversed(numbers):
        if x < third:
            return True
        while stack and stack[-1] < x:
            third = stack.pop()
        stack.append(x)
    return False


def gen(rng):
    return [[rng.randint(1, 8) for _ in range(rng.randint(0, 9))]]
