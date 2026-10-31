import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {registry,allAuthorisedKnowledge} from '../lib/witness-engine-rc22.js';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const [file,expected] of Object.entries(registry.sourceHashes))assert.equal(hash(fs.readFileSync(new URL('../'+file,import.meta.url))),expected,'Registry stale: '+file+'; run npm run build:witness-registry');
const all=new Set();
for(const [id,p] of Object.entries(registry.profiles)){
 for(const fact of p.facts){
  assert(!all.has(fact.id));all.add(fact.id);assert(fact.text.length<=380);
  if(fact.disclosure.mode==='evidence-gated'){
   assert(fact.disclosure.anyOf.length>0);
   for(const gate of fact.disclosure.anyOf)for(const doc of gate)assert(registry.documents[doc]);
   assert(!allAuthorisedKnowledge(id,registry.rules.initial).some(f=>f.id===fact.id));
  }
 }
 for(const excerpt of p.coveredExcerpts)assert(p.facts.some(f=>f.id===excerpt.coveredBy&&f.text.includes(excerpt.text)));
}
assert.equal(Object.keys(registry.documents).length,78);
assert.equal(Object.keys(registry.profiles).length,6);
console.log('PASS RC22 registry: immutable provenance, stable IDs, disclosure gates, 78 documents, covered excerpts retained in full source');
