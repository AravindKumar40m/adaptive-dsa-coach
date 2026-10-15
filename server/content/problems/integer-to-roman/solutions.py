APPROACHES = {"brute": ("O(1)", "O(1)"), "optimal": ("O(1)", "O(1)")}


def brute(number):
    thousands = ["", "M", "MM", "MMM"]
    hundreds = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"]
    tens = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"]
    ones = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]
    return thousands[number // 1000] + hundreds[number // 100 % 10] + tens[number // 10 % 10] + ones[number % 10]


def optimal(number):
    table = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]
    out = ""
    for value, symbol in table:
        while number >= value:
            out += symbol
            number -= value
    return out


def gen(rng):
    return [rng.choice([rng.randint(1, 60), rng.randint(1, 3999)])]
