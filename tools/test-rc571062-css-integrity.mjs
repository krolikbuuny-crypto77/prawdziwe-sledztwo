import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {buildPage} from './build.mjs';
import {stripCssComments} from './strip-css-comments.mjs';
import {checkCaseEngineSync} from './sync-case-engine.mjs';
const root=path.resolve(import.meta.dirname,'..');
const evidence=JSON.parse(fs.readFileSync(path.join(root,'QA-RC571062/removed-duplicate-rules.json'),'utf8'));
const source=fs.readFileSync(path.join(root,evidence.sourceFile),'utf8');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
assert.equal(hash(source),evidence.newSha256,'Changed CSS source differs from reviewed patch');
assert.equal(evidence.rules.length,30,'Expected reviewed number of duplicate rules');
let original=source;
for(const item of evidence.rules){
  assert.ok(Number.isInteger(item.start)&&item.start>=0);
  assert.ok(item.end>item.start&&item.end-item.start===item.text.length);
  // Positions in the original version; reconstruct in monotonic order.
  const pos=item.start;
  assert.ok(pos>=0&&pos<=original.length,'Invalid insertion offset');
  original=original.slice(0,pos)+item.text+original.slice(pos);
}
assert.equal(hash(original),evidence.oldSha256,'Original CSS must be exactly reconstructable from the patch');
assert.equal(Buffer.byteLength(original),evidence.oldBytes);
assert.equal(Buffer.byteLength(source),evidence.newBytes);
assert.equal(evidence.importantRemoved,33);
assert.equal((original.match(/!important\b/gi)||[]).length-(source.match(/!important\b/gi)||[]).length,33);
const {externalFiles}=buildPage();
const css=externalFiles.find(e=>e.kind==='style');
const deliveredSource = stripCssComments(source);
assert.ok(css?.content.includes(deliveredSource),'Reviewed source must be present in bundled CSS after safe delivery optimization');
assert.equal(css.content.split(deliveredSource).length,2,'Expected the changed source exactly once');
assert.equal(checkCaseEngineSync().parts,8);
// Later releases may change script 60 independently of this historical CSS audit.
// Keep its content-hashed bundle verified while pinning the unchanged core script.
const external=buildPage().externalFiles;
const runtime=external.find(a=>a.filename.startsWith('ps-js-60-'));
assert.ok(runtime);
assert.equal(hash(runtime.content).slice(0,16),runtime.filename.match(/^ps-js-60-([a-f0-9]{16})\.js$/)?.[1]);
assert.equal(fs.readFileSync(path.join(root,runtime.filename),'utf8'),runtime.content);
assert.equal(hash(fs.readFileSync(path.join(root,'ps-js-00-e004ce923f722887.js'),'utf8')),
 'e004ce923f722887d6ef73f1dd291567663cfbc9a01c604cc542d5d98eab3cab');
console.log('RC57.10.62 CSS cleanup: 30 exact duplicate rules removed / 33 !important removed; old CSS reconstructed byte-exact; core JS and engine unchanged; companion script integrity verified — PASS');
