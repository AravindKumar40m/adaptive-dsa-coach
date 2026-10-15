APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    values = []
    node = head
    while node is not None:
        values.append(node.val)
        node = node.next
    order = []
    lo, hi = 0, len(values) - 1
    take_front = True
    while lo <= hi:
        if take_front:
            order.append(values[lo])
            lo += 1
        else:
            order.append(values[hi])
            hi -= 1
        take_front = not take_front
    dummy = ListNode(0)
    tail = dummy
    for v in order:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head):
    if head is None or head.next is None:
        return head
    slow = fast = head
    while fast.next is not None and fast.next.next is not None:
        slow = slow.next
        fast = fast.next.next
    second = slow.next
    slow.next = None
    prev = None
    while second is not None:
        nxt = second.next
        second.next = prev
        prev = second
        second = nxt
    first, second = head, prev
    while second is not None:
        a = first.next
        b = second.next
        first.next = second
        second.next = a
        first = a
        second = b
    return head


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(0, 9))]]
