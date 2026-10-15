APPROACHES = {"brute": ("O(total length)", "O(length)"), "optimal": ("O(total length)", "O(length)")}


def brute(n):
    if n == 1:
        return "1"
    previous = brute(n - 1)
    out = ""
    count = 1
    for i in range(1, len(previous) + 1):
        if i < len(previous) and previous[i] == previous[i - 1]:
            count += 1
        else:
            out += str(count) + previous[i - 1]
            count = 1
    return out


def optimal(n):
    text = "1"
    for _ in range(n - 1):
        parts = []
        i = 0
        while i < len(text):
            j = i
            while j < len(text) and text[j] == text[i]:
                j += 1
            parts.append(str(j - i))
            parts.append(text[i])
            i = j
        text = "".join(parts)
    return text


def gen(rng):
    return [rng.randint(1, 12)]
