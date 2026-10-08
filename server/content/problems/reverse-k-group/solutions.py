APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head, k):
    values = []
    node = head
    while node:
        values.append(node.val)
        node = node.next
    out = []
    for i in range(0, len(values), k):
        chunk = values[i:i + k]
        out.extend(chunk[::-1] if len(chunk) == k else chunk)
    new_head = None
    for v in reversed(out):
        new_head = ListNode(v, new_head)
    return new_head


def optimal(head, k):
    dummy = ListNode(0, head)
    group_prev = dummy
    while True:
        kth = group_prev
        for _ in range(k):
            kth = kth.next
            if kth is None:
                return dummy.next
        group_next = kth.next
        prev, cur = group_next, group_prev.next
        while cur is not group_next:
            nxt = cur.next
            cur.next = prev
            prev = cur
            cur = nxt
        old_first = group_prev.next
        group_prev.next = kth
        group_prev = old_first


def gen(rng):
    return [[rng.randint(-9, 9) for _ in range(rng.randint(0, 9))], rng.randint(1, 4)]
