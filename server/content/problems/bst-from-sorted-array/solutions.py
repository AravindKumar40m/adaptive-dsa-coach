APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n)", "O(log n)")}


def brute(values):
    def build(part):
        if not part:
            return None
        mid = (len(part) - 1) // 2
        return TreeNode(part[mid], build(part[:mid]), build(part[mid + 1:]))

    return build(values)


def optimal(values):
    def build(lo, hi):
        if lo > hi:
            return None
        mid = (lo + hi) // 2
        return TreeNode(values[mid], build(lo, mid - 1), build(mid + 1, hi))

    return build(0, len(values) - 1)


def gen(rng):
    return [sorted(rng.sample(range(-20, 40), rng.randint(0, 10)))]
