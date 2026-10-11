"""Proposes which SKILLS each problem needs (a "Q-matrix"), so one solve can update several skills.

Every problem has one main concept already. This script adds up to two SECONDARY skills when there is evidence:
  * code evidence : the optimal / better Python solution really uses a hash set or map, sorting, a heap, a deque, binary
                    search, recursion or memoization;
  * hint evidence : the "pattern" hint (strong) or the nudge / walkthrough (weak) names a technique.
Weights: no secondary -> main 1.0 ; one -> 0.7 + 0.3 ; two -> 0.6 + 0.2 + 0.2.

Output:
  skills.json        slug -> {skills: [{concept, weight}], evidence: {concept: [why, ...]}}   (read by build.py)
  skills-review.md   a table for a human to read and correct. THIS IS AN AUTOMATIC PROPOSAL, NOT A VERDICT.

Run:  python3 tag_skills.py        (then read skills-review.md, edit skills.json if something is wrong, rebuild)
"""
import json, re
from pathlib import Path

HERE = Path(__file__).parent
ORDER = ["arrays", "strings", "hashing", "two_pointers", "sorting", "sliding_window", "stack_queue", "linked_list",
         "recursion", "binary_search", "trees", "heaps", "graphs", "greedy", "backtracking", "dp"]

# words in the hints that name a technique ("strings" and "arrays" are too common to use as evidence)
HINT_WORDS = {
    "hashing": r"\bhash( ?map| ?table| ?set)?\b|\bdictionary\b|\bcounter\b|\bfrequency (map|table|count)|\bset of\b|\blookup",
    "two_pointers": r"two[- ]pointers?|\bleft and right\b|from both ends|\btwo indices\b",
    "sliding_window": r"sliding window|\bwindow\b",
    "sorting": r"\bsort(ed|ing)?\b",
    "stack_queue": r"\bstack\b|\bqueue\b|\bdeque\b|\bmonotonic\b",
    "binary_search": r"binary search|\bhalv(e|ing)\b|\bmid\b",
    "recursion": r"recurs(ion|ive|ively)|\bcalls? itself\b|\bbase case\b",
    "backtracking": r"backtrack|undo (the|that|your) (choice|move)",
    "dp": r"dynamic programming|\bmemo(ize|ization|ised|ized)?\b|\bdp\b|\bsubproblem",
    "greedy": r"\bgreedy\b|locally (best|optimal)|exchange argument",
    "heaps": r"\bheap\b|priority queue",
    "graphs": r"\bgraph\b|\bbfs\b|\bdfs\b|breadth-first|depth-first",
    "trees": r"\bbinary tree\b|\bsubtree\b|\btree\b",
    "linked_list": r"linked list|\bdummy node\b",
}

# things the solution code does
CODE_PATTERNS = {
    "hashing": (r"\bdict\(|\bset\(|\bCounter\b|\bdefaultdict\b|\{\s*\}|\{[^}\n]*:[^}\n]*\}|\{[^}\n]+ for ", "uses a dict / set", "weak"),
    "sorting": (r"\bsorted\(|\.sort\(", "sorts the data", "strong"),
    "heaps": (r"\bheapq\b|\bheappush\b|\bheappop\b", "uses a heap", "strong"),
    "stack_queue": (r"\bdeque\b|\bpopleft\b", "uses a deque / queue", "strong"),
    "binary_search": (r"\bbisect\b", "uses bisect", "strong"),  # a "mid =" also appears in merge sort, so it is not evidence
    "dp": (r"lru_cache|@cache\b|\bdp\s*=|\bmemo\s*=", "memoizes or fills a dp table", "strong"),
}


def function_source(source, name):
    """Source text of a top-level function (up to the next top-level def / assignment)."""
    m = re.search(rf"^def {name}\(.*?(?=^\S)", source + "\n_", re.S | re.M)
    return m.group(0) if m else ""


def own_body(lines, start):
    """The lines indented deeper than the `def` at lines[start]."""
    indent = len(lines[start]) - len(lines[start].lstrip())
    body = []
    for line in lines[start + 1:]:
        if line.strip() and len(line) - len(line.lstrip()) <= indent:
            break
        body.append(line)
    return "\n".join(body)


def code_evidence(source, concept):
    out = {}
    for name in ("optimal", "better"):
        body = function_source(source, name)
        if not body:
            continue
        for conc, (pattern, why, kind) in CODE_PATTERNS.items():
            if re.search(pattern, body):
                out.setdefault(conc, []).append(f"code{'(weak)' if kind == 'weak' else ''}: {name}() {why}")
        # recursion: a function (inner or the solution itself) whose OWN body calls its own name
        lines = body.split("\n")
        for i, line in enumerate(lines):
            m = re.match(r"\s*def (\w+)\(", line)
            if m and re.search(rf"\b{m.group(1)}\(", own_body(lines, i)):
                out.setdefault("recursion", []).append(f"code: {name}() has a function ({m.group(1)}) that calls itself")
    # a dict used as a memo table says "dynamic programming", not "hashing"
    if "dp" in out:
        out.pop("hashing", None)
    return out


def propose(folder):
    meta = json.loads((folder / "problem.json").read_text(encoding="utf-8"))
    source = (folder / "solutions.py").read_text(encoding="utf-8")
    primary = meta["concept"]
    evidence = {}
    for conc, reasons in code_evidence(source, primary).items():
        evidence.setdefault(conc, []).extend(reasons)
    hints = {k: re.sub(r"topological(ly)? sort(ed|ing)?", "topological-order", v, flags=re.I) for k, v in meta["hints"].items()}
    for conc, pattern in HINT_WORDS.items():
        if re.search(pattern, hints["pattern"], re.I):
            evidence.setdefault(conc, []).append("hint: the pattern hint names it")
        elif re.search(pattern, hints["nudge"] + " " + hints["walkthrough"], re.I):
            evidence.setdefault(conc, []).append("hint: the nudge/walkthrough mentions it")
    types = {p["type"] for p in meta["signature"]["params"]}
    if "string" in types and primary != "strings":
        evidence.setdefault("strings", []).append("input: the problem takes a string")
    if "TreeNode" in types and primary != "trees":
        evidence.setdefault("trees", []).append("input: the problem takes a tree")
    if types & {"ListNode", "CycleList"} and primary != "linked_list":
        evidence.setdefault("linked_list", []).append("input: the problem takes a linked list")
    evidence.pop(primary, None)

    def strength(conc):  # how convincing: code or the pattern hint count fully, the weaker hints count half
        return sum(1.0 if (r.startswith("code:") or "pattern hint" in r or r.startswith("input")) else 0.5 for r in evidence[conc])

    chosen = sorted((c for c in evidence if strength(c) >= 1.0), key=lambda c: (-strength(c), ORDER.index(c)))[:2]
    weights = {0: [1.0], 1: [0.7, 0.3], 2: [0.6, 0.2, 0.2]}[len(chosen)]
    skills = [{"concept": primary, "weight": weights[0]}] + [{"concept": c, "weight": w} for c, w in zip(chosen, weights[1:])]
    return meta["slug"], {"skills": skills, "evidence": {c: evidence[c] for c in chosen}, "ignoredWeakEvidence": sorted(set(evidence) - set(chosen))}


if __name__ == "__main__":
    result = {}
    for folder in sorted((HERE / "problems").iterdir()):
        if (folder / "problem.json").exists():
            slug, info = propose(folder)
            result[slug] = info
    (HERE / "skills.json").write_text(json.dumps(result, indent=1), encoding="utf-8")

    rows = ["# Proposed skill tags (automatic, needs a human read)", "",
            "Main concept first with its weight; secondary skills only where there is evidence. Edit `skills.json` to correct anything, "
            "then run `npm run content:build && npm run content:seed`.", "",
            "| problem | skills (weight) | why the extra skills |", "|---|---|---|"]
    for slug, info in result.items():
        skills = ", ".join(f"{s['concept']} {s['weight']}" for s in info["skills"])
        why = "; ".join(f"{c}: {', '.join(r)}" for c, r in info["evidence"].items()) or "-"
        rows.append(f"| {slug} | {skills} | {why} |")
    (HERE / "skills-review.md").write_text("\n".join(rows) + "\n", encoding="utf-8")

    counts = {0: 0, 1: 0, 2: 0}
    extra = {}
    for info in result.values():
        counts[len(info["skills"]) - 1] += 1
        for s in info["skills"][1:]:
            extra[s["concept"]] = extra.get(s["concept"], 0) + 1
    print(f"{len(result)} problems tagged: {counts[0]} with 1 skill, {counts[1]} with 2, {counts[2]} with 3")
    print("secondary skills by concept:", dict(sorted(extra.items(), key=lambda kv: -kv[1])))
