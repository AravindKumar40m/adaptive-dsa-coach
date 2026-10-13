APPROACHES = {"brute": ("O(n^2)", "O(h)"), "optimal": ("O(n)", "O(h)")}


def _shape(rng, n, lo, hi):
    if n == 0:
        return None
    left = rng.randint(0, n - 1)
    return (rng.randint(lo, hi), _shape(rng, left, lo, hi), _shape(rng, n - 1 - left, lo, hi))


def _levels(tree):
    out, queue = [], [tree]
    for node in queue:
        if node is None:
            out.append(None)
        else:
            out.append(node[0])
            queue.append(node[1])
            queue.append(node[2])
    while out and out[-1] is None:
        out.pop()
    return out


def brute(root):
    def height(node):
        return 0 if node is None else 1 + max(height(node.left), height(node.right))

    def ok(node):
        if node is None:
            return True
        return abs(height(node.left) - height(node.right)) <= 1 and ok(node.left) and ok(node.right)

    return ok(root)


def optimal(root):
    def check(node):
        if node is None:
            return 0
        left = check(node.left)
        if left < 0:
            return -1
        right = check(node.right)
        if right < 0 or abs(left - right) > 1:
            return -1
        return 1 + max(left, right)

    return check(root) >= 0


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 9), 0, 5))]
