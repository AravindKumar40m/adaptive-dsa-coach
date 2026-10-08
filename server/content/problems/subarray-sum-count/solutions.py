APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(readings, target):
    count = 0
    for i in range(len(readings)):
        total = 0
        for j in range(i, len(readings)):
            total += readings[j]
            if total == target:
                count += 1
    return count


def optimal(readings, target):
    seen = {0: 1}
    running = count = 0
    for x in readings:
        running += x
        count += seen.get(running - target, 0)
        seen[running] = seen.get(running, 0) + 1
    return count


def gen(rng):
    return [[rng.randint(-3, 3) for _ in range(rng.randint(1, 15))], rng.randint(-3, 3)]
