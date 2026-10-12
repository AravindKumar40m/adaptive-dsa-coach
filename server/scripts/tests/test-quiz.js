// The placement quiz engine (server/src/placement/quiz.js) and the question bank. Pure maths, no services needed.
// Learners are simulated by "what is the hardest level they can answer right in each topic".   Run: npm run test:quiz
import fs from "node:fs";
import { MAX_QUESTIONS, MIN_TO_FINISH, PLACED_RATING, estimateTopic, nextQuestion, scoreQuiz, shuffledOrder } from "../../src/placement/quiz.js";
import { conceptStatus } from "../../src/recommend/picker.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };

// the real curriculum (order and prerequisites) and the real question bank
const build = JSON.parse(fs.readFileSync(new URL("../../content/build/content.json", import.meta.url), "utf8"));
const concepts = build.concepts.map((c) => ({ key: c.key, name: c.name, prerequisites: c.prerequisites })).sort((a, b) => build.concepts.find((x) => x.key === a.key).order - build.concepts.find((x) => x.key === b.key).order);
const bank = JSON.parse(fs.readFileSync(new URL("../../content/build/placement.json", import.meta.url), "utf8"));
const items = bank.items.map((i) => ({ id: i.id, concept: i.concept, level: i.level }));
const order = concepts.map((c) => c.key);

// ---------------------------------------------------------------- the bank
check(bank.items.length === 48 && new Set(bank.items.map((i) => i.id)).size === 48, "the bank has 48 questions with unique ids");
check(order.every((c) => [1, 2, 3].every((l) => bank.items.some((i) => i.concept === c && i.level === l))), "every one of the 16 topics has a question at levels 1, 2 and 3");
check(bank.items.every((i) => i.options.length === 4 && new Set(i.options).size === 4 && i.answer >= 0 && i.answer < 4 && i.explain.length > 20), "every question has 4 distinct options, an answer in range and an explanation");
check(bank.items.filter((i) => i.kind === "trace").every((i) => i.code && i.code.length > 10) && bank.items.filter((i) => i.kind === "mcq").every((i) => !i.code), "trace questions carry code, concept questions do not");

// ---------------------------------------------------------------- simulate learners
/** knows: concept -> the highest level they answer right (0 = none). Returns every question asked, in order. */
function simulate(knows) {
  const answers = [], asked = [];
  for (;;) {
    const q = nextQuestion({ concepts, items, answers });
    if (!q) break;
    asked.push(q.id);
    answers.push({ concept: q.concept, level: q.level, correct: q.level <= (knows[q.concept] ?? 0) });
  }
  return { asked, answers };
}
const everyone = (level) => Object.fromEntries(order.map((c) => [c, level]));

// a learner who knows everything: breadth (16 medium questions in curriculum order), then hard ones until the cap
let s = simulate(everyone(3));
check(s.asked.length === MAX_QUESTIONS && MAX_QUESTIONS === 24, "a strong learner is asked exactly 24 questions (the cap)");
check(JSON.stringify(s.asked.slice(0, 16)) === JSON.stringify(order.map((c) => `${c}-L2`)), "the first 16 are the medium question of each topic, in curriculum order");
check(JSON.stringify(s.asked.slice(16)) === JSON.stringify(order.slice(0, 8).map((c) => `${c}-L3`)), "then the hard question for the first 8 topics, in order");
check(new Set(s.asked).size === s.asked.length, "no question is ever asked twice");
let sc = scoreQuiz({ concepts, answers: s.answers });
check(sc.answered === 24 && sc.correct === 24 && sc.topics.length === 16, "scored: 24 of 24 right, all 16 topics estimated");
check(sc.topics.slice(0, 8).every((t) => t.rating === 1200 && t.confidence === "medium") && sc.topics.slice(8).every((t) => t.rating === 1080 && t.confidence === "low"), "first 8 topics (hard answered right) get 1200, the other 8 (one medium answer) get 1080 with low confidence");
check(JSON.stringify(sc.placed) === JSON.stringify(order.slice(0, 8)), "only the 8 topics with two right answers are placed out");

// a beginner: the first topic is missed twice and everything depends on it, so the quiz is over after 2 questions
s = simulate(everyone(0));
check(JSON.stringify(s.asked) === '["arrays-L2","arrays-L1"]', "a beginner is asked arrays medium, then arrays easy, and that is all (everything else depends on arrays)");
sc = scoreQuiz({ concepts, answers: s.answers });
check(sc.topics.length === 1 && sc.topics[0].rating === 850 && sc.topics[0].confidence === "medium" && sc.placed.length === 0, "scored: arrays 850 (needs the basics), nothing placed");

// a learner who knows only the basics of arrays: medium wrong, easy right -> not weak, so the quiz goes on
s = simulate({ ...everyone(0), arrays: 1 });
check(s.asked[0] === "arrays-L2" && s.asked[1] === "arrays-L1" && s.asked[2] === "strings-L2", "easy right after a miss means arrays is NOT weak: the quiz moves on to strings");

// a mixed learner: hashing is weak, so sliding_window (which needs hashing) is never asked; strings is basics only
const mixed = { arrays: 3, strings: 1, hashing: 0, two_pointers: 2, sorting: 2, sliding_window: 3, stack_queue: 2, linked_list: 1, recursion: 3, binary_search: 2, trees: 2, heaps: 0, graphs: 2, greedy: 1, backtracking: 3, dp: 2 };
s = simulate(mixed);
check(!s.asked.some((id) => id.startsWith("sliding_window")), "hashing is weak, so sliding_window (which depends on it) is never asked");
check(s.asked.includes("strings-L1") && s.asked.includes("hashing-L1") && !s.asked.includes("strings-L3"), "strings: medium missed, easy asked and right; hashing: medium and easy both missed");
check(s.asked.some((id) => id.startsWith("graphs")) && !s.asked.some((id) => id.startsWith("heaps-L3")), "graphs (needs trees and stacks, both fine) is asked; heaps (medium and easy missed) gets no hard question");
sc = scoreQuiz({ concepts, answers: s.answers });
const t = Object.fromEntries(sc.topics.map((x) => [x.concept, x]));
check(t.hashing.rating === 850 && t.strings.rating === 980 && t.arrays.rating === 1200 && t.two_pointers.rating === 1120, "ratings: hashing 850 (shaky), strings 980 (basics), arrays 1200 (strong), two_pointers 1120 (comfortable)", JSON.stringify([t.hashing?.rating, t.strings?.rating, t.arrays?.rating, t.two_pointers?.rating]));
check(!sc.topics.some((x) => x.concept === "sliding_window") && sc.placed.includes("arrays") && !sc.placed.includes("strings") && !sc.placed.includes("hashing"), "a topic never asked has no estimate; only 1120+ topics are placed");

// an early stop: the first 6 answers of a strong learner score only what was asked
const partial = simulate(everyone(3)).answers.slice(0, MIN_TO_FINISH);
sc = scoreQuiz({ concepts, answers: partial });
check(MIN_TO_FINISH === 6 && sc.topics.length === 6 && sc.topics.every((x) => x.rating === 1080 && x.confidence === "low") && sc.placed.length === 0, "stopping after 6 answers: 6 topics estimated at 1080 (low confidence) and none placed out (one answer is not enough)");

// the same answers always lead to the same questions (a page reload must not change them)
check(JSON.stringify(simulate(mixed).asked) === JSON.stringify(simulate(mixed).asked), "the sequence of questions depends only on the answers (deterministic)");
check(nextQuestion({ concepts, items, answers: simulate(everyone(3)).answers }) === null, "after the cap, no more questions");

// ---------------------------------------------------------------- the rating table, pattern by pattern
const e = (pairs) => estimateTopic(new Map(pairs));
const cases = [
  [[[2, false]], 920, "low"], [[[2, false], [1, false]], 850, "medium"], [[[2, false], [1, true]], 980, "medium"],
  [[[2, true]], 1080, "low"], [[[2, true], [3, false]], 1120, "medium"], [[[2, true], [3, true]], 1200, "medium"],
];
for (const [pairs, rating, conf] of cases) { const r = e(pairs); check(r.rating === rating && r.confidence === conf, `answers ${JSON.stringify(pairs)} -> ${rating}, ${conf} confidence`, JSON.stringify(r)); }
check(estimateTopic(new Map()) === null && estimateTopic(undefined) === null, "a topic with no answers has no estimate");
check(PLACED_RATING === 1120, "a topic is placed out from 1120");

// ---------------------------------------------------------------- placed topics unlock their dependants (picker rule)
const problems = [{ slug: "a1", concept: "arrays" }, { slug: "a2", concept: "arrays" }, { slug: "s1", concept: "strings" }];
const small = [{ key: "arrays", prerequisites: [] }, { key: "strings", prerequisites: ["arrays"] }];
check(conceptStatus({ concepts: small, problems, solved: new Set() }).get("strings").unlocked === false, "without the quiz: nothing solved, strings is locked");
check(conceptStatus({ concepts: small, problems, solved: new Set(), placed: new Set(["arrays"]) }).get("strings").unlocked === true, "with arrays placed out, strings is open without solving anything");
check(conceptStatus({ concepts: small, problems, solved: new Set(), placed: new Set(["arrays"]) }).get("arrays").solved === 0, "placing out does not pretend problems were solved (solved stays 0)");

// ---------------------------------------------------------------- shuffling
const o = shuffledOrder(4, "quiz1:arrays-L2");
check(JSON.stringify([...o].sort()) === "[0,1,2,3]", "a shuffle is a permutation of 0..3", JSON.stringify(o));
check(JSON.stringify(o) === JSON.stringify(shuffledOrder(4, "quiz1:arrays-L2")), "the same quiz and question always give the same order (a reload does not reshuffle)");
const firsts = Array.from({ length: 400 }, (_, i) => shuffledOrder(4, `quiz${i}:arrays-L2`)[0]);
const counts = [0, 1, 2, 3].map((p) => firsts.filter((x) => x === p).length);
check(counts.every((n) => n >= 60 && n <= 140), "over 400 quizzes each option comes first about a quarter of the time", JSON.stringify(counts));

console.log(failures === 0 ? "\nALL QUIZ CHECKS PASSED" : `\n${failures} QUIZ CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
