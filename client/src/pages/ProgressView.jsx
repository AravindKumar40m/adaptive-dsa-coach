import { Fragment } from "react";

// The progress page: what the coach has seen so far, in plain words. Nothing here is a grade.
// All numbers come from GET /api/learners/:id/progress (server/src/insights); this page only lays them out.
const time = (min) => (min >= 60 ? `${(min / 60).toFixed(1)} h` : `${Math.round(min)} min`);
const signed = (n) => `${n > 0 ? "+" : ""}${n}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const share = (n, of) => (of > 0 ? Math.round((100 * n) / of) : 0);

function Pace({ label, g }) {
  return (
    <div className="pace-row">
      <b>{label}</b>
      <span>
        {g.engagedMin > 0 || g.updates > 0
          ? <>{time(g.engagedMin)} of work, <span className={g.points >= 0 ? "up" : "down"}>{signed(g.points)} skill points</span>, {plural(g.solved, "problem")} solved
              {g.enough ? <> — about <b className="num">{signed(g.pointsPerHour)}</b> points and <b className="num">{g.solvedPerHour}</b> problems per hour</> : <span className="faint"> (too little time to give a rate; it needs 20 minutes)</span>}</>
          : <span className="faint">no work recorded</span>}
      </span>
    </div>
  );
}

export function ProgressView({ progress }) {
  if (!progress) return <div className="page"><div className="container"><div className="card empty">Loading your progress...</div></div></div>;
  const { totals, skills, strongest, weakest, mistakes, independence, review, pace, scaling } = progress;
  const started = totals.submits + totals.runs > 0;
  const { buckets } = independence;
  const helpRows = [["No hint", buckets.none], ["Hint level 1", buckets.one], ["Hint level 2", buckets.two], ["Hint level 3 or 4", buckets.threePlus]];
  const weekRate = pace.week.pointsPerHour;

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Your progress.</h1>
        <p className="page-sub">What the coach has seen so far. Nothing here is a grade: it shows where you are and what would help next.</p>

        <div className="stats">
          <div className="card stat"><b>{totals.solved}<span className="faint" style={{ fontSize: 15, fontWeight: 400 }}> / {totals.problems}</span></b><span>problems solved</span></div>
          <div className="card stat"><b>{started ? time(pace.allTime.engagedMin) : "—"}</b><span>of work so far</span></div>
          <div className="card stat" title="Net change of your skill ratings divided by the time you worked, over the last 7 days. It needs at least 20 minutes of work.">
            <b className={weekRate == null ? "" : weekRate >= 0 ? "up" : "down"}>{weekRate == null ? "—" : signed(weekRate)}</b>
            <span>{weekRate == null ? "pace this week (needs 20 min of work)" : "skill points per hour this week"}</span>
          </div>
          <div className="card stat"><b>{independence.firstTry.of ? `${share(independence.firstTry.count, independence.firstTry.of)}%` : "—"}</b><span>{independence.firstTry.of ? `solved on the first Submit (${independence.firstTry.count} of ${independence.firstTry.of})` : "solved on the first Submit"}</span></div>
        </div>

        {!started && <section className="card empty" style={{ marginTop: 18 }}>Nothing to show yet. Solve a problem and this page fills in.</section>}

        <div className="section-head">
          <h3>Skills</h3>
          <div className="faint" style={{ fontSize: 13 }}>The bar is your chance of solving a typical medium problem.</div>
        </div>
        {(strongest || weakest) && (
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {strongest && <span className="badge badge-ok">Strongest: {strongest.name} ({strongest.rating})</span>}
            {weakest && <span className="badge badge-warn">Needs most work: {weakest.name} ({weakest.rating})</span>}
          </div>
        )}
        <section className="card skill-list" aria-label="Skills">
          {skills.map((s) => (
            <div key={s.concept} className={`skill-row ${s.unlocked ? "" : "locked"}`}>
              <a href={`#/problems?concept=${s.concept}`} className="skill-name">{s.name}</a>
              <div className="progress" role="img" aria-label={`${s.chance}% chance of solving a typical medium problem`}><i style={{ width: `${s.chance}%` }} /></div>
              <span className="num skill-chance">{s.chance}%</span>
              <span className="num faint skill-rating" title={s.attempts === 0 && s.rating !== 1000 ? "A starting rating from the placement quiz. Real practice will move it." : undefined}>{s.attempts > 0 ? s.rating : s.rating !== 1000 ? `${s.rating} (quiz)` : "not rated"}</span>
              <span className="num faint skill-solved">{s.unlocked ? `${s.solved} / ${s.total}` : "locked"}</span>
            </div>
          ))}
        </section>

        <div className="two-col">
          <section className="card pad" aria-label="Mistakes">
            <h3 className="card-title">What goes wrong most</h3>
            {mistakes.failedAttempts === 0 ? <p className="muted">No failed attempts yet.</p> : (
              <>
                {mistakes.mostCommonCrash && <p className="muted" style={{ marginBottom: 10 }}>The mistake to watch: <b>{mistakes.mostCommonCrash.label}</b>.</p>}
                <ul className="plain-list">
                  {mistakes.top.map((m) => (<li key={m.key}><span>{m.label}</span><b className="num">{m.count}</b></li>))}
                </ul>
                <p className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>{plural(mistakes.failedAttempts, "failed attempt")} in total, counting both Run and Submit.</p>
              </>
            )}
          </section>

          <section className="card pad" aria-label="Independence">
            <h3 className="card-title">How much help you needed</h3>
            {independence.solvedProblems === 0 ? <p className="muted">Solve a problem to see this.</p> : (
              <>
                <p className="muted" style={{ marginBottom: 10 }}>On the first solve of each of your {independence.solvedProblems} solved problems:</p>
                <div className="help-bars">
                  {helpRows.map(([label, n]) => (
                    <Fragment key={label}>
                      <span>{label}</span>
                      <div className="progress"><i style={{ width: `${share(n, independence.solvedProblems)}%` }} /></div>
                      <b className="num">{n}</b>
                    </Fragment>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        <section className="card pad" style={{ marginTop: 14 }} aria-label="Review">
          <h3 className="card-title">Review</h3>
          {review.due.length === 0 && review.upcoming.length === 0 ? <p className="muted">Nothing scheduled yet. After you solve a problem, its topic comes back for a short review the next day, then after 3, 7, 14 and 30 days.</p> : (
            <>
              {review.due.length > 0
                ? <p style={{ marginBottom: 8 }}><b>Due now:</b> {review.due.map((r, i) => (<Fragment key={r.concept}>{i > 0 && ", "}<a href={`#/problems?concept=${r.concept}`}>{r.name}</a></Fragment>))}. The Path page will offer a review problem soon.</p>
                : <p className="muted" style={{ marginBottom: 8 }}>Nothing is due right now.</p>}
              {review.upcoming.length > 0 && (
                <ul className="plain-list">
                  {review.upcoming.map((r) => (<li key={r.concept}><span>{r.name}</span><span className="faint">in {r.dueInDays < 1 ? "less than a day" : plural(Math.round(r.dueInDays), "day")}</span></li>))}
                </ul>
              )}
            </>
          )}
        </section>

        <section className="card pad" style={{ marginTop: 14 }} aria-label="How your solutions scale">
          <h3 className="card-title">How your solutions scale</h3>
          {scaling.checked === 0 ? <p className="muted">After a correct Python Submit on some problems, we check how fast your solution grows on bigger inputs. Your results will show here.</p> : (
            <>
              <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <span className="badge badge-ok">{scaling.matches} as good as expected</span>
                {scaling.near > 0 && <span className="badge badge-warn">{scaling.near} a little slower</span>}
                {scaling.slow > 0 && <span className="badge badge-bad">{scaling.slow} slower than it could be</span>}
                {scaling.unclear > 0 && <span className="badge">{scaling.unclear} unclear</span>}
              </div>
              <ul className="plain-list">
                {scaling.items.map((it) => (<li key={it.problem}><a href={`#/practice/${it.problem}`}>{it.title}</a><span className="faint">{it.label}{it.verdict === "slow" ? " (slower than it could be)" : it.verdict === "near" ? " (a little slower)" : ""}</span></li>))}
              </ul>
            </>
          )}
        </section>

        <section className="card pad" style={{ marginTop: 14 }} aria-label="Pace">
          <h3 className="card-title">Your pace</h3>
          <Pace label="Last 7 days" g={pace.week} />
          <Pace label="All time" g={pace.allTime} />
          <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>
            Time of work is estimated from when you run code, open hints and edit: a pause counts for at most 5 minutes and a break of 30 minutes or more counts for nothing, so it is a rough measure. Skill points are the total change of your topic ratings. Early on, ratings move a lot while the coach learns about you, and a bad day shows as a negative number, so read the pace as a trend, not a score.
          </p>
        </section>
      </div>
    </div>
  );
}
