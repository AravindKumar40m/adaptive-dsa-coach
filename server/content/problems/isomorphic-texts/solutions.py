APPROACHES = {"brute": ("O(n * 26)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(first, second):
    return [first.index(c) for c in first] == [second.index(c) for c in second]


def optimal(first, second):
    forward, backward = {}, {}
    for a, b in zip(first, second):
        if forward.get(a, b) != b or backward.get(b, a) != a:
            return False
        forward[a] = b
        backward[b] = a
    return True


def gen(rng):
    n = rng.randint(0, 8)
    first = "".join(rng.choice("abc") for _ in range(n))
    if rng.random() < 0.5:
        letters = list("xyzw")
        rng.shuffle(letters)
        mapping = {c: letters[i] for i, c in enumerate("abc")}
        second = "".join(mapping[c] for c in first)
        if rng.random() < 0.3 and n:
            i = rng.randrange(n)
            second = second[:i] + rng.choice("xyzw") + second[i + 1:]
    else:
        second = "".join(rng.choice("xyz") for _ in range(n))
    return [first, second]
