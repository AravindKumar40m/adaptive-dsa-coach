APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    seen = set()
    for x in numbers:
        if x in seen:
            return x
        seen.add(x)
    return -1


def optimal(numbers):
    slow = fast = numbers[0]
    while True:
        slow = numbers[slow]
        fast = numbers[numbers[fast]]
        if slow == fast:
            break
    slow = numbers[0]
    while slow != fast:
        slow = numbers[slow]
        fast = numbers[fast]
    return slow


def gen(rng):
    n = rng.randint(3, 9)
    repeated = rng.randint(1, n)
    copies = rng.randint(2, n + 1)
    others = rng.sample([v for v in range(1, n + 1) if v != repeated], n + 1 - copies)
    out = [repeated] * copies + others
    rng.shuffle(out)
    return [out]
