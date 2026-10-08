// Small shared pieces.
export const LANGUAGES = [
  { key: "python", label: "Python", monaco: "python" },
  { key: "javascript", label: "JavaScript", monaco: "javascript" },
  { key: "java", label: "Java", monaco: "java" },
  { key: "cpp", label: "C++", monaco: "cpp" },
];

// verdict -> [label, tone]   (tone picks a colour: ok / bad / warn / neutral)
export const VERDICTS = {
  accepted: ["Accepted", "ok"],
  wrong_answer: ["Wrong answer", "bad"],
  runtime_error: ["Runtime error", "bad"],
  time_limit: ["Time limit exceeded", "warn"],
  compile_error: ["Compile error", "bad"],
  internal_error: ["Runner error", "neutral"],
  passed: ["Passed", "ok"],
  not_run: ["Not run", "neutral"],
};

export const prettyConcept = (key) => key.replaceAll("_", " ");
export const initialOf = (email) => (email?.[0] ?? "?").toUpperCase();

export function DifficultyBadge({ level }) {
  return <span className={`badge badge-${level}`}>{level}</span>;
}

// Tiny markdown: **bold** and `code`
export function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong>
    : part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code>
    : part
  );
}

// "ERR:BadType" etc. come from the test harness; say it in plain words
export function describeActual(actual) {
  if (actual == null) return "(no output)";
  if (actual === "ERR:BadType") return "(your function returned nothing or the wrong type)";
  if (actual === "ERR:Cycle") return "(the list or tree you returned contains a cycle)";
  if (typeof actual === "string" && actual.startsWith("ERR:")) return `(your code raised ${actual.slice(4)})`;
  return JSON.stringify(actual);
}

export const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
