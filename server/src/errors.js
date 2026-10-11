// Turns "it crashed" into a mistake signal: WHICH kind of mistake. Pure functions, no I/O.
//   errorName   = the raw name (IndexError, NullPointerException, SIGSEGV ...), good for exact analysis
//   errorFamily = a small shared vocabulary across languages, good for features and the future mistake classifier
const FAMILY = {
  IndexError: "index_out_of_range", ArrayIndexOutOfBoundsException: "index_out_of_range", StringIndexOutOfBoundsException: "index_out_of_range",
  IndexOutOfBoundsException: "index_out_of_range", out_of_range: "index_out_of_range", "std::out_of_range": "index_out_of_range",
  KeyError: "missing_key", NoSuchElementException: "missing_key",
  NullPointerException: "null_reference", AttributeError: "attribute_or_null",
  TypeError: "type_error", ClassCastException: "type_error",
  ValueError: "value_error", NumberFormatException: "value_error", InputMismatchException: "value_error",
  ZeroDivisionError: "zero_division", ArithmeticException: "zero_division",
  RecursionError: "recursion_depth", StackOverflowError: "recursion_depth", RangeError: "range_error",
  NameError: "undefined_name", UnboundLocalError: "undefined_name", ReferenceError: "undefined_name",
  MemoryError: "memory", OutOfMemoryError: "memory", bad_alloc: "memory", "std::bad_alloc": "memory",
  BadType: "wrong_return_type", Cycle: "cycle_in_result", exception: "cpp_exception",
  SIGSEGV: "segfault", SIGFPE: "zero_division", SIGABRT: "abort", SIGKILL: "killed",
};
const SIGNALS = { 6: ["SIGABRT", "abort"], 8: ["SIGFPE", "zero_division"], 9: ["SIGKILL", "killed"], 11: ["SIGSEGV", "segfault"], 25: ["SIGXFSZ", "output_too_large"] };

export const familyOf = (name) => FAMILY[name] ?? "other";

/**
 * The signal that ended the process. Our Judge0 runs C++ and Java through a shell script, so a crash arrives as
 * exit code 128+signal (139 = segfault) with no exit_signal field: derive it from the exit code.
 */
export function effectiveSignal(exitSignal, exitCode) {
  if (Number.isInteger(exitSignal) && exitSignal > 0) return exitSignal;
  return Number.isInteger(exitCode) && exitCode > 128 && exitCode <= 128 + 64 ? exitCode - 128 : null;
}

/** Which kind of compile error (a coarse guess from the compiler's words; "compile_other" when unsure). */
export function classifyCompile(text) {
  const t = String(text ?? "").toLowerCase();
  if (/missing return|control reaches end of non-void|not all code paths/.test(t)) return "missing_return";
  if (/cannot find symbol|was not declared|undeclared|is not defined|no member named|has no member|not defined/.test(t)) return "undefined_name";
  if (/incompatible types|cannot convert|invalid conversion|no matching (function|member)|bad operand types|invalid operands|no viable|cannot be applied/.test(t)) return "type_mismatch";
  if (/syntaxerror|indentationerror|taberror|invalid syntax|unexpected (token|indent|eof)|expected ['"`;)\]}]|';' expected|illegal start of|reached end of file|class, interface, enum, or record expected|expected .* before/.test(t)) return "syntax";
  return "compile_other";
}

const lastWord = (s) => String(s).split(/[.$]/).pop();

/** Name of the exception that killed the process, read from stderr (used only when no per-test ERR: result exists). */
function nameFromStderr(stderr) {
  const s = String(stderr ?? "");
  const cpp = s.match(/terminate called after throwing an instance of '([^']+)'/);
  if (cpp) return cpp[1];
  const java = s.match(/Exception in thread "[^"]*" ([\w.$]+)/);
  if (java) return lastWord(java[1]);
  // the shell's own words when a program is killed by a signal
  if (/Segmentation fault/i.test(s)) return "SIGSEGV";
  if (/Floating point exception/i.test(s)) return "SIGFPE";
  if (/\bAborted\b/.test(s)) return "SIGABRT";
  const all = [...s.matchAll(/^(\w+(?:Error|Exception))\b/gm)];
  return all.length ? all[all.length - 1][1] : null;
}

/**
 * @param {{verdict:string, tests:{actual?:string|null}[], stderr?:string, compileOutput?:string, exitSignal?:number|null}} run
 * @returns {{errorName:string|null, errorFamily:string|null}}
 */
export function classifyRun({ verdict, tests = [], stderr = "", compileOutput = "", exitSignal = null }) {
  if (verdict === "compile_error") return { errorName: null, errorFamily: classifyCompile(compileOutput || stderr) };
  if (verdict === "time_limit") return { errorName: "TimeLimit", errorFamily: "timeout" };
  if (verdict !== "runtime_error") return { errorName: null, errorFamily: null };
  // 1. the harness catches exceptions per test and reports "ERR:<name>"
  const err = tests.find((t) => typeof t.actual === "string" && t.actual.startsWith("ERR:"));
  if (err) { const name = err.actual.slice(4); return { errorName: name, errorFamily: familyOf(name) }; }
  // 2. the whole process died: a signal, or an uncaught exception printed on stderr
  const name = nameFromStderr(stderr);
  if (name) return { errorName: name, errorFamily: familyOf(name) };
  if (exitSignal && SIGNALS[exitSignal]) return { errorName: SIGNALS[exitSignal][0], errorFamily: SIGNALS[exitSignal][1] };
  return { errorName: null, errorFamily: "other" };
}
