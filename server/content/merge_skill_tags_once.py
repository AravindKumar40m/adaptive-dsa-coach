"""One-off: merge skill tags for the 100 problems added on 2026-10-14.

Keeps the 180 earlier entries exactly as they were (they hold hand corrections that a rerun of
tag_skills.py would erase), takes the tagger's proposals for the new ones, applies the hand
corrections below, and rewrites skills-review.md from the merged result.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
before = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))   # skills.json before the tagger ran
proposed = json.loads((HERE / "skills.json").read_text(encoding="utf-8"))  # the tagger's output

# slug -> (skills, reason). Weights of each entry add up to 1.0.
CORRECTIONS = {
    "decode-ways-count": ([("dp", 0.8), ("strings", 0.2)], "'recursion' came from the memoised helper; the intended solution is an iterative table"),
    "fair-cookie-split": ([("backtracking", 0.7), ("recursion", 0.3)], "'hashing' is only a set that skips repeated totals"),
    "find-all-duplicates": ([("arrays", 1.0)], "'sorting' only orders the output; the idea is marking values in place"),
    "k-closest-elements": ([("heaps", 0.6), ("binary_search", 0.4)], "the input is already sorted; the efficient solution is a binary search"),
    "max-tree-width": ([("trees", 1.0)], "'graphs' came from the word breadth-first; level order is a tree skill"),
    "min-palindrome-cuts": ([("dp", 0.8), ("strings", 0.2)], "'recursion' came from the memoised helper; the intended solution is an iterative table"),
    "shortest-cycle-length": ([("graphs", 0.8), ("stack_queue", 0.2)], "'trees' came from the words 'search tree' in a hint"),
    "sort-three-colors": ([("two_pointers", 0.7), ("sorting", 0.3)], "'binary_search' came from the word 'partition'; this is a three-way partition sort"),
    "unique-bst-count": ([("dp", 0.8), ("trees", 0.2)], "'recursion' came from the memoised helper; the table counts tree shapes"),
    "water-supply-min-cost": ([("graphs", 0.8), ("sorting", 0.2)], "'trees' came from the words 'spanning tree'"),
    "zigzag-levels": ([("trees", 1.0)], "'graphs' came from the word breadth-first; level order is a tree skill"),
}

result = {}
for slug, info in proposed.items():
    if slug in before:
        result[slug] = before[slug]           # untouched
    elif slug in CORRECTIONS:
        skills, reason = CORRECTIONS[slug]
        assert abs(sum(w for _, w in skills) - 1.0) < 1e-9, slug
        main = info["skills"][0]["concept"]
        assert skills[0][0] == main, f"{slug}: the main concept must stay {main}"
        result[slug] = {
            "skills": [{"concept": c, "weight": w} for c, w in skills],
            "evidence": {c: ["checked by hand 2026-10-14"] for c, _ in skills[1:]},
            "ignoredWeakEvidence": info.get("ignoredWeakEvidence", []),
            "correctedByHand": reason,
        }
    else:
        result[slug] = info

assert all(s in result for s in before) and len(result) == len(proposed)
assert all(result[s] == before[s] for s in before), "an original entry changed"
(HERE / "skills.json").write_text(json.dumps(result, indent=1), encoding="utf-8")

rows = ["# Proposed skill tags (automatic, needs a human read)", "",
        "Main concept first with its weight; secondary skills only where there is evidence. Edit `skills.json` to correct anything, "
        "then run `npm run content:build && npm run content:seed`.", "",
        "| problem | skills (weight) | why the extra skills |", "|---|---|---|"]
for slug, info in result.items():
    skills = ", ".join(f"{s['concept']} {s['weight']}" for s in info["skills"])
    why = "; ".join(f"{c}: {', '.join(r)}" for c, r in info["evidence"].items()) or "-"
    if info.get("correctedByHand"):
        why += f" (hand-corrected: {info['correctedByHand']})"
    rows.append(f"| {slug} | {skills} | {why} |")
(HERE / "skills-review.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
hand = [s for s in result if s in CORRECTIONS]
print(f"{len(result)} entries; the 180 earlier ones unchanged; {len(hand)} new ones hand-corrected")
