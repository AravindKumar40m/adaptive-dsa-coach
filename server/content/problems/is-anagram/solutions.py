APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(first, second):
    return sorted(first) == sorted(second)


def optimal(first, second):
    if len(first) != len(second):
        return False
    count = [0] * 26
    for ch in first:
        count[ord(ch) - 97] += 1
    for ch in second:
        count[ord(ch) - 97] -= 1
        if count[ord(ch) - 97] < 0:
            return False
    return True


def gen(rng):
    first = "".join(rng.choice("abc") for _ in range(rng.randint(1, 6)))
    if rng.random() < 0.5:
        letters = list(first)
        rng.shuffle(letters)
        return [first, "".join(letters)]
    return [first, "".join(rng.choice("abc") for _ in range(rng.randint(1, 6)))]
