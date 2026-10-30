import assert from 'node:assert/strict';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {attemptInterview} from '../api/interview.js';
const IDS=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const variants=[
 'Co łączyło cię z tą kobietą?',
 'Jakie były wasze stosunki przed tragedią?',
 'Powiedz mi o niej i o waszych rozmowach.',
 'A co ona dla ciebie znaczyła?',
 'Nie chcę pytać o jej ostatnią godzinę, tylko jak ją znałeś.',
 'Czy dobrze się z nią dogadywałeś?'
];
for(const id of IDS){
 for(const question of variants){
  const scene=trustedScene({identity:{id},question,knowledge:{documentsShown:[]}},null);
  assert.equal(scene.identity.id,id);
  assert(scene.knowledge.factBank.some(f=>f.source==='public-compassion'),`${id}: publicly known relationship inaccessible for '${question}'`);
  assert(scene.knowledge.factBank.some(f=>f.source==='public-alibi'),`${id}: publicly known alibi inaccessible for '${question}'`);
  assert(!scene.knowledge.factBank.some(f=>f.text.includes('PRZEMYCONY')));
  assert(!scene.knowledge.factBank.some(f=>f.source==='public-evidence_strong'),`gated strong confession leaked: ${id}`);
 }
}
const q='Co właściwie was łączyło?'; // lexical parser can return another topic; AI is responsible
const scene=trustedScene({identity:{id:'MAREK'},question:q,knowledge:{documentsShown:[]}},null);
Object.assign(scene,buildQuestionContext(q,[]));
scene.memory.conversation=[];scene.dialogueMemory={previousPairs:[],openQuestions:[],corrections:[],earlierRelated:[]};
scene.questionPlan={primary:'alarm_report',intents:['alarm_report'],positiveQuestion:'Kto wezwał pomoc?'};
scene.questionParts=[];
const selected=scene.knowledge.factBank.find(f=>f.source==='trusted-relationship');
assert(selected);
const calls=[];
const result=await attemptInterview(scene,'zai',async(_system,payload,_tokens,_temperature,provider,phase)=>{
 calls.push({provider,phase,payload});
 assert.equal(payload.question,q,'Original Polish wording must be forwarded unchanged');
 assert.equal(payload.questionPlan,undefined,'Wrong lexical interpretation must not enter AI context');
 assert.equal(payload.questionParts,undefined);
 assert(payload.knowledge.factBank.some(f=>f.id===selected.id));
 assert(!payload.knowledge.factBank.some(f=>f.source==='trusted-correction'));
 if(phase==='generate')return {decision:'answer',understanding:{referent:'Lena',requestedInformation:'relacja Marka z Leną'},factIds:[selected.id],text:selected.text};
 return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:false,reason:'Relacja Marka z Leną'};
});
assert.equal(result?.ok,true);
assert.equal(result.text,selected.text);
assert.deepEqual(calls.map(c=>c.phase),['generate'],'literal grounded testimony should need one AI call');

// A paraphrase must still pass independent semantic auditing, not trust the AI's self-report.
let auditCalls=[];
const short='Lena była pracownicą zajezdni. Mieliśmy różnice zdań, ale ją szanowałem.';
const revised=await attemptInterview(scene,'groq',async(_system,payload,_tokens,_temperature,provider,phase)=>{
 auditCalls.push(phase);
 assert.equal(payload.questionPlan,undefined);
 if(phase==='generate')return {decision:'answer',understanding:{referent:'Lena',requestedInformation:'stosunek Marka do Leny'},factIds:[selected.id],text:short};
 if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:false};
 throw Error('unexpected model call '+phase);
});
assert.equal(revised?.ok,true);
assert.deepEqual(auditCalls,['generate','semantic-audit']);

// Unconfirmed evidence is never opened by extending the witness's public fact set.
const unconfirmed=trustedScene({identity:{id:'MAREK'},question:'Co widać na VIS-02?',presentedEvidenceId:'VIS-02',knowledge:{documentsShown:['VIS-02']}},null);
assert.equal(unconfirmed.presentedEvidence,null);
assert(!unconfirmed.knowledge.factBank.some(f=>f.source==='document-VIS-02'));
console.log(`PASS AI-primary understanding: ${IDS.length} witnesses x ${variants.length} phrasings; no lexical plan in provider prompts; full safe fact-bank; independent audit; hidden evidence guarded`);
