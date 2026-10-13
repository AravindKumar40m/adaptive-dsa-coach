APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head, pivot):
    values = []
    node = head
    while node is not None:
        values.append(node.val)
        node = node.next
    ordered = [v for v in values if v < pivot] + [v for v in values if v >= pivot]
    dummy = ListNode(0)
    tail = dummy
    for v in ordered:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head, pivot):
    less_head = ListNode(0)
    more_head = ListNode(0)
    less, more = less_head, more_head
    while head is not None:
        if head.val < pivot:
            less.next = head
            less = head
        else:
            more.next = head
            more = head
        head = head.next
    more.next = None
    less.next = more_head.next
    return less_head.next


def gen(rng):
    return [[rng.randint(0, 6) for _ in range(rng.randint(0, 9))], rng.randint(0, 7)]
