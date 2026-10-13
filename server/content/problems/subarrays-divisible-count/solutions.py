APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n + k)", "O(k)")}


def brute(numbers, k):
    count = 0
    for i in range(len(numbers)):
        total = 0
        for j in range(i, len(numbers)):
            total += numbers[j]
            if total % k == 0:
                count += 1
    return count


def optimal(numbers, k):
    seen = {0: 1}
    total = 0
    answer = 0
    for x in numbers:
        total = (total + x) % k
        answer += seen.get(total, 0)
        seen[total] = seen.get(total, 0) + 1
    return answer


def gen(rng):
    return [[rng.randint(-6, 9) for _ in range(rng.randint(0, 9))], rng.randint(1, 6)]
