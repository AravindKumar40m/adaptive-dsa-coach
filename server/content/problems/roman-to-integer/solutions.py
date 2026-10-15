APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def _to_roman(number):
    table = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]
    out = ""
    for value, symbol in table:
        while number >= value:
            out += symbol
            number -= value
    return out


def brute(numeral):
    s = numeral
    for pair, spelled in (("IV", "IIII"), ("IX", "VIIII"), ("XL", "XXXX"), ("XC", "LXXXX"), ("CD", "CCCC"), ("CM", "DCCCC")):
        s = s.replace(pair, spelled)
    value = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    return sum(value[c] for c in s)


def optimal(numeral):
    value = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    for i, c in enumerate(numeral):
        if i + 1 < len(numeral) and value[c] < value[numeral[i + 1]]:
            total -= value[c]
        else:
            total += value[c]
    return total


def gen(rng):
    return [_to_roman(rng.choice([rng.randint(1, 60), rng.randint(1, 3999)]))]
