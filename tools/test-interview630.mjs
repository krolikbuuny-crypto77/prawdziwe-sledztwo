/** 6.30: test real server handler contract with mocked providers/Supabase.
 * No external network or production writes. */
import assert from 'node:assert/strict';
import {buildQuestionContext,repeatsIrrelevantly,classifyClause} from '../lib/question-context-630.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import canon from '../lib/trusted-witness-canon-624.json' with {type:'json'};
const question='Gdzie byłeś między 01:30 a 02:05? Nie pytam o ostatnie spotkanie z Leną.';
const plan=buildQuestionContext(question);
assert.equal(plan.questionPlan.primary,'self_alibi');
assert.deepEqual(plan.questionPlan.intents,['self_alibi']);
assert.deepEqual(plan.questionParts,[]);
assert.equal(plan.questionPlan.slots.negated,true);
const joint='Gdzie byłeś i kto zgłosił alarm?';
assert.equal(buildQuestionContext(joint).questionParts.length,2);
assert.equal(classifyClause('Kto zgłosił znalezienie Leny i o której godzinie?'),'alarm_report');
const state={approvedEvidence:[],witnesses:{MAREK:[
 {role:'player',text:'Gdzie byłeś między 01:30 a 02:05?'},
 {role:'witness',text:'Nadzorowałem zmianę i nie wiem więcej.',narrativeStatus:'unresolved_statement'}
]}};
const follow=buildQuestionContext('A skąd właściwie to wiesz?',state.witnesses.MAREK);
assert.equal(follow.dialogueFocus.referencedTopic,'self_alibi');
assert.match(follow.dialogueFocus.previousAnswer,/Nadzorowałem/);
assert.equal(repeatsIrrelevantly('A skąd właściwie to wiesz?','Nadzorowałem zmianę i nie wiem więcej.',state.witnesses.MAREK),true);
assert.equal(repeatsIrrelevantly('Gdzie byłeś między 01:30 a 02:05?','Nadzorowałem zmianę i nie wiem więcej.',state.witnesses.MAREK),false);
const offline=buildQuestionContext('A skąd właściwie to wiesz?',[
 {role:'player',text:'Gdzie byłeś?'},{role:'witness',text:'Fałszywe fakty o sprawcy',narrativeStatus:'offline_unverified'}]);
assert(!JSON.stringify(offline).includes('Fałszywe fakty'));
const safe=trustedScene({identity:{id:'TOMASZ'},question:joint,knowledge:{currentGroundedAnswer:'fałszywa wskazówka',documentsShown:[]}},null);
assert.equal(safe.knowledge.factBank[0].source,'public-alibi');
assert(safe.knowledge.factBank.some(f=>f.source==='public-what_happened'));
assert(!JSON.stringify(safe).includes('fałszywa wskazówka'));
// Handler-level test: no client-injected topic, answer or facts reach either model.
const originals=Object.fromEntries(['ZAI_API_KEY','GROQ_API_KEY','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','GAME_SESSION_SECRET'].map(k=>[k,process.env[k]]));
Object.assign(process.env,{ZAI_API_KEY:'test-zai-key',GROQ_API_KEY:'test-groq-key',SUPABASE_URL:'https://test-supabase.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-role',GAME_SESSION_SECRET:'local-test-secret-at-least-thirty-two-characters'});
const {default:handler}=await import('../api/interview.js');
const originalFetch=globalThis.fetch,originalLog=console.info;
let sent=[],writes=0;
console.info=()=>{};
const opening=canon.profiles.MAREK.voice.opening;
const context={schema:'ps-witness-context/1',identity:{id:'MAREK',name:'Marek',role:'pracownik'},
 personality:{temperament:'',diction:[],speakingStyle:[]},
 knowledge:{currentGroundedAnswer:opening,alreadySaid:[],documentsShown:[],limits:[],
 groundedOptions:[{id:'turn',kind:'current',text:opening}]},
 psychology:{blocked:false,contradictions:[]},memory:{conversation:[{role:'witness',text:'Fałszywe fakty z przeglądarki'}]},
 request:{semanticPlan:{primary:'murder',intents:['murder'],aspects:[],slots:{compound:false}}}};
try{
 globalThis.fetch=async (url,init={})=>{
  url=String(url);
  if(url.includes('ps_game_sessions?'))return {ok:true,status:200,json:async()=>[{revision:2,approved_state:state}]};
  if(url.includes('rpc/ps_commit_session')){writes++;return {ok:true,status:200,json:async()=>true};}
  if(url.includes('api.z.ai')||url.includes('api.groq.com')){
   const payload=JSON.parse(init.body);const scene=JSON.parse(payload.messages[1].content);sent.push({provider:url.includes('z.ai')?'zai':'groq',payload,scene});
   if(sent.length===1){return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'answer',factIds:['f0'],text:scene.knowledge.factBank[0].text})}}]})};}
   return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify({relevant:true,entailed:true,complete:true,coveredParts:[]})}}]})};
  }
  throw Error('Unknown mocked URL: '+url);
 };
 const req={method:'POST',headers:{host:'game.test',origin:'https://game.test'},socket:{remoteAddress:'test-local'},body:{version:3,witnessId:'MAREK',canonical:opening,question,context}};
 const res={headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}};
 await handler(req,res);
 assert.equal(res.statusCode,200);assert.equal(res.body.provider,'zai');assert.equal(writes,1);
 assert.equal(sent.length,1); // Verbatim fast path needs only one model request.
 assert.equal(sent[0].scene.questionPlan.primary,'self_alibi');
 assert.deepEqual(sent[0].scene.questionParts,[]);
 assert(!JSON.stringify(sent[0].scene).includes('Fałszywe fakty z przeglądarki'));
 assert(!JSON.stringify(sent[0].scene).includes('murder'));
 assert.equal(sent[0].scene.dialogueFocus,null);
 const other=buildQuestionContext('A skąd właściwie to wiesz?',state.witnesses.MAREK);
 assert.equal(other.dialogueFocus.referencedTopic,'self_alibi');
 // A second full handler request must carry the reference from Supabase, not browser memory.
 sent=[];
 const followReq={...req,socket:{remoteAddress:'test-local-followup'},body:{...req.body,question:'A skąd właściwie to wiesz?'}};
 const followRes={headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}};
 await handler(followReq,followRes);
 assert.equal(followRes.statusCode,200);assert.equal(followRes.body.provider,'zai');
 assert.equal(sent[0].scene.questionPlan.primary,'knowledge_source');
 assert.equal(sent[0].scene.dialogueFocus.referencedTopic,'self_alibi');
 assert.match(sent[0].scene.dialogueFocus.previousAnswer,/Nadzorowałem/);
 assert(!JSON.stringify(sent[0].scene).includes('Fałszywe fakty z przeglądarki'));
 console.log('PASS 6.30: negative scope, multi-part question, server-backed references, offline quarantine, model request, persisted testimony');
} finally {
 globalThis.fetch=originalFetch;console.info=originalLog;
 for(const [k,v] of Object.entries(originals))if(v===undefined)delete process.env[k];else process.env[k]=v;
}
