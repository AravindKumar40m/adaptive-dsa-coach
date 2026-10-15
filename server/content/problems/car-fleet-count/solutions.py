APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n log n)", "O(n)")}


def brute(target, position, speed):
    from fractions import Fraction

    n = len(position)
    times = [Fraction(target - position[i], speed[i]) for i in range(n)]
    fleets = 0
    for i in range(n):
        ahead = [times[j] for j in range(n) if position[j] > position[i]]
        if not ahead or times[i] > max(ahead):
            fleets += 1
    return fleets


def optimal(target, position, speed):
    cars = sorted(zip(position, speed), reverse=True)
    fleets = 0
    lead_distance, lead_speed = 0, 1
    for pos, sp in cars:
        distance = target - pos
        if fleets == 0 or distance * lead_speed > lead_distance * sp:
            fleets += 1
            lead_distance, lead_speed = distance, sp
    return fleets


def gen(rng):
    target = rng.randint(5, 30)
    n = rng.randint(0, min(6, target))
    return [target, rng.sample(range(target), n), [rng.randint(1, 5) for _ in range(n)]]
