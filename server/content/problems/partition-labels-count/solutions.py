APPROACHES = {"brute": ("O(2^n * n)", "O(n)"), "optimal": ("O(n)", "O(1)")}


def brute(text):
    n = len(text)
    best = 1
    for mask in range(1 << (n - 1)):
        pieces = []
        start = 0
        for i in range(n - 1):
            if mask >> i & 1:
                pieces.append(text[start:i + 1])
                start = i + 1
        pieces.append(text[start:])
        seen = set()
        ok = True
        for p in pieces:
            letters = set(p)
            if letters & seen:
                ok = False
                break
            seen |= letters
        if ok and len(pieces) > best:
            best = len(pieces)
    return best


def optimal(text):
    last = {ch: i for i, ch in enumerate(text)}
    pieces = 0
    end = 0
    for i, ch in enumerate(text):
        end = max(end, last[ch])
        if i == end:
            pieces += 1
    return pieces


def gen(rng):
    letters = list("abcdefgh")
    rng.shuffle(letters)
    text = ""
    for _ in range(rng.randint(1, 3)):  # each segment has its own letters, so the answer is usually several pieces
        take = [letters.pop() for _ in range(rng.randint(1, 2))]
        seg = [rng.choice(take) for _ in range(rng.randint(0, 2))] + take
        rng.shuffle(seg)
        text += "".join(seg)
    if rng.random() < 0.3 and len(text) > 1:  # sometimes tangle two letters across segments
        chars = list(text)
        i, j = rng.sample(range(len(chars)), 2)
        chars[i], chars[j] = chars[j], chars[i]
        text = "".join(chars)
    return [text]
