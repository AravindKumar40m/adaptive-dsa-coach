APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head, n):
    nodes = []
    node = head
    while node:
        nodes.append(node)
        node = node.next
    index = len(nodes) - n
    if index == 0:
        return head.next
    nodes[index - 1].next = nodes[index].next
    return head


def optimal(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next:
        fast = fast.next
        slow = slow.next
    slow.next = slow.next.next
    return dummy.next


def gen(rng):
    size = rng.randint(1, 8)
    return [[rng.randint(-9, 9) for _ in range(size)], rng.randint(1, size)]
