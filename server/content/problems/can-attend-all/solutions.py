APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n log n)", "O(1)")}


def brute(meetings):
    for i in range(len(meetings)):
        for j in range(i + 1, len(meetings)):
            a, b = meetings[i], meetings[j]
            if a[0] < b[1] and b[0] < a[1]:
                return False
    return True


def optimal(meetings):
    ordered = sorted(meetings)
    for i in range(1, len(ordered)):
        if ordered[i][0] < ordered[i - 1][1]:
            return False
    return True


def gen(rng):
    out = []
    if rng.random() < 0.5:
        t = 0
        for _ in range(rng.randint(0, 5)):
            t += rng.randint(0, 2)
            end = t + rng.randint(1, 3)
            out.append([t, end])
            t = end
        rng.shuffle(out)
    else:
        for _ in range(rng.randint(0, 6)):
            s = rng.randint(0, 12)
            out.append([s, s + rng.randint(1, 4)])
    return [out]
