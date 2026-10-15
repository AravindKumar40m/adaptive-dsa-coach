APPROACHES = {"brute": ("O(n * m)", "O(m)"), "optimal": ("O(n + m)", "O(1)")}


def brute(note, magazine):
    pool = list(magazine)
    for ch in note:
        if ch in pool:
            pool.remove(ch)
        else:
            return False
    return True


def optimal(note, magazine):
    count = [0] * 26
    for ch in magazine:
        count[ord(ch) - 97] += 1
    for ch in note:
        k = ord(ch) - 97
        if count[k] == 0:
            return False
        count[k] -= 1
    return True


def gen(rng):
    magazine = "".join(rng.choice("abc") for _ in range(rng.randint(0, 9)))
    if rng.random() < 0.5 and magazine:
        note = "".join(ch for ch in magazine if rng.random() < 0.6)
    else:
        note = "".join(rng.choice("abc") for _ in range(rng.randint(0, 5)))
    return [note, magazine]
