APPROACHES = {"brute": ("O(time * 26)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(tasks, cooldown):
    counts = {}
    for t in tasks:
        counts[t] = counts.get(t, 0) + 1
    last = {}
    time = 0
    left = len(tasks)
    while left:
        best = None
        for t in sorted(counts):
            if counts[t] > 0 and (t not in last or time - last[t] > cooldown):
                if best is None or counts[t] > counts[best]:
                    best = t
        if best is not None:
            counts[best] -= 1
            last[best] = time
            left -= 1
        time += 1
    return time


def optimal(tasks, cooldown):
    if not tasks:
        return 0
    counts = {}
    for t in tasks:
        counts[t] = counts.get(t, 0) + 1
    top = max(counts.values())
    num_top = sum(1 for c in counts.values() if c == top)
    return max(len(tasks), (top - 1) * (cooldown + 1) + num_top)


def gen(rng):
    return ["".join(rng.choice("ABCD"[:rng.randint(1, 4)]) for _ in range(rng.randint(0, 10))), rng.randint(0, 4)]
