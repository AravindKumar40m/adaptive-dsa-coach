APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    values = []
    node = head
    while node is not None:
        values.append(node.val)
        node = node.next
    if values:
        del values[len(values) // 2]
    dummy = ListNode(0)
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head):
    if head is None or head.next is None:
        return None
    prev = None
    slow = fast = head
    while fast is not None and fast.next is not None:
        prev = slow
        slow = slow.next
        fast = fast.next.next
    prev.next = slow.next
    return head


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(0, 9))]]
