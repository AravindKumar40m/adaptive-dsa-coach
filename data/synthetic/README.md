# Synthetic DSA learner data

Simulated practice logs for bootstrapping the adaptive learning model before real users exist.
Everything is Python stdlib, with no paid APIs and no dependencies.

**Caveat:** a model trained on this data learns only the simulator's assumptions (how skill grows,
decays, and turns into pass/fail). Use it to build and test the pipeline and as a cold-start prior,
then retrain or fine-tune on real attempt logs as soon as they exist. The real logs should use this same schema.

## Files
| File | What it is |
|---|---|
| `simulate.py` | The simulator. `python3 simulate.py --learners 3000 --days 90 --seed 7` regenerates everything. |
| `attempts.csv` | 815,942 attempts from 3,000 learners over 90 days (~63 MB). |
| `attempts_sample_1000.csv` | First 1,000 rows, for a quick look. |
| `learners.jsonl` | One line per learner: archetype, hidden traits, start/end skill per topic. |
| `baseline_model.py` | Trains and evaluates the baseline models below. |
| `baseline_results.json` | Output of the last run. |

## How learners are simulated
- **Archetypes:** zero_knowledge 35%, beginner 30%, intermediate 25%, advanced 10%, each with a starting skill range.
- **Hidden skill** per topic (0 to 1) across 16 topics with prerequisites (arrays, then two_pointers/hashing, then sliding_window, ... up to graphs, heaps, dp, backtracking). A topic unlocks once its prerequisites exceed 0.4.
- **Per-learner traits:** learning rate, forgetting rate, slip (fails despite knowing), guess (passes despite not knowing), speed, tendency to use hints, and how many days they show up.
- **Practice loop:** on active days a learner solves 2 to 7 problems, mostly on their weakest unlocked topic, at a difficulty close to their current skill.
- **Learning:** a pass teaches more than a fail, hints reduce the gain, and problems far too easy or too hard teach less.
- **Forgetting:** skill decays exponentially over idle days, but never below 85% of the topic's peak.
- Mean skill goes from 0.04 to 0.68 for zero_knowledge learners and from 0.56 to 0.75 for advanced ones over 90 days.

## attempts.csv schema
| Column | Type | Meaning |
|---|---|---|
| learner_id | str | `u00000` ... |
| day | int | Day index, 0 to 89 (rows are in time order per learner) |
| topic | str | One of 16 DSA topics |
| problem_id | str | `topic-difficulty-nn` |
| difficulty | int | 1 to 10 |
| difficulty_label | str | easy (1-3), medium (4-7), hard (8-10) |
| time_taken_sec | int | Time to final submission |
| attempts | int | Submissions made on this problem |
| hints_used | int | 0 to 3 |
| passed | 0/1 | Final result (the prediction target) |
| optimal_complexity | str | Best-known complexity class for the problem |
| estimated_complexity | str | Complexity class of the learner's solution |
| is_optimal | 0/1 | estimated == optimal |
| true_skill_before | float | **Hidden** skill before the attempt. Only for evaluation; a real model never sees it, and real data won't have it. |

## Baseline results (held-out 600 learners, 162k attempts)
Each model predicts `passed` from that learner's earlier attempts only.

| Model | Accuracy | AUC | Log loss |
|---|---|---|---|
| Always predict global pass rate | 0.657 | 0.50 | 0.643 |
| Elo (learner x topic ability vs difficulty) | 0.668 | 0.62 | 0.626 |
| Logistic regression on history features | 0.678 | 0.67 | 0.603 |
| Ceiling: oracle given the hidden skill | 0.697 | 0.70 | 0.584 |

The ceiling is low on purpose: problems are picked near each learner's level, so outcomes are close to a coin flip
weighted by slips and guesses. The logistic regression closes most of the gap to the oracle.
Next step with real data: swap in real logs, compare these baselines, then try BKT or a small DKT/SAKT model.
