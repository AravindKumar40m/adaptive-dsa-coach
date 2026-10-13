APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    import re

    m = re.match(r" *([+-]?)([0-9]+)", text)
    if not m:
        return 0
    value = int(m.group(2))
    if m.group(1) == "-":
        value = -value
    return max(-2 ** 31, min(2 ** 31 - 1, value))


def optimal(text):
    i, n = 0, len(text)
    while i < n and text[i] == " ":
        i += 1
    sign = 1
    if i < n and text[i] in "+-":
        sign = -1 if text[i] == "-" else 1
        i += 1
    value = 0
    while i < n and "0" <= text[i] <= "9":
        value = value * 10 + (ord(text[i]) - 48)
        if value > 2 ** 31:
            break
        i += 1
    value *= sign
    return max(-2 ** 31, min(2 ** 31 - 1, value))


def gen(rng):
    if rng.random() < 0.6:
        text = " " * rng.randint(0, 3) + rng.choice(["", "", "+", "-", "+-"]) + "".join(rng.choice("0123456789") for _ in range(rng.randint(0, 12)))
        text += rng.choice(["", "", "abc", " 12", ".5", "-3"])
        return [text]
    return ["".join(rng.choice(" +-0123456789ab.") for _ in range(rng.randint(0, 10)))]
