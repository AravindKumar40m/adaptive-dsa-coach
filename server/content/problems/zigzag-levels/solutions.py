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
    levels = []

    def walk(node, depth):
        if node is None:
            return
        if depth == len(levels):
            levels.append([])
        levels[depth].append(node.val)
        walk(node.left, depth + 1)
        walk(node.right, depth + 1)

    walk(root, 0)
    out = []
    for d, level in enumerate(levels):
        out += level if d % 2 == 0 else level[::-1]
    return out


def optimal(root):
    out = []
    level = [root] if root is not None else []
    left_to_right = True
    while level:
        values = [node.val for node in level]
        if not left_to_right:
            values.reverse()
        out += values
        level = [child for node in level for child in (node.left, node.right) if child is not None]
        left_to_right = not left_to_right
    return out


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 10), -5, 9))]
