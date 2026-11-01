import assert from 'node:assert/strict';
import {buildDialogueMemory,isTestimonyRecapQuestion,isRequestedTestimonyRestatement,priorDistinctAnswers} from '../lib/dialogue-memory-636.js';
import {auditLiveDialogue} from '../lib/admin-rc57-claim-audit.js';
import {reviewWitnessDraft} from '../lib/interview-rc57103-gate.js';
import {reviewInterviewReply} from '../lib/interview-quality-635.js';
import {interviewStyleCue} from '../lib/interview-style-cue-rc57108.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {attemptInterview} from '../api/interview.js';
import {makeInterviewTrace} from '../lib/interview-observability-636.js';

const q11='Wrócę do wcześniejszej odpowiedzi: co jest potwierdzone, a co nie?';
const q12='Proszę podsumować, jakie granice swojej wiedzy wskazałeś w trakcie rozmowy.';
const history=[
 {role:'player',text:'Jaką rolę pełniłeś podczas tej zmiany?'},
 {role:'witness',text:'Byłem kierownikiem zajezdni i nadzorowałem nocną zmianę.'},
 {role:'player',text:'Co możesz potwierdzić na podstawie własnej pamięci?'},
 {role:'witness',text:'Na początku byłem w biurze, potem wychodziłem do warsztatu i dyspozytorni. Nie odtwarzam ich kolejności co do minuty.'},
 {role:'player',text:'Nie pytam o Lenę. Gdzie byłeś po północy?'},
 {role:'witness',text:'Byłem na terenie zajezdni. Nie pamiętam dokładnych godzin wyjść.'}
];
for(const q of [q11,q12]){
 assert(isTestimonyRecapQuestion(q),q);
 assert(isRequestedTestimonyRestatement(q));
 const memo=buildDialogueMemory(history,q);
 assert.equal(memo.repeatRequested,true);
 assert.deepEqual(priorDistinctAnswers(memo,q),[],'recap should not require novel facts to avoid repetition');
 const scene=trustedScene({identity:{id:'MAREK'},question:q,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(q,history));
 scene.approvedThreadHistory=history;
 scene.memory.conversation=history.map(t=>({role:t.role==='witness'?'świadek':'śledczy',text:t.text}));
 scene.dialogueMemory=memo;
 scene._responseDeadline=Date.now()+100000;
 scene._providerDeadline=Date.now()+80000;
 assert.equal(interviewStyleCue(scene).responseFocus,'testimony_recap');
 const response=q===q11?
  {factIds:['f3','f16'],text:'Potwierdzam, że nadzorowałem zmianę i na początku byłem w biurze. Nie potrafię podać kolejności późniejszych wyjść.'}:
  {factIds:['f16','f23'],text:'Nie potrafię ustalić kolejności późniejszych wyjść. Samego urazu nie widziałem.'};
 const priorReport=auditLiveDialogue({question:q,answer:response.text,history,witnessId:'MAREK'});
 assert(!priorReport.findings.some(x=>['memory_evasion','near_repetition'].includes(x.code)),JSON.stringify(priorReport));
 assert(reviewInterviewReply(scene,response.text).ok,'recap cannot be rejected as exact repetition');
 assert(reviewWitnessDraft(scene,response.text).ok,'recap must be reviewed by semantic audit rather than blocked as robotic repetition');
 const phases=[],trace=makeInterviewTrace();
 const out=await attemptInterview(scene,'apinex-luna',async(_system,payload,_n,_temp,_provider,phase)=>{
  phases.push(phase);
  if(phase==='generate')return {decision:'answer',...response};
  if(phase==='semantic-audit'){
   assert.deepEqual(payload.priorReplies,[]);
   return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:(payload.questionParts||[]).map(()=>true)};
  }
  throw Error('Unnecessary rewrite: '+phase);
 },trace);
 assert(out?.ok,JSON.stringify(trace.summary()));
 assert.deepEqual(phases,['generate','semantic-audit']);
}
for(const q of ['Ukrywasz coś? Powiedz konkretnie, czego jesteś pewien.','Czy miałeś kontakt z Leną?','Kto może potwierdzić twoją obecność?']){
 assert(!isTestimonyRecapQuestion(q));
 const m=buildDialogueMemory(history,q);
 assert.equal(m.repeatRequested,false);
 assert(priorDistinctAnswers(m,q).length>0);
}
const copyQuestion='Skąd o tym wiesz i co jest tylko twoim przypuszczeniem?';
const badScene={question:copyQuestion,memory:{conversation:history.map(t=>({role:t.role==='witness'?'świadek':'śledczy',text:t.text}))}};
assert.equal(reviewInterviewReply(badScene,history[3].text).ok,false,'irrelevant copied reply remains rejected');
const badRecap=auditLiveDialogue({question:q11,answer:'Nie pamiętam, co powiedziałem. Nie mam nagrania.',history});
assert(!badRecap.findings.some(x=>x.code==='memory_evasion'),'recap of facts is not a question about exact quoted speech');
const trueRecall=auditLiveDialogue({question:'Czy pamiętasz, co powiedziałeś na początku tej rozmowy?',answer:'Nie pamiętam dokładnych słów, bo nie prowadziłem nagrania.',history});
assert(trueRecall.findings.some(x=>x.code==='memory_evasion'),'true transcript evasion remains detectable');
const truthfulRecall=auditLiveDialogue({question:'Czy pamiętasz, co powiedziałeś na początku tej rozmowy?',answer:'Na początku mówiłem, że nie odtwarzam ich kolejności co do minuty.',history});
assert(!truthfulRecall.findings.some(x=>x.code==='stock_phrase_repetition'),'requested quotation must not be flagged for using the same wording');
const contradiction='Najpierw byłem w biurze, potem w dyspozytorni, ale nie pamiętam, w jakiej kolejności odwiedziłem te miejsca.';
assert.equal(reviewWitnessDraft({question:q11,identity:{id:'MAREK'},approvedThreadHistory:history},contradiction).ok,false,'clear contradiction remains blocked even on recap');
// No valid facts => no successful answer; the pre-existing contract must stay strict.
const scene=trustedScene({identity:{id:'MAREK'},question:q12,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(q12,history));
scene.approvedThreadHistory=history;scene.dialogueMemory=buildDialogueMemory(history,q12);
scene._responseDeadline=Date.now()+100000;scene._providerDeadline=Date.now()+80000;
let calls=0;const invalid=await attemptInterview(scene,'apinex-luna',async()=>{calls++;return {decision:'answer',factIds:['f999'],text:'Mogę potwierdzić wszystko.'};});
assert.equal(invalid,null);assert.equal(calls,2);
console.log('PASS RC57.10.10: AI-011 and AI-012 recap, semantic audit, real contradictions and invalid fact IDs remain blocked.');
