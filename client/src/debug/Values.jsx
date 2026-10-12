import { gridCursor, isGrid, isSeq, kindOf, show } from "./model.js";

// How a value is drawn: a number or text as itself, a list or string as a row of cells with positions and pointer markers,
// a grid as a table, a dictionary as key / value rows. `was` (scalars only) is the value before the last change.

const Scalar = ({ v }) => <span className={`val val-${kindOf(v)}`}>{show(v, 90)}</span>;

function Cells({ items, total, markers, end, big }) {
  return (
    <div className="cells-wrap">
      <div className="cells" role="list">
        {items.map((x, i) => (
          <div className={`cell ${markers?.[i] ? "marked" : ""}`} key={i} role="listitem">
            <span className="cell-val mono">{show(x, 14)}</span>
            <span className="cell-idx">{i}</span>
            <span className="cell-mark">{markers?.[i]?.join(" ")}</span>
          </div>
        ))}
        {total > items.length && <div className="cell more"><span className="cell-val mono">…</span><span className="cell-idx">{total - items.length} more</span></div>}
        {end?.length > 0 && (<div className="cell end" title="one past the last item"><span className="cell-val mono"> </span><span className="cell-idx">{total}</span><span className="cell-mark">{end.join(" ")}</span></div>)}
      </div>
      {big && <div className="faint cells-note">{total.toLocaleString("en-US")} items in all</div>}
    </div>
  );
}

function Grid({ v, vars }) {
  const cur = gridCursor(vars, v);
  const cols = Math.max(...v.v.map((r) => r.v.length));
  return (
    <div className="grid-wrap">
      <table className="grid-table mono">
        <thead><tr><th />{Array.from({ length: cols }, (_, c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {v.v.map((row, r) => (
            <tr key={r}><th>{r}</th>{row.v.map((x, c) => <td key={c} className={cur && cur.row === r && cur.col === c ? "here" : ""}>{show(x, 10)}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {v.n > v.v.length && <div className="faint cells-note">{v.n} rows in all</div>}
    </div>
  );
}

function Dict({ v }) {
  if (v.n === 0) return <span className="val">{"{}"}</span>;
  return (
    <table className="dict-table mono">
      <tbody>{v.v.map(([k, x], i) => (<tr key={i}><th>{show(k, 24)}</th><td>{show(x, 40)}</td></tr>))}</tbody>
    </table>
  );
}

/** the drawing of one variable: `pointer` is { cells, end } from pointers(), `vars` the whole frame (for the grid cursor) */
export function Value({ value, pointer, vars }) {
  if (typeof value === "string") {
    const chars = [...value.length > 40 ? value.slice(0, 40) : value];
    return value.length === 0 ? <span className="val val-str">""</span> : <Cells items={chars} total={value.length} markers={pointer?.cells} end={pointer?.end} big={value.length > 40} />;
  }
  if (isGrid(value)) return <Grid v={value} vars={vars} />;
  if (isSeq(value)) return value.n === 0 ? <span className="val">{value.$ === "tuple" ? "()" : "[]"}</span> : <Cells items={value.v} total={value.n} markers={pointer?.cells} end={pointer?.end} big={value.n > 40} />;
  if (value && typeof value === "object" && value.$ === "set") return <Cells items={value.v} total={value.n} />;
  if (value && typeof value === "object" && value.$ === "dict") return <Dict v={value} />;
  return <Scalar v={value} />;
}
