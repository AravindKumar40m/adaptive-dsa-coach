"""Checks the placement quiz question bank (content/placement/items.py) and writes content/build/placement.json.

Run:  python content/build_placement.py      (npm run content:placement also loads the result into MongoDB)

What it proves, so a wrong question never reaches a learner:
  - every topic has exactly 3 questions, levels 1, 2 and 3 (48 in all), with unique ids
  - every question has 4 distinct options and one marked answer, and sane lengths
  - for `trace` questions the code is RUN and the marked option must be exactly what it prints,
    and no other option may be (so there is never a second correct answer)
  - `mcq` questions cannot be machine-checked: a person has to read them (printed at the end)
"""
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE / "placement"))
from items import ITEMS  # noqa: E402

BANK_VERSION = "placement-bank-1"
LIMITS = dict(prompt=320, code=1000, option=130, explain=520)

concepts = [c["key"] for c in json.loads((HERE / "build" / "content.json").read_text(encoding="utf-8"))["concepts"]]
errors = []


def fail(item, message):
    errors.append(f"{item.get('concept')}-L{item.get('level')}: {message}")


def run_code(code):
    result = subprocess.run([sys.executable, "-I", "-c", code], capture_output=True, text=True, timeout=10)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip().splitlines()[-1] if result.stderr.strip() else "non-zero exit")
    return result.stdout.strip()


seen_ids = set()
out = []
for item in ITEMS:
    iid = f"{item['concept']}-L{item['level']}"
    if iid in seen_ids:
        fail(item, "duplicate id")
    seen_ids.add(iid)
    if item["concept"] not in concepts:
        fail(item, f"unknown topic (known: {', '.join(concepts)})")
    if item["level"] not in (1, 2, 3):
        fail(item, "level must be 1, 2 or 3")
    if item["kind"] not in ("mcq", "trace"):
        fail(item, "kind must be mcq or trace")
    opts = item["options"]
    if len(opts) != 4 or len(set(opts)) != 4 or any(not str(o).strip() for o in opts):
        fail(item, "needs exactly 4 distinct, non-empty options")
    if not (0 <= item["answer"] < len(opts)):
        fail(item, "answer index out of range")
    for key, text in (("explain", item["explain"]),) + ((("prompt", item["prompt"]),) if item["kind"] == "mcq" else (("code", item["code"]),)):
        if not str(text).strip():
            fail(item, f"{key} is empty")
        elif len(text) > LIMITS[key]:
            fail(item, f"{key} is {len(text)} characters (limit {LIMITS[key]})")
    for o in opts:
        if len(o) > LIMITS["option"]:
            fail(item, f"an option is {len(o)} characters (limit {LIMITS['option']})")
    if item["kind"] == "trace":
        if "code" not in item:
            fail(item, "a trace question needs code")
        else:
            try:
                actual = run_code(item["code"])
            except Exception as e:  # the snippet itself is broken
                fail(item, f"the code does not run: {e}")
                continue
            if opts[item["answer"]].strip() != actual:
                fail(item, f"marked answer {opts[item['answer']]!r} but the code prints {actual!r}")
            for i, o in enumerate(opts):
                if i != item["answer"] and o.strip() == actual:
                    fail(item, f"option {i} ({o!r}) is ALSO what the code prints: two correct answers")
    prompt = item.get("prompt") or "What does this code print?"
    out.append(dict(id=iid, concept=item["concept"], level=item["level"], kind=item["kind"], prompt=prompt,
                    code=item.get("code"), options=opts, answer=item["answer"], explain=item["explain"]))

# exactly 3 levels per topic, every topic covered
per = Counter(i["concept"] for i in out)
for c in concepts:
    if per[c] != 3:
        errors.append(f"{c}: has {per[c]} questions, needs exactly 3 (one per level)")

if errors:
    print("PLACEMENT BANK HAS PROBLEMS:")
    for e in errors:
        print("  -", e)
    sys.exit(1)

(HERE / "build").mkdir(exist_ok=True)
(HERE / "build" / "placement.json").write_text(json.dumps(dict(version=BANK_VERSION, items=out), indent=1), encoding="utf-8")
kinds = Counter(i["kind"] for i in out)
positions = Counter(i["answer"] for i in out)
print(f"placement bank OK: {len(out)} questions over {len(concepts)} topics ({kinds['trace']} trace, all executed and matched; {kinds['mcq']} concept questions)")
print(f"marked-answer positions as written (the server shuffles them anyway): {dict(sorted(positions.items()))}")
print(f"wrote content/build/placement.json ({BANK_VERSION})")
print("A person must still read the", kinds["mcq"], "concept (mcq) questions: they are not machine-checked.")
