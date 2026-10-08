APPROACHES = {"brute": ("O(n log n)", "O(n)"), "optimal": ("O(n log n)", "O(log n)")}


def brute(head):
    values = []
    node = head
    while node:
        values.append(node.val)
        node = node.next
    new_head = None
    for v in sorted(values, reverse=True):
        new_head = ListNode(v, new_head)
    return new_head


def optimal(head):
    def merge(a, b):
        dummy = tail = ListNode()
        while a and b:
            if a.val <= b.val:
                tail.next = a
                a = a.next
            else:
                tail.next = b
                b = b.next
            tail = tail.next
        tail.next = a or b
        return dummy.next

    def sort(h):
        if h is None or h.next is None:
            return h
        slow, fast = h, h.next
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        middle = slow.next
        slow.next = None
        return merge(sort(h), sort(middle))

    return sort(head)


def gen(rng):
    return [[rng.randint(-9, 9) for _ in range(rng.randint(0, 9))]]
