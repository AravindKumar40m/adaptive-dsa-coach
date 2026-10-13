APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    n = len(text)
    best = 0
    for i in range(n):
        depth = 0
        for j in range(i, n):
            depth += 1 if text[j] == "(" else -1
            if depth < 0:
                break
            if depth == 0:
                best = max(best, j - i + 1)
    return best


def optimal(text):
    stack = [-1]
    best = 0
    for i, ch in enumerate(text):
        if ch == "(":
            stack.append(i)
        else:
            stack.pop()
            if not stack:
                stack.append(i)
            else:
                best = max(best, i - stack[-1])
    return best


def gen(rng):
    return ["".join(rng.choice("(()") if rng.random() < 0.5 else rng.choice("()") for _ in range(rng.randint(0, 12)))]
