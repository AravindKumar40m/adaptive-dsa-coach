APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(first, second, third):
    k = min(len(first), len(second), len(third))
    while k > 0:
        if second.startswith(first[:k]) and third.startswith(first[:k]):
            return k
        k -= 1
    return 0


def optimal(first, second, third):
    i = 0
    while i < len(first) and i < len(second) and i < len(third) and first[i] == second[i] == third[i]:
        i += 1
    return i


def gen(rng):
    base = "".join(rng.choice("ab") for _ in range(rng.randint(0, 4)))
    return ["".join([base] + [rng.choice("ab") for _ in range(rng.randint(0, 3))]) for _ in range(3)]
