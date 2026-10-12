// Restores a backup into a SEPARATE database so you can look at it first. It can never write into the live database
// (that name is refused), and it never deletes anything.
//   npm run db:restore -- <backup file> [--from <database the backup was made from>] [--into <new database name>]
// Defaults: --from the live database name, --into <from>_restored_<date>.
// Afterwards it prints the document count of every collection. To bring that copy back as the live database, do it BY HAND and only
// after checking the counts (for example with mongodump/mongorestore --nsFrom/--nsTo), with the API stopped.
import path from "node:path";
import { countsOf, liveDbName, restoreInto } from "./backup-lib.js";

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const file = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!file) {
  console.error("usage: npm run db:restore -- <backup file> [--from <database>] [--into <new database name>]");
  process.exit(1);
}
const fromDb = flag("--from") || liveDbName();
const intoDb = flag("--into") || `adaptive_dsa_restored_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${Date.now().toString(36)}`;

try {
  await restoreInto({ file: path.resolve(file), fromDb, intoDb });
  const counts = await countsOf(intoDb);
  console.log(`restored ${path.basename(file)} into the separate database "${intoDb}" (the live database was not touched):`);
  for (const [name, n] of Object.entries(counts)) console.log(`  ${name.padEnd(28)} ${n}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
