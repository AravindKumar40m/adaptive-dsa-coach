# Step through my code (a Python time-travel debugger)

Built on Day 6 (2026-10-13). This file has three parts: what debuggers are and what we learned from them, how ours works, and what is and is not verified.

## 1. What we looked at (research, 2026-10-13)

I could not read LeetCode's own pages (they refused the automated requests), so what follows about LeetCode comes from third-party write-ups, and I say where I am unsure.

**LeetCode's debugger** (announced in beta around 2019; a 2019 blog post describes it, a 2020 post and a 2021 deals page list it under Premium; a 2026 third-party pricing page still lists it under Premium, about $35 a month or $159 a year; none of this is LeetCode's own page):
- Open the Console, pick or write a test case, click a line to set a breakpoint, press Debug. Execution stops at the first breakpoint; there are Continue, Step Into, Step Over and Step Out buttons, a Variables panel and a Watch list.
- Each step goes to a server, so stepping is slow, and there are no keyboard shortcuts (the 2019 post's complaints). It is reportedly switched off during contests.
- A forum announcement lists nine languages (C++, Java, Python, C, C#, JavaScript, TypeScript, Kotlin, Go), undated in what I could read.
- Opinions I could find (Blind threads, a 2021 review) say the free tier is enough and the debugger alone does not justify Premium; one review warns it can make you rely on it, while interviews often use plain text editors. I could not reach Reddit or X (the search tool is blocked there), so there is no social-media evidence either way.

**How debuggers work in general**
- Classic native debuggers (gdb): start the program as a traced child, replace an instruction with a trap to make a breakpoint, let the operating system pause the process, read memory and registers; single-stepping uses a CPU flag.
- Python has a built-in hook, `sys.settrace`, that calls your function on every `call`, `line`, `return` and `exception` and lets you read the frame's variables. That is all a Python debugger needs.
- **Record and replay / time-travel debuggers** (rr, Pernosco, Replay.io) record a run once and replay it, so you can step backward; they do not run the CPU backward.
- **Python Tutor** (Philip Guo, used by millions) runs your code once on a server, records every step, and draws the call stack, variables and references; the browser steps forward and back through the recording. It caps a run at about 1,000 steps (Python, Java, JavaScript).
- **Thonny** (a beginner IDE) steps inside an expression, replacing each part by its value, and gives each function call its own frame window.
- **VS Code / Chrome DevTools** add conditional breakpoints, logpoints (print without stopping) and "break when this value changes".
- Newer LeetCode-focused tools (TraceLit, LeetViz, Codedive) draw arrays, linked lists and trees as pictures. A 2024 SIGCSE study (421 students) found visualisations and ordinary debuggers helped about equally overall, with visualisations possibly helping more as the code got more complex.

## 2. What we built, and what is different

**Design: record once, replay in the browser.** The learner's function runs once in the sandbox (Judge0) under `sys.settrace`; every step (line, function, depth, local variables cut to a readable size, output so far) and a call tree are returned in one response. The page replays that recording. Therefore: no delay per step, stepping backward is free, and nothing the learner clicks makes another server call. (LeetCode's design talks to a server for every step.)

**What a learner can do**
- Choose the input: **Example 1 / 2**, the **failing hidden test** (one click from the failed Submit's "Step through this test" button), or **their own input** (typed as JSON, small sizes only).
- Step forward and back, step **over** a call, step **out** of a function, jump to the **next change** of any variable, jump to the error or to the end, drag a slider, use the keyboard (arrows, Shift + arrows, Home/End, N, C).
- Click a line number to set a **breakpoint**, then "To breakpoint".
- See every local variable at that step; the ones that just changed are marked with what they were; lists and strings are drawn as cells with their positions; **position variables (`i`, `j`, `lo`, `hi`, `mid`, `left`, `right` ...) are drawn as markers under the cell they point at**, one past the end shown as a dashed cell; grids as tables with the current cell marked; dictionaries as tables.
- See how each line ran: "x3" after a line of code that ran three times (a quick way to spot a loop that runs too often or too few times).
- A small **timeline** per number that moved in this call (click it to jump to that moment).
- For recursion: the **call tree** with arguments and returned values (click a call to jump to it), and a plain statement when the **same call with the same input** happened more than once ("repeated work"), with a "x3" badge on those calls. It states the fact and does not name the technique (that belongs to the hint ladder).
- A **plain-words sentence for every step** ("About to run line 5. The line before it ran, and i changed from 0 to 1") and for errors, using the real numbers ("i is 5, but changes has only 5 items: the valid positions are 0 to 4"). These sentences describe what happened; they never say how to fix it.

**Which pieces are our own mix (not claimed as inventions):** nothing here is new on its own (Python Tutor draws the run, rr replays it, VS Code has breakpoints). What we believe is uncommon is the **combination for learners of algorithms**: free; one click from "this test failed"; instant stepping both ways; position markers on arrays; repeated-call detection; and explanations written in numbers. I did not survey every platform, so do not read this as "nobody has it".

**Rules**
- Python only for now; the 105 of 120 problems whose inputs are numbers, booleans, text, lists and grids. The 15 linked-list and tree problems are not supported yet (the button explains why).
- The trace stops after 2,000 steps or 2.5 seconds of tracing (an endless loop shows its first 2,000 steps, and the lines that ran most are named). A learner's `except:` cannot swallow the stop (it leaves the process directly). A single step that never ends (for example `sum(range(10**10))`) is stopped by the sandbox time limit.
- **Never changes the rating and is not "help"** (only hints lower the independence score).
- **No reference answer for your own input**: it would let anyone read the answers of hidden tests. The failing-hidden-test source is looked up on the server (the hidden test the learner was already shown), never named by the browser.
- 40 traced runs per learner per hour.
- Logged: one `debugruns` row per traced run (input kind, steps, how it ended, whether it matched the expected value, a hash of the code); the trace itself is not stored. The consent wording says so (version `2026-10-13`).

**Where the code is**
- Server: `server/src/debug/program.js` (the Python program that traces), `runner.js` (runs it in Judge0, reads the answer, ignores forged markers), `inputs.js` (typed input checks), `routes/debug.js`, model `DebugRun`.
- Page: `client/src/debug/` (`model.js` and `explain.js` are plain logic with tests; `Debugger.jsx`, `Values.jsx`, `useDebug.js`, `SafeView.jsx` draw it); hooks into `workspace/Workspace.jsx` and `ConsolePane.jsx`.
- Tests (from `server/`): `npm run test:debug` (pure), `test:debug-view` (page logic on hand-made and real traces), `test:debug-flow` (real accounts and Judge0).

## 3. Limits and what is not verified

- The tracer rewrites nothing in the learner's code, but a determined learner can read the program's own variables and forge their own trace. It only affects their own view (nothing is scored from it).
- Steps and values are capped for readability (lists show 40 items, dictionaries 20, text 120 characters, 400 calls in the tree); the page says when it cut something.
- "Position variable" markers are a guess from variable names (`i`, `j`, `lo`, `hi`, `mid`, `left`, `right`, `idx`, `slow`, `fast` ...); a position with an unusual name is simply not marked.
- The explanation of an IndexError picks the position-like variable that is out of range; if several are, it names the first.
- Not built: other languages (each needs its own tracer), linked lists and trees, watch expressions, conditional breakpoints, "step into expression" (Thonny style), an AI "explain this step", and a view of which input elements the code never read.
- Not tested with real learners. Whether stepping helps people learn is unknown; the 2024 study above is the only outside evidence found, and it says visualisations and debuggers help about equally.
- Python 3.8 (Judge0's) is what the tests ran on, plus local Python 3.13 for the page-logic tests.
