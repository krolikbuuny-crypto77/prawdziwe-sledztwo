import assert from 'node:assert/strict';
import {factContractIssue} from '../lib/interview-fact-contract-rc14.js';
import {attemptInterview} from '../api/interview.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {makeInterviewTrace} from '../lib/interview-observability-636.js';
import {INTERVIEW_BUDGET,phaseTimeout} from '../lib/interview-budget-636.js';
const facts=[{id:'f0'},{id:'f1'}];
for(const [response,expected] of [
 [{decision:'fallback'},'model_fallback'],[{},'invalid_decision'],
 [{decision:'answer'},'missing_fact_ids'],[{decision:'answer',factIds:[]},'fact_ids_count'],
 [{decision:'answer',factIds:[0]},'fact_ids_type'],[{decision:'answer',factIds:['f0','f0']},'duplicate_fact_ids'],
 [{decision:'answer',factIds:['f999']},'unknown_fact_ids'],[{decision:'answer',factIds:['f1']},null]
])assert.equal(factContractIssue(response,facts),expected);
const question='Co właściwie was łączyło?';
const scene=trustedScene({identity:{id:'MAREK'},question,knowledge:{documentsShown:[]}},null);
Object.assign(scene,buildQuestionContext(question,[]));scene.memory.conversation=[];
scene.dialogueMemory={previousPairs:[],openQuestions:[],corrections:[],earlierRelated:[]};scene.questionParts=[];
const fact=scene.knowledge.factBank.find(f=>f.source==='trusted-relationship');
const trace=makeInterviewTrace();let calls=0;
const result=await attemptInterview(scene,'groq',async(system,payload,_tokens,_temperature,_provider,phase)=>{
 calls++;assert(system.includes('allowedFactIds'));assert(payload.allowedFactIds.includes(fact.id));
 if(phase==='generate')return {decision:'answer',factIds:['not-authorized'],text:fact.text};
 assert.equal(phase,'rewrite');assert.equal(payload.repairInstruction.contractIssue,'unknown_fact_ids');
 return {decision:'answer',factIds:[fact.id],text:fact.text};
},trace);
assert.equal(result.ok,true);assert.equal(calls,2);
assert(trace.summary().attempts.some(x=>x.code==='unknown_fact_ids'));
calls=0;const refusalTrace=makeInterviewTrace();
assert.equal(await attemptInterview(scene,'groq',async()=>{calls++;return {decision:'fallback'};},refusalTrace),null);
assert.equal(calls,1);assert(refusalTrace.summary().attempts.some(x=>x.code==='model_fallback'));
assert.equal(INTERVIEW_BUDGET.totalMs,54000);
assert.equal(phaseTimeout({provider:'gemini',phase:'generate',now:0,providerDeadline:32000,turnDeadline:54000}),26000);
assert.equal(phaseTimeout({provider:'gemini',phase:'semantic-audit',now:26000,providerDeadline:32000,turnDeadline:54000}),6000);
console.log('PASS RC14: distinct contract errors, unchanged strict IDs, explicit allowed IDs, repair, no forced answer after fallback, generation 26s + audit 6s');
