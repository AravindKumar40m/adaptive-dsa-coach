APPROACHES = {"brute": ("O((n + m) log(n + m))", "O(n + m)"), "optimal": ("O(n + m)", "O(n + m)")}


def brute(first, second):
    return sorted(first + second)


def optimal(first, second):
    i = j = 0
    result = []
    while i < len(first) and j < len(second):
        if first[i] <= second[j]:
            result.append(first[i])
            i += 1
        else:
            result.append(second[j])
            j += 1
    result.extend(first[i:])
    result.extend(second[j:])
    return result


def gen(rng):
    first = sorted(rng.randint(-5, 9) for _ in range(rng.randint(0, 6)))
    second = sorted(rng.randint(-5, 9) for _ in range(rng.randint(1 if not first else 0, 6)))
    return [first, second]
