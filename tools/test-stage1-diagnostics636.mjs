import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {trustedScene} from '../lib/trusted-interview-624.js';
import canon from '../lib/trusted-witness-canon-624.json' with {type:'json'};
const original={fetch:globalThis.fetch,info:console.info,z:process.env.ZAI_API_KEY,g:process.env.GROQ_API_KEY};
process.env.ZAI_API_KEY='test-only';delete process.env.GROQ_API_KEY;
process.env.GAME_SESSION_SECRET='diag-secret'.padEnd(40,'x');
process.env.SUPABASE_URL='https://diag-test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='diag-service-secret';
const {default:handler}=await import('../api/interview.js');
const {initialState}=await import('../lib/server-state.js');
let state=initialState(),revision=0;
const id='JANUSZ',canonical=canon.profiles[id].voice.opening;
const question='Co dokładnie wynika z dokumentacji zlecenia?';
const ctx={schema:'ps-witness-context/1',identity:{id,name:'Janusz'},knowledge:{currentGroundedAnswer:canonical,
 groundedOptions:[{id:'turn',kind:'current',text:canonical}],alreadySaid:[],documentsShown:[]},
 memory:{conversation:[]},psychology:{contradictions:[],blocked:false}};
let logs=[];const calls=[];
console.info=(...args)=>logs.push(args.join(' '));
globalThis.fetch=async(url,init)=>{
 if(String(url).includes('diag-test.supabase.co')){
  if(String(url).includes('rpc/ps_allow_interview'))return {ok:true,status:200,json:async()=>true};
  if(String(url).includes('rpc/ps_commit_session')){
   state=JSON.parse(init.body).p_approved_state;revision++;
   return {ok:true,status:200,json:async()=>true};
  }
  return {ok:true,status:200,json:async()=>[{revision,approved_state:state}]};
 }
 assert(String(url).includes('api.z.ai'));
 const body=JSON.parse(init.body);calls.push(body);
 const proposed=trustedScene({identity:{id},question,knowledge:{documentsShown:[]}},null).knowledge.factBank[0].text;
 return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'answer',factIds:['f0'],text:proposed})}}]})};
};
const res={code:0,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
try{
 await handler({method:'POST',headers:{host:'audit-test.local'},socket:{remoteAddress:'diag-636'},body:{version:3,witnessId:id,canonical,question,context:ctx,turnId:randomUUID()}},res);
 assert.equal(res.code,200);assert.equal(res.body.provider,'zai');
 assert.equal(res.body.qualityDiagnostics.version,'6.36-I');
 assert(res.body.qualityDiagnostics.attempts.some(x=>x.phase==='generate'));
 assert.equal(res.body.qualityDiagnostics.providerCalls,calls.length);
 assert(logs.some(x=>x.includes('interview-diagnostic')));
 assert(!logs.join('').includes(question));
 assert(!logs.join('').includes(canonical));
 console.log('PASS 6.36-I API telemetry: provider, individual phases, request-safe log, no question or transcript in diagnostics');
}finally{
 globalThis.fetch=original.fetch;console.info=original.info;
 for(const [key,value] of [['ZAI_API_KEY',original.z],['GROQ_API_KEY',original.g]])if(value===undefined)delete process.env[key];else process.env[key]=value;
}
