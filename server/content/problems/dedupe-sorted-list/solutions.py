APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    values = []
    node = head
    while node is not None:
        if not values or values[-1] != node.val:
            values.append(node.val)
        node = node.next
    dummy = ListNode(0)
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head):
    cur = head
    while cur is not None and cur.next is not None:
        if cur.val == cur.next.val:
            cur.next = cur.next.next
        else:
            cur = cur.next
    return head


def gen(rng):
    return [sorted(rng.randint(-3, 3) for _ in range(rng.randint(0, 9)))]
