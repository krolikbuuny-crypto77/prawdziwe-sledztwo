/** RC58 real /api/interview handler + CAS with mocked Supabase and authored local
 * provider. No network, no actual cloud responses. 72 complete HTTP flows. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
process.env.GAME_SESSION_SECRET='RC58_LOCAL_TEST_ONLY_'.repeat(3);
process.env.SUPABASE_URL='https://fake-supabase.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY='NOT_REAL_SERVICE_KEY_TEST_ONLY';
delete process.env.APINEX_API_KEY;
const {default:handler}=await import('../api/interview.js');
const {initialState}=await import('../lib/server-state.js');
const sessions=new Map();let calls={reads:0,writes:0,limits:0,upstream:0};
const response=(value,status=200)=>new Response(value===null?'':JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
globalThis.fetch=async (url,opt={})=>{
 const u=String(url);if(u.startsWith('https://api.apinex.bond')){calls.upstream++;throw Error('External calls must never be made in local test');}
 const parsed=new URL(u),path=parsed.pathname;
 if(path.endsWith('/ps_game_sessions')&&opt.method==='POST'){
  const body=JSON.parse(opt.body),id=body.session_id;
  if(!sessions.has(id))sessions.set(id,{revision:0,state:initialState()});
  return response(null,201);
 }
 if(path.endsWith('/ps_game_sessions')&&(opt.method||'GET')==='GET'){
  calls.reads++;const id=(parsed.searchParams.get('session_id')||'').replace(/^eq\./,'');
  const found=sessions.get(id);return response(found?[{revision:found.revision,approved_state:found.state}]:[]);
 }
 if(path.endsWith('/rpc/ps_allow_interview')){calls.limits++;return response(true);}
 if(path.endsWith('/rpc/ps_commit_session')){
  calls.writes++;const b=JSON.parse(opt.body),record=sessions.get(b.p_session_id);
  if(!record||record.revision!==b.p_expected_revision)return response(false);
  sessions.set(b.p_session_id,{revision:record.revision+1,state:b.p_approved_state});return response(true);
 }
 throw Error('Unexpected Supabase request '+u);
};
const IDs=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const questions=['Jaką funkcję pełnisz?','Jakie masz alibi?','Co robiłeś po północy?','Nie pytam o Lenę, gdzie byłeś?','Kto może potwierdzić twoją wersję?','Co wiesz o Krawczyku?','Co sądzisz o Nowickim?','Czy miałeś kontakt z Leną?','Gdzie są dokumenty?','Czy mnie okłamujesz?','Skąd to wiesz?','Co możesz potwierdzić?'];
let cookie='';const output=[];
const ask=async(witnessId,question,turnId=randomUUID())=>{
 const canonical='Nie mam pełnej wiedzy o zdarzeniu.';
 const req={method:'POST',headers:{host:'localhost',origin:'http://localhost',...(cookie?{cookie}:{}),
  'x-forwarded-proto':'https','x-forwarded-for':'192.0.2.44'},body:{version:3,witnessId,question,canonical,turnId,localOnly:true,
  context:{schema:'ps-witness-context/1',identity:{id:witnessId,name:'Świadek',role:'Świadek'},
   knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}]},
   psychology:{contradictions:[]},memory:{conversation:[]}}}};
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(code){this.statusCode=code;return this;},json(v){this.body=v;return this;}};
 await handler(req,res);
 if(res.headers['Set-Cookie']&&!cookie)cookie=res.headers['Set-Cookie'].split(';')[0];
 return res;
};
for(const id of IDs)for(const q of questions){
 const res=await ask(id,q);output.push(res);
 assert.equal(res.statusCode,200,JSON.stringify({id,q,response:res.body}).slice(0,300));
 assert.equal(res.body.serverCanonical,true);assert.equal(res.body.provider,'local');
 assert.equal(res.body.providerCalls,0,'No external model called');
 assert.equal(typeof res.body.turnId,'string');
}
assert.equal(output.length,72);
const firstState=[...sessions.values()][0].state;
assert.equal(firstState.witnessLedgers.MAREK.events.length,12);
const reference=firstState.witnessLedgers.MAREK.events[0].receiptId;
const opening=firstState.interviewReceipts[reference].text;
const exact=await ask('MAREK','Co powiedziałeś na początku tej rozmowy?');
assert.equal(exact.statusCode,200,JSON.stringify(exact.body).slice(0,260));
assert.equal(exact.body.exactPriorQuote,true);
assert(exact.body.text.includes(opening),'Exact first reply from server receipt');
assert.equal(exact.body.providerCalls,0);
const previous=await ask('MAREK','Powtórz swoją poprzednią odpowiedź.');
assert.equal(previous.statusCode,200);
assert.equal(previous.body.exactPriorQuote,true);
// Idempotent replay must not add a new witness event or charge a quota.
const checkTurn=randomUUID();const once=await ask('KAMIL','Co możesz potwierdzić?',checkTurn);
const before=calls.limits;const twice=await ask('KAMIL','Co możesz potwierdzić?',checkTurn);
assert.equal(twice.statusCode,200);assert.equal(twice.body.replayed,true);
assert.equal(twice.body.text,once.body.text);assert.equal(calls.limits,before);
// 24 additional turns of the same witness, then the opening still remains exact.
for(let i=0;i<24;i++)assert.equal((await ask('JANUSZ',questions[i%questions.length])).statusCode,200);
const old=[...sessions.values()][0].state;
const januszFirst=old.interviewReceipts[old.witnessLedgers.JANUSZ.events[0].receiptId].text;
const recall=await ask('JANUSZ','Co powiedziałeś na początku tej rozmowy?');
assert.equal(recall.statusCode,200);assert(recall.body.text.includes(januszFirst));
assert.equal(recall.body.providerCalls,0);
const durations=output.map(r=>r.body.totalDurationMs).filter(Number.isFinite);
const avg=Math.round(durations.reduce((a,b)=>a+b,0)/durations.length);const max=Math.max(...durations);
console.log(JSON.stringify({mode:'mocked_supabase_real_endpoint_local_provider',questions:72,additionalTurns:24,
 successes:output.filter(r=>r.statusCode===200).length,errors:output.filter(r=>r.statusCode>=400).length,
 externalApiCalls:calls.upstream,quotaChecks:calls.limits,stateCommits:calls.writes,averageMs:avg,maxMs:max,
 verified:{opening:3,previous:1,replay:1,source:'server_receipts_and_ledger'},status:'PASS'}));
