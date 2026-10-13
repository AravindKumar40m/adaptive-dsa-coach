APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(expression):
    s = expression.replace(" ", "")
    pos = [0]

    def number():
        start = pos[0]
        while pos[0] < len(s) and s[pos[0]].isdigit():
            pos[0] += 1
        return int(s[start:pos[0]])

    def term():
        if s[pos[0]] == "(":
            pos[0] += 1
            value = expr()
            pos[0] += 1
            return value
        return number()

    def expr():
        value = term()
        while pos[0] < len(s) and s[pos[0]] in "+-":
            op = s[pos[0]]
            pos[0] += 1
            rhs = term()
            value = value + rhs if op == "+" else value - rhs
        return value

    return expr()


def optimal(expression):
    result, number, sign = 0, 0, 1
    stack = []
    for ch in expression:
        if ch.isdigit():
            number = number * 10 + int(ch)
        elif ch == "+" or ch == "-":
            result += sign * number
            number = 0
            sign = 1 if ch == "+" else -1
        elif ch == "(":
            stack.append(result)
            stack.append(sign)
            result, sign = 0, 1
        elif ch == ")":
            result += sign * number
            number = 0
            result *= stack.pop()
            result += stack.pop()
    return result + sign * number


def _expr(rng, depth):
    parts = []
    for _ in range(rng.randint(1, 3)):
        if depth > 0 and rng.random() < 0.4:
            parts.append("(" + _expr(rng, depth - 1) + ")")
        else:
            parts.append(str(rng.randint(0, 20)))
    out = parts[0]
    for term in parts[1:]:
        out += rng.choice(["+", "-", " + ", " - "]) + term
    return out


def gen(rng):
    return [_expr(rng, 2)]
