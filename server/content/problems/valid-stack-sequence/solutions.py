APPROACHES = {"brute": ("O(2^n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(pushed, popped):
    n = len(pushed)

    def go(i, j, stack):
        if j == n:
            return True
        if stack and stack[-1] == popped[j] and go(i, j + 1, stack[:-1]):
            return True
        if i < n and go(i + 1, j, stack + [pushed[i]]):
            return True
        return False

    return go(0, 0, [])


def optimal(pushed, popped):
    stack = []
    j = 0
    for x in pushed:
        stack.append(x)
        while stack and j < len(popped) and stack[-1] == popped[j]:
            stack.pop()
            j += 1
    return j == len(popped)


def _possible(pushed, popped):
    stack, j = [], 0
    for x in pushed:
        stack.append(x)
        while stack and j < len(popped) and stack[-1] == popped[j]:
            stack.pop()
            j += 1
    return j == len(popped)


def gen(rng):
    n = rng.randint(3, 8)
    pushed = rng.sample(range(0, 20), n)
    if rng.random() < 0.5:
        stack, i, out = [], 0, []
        while len(out) < n:
            if stack and (i == n or rng.random() < 0.5):
                out.append(stack.pop())
            else:
                stack.append(pushed[i])
                i += 1
        popped = out
    else:
        popped = pushed[:]
        for _ in range(30):  # aim for an order that cannot happen
            rng.shuffle(popped)
            if not _possible(pushed, popped):
                break
    return [pushed, popped]
