// The backup tools end to end, on THROWAWAY databases only (names starting adaptive_dsa_backuptest_). The live database is only read,
// to prove that nothing here changes it.   Run: npm run test:backup   (needs Docker with the mongo container running)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { backupNow, countsOf, databaseExists, dropScratchDb, liveDbName, projectRoot, restoreInto, verifyBackup } from "../tools/backup-lib.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const rejects = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };

const scratch = `adaptive_dsa_backuptest_${Date.now().toString(36)}`;
const copy = `${scratch}_copy`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-backup-test-"));
const live = liveDbName();
const liveBefore = await countsOf(live);

try {
  // ---- a throwaway database with some documents (including non-English text)
  const url = new URL(config.mongoUri);
  url.pathname = "/" + scratch;
  const conn = await mongoose.createConnection(url.toString(), { serverSelectionTimeoutMS: 3000 }).asPromise();
  check(conn.name === scratch && conn.name !== live, "the test works in its own throwaway database, not the live one", `(${conn.name})`);
  await conn.db.collection("things").insertMany(Array.from({ length: 50 }, (_, i) => ({ n: i, text: i === 0 ? "naïve café, 日本語" : `row ${i}` })));
  await conn.db.collection("people").insertMany(Array.from({ length: 7 }, (_, i) => ({ email: `p${i}@example.test` })));
  await conn.db.collection("people").createIndex({ email: 1 }, { unique: true });
  await conn.close();

  // ---- backup
  const b = await backupNow({ dbName: scratch, dir, keep: 20 });
  check(fs.existsSync(b.file) && b.size > 200 && b.documents === 57 && b.collections.things === 50 && b.collections.people === 7, "a backup file is written with the right document counts", JSON.stringify(b.collections));
  const side = JSON.parse(fs.readFileSync(b.file + ".counts.json", "utf8"));
  check(side.db === scratch && side.collections.things === 50, "and a .counts.json next to it");
  check(path.resolve(b.file).toLowerCase().startsWith(path.resolve(dir).toLowerCase()) && !path.resolve(b.file).toLowerCase().startsWith(projectRoot.toLowerCase()), "the backup is outside the project folder");

  // ---- restore into a separate database, then verify
  await restoreInto({ file: b.file, fromDb: scratch, intoDb: copy });
  const restored = await countsOf(copy);
  check(restored.things === 50 && restored.people === 7, "restoring into a separate database gives the same counts", JSON.stringify(restored));
  const cconn = await mongoose.createConnection(new URL("/" + copy, url).toString(), { serverSelectionTimeoutMS: 3000 }).asPromise();
  const doc0 = await cconn.db.collection("things").findOne({ n: 0 });
  const idx = await cconn.db.collection("people").indexes();
  await cconn.close();
  check(doc0?.text === "naïve café, 日本語", "text with accents and non-Latin characters comes back exactly");
  check(idx.some((i) => i.name === "email_1" && i.unique), "indexes (here a unique one) come back too");

  const v = await verifyBackup({ file: b.file, fromDb: scratch, compareLive: false });
  check(v.ok && v.problems.length === 0, "verify says OK for a good backup");
  check(!(await databaseExists(`adaptive_dsa_verify_x`)) && (await (async () => { const c = await mongoose.createConnection(new URL("/admin", url).toString()).asPromise(); const names = (await c.db.admin().listDatabases()).databases.map((d) => d.name); await c.close(); return !names.some((n) => n.startsWith("adaptive_dsa_verify_")); })()), "and it leaves no throwaway verify database behind");

  const tampered = path.join(dir, "tampered.archive.gz");
  fs.copyFileSync(b.file, tampered);
  fs.writeFileSync(tampered + ".counts.json", JSON.stringify({ db: scratch, collections: { things: 51, people: 7 } }));
  const bad = await verifyBackup({ file: tampered, fromDb: scratch, compareLive: false });
  check(!bad.ok && bad.problems.some((p) => /things/.test(p)), "verify reports a problem when the recorded counts do not match", JSON.stringify(bad.problems));
  fs.writeFileSync(path.join(dir, "cut.archive.gz"), fs.readFileSync(b.file).subarray(0, Math.floor(b.size / 2)));
  fs.writeFileSync(path.join(dir, "cut.archive.gz.counts.json"), JSON.stringify({ db: scratch, collections: { things: 50, people: 7 } }));
  const cut = await rejects(() => verifyBackup({ file: path.join(dir, "cut.archive.gz"), fromDb: scratch, compareLive: false }));
  const cutResult = cut === null ? await verifyBackup({ file: path.join(dir, "cut.archive.gz"), fromDb: scratch, compareLive: false }).catch(() => ({ ok: false })) : { ok: false };
  check(cut !== null || cutResult.ok === false, "a damaged (cut-off) backup does not verify as OK");

  // ---- the safety rules
  check(/REFUSED/.test((await rejects(() => restoreInto({ file: b.file, fromDb: scratch, intoDb: live }))) ?? ""), "restoring INTO the live database is refused");
  check(/REFUSED/.test((await rejects(() => dropScratchDb(live))) ?? ""), "dropping the live database is refused");
  for (const name of ["adaptive_dsa", "admin", "local", "adaptive_dsa_other", "users", "adaptive_dsa_backuptes"]) {
    check(/REFUSED/.test((await rejects(() => dropScratchDb(name))) ?? ""), `dropping "${name}" is refused (not a scratch name)`);
  }
  check(/outside the project/.test((await rejects(() => backupNow({ dbName: scratch, dir: path.join(projectRoot, "backups-in-project") }))) ?? ""), "a backup folder inside the project is refused");
  check(!fs.existsSync(path.join(projectRoot, "backups-in-project")), "and nothing was created there");

  // ---- retention: only the newest `keep` are kept
  for (let i = 0; i < 3; i++) { await backupNow({ dbName: scratch, dir, keep: 2 }); await new Promise((r) => setTimeout(r, 1100)); }
  const kept = fs.readdirSync(dir).filter((f) => f.startsWith(`${scratch}-`) && f.endsWith(".archive.gz"));
  check(kept.length === 2, "only the newest backups are kept (keep = 2)", `(${kept.length} files)`);
  check(kept.every((f) => fs.existsSync(path.join(dir, f + ".counts.json"))) && !fs.readdirSync(dir).some((f) => f.endsWith(".counts.json") && !fs.existsSync(path.join(dir, f.replace(".counts.json", "")))), "old files are removed together with their counts file");

  // ---- an empty / missing database is reported as empty, not as a crash
  const empty = await backupNow({ dbName: `${scratch}_none`, dir, keep: 20 });
  check(empty.empty === true && empty.documents === 0, "an empty database gives a backup that says it is empty");
} finally {
  // remove ONLY the throwaway databases this test created (the guard refuses anything else)
  for (const name of [scratch, copy, `${scratch}_none`]) await dropScratchDb(name).catch((e) => console.log("cleanup:", e.message));
  fs.rmSync(dir, { recursive: true, force: true });
}

const liveAfter = await countsOf(live);
// The running API legitimately appends timing rows (metricevents) and sessions expire by themselves, so the property is "nothing was LOST".
const lost = Object.keys(liveBefore).filter((name) => !["metricevents", "sessions"].includes(name) && (liveAfter[name] ?? 0) < liveBefore[name]);
check(lost.length === 0 && Object.keys(liveBefore).every((name) => name in liveAfter), "nothing was lost from the live database (no collection or document is gone)", `(${Object.keys(liveAfter).length} collections${lost.length ? ", LOST: " + lost.join(",") : ""})`);
console.log(failures === 0 ? "\nALL BACKUP CHECKS PASSED" : `\n${failures} BACKUP CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
