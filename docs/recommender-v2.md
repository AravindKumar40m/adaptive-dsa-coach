# Recommender v2 and the placement self-assessment (step 3 of the plan)

**Short version:** the new recommender is built, tested and switchable, but in simulation it is **not clearly better than today's picker**, so **today's picker (v1) stays the default**. The optional self-assessment is live and collects data we can test on real learners.

## What was built
**Recommender v2** (`server/src/recommender2.js`, pure functions). Scores every open problem on five things and picks with softmax weights, so each candidate has a logged probability:
| part | meaning | weight |
|---|---|---|
| fit | is the chance of success near the aim? The aim follows a session arc (warm-up 80%, core 65%, stretch 50%) and recent results (easier after 2 failures, a little harder after 3 wins) | 1.0 |
| information | how much of the starting uncertainty about the learner's skills this problem would remove (doubled for the first 6 problems: a gentle placement) | 0.6 |
| weakness | is its skill below the learner's own average? | 0.4 |
| review | has the skill faded since it was last practised? | 0.5 |
| variety | not the same topic again and again | -0.35 |
The curriculum rules stay (a topic opens after 2 problems of each prerequisite are solved); problems with under a 20% or over a 95% chance are not offered while others exist. `kt/models.js` `describe()` supplies the numbers and never changes the learner.

**Switch:** `PICKER_POLICY=v1` (default) | `v2` | `ab` (half of the learners each, decided only by their id: the same person always gets the same recommender). v2 needs shadow mode (`KT_SHADOW`, on by default) because it reads the knowledge model's memory; without it everybody gets v1. Every recommendation row logs `policy`, the five parts of every candidate, the pick's probability, the slot and the version (`rec-2.0`).

**Placement self-assessment** (`PlacementView.jsx`, `routes/placement.js`): an optional one-minute screen: how well do you know each topic (never heard of it ... could teach it) and overall experience. It becomes a **weak starting guess** for skills with no real attempts: `1000 + 30 x (answer - 2)` rating points with the normal uncertainty; real attempts are never overwritten. Stored as given in `placementsurveys` so we can later test whether it predicts anything.

## What the simulator showed (`npm run policies`, `docs/recommender-results.md`)
Closed loop: each policy chooses every problem for the same simulated learners (paired comparison), 3 seeds x 250 learners per setting, under three different learning rules (failures teach more / learning peaks near 60% / every attempt teaches the same).
- **Knowing the learner:** v2 is the same at 10 and 20 problems and **slightly worse at 40** (error about 87 against 84 rating points in the realistic world; 120 against 117 with strong forgetting).
- **True skill gained, problems solved, skills practised:** the same, under all three learning rules. **Productive-zone share:** the same in the realistic world, about 0.015 lower (a little worse) in the strong-forgetting world.
- **The one consistent gain:** in the realistic world about **10% fewer sessions with 3 failures in a row** (0.338 down to 0.305; 0.348 to 0.313 and 0.348 to 0.312 under the other learning rules).
- **The information term did nothing measurable** (v2 without it behaves the same) and a plain random pick among problems with a 50-80% chance did about as well as any policy.
- **Sensitivity check** (`npm run policies:sensitivity`: one setting changed at a time, 400 learners): no weight, temperature or session-arc setting made v2 better at knowing the learner; error stayed 4 to 7 points worse than v1 in every variant. So this is not one badly chosen weight. A looser temperature (0.4) cost productive-zone share.
- Why, probably: in this simulator what limits knowing a learner is how many outcomes we have and which topics are open, not which problem is picked.

## Decisions
- Default stays **v1**. v2 is available for a later controlled comparison, but with a pilot of 30-50 learners an A/B split (25 against 25) cannot detect a 10% difference in rare events, so I recommend running the pilot on v1 for everyone (its logs already include variety picks with probabilities) and the self-assessment on.
- The self-assessment stays optional and weak. Whether it predicts real success is unknown; the stored answers and `modelpredictions` let us test it.
- The consent wording now lists the self-assessment (`CONSENT_VERSION 2026-10-09.2`): everyone sees the "agree again" screen once.

## Not done / limits
- The simulator is mine: "true skill gained" depends on how I made simulated people learn (hence three rules), engagement assumes learners leave a bit more often after 3 failures in a row, and v2 uses the same knowledge model as the simulator's learners. It tells us how the policies behave, not what helps real people.
- A real placement QUIZ (short questions that measure skill directly) is not built: it needs new question content. The self-assessment is the cheap substitute.
- Idea not tried: faster unlocking for strong learners (today everyone solves 2 problems per prerequisite before a topic opens, so a strong beginner meets about 40 easy problems before medium ones). The simulator can test unlock rules and real logs will show how many learners are held back.
- The "daily plan" is only the warm-up / core / stretch arc inside a session.
