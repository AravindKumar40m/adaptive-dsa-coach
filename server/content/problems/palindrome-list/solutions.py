APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    values = []
    while head is not None:
        values.append(head.val)
        head = head.next
    return values == values[::-1]


def optimal(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    prev = None
    while slow is not None:
        nxt = slow.next
        slow.next = prev
        prev = slow
        slow = nxt
    a, b = head, prev
    while b is not None:
        if a.val != b.val:
            return False
        a = a.next
        b = b.next
    return True


def gen(rng):
    n = rng.randint(0, 9)
    values = [rng.randint(0, 2) for _ in range(n)]
    if rng.random() < 0.55:
        half = values[: (n + 1) // 2]
        values = half + half[: n // 2][::-1]
    return [values]
