import assert from 'node:assert/strict';
import {runLiveStep} from '../lib/admin-rc57-live.js';
process.env.RC57_LIVE_TEST_ENABLED='true';
process.env.RC57_ADMIN_SECRET='TEST_ONLY_SECRET_123456789_123456789';
process.env.APINEX_API_KEY='MOCK_ONLY_NOT_REAL';
const req={headers:{cookie:'__Host-ps57=test-retry'}};
const args={mode:'live-short',provider:'apinex-luna',offset:0,confirmed:true,token:null};
const fail=async()=>{throw Object.assign(new Error('Sensitive upstream data MUST NOT LEAK'),{
 code:'model_timeout',interviewPhase:'semantic-audit',diagnostic:{upstreamStatus:504,
  requestDispatched:true,providerDurationMs:6500,quotaWaitMs:0}})};
const blocked=await runLiveStep(args,req,fail);
assert.equal(blocked.results[0].status,'blocked');
assert.equal(blocked.retryOffset,0);assert.equal(blocked.nextToken,null);
assert.equal(blocked.suggestedPauseSeconds,20);
assert.deepEqual(blocked.results[0].failureDiagnostics,{
 code:'provider_timeout',phase:'semantic-audit',upstreamStatus:504,retryAfterSeconds:null,
 quotaKind:null,requestDispatched:true,providerCalls:0,rejectedChecks:0});
assert(!JSON.stringify(blocked).includes('Sensitive upstream'));
const limited=await runLiveStep(args,req,async()=>{throw Object.assign(Error('upstream-429'),{
 code:'upstream_rate_limit',interviewPhase:'generate',diagnostic:{upstreamStatus:429,
 retryAfterSeconds:145,quotaKind:'local_requests_per_minute',requestDispatched:false}})});
assert.equal(limited.suggestedPauseSeconds,145);
assert.equal(limited.results[0].failureDiagnostics.quotaKind,'local_requests_per_minute');
assert.equal(limited.results[0].failureDiagnostics.phase,'generate');
const invalid=await runLiveStep(args,req,async()=>null);
assert.equal(invalid.results[0].status,'blocked');assert.equal(invalid.stopped,'answer_quality_rejected');
const recovered=await runLiveStep(args,req,async()=>({ok:true,decision:'answer',semanticVerified:true,text:'Byłem kierownikiem zmiany.',factIds:[]}));
assert(['pass','warning'].includes(recovered.results[0].status));
assert(recovered.nextToken);
console.log('PASS RC57.10.7: safe timeout diagnostics, upstream 429 Retry-After, retry exact offset, no raw messages, quality failure, successful continuation');
