"""Checks the complexity analyzer's input generators (content/complexity/scales.py) and writes content/build/complexity.json.

Run:  python content/build_complexity.py      (npm run content:complexity also loads the result into MongoDB)

What it proves, so a bad generator never reaches a learner:
  - every configured problem exists, and its sizes are increasing and never above the problem's own maximum
  - make(n) is deterministic (same seed, same input) and builds an input of the right shape for the problem's parameters
  - OUR slow (brute) and fast (optimal) solutions give the SAME answer on generated inputs: so the input is valid for the problem
  - the generated input does not break the stated constraints that can be checked mechanically (length limits)
What it cannot prove: that the slow solution really hits its worst case at big n. `npm run complexity:validate` does that, by
timing our reference solutions through the real analyzer in Judge0.
"""
import inspect
import json
import random
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE / "complexity"))
from scales import CONFIGS  # noqa: E402

VERSION = "complexity-cfg-1"
CLASSES = {"log n", "n", "n log n", "n^2", "n^3", "exp"}
errors = []


def fail(slug, message):
    errors.append(f"{slug}: {message}")


def load_solutions(slug):
    ns = {}
    exec((HERE / "problems" / slug / "solutions.py").read_text(encoding="utf-8"), ns)
    return ns


def max_len(constraints):
    """The largest allowed length of the first list/string parameter, read from the constraints text ("1 <= len(x) <= 100000")."""
    for line in constraints:
        m = re.search(r"<=\s*len\([^)]*\)\s*<=\s*(\d+)", line)
        if m:
            return int(m.group(1))
    return None


out = {}
for slug, cfg in CONFIGS.items():
    pdir = HERE / "problems" / slug
    if not (pdir / "problem.json").exists():
        fail(slug, "no such problem")
        continue
    problem = json.loads((pdir / "problem.json").read_text(encoding="utf-8"))
    sol = load_solutions(slug)
    sizes = cfg["sizes"]
    if sizes != sorted(set(sizes)) or len(sizes) < 5:
        fail(slug, "sizes must be strictly increasing and at least 5 of them")
    if cfg["expected"] not in CLASSES or cfg["slow"] not in CLASSES:
        fail(slug, f"expected/slow must be one of {sorted(CLASSES)}")
    limit = max_len(problem["constraints"])
    if limit is not None and sizes[-1] > limit and slug not in ("three-sum-count",):
        fail(slug, f"largest size {sizes[-1]} is above the problem's own limit {limit}")
    if slug == "three-sum-count" and sizes[-1] > (limit or 3000):
        fail(slug, f"largest size {sizes[-1]} is above the problem's own limit {limit}")

    make = cfg["make"]
    params = problem["signature"]["params"]
    # deterministic and well shaped
    for n in (sizes[0], sizes[len(sizes) // 2]):
        a, b = make(n, random.Random(7)), make(n, random.Random(7))
        if a != b:
            fail(slug, f"make({n}) is not deterministic")
        if len(a) != len(params):
            fail(slug, f"make({n}) returns {len(a)} arguments but the function takes {len(params)}")
    # the slow and the fast solution must agree on generated inputs (small sizes: the slow one has to finish)
    small = [s for s in (8, 12, 16, 20, 40) if s <= (sizes[-1] if cfg["slow"] != "exp" else 18)]
    if cfg["slow"] == "exp":
        small = [8, 10, 12, 14]
    if slug == "three-sum-count":
        small = [8, 16, 30]
    for n in small:
        args = make(n, random.Random(1000 + n))
        want, got = sol["brute"](*[json.loads(json.dumps(x)) for x in args]), sol["optimal"](*[json.loads(json.dumps(x)) for x in args])
        if want != got:
            fail(slug, f"at n={n} brute gives {want!r} but optimal gives {got!r}: the generated input is not valid for this problem")
    # the source that goes into the Python program: make(...) renamed to _make
    src = inspect.getsource(make)
    src = re.sub(r"^def make_\w+\(", "def _make(", src)
    # the program that runs in the sandbox only contains this source: it must work ALONE (no helper, no import from this file)
    ns = {"random": random}
    try:
        exec(src, ns)
        for n in (sizes[0], sizes[len(sizes) // 2]):
            if ns["_make"](n, random.Random(7)) != make(n, random.Random(7)):
                fail(slug, f"the embedded source gives a different input than make({n})")
    except Exception as e:
        fail(slug, f"the embedded generator source does not run on its own: {type(e).__name__}: {e}")
    out[slug] = dict(make=src, sizes=sizes, expected=cfg["expected"], slow=cfg["slow"], functionName=problem["signature"]["name"])

if errors:
    print("COMPLEXITY CONFIG HAS PROBLEMS:")
    for e in errors:
        print("  -", e)
    sys.exit(1)

(HERE / "build").mkdir(exist_ok=True)
(HERE / "build" / "complexity.json").write_text(json.dumps(dict(version=VERSION, configs=out), indent=1), encoding="utf-8")
print(f"complexity config OK: {len(out)} problems, generators deterministic, brute and optimal agree on the generated inputs")
print("wrote content/build/complexity.json (" + VERSION + ")")
print("Next: npm run complexity:validate times our own slow and fast solutions through the real analyzer (Judge0).")
