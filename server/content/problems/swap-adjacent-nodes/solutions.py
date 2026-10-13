APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    values = []
    node = head
    while node is not None:
        values.append(node.val)
        node = node.next
    for i in range(0, len(values) - 1, 2):
        values[i], values[i + 1] = values[i + 1], values[i]
    dummy = ListNode(0)
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head):
    dummy = ListNode(0, head)
    prev = dummy
    while prev.next is not None and prev.next.next is not None:
        a = prev.next
        b = a.next
        a.next = b.next
        b.next = a
        prev.next = b
        prev = a
    return dummy.next


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(0, 9))]]
