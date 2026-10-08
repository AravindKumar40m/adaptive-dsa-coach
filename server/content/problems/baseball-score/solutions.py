APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(ops):
    record = []
    for op in ops.split(" "):
        if op == "+":
            record.append(sum(record[-2:]))
        elif op == "D":
            record.append(2 * record[-1])
        elif op == "C":
            record = record[:-1]
        else:
            record = record + [int(op)]
    return sum(record)


def optimal(ops):
    stack = []
    total = 0
    for op in ops.split(" "):
        if op == "C":
            total -= stack.pop()
            continue
        if op == "+":
            value = stack[-1] + stack[-2]
        elif op == "D":
            value = 2 * stack[-1]
        else:
            value = int(op)
        stack.append(value)
        total += value
    return total


def gen(rng):
    ops = [str(rng.randint(-9, 9)), str(rng.randint(-9, 9))]
    size = 2
    for _ in range(rng.randint(0, 8)):
        choice = rng.choice(["num", "num", "D", "+", "C"])
        if choice == "num":
            ops.append(str(rng.randint(-9, 9)))
            size += 1
        elif choice == "D":
            ops.append("D")
            size += 1
        elif choice == "+" and size >= 2:
            ops.append("+")
            size += 1
        elif choice == "C" and size >= 1:
            ops.append("C")
            size -= 1
    return [" ".join(ops)]
