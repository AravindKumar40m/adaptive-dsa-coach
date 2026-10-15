"""One-off: merge skill tags for the 100 problems added on 2026-10-14 (batch 4, 280 -> 380).

Keeps the 280 earlier entries exactly as they were (they hold hand corrections that a rerun of
tag_skills.py would erase), takes the tagger's proposals for the new ones, applies the hand
corrections below, and rewrites skills-review.md from the merged result.

Usage (from server/content, after tag_skills.py has written its proposals into skills.json):
    python merge_skill_tags_batch4_once.py <copy of skills.json made before running tag_skills.py>
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
before = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
proposed = json.loads((HERE / "skills.json").read_text(encoding="utf-8"))

# slug -> (skills, reason). Weights of each entry add up to 1.0; the main concept stays the same.
CORRECTIONS = {
    "is-graph-a-tree": ([("graphs", 1.0)], "'trees' came from the word tree; the check is union-find on a general graph"),
    "island-max-area": ([("graphs", 1.0)], "'stack_queue' is only the explicit stack used for the flood fill"),
    "kth-lexicographic-number": ([("recursion", 1.0)], "'trees' is only the picture of prefixes; there is no tree input"),
    "longest-univalue-path": ([("trees", 0.7), ("recursion", 0.3)], "'two_pointers' came from the word pointer in a hint"),
    "lucky-numbers-in-matrix": ([("arrays", 1.0)], "'sorting' only orders the output"),
    "min-depth": ([("trees", 1.0)], "'graphs' came from the word breadth-first; level order is a tree skill"),
    "min-height-roots": ([("graphs", 0.7), ("trees", 0.3)], "'sorting' only orders the output; the input is a tree given as edges"),
    "nth-magical-number": ([("binary_search", 1.0)], "'sorting' appears only in the helper solution that lists one period"),
    "shortest-tour-all-cities": ([("backtracking", 0.6), ("dp", 0.4)], "'hashing' came from a hint word; the table is indexed by bitmasks"),
    "smaller-to-the-right-counts": ([("sorting", 1.0)], "'trees' came from the words Fenwick tree; the skill is ranking and counting by order"),
    "strongly-connected-count": ([("graphs", 1.0)], "'trees' came from words in a hint; the search trees are only a tool"),
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
print(f"{len(result)} entries; the 280 earlier ones unchanged; {len(hand)} new ones hand-corrected")
