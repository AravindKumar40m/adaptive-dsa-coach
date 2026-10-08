APPROACHES = {"brute": ("O(output length)", "O(depth)"), "optimal": ("O(output length)", "O(output length)")}


def brute(code):
    # recursive descent: parse() reads letters and k[...] groups until a closing bracket or the end
    def parse(i):
        out = []
        while i < len(code) and code[i] != "]":
            if code[i].isdigit():
                j = i
                while code[j].isdigit():
                    j += 1
                count = int(code[i:j])
                inner, i = parse(j + 1)  # code[j] is "["
                out.append(inner * count)
                i += 1  # skip the "]"
            else:
                out.append(code[i])
                i += 1
        return "".join(out), i

    return parse(0)[0]


def optimal(code):
    stack = []
    current = ""
    number = 0
    for ch in code:
        if ch.isdigit():
            number = number * 10 + int(ch)
        elif ch == "[":
            stack.append((current, number))
            current = ""
            number = 0
        elif ch == "]":
            previous, k = stack.pop()
            current = previous + current * k
        else:
            current += ch
    return current


def gen(rng):
    def make(depth):
        parts = []
        for _ in range(rng.randint(1, 3)):
            if depth > 0 and rng.random() < 0.5:
                parts.append(str(rng.randint(1, 3)) + "[" + make(depth - 1) + "]")
            else:
                parts.append("".join(rng.choice("abc") for _ in range(rng.randint(1, 2))))
        return "".join(parts)

    return [make(2)]
