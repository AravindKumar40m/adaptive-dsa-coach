APPROACHES = {"brute": ("O(2^n * m)", "O(n)"), "optimal": ("O(n * m)", "O(m)")}


def brute(first, second):
    n = len(first)
    best = 0
    for mask in range(1 << n):
        picked = [first[i] for i in range(n) if mask >> i & 1]
        if len(picked) <= best:
            continue
        j = 0
        for ch in second:
            if j < len(picked) and ch == picked[j]:
                j += 1
        if j == len(picked):
            best = len(picked)
    return best


def optimal(first, second):
    prev = [0] * (len(second) + 1)
    for a in first:
        cur = [0] * (len(second) + 1)
        for j, b in enumerate(second, 1):
            if a == b:
                cur[j] = prev[j - 1] + 1
            else:
                cur[j] = max(prev[j], cur[j - 1])
        prev = cur
    return prev[-1]


def gen(rng):
    return ["".join(rng.choice("abc") for _ in range(rng.randint(0, 9))), "".join(rng.choice("abc") for _ in range(rng.randint(0, 10)))]
