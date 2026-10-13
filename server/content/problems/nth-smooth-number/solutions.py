APPROACHES = {"brute": ("O(answer log answer)", "O(1)"), "better": ("O(n log n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def BRUTE_OK(args):
    return args[0] <= 400


def brute(n):
    count = 0
    x = 0
    while count < n:
        x += 1
        y = x
        for p in (2, 3, 5):
            while y % p == 0:
                y //= p
        if y == 1:
            count += 1
    return x


def better(n):
    import heapq

    heap = [1]
    seen = {1}
    x = 1
    for _ in range(n):
        x = heapq.heappop(heap)
        for p in (2, 3, 5):
            if x * p not in seen:
                seen.add(x * p)
                heapq.heappush(heap, x * p)
    return x


def optimal(n):
    smooth = [1]
    i2 = i3 = i5 = 0
    while len(smooth) < n:
        nxt = min(smooth[i2] * 2, smooth[i3] * 3, smooth[i5] * 5)
        smooth.append(nxt)
        if nxt == smooth[i2] * 2:
            i2 += 1
        if nxt == smooth[i3] * 3:
            i3 += 1
        if nxt == smooth[i5] * 5:
            i5 += 1
    return smooth[n - 1]


def gen(rng):
    return [rng.randint(1, 300)]
