APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head, left, right):
    values = []
    node = head
    while node is not None:
        values.append(node.val)
        node = node.next
    values[left - 1:right] = values[left - 1:right][::-1]
    dummy = ListNode(0)
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head, left, right):
    dummy = ListNode(0, head)
    prev = dummy
    for _ in range(left - 1):
        prev = prev.next
    cur = prev.next
    for _ in range(right - left):
        nxt = cur.next
        cur.next = nxt.next
        nxt.next = prev.next
        prev.next = nxt
    return dummy.next


def gen(rng):
    n = rng.randint(1, 8)
    left = rng.randint(1, n)
    return [[rng.randint(0, 9) for _ in range(n)], left, rng.randint(left, n)]
