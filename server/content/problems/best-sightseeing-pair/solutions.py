APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(values):
    best = None
    for i in range(len(values)):
        for j in range(i + 1, len(values)):
            score = values[i] + values[j] + i - j
            if best is None or score > best:
                best = score
    return best


def optimal(values):
    best_left = values[0]
    answer = None
    for j in range(1, len(values)):
        score = best_left + values[j] - j
        if answer is None or score > answer:
            answer = score
        best_left = max(best_left, values[j] + j)
    return answer


def gen(rng):
    return [[rng.randint(1, 9) for _ in range(rng.randint(2, 9))]]
