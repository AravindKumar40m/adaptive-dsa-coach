APPROACHES = {"brute": ("O(2^n)", "O(n)"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # trying every way of giving change is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 14


def brute(bills):
    # explore EVERY way of making change (for a 20 either 10+5 or 5+5+5) and see if any way works for all customers
    def go(i, fives, tens):
        if i == len(bills):
            return True
        bill = bills[i]
        if bill == 5:
            return go(i + 1, fives + 1, tens)
        if bill == 10:
            return fives >= 1 and go(i + 1, fives - 1, tens + 1)
        if tens >= 1 and fives >= 1 and go(i + 1, fives - 1, tens - 1):
            return True
        return fives >= 3 and go(i + 1, fives - 3, tens)

    return go(0, 0, 0)


def optimal(bills):
    fives = tens = 0
    for bill in bills:
        if bill == 5:
            fives += 1
        elif bill == 10:
            if fives == 0:
                return False
            fives -= 1
            tens += 1
        else:
            if tens > 0 and fives > 0:
                tens -= 1
                fives -= 1
            elif fives >= 3:
                fives -= 3
            else:
                return False
    return True


def gen(rng):
    return [[rng.choice([5, 5, 5, 10, 20]) for _ in range(rng.randint(1, 10))]]
