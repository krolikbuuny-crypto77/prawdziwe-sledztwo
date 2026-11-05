import assert from 'node:assert/strict';
import {askInterviewProvider} from '../lib/interview-providers-rc24.js';
import {resetTrafficForTests} from '../lib/apinex-traffic-rc5710.js';
import {takeApinexSlot} from '../lib/apinex-shared-quota-rc5710.js';
process.env.APINEX_API_KEY='DUMMY_RC58_LOCAL_TEST_KEY';
delete process.env.APINEX_DISTRIBUTED_QUEUE_ENABLED;
delete process.env.APINEX_SHARED_QUOTA_ENABLED;
const makeResponse=(obj,status,headers={})=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json',...headers}});
const opts={provider:'apinex-luna',system:'You are testing.',payload:{question:'test'},maxTokens:200,timeoutMs:2500};
resetTrafficForTests();let calls=0;
await assert.rejects(()=>askInterviewProvider(opts,async(url,request)=>{
 calls++;assert(url.startsWith('https://api.apinex.bond/'));assert(request.headers.Authorization.startsWith('Bearer '));
 return makeResponse({error:{code:'rate_limit_exceeded',message:'Try later'}},429,{'Retry-After':'8'});
}),error=>error.code==='upstream_rate_limit'&&error.diagnostic.retryAfterSeconds===8&&error.diagnostic.requestDispatched===true);
assert.equal(calls,1,'429 not transparently retried');
resetTrafficForTests();
await assert.rejects(()=>askInterviewProvider(opts,async()=>makeResponse({error:{message:'gateway unavailable'}},502)),error=>error.code==='upstream_unavailable'&&error.diagnostic.upstreamStatus===502);
resetTrafficForTests();
const valid=await askInterviewProvider(opts,async()=>makeResponse({choices:[{message:{content:'{"decision":"answer","factIds":["f0"],"text":"Bezpieczna odpowiedź."}'}}],usage:{prompt_tokens:101,completion_tokens:27}},200));
assert.equal(valid.text,'Bezpieczna odpowiedź.');
// Distributed queue opt-in: reservation call is scoped across instances by SQL RPC,
// not by this test process. Simulate RPC response and verify parameters.
process.env.APINEX_DISTRIBUTED_QUEUE_ENABLED='true';
process.env.SUPABASE_URL='https://fake-supabase.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY='DUMMY_SERVICE_ROLE_LOCAL_TEST';
process.env.APINEX_MAX_UPSTREAM_CALLS_PER_MINUTE='12';
let requests=0;
const queueTransport=async(url,req)=>{
 requests++;assert(url.endsWith('ps_reserve_apinex_call'));
 const b=JSON.parse(req.body);assert.equal(b.p_interval_ms,5000);assert.equal(b.p_scope,'game');return makeResponse(0,200);
};
const grants=await Promise.all(Array.from({length:8},()=>takeApinexSlot({scope:'game',transport:queueTransport})));
assert.equal(requests,8);assert(grants.every(x=>x.enforced&&x.queued));
await assert.rejects(()=>takeApinexSlot({scope:'game',transport:async()=>makeResponse(-1,200)}),e=>e.code==='apinex_shared_rate_limit');
await assert.rejects(()=>takeApinexSlot({scope:'game',transport:async()=>makeResponse({message:'no migration'},404)}),e=>e.code==='apinex_queue_migration_missing_or_unavailable');
console.log(JSON.stringify({test:'rc58-provider',status:'PASS',simulated429Calls:calls,retryAfterSeconds:8,
 simulated502:'classified',successUsage:{promptTokens:101,completionTokens:27},distributedQueueReservations:requests,backoff:'tested in rc58-intelligence'}));
