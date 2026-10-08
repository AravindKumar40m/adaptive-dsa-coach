"""Quality check on content/build/content.json: warns when a problem's tests are weak.
Weak = fewer than 15 tests, or one answer makes up too much of the tests (over 50%; over 75% for true/false problems), or too few distinct answers.
Usage: python content/check_quality.py [slug ...]      (default: every problem)
"""
import collections, json, sys
from pathlib import Path

data = json.loads((Path(__file__).parent / "build" / "content.json").read_text(encoding="utf-8"))
only = set(sys.argv[1:])
by = collections.defaultdict(list)
for t in data["testCases"]:
    by[t["problem"]].append(json.dumps(t["expected"]))
weak = 0
for slug in sorted(by):
    if only and slug not in only:
        continue
    counts = collections.Counter(by[slug])
    top, n = counts.most_common(1)[0]
    problems = []
    is_bool = set(counts) <= {"true", "false"}
    limit = 0.75 if is_bool else 0.5  # a true/false problem always has a majority; only flag a lopsided one
    if len(by[slug]) < 15:
        problems.append(f"only {len(by[slug])} tests")
    if n / len(by[slug]) > limit and len(by[slug]) >= 4:
        problems.append(f"answer {top} is {round(100 * n / len(by[slug]))}% of tests")
    if not is_bool and len(counts) < 3:
        problems.append(f"only {len(counts)} distinct answers")
    if problems:
        weak += 1
        print(f"WEAK {slug:<30} {'; '.join(problems)}")
print(f"{weak} weak problem(s) checked" if weak else "all checked problems have enough varied tests")
