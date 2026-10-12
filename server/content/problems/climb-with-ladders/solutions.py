APPROACHES = {"brute": ("O(n^2 log n)", "O(n)"), "optimal": ("O(n log L)", "O(L)")}


def brute(heights, bricks, ladders):
    best = 0
    climbs = []
    for i in range(len(heights) - 1):
        if heights[i + 1] > heights[i]:
            climbs.append(heights[i + 1] - heights[i])
        need = sorted(climbs, reverse=True)[ladders:]
        if sum(need) <= bricks:
            best = i + 1
        else:
            break
    return best


def optimal(heights, bricks, ladders):
    import heapq

    used = []
    for i in range(len(heights) - 1):
        climb = heights[i + 1] - heights[i]
        if climb <= 0:
            continue
        heapq.heappush(used, climb)
        if len(used) > ladders:
            bricks -= heapq.heappop(used)
            if bricks < 0:
                return i
    return len(heights) - 1


def gen(rng):
    return [[rng.randint(1, 9) for _ in range(rng.randint(1, 9))], rng.randint(0, 12), rng.randint(0, 3)]
