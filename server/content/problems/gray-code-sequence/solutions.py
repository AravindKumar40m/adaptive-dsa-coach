APPROACHES = {"brute": ("O(2^bits)", "O(2^bits)"), "optimal": ("O(2^bits)", "O(2^bits)")}


def brute(bits):
    return [i ^ (i >> 1) for i in range(2 ** bits)]


def optimal(bits):
    seq = [0]
    for b in range(bits):
        seq += [x | (1 << b) for x in reversed(seq)]
    return seq


def gen(rng):
    return [rng.randint(0, 6)]
