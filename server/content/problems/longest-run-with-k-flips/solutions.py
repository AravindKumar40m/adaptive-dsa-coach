APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(bits, k):
    best = 0
    for i in range(len(bits)):
        zeros = 0
        for j in range(i, len(bits)):
            zeros += 1 - bits[j]
            if zeros > k:
                break
            best = max(best, j - i + 1)
    return best


def optimal(bits, k):
    left = 0
    zeros = 0
    best = 0
    for right, b in enumerate(bits):
        zeros += 1 - b
        while zeros > k:
            zeros -= 1 - bits[left]
            left += 1
        best = max(best, right - left + 1)
    return best


def gen(rng):
    return [[rng.randint(0, 1) for _ in range(rng.randint(0, 12))], rng.randint(0, 4)]
