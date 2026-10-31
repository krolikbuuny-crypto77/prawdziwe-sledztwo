import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {askInterviewProvider} from '../lib/interview-providers-rc24.js';
import {localInterviewReply} from '../lib/interview-local-rc24.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
process.env.GAME_SESSION_SECRET='rc24-test-'.padEnd(40,'k');process.env.SUPABASE_URL='https://rc24.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='dummy';process.env.ZAI_API_KEY='dummy';process.env.MISTRAL_API_KEY='dummy';
const {initialState}=await import('../lib/server-state.js');const {default:handler}=await import('../api/interview.js');
const savedFetch=globalThis.fetch,savedInfo=console.info;
const fresh=()=>({...initialState(),witnesses:{...initialState().witnesses,MAREK:[{role:'player',text:'Masz alibi?'},{role:'witness',text:'Nadzorowałem nocną zmianę, byłem dostępny z biura.'}]}});
let state=fresh(),revision=0,mode='zai',calls=[],commits=0,forceConflict=false;
console.info=()=>{};
const response=data=>({ok:true,status:200,json:async()=>data});
globalThis.fetch=async(url,options={})=>{
 const u=String(url);
 if(u.includes('rc24.supabase.co')){
  if(u.includes('ps_allow_interview'))return response(true);
  if(u.includes('ps_commit_session')){const b=JSON.parse(options.body);if(forceConflict)return response(false);assert.equal(b.p_expected_revision,revision);state=b.p_approved_state;revision++;commits++;return response(true);}
  return response([{revision,approved_state:state}]);
 }
 const provider=u.includes('api.z.ai')?'zai':u.includes('api.mistral.ai')?'mistral':'UNEXPECTED';assert.notEqual(provider,'UNEXPECTED',u);
 const b=JSON.parse(options.body),p=JSON.parse(b.messages[1].content);calls.push(provider);
 assert.equal(b.model,provider==='zai'?'glm-4.7-flash':'mistral-small-latest');assert(b.max_tokens<=1200);assert.equal(b.response_format.type,'json_object');
 if(provider==='zai')assert.deepEqual(b.thinking,{type:'disabled'});else assert(!('thinking' in b));
 if(mode==='timeout'||mode==='audit-timeout'&&!p.knowledge?.factBank||mode==='mistral'&&provider==='zai')throw Object.assign(new Error('aborted'),{name:'AbortError'});
 if(mode==='broken')return {ok:false,status:429,headers:{get:k=>k==='retry-after'?'32':null},json:async()=>({error:{code:'rate_limit_exceeded'}})};
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
 for(const chosen of ['zai','mistral','timeout','audit-timeout','broken','bad-json','bad-ids']){
  mode=chosen;state=fresh();calls=[];
  const id=randomUUID(),r=await submit({id});assert.equal(r.status,200,JSON.stringify(r));
  const expected=['zai','mistral'].includes(chosen)?chosen:'local';assert.equal(r.body.provider,expected,chosen);
  assert(r.body.text.includes('Janusz Wójcik może potwierdzić'),JSON.stringify(r.body));
  assert(!r.body.text.includes(canonical));assert.equal(state.witnesses.MAREK.length,4);
  assert.equal(r.body.semanticVerified,expected!=='local');if(expected==='local')assert.equal(r.body.localVerified,true);
  if(chosen==='mistral')assert.equal(calls[0],'zai');if(chosen==='zai')assert(calls.every(x=>x==='zai'));
  const oldCalls=calls.length,oldCommits=commits;const replay=await submit({id});assert.equal(replay.body.replayed,true);assert.equal(replay.body.text,r.body.text);assert.equal(calls.length,oldCalls);assert.equal(commits,oldCommits);
  assert.equal((await submit({id,q:'Inne pytanie'})).status,409);
 }
 state=fresh();calls=[];assert.equal((await submit({localOnly:true})).body.provider,'local');assert.equal(calls.length,0);
 delete process.env.ZAI_API_KEY;delete process.env.MISTRAL_API_KEY;state=fresh();assert.equal((await submit()).body.provider,'local');assert.equal(calls.length,0);
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
 console.log('PASS RC24: Z.ai success; timeout -> Mistral; both failures/invalid replies -> local; no keys -> local; safe knowledge; local-only; durable replay; failed CAS; hard timeout. Live API: not run.');
}finally{globalThis.fetch=savedFetch;console.info=savedInfo;}
