import assert from 'node:assert/strict';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {attemptInterview} from '../api/interview.js';
import {makeInterviewTrace} from '../lib/interview-observability-636.js';
import {INTERVIEW_BUDGET,phaseTimeout} from '../lib/interview-budget-636.js';
function setup(question='Co robiłeś na nocnej zmianie?'){
 const scene=trustedScene({identity:{id:'MAREK'},question,knowledge:{documentsShown:[]}},null);
 scene.memory.conversation=[];
 scene.questionParts=[];
 scene.dialogueFocus=null;
 scene.dialogueMemory={previousPairs:[],openQuestions:[],corrections:[],earlierRelated:[]};
 const fact=scene.knowledge.factBank.find(f=>f.source==='public-alibi');
 assert(fact&&fact.text.includes('Nie będę udawał'));
 return {scene,fact};
}
assert.equal(INTERVIEW_BUDGET.phaseMs.zai.generate,22000);
assert.equal(phaseTimeout({provider:'zai',phase:'generate',now:1000,turnDeadline:47000,providerDeadline:26000}),22000);
// A true, positive excerpt from an authorized statement containing a negative
// is not automatically rejected. Independent AI audit MUST run for that excerpt.
{
 const {scene,fact}=setup();const calls=[];
 const answer=await attemptInterview(scene,'groq',async(_,payload,__,___,provider,phase)=>{
  calls.push(phase);assert.equal(provider,'groq');
  if(phase==='generate')return {decision:'answer',factIds:[fact.id],text:'Nadzorowałem nocną zmianę i byłem dostępny z biura.'};
  if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:false};
  throw Error('unexpected '+phase);
 });
 assert(answer?.ok);assert.deepEqual(calls,['generate','semantic-audit']);
}
// Bad fact IDs can be repaired by the backup model while retaining canonical ID checks.
{
 const {scene,fact}=setup();const calls=[];const trace=makeInterviewTrace();
 const answer=await attemptInterview(scene,'groq',async(_,payload,__,___,provider,phase)=>{
  calls.push(phase);
  if(phase==='generate')return {decision:'answer',factIds:['f999'],text:'Źle wybrany fakt.'};
  if(phase==='rewrite'){assert(payload.repairInstruction.reason.includes('ISTNIEJĄCYCH'));return {decision:'answer',factIds:[fact.id],text:fact.text};}
  throw Error('unexpected '+phase);
 },trace);
 assert(answer?.ok);assert.deepEqual(calls,['generate','rewrite']);
 assert(trace.summary().attempts.some(e=>e.code==='bad_fact_ids'));
}
// Rejected semantic paraphrase can receive ONE bounded rewrite.
{
 const {scene,fact}=setup();const calls=[];
 const answer=await attemptInterview(scene,'groq',async(_,payload,__,___,provider,phase)=>{
  calls.push(phase);
  if(phase==='generate')return {decision:'answer',factIds:[fact.id],text:'Z pewnością całą noc byłem na dachu.'};
  if(phase==='semantic-audit')return {relevant:false,entailed:false,complete:false,coveredParts:[],semanticRepeat:false};
  if(phase==='rewrite')return {decision:'answer',factIds:[fact.id],text:fact.text};
  throw Error('unexpected '+phase);
 });
 assert(answer?.ok);assert.deepEqual(calls,['generate','semantic-audit','rewrite']);
}
// New, unauthorized time does not pass, even with a helpful auditor.
{
 const {scene,fact}=setup();const trace=makeInterviewTrace();let revisions=0;
 const answer=await attemptInterview(scene,'groq',async(_,payload,__,___,provider,phase)=>{
  if(phase==='generate'||phase==='rewrite'){
   revisions++;return {decision:'answer',factIds:[fact.id],text:'Byłem tam o 22:47.'};
  }
  if(phase==='semantic-audit')return {relevant:true,entailed:true,complete:true,coveredParts:[],semanticRepeat:false};
  throw Error('unexpected '+phase);
 },trace);
 assert.equal(answer,null);assert.equal(revisions,2);
 assert(trace.summary().attempts.some(e=>e.code==='hard_guard'));
}
// Omitting a crucial negation is never accepted by the automatic fast path.
{
 const {scene,fact}=setup('Czy siedziałeś w biurze bez przerwy?');const calls=[];
 const answer=await attemptInterview(scene,'groq',async(_,payload,__,___,provider,phase)=>{
  calls.push(phase);
  if(phase==='generate'||phase==='rewrite')return {decision:'answer',factIds:[fact.id],text:'Nadzorowałem nocną zmianę i byłem dostępny z biura.'};
  if(phase==='semantic-audit')return {relevant:false,entailed:false,complete:false,coveredParts:[],semanticRepeat:false};
  throw Error('unexpected '+phase);
 });
 assert.equal(answer,null);assert.deepEqual(calls,['generate','semantic-audit','rewrite','semantic-audit']);
}
console.log('PASS RC6: no false negative-lexical rejection, independent semantic audit, single bounded Groq correction, no fabricated times or negation leaks');
