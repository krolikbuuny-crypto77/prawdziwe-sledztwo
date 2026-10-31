import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {buildDialogueMemory} from '../lib/dialogue-memory-636.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {attemptInterview} from '../api/interview.js';
import {reviewInterviewReply} from '../lib/interview-quality-635.js';
const data=JSON.parse(readFileSync(new URL('./fixtures/interview-questions-rc16.json',import.meta.url)));
assert.equal(data.cases.length,100);assert.equal(new Set(data.cases.map(c=>c.question)).size,100);
const groups=new Map();
for(const c of data.cases){
 groups.set(c.category,(groups.get(c.category)||0)+1);
 assert(c.rubric.mustAddress&&c.rubric.mustNot.length>=2);
 assert.equal(c.liveResult.status,'not_run');
 const context=buildQuestionContext(c.question,c.approvedHistory);
 const scene=trustedScene({identity:{id:c.witnessId},question:c.question,knowledge:{documentsShown:[]}},null,context);
 Object.assign(scene,context);
 scene.memory.conversation=c.approvedHistory.map(r=>({role:r.role==='player'?'śledczy':'świadek',text:r.text}));
 scene.dialogueMemory=buildDialogueMemory(c.approvedHistory,c.question);
 for(const source of c.requiredPublicSources)assert(scene.knowledge.factBank.some(f=>f.source===source),c.id+': missing '+source);
 assert(!scene.knowledge.factBank.some(f=>f.source==='trusted-correction'||f.source==='public-evidence_strong'));
 const packed=compactInterviewPayload(scene);
 assert.deepEqual(packed.knowledge.factBank,scene.knowledge.factBank);
 assert.deepEqual(packed.memory.conversation,scene.memory.conversation);
 let calls=0;
 // A deliberate refusal checks routing only. It is NOT a simulated quality score.
 const result=await attemptInterview(scene,'groq',async(_system,payload)=>{
  calls++;assert.equal(payload.question,c.question);
  assert.equal(payload.questionPlan,undefined);assert.equal(payload.questionParts,undefined);
  assert.deepEqual(payload.memory.conversation,scene.memory.conversation);
  assert.deepEqual(payload.allowedFactIds,scene.knowledge.factBank.map(f=>f.id));
  return {decision:'fallback'};
 });
 assert.equal(calls,1);assert.equal(result,null);
}
assert.equal(groups.size,10);assert([...groups.values()].every(n=>n===10));
const scene=trustedScene({identity:{id:'MAREK'},question:'Kto zgłaszał zastrzeżenia?',knowledge:{documentsShown:[]}},null);
scene.memory.conversation=[];
const selected=[scene.knowledge.factBank.find(f=>f.source==='trusted-relationship')];
for(const answer of ['To Lena zgłaszała zastrzeżenia do bezpieczeństwa wagonu. Nie zgłaszałem jej zastrzeżeń.',
 'Nie zgłaszałem Lenie zastrzeżeń, to ona zgłaszała problem.'])
 assert(reviewInterviewReply(scene,answer,selected).ok,answer);
assert.equal(reviewInterviewReply(scene,'Zgłaszałem Lenie zastrzeżenia do bezpieczeństwa wagonu.',selected).reason,'relationship_actor_reversed');
assert.equal(reviewInterviewReply(scene,'Nie zgłaszałem ich wcześniej, ale zgłaszałem jej zastrzeżenia do wagonu.',selected).reason,'relationship_actor_reversed');
console.log('PASS RC16: 100 unique cases / 10 categories; approved public sources, original questions and history reach model; no synthetic language score; positive/negative actor regressions pass');
