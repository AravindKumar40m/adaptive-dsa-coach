"""Splits one content batch file into the per-problem files the build reads (stdlib only).

A batch file holds several problems in one text file, so a whole batch can be written and reviewed in one piece:

    === some-slug
    --- problem.json
    { ... }
    --- solutions.py
    ...
    --- javascript
    ...
    --- java
    ...
    --- cpp
    ...
    === next-slug
    ...

It writes  content/problems/<slug>/problem.json and solutions.py,  and  content/other-languages/<language>.batch<ID>.txt
(one '//### <slug>' section per problem, the format the build already reads).

Run (from server/):  python scripts/content/split_batch.py <batch-file> <ID>
Refuses to overwrite a problem folder that already exists, so it can never replace one of the 120 reviewed problems.
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONTENT = HERE.parent.parent / "content"
SECTIONS = {"problem.json", "solutions.py", "javascript", "java", "cpp"}


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: python scripts/content/split_batch.py <batch-file> <ID>")
    source, batch_id = Path(sys.argv[1]), sys.argv[2]
    assert re.fullmatch(r"[A-Za-z0-9]+", batch_id), "the ID must be letters and digits"
    text = source.read_text(encoding="utf-8")
    problems, slug, section, buf = {}, None, None, []

    def flush():
        if slug is not None and section is not None:
            problems[slug][section] = "\n".join(buf).strip("\n") + "\n"

    for line in text.split("\n"):
        if line.startswith("=== "):
            flush()
            slug, section, buf = line[4:].strip(), None, []
            assert re.fullmatch(r"[a-z0-9-]+", slug), f"bad slug {slug!r}"
            assert slug not in problems, f"{slug}: listed twice"
            problems[slug] = {}
        elif line.startswith("--- ") and slug is not None and line[4:].strip() in SECTIONS:
            flush()
            section, buf = line[4:].strip(), []
        else:
            buf.append(line)
    flush()

    for slug, parts in problems.items():
        missing = SECTIONS - set(parts)
        assert not missing, f"{slug}: missing sections {sorted(missing)}"
        folder = CONTENT / "problems" / slug
        assert not (folder / "problem.json").exists(), f"{slug}: already exists, refusing to overwrite"
    for slug, parts in problems.items():
        folder = CONTENT / "problems" / slug
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "problem.json").write_text(parts["problem.json"], encoding="utf-8")
        (folder / "solutions.py").write_text(parts["solutions.py"], encoding="utf-8")
    for language in ("javascript", "java", "cpp"):
        out = "".join(f"//### {slug}\n{parts[language]}" for slug, parts in problems.items())
        (CONTENT / "other-languages" / f"{language}.batch{batch_id}.txt").write_text(out, encoding="utf-8")
    print(f"wrote {len(problems)} problems: " + ", ".join(problems))


if __name__ == "__main__":
    main()
