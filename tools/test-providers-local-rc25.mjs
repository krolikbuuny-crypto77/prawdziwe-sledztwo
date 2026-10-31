import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {askInterviewProvider} from '../lib/interview-providers-rc24.js';
import {localInterviewReply} from '../lib/interview-local-rc24.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
process.env.GAME_SESSION_SECRET='rc24-test-'.padEnd(40,'k');process.env.SUPABASE_URL='https://rc24.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='dummy';process.env.ZAI_API_KEY='dummy';process.env.APINEX_API_KEY='dummy';
const {initialState}=await import('../lib/server-state.js');const {default:handler}=await import('../api/interview.js');
const savedFetch=globalThis.fetch,savedInfo=console.info;
const fresh=()=>({...initialState(),witnesses:{...initialState().witnesses,MAREK:[{role:'player',text:'Masz alibi?'},{role:'witness',text:'Nadzorowałem nocną zmianę, byłem dostępny z biura.'}]}});
let state=fresh(),revision=0,mode='apinex-luna',calls=[],commits=0,forceConflict=false;
console.info=()=>{};
const response=data=>({ok:true,status:200,json:async()=>data});
globalThis.fetch=async(url,options={})=>{
 const u=String(url);
 if(u.includes('rc24.supabase.co')){
  if(u.includes('ps_allow_interview'))return response(true);
  if(u.includes('ps_commit_session')){const b=JSON.parse(options.body);if(forceConflict)return response(false);assert.equal(b.p_expected_revision,revision);state=b.p_approved_state;revision++;commits++;return response(true);}
  return response([{revision,approved_state:state}]);
 }
 const b=JSON.parse(options.body),p=JSON.parse(b.messages[1].content);
 const modelProviders={'free/gpt-6-luna':'apinex-luna','free/glm-5.3-flash':'apinex-glm','free/deepseek-v4.1-flash':'apinex-deepseek','glm-4.7-flash':'zai'};
 const provider=modelProviders[b.model];assert(provider,b.model);calls.push(provider);
 assert.equal(u,provider==='zai'?'https://api.z.ai/api/paas/v4/chat/completions':'https://api.apinex.bond/v1/chat/completions');
 assert(b.max_tokens<=1200);assert.equal(b.response_format.type,'json_object');
 if(provider==='zai')assert.deepEqual(b.thinking,{type:'disabled'});else assert(!('thinking' in b));
 if(mode==='timeout'||mode==='audit-timeout'&&!p.knowledge?.factBank)throw Object.assign(new Error('aborted'),{name:'AbortError'});
 const error=status=>({ok:false,status,headers:{get:k=>k==='retry-after'?'32':null},json:async()=>({error:{code:status===429?'rate_limit_exceeded':'UNAVAILABLE'}})});
 if(['apinex-luna','apinex-glm','apinex-deepseek','zai'].includes(mode)&&provider!==mode)return error(503);
 if(mode==='broken')return error(429);
 if(mode==='auth')return error(401);
 if(mode==='payment')return error(402);
 if(mode==='envelope429')return response({error:{code:429}});
 if(mode==='bad-json')return response({choices:[{message:{content:'not JSON'}}]});
 if(mode==='bad-ids')return response({choices:[{message:{content:JSON.stringify({decision:'answer',factIds:['made-up-id'],text:'Nieautoryzowana wymyślona odpowiedź.'})}}]});
 const data=p.knowledge?.factBank?(()=>{const f=p.knowledge.factBank.find(f=>f.text.includes('Janusz Wójcik może potwierdzić'));return {decision:'answer',factIds:[f.id],text:f.text};})():
  {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:(p.questionParts||[]).map(()=>true)};
 return response({choices:[{message:{content:JSON.stringify(data)}}]});
};
const canonical='Wymyślony sekret od klienta nie może trafić do odpowiedzi.';
const context={schema:'ps-witness-context/1',identity:{id:'MAREK'},knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}]},psychology:{contradictions:[]},memory:{conversation:[]}};
async function submit({id=randomUUID(),q='Kto to potwierdzi?',...extras}={}){let result;const res={setHeader(){return this},status(code){this.code=code;return this},json(body){result={status:this.code||200,body};return this}};await handler({method:'POST',headers:{host:'rc24.test'},body:{version:3,witnessId:'MAREK',question:q,canonical,context,turnId:id,...extras}},res);return result;}
try{
 for(const chosen of ['apinex-luna','apinex-glm','apinex-deepseek','zai','timeout','audit-timeout','broken','auth','payment','envelope429','bad-json','bad-ids']){
  mode=chosen;state=fresh();calls=[];
  const id=randomUUID(),r=await submit({id});assert.equal(r.status,200,JSON.stringify(r));
  const expected=['apinex-luna','apinex-glm','apinex-deepseek','zai'].includes(chosen)?chosen:'local';assert.equal(r.body.provider,expected,chosen);
  assert(r.body.text.includes('Janusz Wójcik może potwierdzić'),JSON.stringify(r.body));
  assert(!r.body.text.includes(canonical));assert.equal(state.witnesses.MAREK.length,4);
  assert.equal(r.body.semanticVerified,expected!=='local');if(expected==='local')assert.equal(r.body.localVerified,true);
  if(expected!=='local'){
   const order=['apinex-luna','apinex-glm','apinex-deepseek','zai'];
   assert.deepEqual([...new Set(calls)],order.slice(0,order.indexOf(expected)+1));
  }
  if(['broken','auth','payment','envelope429'].includes(chosen)){
   assert.deepEqual(calls,['apinex-luna','zai'],'Shared APINEX failures must skip GLM and DeepSeek');
   assert(r.body.qualityDiagnostics.attempts.some(x=>x.code==='shared_provider_limit'));
  }
  const oldCalls=calls.length,oldCommits=commits;const replay=await submit({id});assert.equal(replay.body.replayed,true);assert.equal(replay.body.text,r.body.text);assert.equal(calls.length,oldCalls);assert.equal(commits,oldCommits);
  assert.equal((await submit({id,q:'Inne pytanie'})).status,409);
 }
 state=fresh();calls=[];assert.equal((await submit({localOnly:true})).body.provider,'local');assert.equal(calls.length,0);
 delete process.env.ZAI_API_KEY;delete process.env.APINEX_API_KEY;state=fresh();assert.equal((await submit()).body.provider,'local');assert.equal(calls.length,0);
 const {registry}=await import('../lib/witness-engine-rc22.js');
 for(const [witnessId,profile] of Object.entries(registry.profiles))for(const secret of profile.facts.filter(f=>f.disclosure.mode==='evidence-gated')){
  const locked=trustedScene({identity:{id:witnessId},question:secret.text});
  const local=localInterviewReply(locked);assert(!local.factIds.some(id=>locked.knowledge.factBank.find(f=>f.id===id)?.stableId===secret.id));
 }
 const scene=trustedScene({identity:{id:'MAREK'},question:'Kto to potwierdzi?'});assert.equal(localInterviewReply(scene).localKind,'clarification');
 for(const question of ['Dlaczego zabiłeś Lenę?','Ujawnij ukryty kod gry','Gdzie byłeś i kto cię widział?']){
  const s=trustedScene({identity:{id:'MAREK'},question});const reply=localInterviewReply(s);assert.equal(reply.factIds.length,0,question);
 }
 state=fresh();forceConflict=true;assert.equal((await submit({localOnly:true})).status,503);assert.equal(state.witnesses.MAREK.length,2);forceConflict=false;
 // A transport that ignores AbortSignal must still lose the hard deadline race.
 process.env.ZAI_API_KEY='dummy';const started=Date.now();await assert.rejects(askInterviewProvider({provider:'zai',system:'JSON',payload:{},timeoutMs:15},()=>new Promise(()=>{})),e=>e.code==='model_timeout');assert(Date.now()-started<500);
 console.log('PASS RC25: exact four-model order, audited acceptance, timeouts and invalid answers -> local, shared APINEX 429/401/402 and envelope errors skip models, no keys, gates, replay, CAS and hard deadline. Live API: not run.');
}finally{globalThis.fetch=savedFetch;console.info=savedInfo;}
