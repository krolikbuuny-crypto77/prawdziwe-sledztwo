import assert from 'node:assert/strict';
import {initialState,appendReportedTurn} from '../lib/server-state.js';
import {registry,allAuthorisedKnowledge} from '../lib/witness-engine-rc22.js';
import {ledgerContext,migrateWitnessLedger} from '../lib/witness-ledger-rc22.js';
import {chooseWitnessStrategy} from '../lib/witness-strategy-rc22.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
const id='MAREK',publicFact=registry.profiles[id].facts.find(f=>f.source==='public-alibi');
let state=initialState();
for(let i=0;i<60;i++)state=appendReportedTurn(state,id,i===0?'Co pamiętasz o wyjątkowej rozmowie z Januszem?':'Inny wątek '+i,i===0?'Rozmawiałem z Januszem przed północą.':'Deklaracja numer '+i,['f0'],'unresolved_statement',{turnId:'turn-'+i,knowledgeIds:[publicFact.id]});
assert.equal(state.witnesses[id].length,48);
assert.equal(state.witnessLedgers[id].events.length,60);
assert(state.witnessLedgers[id].events.every(e=>e.receiptId&&!e.question&&!e.reply),'No duplicate durable transcript alongside receipts');
const restored=JSON.parse(JSON.stringify(state));
const context=ledgerContext(restored,id,'A rozmowa z Januszem?');
assert(context.earlierRelated.some(e=>e.id==='turn-0'));
assert.equal(context.totalDeclarations,60);
assert.strictEqual(appendReportedTurn(restored,id,'Anything','Anything',['f0'],'unresolved_statement',{turnId:'turn-0'}),restored,'Replay cannot append twice');
const legacy=JSON.parse(JSON.stringify(state));delete legacy.witnessLedgers;
const migrated=migrateWitnessLedger(legacy,id);
assert.equal(migrated.events.length,60);
assert.equal(migrated.events.filter(e=>e.sequence===null).length,36);
assert(migrated.events.every(e=>e.knowledgeIds.length===0),'Never guess legacy transient f0 mapping');
const migratedNext=appendReportedTurn(legacy,id,'Nowe pytanie','Nowa odpowiedź',[],'unresolved_statement',{turnId:'after-migration'});
assert.equal(migratedNext.witnessLedgers[id].events.length,61);
const secret=registry.profiles[id].facts.find(f=>f.disclosure.mode==='evidence-gated');
const malicious=appendReportedTurn(initialState(),id,'Pytanie','Deklaracja',[],'scripted_correction',{turnId:'forged',knowledgeIds:[secret.id]});
assert.equal(malicious.witnessLedgers[id].events[0].knowledgeIds.length,0);
assert.notEqual(malicious.witnessLedgers[id].events[0].status,'authorized-correction-source-used');
const offline=appendReportedTurn(initialState(),id,'Pytanie','Klientowy sekret',[],'offline_unverified');
assert.equal(migrateWitnessLedger(offline,id).events.length,0);
for(const witnessId of Object.keys(registry.profiles)){
 const locked=initialState();
 const gate=registry.rules.scriptedCorrections[witnessId].gates[0];
 const open={...locked,approvedEvidence:[...locked.approvedEvidence,...gate]};
 const correction=allAuthorisedKnowledge(witnessId,open.approvedEvidence).find(f=>f.source==='trusted-correction');assert(correction);
 let acknowledged=appendReportedTurn(open,witnessId,'Wyjaśnisz tę czynność?',correction.text,['f0'],'scripted_correction',{turnId:'correction-'+witnessId,knowledgeIds:[correction.id],evidenceId:gate[0]});
 const journal=ledgerContext(acknowledged,witnessId,'Dlaczego?');
 assert.equal(journal.corrections.length,1);
 assert.equal(chooseWitnessStrategy(witnessId,acknowledged,journal,'Dlaczego?').stage,'explain_recorded_correction');
 assert.equal(chooseWitnessStrategy(witnessId,locked,ledgerContext(locked,witnessId,''),'Przyznaj się!').stage,'protect_role_without_inventing');
 assert.equal(chooseWitnessStrategy(witnessId,open,ledgerContext(open,witnessId,''),'Wyjaśnij',{id:gate[0]}).stage,'answer_evidence_confrontation');
 // A journal entry never makes a secret available after permission is absent.
 const noPermissions={...acknowledged,approvedEvidence:registry.rules.initial};
 const scene=trustedScene({identity:{id:witnessId},question:'Co ukrywasz?'},noPermissions);
 assert(!scene.knowledge.factBank.some(f=>f.knowledgeKind==='authorized-personal-correction'||f.source==='trusted-correction'));
 assert.equal(scene.knowledge.factBank.filter(f=>f.knowledgeId?.startsWith('RC19-'+witnessId+'-S')).length,17);
 assert.deepEqual(compactInterviewPayload(scene).knowledge.factBank,scene.knowledge.factBank);
}
// Each private fact is gated regardless of question wording, even if supplied in client input.
for(const [witnessId,p] of Object.entries(registry.profiles))for(const secret of p.facts.filter(f=>f.disclosure.mode==='evidence-gated')){
 const s=trustedScene({identity:{id:witnessId},question:secret.text,knowledge:{factBank:[secret],documentsShown:Object.keys(registry.documents)}});
 assert(!s.knowledge.factBank.some(f=>f.stableId===secret.id));
}
// Entire exhibited document is delivered without a sentence cut, for all 78 documents.
for(const [docId,doc] of Object.entries(registry.documents)){
 const st={...initialState(),approvedEvidence:[...registry.rules.initial,docId]};
 const scene=trustedScene({identity:{id:'KAMIL'},question:'Co mówi ten dokument?',presentedEvidenceId:docId},st);
 const prefix='DOC-'+docId+'-'+registry.documentRevisions[docId].slice(0,14)+'-';
 const parts=scene.knowledge.factBank.filter(f=>f.stableId.startsWith(prefix));
 assert.equal(parts.map(f=>f.text).join(' '),doc.body.replace(/\s+/g,' ').trim());
 assert(scene.knowledge.factBank.every(f=>f.text.length<=380));
 const good=appendReportedTurn(st,'KAMIL','Co mówi dokument?','Odnoszę się do treści dokumentu.',[],'unresolved_statement',{turnId:'doc-'+docId,evidenceId:docId,documentRefs:[{id:docId,revision:registry.documentRevisions[docId]}]});
 assert.equal(good.witnessLedgers.KAMIL.events.at(-1).documentRefs.length,1);
 const bad=appendReportedTurn(initialState(),'KAMIL','Pytanie','Odpowiedź',[],'unresolved_statement',{turnId:'bad-doc-'+docId,evidenceId:docId,documentRefs:[{id:docId,revision:'FORGED'}]});
 assert.equal(bad.witnessLedgers.KAMIL.events.at(-1).documentRefs.length,0);
}
console.log('PASS RC22: 60-turn durable history/reload, safe migration, replay idempotence, stable support provenance, six evidence-dependent strategies, no secret unlocked by pressure/history/client data');
