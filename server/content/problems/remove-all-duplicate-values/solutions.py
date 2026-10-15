APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    values = []
    node = head
    while node is not None:
        values.append(node.val)
        node = node.next
    keep = [v for v in values if values.count(v) == 1]
    dummy = ListNode(0)
    tail = dummy
    for v in keep:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head):
    dummy = ListNode(0, head)
    prev = dummy
    cur = head
    while cur is not None:
        if cur.next is not None and cur.next.val == cur.val:
            v = cur.val
            while cur is not None and cur.val == v:
                cur = cur.next
            prev.next = cur
        else:
            prev = cur
            cur = cur.next
    return dummy.next


def gen(rng):
    return [sorted(rng.randint(0, 4) for _ in range(rng.randint(0, 9)))]
