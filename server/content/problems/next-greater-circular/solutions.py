APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers):
    n = len(numbers)
    out = []
    for i in range(n):
        found = -1
        for step in range(1, n):
            v = numbers[(i + step) % n]
            if v > numbers[i]:
                found = v
                break
        out.append(found)
    return out


def optimal(numbers):
    n = len(numbers)
    out = [-1] * n
    stack = []
    for i in range(2 * n):
        x = numbers[i % n]
        while stack and numbers[stack[-1]] < x:
            out[stack.pop()] = x
        if i < n:
            stack.append(i)
    return out


def gen(rng):
    return [[rng.randint(1, 6) for _ in range(rng.randint(0, 8))]]
