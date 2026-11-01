import assert from 'node:assert/strict';
import fs from 'node:fs';
import {interviewModels,INTERVIEW_CHAIN,askInterviewProvider} from '../lib/interview-providers-rc24.js';
import {INTERVIEW_BUDGET} from '../lib/interview-budget-636.js';
import {liveInfo,liveAvailable,runLiveStep} from '../lib/admin-rc57-live.js';
import {blindInfo,runBlindStage} from '../lib/admin-rc57-blind.js';
import publicStatus from '../lib/status-handler.js';
const prev={apx:process.env.APINEX_API_KEY,z:process.env.ZAI_API_KEY,enabled:process.env.RC57_LIVE_TEST_ENABLED,secret:process.env.RC57_ADMIN_SECRET};
try{
 process.env.APINEX_API_KEY='NOT_REAL_TEST_ONLY';
 process.env.ZAI_API_KEY='SIMULATE_HISTORICAL_KEY_MUST_NOT_BE_USED';
 process.env.RC57_LIVE_TEST_ENABLED='true';
 process.env.RC57_ADMIN_SECRET='RC57MigrationTestSecretLongEnoughNotReal';
 assert.equal(interviewModels['apinex-jev'],'free/jev-1.13');
 assert(INTERVIEW_CHAIN.includes('apinex-jev'));
 assert(!INTERVIEW_CHAIN.includes('zai'));
 assert.deepEqual(liveInfo.providers,['apinex-luna','apinex-jev']);
 assert.deepEqual(blindInfo.providers,['apinex-luna','apinex-jev']);
 assert.deepEqual(liveAvailable().providers,['apinex-luna','apinex-jev']);
 assert.equal(INTERVIEW_BUDGET.zaiWindowMs,undefined);
 let called=[];
 const out=await askInterviewProvider({provider:'apinex-jev',system:'test',payload:{q:'foo'},maxTokens:55},async(url,opts)=>{
  called.push({url,auth:opts.headers.Authorization,body:JSON.parse(opts.body)});
  return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'answer',text:'Przyjęto.'})}}]})};
 });
 assert.equal(out.decision,'answer');
 assert.equal(called.length,1);
 assert.equal(called[0].body.model,'free/jev-1.13');
 assert.equal(called[0].auth,'Bearer NOT_REAL_TEST_ONLY');
 assert(called[0].url.includes('api.apinex.bond'));
 await assert.rejects(askInterviewProvider({provider:'zai',system:'test',payload:{q:'x'}}),{message:'interview_provider_not_allowed'});
 const req={headers:{cookie:'__Host-ps57=test-cookie'}};
 await assert.rejects(runLiveStep({mode:'live-short',provider:'zai',offset:0,confirmed:true},req,async()=>({})),{code:'invalid_live_range'});
 await assert.rejects(runBlindStage({stage:'initial',provider:'zai',confirmed:true},async()=>({})),{code:'invalid_blind_selection'});
 const safe=async()=>({ok:true,decision:'answer',semanticVerified:true,text:'W tym czasie byłem dostępny dla zmiany.',factIds:[]});
 const first=await runLiveStep({mode:'live-short',provider:'apinex-jev',offset:0,confirmed:true},req,safe);
 assert(['pass','warning'].includes(first.results[0].status));
 assert.equal(first.results[0].model,'free/jev-1.13');
 const decision=await runBlindStage({stage:'initial',provider:'apinex-jev',confirmed:true},async()=>({suspectId:null,evidenceIds:['MED-01','MED-07','TEC-01'],reasoning:'Brak podstaw',certainty:'low'}));
 assert.equal(decision.model,'free/jev-1.13');
 const res={setHeader(){},status(c){this.code=c;return this},json(x){this.payload=x;return this}};
 publicStatus({method:'GET'},res);
 assert.equal(res.code,200);assert(res.payload.providers.includes('apinex-jev'));assert(!res.payload.providers.includes('zai'));
 const ui=fs.readFileSync(new URL('../lib/admin-rc57-ui.js',import.meta.url),'utf8');
 assert(!ui.includes('<option value="zai">'));
 assert(ui.includes('<option value="apinex-jev">'));
 assert(ui.includes('AI_TEST_MAX_QPM=7'));
 assert(ui.includes('AI_TEST_MIN_INTERVAL_MS=Math.ceil(60000/AI_TEST_MAX_QPM)'));
 assert(ui.includes("reserveAiTestSlot('blindStatus')"));
 const compiled=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(compiled.includes("'apinex-jev'"));
 assert.equal(fs.readdirSync(new URL('../api/',import.meta.url)).filter(x=>x.endsWith('.js')).length,12);
 console.log('PASS RC57.7: Z.ai disabled even with old key, Jev APINEX-only transport, live/blind choices, shared pacing, legacy-safe client, 12 serverless functions');
}finally{
 for(const [name,key] of [['APINEX_API_KEY','apx'],['ZAI_API_KEY','z'],['RC57_LIVE_TEST_ENABLED','enabled'],['RC57_ADMIN_SECRET','secret']]){
  if(prev[key]===undefined)delete process.env[name];else process.env[name]=prev[key];
 }
}
