APPROACHES = {"brute": ("O(n^2) with big numbers", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(head):
    digits = ""
    node = head
    while node is not None:
        digits += str(node.val)
        node = node.next
    doubled = str(int(digits) * 2)
    dummy = ListNode(0)
    tail = dummy
    for ch in doubled:
        tail.next = ListNode(int(ch))
        tail = tail.next
    return dummy.next


def optimal(head):
    digits = []
    node = head
    while node is not None:
        digits.append(node.val)
        node = node.next
    carry = 0
    for i in range(len(digits) - 1, -1, -1):
        v = digits[i] * 2 + carry
        digits[i] = v % 10
        carry = v // 10
    if carry:
        digits.insert(0, carry)
    dummy = ListNode(0)
    tail = dummy
    for d in digits:
        tail.next = ListNode(d)
        tail = tail.next
    return dummy.next


def gen(rng):
    n = rng.randint(1, 8)
    digits = [rng.choice([rng.randint(0, 9), 9, 5, 4]) for _ in range(n)]
    if n > 1 and digits[0] == 0:
        digits[0] = rng.randint(1, 9)
    return [digits]
