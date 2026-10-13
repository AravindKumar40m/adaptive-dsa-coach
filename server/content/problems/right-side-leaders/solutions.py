APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(numbers):
    count = 0
    for i in range(len(numbers)):
        if all(numbers[i] > numbers[j] for j in range(i + 1, len(numbers))):
            count += 1
    return count


def optimal(numbers):
    count = 0
    biggest = None
    for i in range(len(numbers) - 1, -1, -1):
        if biggest is None or numbers[i] > biggest:
            count += 1
            biggest = numbers[i]
    return count


def gen(rng):
    return [[rng.randint(-5, 9) for _ in range(rng.randint(1, 10))]]
