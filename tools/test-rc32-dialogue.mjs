import assert from 'node:assert/strict';
import {classifyDialogueMove,dialogueDirection} from '../lib/dialogue-direction-rc32.js';
import {interviewWirePayload,interviewAnswerSystem,interviewAuditSystem} from '../lib/interview-naturalness-rc28.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {attemptInterview} from '../api/interview.js';

const cases=[
 ['Masz alibi?','alibi'],
 ['Kto może to potwierdzić?','corroboration'],
 ['Nie pytam o dokumenty. Gdzie dokładnie byłeś?','where'],
 ['Dlaczego wcześniej mi tego nie powiedziałeś?','late_disclosure'],
 ['Mam wrażenie, że coś przede mną ukrywasz.','suspicion'],
 ['Ukrywasz coś, czy zabiłeś Lenę?','crime_accusation'],
 ['Skąd masz taką informację?','general'],
 ['Dlaczego tak zrobiłeś?','why']
];
for (const [q,expected] of cases)assert.equal(classifyDialogueMove(q),expected,q);
assert.equal(classifyDialogueMove('Zabiłeś Lenę?',true),'shown_evidence');
const history=[
 {role:'player',text:'Masz alibi?'},
 {role:'witness',text:'Byłem w biurze, a rejestry to potwierdzają.',narrativeStatus:'unresolved_statement'},
 {role:'player',text:'Kto może to potwierdzić?'},
 {role:'witness',text:'Rejestr i połączenia można sprawdzić.',narrativeStatus:'unresolved_statement'}
];
let checks=0;
for(const id of ['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']){
 const scene=trustedScene({identity:{id},question:'Nie pytam o dokumenty. Gdzie dokładnie byłeś?',knowledge:{documentsShown:[]}},null);
 assert(scene,'witness scene '+id);
 scene.approvedThreadHistory=history;
 scene.spokenGuide='Zwięźle i naturalnie, bez ujawniania nowych zdarzeń.';
 scene.dialogueDynamics=dialogueDirection(scene);
 assert.equal(scene.dialogueDynamics.kind,'where');
 assert.match(scene.dialogueDynamics.avoidDefaultCaveat,/Nie powtarzaj/);
 assert(scene.dialogueDynamics.character.length>50);
 const wire=interviewWirePayload(scene);
 assert.equal(wire.dialogueDynamics.kind,'where');
 assert(!wire.dialogueDynamics.hasOwnProperty('factBank'));
 assert.equal(wire.dialogueDynamics.status,'interpretation-hint-not-fact');
 assert(interviewAnswerSystem.includes('NATURALNOŚĆ RC32'));
 assert(interviewAnswerSystem.includes('factBank'));
 assert(interviewAuditSystem.includes('entailed'));
 checks++;
}
const suspicion=dialogueDirection({identity:{id:'MAREK'},question:'Mam wrażenie, że coś przede mną ukrywasz',approvedThreadHistory:history});
assert.equal(suspicion.kind,'suspicion');
assert.match(suspicion.responseApproach,/NIE automatycznie zarzut zabójstwa/);
const fact='Nie mam alibi w sensie ciągłej obecności. Kierowałem nocną zmianą, ale wychodziłem służbowo i nie mogę potwierdzić każdej minuty.';
const scene=trustedScene({identity:{id:'MAREK'},question:'Masz alibi?',knowledge:{documentsShown:[]}},null);
scene.knowledge.factBank=[{id:'f0',text:fact,origin:'public',source:'test-fixture',certainty:'qualified'}];
scene.knowledge.currentGroundedAnswer=fact;
scene.memory={conversation:[],longTerm:[],turn:0};
scene.approvedThreadHistory=[];
scene.dialogueMemory={previousPairs:[],repeatRequested:false};
scene.questionParts=[];scene.dialogueFocus=null;
scene.spokenGuide='Zwięźle, jak człowiek.';
scene.deliveryGuide='Nie recytuj.';
scene.dialogueDynamics=dialogueDirection(scene);
const auditInput={question:'Coś ukrywasz?',questionParts:[],dialogueDynamics:suspicion,selectedFacts:[{text:fact}],proposedAnswer:fact};
assert.equal(interviewWirePayload(auditInput).dialogueDynamics.kind,'suspicion');
let phases=[];
const result=await attemptInterview(scene,'apinex-luna',async(_system,payload,_m,_t,_p,phase)=>{
 phases.push(phase);
 if(phase==='generate'){
  assert.equal(payload.dialogueDynamics.kind,'alibi');
  return {decision:'answer',factIds:['f0'],text:fact,emotion:'neutral'};
 }
 throw Error('Extra phase for style-only issue: '+phase);
});
assert.equal(result.text,fact);
assert.deepEqual(phases,['generate']);
console.log('PASS RC32: '+cases.length+' categories, '+checks+' witness profiles, approved transcript, wire/audit cues, no extra AI calls for style');
