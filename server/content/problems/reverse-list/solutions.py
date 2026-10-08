APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    values = []
    node = head
    while node:
        values.append(node.val)
        node = node.next
    new_head = None
    for v in values:  # putting each value in front of the rest reverses the order
        new_head = ListNode(v, new_head)
    return new_head


def optimal(head):
    prev = None
    while head:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev


def gen(rng):
    return [[rng.randint(-9, 9) for _ in range(rng.randint(0, 8))]]
