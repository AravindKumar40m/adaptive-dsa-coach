APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    seen = {}
    node = head
    i = 0
    while node is not None:
        if id(node) in seen:
            return seen[id(node)]
        seen[id(node)] = i
        node = node.next
        i += 1
    return -1


def optimal(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            start = head
            index = 0
            while start is not slow:
                start = start.next
                slow = slow.next
                index += 1
            return index
    return -1


def gen(rng):
    values = [rng.randint(-3, 3) for _ in range(rng.randint(0, 8))]
    pos = -1 if (not values or rng.random() < 0.35) else rng.randint(0, len(values) - 1)
    return [[values, pos]]
