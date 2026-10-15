APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    import re

    return re.fullmatch(r"[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)([eE][+-]?[0-9]+)?", text) is not None


def optimal(text):
    n = len(text)
    i = 0
    if i < n and text[i] in "+-":
        i += 1
    before = 0
    while i < n and "0" <= text[i] <= "9":
        i += 1
        before += 1
    after = 0
    if i < n and text[i] == ".":
        i += 1
        while i < n and "0" <= text[i] <= "9":
            i += 1
            after += 1
    if before + after == 0:
        return False
    if i < n and text[i] in "eE":
        i += 1
        if i < n and text[i] in "+-":
            i += 1
        exponent = 0
        while i < n and "0" <= text[i] <= "9":
            i += 1
            exponent += 1
        if exponent == 0:
            return False
    return i == n


def gen(rng):
    digits = lambda lo, hi: "".join(rng.choice("0123456789") for _ in range(rng.randint(lo, hi)))
    if rng.random() < 0.55:
        sign = rng.choice(["", "+", "-"])
        whole = digits(0, 3)
        fraction = rng.choice(["", "." + digits(0, 3)])
        if whole == "" and fraction in ("", "."):
            whole = "1"
        exponent = rng.choice(["", "e" + rng.choice(["", "+", "-"]) + digits(1, 2), "E" + digits(1, 2)])
        s = sign + whole + fraction + exponent
        if rng.random() < 0.4:
            pos = rng.randint(0, len(s))
            s = s[:pos] + rng.choice("+-.eEx5") + s[pos:]
        return [s]
    return ["".join(rng.choice("+-.eE0123") for _ in range(rng.randint(0, 7)))]
