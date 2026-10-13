APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head, k):
    values = []
    node = head
    while node is not None:
        values.append(node.val)
        node = node.next
    if values:
        k %= len(values)
        values = values[len(values) - k:] + values[:len(values) - k]
    dummy = ListNode(0)
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head, k):
    if head is None or head.next is None:
        return head
    length = 1
    tail = head
    while tail.next is not None:
        tail = tail.next
        length += 1
    k %= length
    if k == 0:
        return head
    tail.next = head
    new_tail = head
    for _ in range(length - k - 1):
        new_tail = new_tail.next
    new_head = new_tail.next
    new_tail.next = None
    return new_head


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(0, 8))], rng.randint(0, 20)]
