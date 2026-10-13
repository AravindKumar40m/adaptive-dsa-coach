APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n)", "O(n)")}


def brute(prices):
    out = []
    for i in range(len(prices)):
        span = 1
        j = i - 1
        while j >= 0 and prices[j] <= prices[i]:
            span += 1
            j -= 1
        out.append(span)
    return out


def optimal(prices):
    stack = []
    out = []
    for p in prices:
        span = 1
        while stack and stack[-1][0] <= p:
            span += stack.pop()[1]
        stack.append((p, span))
        out.append(span)
    return out


def gen(rng):
    return [[rng.randint(1, 6) for _ in range(rng.randint(0, 9))]]
