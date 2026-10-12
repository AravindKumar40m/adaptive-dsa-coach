// Backup building blocks used by db:backup, db:restore, db:backup:verify, db:backup:loop, the content seed and test:backup.
// Everything here READS the live database. The only things it ever writes or deletes are:
//   - backup files in the backup folder (the newest `keep` of each database are kept),
//   - a COPY restored into a separate database whose name is refused if it is the live one,
//   - a throwaway database, dropped only if its name has a scratch prefix (see SCRATCH_PREFIXES) and is not the live database.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { config } from "../../src/config.js";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const SCRATCH_PREFIXES = ["adaptive_dsa_check", "adaptive_dsa_verify_", "adaptive_dsa_backuptest_", "adaptive_dsa_restored_"];

export const liveDbName = () => new URL(config.mongoUri).pathname.replace(/^\//, "") || "adaptive_dsa";
export const defaultDir = () => process.env.BACKUP_DIR || path.join(os.homedir(), "adaptive-dsa-backups");
const stampNow = () => new Date().toISOString().replace(/[:.]/g, "-");

function assertOutsideProject(dir) {
  if (path.resolve(dir).toLowerCase().startsWith(projectRoot.toLowerCase())) throw new Error("the backup folder must be outside the project folder");
}

/** Runs a docker command inside the Mongo container (the service called `mongo` in docker-compose.yml). */
function dockerMongo(args, { stdin = null, stdout = null } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["compose", "exec", "-T", "mongo", ...args], { cwd: projectRoot, stdio: [stdin ? "pipe" : "ignore", stdout ? "pipe" : "ignore", "pipe"] });
    let log = "";
    child.stderr.on("data", (d) => (log += d));
    if (stdin) fs.createReadStream(stdin).pipe(child.stdin);
    if (stdout) child.stdout.pipe(stdout);
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(log) : reject(new Error(`docker exited with ${code}: ${log.slice(-500)}`))));
  });
}

/**
 * Saves one database into ONE compressed file plus a small `.counts.json` next to it (documents per collection at that moment).
 * @returns {{file, size, documents, collections, empty}}
 */
export async function backupNow({ dbName = liveDbName(), dir = defaultDir(), keep = 20, label = "" } = {}) {
  assertOutsideProject(dir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${dbName}-${stampNow()}${label ? "-" + label : ""}.archive.gz`);
  const out = fs.createWriteStream(file);
  let log;
  try {
    log = await dockerMongo(["mongodump", "--archive", "--gzip", "--db", dbName], { stdout: out });
    await new Promise((r) => (out.writableFinished ? r() : out.on("finish", r)));
  } catch (err) {
    try { fs.unlinkSync(file); } catch { /* nothing to remove */ }
    throw new Error(`BACKUP FAILED: ${err.message}`);
  }
  const collections = {};
  for (const m of log.matchAll(/done dumping `?([^`\s]+)`? \((\d+) documents?\)/g)) collections[m[1].slice(dbName.length + 1)] = Number(m[2]); // mongodump quotes names: `db.collection`
  const size = fs.statSync(file).size;
  fs.writeFileSync(file + ".counts.json", JSON.stringify({ db: dbName, createdAt: new Date().toISOString(), collections }, null, 1));
  // keep only the newest `keep` backups of this database (never the one just made)
  const mine = fs.readdirSync(dir).filter((f) => f.startsWith(`${dbName}-`) && f.endsWith(".archive.gz")).sort();
  for (const f of mine.slice(0, Math.max(0, mine.length - keep))) {
    fs.unlinkSync(path.join(dir, f));
    try { fs.unlinkSync(path.join(dir, f + ".counts.json")); } catch { /* no sidecar */ }
  }
  const documents = Object.values(collections).reduce((a, b) => a + b, 0);
  return { file, size, documents, collections, empty: documents === 0 };
}

/** Restores a backup file into a SEPARATE database. The live database is refused: promote a restored copy by hand, after looking at it. */
export async function restoreInto({ file, fromDb, intoDb }) {
  if (intoDb === liveDbName()) throw new Error(`REFUSED: ${intoDb} is the live database. Restore into another name, look at it, then decide.`);
  if (!fs.existsSync(file)) throw new Error(`no such backup file: ${file}`);
  await dockerMongo(["mongorestore", "--archive", "--gzip", "--nsFrom", `${fromDb}.*`, "--nsTo", `${intoDb}.*`], { stdin: file });
}

function dbConnection(name) {
  const url = new URL(config.mongoUri);
  url.pathname = "/" + name;
  return mongoose.createConnection(url.toString(), { serverSelectionTimeoutMS: 3000 }).asPromise();
}

/** Document count of every collection in a database (reads only). */
export async function countsOf(name) {
  const conn = await dbConnection(name);
  try {
    const out = {};
    for (const c of await conn.db.listCollections({}, { nameOnly: true }).toArray()) out[c.name] = await conn.db.collection(c.name).countDocuments();
    return out;
  } finally {
    await conn.close();
  }
}

export async function databaseExists(name) {
  const conn = await dbConnection("admin");
  try {
    return (await conn.db.admin().listDatabases()).databases.some((d) => d.name === name);
  } finally {
    await conn.close();
  }
}

/** Drops a throwaway database. REFUSES anything that is not clearly scratch, and always refuses the live database. */
export async function dropScratchDb(name) {
  const isLive = name === liveDbName();
  const isScratch = SCRATCH_PREFIXES.some((prefix) => name.startsWith(prefix));
  if (isLive || !isScratch) {
    throw new Error(`REFUSED to drop "${name}": only scratch databases (names starting with ${SCRATCH_PREFIXES.join(" or ")}) may be dropped, never the live one.`);
  }
  const conn = await dbConnection(name);
  try {
    if (conn.name !== name) throw new Error(`REFUSED: connected to "${conn.name}", expected "${name}"`);
    await conn.db.dropDatabase();
  } finally {
    await conn.close();
  }
}

/**
 * Proves a backup is usable: restores it into a throwaway database, compares every collection's count with the counts recorded
 * when the backup was made, then removes the throwaway database. Also reports how the live database differs (information only).
 */
export async function verifyBackup({ file, fromDb = liveDbName(), compareLive = true }) {
  const sidecar = file + ".counts.json";
  if (!fs.existsSync(sidecar)) throw new Error(`no ${path.basename(sidecar)} next to the backup: cannot compare counts`);
  const expected = JSON.parse(fs.readFileSync(sidecar, "utf8")).collections;
  const scratch = `adaptive_dsa_verify_${stampNow().toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  let restored;
  try {
    await restoreInto({ file, fromDb, intoDb: scratch }); // a damaged file can fail halfway and still leave a partly restored database
    restored = await countsOf(scratch);
  } finally {
    await dropScratchDb(scratch); // always removed, also when the restore failed
  }
  const problems = [];
  for (const [name, n] of Object.entries(expected)) if ((restored[name] ?? 0) !== n) problems.push(`${name}: backup recorded ${n}, restored ${restored[name] ?? 0}`);
  for (const name of Object.keys(restored)) if (!(name in expected) && restored[name] > 0) problems.push(`${name}: ${restored[name]} restored documents that the backup did not record`);
  let live = null;
  if (compareLive) {
    const now = await countsOf(fromDb);
    live = Object.fromEntries(Object.keys({ ...expected, ...now }).map((k) => [k, { backup: expected[k] ?? 0, live: now[k] ?? 0 }]).filter(([, v]) => v.backup !== v.live));
  }
  return { ok: problems.length === 0, problems, restored, expected, liveDifferences: live };
}
