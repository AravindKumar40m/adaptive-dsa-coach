// Builds the Python program that RUNS a learner's function once with tracing on and prints every step, and reads its output.
// Pure functions: no database, no Judge0. The step-through UI replays what this records (no per-step server calls).
//
// What the program records (one entry per step):  line, function, call depth, the function's local variables (cut down and
// made JSON-safe), how much the program had printed by then; plus a "call tree" (every call with its arguments and its
// returned value) and how the run ended (returned a value / raised an exception / was stopped).
// It stops after MAX_STEPS steps or MAX_SECONDS seconds and says so (an endless loop must not hang the sandbox), by writing the
// result and leaving at once: a learner's `except:` cannot swallow that.
export const MAX_STEPS = 2000;
export const MAX_SECONDS = 2.5;
export const MAX_TRACE_BYTES = 3_000_000; // uncompressed JSON; also checked when reading
export const MAX_PRINTED = 4000; // characters of the learner's own output that are kept

const PROGRAM = String.raw`
import base64 as _b64, json as _json, os as _os, sys as _sys, time as _time, zlib as _zlib

_NONCE = "__NONCE__"
_FN = "__FUNCTION__"
_MAX_STEPS = __MAX_STEPS__
_MAX_SECONDS = __MAX_SECONDS__
_MAX_BYTES = __MAX_BYTES__
_MAX_PRINTED = __MAX_PRINTED__
_SRC = _b64.b64decode("__CODE__").decode("utf-8")
_ARGS = _json.loads(_b64.b64decode("__ARGS__").decode("utf-8"))
_REAL_OUT = _sys.stdout

def _snap(v, depth=0):
    # a JSON-safe, size-limited picture of a value: scalars as themselves, everything else as {"$": kind, ...}
    try:
        if v is None or isinstance(v, (bool, str)):
            return (v[:120] + "…") if isinstance(v, str) and len(v) > 120 else v
        if isinstance(v, int):
            return v if -9007199254740991 <= v <= 9007199254740991 else {"$": "int", "v": str(v)[:40]}
        if isinstance(v, float):
            return v if v == v and v not in (float("inf"), float("-inf")) else {"$": "float", "v": str(v)}
        if depth >= 3:
            return {"$": "obj", "v": "…"}
        if isinstance(v, (list, tuple, set, frozenset)):
            kind = "list" if isinstance(v, list) else "tuple" if isinstance(v, tuple) else "set"
            items = list(v) if kind != "set" else sorted(v, key=lambda x: (type(x).__name__, str(x)))
            return {"$": kind, "n": len(items), "v": [_snap(x, depth + 1) for x in items[:40]]}
        if isinstance(v, dict):
            items = list(v.items())
            return {"$": "dict", "n": len(items), "v": [[_snap(k, depth + 1), _snap(x, depth + 1)] for k, x in items[:20]]}
        return {"$": "obj", "v": repr(v)[:80]}
    except BaseException:
        return {"$": "obj", "v": "<unprintable>"}

def _locals(frame):
    out = {}
    for k, v in list(frame.f_locals.items()):
        if k.startswith("__") or callable(v) and not isinstance(v, (list, dict, tuple, set)) or type(v).__name__ == "module":
            continue
        out[k] = _snap(v)
    return out

class _Out:
    def __init__(self):
        self.parts, self.size = [], 0
    def write(self, s):
        s = str(s)
        if self.size < _MAX_PRINTED:
            self.parts.append(s[: _MAX_PRINTED - self.size])
        self.size = min(_MAX_PRINTED, self.size + len(s))
        return len(s)
    def flush(self):
        pass

_out = _Out()
_steps, _calls, _stack = [], [], []
_state = {"started": 0.0, "result": None, "truncated": None}
_raising = set()  # frames in which an exception was raised and not (yet) caught

def _finish(reason=None):
    if reason:
        _state["truncated"] = reason
    doc = {"steps": _steps, "calls": _calls, "truncated": _state["truncated"], "result": _state["result"], "output": "".join(_out.parts)}
    data = _json.dumps(doc, separators=(",", ":"))
    if len(data) > _MAX_BYTES:
        doc["steps"] = doc["steps"][: max(1, int(len(doc["steps"]) * _MAX_BYTES / len(data) * 0.8))]
        doc["truncated"] = "size"
        data = _json.dumps(doc, separators=(",", ":"))
    _REAL_OUT.write("@@D" + _NONCE + "@@" + _b64.b64encode(_zlib.compress(data.encode("utf-8"), 6)).decode("ascii") + "@@\n")
    _REAL_OUT.flush()

def _tracer(frame, event, arg):
    try:
        code = frame.f_code
        if code.co_filename != "<learner>" or code.co_name == "<module>":
            return None
        if event == "call":
            if len(_calls) < 400:
                _calls.append({"id": len(_calls), "p": _stack[-1] if _stack else -1, "f": code.co_name, "s": len(_steps),
                               "a": {k: _snap(v) for k, v in frame.f_locals.items()}})
                _stack.append(len(_calls) - 1)
            else:
                _stack.append(-2)  # call tree is full: still count the depth, record nothing
            return _tracer
        if len(_steps) >= _MAX_STEPS:
            _finish("steps")
            _os._exit(0)
        if _time.perf_counter() - _state["started"] > _MAX_SECONDS:
            _finish("time")
            _os._exit(0)
        base = {"l": frame.f_lineno, "f": code.co_name, "d": len(_stack), "o": _out.size}
        if event == "line":
            _raising.discard(id(frame))  # the frame went on running: the exception was caught
            base["v"] = _locals(frame)
            _steps.append(base)
        elif event == "return":
            base["v"] = _locals(frame)
            if id(frame) in _raising:
                _raising.discard(id(frame))
                base["e"] = "u"  # leaves the function because an error was not caught: there is no returned value
            else:
                base["e"] = "r"
                base["r"] = _snap(arg)
            _steps.append(base)
            node_id = _stack.pop() if _stack else -2
            if 0 <= node_id < len(_calls):
                if base["e"] == "r":
                    _calls[node_id]["r"] = base["r"]
                else:
                    _calls[node_id]["x"] = 1  # ended by an error
                _calls[node_id]["t"] = len(_steps) - 1
        elif event == "exception":
            _raising.add(id(frame))
            base["v"] = _locals(frame)
            base["e"] = "x"
            base["x"] = {"t": arg[0].__name__, "m": str(arg[1])[:200]}
            _steps.append(base)
    except BaseException:
        pass
    return _tracer

def _main():
    ns = {"__name__": "__learner__"}
    _sys.stdout = _out
    try:
        exec(compile(_SRC, "<learner>", "exec"), ns)
        fn = ns.get(_FN)
        if fn is None:
            _state["result"] = {"k": "error", "t": "MissingFunction", "m": "Your code does not define a function called " + _FN}
        else:
            _state["started"] = _time.perf_counter()
            _sys.settrace(_tracer)
            try:
                value = fn(*_ARGS)
            finally:
                _sys.settrace(None)
            _state["result"] = {"k": "returned", "v": _snap(value)}
    except BaseException as e:
        _sys.settrace(None)
        tb = e.__traceback__
        line = e.lineno if isinstance(e, SyntaxError) else None
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == "<learner>":
                line = tb.tb_lineno
            tb = tb.tb_next
        _state["result"] = {"k": "raised", "t": type(e).__name__, "m": str(e)[:200], "l": line}
    finally:
        _sys.stdout = _REAL_OUT
    _finish()

_main()
`;

/**
 * @param {{code:string, functionName:string, args:any[], nonce:string}} a
 * @returns {string} the Python program
 */
export function buildDebugProgram({ code, functionName, args, nonce }) {
  if (!/^[a-f0-9]{8,32}$/.test(nonce)) throw new Error("bad nonce");
  if (!/^[a-z_][a-z0-9_]*$/.test(functionName)) throw new Error("bad function name");
  const b64 = (s) => Buffer.from(s, "utf8").toString("base64"); // base64 has no quotes or backslashes: the code and the input go in as plain text
  return PROGRAM
    .replace("__NONCE__", nonce)
    .replace("__FUNCTION__", functionName)
    .replace("__MAX_STEPS__", String(MAX_STEPS))
    .replace("__MAX_SECONDS__", String(MAX_SECONDS))
    .replace("__MAX_BYTES__", String(MAX_TRACE_BYTES))
    .replace("__MAX_PRINTED__", String(MAX_PRINTED))
    .replace("__ARGS__", b64(JSON.stringify(args)))
    .replace("__CODE__", b64(code));
}
