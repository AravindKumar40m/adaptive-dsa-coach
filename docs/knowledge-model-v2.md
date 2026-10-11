# Knowledge model v2 (step 2 of the plan)

What this is: a better model of "what does this learner know", built next to the live Elo, plus a way to compare models fairly.
**The live system still uses Elo.** The new model only runs in *shadow mode*: it predicts silently and logs, so real data decides later.

## The ideas, in plain words
Every model answers one question before seeing the result: *will this learner solve this problem on their first Submit?* (label: first gradable Submit accepted; compile errors do not count, they say nothing about skill).

| idea | what it means | file |
|---|---|---|
| **Uncertainty** | a skill is "rating +- how sure we are". New or rarely practised skills move fast, well-measured ones slowly. Predictions are pulled towards 50% while we are unsure. (A Kalman / Glicko-style update.) | `server/src/kt/models.js` (`Kalman`) |
| **Skills per problem** | a sliding-window problem also needs hashing; one solve updates every skill the problem needs, by weight (main skill 0.6-1.0, up to two helpers). Tags: `server/content/skills.json`, proposed automatically by `content/tag_skills.py`, reviewed in `content/skills-review.md` (58 of 120 problems have 2+ skills). **Needs a human read.** | `tag_skills.py`, `Problem.skills` |
| **Forgetting** | a skill fades towards 1000 with a half-life if it is not practised, and we become less sure about it | `view()` in `Kalman` |
| **Transfer** | a skill the learner has never touched starts from their overall level (strong at arrays -> probably decent at strings) | `meanShift()` |
| **Practice gain** | a few rating points just for practising (people improve) | `params.gain` |
| Elo (reference) | production rule: one rating per concept, K = 40 then 16 | `Elo` |
| Trained logistic regression | a "learn the weights from data" comparator | `LogReg` |

Models in the arena: global-rate, item-mean (each problem's own success rate), elo, elo-tuned, kt-unc, kt-multi, kt-forget, kt-full, logreg.

## The arena (`npm run arena`)
`server/scripts/arena/`. Replays learner histories, **predicting every attempt before learning from it**, and scores models on learners they never trained on (60% train, 20% choose settings, 20% exam; split by learner). Metrics: log-loss (guessing 50% = 0.693), AUC, accuracy, calibration gap, cold-start vs later log-loss, and the **paired difference to Elo** with a per-learner uncertainty. Every model with settings is tuned the same way (Elo too).
- `npm run arena` all 5 simulated worlds, 3 seeds, 500 learners (about 4 minutes; writes `docs/arena-results.md`)
- `npm run arena -- --quick` a fast check; `--worlds W4-realistic --learners 1500` to vary
- `npm run arena -- --source mongo` the same comparison on REAL learner logs (needs about 10 learners to run, 30-50 for a first look)

The simulator (`sim.js`) puts learners with true hidden skills on our real 120 problems, chosen by our real picker. Worlds switch behaviours on or off (learning, forgetting, multi-skill truth, correlated skills, problem noise, session mood, wrong tags) so we can check each idea **helps when its effect exists and does not hurt when it does not**. It also provides a ceiling: an "oracle" that knows the true skill.

## What the arena showed (3 seeds x 500 simulated learners)
Log-loss, lower is better. "vs Elo" = average gain per attempt (+/- uncertainty).

| world | Elo | ceiling | kt-full vs Elo | share of the Elo-to-ceiling gap closed |
|---|---|---|---|---|
| W0 static skills | 0.6413 | 0.5930 | -0.0000 +/- 0.0005 (same) | 0% |
| W1 learning | 0.6509 | 0.6014 | +0.0012 +/- 0.0007 (same) | 2% |
| W2 multi-skill | 0.6496 | 0.6095 | +0.0011 +/- 0.0007 (same) | 3% |
| W3 strong forgetting | 0.6141 | 0.5847 | +0.0017 +/- 0.0005 (better) | 6% |
| W4 realistic mix | 0.6008 | 0.5728 | +0.0019 +/- 0.0005 (better) | 7% |

1. **Nothing is hurt when an effect is absent** (W0-W2: every model within noise of Elo), so running kt-full in shadow is safe.
2. **kt-full is the best or tied-best wherever an effect exists** (W3, W4), but the gain is **small: at most about 7% of the distance to a perfect model**. Tripling the learners (1,500 instead of 500, one seed, W4) lifts it only to about 10%.
3. **The bottleneck is information per learner, not the formula.** 40-60 yes/no outcomes cannot pin down 16 skills. More clever maths on outcomes alone will not close the gap; more informative data will: a placement quiz (every first question counts), the richer signals of Logging v2 (hints, time, errors, confidence), and population knowledge across many learners.
4. **The trained logistic regression is not better** than the Elo-style models at this data size (clearly better than Elo in only 1 of 5 worlds, with worse calibration). That supports the decision to defer trained models until there is real data.
5. Forgetting is *detectable*: in the strong-forgetting world the tuned half-life came out at 3-7 days (true value 12), in the right direction. **Tuned settings vary a lot between seeds**, so they are weakly identified at this size: the shadow defaults are conservative priors, not tuned values.
6. Calibration is similar for the Elo-style models (gap 0.012-0.025, no consistent win); the trained logistic regression is worse (up to 0.034).

## Shadow mode (what runs in the live API)
`server/src/kt/shadow.js`, switch `KT_SHADOW=false` to turn off. On each learner's **first gradable Submit on a problem** (not a compile error, not already solved, no earlier failed Submit) it records, BEFORE the production rating changes: the live Elo prediction `E`, the new model's prediction, the outcome, the problem difficulty used, the model version and settings (`modelpredictions`); and keeps the model's memory of the learner (`knowledgestates`). It changes nothing the learner sees. Shadow settings (priors): `sd0 100, drift 12, halfLifeDays 30, transfer 0.5, gain 0`. `kt-full-0.1`.
Tested: predictions equal a hand calculation, replaying the logged events reproduces every logged prediction exactly, and the stored memory equals the replayed memory.

## Decisions and what is NOT done
- Live recommendations stay on Elo. Switch only when real logs (`arena --source mongo`) show the new model is better on held-out learners.
- Not done: calibrating the hint / attempt / time penalties of the score (needs real outcomes; the arena's real-data mode and `modelpredictions` are the tools); using hint level, time or error type as model inputs (they are logged; the first real data decides what is worth modelling); the placement quiz and a recommender that values information (step 3).

## Limits you should know
- The simulator is MY construction. The new model is built in the same family as the simulator's true learners (logistic skills that learn and fade), which favours it. Treat the sizes of the gains as optimistic and the "does not hurt" result as the stronger claim.
- Skill tags are automatic proposals (checked on ~15 cases by me, not by a teacher). Wrong tags cost little in the arena (30% corrupted in W4) but are unverified on real learners.
- The label ignores hints and time; the real score uses them.
- Shadow memory is updated with load-modify-save: two simultaneous Submits by one learner could lose one update (very rare).
- Real data today: 1 learner, 2 outcomes. Nothing can be concluded about real people yet.
