APPROACHES = {"brute": ("O((n + m) log(n + m))", "O(n + m)"), "optimal": ("O(n + m)", "O(1)")}


def brute(first, second):
    values = []
    for node in (first, second):
        while node:
            values.append(node.val)
            node = node.next
    head = None
    for v in sorted(values, reverse=True):
        head = ListNode(v, head)
    return head


def optimal(first, second):
    dummy = tail = ListNode()
    while first and second:
        if first.val <= second.val:
            tail.next = first
            first = first.next
        else:
            tail.next = second
            second = second.next
        tail = tail.next
    tail.next = first or second
    return dummy.next


def gen(rng):
    return [sorted(rng.randint(-5, 9) for _ in range(rng.randint(0, 6))), sorted(rng.randint(-5, 9) for _ in range(rng.randint(0, 6)))]
