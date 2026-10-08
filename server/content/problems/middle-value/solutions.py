APPROACHES = {"brute": ("O(n)", "O(1)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    length = 0
    node = head
    while node:
        length += 1
        node = node.next
    node = head
    for _ in range(length // 2):
        node = node.next
    return node.val


def optimal(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow.val


def gen(rng):
    return [[rng.randint(-9, 9) for _ in range(rng.randint(1, 9))]]
