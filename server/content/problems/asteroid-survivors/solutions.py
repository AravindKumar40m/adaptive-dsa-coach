APPROACHES = {"brute": ("O(n^2)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(asteroids):
    a = list(asteroids)
    changed = True
    while changed:
        changed = False
        for i in range(len(a) - 1):
            if a[i] > 0 and a[i + 1] < 0:
                if a[i] > -a[i + 1]:
                    del a[i + 1]
                elif a[i] < -a[i + 1]:
                    del a[i]
                else:
                    del a[i:i + 2]
                changed = True
                break
    return a


def optimal(asteroids):
    stack = []
    for x in asteroids:
        alive = True
        while alive and x < 0 and stack and stack[-1] > 0:
            if stack[-1] < -x:
                stack.pop()
            elif stack[-1] == -x:
                stack.pop()
                alive = False
            else:
                alive = False
        if alive:
            stack.append(x)
    return stack


def gen(rng):
    return [[rng.choice([-1, 1]) * rng.randint(1, 9) for _ in range(rng.randint(0, 9))]]
