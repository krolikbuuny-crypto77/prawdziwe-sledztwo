import assert from 'node:assert/strict';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {buildDialogueMemory} from '../lib/dialogue-memory-636.js';
import {normalizeWitnessSpeech} from '../lib/spoken-dialogue-623.js';
import {attemptInterview} from '../api/interview.js';

assert.equal(normalizeWitnessSpeech('Nadzorowałem zmianę; nie siedziałem tam bez przerwy, co potwierdza rejestr.'),
 'Nadzorowałem zmianę. Nie siedziałem tam bez przerwy, co potwierdza rejestr.');
assert.equal(normalizeWitnessSpeech('Pytał o godz. np. 2:02; to nie dowodzi obecności.'),'Pytał o godz. np. 2:02. To nie dowodzi obecności.');
const prior=[{role:'player',text:'Jakie masz alibi?'},{role:'witness',text:'Nadzorowałem nocną zmianę i byłem dostępny z biura; nie siedziałem tam bez przerwy, co potwierdza rejestr wejść.',narrativeStatus:'reported_statement'}];
for(const question of ['Kto to może potwierdzić?','A kto może to poświadczyć?','Czy ktoś cię wtedy widział?']){
 const context=buildQuestionContext(question,prior);
 assert.equal(context.dialogueFocus?.previousQuestion,'Jakie masz alibi?',question);
 const scene=trustedScene({identity:{id:'MAREK'},question,knowledge:{documentsShown:[]}},null,context);
 Object.assign(scene,context);
 scene.memory.conversation=prior.map(x=>({role:x.role==='player'?'śledczy':'świadek',text:x.text}));
 scene.dialogueMemory=buildDialogueMemory(prior,question);
 const scoped=scene.knowledge.factBank.find(f=>f.source==='trusted-corroboration'&&/osoby, która obserwowała/.test(f.text));
 assert(scoped);
 const output='Nie wskażę osoby, która obserwowała mnie przez całą noc; połączenia służbowe potwierdzą kontakt, a rejestr wejść tylko część przemieszczania.';
 const calls=[];
 const res=await attemptInterview(scene,'zai',async(system,payload,_,__,provider,phase)=>{
  calls.push(phase);
  assert.equal(provider,'zai');
  assert.equal(payload.question,question);
  assert.equal(payload.questionPlan,undefined);
  assert.equal(payload.dialogueFocus.previousQuestion,'Jakie masz alibi?');
  if(phase==='generate')return {decision:'answer',factIds:[scoped.id],text:output};
  if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[]};
  throw Error('Unexpected model phase '+phase);
 });
 assert(res?.ok,JSON.stringify(res));
 assert(!res.text.includes(';'));
 assert.match(res.text,/całą noc\. Połączenia służbowe potwierdzą kontakt/);
 assert.deepEqual(calls,['generate','semantic-audit']);
}
console.log('PASS RC4: natural punctuation, 3 alibi corroboration follow-ups interpreted by AI, verified first-party evidence, semantic audit');
