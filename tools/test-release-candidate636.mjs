import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const snapshot={fetch:globalThis.fetch,z:process.env.ZAI_API_KEY,g:process.env.GROQ_API_KEY,s:process.env.GAME_SESSION_SECRET,u:process.env.SUPABASE_URL,k:process.env.SUPABASE_SERVICE_ROLE_KEY,info:console.info,gem:process.env.GEMINI_API_KEY,google:process.env.GOOGLE_AI_STUDIO_API_KEY};
process.env.GAME_SESSION_SECRET='release-test-secret-'.padEnd(40,'k');
process.env.SUPABASE_URL='https://release-test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='release-test-key';
process.env.ZAI_API_KEY='release-test-zai';delete process.env.GEMINI_API_KEY;delete process.env.GOOGLE_AI_STUDIO_API_KEY;
const {initialState,appendReportedTurn,approvedHistory}=await import('../lib/server-state.js');
const {default:handler}=await import('../api/interview.js');
const canonical='Nie pamiętam dokładnej godziny spotkania.';
const context={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},personality:{temperament:'rzeczowa',diction:['krótko'],speakingStyle:['spokojnie']},knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'}]},psychology:{blocked:false,contradictions:[]},memory:{conversation:[]},request:{semanticPlan:{primary:'time_precision',intents:['time_precision'],aspects:['time_precision'],slots:{compound:false,negated:false}}}};
let state=initialState(),revision=0,quota=true,quotaCalls=0,apiCalls=0,commits=0;
const audit={relevant:true,entailed:true,complete:true,coveredParts:[]};
let modelIndex=0,interfereOnCommit=false;
console.info=()=>{};
globalThis.fetch=async(url,init={})=>{
 const href=String(url);
 if(href.includes('supabase.co')){
  if(href.includes('rpc/ps_allow_interview')){quotaCalls++;return {ok:true,status:200,json:async()=>quota};}
  if(href.includes('rpc/ps_commit_session')){
   commits++;const body=JSON.parse(init.body);
   if(interfereOnCommit){interfereOnCommit=false;state=appendReportedTurn(state,'ELZBIETA','Równoległe pytanie','Nowa równoległa deklaracja.',[],'unresolved_statement',{turnId:'concurrent-turn'});revision++;return {ok:true,status:200,json:async()=>false};}
   if(body.p_expected_revision!==revision)return {ok:true,status:200,json:async()=>false};
   state=body.p_approved_state;revision++;return {ok:true,status:200,json:async()=>true};
  }
  if(href.includes('ps_game_sessions?'))return {ok:true,status:200,json:async()=>[{approved_state:state,revision}]};
  throw Error('Unexpected Supabase operation '+href);
 }
 apiCalls++;const payload=modelIndex++%2?audit:{decision:'answer',factIds:['f0'],text:canonical};
 return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify(payload)}}]})};
};
async function submit(turnId,question='O której doszło do spotkania?'){
 let result=null;
 const res={setHeader(){return this;},status(x){this.code=x;return this;},json(x){result={status:this.code||200,body:x};return this;}};
 const req={method:'POST',headers:{host:'release.local',cookie:'', 'x-forwarded-proto':'https'},socket:{remoteAddress:'release-test'},body:{version:3,witnessId:'ELZBIETA',canonical,question,context,turnId}};
 await handler(req,res);return result;
}
try{
 let id=randomUUID(),r=await submit(id);
 assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.turnId,id);assert.equal(r.body.provider,'zai');
 assert.equal(state.interviewReceipts[id].question,'O której doszło do spotkania?');
 const calls=apiCalls,used=quotaCalls,saved=commits;
 r=await submit(id);assert.equal(r.status,200);assert.equal(r.body.replayed,true);
 assert.equal(apiCalls,calls);assert.equal(quotaCalls,used);assert.equal(commits,saved);
 // Thirty further turns push the first dialogue row out of the bounded transcript,
 // while the independent receipt survives and replays the same authoritative text.
 for(let j=0;j<30;j++)state=appendReportedTurn(state,'ELZBIETA',`Pytanie długiej rozmowy nr ${j}`,`Odpowiedź przypisana do numeru ${j} i do kanonu.`,['f0'],'unresolved_statement',{turnId:randomUUID(),provider:'zai',model:'glm-test'});
 assert.equal(approvedHistory(state,'ELZBIETA').length,48);
 assert(!approvedHistory(state,'ELZBIETA').some(x=>x.turnId===id));
 r=await submit(id);assert.equal(r.status,200);assert.equal(r.body.replayed,true);assert.equal(apiCalls,calls);
 const long='O której doszło do spotkania? '+ 'a'.repeat(1550);
 assert(long.length<=1600);
 const longId=randomUUID();state=appendReportedTurn(state,'ELZBIETA',long,'Zeznanie zachowane mimo długiego pytania.',[],'unresolved_statement',{turnId:longId,provider:'zai',model:'glm-test'});
 assert.equal(state.interviewReceipts[longId].question,long);
 r=await submit(longId,long);assert.equal(r.status,200);assert.equal(r.body.replayed,true);
 r=await submit(longId,long+'!');assert.equal(r.status,409);
 r=await submit(randomUUID(),'X'.repeat(1601));assert.equal(r.status,400);
 r=await submit(null);assert.equal(r.status,400);
 quota=false;r=await submit(randomUUID());assert.equal(r.status,429);assert.equal(r.body.error,'Interview rate limit');assert.equal(apiCalls,calls);
 quota=true;interfereOnCommit=true;const staleId=randomUUID();r=await submit(staleId);assert.equal(r.status,409);assert.equal(r.body.retryable,true);assert(!state.interviewReceipts[staleId]);assert(state.interviewReceipts['concurrent-turn']);
 console.log('PASS release 6.36: first-response turnId, durable replay after 30 more turns, 1580-character questions, mismatched ID rejected, distributed quota fail-closed');
}finally{
 globalThis.fetch=snapshot.fetch;console.info=snapshot.info;
 for(const [name,value] of [['GEMINI_API_KEY',snapshot.gem],['GOOGLE_AI_STUDIO_API_KEY',snapshot.google],['ZAI_API_KEY',snapshot.z],['GROQ_API_KEY',snapshot.g],['GAME_SESSION_SECRET',snapshot.s],['SUPABASE_URL',snapshot.u],['SUPABASE_SERVICE_ROLE_KEY',snapshot.k]]){
  if(value===undefined)delete process.env[name];else process.env[name]=value;
 }
}
