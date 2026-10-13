APPROACHES = {"brute": ("O(n * m)", "O(n + m)"), "optimal": ("O(n * m)", "O(n + m)")}


def brute(first, second):
    return str(int(first) * int(second))


def optimal(first, second):
    if first == "0" or second == "0":
        return "0"
    result = [0] * (len(first) + len(second))
    for i in range(len(first) - 1, -1, -1):
        for j in range(len(second) - 1, -1, -1):
            total = int(first[i]) * int(second[j]) + result[i + j + 1]
            result[i + j + 1] = total % 10
            result[i + j] += total // 10
    start = 0
    while start < len(result) - 1 and result[start] == 0:
        start += 1
    return "".join(str(d) for d in result[start:])


def gen(rng):
    def number():
        if rng.random() < 0.1:
            return "0"
        return str(rng.randint(1, 10 ** rng.randint(1, 6)))

    return [number(), number()]
