# Data dictionary (Logging v2)

Everything the platform records about a learner, why, and which part of the consent text covers it.
Keep this file in step with the code: when a field is added or removed, change it here, and if the meaning of "what we
record" changes, update `server/src/privacy/consent.js` and bump `CONSENT_VERSION` (everyone then agrees again).

Rules: nothing is recorded outside the editor. We never record keystrokes, the text of a paste, clipboard contents,
window focus, mouse movement or anything from other pages or apps. Learning data is stored under a random `learnerId`;
the email address lives only in `users`. All learning data is deleted by "Delete my learning data"; everything including
the account by "Delete my account" (`server/src/privacy/erase.js`).

Version tags written on rows: `LOGGING_VERSION = log-3`, `SCORING_VERSION = score-1`, `PICKER_VERSION = picker-3`, `REVIEW_VERSION = review-1`, `PLACEMENT_VERSION = placement-1`, `COMPLEXITY_VERSION = complexity-1`
(`server/src/core/versions.js`). Change a tag whenever that part's behaviour changes, so analysis can tell which rules produced a row.

## Accounts (not learning data)
| Collection | Fields | Why |
|---|---|---|
| `users` | email, passwordHash (scrypt) or null, googleSub, learnerId, consent.recording / consent.ai {version, at} | log in; link to learning data; know what they agreed to |
| `sessions` | tokenHash (not the token), userId, expiresAt | stay logged in (30 days) |
| `consentevents` | userId, kind (recording/ai), accepted, version, at | proof of what was agreed and when |
| `pendingsignups` | googleSub, email, expiresAt (15 min) | Google confirmed a new person who has not yet agreed; deleted after agreeing or 15 minutes |

## Learning data (all keyed by `learnerId`)

### `submissions` (one row per Run or Submit click)
| Field | Meaning | Source |
|---|---|---|
| problem, language, mode, code | what was run, in which language; `run` = examples only, `submit` = all tests | learner |
| verdict, passed, total, perTest[{idx, verdict, kind}] | outcome; per test: passed / wrong_answer / runtime_error / time_limit / not_run, and the test's `kind` (example / edge / random) | grader |
| firstFailKind | kind of the first test that failed (example / edge / random) | derived |
| timeSec, wallTimeSec, memoryKb | CPU time, real time and peak memory of the WHOLE run (all tests in one process) | Judge0 |
| statusId, exitCode, exitSignal | Judge0's status code; process exit code; the signal that ended it (11 segfault, 8 divide by zero, 6 abort). Judge0 gives the signal as exit code 128+signal on our setup, so it is derived | Judge0 |
| errorName, errorFamily | the mistake: raw name (IndexError, NullPointerException, SIGSEGV, TimeLimit ...) and a shared family (index_out_of_range, null_reference, type_error, missing_key, zero_division, recursion_depth, undefined_name, segfault, timeout, syntax, type_mismatch, missing_return ...) | `errors.js` |
| compileOutput, stderr | compiler messages / error text (clipped) | Judge0 |
| codeStats | lines, nonBlankLines, chars, loops, loopDepth (nesting), selfCalls (recursion), usesSort, usesHash, usesHeap, usesStackQueue. Regex heuristics, not a parser | `codeSignals.js` |
| approach | { closest: brute / better / optimal, similarity 0..1, byApproach } = how close the code is to our reference solutions (token 3-gram overlap, names ignored) | `codeSignals.js` |
| activity | work pattern since the previous Run/Submit: windowMs, openToFirstEditMs (first window only), activeMs, idleMs (pauses over 30 s, capped), editCount, charsInserted, charsDeleted, charsPasted, pasteCount, maxPaste, languageSwitches, resets, tzOffsetMin. Totals only | browser, clamped by `activity.js` |
| openSource, recommendationId | how the learner reached the problem (rec / library / direct) and which recommendation offered it | server lookup |
| runsOnProblemBefore | earlier Run/Submit clicks on this problem | server |
| startedAt, secondsSpent | when the problem was opened (browser clock) and seconds until this click | browser |
| sessionId, scoringVersion, loggingVersion, durationMs, createdAt | session; rule versions; our API call time; click time | server |

**Failing hidden test shown after a failed Submit** (`submissions.revealedTest` {idx, kind, verdict}): after a Submit that is wrong, crashed or timed out, the server shows the learner ONE failing hidden test (the smallest failing input) with its expected output and what the code returned; the row records which test was shown. It is not recorded for Runs, accepted solutions or compile errors. It is not "help" (only hints lower the independence score). The API sends it as `hiddenFailure` {ordinal, of, kind, verdict, args, expected, actual} (never the test's internal number); the list of hidden tests in the same response still carries only pass or fail.

### `ratingupdates` (one row per rating change; why a rating moved)
learnerId, concept, problem, submissionId, ratingBefore/After, difficultyBefore/After, expected (E), score (S), k, components {correctness, optimality, independence, efficiency}, attemptsOnConceptBefore, failsBefore, secondsSpent, hintLevel, sessionId, scoringVersion.

### `skillratings`, `problemdifficulties`
Current rating per learner and concept (rating, attempts, and `source: "placement"` when the starting rating came from the placement quiz; `attempts` stays 0 until real counted attempts, so K stays 40); current Elo difficulty per problem (shared by all learners, so deleting one learner's data does not undo it).

### `hintevents`
Each hint level opened (`kind: ladder`) and each AI explanation (`kind: feedback`, level 2): learnerId, problem, level, source, the text shown, sessionId.

### `recommendationevents` (every time the picker chose; the base for evaluating future recommenders)
| Field | Meaning |
|---|---|
| chosen {slug, concept, difficultyLabel, expectedSuccess, conceptRating}, mode (weakest / closest / review), reason | what was offered and why |
| review {concept, stage, reviewsDone, intervalDays, daysSinceLast, overdueRatio, repeat, dueConcepts} | review picks only (`mode: review`, Batch 1): which topic was due, its stage in the 1/3/7/14/30-day schedule, how overdue it was, and whether the problem is one the learner solved before (`repeat`) |
| explored, exploreRate, propensity, greedySlug | whether it was a "variety pick" instead of the top choice, the variety rate in force, the probability this problem was chosen, and what the top choice was |
| candidates[{slug, concept, expectedSuccess, conceptRating, greedyRank}] (best 12) | what else could have been offered |
| fitsCount, poolSize, openCount, solvedCount, excludeCount, repeated | sizes of the sets at decision time |
| stateKey, pickerVersion, sessionId | state the pick belongs to (the same state reuses the pick: no reshuffling, no duplicate rows) |

Recommender v2 rows (`policy: v2`, `pickerVersion: rec-2.0`) add: `v2` {slot (warmup / core / stretch), target (aimed chance of success), score, parts {fit, info, weak, review, variety}, warmup}, and per candidate `score` and `parts`; `propensity` is the softmax probability of the pick and `explored` means it was not the top score. `policy` is `v1` for today's picker.

**Spaced review (v1 picker, `server/src/recommend/review.js`, `PICKER_REVIEW=off` disables it).** The schedule is computed from the learner's accepted Submits, not stored: the first solve in a topic makes it due after 1 day; a clean solve made after the due time (at most hint level 2 and 2 failed submits) moves it one stage up (3, 7, 14, then every 30 days); an unclean one repeats the same wait; a solve before the due time is extra practice and changes nothing. A due topic gets a fresh problem about 78% likely to be solved (never under 55%), or a problem solved before if none is left. Never more than 1 review in 3 recommendations. Review picks have `propensity 1` and `explored false`. The reason text of ordinary picks now also states facts about the learner's last solve in that topic.

Variety picks: with probability `PICKER_EXPLORE_RATE` (default 0.1) the picker takes a problem uniformly from ALL problems in the 50-80% window instead of the top choice. `propensity = (1 - rate) * [is the top choice] + rate / n`. With these two numbers a later model can be scored on this log ("inverse propensity" evaluation).

### `problemevents` (what the learner did around a problem, besides running code)
| kind | value | meaning |
|---|---|---|
| opened | rec / library / direct | the learner opened the problem, and how they got there |
| skipped | too_hard / too_easy / not_interested / other / no_reason | skipped without solving, with the reason if given |
| confidence | 1-5 | "how confident are you that you can solve this?" (asked before the first run, optional) |
| feel | too_easy / just_right / too_hard | after a Submit (optional) |
| liked | true / false | after a Submit (optional) |
| nudge_shown | {rule: struggle-1, level, failedAttempts, secondsSpent, expectedSeconds, noProgress, helpLevel, shown} | written by the SERVER only: after a failed Run/Submit it suggested a hint (rule in `server/src/help/struggle.js`: at least 3 failed attempts, at least half the expected time, no progress, hint level under 2, at most 2 per problem and 10 minutes apart). A browser cannot create this kind. |
| nudge_taken / nudge_dismissed | hints / not_now | the learner's answer to the suggestion. "Open the hints" only opens the Hints tab: nothing is revealed (and no score is lost) until they press Reveal. |
Also: recommendationId (opened / skipped), sessionId. The latest row of a kind wins when read back.

### `codesnapshots` (the code as it develops; Batch 1)
learnerId, problem, language, code, chars, hash (sha256), trigger (`timer` = about every 30 s while the code changed, `switch` = the learner changed language or problem), seq (1, 2, 3 ... per learner and problem), msSinceOpen (clamped to 6 h, sent by the page), sessionId, loggingVersion. Untouched starter code and code identical to the previous snapshot are never sent or stored; at most 400 per learner and problem and 240 per hour. Together with the code stored on every Run/Submit (`submissions.code`) this shows how a solution grew. Nothing uses it yet: it is raw material for a later "how did their reasoning evolve" study. Covered by the consent line about "a saved copy about every 30 seconds". Erased with the learner's data.

### `metricevents` (operational timings; Batch 1)
kind (`http` / `judge0` / `ai` / `mongo`), name (http: `POST /api/submit`, the route pattern with no ids; judge0: `lang71`; ai: model; mongo: `ping`), ms, ok, status, who (a scrambled learner id: first 10 hex of sha256, so "how many different people hit this error" can be counted without storing who), extra (judge0: {execSec, wallSec, overheadMs} where overhead = how long we waited minus how long the program ran = queue + start-up). MongoDB deletes rows after 14 days. `/api/health` is not recorded. Read them with `npm run metrics`. Erased with the learner's data (by the same scrambled id).

### `complexitymeasurements` and `complexityconfigs` (the scaling check; Batch 4)
`complexitymeasurements`: one row per correct Python Submit that was measured (never twice for the same Submit): learnerId, problem, language, submissionId, verdict (`matches` / `near` / `slow` / `unclear` / `unmeasured`), label (`n²`, `n (or n log n)`, `exponential`, `instant` ...), exponent (slope of ln time against ln n over the 4 largest reliable sizes), r2, exponential, factor (exponential only: time multiplier per +1 in n), expected (the usual best solution's class), measuredUpTo (largest n timed), points[{n, ns, reps}] (the fastest call at each size, in nanoseconds), error {n, name} (the learner's code stopped at this size, e.g. RecursionError), judgeStatus (3 finished, 5 stopped for time), wallMs, message (what the learner was told), `version` (`complexity-1`), `configVersion`. The code that was measured is the one stored with the Submit, never code sent by the browser. It never changes a rating. Covered by the consent line about running the solution on larger inputs. Erased with the learner's data. `complexityconfigs` is our content: per problem the Python source of the input generator, the sizes, the expected class and the slow class (loaded by `npm run content:complexity`; never sent to the browser).

### `debugruns` (one row per "Step through my code" run; Day 6)
learnerId, problem, `sourceKind` (`example` / `failing` / `custom`), `sourceIndex` (the example number), `codeHash` (SHA-256 of the traced code; the code itself is stored with the learner's Runs and Submits), `ok` (a trace was produced), `reason` (when not: `time_limit`, `no_trace`, `bad_trace`), `steps`, `calls`, `truncated` (`steps` / `time` / `size` or empty), `resultKind` (`returned` / `raised` / `error`), `errorName` (the Python error, e.g. IndexError), `matchedExpected` (example and failing runs only: the returned value equals the expected one), `timeSec`, `version` (`debug-1`). The trace itself (every step) is NOT stored: it is large and can be made again. Never changes a rating and is not counted as help. Covered by the consent line about "Step through" (consent version `2026-10-13`). Erased with the learner's data.

### `placementquizzes` (the optional placement quiz; Batch 3)
One row per attempt: learnerId, status (`in_progress` / `finished` / `abandoned`: "start again" abandons a quiz that has answers), and `answers[]` in the order asked: item (`arrays-L2`), concept, level (1 easy, 2 medium, 3 hard), kind (`mcq` / `trace`), chosen (the index of the option in the ORIGINAL order, or -1 for "I don't know"), correct, ms (time on the question, sent by the page, clamped to 10 minutes), order (the shuffled order the options were shown in), at. When finished: `result` {topics[{concept, rating, label, confidence (`low` from one question, `medium` from two), asked, correct, bestLevel}], placed[concepts at rating 1120 or more], answered, correct}, `applied[]` (topics whose rating was set from the quiz), `kept[]` (topics left alone because the learner already had counted attempts there), stoppedEarly, finishedAt, `bankVersion` (`placement-bank-1`), `algorithmVersion` (`placement-1`). The placed topics are read by `skill/learnerState.js` (`placed`) and count as solid in the curriculum unlock rule. Covered by the consent line about the optional placement quiz. Erased with the learner's data.

### `placementitems` (our content: the quiz questions)
id (`arrays-L2`), concept, level, kind, prompt, code, options[4], answer (index), explain, bankVersion. 48 rows loaded by `npm run content:placement` from `server/content/placement/items.py`. `answer` and `explain` never go to the browser before a quiz is finished.

### `placementsurveys` (the optional self-assessment)
learnerId, answers {concept: 0..4} (0 never heard of it, 1 heard of it, 2 know the basics, 3 comfortable, 4 could teach it; a topic left out = no answer), experience (0 brand new ... 3 a lot, or empty). Saved exactly as given. It also sets a WEAK starting guess in `knowledgestates` for skills with no real attempts: `1000 + 30 x (answer - 2)` with the normal uncertainty, `n: 0`, `last: null` (so it cannot fade). Real attempts are never overwritten. Redoing the survey replaces the guess for unpractised skills only.

### `learneractivities` (one row per learner)
lastAt, sessionId, sessionStartedAt, sessionCount. A new session starts after 30 minutes without activity.

### `knowledgestates` and `modelpredictions` (knowledge model v2, shadow mode; see `docs/knowledge-model-v2.md`)
| Collection | Fields | Why |
|---|---|---|
| `knowledgestates` | learnerId, skills {concept: {theta, v, n, last}} (rating, uncertainty squared, attempts, last practised), attempts, modelVersion | the new model's memory of one learner; derived only from the learner's outcomes (covered by "your skill ratings, calculated from the above") |
| `modelpredictions` | learnerId, problem, submissionId, sessionId, t, y (1 = accepted on the first gradable Submit), elo (the live prediction), kt (the new model's prediction), difficulty, modelVersion, params | the real-data scoreboard: both predictions made BEFORE the result; one row per learner and problem |
Both are erased with the learner's data. Neither changes anything the learner sees. `KT_SHADOW=false` switches them off.

### Not tied to a learner
`aifeedbackcaches` (hash of code + result -> the AI's answer, 7 days), `concepts`, `problems`, `testcases`, `referencesolutions` (our content). `problems.skills` = [{concept, weight}], the skills a problem needs (main concept first, weights add up to 1), proposed by `content/tag_skills.py` and kept in `content/skills.json`.

## Known limits of these signals
- Time and memory are totals for the whole run, not per test.
- `codeStats` and `approach` are heuristics. `approach` is similarity to OUR reference solutions, not a proof of the algorithm used.
- Browser-reported values (`activity`, `startedAt`) can be faked; they are clamped but not trusted. They must never decide anything important alone.
- Timings on a shared machine are noisy; one run proves nothing about efficiency.
- Code snapshots exist since Batch 1 but only every ~30 s of editing: fast bursts between two snapshots are not seen. The work pattern (`activity`) still counts those.
- The struggle nudge is evaluated only after a failed Run/Submit, never while the learner is idle or typing, so a learner who stares at the screen without running anything is not nudged.
- A review's schedule is a simple fixed ladder, not a retention model; whether it matches how this learner forgets is unknown until real data exists.
