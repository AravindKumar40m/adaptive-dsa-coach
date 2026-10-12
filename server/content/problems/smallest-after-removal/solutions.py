APPROACHES = {"brute": ("O(C(n, k) * n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(digits, k):
    from itertools import combinations

    n = len(digits)
    best = None
    for gone in combinations(range(n), k):
        kept = "".join(d for i, d in enumerate(digits) if i not in gone)
        value = int(kept) if kept else 0
        if best is None or value < best:
            best = value
    return str(best)


def optimal(digits, k):
    stack = []
    for d in digits:
        while k and stack and stack[-1] > d:
            stack.pop()
            k -= 1
        stack.append(d)
    if k:
        stack = stack[:-k]
    return "".join(stack).lstrip("0") or "0"


def gen(rng):
    n = rng.randint(1, 8)
    digits = "".join(str(rng.randint(0, 9)) for _ in range(n))
    if n > 1 and digits[0] == "0":
        digits = str(rng.randint(1, 9)) + digits[1:]
    return [digits, rng.randint(0, n)]
