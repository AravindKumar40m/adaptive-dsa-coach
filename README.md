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
| `grading/` | `grader` (calls Judge0), `harness` (builds the hidden test program per language), `languages`, `errors` (mistake classifier) |
| `skill/` | `skill` (the Elo maths), `rating` (applies it), `learnerState`, `history` (solve history) |
| `recommend/` | `picker` (v1), `recommender2` (v2), `policy` (v1/v2/ab switch), `review` (spaced review) |
| `help/` | `hints` (the ladder), `llm` (AI explanation), `struggle` (nudge rule), `nudge` (nudge, database side) |
| `logging/` | `activity` (work pattern), `codeSignals`, `logSignals`, `sessions` |
| `kt/` | the new knowledge model (shadow mode) |

**`server/scripts/`**: `tests/` (every `test-*.js`, run with `npm run test:...`), `tools/` (owner tools: cleanup, orphans, reset-password, logs-summary, metrics-report, llm-live-check), `dev/` (fake AI, fake Google, dev-db-poke), `content/` (seed, validate-references), `arena/` (model and policy simulations), `lib/` (helpers shared by the scripts). **`server/content/`** holds the problems, tests and the Python build tools.

**`client/src/`**: `pages/` (Auth, Path, Placement, Problems, Shell), `components/` (TopBar, SkillMap, icons, ui), `lib/` (api, hooks, activityTracker, monacoTheme, authQuery), `workspace/` (the practice screen), `styles/`. `App.jsx` and `main.jsx` stay at the top.

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

## Content at the target size: 120 problems (Day 3)
41 easy, 60 medium, 19 hard; every one of the 16 concepts has 6 to 9 problems. 2,626 tests; 623 reference solutions (Python brute/better/optimal + JavaScript, Java and C++), all verified through the real harness.
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
