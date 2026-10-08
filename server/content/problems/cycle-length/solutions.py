APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    seen = {}
    node = head
    steps = 0
    while node is not None:
        if node in seen:
            return steps - seen[node]
        seen[node] = steps
        node = node.next
        steps += 1
    return 0


def optimal(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            count, cur = 1, slow.next
            while cur is not slow:
                count += 1
                cur = cur.next
            return count
    return 0


def gen(rng):
    values = [rng.randint(-9, 9) for _ in range(rng.randint(0, 8))]
    pos = rng.randint(-1, len(values) - 1) if values else -1
    return [[values, pos]]
