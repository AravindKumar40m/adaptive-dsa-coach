APPROACHES = {"brute": ("O(3^k * n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def BRUTE_OK(args):
    return args[0].count("*") <= 9


def brute(text):
    from itertools import product

    stars = [i for i, c in enumerate(text) if c == "*"]
    for choice in product("()_", repeat=len(stars)):
        chars = list(text)
        for i, c in zip(stars, choice):
            chars[i] = c
        depth = 0
        ok = True
        for c in chars:
            if c == "(":
                depth += 1
            elif c == ")":
                depth -= 1
                if depth < 0:
                    ok = False
                    break
        if ok and depth == 0:
            return True
    return False


def optimal(text):
    low = high = 0
    for c in text:
        if c == "(":
            low += 1
            high += 1
        elif c == ")":
            low -= 1
            high -= 1
        else:
            low -= 1
            high += 1
        if high < 0:
            return False
        low = max(low, 0)
    return low == 0


def gen(rng):
    return ["".join(rng.choice("(()*)*") for _ in range(rng.randint(0, 9)))]
