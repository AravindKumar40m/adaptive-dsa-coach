APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(head):
    values = []
    while head is not None:
        values.append(head.val)
        head = head.next
    dummy = ListNode(0)
    tail = dummy
    for v in values[0::2] + values[1::2]:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next


def optimal(head):
    if head is None:
        return None
    odd = head
    even_head = even = head.next
    while even is not None and even.next is not None:
        odd.next = even.next
        odd = odd.next
        even.next = odd.next
        even = even.next
    odd.next = even_head
    return head


def gen(rng):
    return [[rng.randint(-5, 9) for _ in range(rng.randint(0, 9))]]
