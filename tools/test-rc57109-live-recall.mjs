import assert from 'node:assert/strict';
import {makeInterviewTrace} from '../lib/interview-observability-636.js';
import {isExplicitRecallQuestion,permitsRestatement,buildDialogueMemory,priorDistinctAnswers} from '../lib/dialogue-memory-636.js';
import {reviewInterviewReply} from '../lib/interview-quality-635.js';
import {interviewStyleCue} from '../lib/interview-style-cue-rc57108.js';
import {interviewWirePayload} from '../lib/interview-naturalness-rc28.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {INTERVIEW_BUDGET,phaseTimeout} from '../lib/interview-budget-636.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {attemptInterview} from '../api/interview.js';
const history=[
 {role:'player',text:'Jaką rolę pełniłeś podczas tej zmiany?'},
 {role:'witness',text:'Byłem kierownikiem tej zmiany i nadzorowałem zadania.'},
 {role:'player',text:'Co możesz potwierdzić na podstawie własnej pamięci?'},
 {role:'witness',text:'Na początku zmiany byłem w biurze i odpowiadałem za rozliczenia.'},
 {role:'player',text:'Nie pytam o Lenę. Gdzie byłeś po północy?'},
 {role:'witness',text:'W rejonie warsztatu i dyspozytorni.'}
];
const recall='Czy pamiętasz, co powiedziałeś na początku tej rozmowy?';
assert(isExplicitRecallQuestion(recall));
assert(permitsRestatement(recall,'Jaką rolę pełniłeś podczas tej zmiany?'));
assert(!isExplicitRecallQuestion('Czy pamiętasz, gdzie byłeś po północy?'));
assert(!isExplicitRecallQuestion('Kto może potwierdzić to, co powiedziałeś przed chwilą?'));
const memory=buildDialogueMemory(history,recall);
assert.equal(memory.repeatRequested,true);
assert.equal(memory.openingExchange.answer,history[1].text);
assert.deepEqual(priorDistinctAnswers(memory,recall),[]);
const scene=trustedScene({identity:{id:'MAREK'},question:recall,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(recall,history));
scene.approvedThreadHistory=history;scene.memory.conversation=history.map(x=>({role:x.role==='player'?'śledczy':'świadek',text:x.text}));scene.dialogueMemory=memory;
scene._responseDeadline=Date.now()+100000;scene._providerDeadline=Date.now()+80000;
assert.equal(interviewStyleCue(scene).responseFocus,'recount_previous_words');
assert.equal(interviewWirePayload(compactInterviewPayload(scene)).rc57108Style.responseFocus,'recount_previous_words');
const copied=history[1].text;
assert(reviewInterviewReply(scene,copied,[scene.knowledge.factBank[2]]).ok,'exact answer can be recounted upon explicit request');
assert.equal(reviewInterviewReply({...scene,question:'Skąd wiesz, gdzie byłeś?'},copied).ok,false,'ordinary irrelevant repetition stays blocked');
let calls=[];const trace=makeInterviewTrace();
const witness='Tak. Na początku powiedziałem, że kierowałem zmianą i nadzorowałem zadania.';
const result=await attemptInterview(scene,'apinex-luna',async(system,payload,maxTokens,temperature,provider,phase)=>{
 calls.push(phase);
 if(phase==='generate'){
  assert.equal(payload.conversationOpeningAnchor.text,history[1].text);
  return {decision:'answer',factIds:['f2'],text:witness};
 }
 if(phase==='semantic-audit'){
  assert.deepEqual(payload.priorReplies,[],'recall is not semantic duplication');
  return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[]};
 }
 throw Error('Unexpected phase '+phase);
},trace);
assert(result?.ok,JSON.stringify(trace.summary()));
assert.equal(result.text,witness);
assert(!calls.includes('rewrite'),'correct recall should not burn a rewrite');
const diag=makeInterviewTrace();diag.add('apinex-luna','quality','rejected',0,'dialogue_opening_memory_attribution');
assert.equal(diag.summary().attempts[0].code,'dialogue_opening_memory_attribution');
diag.add('apinex-luna','quality','rejected',0,'dialogue_near_repetition');
assert.equal(diag.summary().attempts[1].code,'dialogue_near_repetition');
assert.equal(INTERVIEW_BUDGET.phaseMs['apinex-luna'].generate,15000);
assert.equal(phaseTimeout({provider:'apinex-luna',phase:'rewrite',now:0,turnDeadline:60000,providerDeadline:50000}),7500);
console.log('PASS RC57.10.9: prior dialogue recall, anti-repeat exception, stable fact audit, observable rejections and expanded bounded phases.');
