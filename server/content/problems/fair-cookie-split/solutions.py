APPROACHES = {"brute": ("O(k^n)", "O(k)"), "optimal": ("O(k^n) worst case, pruned", "O(n)")}


def brute(bags, children):
    from itertools import product

    best = None
    for assign in product(range(children), repeat=len(bags)):
        totals = [0] * children
        for bag, who in zip(bags, assign):
            totals[who] += bag
        worst = max(totals)
        if best is None or worst < best:
            best = worst
    return best


def optimal(bags, children):
    items = sorted(bags, reverse=True)
    totals = [0] * children
    best = [sum(items) + 1]

    def go(i):
        if i == len(items):
            best[0] = min(best[0], max(totals))
            return
        seen = set()
        for c in range(children):
            if totals[c] in seen:
                continue
            seen.add(totals[c])
            if totals[c] + items[i] >= best[0]:
                continue
            totals[c] += items[i]
            go(i + 1)
            totals[c] -= items[i]

    go(0)
    return best[0]


def gen(rng):
    n = rng.randint(1, 7)
    return [[rng.randint(1, 9) for _ in range(n)], rng.randint(1, min(4, n))]
