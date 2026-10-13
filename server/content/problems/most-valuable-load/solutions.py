APPROACHES = {"brute": ("O(total boxes)", "O(total boxes)"), "optimal": ("O(n log n)", "O(1)")}


def brute(boxes, truck_size):
    every_box = []
    for count, units in boxes:
        every_box += [units] * count
    every_box.sort(reverse=True)
    return sum(every_box[:truck_size])


def optimal(boxes, truck_size):
    room = truck_size
    total = 0
    for count, units in sorted(boxes, key=lambda kind: -kind[1]):
        take = min(count, room)
        total += take * units
        room -= take
        if room == 0:
            break
    return total


def gen(rng):
    return [[[rng.randint(1, 5), rng.randint(1, 9)] for _ in range(rng.randint(0, 5))], rng.randint(0, 14)]
