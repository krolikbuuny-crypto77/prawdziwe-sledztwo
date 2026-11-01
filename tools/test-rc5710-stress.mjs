import assert from 'node:assert/strict';
import {runStressBatch,stressInfo} from '../lib/admin-rc57-stress.js';
import {runLiveStep,liveInfo} from '../lib/admin-rc57-live.js';
process.env.RC57_LIVE_TEST_ENABLED='true';
process.env.APINEX_API_KEY='TEST-NOT-REAL';
process.env.RC57_ADMIN_SECRET='RC5710_LONG_TEST_SECRET_ADMIN_LOCAL_ONLY_123456';
const all=[];for(let i=0;i<stressInfo.total;i+=20)all.push(...runStressBatch(i,20).results);
assert.equal(all.length,120);assert.equal(all.filter(x=>x.status==='fail').length,0);
assert.equal(new Set(all.map(x=>x.question)).size,20);
assert.equal(new Set(all.map(x=>x.witness)).size,6);
assert.equal(liveInfo.modes.find(x=>x.id==='live-stress')?.turns,18);
let n=0,token=null;const req={headers:{cookie:'__Host-ps57=test'}};
const mock=async scene=>{n++;return {ok:true,decision:'answer',semanticVerified:true,text:'Byłem przy stanowisku, ale nie znam dokładnej godziny.',factIds:[]};};
for(let i=0;i<18;i++){
 const step=await runLiveStep({mode:'live-stress',provider:'apinex-luna',offset:i,token,confirmed:i===0},req,mock);
 assert.equal(step.results[0].status==='fail',false,JSON.stringify(step.results));
 if(i%3===0)assert.match(step.results[0].question,/\bGdze\b/);
 if(i%3===2)assert.match(step.results[0].question,/\bNei\b/);
 token=step.nextToken;
 if(i===17)assert(step.complete);
}
assert.equal(n,18);
console.log('PASS RC57.10: 120 reproducible varied questions, 6 witnesses, typo/negation/IDs; 18 live-stress steps with mocked model and signed continuation tokens.');
