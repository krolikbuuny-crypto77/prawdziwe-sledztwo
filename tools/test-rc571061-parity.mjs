import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {checkCaseEngineSync} from './sync-case-engine.mjs';
import {buildPage} from './build.mjs';
const root=path.resolve(import.meta.dirname,'..');
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
// RC57.10.66: later releases deliberately modify the reviewed core.
// Verify current authoring-manifest parity instead of obsolete RC57.10.61 bytes.
const core=checkCaseEngineSync();
assert.equal(digest('src/core/case-engine.js'),core.sha256,'Current core source digest');
assert.equal(core.parts,8,'Eight reviewed authoring segments');
const {externalFiles}=buildPage();
for(const a of externalFiles){
 assert.equal(digest(a.filename),crypto.createHash('sha256').update(a.content).digest('hex'));
}
const info=checkCaseEngineSync();
assert.equal(info.parts,8);
console.log('Architecture regression: 8 reviewed parts, current source digest and hashed runtime — PASS');
