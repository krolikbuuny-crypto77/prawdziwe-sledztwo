import assert from 'node:assert/strict';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {authoredKnowledge,selectWitnessKnowledge} from '../lib/witness-knowledge-rc18.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {attemptInterview} from '../api/interview.js';
import rules from '../lib/approved-rules.js';
import bank from '../lib/interview-question-bank-rc17.json' with {type:'json'};
assert.equal(Object.keys(authoredKnowledge.profiles).length,6);
assert.equal(Object.values(authoredKnowledge.profiles).flat().length,90);
assert.equal(authoredKnowledge.shared.length,13);
const bySource=new Map([...Object.values(authoredKnowledge.profiles).flat(),...authoredKnowledge.shared].map(r=>['authored-'+r.id,r]));
for(const row of bySource.values()){
 assert(row.text.length<380,'Do not truncate authored fact');
 assert.equal(row.visibility,'public');
 assert(!/00:39|Magdalenie|nie wysłałam|korektę wykonano/.test(row.text),'No gated confession in public extension');
}
let pairs=0,enriched=0,maxFacts=0;
for(const id of Object.keys(authoredKnowledge.profiles))for(const row of bank.cases){
 const s=trustedScene({identity:{id},question:row.question,knowledge:{documentsShown:['EVID_CCTV_SYNC']},extraKnowledge:'CLIENT_SECRET'});
 const facts=s.knowledge.factBank;
 assert(facts.length<=64);
 maxFacts=Math.max(maxFacts,facts.length);
 assert(!facts.some(f=>f.source.startsWith('document-')||f.source==='trusted-correction'));
 assert(!JSON.stringify(s.knowledge).includes('CLIENT_SECRET'));
 assert(!JSON.stringify(s.witnessDossier).includes('CLIENT_SECRET'));
 const extension=facts.filter(f=>f.source.startsWith('authored-'));
 assert(extension.length<=8);
 for(const f of extension){
  const original=bySource.get(f.source);assert(original);assert.equal(f.text,original.text);
  assert(f.source.startsWith('authored-'+id+'-')||f.source.startsWith('authored-COMMON-'));
  assert.equal(f.knowledgeKind,original.kind);
 }
 if(extension.length)enriched++;
 assert.deepEqual(compactInterviewPayload(s).knowledge.factBank,facts);
 pairs++;
}
// All gated corrections stay locked until their authored evidence combination is met.
for(const id of Object.keys(authoredKnowledge.profiles)){
 for(const gate of rules.scriptedCorrections[id].gates){
  const locked=trustedScene({identity:{id},question:'Czy masz coś do ukrycia?'},{approvedEvidence:rules.initial});
  assert(!locked.knowledge.factBank.some(f=>f.source==='trusted-correction'));
  const unlocked=trustedScene({identity:{id},question:'Czy masz coś do ukrycia?'},{approvedEvidence:[...rules.initial,...gate]});
  assert(unlocked.knowledge.factBank.some(f=>f.source==='trusted-correction'));
 }
}
// Every exhibited document remains available after enrichment, with ownership required.
const canon=(await import('../lib/trusted-witness-canon-624.json',{with:{type:'json'}})).default;
for(const id of Object.keys(authoredKnowledge.profiles))for(const documentId of Object.keys(canon.documents)){
 const scene=trustedScene({identity:{id},question:'Co potwierdza ten dokument i skąd to wiesz?',presentedEvidenceId:documentId}, {approvedEvidence:[...rules.initial,documentId]});
 assert(scene.presentedEvidence?.id===documentId);
 assert(scene.knowledge.factBank.some(f=>f.source==='document-'+documentId));
 assert(scene.knowledge.factBank.length<=64);
}
// Routing to actual generation entry, with controlled output: not a live model quality score.
for(const [id,q,source] of [
 ['KAMIL','Co oznacza log TCMS?','authored-KAMIL-02'],
 ['JANUSZ','Czy kod błędu oznacza przyczynę usterki?','authored-JANUSZ-05'],
 ['ELZBIETA','Czy projekt potwierdza wysłanie zgłoszenia?','authored-ELZBIETA-06'],
 ['MAGDALENA','Co potwierdza faktura za części?','authored-MAGDALENA-05']
]){
 const s=trustedScene({identity:{id},question:q});s.questionParts=[];
 const f=s.knowledge.factBank.find(f=>f.source===source);assert(f,source);
 const result=await attemptInterview(s,'groq',async(system,payload,a,b,c,phase)=>{
  if(phase==='generate'){
   assert(payload.knowledge.factBank.some(x=>x.id===f.id&&x.text===f.text));
   assert(system.includes('general-principle'));
   return {decision:'answer',factIds:[f.id],text:f.text};
  }
  if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:false};
  throw Error('Unexpected phase '+phase);
 });
 assert(result?.ok,source);
}
assert.deepEqual(selectWitnessKnowledge('UNKNOWN','telefon'),[]);
console.log(JSON.stringify({result:'PASS RC18',authoredEntries:103,pairs,enriched,maxFacts,liveAPI:'not_run'}));
