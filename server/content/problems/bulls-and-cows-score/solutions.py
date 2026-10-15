APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(secret, guess):
    bulls = 0
    pool = []
    rest = []
    for s, g in zip(secret, guess):
        if s == g:
            bulls += 1
        else:
            pool.append(s)
            rest.append(g)
    cows = 0
    for g in rest:
        if g in pool:
            pool.remove(g)
            cows += 1
    return "%dA%dB" % (bulls, cows)


def optimal(secret, guess):
    bulls = 0
    secret_count = [0] * 10
    guess_count = [0] * 10
    for s, g in zip(secret, guess):
        if s == g:
            bulls += 1
        else:
            secret_count[int(s)] += 1
            guess_count[int(g)] += 1
    cows = sum(min(secret_count[d], guess_count[d]) for d in range(10))
    return "%dA%dB" % (bulls, cows)


def gen(rng):
    n = rng.randint(0, 7)
    digits = rng.choice(["0123456789", "0123", "12"])
    return ["".join(rng.choice(digits) for _ in range(n)), "".join(rng.choice(digits) for _ in range(n))]
