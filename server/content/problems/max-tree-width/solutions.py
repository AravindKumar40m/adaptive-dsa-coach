APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


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
    spans = {}

    def walk(node, depth, pos):
        if node is None:
            return
        lo, hi = spans.get(depth, (pos, pos))
        spans[depth] = (min(lo, pos), max(hi, pos))
        walk(node.left, depth + 1, 2 * pos)
        walk(node.right, depth + 1, 2 * pos + 1)

    walk(root, 0, 0)
    return max((hi - lo + 1 for lo, hi in spans.values()), default=0)


def optimal(root):
    if root is None:
        return 0
    best = 0
    level = [(root, 0)]
    while level:
        best = max(best, level[-1][1] - level[0][1] + 1)
        base = level[0][1]
        nxt = []
        for node, pos in level:
            pos -= base
            if node.left is not None:
                nxt.append((node.left, 2 * pos))
            if node.right is not None:
                nxt.append((node.right, 2 * pos + 1))
        level = nxt
    return best


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 10), 0, 9))]
