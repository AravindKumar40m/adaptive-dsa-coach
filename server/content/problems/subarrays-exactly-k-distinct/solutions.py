APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(numbers, k):
    count = 0
    for i in range(len(numbers)):
        seen = set()
        for j in range(i, len(numbers)):
            seen.add(numbers[j])
            if len(seen) == k:
                count += 1
            elif len(seen) > k:
                break
    return count


def optimal(numbers, k):
    def at_most(limit):
        freq = {}
        left = 0
        total = 0
        for right, x in enumerate(numbers):
            freq[x] = freq.get(x, 0) + 1
            while len(freq) > limit:
                y = numbers[left]
                freq[y] -= 1
                if freq[y] == 0:
                    del freq[y]
                left += 1
            total += right - left + 1
        return total

    return at_most(k) - at_most(k - 1)


def gen(rng):
    return [[rng.randint(1, 4) for _ in range(rng.randint(0, 10))], rng.randint(1, 4)]
