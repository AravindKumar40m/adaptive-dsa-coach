APPROACHES = {"brute": ("O(n + m)", "O(n + m)"), "optimal": ("O(n + m)", "O(1)")}


def brute(first, second):
    def final(s):
        stack = []
        for ch in s:
            if ch == "#":
                if stack:
                    stack.pop()
            else:
                stack.append(ch)
        return stack

    return final(first) == final(second)


def optimal(first, second):
    i, j = len(first) - 1, len(second) - 1
    skip_a = skip_b = 0
    while i >= 0 or j >= 0:
        while i >= 0:
            if first[i] == "#":
                skip_a += 1
                i -= 1
            elif skip_a > 0:
                skip_a -= 1
                i -= 1
            else:
                break
        while j >= 0:
            if second[j] == "#":
                skip_b += 1
                j -= 1
            elif skip_b > 0:
                skip_b -= 1
                j -= 1
            else:
                break
        if i >= 0 and j >= 0:
            if first[i] != second[j]:
                return False
        elif i >= 0 or j >= 0:
            return False
        i -= 1
        j -= 1
    return True


def gen(rng):
    def make():
        return "".join(rng.choice("ab#") for _ in range(rng.randint(1, 7)))

    first = make()
    if rng.random() < 0.5:
        return [first, first + rng.choice(["", "c#", "#"])]  # often the same final text
    return [first, make()]
