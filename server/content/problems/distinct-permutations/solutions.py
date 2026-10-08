APPROACHES = {"brute": ("O(n! * n)", "O(n!)"), "better": ("O(prod(count+1) * k)", "O(prod(count+1))"), "optimal": ("O(n)", "O(1)")}
EXPECT_SLOW = {"brute"}  # listing every arrangement is exponential on purpose


def BRUTE_OK(args):
    return len(args[0]) <= 7


def brute(text):
    from itertools import permutations

    return len(set(permutations(text)))


def better(text):
    # recursion on "which letter goes next", remembering the answer for each set of remaining letters
    from collections import Counter

    letters = sorted(set(text))
    counts = Counter(text)
    start = tuple(counts[c] for c in letters)
    memo = {}

    def go(state):
        if sum(state) == 0:
            return 1
        if state not in memo:
            total = 0
            for i, c in enumerate(state):
                if c > 0:
                    total += go(state[:i] + (c - 1,) + state[i + 1:])
            memo[state] = total
        return memo[state]

    return go(start)


def optimal(text):
    from collections import Counter

    def factorial(k):
        return 1 if k <= 1 else k * factorial(k - 1)

    answer = factorial(len(text))
    for count in Counter(text).values():
        answer //= factorial(count)
    return answer


def gen(rng):
    return ["".join(rng.choice("abcd") for _ in range(rng.randint(1, 7)))]
