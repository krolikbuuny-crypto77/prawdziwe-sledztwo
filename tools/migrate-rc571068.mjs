import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const map=JSON.parse(fs.readFileSync(path.join(root,'docs/historia/ARCHIVE_MAP_RC57_10_68.json'),'utf8'));
const apply=process.argv.includes('--apply');
const digest=(p)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let duplicates=0,removed=0,conflicts=0,archiveChecked=0;
for (const item of map.items) {
  const target=path.join(root,item.after);
  const source=path.join(root,item.before);
  if (!fs.existsSync(target) || digest(target)!==item.sha256) {
    console.error(`ERROR: archived document is missing or modified: ${item.after}`);
    conflicts++;
    continue;
  }
  archiveChecked++;
  if (item.copyOnly || !fs.existsSync(source)) continue;
  duplicates++;
  if (digest(source)!==item.sha256) {
    console.error(`CONFLICT: keeping independently modified document: ${item.before}`);
    conflicts++;
    continue;
  }
  if (apply) { fs.unlinkSync(source); removed++; }
}
console.log(`RC57.10.68 archive: ${archiveChecked}/${map.items.length} hash-verified copies; ${duplicates} old paths; ${removed} removed`);
if (conflicts) {console.error(`BLOCKED: ${conflicts} conflicts; no modified documents were deleted`);process.exitCode=1;}
else if (duplicates && !apply) {
 console.log('Before release verification run: npm run migrate:rc571068 (only after overlaying the RC67 update).');
 process.exitCode=1;
} else console.log('PASS: archive migration and preservation');
