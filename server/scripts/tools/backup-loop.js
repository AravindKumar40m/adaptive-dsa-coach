// Backs up the database now and then every N hours (default 6), for as long as this window stays open. Stop it with Ctrl+C.
// It only READS the database. Each backup is checked for size and counts, and a failure is printed (and retried next time), not hidden.
//   npm run db:backup:loop [-- <hours>]
import { backupNow } from "./backup-lib.js";

const hours = Number(process.argv[2] || 6);
if (!(hours > 0 && hours <= 168)) { console.error("hours must be between 0 and 168"); process.exit(1); }

async function once() {
  const when = new Date().toLocaleString();
  try {
    const r = await backupNow({ label: "auto" });
    console.log(`[${when}] saved ${r.file} (${(r.size / 1024).toFixed(0)} KB, ${r.documents} documents)`);
  } catch (err) {
    console.error(`[${when}] BACKUP FAILED: ${err.message}`);
  }
}

console.log(`backing up now and then every ${hours} hour(s); Ctrl+C stops`);
await once();
setInterval(once, hours * 3600 * 1000);
