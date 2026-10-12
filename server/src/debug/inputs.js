// Checks an input the learner typed for "step through my code", and turns a traced value back into a plain one. Pure.
// Kept small on purpose: this runs in the sandbox, but a huge input would only produce a trace nobody can read.
const LIMITS = { intAbs: 1_000_000_000, stringLen: 100, arrayLen: 30, rows: 12, cells: 80 };

function checkInt(v) {
  return Number.isInteger(v) && Math.abs(v) <= LIMITS.intAbs;
}

function checkOne(type, v) {
  switch (type) {
    case "int": return checkInt(v) ? null : `a whole number between -${LIMITS.intAbs} and ${LIMITS.intAbs}`;
    case "bool": return typeof v === "boolean" ? null : "true or false";
    case "string": return typeof v === "string" && v.length <= LIMITS.stringLen ? null : `text of at most ${LIMITS.stringLen} characters`;
    case "int[]": return Array.isArray(v) && v.length <= LIMITS.arrayLen && v.every(checkInt) ? null : `a list of at most ${LIMITS.arrayLen} whole numbers`;
    case "int[][]": {
      const ok = Array.isArray(v) && v.length <= LIMITS.rows && v.every((r) => Array.isArray(r) && r.every(checkInt)) && v.flat().length <= LIMITS.cells;
      return ok ? null : `a list of at most ${LIMITS.rows} rows with at most ${LIMITS.cells} numbers in all`;
    }
    default: return "a value of a type that cannot be traced";
  }
}

/** @returns {{ok:true, args:any[]}|{ok:false, error:string}} */
export function validateCustomArgs(params, args) {
  if (!Array.isArray(args) || args.length !== params.length) return { ok: false, error: `Give exactly ${params.length} value${params.length === 1 ? "" : "s"}, one for each parameter.` };
  for (let i = 0; i < params.length; i++) {
    const problem = checkOne(params[i].type, args[i]);
    if (problem) return { ok: false, error: `${params[i].name} must be ${problem}.` };
  }
  return { ok: true, args };
}

/** a traced value ({"$": "list", "v": [...]} and so on) as the plain JSON value it came from; used to compare with an expected output */
export function plainValue(v) {
  if (v && typeof v === "object" && typeof v.$ === "string") {
    if (v.$ === "list" || v.$ === "tuple" || v.$ === "set") return v.v.map(plainValue);
    return undefined; // dicts, objects and cut values never equal an expected output
  }
  return v;
}
