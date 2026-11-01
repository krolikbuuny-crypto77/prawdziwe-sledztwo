import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {runLiveStep,liveAvailable,liveInfo} from '../lib/admin-rc57-live.js';
import handler from '../api/admin-rc57.js';
import {attemptInterview} from '../api/interview.js';
process.env.RC57_ADMIN_PASSWORD='RC57.2TestOnlyPassword-NotReal-12345';
process.env.RC57_ADMIN_SECRET='RC57.2TestOnlySecret-NotReal-ABCDEF0123456789';
process.env.RC57_LIVE_TEST_ENABLED='true';
process.env.APINEX_API_KEY='NOT_REAL_KEY_TEST_ONLY';
process.env.APINEX_API_KEY='NOT_REAL_KEY_TEST_ONLY';
const req={headers:{host:'game.example','x-forwarded-proto':'https',origin:'https://game.example',cookie:'__Host-ps57=not-a-real-cookie'},method:'POST'};
const fake=async (scene,provider)=>{
 assert.equal(provider,'apinex-luna');
 assert.equal(scene.knowledge.factBank.every(x=>typeof x.text==='string'),true);
 assert.equal(scene.serverVerifiedFacts,true);
 assert.equal(scene.presentedEvidence,null);
 assert.equal(scene.approvedThreadHistory.length%2,0);
 assert.equal(scene.knowledge.documentsShown.length,0);
 return {ok:true,decision:'answer',semanticVerified:true,factIds:['f0'],text:'Nie mogę tego potwierdzić bez danych z dozwolonej dokumentacji.'};
};
const data=[];for(const mode of ['live-short','live-long']){
 let token=null;const results=[];const total=mode==='live-short'?18:72;
 for(let offset=0;offset<total;offset++){
  const output=await runLiveStep({mode,provider:'apinex-luna',offset,token,confirmed:offset===0},req,fake);
  token=output.nextToken;results.push(output.results[0]);
  assert.equal(output.results[0].witness,['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'][Math.floor(offset/(total/6))]);
  assert.equal(output.results[0].status,offset%(total/6)>0?'warning':'pass'); // identical replies deliberate warning
 }
 assert.equal(token,null);assert.equal(results.length,total);data.push({mode,total});
}
let t=await runLiveStep({mode:'live-short',provider:'apinex-luna',offset:0,confirmed:true},req,fake);
await assert.rejects(()=>runLiveStep({mode:'live-short',provider:'apinex-luna',offset:1,token:t.nextToken+'x'},req,fake),/bad_live_signature/);
await assert.rejects(()=>runLiveStep({mode:'live-short',provider:'apinex-luna',offset:2,token:t.nextToken},req,fake),/live_step_out_of_order/);
await assert.rejects(()=>runLiveStep({mode:'live-short',provider:'unknown',offset:1,token:t.nextToken},req,fake),/invalid_live_range/);
await assert.rejects(()=>runLiveStep({mode:'live-short',provider:'apinex-luna',offset:1,token:t.nextToken},{...req,headers:{...req.headers,cookie:'__Host-ps57=other-cookie'}},fake),/invalid_live_state/);
await assert.rejects(()=>runLiveStep({mode:'live-short',provider:'apinex-luna',offset:0,confirmed:false},req,fake),/explicit_confirmation_required/);
const rc57=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this;},json(data){this.data=data;return this;},send(s){this.body=s;return this;}});
const unauthorized=rc57();await handler({method:'POST',headers:{host:'game.example',origin:'https://game.example','content-type':'application/json'},body:{action:'live-step',mode:'live-short',provider:'apinex-luna',offset:0,confirmed:true}},unauthorized);assert.equal(unauthorized.code,401);
process.env.RC57_LIVE_TEST_ENABLED='false';await assert.rejects(()=>runLiveStep({mode:'live-short',provider:'apinex-luna',offset:0,confirmed:true},req,fake),/live_tests_disabled/);
assert.equal(readdirSync(new URL('../api/',import.meta.url)).filter(x=>x.endsWith('.js')).length,12);
// Exercise original production attemptInterview with a deterministic, injected AI transport; no real keys or internet.
process.env.RC57_LIVE_TEST_ENABLED='true';
let aiCalls=0;
const safe=async (scene,provider)=>attemptInterview(scene,provider,async(system,payload,limit,temp,providerName,phase)=>{
 aiCalls++;
 assert.equal(providerName,'apinex-luna');
 if(phase==='generate'||phase==='rewrite')return {decision:'answer',factIds:['f0'],text:scene.knowledge.factBank[0].text,emotion:'neutral'};
 return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[],reason:'ok'};
});
const result=await runLiveStep({mode:'live-short',provider:'apinex-luna',offset:0,confirmed:true},req,safe);
assert.equal(result.results.length,1);
assert(result.results[0].status==='pass'||result.results[0].status==='warning',JSON.stringify(result.results[0]));
assert(aiCalls>=1);
console.log('RC57.2 PASS: isolated server-owned canon, 18/72 scenario steps, token validation, auth rejection, manual opt-in, 12 functions, production attemptInterview pipeline with fake model transport.');
console.log(data, 'mock AI calls:',aiCalls);
