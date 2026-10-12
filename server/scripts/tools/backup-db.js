// Saves the whole database (accounts, learning data, content) to ONE compressed file OUTSIDE the project folder.
// It only READS the database. Folder: ~/adaptive-dsa-backups (or BACKUP_DIR); the newest 20 files are kept.
// A small .counts.json is saved next to each file (documents per collection), so `npm run db:backup:verify` can prove the file restores.
// To get a backup back, see `npm run db:restore` (restores into a SEPARATE database; it refuses the live one).
// Run: npm run db:backup     (also runs by itself before the content seed and in db:backup:loop)
import { backupNow } from "./backup-lib.js";

try {
  const r = await backupNow({ label: process.env.BACKUP_LABEL || "" });
  console.log(`backup saved: ${r.file}\n  ${(r.size / 1024).toFixed(0)} KB, ${r.documents} documents in ${Object.keys(r.collections).length} collections${r.empty ? "  (the database is empty)" : ""}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
