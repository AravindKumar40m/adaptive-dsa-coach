APPROACHES = {"brute": ("O(log n * steps)", "O(steps)"), "optimal": ("O(1)", "O(1)")}


def brute(number):
    if number < 10:
        return number
    return brute(sum(int(d) for d in str(number)))


def optimal(number):
    return 0 if number == 0 else 1 + (number - 1) % 9


def gen(rng):
    return [rng.randint(0, 10 ** rng.choice([2, 4, 6, 9]))]
