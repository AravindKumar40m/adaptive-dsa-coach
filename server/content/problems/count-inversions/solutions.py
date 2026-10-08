APPROACHES = {"brute": ("O(n^2)", "O(1)"), "optimal": ("O(n log n)", "O(n)")}


def brute(nums):
    count = 0
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] > nums[j]:
                count += 1
    return count


def optimal(nums):
    a = list(nums)
    buf = [0] * len(a)

    def sort(lo, hi):
        if hi - lo < 2:
            return 0
        mid = (lo + hi) // 2
        count = sort(lo, mid) + sort(mid, hi)
        i, j, k = lo, mid, lo
        while i < mid and j < hi:
            if a[i] <= a[j]:
                buf[k] = a[i]
                i += 1
            else:
                buf[k] = a[j]
                j += 1
                count += mid - i
            k += 1
        while i < mid:
            buf[k] = a[i]
            i += 1
            k += 1
        while j < hi:
            buf[k] = a[j]
            j += 1
            k += 1
        a[lo:hi] = buf[lo:hi]
        return count

    return sort(0, len(a))


def gen(rng):
    return [[rng.randint(0, 9) for _ in range(rng.randint(1, 12))]]
