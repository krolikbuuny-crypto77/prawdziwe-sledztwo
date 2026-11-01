import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {interviewAnswerSystem,interviewAuditSystem,interviewWirePayload} from '../lib/interview-naturalness-rc28.js';
import {interviewAuditSystem as baseAuditSystem} from '../lib/interview-wire-rc23.js';
import {semanticAuditWire,safeUsage,safeModelContextStats} from '../lib/interview-perf-rc57105.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {buildDialogueMemory} from '../lib/dialogue-memory-636.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {getInterviewProviderMetrics,askInterviewProvider} from '../lib/interview-providers-rc24.js';
import {resetTrafficForTests} from '../lib/apinex-traffic-rc5710.js';
import {makeInterviewTrace} from '../lib/interview-observability-636.js';
const baselineDir=process.env.BASELINE_DIR;
let before=null;
if(baselineDir){const old=await import(pathToFileURL(resolve(baselineDir,'lib/interview-naturalness-rc28.js')).href);before=old;}
const names=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const questions=[
 'Jaką rolę pełniłeś podczas tej zmiany?',
 'Co możesz potwierdzić na podstawie własnej pamięci?',
 'Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?',
 'Kto może potwierdzić twoje alibi?',
 'Skąd to wiesz, a co jest tylko twoim przypuszczeniem?',
 'Nie twierdzę, że kłamiesz. Chcesz sprostować poprzednią odpowiedź?',
 'Pamiętasz, co powiedziałeś na początku tej rozmowy?',
 'Gdze byles po polnocy i kto moze to potwirdzic?',
 'Przyznaj się. Ukrywasz coś przed nami czy zamierzasz nadal kręcić?',
 'Opowiedz, co Lena widziała w niszy, nawet jeśli nie mogłeś tego wiedzieć.'
];
const percentile=(arr,p)=>{const a=[...arr].sort((x,y)=>x-y);return Number(a[Math.ceil(p*a.length)-1].toFixed(3));};
const records=[];
for(const id of names){for(let q=0;q<questions.length;q++){
 const question=questions[q].replaceAll('pełniłeś',id==='ELZBIETA'||id==='MAGDALENA'?'pełniłaś':'pełniłeś')
  .replaceAll('byłeś',id==='ELZBIETA'||id==='MAGDALENA'?'byłaś':'byłeś');
 const history=[];for(let i=0;i<50;i++)history.push({role:'player',text:'Pytanie o kartę pracy TW-217 '+i},{role:'witness',text:'O tej karcie mówiłem tylko to, co pamiętam. '+i});
 const scene=trustedScene({identity:{id},question,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(question,history));
 scene.approvedThreadHistory=history;scene.dialogueMemory=buildDialogueMemory(history,question);
 scene.memory.conversation=history.slice(-12).map(x=>({role:x.role==='witness'?'świadek':'śledczy',text:x.text}));
 scene.selectedFacts=scene.knowledge.factBank.slice(0,3);
 scene.proposedAnswer='Wiem tylko, co mogę potwierdzić w tej rozmowie.';
 scene.priorReplies=[];
 scene.allowedFactIds=scene.knowledge.factBank.map(x=>x.id);
 const optimizedGeneration=JSON.stringify(interviewWirePayload(compactInterviewPayload(scene)));
 const optimizedAudit=JSON.stringify(semanticAuditWire({question:scene.question,questionParts:scene.questionParts,selectedFacts:scene.selectedFacts,proposedAnswer:scene.proposedAnswer,priorReplies:[],conversation:scene.memory.conversation,dialogueFocus:scene.dialogueFocus}));
 assert(optimizedGeneration.includes('factBank'));assert(scene.knowledge.factBank.length>=30);
 assert(optimizedAudit.includes('selectedFacts'));assert(optimizedAudit.includes('proposedAnswer'));
 assert(!optimizedAudit.includes('psychologicalDelivery'));assert(!optimizedAudit.includes('rc50QuestionCoaching'));
 for(let r=0;r<5;r++){
  const start=performance.now();JSON.stringify(interviewWirePayload(compactInterviewPayload(scene)));const genPrep=performance.now()-start;
  const auditStart=performance.now();JSON.stringify(semanticAuditWire({question:scene.question,questionParts:scene.questionParts,selectedFacts:scene.selectedFacts,proposedAnswer:scene.proposedAnswer,priorReplies:[],conversation:scene.memory.conversation}));const auditPrep=performance.now()-auditStart;
  records.push({id,q,genPrep,auditPrep,genBytes:Buffer.byteLength(interviewAnswerSystem,'utf8')+Buffer.byteLength(optimizedGeneration,'utf8'),auditBytes:Buffer.byteLength(interviewAuditSystem,'utf8')+Buffer.byteLength(optimizedAudit,'utf8'),
   oldGenBytes:before?Buffer.byteLength(before.interviewAnswerSystem,'utf8')+Buffer.byteLength(JSON.stringify(before.interviewWirePayload(compactInterviewPayload(scene))),'utf8'):null,
   oldAuditBytes:before?Buffer.byteLength(before.interviewAuditSystem,'utf8')+Buffer.byteLength(JSON.stringify(before.interviewWirePayload({question:scene.question,questionParts:scene.questionParts,selectedFacts:scene.selectedFacts,proposedAnswer:scene.proposedAnswer,priorReplies:[],conversation:scene.memory.conversation})),'utf8'):null});
 }
}}
assert.equal(records.length,300);
const avg=k=>Math.round(records.reduce((s,x)=>s+x[k],0)/records.length);
const sample=buildDialogueMemory(Array.from({length:110},(_,i)=>({role:i%2?'witness':'player',text:i%2?'Potwierdzam, że omawialiśmy dokumentację T-17.':'Pytam o dokumentację T-17'})),'Pamiętasz co mówiłeś o dokumentacji T-17?');
assert(sample.indexedEarlier?.source==='approved_prior_dialogue_not_evidence');
assert.equal(safeUsage({}).inputTokens,null);assert.equal(safeUsage({usage:{prompt_tokens:123,completion_tokens:44}}).inputTokens,123);
const stats=safeModelContextStats('abc',{foo:'bar'});assert(stats.contextSize>0);
const trace=makeInterviewTrace();trace.noteProviderCall('generate',{inputTokens:100,outputTokens:30,contextSize:200,requestDispatched:true,providerDurationMs:27,quotaWaitMs:3});trace.add('apinex-luna','generate','ok',30,'accepted');trace.addContextDuration(2);trace.addLocalDuration(1);
assert.equal(trace.summary().providerCalls,1);assert.equal(trace.summary().inputTokens,100);assert.equal(trace.summary().generateDurationMs,30);
// Mock real transport (no network), inspect token metadata without exposing response content.
process.env.APINEX_API_KEY='MOCK_KEY_NOT_A_SECRET';process.env.APINEX_SHARED_QUOTA_ENABLED='false';resetTrafficForTests();
const providerReply=await askInterviewProvider({provider:'apinex-luna',system:'system',payload:{hello:1},maxTokens:100},async (_url,options)=>{
 assert(options.body.includes('free/gpt-6-luna'));
 return {ok:true,json:async()=>({usage:{prompt_tokens:412,completion_tokens:92},choices:[{message:{content:'{"decision":"answer","factIds":["f0"],"text":"Test"}'}}]})};
});
assert.equal(getInterviewProviderMetrics(providerReply).inputTokens,412);
assert.equal(getInterviewProviderMetrics(providerReply).outputTokens,92);
assert.equal(Object.keys(providerReply).includes('METRICS'),false);
const output={sampleCount:records.length,scenarioCount:60,repeatCount:5,genSystemBeforeChars:before?.interviewAnswerSystem.length??null,genSystemAfterChars:interviewAnswerSystem.length,
 medLocalGenerationPrepMs:percentile(records.map(x=>x.genPrep),.5),p95LocalGenerationPrepMs:percentile(records.map(x=>x.genPrep),.95),
 medLocalAuditPrepMs:percentile(records.map(x=>x.auditPrep),.5),p95LocalAuditPrepMs:percentile(records.map(x=>x.auditPrep),.95),
 avgGenerationInputBytesBefore:before?avg('oldGenBytes'):null,avgGenerationInputBytesAfter:avg('genBytes'),
 avgAuditInputBytesBefore:before?avg('oldAuditBytes'):null,avgAuditInputBytesAfter:avg('auditBytes'),
 auditSystemBaseChars:baseAuditSystem.length,providerCallsOnMock:1,realProviderCalls:0,realProviderLatencyMeasured:false};
console.log('RC57.10.5 benchmark',JSON.stringify(output));
