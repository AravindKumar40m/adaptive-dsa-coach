APPROACHES = {"brute": ("O(n!)", "O(n)"), "better": ("O(n)", "O(1)"), "optimal": ("O(n log k)", "O(k)")}


def brute(letters):
    from itertools import permutations

    for p in set(permutations(letters)):
        if all(p[i] != p[i + 1] for i in range(len(p) - 1)):
            return True
    return False


def better(letters):
    from collections import Counter

    return max(Counter(letters).values()) * 2 <= len(letters) + 1


def optimal(letters):
    import heapq
    from collections import Counter

    heap = [(-c, ch) for ch, c in Counter(letters).items()]
    heapq.heapify(heap)
    held = None
    while heap or held:
        if not heap:
            return False
        count, ch = heapq.heappop(heap)
        if held:
            heapq.heappush(heap, held)
            held = None
        if count + 1 < 0:
            held = (count + 1, ch)
    return True


def gen(rng):
    n = rng.randint(1, 7)
    if rng.random() < 0.5:
        k = rng.randint(n // 2, n)
        text = ["a"] * k + [rng.choice("bc") for _ in range(n - k)]
    else:
        text = [rng.choice("abc") for _ in range(n)]
    rng.shuffle(text)
    return ["".join(text)]
