APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(people, step):
    seats = list(range(1, people + 1))
    i = 0
    while len(seats) > 1:
        i = (i + step - 1) % len(seats)
        seats.pop(i)
    return seats[0]


def optimal(people, step):
    survivor = 0
    for n in range(2, people + 1):
        survivor = (survivor + step) % n
    return survivor + 1


def gen(rng):
    return [rng.randint(1, 15), rng.randint(1, 9)]
