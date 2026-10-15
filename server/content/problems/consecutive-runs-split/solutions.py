APPROACHES = {"brute": ("O(2^n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def BRUTE_OK(args):
    return len(args[0]) <= 12


def brute(numbers):
    runs = []

    def go(i):
        if i == len(numbers):
            return all(len(r) >= 3 for r in runs)
        x = numbers[i]
        for r in runs:
            if r[-1] == x - 1:
                r.append(x)
                if go(i + 1):
                    return True
                r.pop()
        runs.append([x])
        if go(i + 1):
            return True
        runs.pop()
        return False

    return go(0)


def optimal(numbers):
    count = {}
    for x in numbers:
        count[x] = count.get(x, 0) + 1
    need = {}
    for x in numbers:
        if count[x] == 0:
            continue
        count[x] -= 1
        if need.get(x, 0) > 0:
            need[x] -= 1
            need[x + 1] = need.get(x + 1, 0) + 1
        elif count.get(x + 1, 0) > 0 and count.get(x + 2, 0) > 0:
            count[x + 1] -= 1
            count[x + 2] -= 1
            need[x + 3] = need.get(x + 3, 0) + 1
        else:
            return False
    return True


def gen(rng):
    if rng.random() < 0.5:
        numbers = []
        for _ in range(rng.randint(0, 3)):
            start = rng.randint(1, 6)
            numbers += list(range(start, start + rng.randint(3, 4)))
        if numbers and rng.random() < 0.3:
            numbers.pop(rng.randrange(len(numbers)))
        return [sorted(numbers)]
    return [sorted(rng.randint(1, 6) for _ in range(rng.randint(0, 10)))]
