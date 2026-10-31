import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {interviewWirePayload,interviewAnswerSystem} from '../lib/interview-wire-rc23.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {providerErrorDetails} from '../lib/ai-providers-rc7.js';
const envKeys=['GAME_SESSION_SECRET','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ZAI_API_KEY','APINEX_API_KEY'];
const oldEnv=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));const oldFetch=globalThis.fetch,oldInfo=console.info;
process.env.GAME_SESSION_SECRET='request-budget-test-'.padEnd(40,'k');process.env.SUPABASE_URL='https://budget-test.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='dummy';process.env.ZAI_API_KEY='dummy';process.env.APINEX_API_KEY='dummy';
const {initialState}=await import('../lib/server-state.js');const {default:handler}=await import('../api/interview.js');
const history=[{role:'player',text:'Masz alibi?'},{role:'witness',text:'Nadzorowałem zmianę i byłem dostępny z biura. Nie siedziałem tam bez przerwy.'}];
const fresh=()=>({...initialState(),witnesses:{...initialState().witnesses,MAREK:history}});
let state=fresh(),revision=0,mode='ok',wireSizes=[],answerCalls=0;
const q='Kto to potwierdzi?';const originalScene=trustedScene({identity:{id:'MAREK'},question:q},state);
const wire=interviewWirePayload(originalScene);
assert.deepEqual(wire.knowledge.factBank.map(f=>[f.id,f.text]),originalScene.knowledge.factBank.map(f=>[f.id,f.text]));
console.info=()=>{};
globalThis.fetch=async(url,opts={})=>{
 const u=String(url);
 if(u.includes('budget-test.supabase.co')){
  if(u.includes('ps_allow_interview'))return {ok:true,status:200,json:async()=>true};
  if(u.includes('ps_commit_session')){const b=JSON.parse(opts.body);assert.equal(b.p_expected_revision,revision);state=b.p_approved_state;revision++;return {ok:true,status:200,json:async()=>true};}
  return {ok:true,status:200,json:async()=>[{revision,approved_state:state}]};
 }
 if(u.includes('api.z.ai'))return {ok:false,status:503,json:async()=>({error:{status:'UNAVAILABLE',message:'Model overloaded'}}),headers:{get:()=>null}};
 const body=JSON.parse(opts.body),payload=JSON.parse(body.messages[1].content);
 if(mode==='large')return {ok:false,status:413,headers:{get:k=>k==='retry-after'?'12':null},json:async()=>({error:{code:'rate_limit_exceeded',message:'Request too large for model on tokens per minute (TPM): Limit 8000, Requested 12345'}})};
 assert(!('reasoning_effort' in body));
 if(payload.knowledge?.factBank){
  answerCalls++;assert.equal(body.max_tokens,1200);assert.equal(payload.question,q);
  assert.deepEqual(payload.knowledge.factBank.map(f=>[f.id,f.text]),originalScene.knowledge.factBank.map(f=>[f.id,f.text]));
  assert.equal(body.messages[0].content,interviewAnswerSystem);
  wireSizes.push(body.messages[0].content.length+body.messages[1].content.length);
  const f=payload.knowledge.factBank.find(f=>f.text.includes('Janusz Wójcik może potwierdzić'));
  return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'answer',factIds:[f.id],text:f.text})}}]})};
 }
 assert.equal(body.max_tokens,900);assert(Array.isArray(payload.questionParts));
 return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify({relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:payload.questionParts.map(()=>true)})}}]})};
};
const canonical='Publiczna odpowiedź lokalna.';
const context={schema:'ps-witness-context/1',identity:{id:'MAREK'},knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}]},psychology:{contradictions:[]},memory:{conversation:[]}};
async function submit(){let result;const res={setHeader(){return this},status(s){this.code=s;return this},json(body){result={status:this.code||200,body};return this}};await handler({method:'POST',headers:{host:'budget.test'},body:{version:3,witnessId:'MAREK',question:q,canonical,context,turnId:randomUUID()}},res);return result;}
try{
 const good=await submit();assert.equal(good.status,200,JSON.stringify(good));assert.equal(good.body.provider,'apinex-luna');assert.equal(answerCalls,1);
 assert(wireSizes[0]<17000,'Request still too large in representative case');
 state=fresh();mode='large';const bad=await submit();
 assert.equal(bad.status,200);assert.equal(bad.body.provider,'local');assert(bad.body.fallbackReason.includes('apinex-luna_request_too_large'));
 assert.equal(bad.body.retryAfterSeconds,undefined,'A 413 is not fixed by the displayed cooldown alone');
 const d=bad.body.providerFailures.find(f=>f.provider==='apinex-luna');assert.equal(d.tokenLimit,8000);assert.equal(d.requestedTokens,12345);assert(d.inputCharacters>0);assert.equal(d.parameterIssue,'unknown');
 const details=await providerErrorDetails({status:429,headers:{get:()=>null},json:async()=>({error:{code:'rate_limit_exceeded',message:'tokens per minute TPM'}})});assert.equal(details.requestTooLarge,false);
 console.log(JSON.stringify({result:'PASS RC25 request budget',wireCharacters:wireSizes[0],factsPreserved:wire.knowledge.factBank.length,liveAPI:'not_run'}));
}finally{globalThis.fetch=oldFetch;console.info=oldInfo;for(const k of envKeys)if(oldEnv[k]===undefined)delete process.env[k];else process.env[k]=oldEnv[k];}
