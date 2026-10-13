APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(h)")}


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
    nodes = []

    def collect(node, depth):
        if node is None:
            return
        nodes.append((node, depth))
        collect(node.left, depth + 1)
        collect(node.right, depth + 1)

    collect(root, 0)
    deepest = max(d for _, d in nodes)
    leaves = {id(n) for n, d in nodes if d == deepest}

    def below(node):
        if node is None:
            return set()
        return {id(node)} | below(node.left) | below(node.right)

    best = None
    for node, depth in nodes:
        if leaves <= below(node) and (best is None or depth > best[1]):
            best = (node, depth)
    return best[0].val


def optimal(root):
    def go(node):
        if node is None:
            return 0, None
        ld, ln = go(node.left)
        rd, rn = go(node.right)
        if ld > rd:
            return ld + 1, ln
        if rd > ld:
            return rd + 1, rn
        return ld + 1, node

    return go(root)[1].val


def gen(rng):
    return [_levels(_shape(rng, rng.randint(1, 9), 0, 9))]
