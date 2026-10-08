APPROACHES = {"brute": ("O(n^2 * L log L)", "O(n * L)"), "optimal": ("O(n * L log L)", "O(n * L)")}


def brute(words):
    seen = []
    for w in words.split(" "):
        if not any(sorted(w) == sorted(s) for s in seen):
            seen.append(w)
    return len(seen)


def optimal(words):
    return len({"".join(sorted(w)) for w in words.split(" ")})


def gen(rng):
    return [" ".join("".join(rng.choice("abc") for _ in range(rng.randint(1, 3))) for _ in range(rng.randint(1, 6)))]
