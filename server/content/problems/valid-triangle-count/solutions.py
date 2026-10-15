APPROACHES = {"brute": ("O(n^3)", "O(1)"), "optimal": ("O(n^2)", "O(1)")}


def brute(sides):
    n = len(sides)
    count = 0
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                a, b, c = sides[i], sides[j], sides[k]
                if a + b > c and a + c > b and b + c > a:
                    count += 1
    return count


def optimal(sides):
    a = sorted(sides)
    count = 0
    for k in range(len(a) - 1, 1, -1):
        i, j = 0, k - 1
        while i < j:
            if a[i] + a[j] > a[k]:
                count += j - i
                j -= 1
            else:
                i += 1
    return count


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(0, 9))]]
