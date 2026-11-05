import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const rel=(s)=>path.join(root,s);
const read=(p)=>fs.readFileSync(rel(p),'utf8');
const sha=(p)=>crypto.createHash('sha256').update(fs.readFileSync(rel(p))).digest('hex');
const failures=[];
const requireFile=(p)=>{if(!fs.existsSync(rel(p)))failures.push(`Missing required file: ${p}`);};
for(const p of [
  'README.md','INSTRUKCJA-GLOWNA.md','GITHUB-WGRYWANIE.md',
  'docs/ARCHITEKTURA-AKTUALNA.md','docs/TESTY-AKTUALNE.md','docs/HISTORIA-WYDAN.md',
  'docs/historia/ARCHIVE_MAP_RC57_10_68.json','vercel.json','package.json',
  'src/build-manifest.json','index.html','api/interview.js','lib/witness-humanity-v3.js',
  'tools/migrate-rc571068.mjs','PROJECT_RELEASE.json','RAPORT-QA-RC57_10_68.md',
  'INSTRUKCJA-RC57_10_68.md'
]) requireFile(p);
if (failures.length) {
 for (const message of failures) console.error('FAIL:',message);
 process.exit(1);
}
const release=JSON.parse(read('PROJECT_RELEASE.json'));
const pkg=JSON.parse(read('package.json'));
const archive=JSON.parse(read('docs/historia/ARCHIVE_MAP_RC57_10_68.json'));
if(release.release!=='RC57.10.68'||release.base!=='RC57.10.67') failures.push('Wrong release metadata');
if(archive.release!==release.release||archive.base!==release.base) failures.push('Archive migration base is incorrect');
for(const cmd of ['build','check','project:doctor','test:current','test:humanity-v3','test:rc58','test:saves','test:navigation','migrate:rc571068'])
  if(!pkg.scripts[cmd])failures.push(`Missing npm command ${cmd}`);
for (const doc of ['README.md','INSTRUKCJA-GLOWNA.md','GITHUB-WGRYWANIE.md']) {
  if(!read(doc).includes(release.release))failures.push(`${doc} does not point to current release`);
}
const mandatoryClientFiles=Object.entries(release.clientAssets);
for(const [name,digest] of mandatoryClientFiles){
  if(!fs.existsSync(rel(name))||sha(name)!==digest)failures.push(`Client artifact changed unexpectedly: ${name}`);
}
let checked=0;
for(const entry of archive.items){
  if(!fs.existsSync(rel(entry.after))||sha(entry.after)!==entry.sha256){
    failures.push(`Missing or changed archive: ${entry.after}`);continue;
  }
  checked++;
  if(!entry.copyOnly && fs.existsSync(rel(entry.before)))failures.push(`Duplicate legacy document still in root: ${entry.before}`);
}
const index=read('docs/HISTORIA-WYDAN.md');
for(const entry of archive.items){
  if(!index.includes(`<${entry.after.slice('docs/'.length)}>`)) failures.push(`Document absent from history index: ${entry.after}`);
}
let linkCount=0;
for(const doc of ['README.md','INSTRUKCJA-GLOWNA.md','GITHUB-WGRYWANIE.md','docs/ARCHITEKTURA-AKTUALNA.md','docs/TESTY-AKTUALNE.md','docs/HISTORIA-WYDAN.md']){
  const raw=read(doc);
  for(const match of raw.matchAll(/\[[^\]]+\]\((?:<([^>]+)>|([^\s)]+))\)/g)){
    let url=match[1]||match[2];
    if(/^https?:|^#|^mailto:/.test(url))continue;
    url=url.split('#')[0];
    const candidate=path.resolve(path.dirname(rel(doc)),url);
    if(!candidate.startsWith(root+path.sep)||!fs.existsSync(candidate))failures.push(`Broken link: ${doc}: ${url}`);
    else linkCount++;
  }
}
const config=JSON.parse(read('vercel.json'));
const blocked=config.routes.filter(x=>x.status===404).map(x=>new RegExp(x.src));
const denied=(url)=>blocked.some(x=>x.test(url));
const privatePaths=['/lib/witness-humanity-v3.js','/src/build-manifest.json','/tools/project-doctor.mjs',
 '/story-bible/canon.json','/docs/HISTORIA-WYDAN.md','/supabase/database.sql',
 '/QA-RC571066/artifact.png','/qa69/run.json','/qa69-baseline/check.txt','/TEST-6.14/test.txt',
 '/README.md','/INSTRUKCJA-GLOWNA.md','/PROJECT_RELEASE.json','/ASSET_MANIFEST.json','/RAPORT-QA-RC57_10_68.md'];
const publicPaths=['/','/index.html','/api/interview','/api/evaluate','/api/status','/assets/ui/portrait.webp',
 ...mandatoryClientFiles.map(([name])=>'/'+name)];
for(const url of privatePaths)if(!denied(url))failures.push(`Unprotected private route: ${url}`);
for(const url of publicPaths)if(denied(url))failures.push(`Public route blocked: ${url}`);
const result={release:release.release,archived:checked,links:linkCount,privateRouteChecks:privatePaths.length,
 publicRouteChecks:publicPaths.length,clientAssets:mandatoryClientFiles.length,failed:failures.length,failures};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
else {
 console.log(`RC57.10.68 project doctor: ${checked} archived docs, ${linkCount} working links, ${privatePaths.length} protected and ${publicPaths.length} public route checks, ${mandatoryClientFiles.length} client artifacts`);
 for(const message of failures) console.error('FAIL:',message);
 console.log(failures.length?'FAIL: project structure':'PASS: project structure, release pointers, archives, link paths and routing guards');
}
if(failures.length)process.exit(1);
