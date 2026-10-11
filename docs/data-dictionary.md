# Data dictionary (Logging v2)

Everything the platform records about a learner, why, and which part of the consent text covers it.
Keep this file in step with the code: when a field is added or removed, change it here, and if the meaning of "what we
record" changes, update `server/src/consent.js` and bump `CONSENT_VERSION` (everyone then agrees again).

Rules: nothing is recorded outside the editor. We never record keystrokes, the text of a paste, clipboard contents,
window focus, mouse movement or anything from other pages or apps. Learning data is stored under a random `learnerId`;
the email address lives only in `users`. All learning data is deleted by "Delete my learning data"; everything including
the account by "Delete my account" (`server/src/erase.js`).

Version tags written on rows: `LOGGING_VERSION = log-2`, `SCORING_VERSION = score-1`, `PICKER_VERSION = picker-2`
(`server/src/versions.js`). Change a tag whenever that part's behaviour changes, so analysis can tell which rules produced a row.

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

### `ratingupdates` (one row per rating change; why a rating moved)
learnerId, concept, problem, submissionId, ratingBefore/After, difficultyBefore/After, expected (E), score (S), k, components {correctness, optimality, independence, efficiency}, attemptsOnConceptBefore, failsBefore, secondsSpent, hintLevel, sessionId, scoringVersion.

### `skillratings`, `problemdifficulties`
Current rating per learner and concept (rating, attempts); current Elo difficulty per problem (shared by all learners, so deleting one learner's data does not undo it).

### `hintevents`
Each hint level opened (`kind: ladder`) and each AI explanation (`kind: feedback`, level 2): learnerId, problem, level, source, the text shown, sessionId.

### `recommendationevents` (every time the picker chose; the base for evaluating future recommenders)
| Field | Meaning |
|---|---|
| chosen {slug, concept, difficultyLabel, expectedSuccess, conceptRating}, mode (weakest / closest), reason | what was offered and why |
| explored, exploreRate, propensity, greedySlug | whether it was a "variety pick" instead of the top choice, the variety rate in force, the probability this problem was chosen, and what the top choice was |
| candidates[{slug, concept, expectedSuccess, conceptRating, greedyRank}] (best 12) | what else could have been offered |
| fitsCount, poolSize, openCount, solvedCount, excludeCount, repeated | sizes of the sets at decision time |
| stateKey, pickerVersion, sessionId | state the pick belongs to (the same state reuses the pick: no reshuffling, no duplicate rows) |

Recommender v2 rows (`policy: v2`, `pickerVersion: rec-2.0`) add: `v2` {slot (warmup / core / stretch), target (aimed chance of success), score, parts {fit, info, weak, review, variety}, warmup}, and per candidate `score` and `parts`; `propensity` is the softmax probability of the pick and `explored` means it was not the top score. `policy` is `v1` for today's picker.

Variety picks: with probability `PICKER_EXPLORE_RATE` (default 0.1) the picker takes a problem uniformly from ALL problems in the 50-80% window instead of the top choice. `propensity = (1 - rate) * [is the top choice] + rate / n`. With these two numbers a later model can be scored on this log ("inverse propensity" evaluation).

### `problemevents` (what the learner did around a problem, besides running code)
| kind | value | meaning |
|---|---|---|
| opened | rec / library / direct | the learner opened the problem, and how they got there |
| skipped | too_hard / too_easy / not_interested / other / no_reason | skipped without solving, with the reason if given |
| confidence | 1-5 | "how confident are you that you can solve this?" (asked before the first run, optional) |
| feel | too_easy / just_right / too_hard | after a Submit (optional) |
| liked | true / false | after a Submit (optional) |
Also: recommendationId (opened / skipped), sessionId. The latest row of a kind wins when read back.

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
- No code snapshots yet (planned later with consent): the work pattern is the cheap substitute.
