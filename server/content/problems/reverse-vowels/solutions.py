APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(text):
    vowels = [c for c in text if c in "aeiouAEIOU"]
    vowels.reverse()
    out = []
    k = 0
    for c in text:
        if c in "aeiouAEIOU":
            out.append(vowels[k])
            k += 1
        else:
            out.append(c)
    return "".join(out)


def optimal(text):
    chars = list(text)
    left, right = 0, len(chars) - 1
    while left < right:
        if chars[left] not in "aeiouAEIOU":
            left += 1
        elif chars[right] not in "aeiouAEIOU":
            right -= 1
        else:
            chars[left], chars[right] = chars[right], chars[left]
            left += 1
            right -= 1
    return "".join(chars)


def gen(rng):
    return ["".join(rng.choice("abeiouAEIOUxyz ") for _ in range(rng.randint(0, 12)))]
