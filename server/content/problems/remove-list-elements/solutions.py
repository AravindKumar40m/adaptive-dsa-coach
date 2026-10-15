APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head, val):
    values = []
    node = head
    while node is not None:
        if node.val != val:
            values.append(node.val)
        node = node.next
    dummy = ListNode(0)
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head, val):
    dummy = ListNode(0, head)
    prev = dummy
    while prev.next is not None:
        if prev.next.val == val:
            prev.next = prev.next.next
        else:
            prev = prev.next
    return dummy.next


def gen(rng):
    return [[rng.randint(0, 3) for _ in range(rng.randint(0, 9))], rng.randint(0, 3)]
