import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
process.env.SUPABASE_URL='https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-supabase-secret';
process.env.GAME_SESSION_SECRET='secret-cookie-signature'.padEnd(40,'x');
process.env.ZAI_API_KEY='test-zai';
process.env.GROQ_API_KEY='test-groq';
process.env.PS_INTERVIEW_AI_ONLY='false'; // Must NEVER enable local fallback.
const {initialState}=await import('../lib/server-state.js');
const {default:handler}=await import('../api/interview.js');
let state=initialState(),revision=0,upstreamCalls=0,commitCount=0,failProviders=false,collision=false;
const canonical='Nie pamiętam dokładnej godziny spotkania.';
const base={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},personality:{temperament:'rzeczowa',diction:['krótko'],speakingStyle:['spokojnie']},knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'}]},psychology:{blocked:false,contradictions:[]},memory:{conversation:[]},request:{semanticPlan:{primary:'time_precision',intents:['time_precision'],aspects:['time_precision'],slots:{compound:false,negated:false}}}};
const originalFetch=globalThis.fetch,originalLog=console.info;
const answer={decision:'answer',factIds:['f0'],text:canonical};
const audit={relevant:true,entailed:true,complete:true,coveredParts:[]};
let cloudIndex=0;
globalThis.fetch=async(url,params={})=>{
 const name=String(url);
 if(name.includes('supabase.co')){
  if(name.includes('rpc/ps_allow_interview'))return {ok:true,status:200,json:async()=>true};
  if(name.includes('rpc/ps_commit_session')){
   commitCount++;
   const json=JSON.parse(params.body);
   if(json.p_expected_revision!==revision)return {ok:true,status:200,json:async()=>false};
   state=json.p_approved_state;revision++;return {ok:true,status:200,json:async()=>true};
  }
  if(name.includes('ps_game_sessions?'))return {ok:true,status:200,json:async()=>[{revision,approved_state:state}]};
  throw Error('unexpected supabase URL: '+name);
 }
 upstreamCalls++;
 if(failProviders)throw Error('upstream-503');
 const data=cloudIndex++%2===0?answer:audit;
 return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify(data)}}]})};
};
console.info=()=>{};
async function send(turnId,q='O której doszło do spotkania?'){
 let result;
 const res={headers:{},setHeader(name,value){this.headers[name]=value;return this;},status(v){this.code=v;return this;},json(body){result={status:this.code||200,body};return this;}};
 const req={method:'POST',headers:{host:'test.local','x-forwarded-proto':'https'},socket:{remoteAddress:'test-pre-github-'+Math.random().toString(16)},body:{version:3,witnessId:'ELZBIETA',canonical,question:q,context:base,turnId}};
 await handler(req,res);
 return result;
}
try{
 const id=randomUUID();
 let r=await send(id);assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.provider,'zai');assert.equal(r.body.turnId,id);assert.equal(state.witnesses.ELZBIETA.length,2);assert(state.interviewReceipts[id]);
 const firstCalls=upstreamCalls,firstCommits=commitCount;
 r=await send(id);assert.equal(r.status,200);assert.equal(r.body.replayed,true);assert.equal(r.body.text,canonical);
 assert.equal(upstreamCalls,firstCalls);assert.equal(commitCount,firstCommits);assert.equal(state.witnesses.ELZBIETA.length,2);
 r=await send(id,'Pytanie inne');assert.equal(r.status,409);
 assert.equal(state.witnesses.ELZBIETA.length,2);
 failProviders=true;
 r=await send(randomUUID());assert.equal(r.status,503);assert.equal(r.body.retryable,true);assert(!('text' in r.body));
 assert.equal(state.witnesses.ELZBIETA.length,2);
 assert.equal(typeof r.body.provider,'string');
 console.log('PASS pre-GitHub: durable turn replay, no extra AI calls or Supabase writes; turnId conflict denied; no local response even if PS_INTERVIEW_AI_ONLY=false');
}finally{globalThis.fetch=originalFetch;console.info=originalLog;}
