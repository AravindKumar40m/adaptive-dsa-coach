APPROACHES = {"brute": ("O(C(n, k))", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(num, k):
    from itertools import combinations

    n = len(num)
    best = None
    for removed in combinations(range(n), k):
        gone = set(removed)
        value = int("".join(num[i] for i in range(n) if i not in gone) or "0")
        if best is None or value < best:
            best = value
    return str(best)


def optimal(num, k):
    stack = []
    for d in num:
        while k > 0 and stack and stack[-1] > d:
            stack.pop()
            k -= 1
        stack.append(d)
    while k > 0:
        stack.pop()
        k -= 1
    result = "".join(stack).lstrip("0")
    return result or "0"


def gen(rng):
    num = "".join(rng.choice("0123456789") for _ in range(rng.randint(1, 9)))
    return [num, rng.randint(0, len(num))]
