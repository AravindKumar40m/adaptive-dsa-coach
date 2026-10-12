// Builds the Python program that times a learner's function at growing input sizes, and reads its output.
// Pure functions: no database, no Judge0. The maths on the timings is in analyze.js.
//
// The program is: the learner's code, then our input generator (`_make`, from content/complexity/scales.py), then a timing loop.
// For each size n it builds an input, then times the learner's function IN THE PROGRAM (so Python's start-up is not counted):
// the fastest of 3 batches of repeated calls, each call on a fresh copy of the input (a function that sorts its input in place
// must not get an already sorted one the second time). It stops when one call takes over 0.3 s or the whole run passed 3 s.
// Every measurement is printed as soon as it exists, so a run that Judge0 has to stop still leaves usable points.
export const STOP_NS = 300_000_000; // stop growing the input once one call takes this long
export const TOTAL_SECONDS = 3; // and never keep growing for longer than this in total

const PROGRAM = String.raw`
import gc as _gc, random as _random, sys as _sys, time as _time

__CODE__

__MAKE__

_NONCE = "__NONCE__"
_FN = "__FUNCTION__"
_SIZES = __SIZES__
_STOP_NS = __STOP_NS__
_TOTAL_S = __TOTAL_S__

def _copy(x):
    if isinstance(x, list):
        return [list(y) for y in x] if x and isinstance(x[0], list) else list(x)
    return x

def _size(args):
    return sum(len(a) for a in args if isinstance(a, (list, str))) or 1

def _emit(text):
    _sys.stdout.write("@@C" + _NONCE + "@@" + text + "@@\n")
    _sys.stdout.flush()

def _timed(fn, args):
    now = _time.perf_counter_ns
    probe = [_copy(a) for a in args]
    t0 = now()
    fn(*probe)
    first = now() - t0
    if first > 150000000:
        return first, 1
    reps = max(1, min(400, 3000000 // max(first, 2000), 3000000 // _size(args)))
    best = first
    for _ in range(3):
        batch = [[_copy(a) for a in args] for _ in range(reps)]
        t0 = now()
        for b in batch:
            fn(*b)
        per = (now() - t0) // reps
        if per < best:
            best = per
    return best, reps

def _main():
    fn = globals().get(_FN)
    if fn is None:
        _emit("ERR:0:MissingFunction")
        return
    rng = _random.Random(20261012)
    started = _time.perf_counter()
    _gc.disable()
    for n in _SIZES:
        if _time.perf_counter() - started > _TOTAL_S:
            break
        try:
            args = _make(n, rng)
            ns, reps = _timed(fn, args)
        except BaseException as e:
            _emit("ERR:%d:%s" % (n, type(e).__name__))
            break
        _emit("%d:%d:%d" % (n, ns, reps))
        if ns > _STOP_NS:
            break

_main()
`;

/**
 * @param {{code:string, config:{make:string, sizes:number[], functionName:string}, nonce:string}} a
 * @returns {string} the Python program
 */
export function buildComplexityProgram({ code, config, nonce }) {
  if (!/^[a-f0-9]{8,32}$/.test(nonce)) throw new Error("bad nonce");
  if (!/^[a-z_][a-z0-9_]*$/.test(config.functionName)) throw new Error("bad function name");
  // the learner's code goes in LAST (and through a function, so "$&" and friends in it stay as written): nothing they
  // write can then be changed by one of our own replacements
  return PROGRAM
    .replace("__MAKE__", () => config.make)
    .replace("__NONCE__", nonce)
    .replace("__FUNCTION__", config.functionName)
    .replace("__SIZES__", JSON.stringify(config.sizes))
    .replace("__STOP_NS__", String(STOP_NS))
    .replace("__TOTAL_S__", String(TOTAL_SECONDS))
    .replace("__CODE__", () => code);
}

/**
 * Reads the program's output. Only lines carrying OUR random marker count, so the learner's own prints (or a forged line
 * without the marker) are ignored.
 * @returns {{points:{n:number, ns:number, reps:number}[], error:{n:number, name:string}|null}}
 */
export function parseMeasurements(stdout, nonce) {
  const points = [];
  let error = null;
  const re = new RegExp(`@@C${nonce}@@([^@\\n]*)@@`, "g");
  for (const m of stdout.matchAll(re)) {
    const text = m[1];
    if (text.startsWith("ERR:")) {
      const [, n, name] = text.split(":");
      error = { n: Number(n), name: String(name ?? "Error").slice(0, 60) };
    } else {
      const [n, ns, reps] = text.split(":").map(Number);
      if (Number.isFinite(n) && Number.isFinite(ns) && ns > 0 && n > 0) points.push({ n, ns, reps: Number.isFinite(reps) ? reps : 1 });
    }
  }
  return { points, error };
}
