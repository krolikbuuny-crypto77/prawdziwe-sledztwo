import assert from 'node:assert/strict';
import fs from 'node:fs';
import canon from '../lib/trusted-witness-canon-624.json' with {type:'json'};
import {verifiedExhibit,listExhibitRegistry,exhibitType} from '../lib/exhibit-context-636.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {verifyEvidenceSources,normalizeEvidenceRequest} from '../api/evidence-review.js';
import {initialState} from '../lib/server-state.js';

const ids=listExhibitRegistry();
assert.equal(ids.length,78,'All 78 playable documents must be server-owned');
for(const id of ids){
 const doc=canon.documents[id];
 const owned={...initialState(),approvedEvidence:[id]};
 const ex=verifiedExhibit(id,owned);
 assert.equal(ex.id,id);assert.equal(ex.title,doc.title);assert(ex.summary.length>30);
 assert.equal(ex.family,doc.family);assert.equal(ex.type,exhibitType(id,doc.title));
 assert.equal(verifiedExhibit(id,{...owned,approvedEvidence:[]}),null);
 const scene=trustedScene({identity:{id:'MAREK'},question:'Co wynika z tego materiału?',presentedEvidenceId:id,
   knowledge:{documentsShown:[id],currentGroundedAnswer:'FAŁSZ Z PRZEGLĄDARKI'}},owned);
 assert.equal(scene.presentedEvidence.id,id);
 assert.equal(scene.presentedEvidence.type,ex.type);
 assert(!JSON.stringify(scene.knowledge).includes('FAŁSZ Z PRZEGLĄDARKI'));
 assert(scene.knowledge.factBank.some(f=>f.source==='document-'+id));
 const missing=trustedScene({identity:{id:'MAREK'},question:'Co wynika?',presentedEvidenceId:id,
   knowledge:{documentsShown:[id]}},{...owned,approvedEvidence:[]});
 assert.equal(missing.presentedEvidence,null);
 const normalized=normalizeEvidenceRequest({statement:'Proszę porównać fragmenty akt',links:[{
  id:'doc:'+id,name:'PODROBIONA NAZWA',body:'PODROBIONA TREŚĆ',role:'supports'}]});
 const safe=verifyEvidenceSources(normalized,owned);
 assert(safe&&safe.links[0].name.includes(doc.title));
 assert(!JSON.stringify(safe).includes('PODROBIONA'));
 assert.equal(verifyEvidenceSources(normalized,{...owned,approvedEvidence:[]}),null);
}
assert.equal(verifiedExhibit('__proto__',{approvedEvidence:['__proto__']}),null);
const sync=fs.readFileSync(new URL('../src/integrations/75-verified-state-sync.js',import.meta.url),'utf8');
const cloud=fs.readFileSync(new URL('../src/integrations/35-zai-client.js',import.meta.url),'utf8');
const review=fs.readFileSync(new URL('../src/integrations/53-vercel-ai-client.js',import.meta.url),'utf8');
assert(sync.includes('async function ensureEvidence('));
assert(sync.includes('approvedEvidence=new Set(data.state?.approvedEvidence||[])'));
assert(sync.includes('return approvedEvidence.has(id)'));
assert(cloud.includes('window.PS617_SYNC.ensureEvidence(attached,3000)'));
assert(cloud.includes('Dowód oczekuje na zatwierdzenie przez serwer. Ponów pytanie.'));
assert(cloud.includes('discardUnanswered')); // No persisted local testimony on missing server confirmation.
assert(review.includes('LOKALNY AUDYT WARSZTATU'));
assert(review.includes('Warunki formalne zostały spełnione.'));
assert(review.includes('ANALIZA AI ŹRÓDEŁ'));
console.log('PASS 6.36-II: all 78 exact server-owned exhibits, strict ownership, spoofed descriptions discarded, evidence-review source authority, sync handshake and dual-axis deduction labels');
