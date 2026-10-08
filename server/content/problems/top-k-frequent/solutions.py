APPROACHES = {"brute": ("O(d log d)", "O(n)"), "optimal": ("O(n + d log k)", "O(n)")}


def brute(nums, k):
    counts = {}
    for x in nums:
        counts[x] = counts.get(x, 0) + 1
    ordered = sorted(counts, key=lambda v: (-counts[v], v))
    return ordered[:k]


def optimal(nums, k):
    import heapq

    counts = {}
    for x in nums:
        counts[x] = counts.get(x, 0) + 1
    heap = []  # (count, -value): the smallest tuple is the worst of the best k
    for value, count in counts.items():
        heapq.heappush(heap, (count, -value))
        if len(heap) > k:
            heapq.heappop(heap)
    best_first = sorted(heap, reverse=True)
    return [-neg_value for _, neg_value in best_first]


def gen(rng):
    nums = [rng.randint(-3, 5) for _ in range(rng.randint(1, 12))]
    return [nums, rng.randint(1, len(set(nums)))]
