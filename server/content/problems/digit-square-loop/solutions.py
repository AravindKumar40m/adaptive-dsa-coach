APPROACHES = {"brute": ("O(steps)", "O(1)"), "optimal": ("O(steps)", "O(steps)")}


def brute(number):
    for _ in range(1000):
        if number == 1:
            return True
        number = sum(int(d) ** 2 for d in str(number))
    return False


def optimal(number):
    seen = set()
    while number != 1 and number not in seen:
        seen.add(number)
        number = sum(int(d) ** 2 for d in str(number))
    return number == 1


def _happy(n):
    seen = set()
    while n != 1 and n not in seen:
        seen.add(n)
        n = sum(int(d) ** 2 for d in str(n))
    return n == 1


def gen(rng):
    want = rng.random() < 0.5
    n = rng.randint(1, 3000)
    for _ in range(80):
        n = rng.randint(1, 3000) if rng.random() < 0.8 else rng.randint(1, 10 ** 9)
        if _happy(n) == want:
            break
    return [n]
