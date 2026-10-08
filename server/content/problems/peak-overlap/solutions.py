APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n log n)", "O(n)")}


def brute(talks):
    best = 0
    for start, _ in talks:
        running = sum(1 for s, e in talks if s <= start < e)
        best = max(best, running)
    return best


def optimal(talks):
    starts = sorted(t[0] for t in talks)
    ends = sorted(t[1] for t in talks)
    i = j = running = best = 0
    while i < len(starts):
        if starts[i] < ends[j]:
            running += 1
            i += 1
            best = max(best, running)
        else:
            running -= 1
            j += 1
    return best


def gen(rng):
    talks = []
    for _ in range(rng.randint(1, 10)):
        s = rng.randint(0, 20)
        talks.append([s, s + rng.randint(1, 8)])
    return [talks]
