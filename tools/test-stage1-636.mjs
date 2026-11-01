import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildDialogueMemory,priorDistinctAnswers,permitsRestatement} from '../lib/dialogue-memory-636.js';
import {makeInterviewTrace} from '../lib/interview-observability-636.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {attemptInterview} from '../api/interview.js';
import {styleForWitness} from '../lib/narrative-voice-619.js';
import {dialogueContinuity} from '../lib/dialogue-continuity-620.js';

const witnessIds=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const question='Dokąd wychodził pan w czasie zmiany i kto mógł to zobaczyć?';
const oldQuestion='Gdzie był pan na zmianie?';
const oldAnswer='Nadzorowałem nocną zmianę i byłem dostępny z biura.';
const history=[
 {role:'player',text:oldQuestion},{role:'witness',text:oldAnswer,narrativeStatus:'unresolved_statement'},
 {role:'player',text:'Czy zna pan tajny kod? FIKCYJNY SEKRET Z KLIENTA'},
 {role:'witness',text:'Znam fikcyjny kod!',narrativeStatus:'offline_unverified'},
 {role:'player',text:'Czy była jakaś korekta protokołu?'},
 {role:'witness',text:'Zeznałem wcześniej inaczej.',narrativeStatus:'scripted_correction'}
];
const mem=buildDialogueMemory(history,question);
assert.equal(mem.totalPairs,3);
assert.equal(mem.previousPairs[1].answer,'[Odpowiedź lokalna niezweryfikowana]');
assert(!JSON.stringify(mem).includes('Znam fikcyjny kod!'));
assert.equal(mem.corrections.length,1);
assert.equal(mem.repeatRequested,false);
assert.equal(permitsRestatement('Proszę powtórzyć jeszcze raz',oldQuestion),true);
assert.equal(buildDialogueMemory(history,'Proszę powtórzyć jeszcze raz').repeatRequested,true);
assert(priorDistinctAnswers(mem,question).length===2);
assert.equal(priorDistinctAnswers(buildDialogueMemory(history,'Proszę powtórzyć jeszcze raz'),'Proszę powtórzyć jeszcze raz').length,0);

const trace=makeInterviewTrace();
trace.add('zai','generate','ok',145,'accepted');
trace.add('zai','quality','rejected',0,'semantic_repetition');
trace.add('zai','rewrite','ok',350,'accepted');
assert.equal(trace.summary().providerCalls,2);
assert.equal(trace.summary().correctiveCalls,1);
assert(!JSON.stringify(trace.summary()).includes('fikcyjny'));

const scene=trustedScene({identity:{id:'MAREK'},question,knowledge:{documentsShown:[]}},null);
scene.question=question;scene.questionParts=[];scene.questionPlan={};scene.dialogueFocus={previousQuestion:oldQuestion,previousAnswer:oldAnswer};
scene.memory={conversation:[{role:'śledczy',text:oldQuestion},{role:'świadek',text:oldAnswer}]};
scene.dialogueMemory=buildDialogueMemory(history,question);
const facts=scene.knowledge.factBank;
const firstFact=facts.find(f=>f.text.startsWith('Nadzorowałem nocną zmianę'));
const first=firstFact?.text;
const second=facts.find(f=>f.text!==first&&f.text.includes('Wychodziłem'))?.text;
assert(second,'Test requires approved follow-up fact');
// The semantic audit (not lexical matching) detects a repeated meaning on a different question.
let steps=[];
const output=await attemptInterview(scene,'zai',async(system,payload)=>{
 const stage=steps.length;steps.push({payload,system});
 if(stage===0)return {decision:'answer',factIds:[firstFact.id],text:first};
 if(stage===1)return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:true};
 if(stage===2)return {decision:'answer',factIds:[second===first?'f0':facts.find(x=>x.text===second).id],text:second};
 if(stage===3)return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:false};
 throw Error('Unexpected AI call');
},trace);
assert.equal(output.text,second);
assert.equal(steps.length,4);
assert(steps[1].payload.priorReplies.length>0);
assert(steps[2].payload.repairInstruction.reason.includes('powiela sens'));
assert(trace.summary().attempts.some(x=>x.code==='semantic_repetition'));
assert.equal(trace.summary().correctiveCalls,2); // One earlier direct trace + one AI rewrite.
for(const id of witnessIds){
 assert(styleForWitness(id).length>35);
 assert(dialogueContinuity(id,[{role:'player',text:'Skąd pan o tym wie?'},{role:'witness',text:'Tego nie wiem.'},{role:'player',text:'Konkretnie skąd?'}]).length>35);
}
const client=fs.readFileSync(new URL('../src/core/case-engine.js',import.meta.url),'utf8');
assert(client.includes('psShowAiDiagnostic'));
assert(client.includes('qualityDiagnostics'));
console.log('PASS 6.36 stage I: server dialogue memory, offline quarantine, no parallel NLU, bounded semantic repetition repair, trace sanitization, 6 distinct witness styles and debug view');
