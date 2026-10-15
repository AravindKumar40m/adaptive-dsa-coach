# Adaptive DSA Coach

Adaptive DSA practice: our own editor + run flow, graded on *how* you solve, not just pass/fail.
See `CLAUDE.md` for the idea and decisions.

## Layout
- `server/`  Node + Express API (MongoDB via mongoose). `GET /api/health` checks MongoDB and Judge0.
- `client/`  React + Vite + Monaco editor.
- `infra/`   Judge0 config (`judge0.conf` is gitignored; `judge0.conf.example` is the template).
- `docker-compose.yml`  MongoDB + self-hosted Judge0 (the sandbox that runs learner code).
- `data/synthetic/`  synthetic learner data for later model testing.
- `docs/`  data dictionary and the model / recommender write-ups with their results.

### Where things are (reorganised on Day 5; one folder per job)
**`server/src/`** (the API; `index.js` starts it, `config.js` reads the settings)

| Folder | What it holds |
|---|---|
| `routes/` | the HTTP endpoints (one file per area) |
| `models/` | the MongoDB collections (one file each) |
| `core/` | `db` connection, `rateLimit`, `metrics` (timings), `versions` (version tags on log rows) |
| `auth/` | `auth` (accounts, sessions, the login guard) and `google` sign-in |
| `privacy/` | `consent` (the wording and its version) and `erase` (delete my data) |
| `grading/` | `grader` (calls Judge0), `harness` (builds the hidden test program per language), `languages`, `errors` (mistake classifier), `reveal` (which failing hidden test to show) |
| `skill/` | `skill` (the Elo maths), `rating` (applies it), `learnerState`, `history` (solve history) |
| `recommend/` | `picker` (v1), `recommender2` (v2), `policy` (v1/v2/ab switch), `review` (spaced review) |
| `help/` | `hints` (the ladder), `llm` (AI explanation), `struggle` (nudge rule), `nudge` (nudge, database side) |
| `logging/` | `activity` (work pattern), `codeSignals`, `logSignals`, `sessions` |
| `complexity/` | the scaling check: `analyze` (timings to a verdict: pure), `program` (builds the Python timing program and reads its output: pure), `run` (runs it in Judge0) |
| `placement/` | the placement quiz: `quiz` (which question next, how answers become ratings, option shuffling: pure) and `apply` (writes the starting ratings, never over real practice) |
| `insights/` | reports built from what is already logged: `gain` (engaged time and learning gain per hour), `progress` (the Progress page report), `loadProgress` (its database side) |
| `kt/` | the new knowledge model (shadow mode) |
| `debug/` | step through my code (Python): `program` (the Python program that traces a run: builds it), `runner` (runs it in Judge0 and reads the answer), `inputs` (checks a typed input) |

**`server/scripts/`**: `tests/` (every `test-*.js`, run with `npm run test:...`), `tools/` (owner tools: cleanup, orphans, reset-password, logs-summary, metrics-report, llm-live-check), `dev/` (fake AI, fake Google, dev-db-poke), `content/` (seed, validate-references), `arena/` (model and policy simulations), `lib/` (helpers shared by the scripts). **`server/content/`** holds the problems, tests and the Python build tools.

**`client/src/`**: `pages/` (Auth, Path, Placement, Problems, Shell), `components/` (TopBar, SkillMap, icons, ui), `lib/` (api, hooks, activityTracker, monacoTheme, authQuery), `debug/` (the step-through debugger: `model` and `explain` are plain logic with tests; `Debugger`, `Values`, `useDebug`, `SafeView` draw it), `workspace/` (the practice screen), `styles/`. `App.jsx` and `main.jsx` stay at the top.

Old entries in the CLAUDE.md project log use the paths from the day they were written (for example `server/src/grader.js` is now `server/src/grading/grader.js`); this map says where each file is today.

## Run it (3 terminals)
1. `docker compose up -d`  (first time pulls a few GB; Judge0 takes about a minute to start). Our MongoDB is published on **host port 27018** (only on this PC), not 27017, so it cannot clash with a MongoDB installed on Windows; `MONGO_URI` in `.env` points at it.
2. `cd server && npm install && npm run dev`   -> http://localhost:4000/api/health
3. `cd client && npm install && npm run dev`   -> http://localhost:5173

The page shows three dots: API, MongoDB, Judge0. All green means step 1 works.

## Config
Copy `.env.example` to `.env`. Never commit `.env` or `infra/judge0.conf`.

## Judge0 notes (found while testing step 1)
- Docker Desktop uses cgroup v2; Judge0 1.13.1 only supports v1. `infra/judge0.conf` therefore sets
  `ENABLE_PER_PROCESS_AND_THREAD_*=true` so it runs without cgroups. Time limits still work (infinite loops are killed).
- Without cgroups the memory limit is per-process address space, so Node needs ~1 GB and Java ~4 GB
  (see `server/src/grading/languages.js`). It is a ceiling on virtual memory, not real RAM use.
- Java: `javac` is started with a JVM memory cap (`compilerOptions` in `server/src/grading/languages.js`, sent to Judge0 as `compiler_options`). Without it a JVM sizes itself from the Docker VM (8 CPUs, 6.7 GiB) and can pass the 4,000,000 KB address-space limit, so about 1 compile in 7 failed with "insufficient memory for the Java Runtime Environment" (found Day 5). Only `javac` is capped: Judge0 gives `java Main` no way to take flags. If it ever returns, first check what the Docker VM size is.
- Always call Judge0 with `base64_encoded=true` (compiler error text is not valid UTF-8).
- For production, use a Linux host with cgroup v1 (or a newer Judge0/isolate) and proper per-run memory limits.
- Verified 2026-10-06: Python, JavaScript, Java and C++ all run; infinite loop = Time Limit Exceeded; division by zero = Runtime Error.

## Problems (step 2)
10 starter problems (5 easy, 5 medium) live in `server/content/problems/<slug>/`:
- `problem.json`: statement (our own wording), constraints, function signature, examples, edge tests, expected complexity, 4-level hints.
- `solutions.py`: brute-force + optimal solutions and a random-test generator (Python 3.8-compatible, because that is Judge0's Python).

From `server/`:
1. `npm run content:build`     builds tests (examples + edge + 15 seeded random) and checks that all solutions agree
2. `npm run content:seed`      loads concepts, problems, tests, solutions into MongoDB (safe to re-run)
3. `npm run content:validate`  runs every reference solution through Judge0 against every test

Read-only API: `GET /api/concepts`, `GET /api/problems[?concept=]`, `GET /api/problems/:slug`.
Hidden tests, reference solutions and hints are never returned by these routes.
Add a problem: copy a folder, edit both files, run the three commands above.

## Run / Submit flow (step 3)
- `POST /api/run` runs the learner's code on the visible examples; `POST /api/submit` runs every test (hidden ones show pass/fail only).
  Body: `{ learnerId, problem, language, code }`, language = python | javascript | java | cpp.
- `GET /api/problems/:slug` also returns `starters` (starter code per language).
- `DELETE /api/learners/:learnerId/data` deletes everything logged about that learner.
- Every run/submit is saved in the `submissions` collection (code, verdict, per-test results, time).
- How it works: `server/src/grading/harness.js` wraps the learner's function in a hidden program per language, `server/src/grading/grader.js` runs it in Judge0
  and reads one marked result line per test. The learner writes only the function (Python/C++ snake_case name, JS/Java camelCase, Java inside `class Solution`).
- Tests (from `server/`, need MongoDB + Judge0; `test:api` also needs `npm run dev` running):
  `npm run content:validate` (all 51 reference solutions, 4 languages), `npm run test:run-flow` (bad code gets the right verdict in every language), `npm run test:api` (HTTP level).

## Skill rating (step 4)
Per-concept Elo, start 1000. Only **Submit** changes a rating. Maths in `server/src/skill/skill.js` (pure functions), database side in `server/src/skill/rating.js`.
- `E = 1 / (1 + 10^((difficulty - rating)/400))`, `rating += K * (S - E)`, K = 40 for the first 10 counted attempts on a concept then 16, problem difficulty `-= 4 * (S - E)`.
- `S` today = correctness (accepted = 1, otherwise 0.4 x share of tests passed) and efficiency (fewer failed attempts, less time; only when accepted). Optimality and independence are not measurable yet, so the other weights are rescaled.
- Not counted: Run, compile errors, resubmitting a solved problem, failed submits after the first 3 on a problem.
- Collections: `skillratings`, `problemdifficulties` (current difficulty, starts at the seed rating), `ratingupdates` (audit row with every input of each change).
- API: `POST /api/submit` returns `skill` ({counted, before, after, delta, expected, score, components} or a reason); `GET /api/learners/:id/skills` lists all 16 concepts.
- Tests (from `server/`): `npm run test:skill` (formula, no services needed), `npm run test:rating-flow` (needs the API running; resets peak-altitude's difficulty, so use a dev database only).

## Problem set (30 problems)
easy 8, medium 20, hard 2, over 14 of the 16 concepts (linked_list and trees have none yet: they need custom node types).
New input type `int[][]` (grids, intervals, edge lists) works in all four languages (Python/JS lists of lists, Java `int[][]`, C++ `vector<vector<int>>&`).
Extra-language solutions live in `server/content/other-languages/<lang>.txt` and `<lang>.more.txt` (one section per problem, split by `//### <slug>`).
`npm run content:build` also checks that each stored Python solution works on its own (no helpers from outside the function).

## Problem picker (step 5)
`server/src/recommend/picker.js` (pure logic) + `server/src/routes/skills.js` (HTTP) + `server/src/skill/learnerState.js` (loads a learner's data).
- A concept is **solid** when the learner solved min(2, its number of problems) of them; concepts with no problems count as solid. A concept is **unlocked** when all its prerequisites are solid.
- Pick: among unlocked, unsolved problems whose expected success is 50-80% (target 65%), take the weakest concept (lowest rating), then the problem closest to 65%. If none fits, take the closest problem anywhere.
- `GET /api/learners/:id/next[?exclude=slug1,slug2]` returns `{problem, expectedSuccess, mode (weakest|closest), reason, repeated}` or `{done: true}`.
- `GET /api/learners/:id/skills` now also returns `solved`, `total`, `unlocked`, `missing` per concept.
- The page opens on the recommended problem, explains why, and has a "Next problem" / "Skip to another problem" button.
- Tests (from `server/`): `npm run test:picker` (16 unit tests, no services), `npm run test:picker-flow` (API must be running: a simulated learner solves all 30 problems in the order the picker offers; dev database only).

## Content: 380 problems (120 on Day 3, 180 on Day 6, 280 and 380 on Day 7)
90 easy, 225 medium, 65 hard; the 16 concepts have 20 to 35 problems each (dp 35, graphs 31, trees 26, arrays and strings 24, the rest 20 to 23). 8,271 tests; 1,948 reference solutions (Python brute/better/optimal + JavaScript, Java and C++), all verified through the real harness and Judge0. The statements, hints and skill tags were written and checked by Claude only: a human read is still needed.
- Types: parameters `int`, `int[]`, `int[][]`, `string`, `ListNode`, `CycleList`, `TreeNode`; returns `int`, `bool`, `int[]`, `string`, `ListNode`, `TreeNode`. Linked lists and trees are shown as plain lists in the statements (trees level by level with `null`); the harness builds the real nodes in each language.
- Add a problem: create `server/content/problems/<slug>/{problem.json,solutions.py}` and add the optimal solution to `server/content/other-languages/<lang>.<batch>.txt` (one section per slug, `//### <slug>`).
- Check content (from `server/`): `npm run content:build` (agreement checks), `python content/check_quality.py` (test variety), `npm run content:seed`, `npm run content:validate` (all) or `node --env-file=../.env scripts/content/validate-references.js slug1,slug2` (some).
- More tests: `npm run test:harness-types` (every type in all four languages, needs Judge0 only).

## Hints and AI feedback (Day 3)
- **Hint ladder (works without AI):** every problem has 4 hints written by us (nudge, pattern, pseudocode, walkthrough). `POST /api/hint {learnerId, problem}` reveals the next level (one at a time, never skipping); `GET /api/learners/:id/hints/:slug` returns the ones already revealed. Each reveal is stored in `hintevents`.
- **Independence score:** the highest help level shown on a problem before the accepted solution sets the independence part of the score: no help 1.0, then 0.75, 0.5, 0.25, 0 (walkthrough). Failed submits get no independence credit. The audit row (`ratingupdates`) stores `hintLevel`.
- **AI "Explain my result":** `POST /api/feedback {learnerId, problem, language, code, result}`. Uses the official `@anthropic-ai/sdk` with a small model (default `claude-haiku-4-5`, set `ANTHROPIC_MODEL` to change). It is OFF until `ANTHROPIC_API_KEY` is set in `.env` (the page hides the button; `GET /api/ai/status` says which). Max 10 explanations per learner per hour (`AI_CALLS_PER_HOUR`), answers cached for 7 days, code blocks stripped from replies, learner code and test output treated as data (never as instructions). An explanation counts as help level 2. Your code and test results are sent to Anthropic when this is used (the page footer says so).
- **Try it without a key:** `cd server && npm run dev:fake-ai` (API on :4100 with a canned fake tutor), then in `client`: `$env:API_URL="http://localhost:4100"; npm run dev`.
- **See the real model once you have a key:** `npm run llm:live`.
- Tests (from `server/`): `test:llm` (the AI helper against a local imitation of the Anthropic API, no database), `test:llm-flow` (a second API instance on :4100 wired to that imitation; does not touch your dev server), `test:hints` (needs the API running).

## Accounts and consent (Day 3)
Everything about a learner now needs a login. Problems and concepts stay public.
- **Sign-up** (`POST /api/auth/signup`): email + password (10 to 128 characters, must not contain the email name) and the **required** recording consent. The AI consent is a separate, optional box. Passwords are stored only as scrypt hashes. The login is an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production); the database stores only a hash of the cookie value; sessions last 30 days (`SESSION_DAYS`).
- **Other routes:** `POST /api/auth/login`, `/auth/logout`, `GET /auth/me`, `GET /api/consent` (the exact wording and its version), `POST /auth/consent` (change the recording or AI choice), `DELETE /auth/account` (needs the password; removes the account and everything recorded).
- **Who you are is decided by the cookie**, never by what the browser says: a `learnerId` that is not yours is refused (403), and when none is sent the session's own id is used.
- **Consent is versioned** (`server/src/privacy/consent.js`, `CONSENT_VERSION`). If you change the wording, change the version: everyone must agree again, and until then nothing is recorded (run/submit/hint are refused with `needsConsent`; reading and deleting your own data still works). Every agree/withdraw is logged in `consentevents`.
- **AI explanations** need the learner's own opt-in (Account menu); without it `/api/feedback` answers 403 and nothing is sent to Anthropic.
- **Protection:** wrong-password tries are limited per email+IP (10 per 15 minutes, `AUTH_LOGIN_ATTEMPTS`), sign-ups per IP per hour (`AUTH_SIGNUPS_PER_HOUR`, 200 in development, 10 in production); unknown email and wrong password look identical (also in timing); POSTs whose `Origin` is another website are refused, and there is no CORS, so other sites cannot read answers. The Vite proxy in `client/vite.config.js` must keep `changeOrigin: false` for this check to work.
- **Forgot password:** there is no email service yet. The owner runs `npm run reset-password -- someone@example.com` in `server/`: it prints a temporary password and ends all of that person's logins.
- **Old anonymous data:** rows recorded before accounts (`npm run orphans` counts them) belong to nobody and are kept untouched.
- **Tests (from `server/`, API running):** `test:auth` (accounts, sessions, consent, guard, deletion, reset), and all the other HTTP tests now sign up temporary accounts (emails end in `@example.test`) and delete them afterwards. `npm run cleanup:tests` removes any left behind by a crashed test. The consent wording in `consent.js` is a plain-language draft, not legal advice.

## The interface: "Lamplight" (Day 3)
- **Theme:** a quiet study desk. Warm ink-brown dark mode and warm paper light mode, one amber accent, a serif for reading problem statements, a clean sans for the interface and a mono font for code. The mode follows the system and can be switched with the sun/moon button (remembered on this device). All colours are variables in `client/src/styles/theme.css`; the Monaco editor has matching themes (`monacoTheme.js`). The only motion is a 120 ms colour fade (off with "reduce motion").
- **Pages** (URL hash, no router library): `#/` **Path** (recommended problem with the reason, three numbers, the **Skill Map** drawn from the prerequisites), `#/problems` **Problems** (search, topic, level and solved filters; `?concept=arrays` pre-filters), `#/practice/<slug>` **Practice** (problem and hints on the left, editor above results on the right, both dividers draggable; on a phone the two sides become Problem / Code tabs).
- **Keyboard:** `Ctrl+Enter` runs, `Ctrl+Shift+Enter` submits. A solved Submit shows the rating change on a ruler and a Next button first; a failed one shows the example cases first.
- **Code:** drafts are kept in this browser tab (sessionStorage) so a refresh does not lose work. Fonts are installed from npm (`@fontsource-variable/*`), so the page makes no third-party font requests.
- **Where things are:** `Shell.jsx` (data + pages), `TopBar.jsx` (nav, status, theme, account menu), `PathView.jsx`, `SkillMap.jsx`, `ProblemsView.jsx`, `workspace/` (Workspace, ProblemPane, HelpPane, ConsolePane), `Auth.jsx` (sign-in and consent screens), `styles/` (theme.css, app.css).
- **API change:** `GET /api/learners/:id/skills` now also returns `solvedProblems` (slugs).

## Google sign-in (Day 4)
Off by default: the "Continue with Google" button appears only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env` (`GET /api/auth/google/status` tells you). Nothing secret is ever committed or sent to the browser.

**Get the two values (one time, from the Google Cloud console; menu names change now and then):**
1. Open https://console.cloud.google.com, create a project (any name).
2. *APIs & Services* (or *Google Auth Platform*) -> **OAuth consent screen**: app name, your email as support contact, audience **External**. While the app is in "Testing", only the Google accounts you list under **Test users** can sign in, so add your own Gmail. The only permissions we ask for are `openid` and `email`, which need no Google review.
3. **Credentials** -> *Create credentials* -> **OAuth client ID** -> type **Web application**. Under **Authorized redirect URIs** add exactly `http://localhost:5173/api/auth/google/callback` (add your real site's address later). No "JavaScript origins" are needed.
4. Copy the **Client ID** and **Client secret** into `.env` as `GOOGLE_CLIENT_ID=` and `GOOGLE_CLIENT_SECRET=` (see `.env.example`). Restart the API (`npm run dev` in `server/`). If the redirect address differs from the default, also set `GOOGLE_REDIRECT_URI` (it must match the console character for character).

**How it works:** the standard server-side "authorization code" flow with PKCE, `state` and `nonce` (`server/src/auth/google.js`, `routes/google.js`). The page links to `/api/auth/google/start`; Google sends the person back to `/api/auth/google/callback`; the server swaps the one-time code for an ID token using the client secret, checks issuer, audience, expiry, nonce and `email_verified`, and uses Google's permanent id (`sub`) plus the email.
- **Returning person:** logged straight in.
- **New person:** NO account is created yet. A pending row (Google id + email, 15 minutes, `PendingSignup`) and a cookie hold them while the page shows the consent text ("One last step"); the account is created only when they agree (`POST /api/auth/google/complete`). The optional AI box is on that screen too.
- **Same email as a password account:** Google has proven who owns the address, so the accounts are linked (same learner, nothing duplicated), the **old password is switched off and its logins ended** (otherwise someone who pre-registered the email with their own password could keep access), and a note is shown. To give such a person a password again, use `npm run reset-password`.
- **Google-only accounts** have no password; deleting one asks for the email address typed in (`confirmEmail`).
- **Limits:** 30 Google steps per IP per 15 minutes (`AUTH_GOOGLE_ATTEMPTS`).

**Try it without Google or keys:** `cd server && npm run dev:fake-google` starts a stand-in Google (port 4200) and a second API (4101); then in `client/`: `$env:API_URL="http://localhost:4101"; npx vite --port 5174 --strictPort` and open http://localhost:5174. Choose who "signs in" with `http://127.0.0.1:4200/__set?email=a@example.test&sub=abc&mode=ok` (`mode`: `ok`, `deny`, `bad-aud`, `bad-nonce`, `expired`). Your normal servers on 4000 and 5173 are untouched.

**Tests:** `npm run test:google` (from `server/`; starts its own API copy and stand-in Google; about 70 checks).

## Logging v2: richer signals (Day 4)
Step 1 of the plan to improve the knowledge curve and the recommendations (see CLAUDE.md, Day 4). Every field is described in `docs/data-dictionary.md`.
- **Grading signals** saved with every Run/Submit: Judge0's status, exit code, exit signal and wall time; the mistake (`errorName`, `errorFamily`: IndexError -> index_out_of_range, SIGSEGV -> segfault, a syntax error -> syntax ...); the kind of the first failing test (example / edge / random); code statistics (loops, nesting depth, recursion, sort/hash/heap use); and which reference solution (brute / better / optimal) the code is closest to.
- **Work pattern** sent by the page with each Run/Submit: time to first keystroke, characters typed / deleted / pasted, number and size of pastes, active and idle time, language switches, resets (totals only; never keystrokes or pasted text). Validated and clamped on the server.
- **Learner feedback:** an optional confidence chip (1-5) before the first run, "too easy / just right / too hard" and thumbs up/down after a Submit, and a reason when skipping. `POST /api/problem-event`, read back by `GET /api/learners/:id/problem-state/:slug`.
- **Recommendation log** (`recommendationevents`): each pick with the candidates considered, the pool sizes, the rules version, and the probability of the pick. A pick is reused while the learner's state is unchanged (revisiting the Path no longer reshuffles it or logs it twice). **Variety picks:** with probability `PICKER_EXPLORE_RATE` (default 0.1; 0 turns it off) the picker takes a random problem from the 50-80% window instead of the top choice, and says so ("A little variety..."). This is what lets a future model be evaluated on the log.
- **Sessions** (a gap over 30 minutes starts a new one) and **version tags** (`server/src/core/versions.js`) are written on log rows.
- **Consent:** the wording now lists these signals and the version was bumped to 2026-10-09, so everyone sees the "agree again" screen once.
- Tools: `npm run logs:summary` (how much of each signal has been captured), tests `test:signals` (pure helpers) and `test:logging` (end to end; starts two extra API copies on ports 4103 and 4104).
- Not done yet (deliberately): code snapshots, per-test timing, running the reference solutions on large inputs for an optimality score. Those are next steps.

## Knowledge model v2 and the arena (Day 4)
Step 2 of the plan. Plain-words write-up with the results: `docs/knowledge-model-v2.md`; raw tables: `docs/arena-results.md`.
- **The live system still uses Elo.** The new model (uncertainty, multi-skill problems, forgetting, transfer) runs in **shadow mode**: on each learner's first gradable Submit on a problem it logs the live Elo prediction, its own prediction and the outcome (`modelpredictions`), and keeps its memory of the learner (`knowledgestates`). Nothing changes for the learner. `KT_SHADOW=false` switches it off.
- **Skill tags:** each problem lists the skills it needs (`problems.skills`, main concept first). `python content/tag_skills.py` proposes them automatically into `content/skills.json` and `content/skills-review.md`; **read the review file and correct what is wrong**, then `npm run content:build && npm run content:seed`.
- **The arena** compares models fairly by replaying histories (predict, then learn) on learners they never trained on: `npm run arena` (5 simulated worlds, about 4 minutes, writes `docs/arena-results.md`), `npm run arena -- --quick`, and `npm run arena -- --source mongo` for REAL logs (needs about 10 learners; 30-50 for a first look).
- **Tests:** `test:kt` (models and metrics against hand-worked numbers), `test:kt-flow` (shadow mode end to end, including an exact replay of every logged prediction; starts an extra API copy on port 4105).
- Result in one line: the new model is never clearly worse than Elo and closes up to about 7% of the distance to a perfect model in simulated worlds; the limit is how little each learner tells us, which is what the placement quiz and the richer signals are for.

## Recommender v2 and the self-assessment (Day 4)
Step 3 of the plan. Write-up and numbers: `docs/recommender-v2.md`; raw simulator tables: `docs/recommender-results.md`.
- **Today's picker (v1) is still the default.** The new recommender scores each problem on fit (aim follows a warm-up / core / stretch arc and recent results), information, weakness, review and variety, and logs every score and the probability of its pick. In the simulator it was **not clearly better** (slightly worse at knowing the learner, equal elsewhere; about 10% fewer sessions with 3 failures in a row), so it is opt-in.
- **Switch:** `PICKER_POLICY=v1|v2|ab` in `.env` (ab = half of the learners each, fixed by learner id). v2 needs `KT_SHADOW` on.
- **Self-assessment:** an optional "Where are you now?" screen (`#/placement`, offered on the Path page): rate each topic, and your answers become a weak starting guess (never beating real results). The consent wording lists it, so everyone agrees again once.
- **Commands (from `server/`):** `npm run policies` (compare policies in the simulator, about 5 minutes, writes `docs/recommender-results.md`), `npm run policies:sensitivity` (change one setting at a time), tests `test:recommender2` (scoring, hand-checked numbers) and `test:recommender2-flow` (switch, A/B, logging, survey; starts three extra API copies on ports 4106-4108).

## Batch 1: snapshots, struggle nudge, spaced review, "why", observability (Day 5)
Plain-words write-up in the CLAUDE.md log (Day 5). Every new field is in `docs/data-dictionary.md`.
- **Code snapshots:** the editor sends the learner's code about every 30 seconds when it changed (and when they switch language or problem) to `POST /api/snapshot` (`server/src/routes/snapshots.js`, collection `codesnapshots`). Identical code is not stored twice; at most 400 per learner and problem. Raw material for later "how did the solution grow" studies; nothing uses it yet.
- **Struggle nudge:** after a failed Run/Submit the server may add a `nudge` to the response ("Stuck for a while? A small hint might help: level 1 (Nudge)"). Rule in `server/src/help/struggle.js`: at least 3 failed attempts, at least half the expected time, no progress, hint level under 2, at most 2 per problem and 10 minutes apart. It never reveals a hint by itself and never appears while the learner types.
- **Spaced review:** `server/src/recommend/review.js`. A topic becomes due 1 day after the first solve, then 3, 7, 14 and 30 days after each clean review. The picker offers a due topic as a "Review" (a fresh problem about 78% likely to be solved, or a repeat when none is left), never more than 1 review in 3 recommendations. `PICKER_REVIEW=off` turns it off. v1 picker only: recommender v2 has its own review term.
- **"Why this problem?"** The reason text now mentions the learner's last solve in that topic (how long ago, failed attempts, hint level) and, for reviews, why it is due. The Path page shows a "Review" badge.
- **Observability:** every API request, Judge0 call, AI call and a once-a-minute MongoDB ping is timed into `metricevents` (kept 14 days, scrambled learner id). Read it with `npm run metrics` (add `-- --days 30` for a longer window): slow routes, failures and how many people they hit, Judge0 queue overhead, plus first-attempt success, completion, hint use, day-1/day-7 retention, sessions per week, reviews and nudges.
- **Tests (from `server/`):** `test:review` and `test:struggle` need no services; `test:batch1-flow` needs MongoDB and Judge0 (it starts two extra API copies on 4109 and 4110).
- The consent wording was extended and `CONSENT_VERSION` is now `2026-10-12`: everyone sees the "agree again" screen once.

## Batch 2: progress page and learning gain per hour (Day 5)
Nothing new is recorded: the page and the metric are built from data that already exists (so the consent wording did not change).
- **Progress page** (`#/progress`, `client/src/pages/ProgressView.jsx`, API `GET /api/learners/:id/progress`): problems solved, time worked, pace, first-Submit success; every topic with its chance of solving a typical medium problem (Elo against difficulty 1200), rating and solved / total, with strongest and weakest topic once two topics are practised; the mistakes that happen most (every failed Run or Submit, in plain words, and "the mistake to watch" = the most common one that is not just a wrong answer); how much help the first solve of each problem needed (no hint, level 1, 2, 3 or 4); which topics are due for review and when the others come back; and the learner's pace. The report is built by `server/src/insights/progress.js` (pure) from `loadProgress.js`.
- **Learning gain per hour** (`server/src/insights/gain.js`): net change of the skill ratings divided by engaged time. **Engaged time** is estimated from the times of every Run/Submit, hint, opened problem and code snapshot: the gap between two events counts, at most 5 minutes of it, and a gap of 30 minutes or more is a break that counts as nothing. Under 20 minutes of work in the window no rate is shown. It is a rough trend, not a score: early ratings move a lot (K = 40), a bad day is negative, and long silent thinking is under-counted.
- **Owner report:** `npm run metrics` section 4 shows the spread (median, middle half, lowest, highest) of points per hour and problems per hour over all learners, last 7 days and all time, and a split by recommender when both v1 and v2 learners exist.
- **Tests (from `server/`):** `test:insights` (maths against hand-worked numbers, no services), `test:progress-flow` (real accounts and Judge0; starts an API copy on port 4111).
- **Not in this batch:** the "Complexity" panel (Optimal / Near-optimal / Too slow) needs the complexity checker (Batch 4).

## Batch 3: the placement quiz (Day 5)
An optional, adaptive quiz of about 10 minutes (at most 24 questions) that sets where each topic starts, so a learner skips the warm-up in topics they already know. Page: `#/quiz` (`client/src/pages/PlacementQuizView.jsx`), offered on the Path page.
- **Questions:** 48, three per topic (level 1 easy, 2 medium, 3 hard), written for this project in `server/content/placement/items.py`. Level 1 are concept questions; levels 2 and 3 are "what does this Python code print?" (shown in Python whatever language the learner practises in). Every option list has 4 options plus an "I don't know" button.
- **Check and load:** `npm run content:placement` (from `server/`) first runs `content/build_placement.py`, which RUNS every code snippet and fails if the marked answer is not exactly what it prints, if another option is also what it prints, or if a topic does not have exactly levels 1-3; then it loads the questions into MongoDB (`placementitems`). The 16 concept questions cannot be machine-checked, so a person has to read them.
- **How it asks** (`server/src/placement/quiz.js`): one medium question per topic in curriculum order; a miss is followed at once by the easy question of that topic; a topic where nothing was answered right ("weak") stops the topics that depend on it from being asked; with the questions left, a medium question answered right gets its hard question. Stop is offered after 6 answers.
- **What it sets:** a starting rating per asked topic: 850 (both missed), 920 (only one question, missed), 980 (easy right), 1080 (medium right, one question), 1120 (medium right, hard missed), 1200 (hard right). A topic at 1120 or more is **placed out**: it counts as solid, so topics that depend on it open without solving 2 problems first (`placed` in `conceptStatus`). Real practice always beats the quiz: a topic with counted attempts keeps its rating (`kept` in the results), and taking the quiz again only changes topics without attempts. The ratings are first guesses; the first 10 attempts in a topic move a rating by 40 points each, so practice corrects them fast.
- **Honesty about guessing:** a multiple-choice question can be a lucky guess (25%), which is why one answer gives only "low" confidence and why "I don't know" is offered. The server checks every answer and shuffles the options (the same order on a reload); the browser never gets the right answer or the explanation until the quiz is finished.
- **Tests (from `server/`):** `test:quiz` (the engine: asked sequences for strong, beginner and mixed learners, the rating table, shuffling, the unlock rule; no services) and `test:quiz-flow` (real accounts: access, validation, double click, resume, restart, strong learner, beginner, early stop, real attempts beating the quiz, effect on the skill map and the picker, deletion; starts an API copy on port 4113).
- Recorded and covered by the consent wording (version `2026-10-12.2`): which option was chosen, whether it was right, how long it took, and the order the options were shown in. "Delete my learning data" removes it.

## Batch 4: the scaling check, "how does my solution grow?" (Day 5)
Our tests are small, so a correct but slow solution passes them. After a **correct Python Submit** of one of 20 key problems, the page shows "How your solution scales": we run the stored solution on bigger and bigger inputs, time it, and fit the growth curve. Result: **As good as expected**, **A little slower than expected** or **Slower than it could be** (plus "Unclear" / "Not measured" when it cannot tell), a plain sentence ("grows like n², with 10 times more input yours would take about 100 times longer"), a log-log chart and the raw timings. It is always a "likely", never a verdict: it never marks a solution wrong and **never changes the rating** (whether optimality should feed the rating is a decision for later). The Progress page has a "How your solutions scale" summary.
- **The 20 problems** (`server/content/complexity/scales.py`): peak-altitude, missing-number, best-streak-sum, sorted-pair-sum, pair-count, subarray-sum-count, count-inversions, smallest-gap, days-until-warmer, balanced-brackets, best-window, min-subarray-len, insert-position, search-sorted, fibonacci-nth, stair-ways, three-sum-count, widest-fence, rain-catch, largest-rectangle. Each has an input generator `make(n, rng)` that obeys the problem's own constraints and triggers the SLOW solution's real worst case (a sorted list with an unreachable target, a flat temperature list, nested brackets ...), and the expected class of the best solution (from the problem's `APPROACHES`). Not every problem could be used: product-except-self allows at most 10 numbers, and the brute forces of longest-unique-run (26 letters) and grid-islands are not really quadratic.
- **How it measures** (`server/src/complexity/`): one Python program = the learner's code + our generator + a timing loop (`program.js`). It times the function inside the program (so Python start-up is not counted), takes the fastest of 3 batches of repeated calls on fresh copies of the input, doubles n from 256 (smaller for the exponential and cubic problems) and stops when one call takes over 0.3 s or after 3 s. Every point is printed as soon as it exists, behind a random marker, so a run that Judge0 has to stop still counts and a learner cannot forge a point.
- **How it decides** (`analyze.js`, pure): the growth exponent is the slope of ln(time) against ln(n) over the 4 largest sizes above the noise floor (about 0 = constant or log n, 1 = n, 2 = n², 3 = n³; n log n shows about 1.1-1.25). Within 0.35 of the expected exponent = matches, within 0.6 = near, beyond = slow. A steep clean curve (slope 5 or more) or one that keeps bending upward is exponential. A call that stays under 50 microseconds at the largest size is "instant". Timings that do not lie on one line, too few usable points, or a crash (for example a correct recursive solution hitting Python's recursion limit on a big input) give "Unclear" with the reason named.
- **Calibrated on our own solutions:** `npm run complexity:validate -- --repeat 3` (from `server/`) runs every slow, "better" and fast reference solution of the 20 problems through the real analyzer in Judge0 and checks that fast ones get "matches" and brute forces get "slow". Last run: 44 of 45 right at first, and the 45th (a linear `sum` over a shuffled list measured as n^1.7) was the CPU cache, not the solution: the generators now build lists whose numbers sit in memory in list order; after that all verdicts were right and identical over repeated runs.
- **Content commands:** `npm run content:complexity` (checks every generator: deterministic, within the problem's limits, our brute and optimal solutions agree on the generated inputs, and the source embedded in the program runs ON ITS OWN; then loads `complexityconfigs`).
- **API:** `POST /api/complexity { submission }` (the id comes back from `POST /api/submit`, which also says `complexity.available`). Only the learner's own correct Python Submit of a configured problem; 30 analyses an hour; the same Submit is measured once. Tests (from `server/`): `test:complexity` (the maths with noisy synthetic timings, the program, and the whole chain with the local Python, no services) and `test:complexity-flow` (real accounts and Judge0; starts an API copy on port 4116).
- **Consent:** the wording lists "how fast your submitted solution runs on larger inputs that we generate" (version `2026-10-12.3`: everyone agrees again once).

## Showing why a Submit failed: one failing hidden test
Scenario: a Run passes the 2 visible examples, then the Submit says "6 of 21 tests passed" and gives nothing to debug with. Now, after a Submit that is **wrong, crashed or timed out**, the page shows **one failing hidden test** like an example: "Hidden test 1 of 19 · an edge case · the smallest one your code fails", with the **input**, the **expected** output and **what your code returned** (for a crash: the error name; for a hang: "no answer in time"). The other hidden tests stay hidden.
- **Which one** (`server/src/grading/reveal.js`, pure): the smallest failing input (easiest to trace by hand), ties to the lowest test number. Never a passed test, never a test that did not run, never for a Run, an accepted solution or a compile error, at most one per Submit. It works the same in all four languages (the grader already collects every test's output the same way).
- **API:** `POST /api/submit` returns `hiddenFailure` ({ordinal, of, kind, verdict, args, expected, actual}, or null). The `tests` list still shows only pass or fail for hidden tests, and the test's internal number is never sent. The Submit's log row records which test was shown (`revealedTest`).
- **Page:** when every visible example passes, the failing hidden test is the FIRST thing in the results (above the passed examples); otherwise it comes after the failing examples. The AI "Explain my result" receives it too (the learner can already see it).
- **Scoring is unchanged:** seeing this case is not "help" (only hints lower the independence score), and only the first 3 failed Submits per problem still move the rating.
- **Accepted trade-off:** a determined learner could collect hidden cases one Submit at a time and hard-code answers. That only fools their own rating (the same "trust the learner" decision as for the placement quiz); one smallest case per Submit keeps it slow. No consent change: it is the same code and results, only now displayed.
- **Tests (from `server/`):** `test:reveal` (the choice rule, no services) and `test:reveal-flow` (real accounts and Judge0: a solution that passes the examples but not the hidden tests; a crash; a hang; JavaScript and C++; nothing shown for accepted code or compile errors; no other input leaks; scoring unchanged; starts an API copy on port 4119).

## Step through my code: a Python time-travel debugger (Day 6)
A **Step through** button next to Run (Python only, the 105 of the first 120 problems whose inputs are plain values and lists; linked lists and trees later; the 160 problems added after that were not checked with it). It runs your code once with tracing on, then you replay it in the browser: forwards, backwards, over a call, out of a function, to the next change, to a breakpoint (click a line number), with a slider and keyboard keys. Every variable is shown at every step; positions (`i`, `j`, `lo`, `hi` ...) are drawn as markers under the array cell they point at; recursion shows a call tree and flags repeated identical calls; each step has a sentence in plain words, errors explain themselves with the real numbers. Inputs: an example, **the failing hidden test** (one click from the failed Submit), or your own.
- **Not a rating event and not help.** No reference answer is shown for your own input (it would leak hidden answers). Capped at 2,000 steps and 2.5 s; an endless loop shows its first 2,000 steps and the lines that ran most.
- **Why this design:** record once, replay: no delay per step and stepping back is free (LeetCode's Premium debugger asks a server at every step).
- Full write-up, research on how debuggers work, what is different and the limits: `docs/step-through-debugger.md`. API: `POST /api/debug`. Tests (from `server/`): `test:debug`, `test:debug-view`, `test:debug-flow`.

## Backups (added after the live database was lost on 2026-10-13)
- **See what is in the live database (read-only):** `npm run db:counts` in `server/` prints the number of documents in every collection. It never writes; use it before and after anything that touches the database.
The database holds real learning data, so it is backed up by commands that only READ it. Run these from `server/`:

| Command | What it does |
|---|---|
| `npm run db:backup` | Saves the whole database to ONE compressed file in `~/adaptive-dsa-backups` (outside the project; set `BACKUP_DIR` to change), plus a `.counts.json` with the number of documents in every collection. The newest 20 are kept. |
| `npm run db:backup:verify` | Proves the newest backup (or `-- <file>`) works: restores it into a throwaway database, compares every collection with the recorded counts, removes the throwaway database, and tells you how the live database differs. Prints `BACKUP OK` or the problems. |
| `npm run db:backup:loop` | Backs up now and then every 6 hours (`-- <hours>` to change) while the window stays open. Stop with Ctrl+C. |
| `npm run db:restore -- <file>` | Restores a backup into a SEPARATE database (`adaptive_dsa_restored_...`) and prints the counts, so you can look before deciding. It refuses the live database, and it deletes nothing. |
| `npm run db:indexes` | Rebuilds all indexes (unique emails, session expiry). The API does it at start-up; use this if the database was emptied while the API kept running. |

- **Automatic:** `npm run content:seed` takes a backup first and writes nothing if the backup fails (`SKIP_BACKUP=1` to skip it, for a scratch database).
- **Bringing a backup back as the live database is deliberately manual:** restore it into a separate database, check the counts, stop the API, then copy it over yourself. No tool does that for you.
- **Rules the tools follow:** a backup is only ever written outside the project folder; the only database a tool may drop is a throwaway one whose name starts with `adaptive_dsa_check`, `adaptive_dsa_verify_`, `adaptive_dsa_backuptest_` or `adaptive_dsa_restored_`, and never the live one (the check runs before any connection is made).
- **Habit:** run `npm run db:backup` before any bulk change to the database and after a day of real use. A backup you have not verified is a hope, so run `db:backup:verify` now and then.
- `npm run test:backup` tests all of this on throwaway databases (counts, accents, indexes, a damaged file, retention, and every refusal).
