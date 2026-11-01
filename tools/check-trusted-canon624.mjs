import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../src/data/case-content.js',import.meta.url));
const canon=JSON.parse(fs.readFileSync(new URL('../lib/trusted-witness-canon-624.json',import.meta.url),'utf8'));
assert.equal(canon.sourceSha256,crypto.createHash('sha256').update(src).digest('hex'),'Trusted server canon stale — run npm run generate:canon');
assert.equal(Object.keys(canon.profiles).length,6);assert.equal(Object.keys(canon.documents).length,78);
console.log('PASS server-authored witness canon matches exact case-content.js fingerprint');
