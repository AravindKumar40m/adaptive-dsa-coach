APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


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
    order = []

    def walk(node):
        if node is None:
            return
        order.append(node.val)
        walk(node.left)
        walk(node.right)

    walk(root)
    if not order:
        return None
    head = TreeNode(order[0])
    tail = head
    for v in order[1:]:
        tail.right = TreeNode(v)
        tail = tail.right
    return head


def optimal(root):
    cur = root
    while cur is not None:
        if cur.left is not None:
            last = cur.left
            while last.right is not None:
                last = last.right
            last.right = cur.right
            cur.right = cur.left
            cur.left = None
        cur = cur.right
    return root


def gen(rng):
    return [_levels(_shape(rng, rng.randint(0, 9), 0, 9))]
