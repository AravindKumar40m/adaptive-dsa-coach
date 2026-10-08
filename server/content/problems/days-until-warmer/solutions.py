APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(temps):
    result = []
    for i in range(len(temps)):
        wait = 0
        for j in range(i + 1, len(temps)):
            if temps[j] > temps[i]:
                wait = j - i
                break
        result.append(wait)
    return result


def optimal(temps):
    result = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            result[j] = i - j
        stack.append(i)
    return result


def gen(rng):
    return [[rng.randint(-5, 9) for _ in range(rng.randint(1, 12))]]
