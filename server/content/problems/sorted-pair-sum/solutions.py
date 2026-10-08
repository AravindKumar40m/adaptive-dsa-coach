APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(scores, target):
    for i in range(len(scores)):
        for j in range(i + 1, len(scores)):
            if scores[i] + scores[j] == target:
                return True
    return False


def optimal(scores, target):
    i, j = 0, len(scores) - 1
    while i < j:
        s = scores[i] + scores[j]
        if s == target:
            return True
        if s < target:
            i += 1
        else:
            j -= 1
    return False


def gen(rng):
    n = rng.randint(1, 15)
    return [sorted(rng.randint(-10, 20) for _ in range(n)), rng.randint(-10, 30)]
