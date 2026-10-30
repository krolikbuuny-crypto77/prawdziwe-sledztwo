import assert from 'node:assert/strict';
import {askGemini,askGroq,providerErrorDetails} from '../lib/ai-providers-rc7.js';
const prior=[process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY];
process.env.GEMINI_API_KEY='secret-test-key';process.env.GROQ_API_KEY='secret-test-key';
const mock=(status,error,retry)=>async()=>({ok:false,status,headers:{get:k=>k==='retry-after'?retry:null},json:async()=>({error})});
try{
 await assert.rejects(()=>askGemini({system:'private-question',payload:{}},mock(400,{status:'INVALID_ARGUMENT',message:'thinking config invalid private-question secret-test-key'})),e=>{
  assert.equal(e.code,'upstream_invalid_request');assert.equal(e.diagnostic.upstreamStatus,400);
  assert.equal(e.diagnostic.upstreamCode,'INVALID_ARGUMENT');assert.equal(e.diagnostic.parameterIssue,'thinking_config');
  assert(!JSON.stringify(e).includes('secret-test-key'));assert(!JSON.stringify(e).includes('private-question'));return true;
 });
 await assert.rejects(()=>askGroq({system:'private-question',payload:{}},mock(429,{code:'rate_limit_exceeded',message:'Tokens per minute (TPM) exceeded secret-test-key'},'42.2')),e=>{
  assert.equal(e.diagnostic.quotaKind,'tokens_per_minute');assert.equal(e.diagnostic.retryAfterSeconds,43);
  assert.equal(e.diagnostic.upstreamStatus,429);assert(!JSON.stringify(e).includes('secret-test-key'));return true;
 });
 const google=await providerErrorDetails({status:429,json:async()=>({error:{status:'RESOURCE_EXHAUSTED',details:[{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:'12.5s'}]}})});
 assert.equal(google.retryAfterSeconds,13);
 const date=await providerErrorDetails({status:503,headers:{get:()=>new Date(60000).toUTCString()},json:async()=>({})},0);
 assert.equal(date.retryAfterSeconds,60);
 const unsafe=await providerErrorDetails({status:400,headers:{get:()=> 'secret-test-key'},json:async()=>({error:{code:'secret-test-key',message:'private-question'}})});
 assert.equal(unsafe.upstreamCode,'unknown');assert.equal(unsafe.retryAfterSeconds,null);
 const malformed=await providerErrorDetails({status:502,json:async()=>{throw Error('HTML secret-test-key');}});
 assert.equal(malformed.upstreamCode,'unknown');assert.equal(malformed.upstreamStatus,502);
 console.log('PASS RC13: HTTP and allowlisted error codes, quota classification, Retry-After seconds/date/Google RetryInfo, malformed error bodies, no raw secrets or messages');
}finally{
 for(const [i,k] of ['GEMINI_API_KEY','GROQ_API_KEY'].entries())if(prior[i]===undefined)delete process.env[k];else process.env[k]=prior[i];
}
