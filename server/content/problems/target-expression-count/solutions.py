APPROACHES = {"brute": ("O(4^n * n)", "O(n)"), "optimal": ("O(4^n)", "O(n)")}


def brute(digits, target):
    from itertools import product

    n = len(digits)
    count = 0
    for ops in product(["", "+", "-", "*"], repeat=n - 1):
        expr = digits[0]
        for op, d in zip(ops, digits[1:]):
            expr += op + d
        parts = expr.replace("+", " ").replace("-", " ").replace("*", " ").split()
        if any(len(p) > 1 and p[0] == "0" for p in parts):
            continue
        if eval(expr) == target:
            count += 1
    return count


def optimal(digits, target):
    n = len(digits)

    def go(pos, value, last):
        if pos == n:
            return 1 if value == target else 0
        total = 0
        for end in range(pos + 1, n + 1):
            if end - pos > 1 and digits[pos] == "0":
                break
            num = int(digits[pos:end])
            if pos == 0:
                total += go(end, num, num)
            else:
                total += go(end, value + num, num)
                total += go(end, value - num, -num)
                total += go(end, value - last + last * num, last * num)
        return total

    return go(0, 0, 0)


def gen(rng):
    n = rng.randint(2, 7)
    digits = "".join(rng.choice("1122334") for _ in range(n))
    if rng.random() < 0.5:
        expr = digits[0]
        for d in digits[1:]:
            expr += rng.choice(["", "+", "-", "*"]) + d
        parts = expr.replace("+", " ").replace("-", " ").replace("*", " ").split()
        if any(len(p) > 1 and p[0] == "0" for p in parts):
            return [digits, rng.randint(-20, 60)]
        return [digits, eval(expr)]
    return [digits, rng.randint(-20, 60)]
