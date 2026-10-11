import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Lock } from "./icons.jsx";

// Group topics into columns by how many steps of prerequisites lie behind them.
function layers(skills) {
  const byKey = new Map(skills.map((s) => [s.concept, s]));
  const depth = new Map();
  const of = (key, seen = new Set()) => {
    if (depth.has(key)) return depth.get(key);
    if (seen.has(key)) return 0; // a cycle in the data must not hang the page
    seen.add(key);
    const prereqs = (byKey.get(key)?.prerequisites ?? []).filter((p) => byKey.has(p));
    const d = prereqs.length ? 1 + Math.max(...prereqs.map((p) => of(p, seen))) : 0;
    depth.set(key, d);
    return d;
  };
  skills.forEach((s) => of(s.concept));
  const cols = [];
  for (const s of skills) (cols[depth.get(s.concept)] ??= []).push(s);
  return cols.filter(Boolean);
}

export function SkillMap({ skills, startRating, onOpen }) {
  const cols = useMemo(() => layers(skills), [skills]);
  const box = useRef(null);
  const nodes = useRef(new Map());
  const [edges, setEdges] = useState([]);

  // Draw a curve from the right edge of each prerequisite to the left edge of the topic that needs it.
  useLayoutEffect(() => {
    const measure = () => {
      if (!box.current) return;
      const origin = box.current.getBoundingClientRect();
      const out = [];
      for (const s of skills) {
        const to = nodes.current.get(s.concept)?.getBoundingClientRect();
        if (!to) continue;
        for (const p of s.prerequisites) {
          const from = nodes.current.get(p)?.getBoundingClientRect();
          if (!from) continue;
          const x1 = from.right - origin.left, y1 = from.top + from.height / 2 - origin.top;
          const x2 = to.left - origin.left, y2 = to.top + to.height / 2 - origin.top;
          const mid = (x1 + x2) / 2;
          out.push({ id: `${p}>${s.concept}`, d: `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`, open: s.unlocked });
        }
      }
      setEdges(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [skills]);

  return (
    <div className="map-scroll">
      <div className="map" ref={box}>
        <svg className="edges" aria-hidden="true">
          {edges.map((e) => (<path key={e.id} d={e.d} className={`edge ${e.open ? "open" : ""}`} />))}
        </svg>
        {cols.map((col, i) => (
          <div className="map-col" key={i}>
            {col.map((s) => {
              const mastered = s.total > 0 && s.solved === s.total;
              const delta = Math.round(s.rating - startRating);
              const label = `${s.name}: rating ${Math.round(s.rating)}, ${s.solved} of ${s.total} solved${s.unlocked ? "" : `, locked until ${s.missing.join(", ").replaceAll("_", " ")}`}`;
              return (
                <button
                  key={s.concept}
                  ref={(el) => { if (el) nodes.current.set(s.concept, el); }}
                  className={`node ${s.unlocked ? "" : "locked"} ${mastered ? "mastered" : ""}`}
                  onClick={() => onOpen(s.concept)}
                  aria-label={label}
                  title={s.unlocked ? `${s.solved} of ${s.total} solved. Click to see its problems.` : `Locked: finish ${s.missing.join(", ").replaceAll("_", " ")} first`}
                >
                  <div className="node-name">
                    <span>{s.name}</span>
                    {!s.unlocked ? <Lock size={14} /> : mastered ? <Check size={15} style={{ color: "var(--ok)" }} /> : null}
                  </div>
                  <div className="node-rating num">
                    {Math.round(s.rating)}
                    {s.attempts > 0 && delta !== 0 && <small className={delta > 0 ? "up" : "down"}>{delta > 0 ? "+" : ""}{delta}</small>}
                  </div>
                  <div className={`progress ${mastered ? "done" : ""}`}><i style={{ width: `${s.total ? (100 * s.solved) / s.total : 0}%` }} /></div>
                  <div className="node-foot"><span>{s.solved} / {s.total} solved</span></div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
