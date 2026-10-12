APPROACHES = {"brute": ("O(n + m)", "O(n + m)"), "optimal": ("O(max(n, m))", "O(1)")}


def brute(first, second):
    def number(node):
        digits = []
        while node is not None:
            digits.append(node.val)
            node = node.next
        return int("".join(str(d) for d in reversed(digits)))

    total = str(number(first) + number(second))
    dummy = ListNode(0)
    tail = dummy
    for ch in reversed(total):
        tail.next = ListNode(int(ch))
        tail = tail.next
    return dummy.next


def optimal(first, second):
    dummy = ListNode(0)
    tail = dummy
    carry = 0
    while first is not None or second is not None or carry:
        total = carry
        if first is not None:
            total += first.val
            first = first.next
        if second is not None:
            total += second.val
            second = second.next
        tail.next = ListNode(total % 10)
        tail = tail.next
        carry = total // 10
    return dummy.next


def _number(rng):
    n = rng.randint(1, 6)
    digits = [rng.randint(0, 9) for _ in range(n)]
    if n > 1 and digits[-1] == 0:
        digits[-1] = rng.randint(1, 9)
    return digits


def gen(rng):
    return [_number(rng), _number(rng)]
