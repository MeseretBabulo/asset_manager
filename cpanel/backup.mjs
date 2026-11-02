// Daily database backup for cPanel (run from a Cron Job).
// Keeps the last 30 copies in <DATA_DIR>/backups. Photos stay in <DATA_DIR>/uploads.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DB = path.join(DATA_DIR, 'asset_manager.db');
const OUT = path.join(DATA_DIR, 'backups');

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, `asset_manager-${new Date().toISOString().slice(0, 10)}.db`);
fs.rmSync(file, { force: true });
new DatabaseSync(DB).exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);

const old = fs.readdirSync(OUT).filter((f) => f.endsWith('.db')).sort().slice(0, -30);
for (const f of old) fs.rmSync(path.join(OUT, f));
console.log('Backup saved:', file);
