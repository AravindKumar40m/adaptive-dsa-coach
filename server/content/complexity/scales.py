# Input generators for the complexity analyzer: for ~20 problems, make(n, rng) builds ONE valid input of "size" n.
# The analyzer times the learner's function at growing n and fits the growth curve (see server/src/complexity/).
#
# Rules every generator follows (so a correct solution is never mis-judged):
#   1. The input obeys the problem's own constraints (including the maximum n): a correct solution must not crash on it.
#   2. It triggers the SLOW solution's real worst case (no early exit): a sorted array with a target nobody can reach,
#      a flat temperature list, nested brackets ... Otherwise the slow solution would look fast and the check proves nothing.
#   3. The same rng seed always gives the same input.
# `expected` = the complexity class of the best known solution (from the problem's APPROACHES), `slow` = the class of the
# brute-force solution. `build_complexity.py` checks the generators; `npm run complexity:validate` runs our own slow and fast
# reference solutions through the real analyzer and checks that they get the verdict we say they should.
#
# Classes: "log n", "n", "n log n", "n^2", "n^3", "exp".


# NOTE on "[x + 0 for x in values]" in the generators below: shuffling or sorting a list moves the pointers but not the numbers,
# so walking it jumps around memory; once the list is bigger than the CPU cache every step gets slower and a plain O(n) loop
# looks like O(n^1.7). That is the machine, not the solution. x + 0 builds a NEW number object in iteration order, so the
# numbers sit in memory in the same order as in the list. (Each generator must stay self-contained: only its own source is
# embedded in the program that runs in the sandbox, which is why this is written inline and not as a shared helper.)


def make_peak_altitude(n, rng):
    return [[rng.randint(-1000, 1000) for _ in range(n)]]


def make_missing_number(n, rng):
    values = list(range(n))  # the missing number is the largest one (n): the slow solution scans for every i up to n
    rng.shuffle(values)
    return [[x + 0 for x in values]]


def make_best_streak_sum(n, rng):
    return [[rng.randint(-1000, 1000) for _ in range(n)]]


def make_sorted_pair_sum(n, rng):
    # sorted, and the target is below every possible sum: no pair exists, so the slow solution checks every pair
    return [[x + 0 for x in sorted(rng.randint(0, 1000000) for _ in range(n))], -1]


def make_pair_count(n, rng):
    return [[rng.randint(-1000000, 1000000) for _ in range(n)], 0]


def make_subarray_sum_count(n, rng):
    return [[rng.randint(-1000, 1000) for _ in range(n)], 0]


def make_count_inversions(n, rng):
    return [[rng.randint(-1000000000, 1000000000) for _ in range(n)]]


def make_smallest_gap(n, rng):
    return [[rng.randint(0, 1000000000) for _ in range(n)]]


def make_days_until_warmer(n, rng):
    return [[50] * n]  # never gets warmer: the slow solution looks at every later day for every day


def make_balanced_brackets(n, rng):
    half = n // 2  # fully nested ((((...)))): the slow solution can only remove one pair per pass
    return ["(" * half + ")" * half]


def make_best_window(n, rng):
    return [[rng.randint(-1000, 1000) for _ in range(n)], max(1, n // 2)]  # a window of half the list: n * k is about n^2 / 4


def make_min_subarray_len(n, rng):
    return [[rng.randint(1, 1000) for _ in range(n)], 1000000000]  # a target no stretch can reach: no early exit


def make_insert_position(n, rng):
    return [list(range(n)), n + 5]  # larger than everything: a linear scan has to read the whole list


def make_search_sorted(n, rng):
    return [list(range(0, 2 * n, 2)), -1]  # not in the list: a linear scan has to read the whole list


def make_fibonacci_nth(n, rng):
    return [n]


def make_stair_ways(n, rng):
    return [n]


def make_three_sum_count(n, rng):
    return [[rng.randint(-100000, 100000) for _ in range(n)]]


def make_widest_fence(n, rng):
    return [[rng.randint(0, 10000) for _ in range(n)]]


def make_rain_catch(n, rng):
    return [[rng.randint(0, 10000) for _ in range(n)]]


def make_largest_rectangle(n, rng):
    return [[rng.randint(0, 10000) for _ in range(n)]]


def doubling(start, max_n):
    """start, 2*start, 4*start ... up to max_n (the last size is max_n itself)."""
    sizes, n = [], start
    while n < max_n:
        sizes.append(n)
        n *= 2
    return sizes + [max_n]


# slug -> how to scale it.  max_n = the problem's own limit.  sizes = the n values to try, smallest first.
CONFIGS = {
    "peak-altitude":       dict(make=make_peak_altitude,       sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "missing-number":      dict(make=make_missing_number,      sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "best-streak-sum":     dict(make=make_best_streak_sum,     sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "sorted-pair-sum":     dict(make=make_sorted_pair_sum,     sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "pair-count":          dict(make=make_pair_count,          sizes=doubling(256, 50000),  expected="n",      slow="n^2"),
    "subarray-sum-count":  dict(make=make_subarray_sum_count,  sizes=doubling(256, 50000),  expected="n",      slow="n^2"),
    "count-inversions":    dict(make=make_count_inversions,    sizes=doubling(256, 50000),  expected="n log n", slow="n^2"),
    "smallest-gap":        dict(make=make_smallest_gap,        sizes=doubling(256, 100000), expected="n log n", slow="n^2"),
    "days-until-warmer":   dict(make=make_days_until_warmer,   sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "balanced-brackets":   dict(make=make_balanced_brackets,   sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "best-window":         dict(make=make_best_window,         sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "min-subarray-len":    dict(make=make_min_subarray_len,    sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "insert-position":     dict(make=make_insert_position,     sizes=doubling(1024, 100000), expected="log n", slow="n"),
    "search-sorted":       dict(make=make_search_sorted,       sizes=doubling(1024, 100000), expected="log n", slow="n"),
    "fibonacci-nth":       dict(make=make_fibonacci_nth,       sizes=[12, 14, 16, 18, 20, 22, 24, 26, 28, 30], expected="n", slow="exp"),
    "stair-ways":          dict(make=make_stair_ways,          sizes=[10, 12, 14, 16, 18, 20, 22, 24, 26, 28], expected="n", slow="exp"),
    "three-sum-count":     dict(make=make_three_sum_count,     sizes=[16, 24, 32, 48, 64, 96, 128, 192, 256, 384], expected="n^2", slow="n^3"),
    "widest-fence":        dict(make=make_widest_fence,        sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "rain-catch":          dict(make=make_rain_catch,          sizes=doubling(256, 100000), expected="n",      slow="n^2"),
    "largest-rectangle":   dict(make=make_largest_rectangle,   sizes=doubling(256, 100000), expected="n",      slow="n^2"),
}
