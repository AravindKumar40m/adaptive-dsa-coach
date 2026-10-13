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


def brute(root, target):
    def from_node(node, acc):
        if node is None:
            return 0
        acc += node.val
        return (1 if acc == target else 0) + from_node(node.left, acc) + from_node(node.right, acc)

    def everywhere(node):
        if node is None:
            return 0
        return from_node(node, 0) + everywhere(node.left) + everywhere(node.right)

    return everywhere(root)


def optimal(root, target):
    seen = {0: 1}

    def walk(node, total):
        if node is None:
            return 0
        total += node.val
        found = seen.get(total - target, 0)
        seen[total] = seen.get(total, 0) + 1
        found += walk(node.left, total) + walk(node.right, total)
        seen[total] -= 1
        return found

    return walk(root, 0)


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 9), -3, 5)), rng.randint(-3, 8)]
