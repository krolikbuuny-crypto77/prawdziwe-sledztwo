/** RC58 tests using real server modules and production attemptInterview with injected
 * fake model responses. No external API credentials or invented quality claims.
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {initialState,appendReportedTurn} from '../lib/server-state.js';
import {serverTurnMemory,exactRecallReply,chronologyAttributionIssue,recallReference} from '../lib/interview-turn-memory-rc58.js';
import {repetitionContext,repetitionReview} from '../lib/interview-repetition-rc58.js';
import {reviewWitnessDraft} from '../lib/interview-rc57103-gate.js';
import {classifyDialogueMove} from '../lib/dialogue-direction-rc32.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {attemptInterview} from '../api/interview.js';
import {makeInterviewTrace} from '../lib/interview-observability-636.js';
import {interviewWirePayload} from '../lib/interview-naturalness-rc28.js';
const IDs=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
const questions=['Jaką pełnisz funkcję?','Jakie masz alibi?','Co wiesz o Lenie?','A skąd to wiesz?','Gdzie byłeś po północy?','Nie pytam o Lenę, tylko gdzie byłeś?','Kto potwierdzi twoją wersję?','Co sądzisz o Nowickim?','Skąd znasz Wójcika?','Czy mnie okłamujesz?','Sprostuj wcześniejszą wypowiedź.','Czy mówiłeś o rejestrach?'];
let state=initialState();const first={};
for(const id of IDs){
 for(let i=0;i<24;i++){
  const q=questions[i%12],a=i===0?`${id}: wypowiedź otwierająca bez alibi.`:`Odpowiedź ${i+1} dotycząca ${q}`;
  const turnId=randomUUID();
  state=appendReportedTurn(state,id,q,a,[],'unresolved_statement',{turnId,provider:'local',model:'witness-registry-rc24'});
  if(i===0)first[id]={q,a,turnId};
 }
 const selected=serverTurnMemory(state,id,'Co powiedziałeś na początku tej rozmowy?');
 ok(selected.selected?.turnId===first[id].turnId,`${id} points to first turn ID`);
 ok(selected.selected.answer===first[id].a,`${id} exact first statement, no contamination`);
 ok(selected.selected.question===first[id].q,`${id} question pairing`);
 const recalled=exactRecallReply(selected);
 ok(recalled?.ok&&recalled.text.includes(first[id].a),`${id} direct anchored recall`);
 ok(recalled?.sequence===1,`${id} stable sequence`);
 ok(recalled.text.includes(['ELZBIETA','MAGDALENA'].includes(id)?'odpowiedziałam':'odpowiedziałem'),`${id} grammatical recall gender`);
 ok(!recalled.text.includes('Odpowiedź 24'),`${id} no late details`);
 const prev=serverTurnMemory(state,id,'Powtórz swoją poprzednią odpowiedź.');
 ok(prev.selected.sequence===24,`${id} previous answer`);
 const at=serverTurnMemory(state,id,'Co powiedziałeś w turze 8?');
 ok(at.selected.sequence===8,`${id} turn 8`);
 ok(!chronologyAttributionIssue(selected,`Na początku rozmowy mówiłem: „${first[id].a}”`),`${id} valid quotation`);
 ok(chronologyAttributionIssue(selected,'Na początku rozmowy mówiłem: „Byłem w dyspozytorni po północy.”')==='invented_prior_quote',`${id} later material cannot become first quote`);
}
for(const q of ['Co powiedziałeś na początku rozmowy?','Pamiętasz pierwszą odpowiedź?','Co powiedziałeś w turze 7?','Co mówiłeś przed chwilą?'])ok(recallReference(q),`Reference ${q}`);
ok(!recallReference('Czy pamiętasz wydarzenia z nocy?'),'Event recall is not quote recall');
// Legacy receipts cannot be ordered just because object enumeration happens to be stable.
let legacy=initialState();legacy.interviewReceipts={a:{witnessId:'MAREK',question:'stare pytanie',text:'stara odpowiedź',provider:'local'}};
const legacyRecall=serverTurnMemory(legacy,'MAREK','Co powiedziałeś na początku rozmowy?');
ok(!legacyRecall.selected&&legacyRecall.uncertainLegacyOrder,'do not guess unknown legacy chronology');
ok(exactRecallReply(legacyRecall).reason==='legacy_chronology_unverified','controlled unavailable error');
// 24 turns + outside the 80-row display window. Memory is ledger+receipts, not summary.
for(let i=24;i<65;i++)state=appendReportedTurn(state,'MAREK',`Dodatkowe pytanie ${i}`,`Dodatkowa odpowiedź ${i} potwierdzająca ten sam fakt`,[],'unresolved_statement',{turnId:randomUUID(),provider:'local'});
ok(state.witnesses.MAREK.length===80,'bounded visible history');
ok(serverTurnMemory(state,'MAREK','Co powiedziałeś na początku rozmowy?').selected.answer===first.MAREK.a,'first utterance survives over 40 turns');
// The question scope is advisory: excluded topic stays excluded, crime not inferred.
const q='Nie pytam o Lenę. Gdzie byłeś po północy?';
const scope=buildQuestionContext(q,[]);
ok(scope.questionPlan.excludedTopics?.length>0,'excluded topic recognized');
ok(classifyDialogueMove('Kłamiesz mi?')!=='crime_accusation','mere suspicion is not murder accusation');
const bad=reviewWitnessDraft({identity:{id:'MAREK'},question:'Kłamiesz mi?',memory:{conversation:[]}},'Nie zabiłem Leny.');
ok(!bad.ok&&bad.reason==='dialogue_unsolicited_crime_defense','AI-006 unjustified violence rejected');
const context=repetitionContext(state.witnesses.MAREK,'Dodatkowe pytanie 64');
ok(context.sameQuestionCount>=1,'repeat context from approved history');
ok(repetitionReview(context,'Dodatkowe pytanie 64','Dodatkowa odpowiedź 64 potwierdzająca ten sam fakt').status==='justified_repeat','same question may repeat');
// Actual production generate -> validator -> semantic audit: not_entailed is a hard
// stop for the current provider, not an unbounded retry.
let scene=trustedScene({identity:{id:'MAREK'},question:'Jakie masz alibi?',primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext('Jakie masz alibi?',[]));
scene._responseDeadline=Date.now()+100000;scene._providerDeadline=Date.now()+75000;
scene.approvedThreadHistory=[];
const original='Nadzorowałem nocną zmianę i byłem dostępny z biura. Chociaż nie mam dokładnego alibi.';
const phases=[];const trace=makeInterviewTrace();
const declined=await attemptInterview(scene,'apinex-luna',async(sys,payload,tokens,temp,provider,phase)=>{
 phases.push(phase);
 if(phase==='semantic-audit')return {relevant:true,entailed:false,complete:true,semanticRepeat:false,coveredParts:[]};
 return {decision:'answer',factIds:['f0'],text:original};
},trace);
ok(declined===null,'AI-043 non-entailment is never accepted');
ok(phases.filter(p=>p==='rewrite').length===0,'AI-043 no identical-fact rewrite after non-entailment');
ok(phases.length<=2,'AI-043 bounded provider calls');
// 502: one bounded retry with jitter; each attempt counted incl. audit.
scene=trustedScene({identity:{id:'MAREK'},question:'Jakie masz alibi?',primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext('Jakie masz alibi?',[]));
scene._responseDeadline=Date.now()+100000;scene._providerDeadline=Date.now()+75000;scene.approvedThreadHistory=[];
const phases502=[];const t502=makeInterviewTrace();
await attemptInterview(scene,'apinex-luna',async(sys,payload,tokens,temp,provider,phase)=>{
 phases502.push(phase);
 if(phase==='generate'&&phases502.filter(x=>x==='generate').length===1){const error=new Error('upstream_unavailable');error.code='upstream_unavailable';error.diagnostic={upstreamStatus:502,requestDispatched:true};throw error;}
 if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[]};
 return {decision:'answer',factIds:['f0'],text:'Nadzorowałem nocną zmianę i byłem dostępny z biura. Nie umiem tego lepiej ująć.'};
},t502);
ok(phases502.filter(x=>x==='generate').length===2,'502 retried once');
ok(phases502.length<=4,'502 bounded all phases');
ok(scene._modelCallBudget.used===phases502.length,'audit+generation+retry all counted');
// 429 must never consume same-provider backoff or retry.
scene=trustedScene({identity:{id:'MAREK'},question:'Jakie masz alibi?',primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext('Jakie masz alibi?',[]));
scene._responseDeadline=Date.now()+100000;scene._providerDeadline=Date.now()+75000;scene.approvedThreadHistory=[];
let call429=0;
await assert.rejects(()=>attemptInterview(scene,'apinex-luna',async()=>{call429++;const e=new Error('upstream_rate_limit');e.code='upstream_rate_limit';e.diagnostic={upstreamStatus:429,retryAfterSeconds:7,requestDispatched:true};throw e;}),/upstream_rate_limit/);
ok(call429===1,'429 no same-provider retry');
// AI-015: do not reject a necessary, grounded incidental mention, while scope
// remains explicitly on the witness's whereabouts. Unlike the historical test,
// f15 actually contains the claimed whereabouts (f14 is about TCMS radio logs).
const tomaszQuestion='Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?';
const tomaszScene=trustedScene({identity:{id:'TOMASZ'},question:tomaszQuestion,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(tomaszQuestion,[]));
tomaszScene._responseDeadline=Date.now()+100000;tomaszScene._providerDeadline=Date.now()+75000;tomaszScene.approvedThreadHistory=[];
tomaszScene.questionScope={exactQuestion:tomaszQuestion,excludedTopics:buildQuestionContext(tomaszQuestion,[]).questionPlan.excludedTopics};
const authorizedFact=tomaszScene.knowledge.factBank.find(f=>f.source==='trusted-whereabouts' || f.text.startsWith('Zmianę zacząłem w dyspozytorni.'));
ok(Boolean(authorizedFact),'AI-015 choose ACTUAL authorized whereabouts, not unrelated TCMS fact');
const tomaszPhases=[];
const tomaszResult=await attemptInterview(tomaszScene,'apinex-luna',async(sys,payload,maxTokens,temp,provider,phase)=>{
 tomaszPhases.push(phase);
 if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[]};
 return {decision:'answer',factIds:[authorizedFact.id],text:authorizedFact.text};
});
ok(tomaszResult?.ok,'AI-015 correct authorized answer is accepted');
ok(!tomaszPhases.includes('rewrite'),'AI-015 should not retry truthful response for incidental name');
ok(tomaszScene.questionScope.excludedTopics?.length>0,'AI-015 excluded topic present in server context');
console.log(JSON.stringify({test:'rc58-intelligence',checks,paths:{firstTurn:IDs.length,turnReconstruction:65,notEntailed:phases,upstream502:phases502,upstream429:call429},status:'PASS'}));
