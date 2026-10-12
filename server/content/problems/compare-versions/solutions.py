APPROACHES = {"brute": ("O(n + m)", "O(n + m)"), "optimal": ("O(n + m)", "O(1)")}


def brute(first, second):
    a = [int(x) for x in first.split(".")]
    b = [int(x) for x in second.split(".")]
    size = max(len(a), len(b))
    a += [0] * (size - len(a))
    b += [0] * (size - len(b))
    return (a > b) - (a < b)


def optimal(first, second):
    i = j = 0
    while i < len(first) or j < len(second):
        x = 0
        while i < len(first) and first[i] != ".":
            x = x * 10 + int(first[i])
            i += 1
        y = 0
        while j < len(second) and second[j] != ".":
            y = y * 10 + int(second[j])
            j += 1
        if x != y:
            return -1 if x < y else 1
        i += 1
        j += 1
    return 0


def gen(rng):
    a = [rng.randint(0, 12) for _ in range(rng.randint(1, 4))]
    if rng.random() < 0.5:
        b = a[:]
        if rng.random() < 0.5:
            b += [0] * rng.randint(1, 2)
        if rng.random() < 0.4:
            k = rng.randrange(len(b))
            b[k] = max(0, b[k] + rng.choice([-1, 1]))
    else:
        b = [rng.randint(0, 12) for _ in range(rng.randint(1, 4))]

    def text(parts):
        return ".".join(str(v).zfill(rng.randint(1, 3)) for v in parts)

    return [text(a), text(b)]
