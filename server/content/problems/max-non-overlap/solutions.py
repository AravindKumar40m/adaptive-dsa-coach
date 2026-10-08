APPROACHES = {"brute": ("O(n * 2^n)", "O(n)"), "optimal": ("O(n log n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # trying every subset is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 12


def brute(jobs):
    n = len(jobs)
    best = 0
    for mask in range(1 << n):
        chosen = sorted((jobs[i] for i in range(n) if mask >> i & 1), key=lambda j: (j[0], j[1]))
        if all(chosen[k][1] <= chosen[k + 1][0] for k in range(len(chosen) - 1)):
            best = max(best, len(chosen))
    return best


def optimal(jobs):
    last_end = -1
    count = 0
    for start, end in sorted(jobs, key=lambda j: j[1]):
        if start >= last_end:
            count += 1
            last_end = end
    return count


def gen(rng):
    jobs = []
    for _ in range(rng.randint(1, 8)):
        s = rng.randint(0, 15)
        jobs.append([s, s + rng.randint(1, 6)])
    return [jobs]
