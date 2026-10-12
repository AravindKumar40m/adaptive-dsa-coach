APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(h)")}


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
    seen = []

    def walk(node, depth):
        if node is None:
            return
        walk(node.left, depth + 1)
        seen.append((depth, node.val))
        walk(node.right, depth + 1)

    walk(root, 0)
    last = {}
    for depth, val in seen:
        last[depth] = val
    return [last[d] for d in sorted(last)]


def optimal(root):
    out = []

    def visit(node, depth):
        if node is None:
            return
        if depth == len(out):
            out.append(node.val)
        visit(node.right, depth + 1)
        visit(node.left, depth + 1)

    visit(root, 0)
    return out


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 10), -5, 9))]
