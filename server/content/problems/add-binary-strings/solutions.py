APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(a, b):
    return bin(int(a, 2) + int(b, 2))[2:]


def optimal(a, b):
    i, j = len(a) - 1, len(b) - 1
    carry = 0
    digits = []
    while i >= 0 or j >= 0 or carry:
        total = carry
        if i >= 0:
            total += int(a[i])
            i -= 1
        if j >= 0:
            total += int(b[j])
            j -= 1
        digits.append(str(total % 2))
        carry = total // 2
    result = "".join(reversed(digits)).lstrip("0")
    return result or "0"


def gen(rng):
    return ["".join(rng.choice("01") for _ in range(rng.randint(1, 8))), "".join(rng.choice("01") for _ in range(rng.randint(1, 8)))]
