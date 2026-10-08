"""Builds content/build/content.json from content/problems/*/ (stdlib only).

For each problem folder it:
  1. loads problem.json (statement, signature, examples, edge tests, hints) and solutions.py (brute/optimal + gen)
  2. makes the test list: examples (visible) + edge tests + 15 seeded random tests (hidden)
  3. computes each expected output from the brute-force solution (or `better` where brute is too slow)
  4. CHECKS that every solution agrees on every test and that the hand-written example answers are right
  5. stores the solutions as plain Python source (renamed to the problem's function name)

Run:  python content/build.py      (from the server/ folder)
"""
import ast, copy, importlib.util, inspect, json, random, re, sys
from pathlib import Path

HERE = Path(__file__).parent
RATING = {"easy": 900, "medium": 1200, "hard": 1500}  # seed difficulty, see CLAUDE.md
RANDOM_TESTS = 15
TARGET_PROBLEMS = 120  # the content target fixed in CLAUDE.md (Day 3)

# 16 concepts from the synthetic draft (data/synthetic/simulate.py): key, name, prerequisites
CONCEPTS = [
    ("arrays", "Arrays", []), ("strings", "Strings", ["arrays"]), ("hashing", "Hashing", ["arrays"]),
    ("two_pointers", "Two Pointers", ["arrays"]), ("sorting", "Sorting", ["arrays"]),
    ("sliding_window", "Sliding Window", ["two_pointers", "hashing"]),
    ("stack_queue", "Stacks & Queues", ["arrays"]), ("linked_list", "Linked Lists", ["arrays"]),
    ("recursion", "Recursion", ["arrays"]), ("binary_search", "Binary Search", ["sorting"]),
    ("trees", "Trees", ["recursion", "linked_list"]), ("heaps", "Heaps", ["trees", "sorting"]),
    ("graphs", "Graphs", ["trees", "stack_queue"]), ("greedy", "Greedy", ["sorting"]),
    ("backtracking", "Backtracking", ["recursion"]), ("dp", "Dynamic Programming", ["recursion", "arrays"]),
]
CONCEPT_KEYS = {c[0] for c in CONCEPTS}
PARAM_TYPES = {"int", "int[]", "int[][]", "string", "ListNode", "CycleList", "TreeNode"}
RETURN_TYPES = {"int", "bool", "int[]", "string", "ListNode", "TreeNode"}


# ---- linked lists and trees: the same classes the run harness gives learners, plus conversion to/from plain JSON ----
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


NODE_NAMESPACE = {"ListNode": ListNode, "TreeNode": TreeNode}


def to_py(type_, v):
    """A test value (plain JSON) -> what the Python solution receives (fresh nodes every call)."""
    if type_ == "ListNode":
        head = None
        for x in reversed(v):
            head = ListNode(x, head)
        return head
    if type_ == "CycleList":
        values, pos = v
        nodes = [ListNode(x) for x in values]
        for i in range(len(nodes) - 1):
            nodes[i].next = nodes[i + 1]
        if nodes and pos >= 0:
            nodes[-1].next = nodes[pos]
        return nodes[0] if nodes else None
    if type_ == "TreeNode":
        if not v or v[0] is None:
            return None
        root = TreeNode(v[0])
        queue, i = [root], 1
        for node in queue:
            if i >= len(v):
                break
            if v[i] is not None:
                node.left = TreeNode(v[i])
                queue.append(node.left)
            i += 1
            if i < len(v):
                if v[i] is not None:
                    node.right = TreeNode(v[i])
                    queue.append(node.right)
                i += 1
        return root
    return copy.deepcopy(v)


def canon(type_, v):
    """Canonical JSON form of a value: trees lose trailing nulls."""
    if type_ == "TreeNode":
        v = list(v)
        while v and v[-1] is None:
            v.pop()
    return v


def from_py(type_, r):
    """What the Python solution returned -> plain JSON value (and a type check, like the harness's BadType)."""
    if type_ == "int":
        assert type(r) is int, f"returned {r!r}, expected an int"
        return r
    if type_ == "bool":
        assert type(r) is bool, f"returned {r!r}, expected a bool"
        return r
    if type_ == "string":
        assert isinstance(r, str), f"returned {r!r}, expected a string"
        return r
    if type_ == "int[]":
        assert isinstance(r, list) and all(type(x) is int for x in r), f"returned {r!r}, expected a list of ints"
        return list(r)
    if type_ == "ListNode":
        assert r is None or isinstance(r, ListNode), f"returned {r!r}, expected a ListNode or None"
        out = []
        while r is not None:
            out.append(r.val)
            r = r.next
            assert len(out) < 300000, "cycle in returned list"
        return out
    if type_ == "TreeNode":
        assert r is None or isinstance(r, TreeNode), f"returned {r!r}, expected a TreeNode or None"
        if r is None:
            return []
        out, queue = [], [r]
        for node in queue:
            if node is None:
                out.append(None)
            else:
                out.append(node.val)
                queue.append(node.left)
                queue.append(node.right)
            assert len(queue) < 600000, "cycle in returned tree"
        return canon("TreeNode", out)
    raise AssertionError(f"unsupported type {type_}")


def call(fn, sig, args):
    """Run a Python solution on plain JSON args and return plain JSON (so results can be compared and stored)."""
    real = [to_py(p["type"], a) for p, a in zip(sig["params"], args)]
    return from_py(sig["returns"], fn(*real))


def load_solutions(folder):
    spec = importlib.util.spec_from_file_location("solutions_" + folder.name.replace("-", "_"), folder / "solutions.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.__dict__.update(NODE_NAMESPACE)  # solutions may use ListNode / TreeNode, like in the harness
    return mod


def load_other_languages():
    """content/other-languages/<language>.txt holds one optimal solution per problem, split by '//### <slug>' lines."""
    out = {}
    for language in ("javascript", "java", "cpp"):
        out[language] = {}
        folder = HERE / "other-languages"
        for path in [folder / f"{language}.txt", *sorted(folder.glob(f"{language}.*.txt"))]:  # java.txt, java.more.txt, ... (never javascript.*)
            parts = re.split(r"^//### (\S+)\n", path.read_text(encoding="utf-8"), flags=re.M)
            for i in range(1, len(parts), 2):
                assert parts[i] not in out[language], f"{path.name}: duplicate solution for {parts[i]}"
                out[language][parts[i]] = parts[i + 1].rstrip() + "\n"
    return out


OTHER = load_other_languages()


def build_problem(folder):
    meta = json.loads((folder / "problem.json").read_text(encoding="utf-8"))
    mod = load_solutions(folder)
    slug, sig = meta["slug"], meta["signature"]
    assert slug == folder.name, f"{slug}: slug must match folder name"
    assert meta["concept"] in CONCEPT_KEYS, f"{slug}: unknown concept {meta['concept']}"
    assert meta["difficulty"] in RATING, f"{slug}: bad difficulty"
    n_params = len(sig["params"])
    for prm in sig["params"]:
        assert prm["type"] in PARAM_TYPES, f"{slug}: unsupported parameter type {prm['type']}"
    assert sig["returns"] in RETURN_TYPES, f"{slug}: unsupported return type {sig['returns']}"
    funcs = {name: getattr(mod, name) for name in ("brute", "better", "optimal") if hasattr(mod, name)}
    assert "brute" in funcs and "optimal" in funcs, f"{slug}: needs brute and optimal"
    brute_ok = getattr(mod, "BRUTE_OK", lambda args: True)
    expect_slow = getattr(mod, "EXPECT_SLOW", set())

    # --- tests: examples (visible), edge (hidden), random (hidden); deduplicated by args
    tests, seen = [], set()

    def add(args, kind, expected=None):
        assert len(args) == n_params, f"{slug}: {kind} test has {len(args)} args, signature has {n_params}"
        key = json.dumps(args)
        if key in seen:
            return
        seen.add(key)
        tests.append({"args": args, "kind": kind, "visible": kind == "example", "expected": expected})

    for ex in meta["examples"]:
        add(ex["args"], "example", ex["expected"])
    for args in meta["edgeTests"]:
        add(args, "edge")
    rng = random.Random(slug)
    for _ in range(RANDOM_TESTS):
        add(mod.gen(rng), "random")

    # --- expected outputs + agreement checks
    for t in tests:
        run = lambda name: call(funcs[name], sig, t["args"])
        if brute_ok(t["args"]):
            truth = run("brute")
        else:
            truth = run("better")  # brute is too slow here; `better` must exist
        for name in funcs:
            if name == "brute" and not brute_ok(t["args"]):
                continue
            got = run(name)
            assert got == truth, f"{slug}: {name} disagrees on {t['args']}: {got!r} vs {truth!r}"
        if t["kind"] == "example":
            assert canon(sig["returns"], t["expected"]) == truth, f"{slug}: hand-written example answer {t['expected']!r} != solution {truth!r} for {t['args']}"
        t["expected"] = truth
    for i, t in enumerate(tests):
        t["idx"] = i
        t["problem"] = slug

    # --- reference solutions as source code with the problem's function name
    refs = []
    for name, fn in funcs.items():
        src = re.sub(rf"\b{name}\b", sig["name"], inspect.getsource(fn))
        ast.parse(src, feature_version=(3, 8))  # Judge0's Python is 3.8
        # The stored source must work on its own (no helpers from solutions.py): run it in an empty namespace
        namespace = dict(NODE_NAMESPACE)  # only what the harness provides
        exec(src, namespace)
        for t in tests:
            if name == "brute" and not brute_ok(t["args"]):
                continue
            got = call(namespace[sig["name"]], sig, t["args"])
            assert got == t["expected"], f"{slug}: stored {name} source is not self-contained or wrong on {t['args']}: {got!r} vs {t['expected']!r}"
        time_c, space_c = mod.APPROACHES[name]
        only = [t["idx"] for t in tests if brute_ok(t["args"])] if name == "brute" and hasattr(mod, "BRUTE_OK") else None
        refs.append({"problem": slug, "approach": name, "language": "python", "code": src,
                     "time": time_c, "space": space_c, "expectSlow": name in expect_slow, "testIdx": only})

    for language, by_slug in OTHER.items():
        assert slug in by_slug, f"{slug}: missing {language} solution in other-languages/{language}.txt"
        time_c, space_c = mod.APPROACHES["optimal"]
        refs.append({"problem": slug, "approach": "optimal", "language": language, "code": by_slug[slug],
                     "time": time_c, "space": space_c, "expectSlow": False, "testIdx": None})

    problem = {k: meta[k] for k in ("slug", "title", "concept", "difficulty", "statement", "constraints",
                                    "signature", "examples", "expected", "hints")}
    problem["rating"] = RATING[meta["difficulty"]]
    # examples keep the author's answers; they were verified against the solutions above
    return problem, tests, refs


def main():
    problems, tests, refs = [], [], []
    empty = []
    for folder in sorted(p for p in (HERE / "problems").iterdir() if p.is_dir()):
        if not (folder / "problem.json").exists():  # a folder created for a problem that is not written yet
            empty.append(folder.name)
            continue
        p, t, r = build_problem(folder)
        problems.append(p); tests += t; refs += r
        print(f"ok  {p['slug']:<18} {p['concept']:<15} {p['difficulty']:<7} {len(t):>2} tests, {len(r)} reference solutions (4 languages)")
    out = {"concepts": [{"key": k, "name": n, "prerequisites": pre, "order": i} for i, (k, n, pre) in enumerate(CONCEPTS)],
           "problems": problems, "testCases": tests, "referenceSolutions": refs}
    (HERE / "build").mkdir(exist_ok=True)
    (HERE / "build" / "content.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(f"wrote content/build/content.json: {len(problems)} problems, {len(tests)} tests, {len(refs)} reference solutions")
    print(f"progress: {len(problems)} of {TARGET_PROBLEMS} target problems written" + (f" ({len(empty)} folders still empty)" if empty else " (all folders filled)"))


if __name__ == "__main__":
    try:
        main()
    except AssertionError as e:
        print("BUILD FAILED:", e)
        sys.exit(1)
