APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(tickets):
    for j in range(len(tickets)):
        if tickets[j] in tickets[:j]:
            return tickets[j]
    return -1


def optimal(tickets):
    seen = set()
    for x in tickets:
        if x in seen:
            return x
        seen.add(x)
    return -1


def gen(rng):
    n = rng.randint(1, 15)
    top = rng.choice([6, 10, 100])
    return [[rng.randint(0, top) for _ in range(n)]]
