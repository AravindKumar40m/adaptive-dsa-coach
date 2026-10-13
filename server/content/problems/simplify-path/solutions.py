APPROACHES = {"brute": ("O(n)", "O(n)"), "optimal": ("O(n)", "O(n)")}


def brute(path):
    import posixpath

    return posixpath.normpath("/" + path.lstrip("/"))


def optimal(path):
    stack = []
    for part in path.split("/"):
        if part == "" or part == ".":
            continue
        if part == "..":
            if stack:
                stack.pop()
        else:
            stack.append(part)
    return "/" + "/".join(stack)


def gen(rng):
    names = ["a", "b", "c", ".", "..", "", "..hidden", "x.y"]
    return ["/" + "/".join(rng.choice(names) for _ in range(rng.randint(0, 7))) + rng.choice(["", "/"])]
