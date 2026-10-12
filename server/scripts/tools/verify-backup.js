// Proves that a backup really restores: it restores the file into a throwaway database, compares every collection's document count with
// the counts recorded when the backup was made, and removes the throwaway database (a scratch name, never the live one).
// The live database is only read. Uses the newest backup unless you give a file.
//   npm run db:backup:verify [-- <backup file>]
import fs from "node:fs";
import path from "node:path";
import { defaultDir, liveDbName, verifyBackup } from "./backup-lib.js";

const dir = defaultDir();
const db = liveDbName();
let file = process.argv[2];
if (!file) {
  const all = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith(`${db}-`) && f.endsWith(".archive.gz")).sort() : [];
  if (!all.length) { console.error(`no backup found in ${dir}. Run: npm run db:backup`); process.exit(1); }
  file = path.join(dir, all[all.length - 1]);
}
try {
  const r = await verifyBackup({ file: path.resolve(file), fromDb: db });
  console.log(`${r.ok ? "BACKUP OK" : "BACKUP PROBLEM"}: ${path.basename(file)}`);
  for (const [name, n] of Object.entries(r.expected)) console.log(`  ${name.padEnd(28)} recorded ${String(n).padStart(6)}   restored ${String(r.restored[name] ?? 0).padStart(6)}`);
  for (const p of r.problems) console.log("  PROBLEM:", p);
  const diffs = Object.entries(r.liveDifferences ?? {});
  console.log(diffs.length ? `  the live database has changed since this backup in: ${diffs.map(([k, v]) => `${k} (${v.backup} -> ${v.live})`).join(", ")}` : "  the live database matches this backup");
  process.exit(r.ok ? 0 : 1);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
