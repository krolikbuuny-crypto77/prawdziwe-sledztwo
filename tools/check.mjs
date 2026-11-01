import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {buildPage} from './build.mjs';
const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/build-manifest.json'), 'utf8'));
const compiled = buildPage();
const deployed = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const failures = [];
if (compiled.html !== deployed) failures.push('Built index.html differs from src: run npm run build');
if (compiled.scripts.length !== 61 || compiled.styles.length !== 64) failures.push('Script/style source section count changed; review build manifest');
if ((compiled.html.match(/<style\b/g) || []).length !== 1) failures.push('Production HTML must contain exactly one combined style element');
for (const entry of manifest.sections.filter(x => x.kind === 'script')) {
  if (entry.index === 2 || entry.index === 27) continue; // JSON payload or empty hook
  const src = compiled.scripts[entry.index];
  const file = path.join(root, '.tmp-check-script.js');
  fs.writeFileSync(file, src);
  const check = spawnSync(process.execPath, ['--check', file], {encoding:'utf8'});
  fs.unlinkSync(file);
  if (check.status !== 0) failures.push(`JS ${entry.index} (${entry.name}): ${check.stderr.split('\n')[0]}`);
}
// Build manifest metadata must match the actual source after each refactor.
for (const entry of manifest.sections) {
  const data = entry.parts.map(part => fs.readFileSync(path.join(root, part), 'utf8')).join('');
  const digest = crypto.createHash('sha256').update(data).digest('hex');
  if (digest !== entry.sha256 || Buffer.byteLength(data) !== entry.size)
    failures.push(`Outdated manifest fingerprint: ${entry.kind} ${entry.index} (${entry.name})`);
}
const assets = JSON.parse(fs.readFileSync(path.join(root, 'ASSET_MANIFEST.json'), 'utf8')).assets;
let checkedImages=0,checkedAudio=0;
for (const asset of assets) {
  const filename = path.join(root,asset.asset.replace(/^\//,''));
  if (!fs.existsSync(filename)) {failures.push(`Missing asset: ${asset.asset}`); continue;}
  const buffer=fs.readFileSync(filename);
  const digest=crypto.createHash('sha256').update(buffer).digest('hex');
  if (digest !== asset.sha256) failures.push(`Wrong hash: ${asset.asset}`);
  if (asset.mime==='image/webp') checkedImages++;
  if (asset.mime==='audio/mpeg') checkedAudio++;
}
// Integration contracts must survive refactors. The API routes and storage hooks are public contracts.
const contracts=['/api/interview','/api/evaluate','buildSave','showTab'];
for (const term of contracts) if (!compiled.html.includes(term)) failures.push(`Missing integration: ${term}`);
console.log(`Validated: ${compiled.scripts.length} script sections, ${compiled.styles.length} CSS sections; ${checkedImages} WebP and ${checkedAudio} MP3 files`);
if (failures.length){for(const err of failures)console.error('FAIL:',err);process.exit(1);}
console.log('PASS: syntax, asset hashes, build reproducibility, integration hooks');
