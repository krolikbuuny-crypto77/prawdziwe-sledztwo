import assert from 'node:assert/strict';
import fs from 'node:fs';
import {interviewModels,INTERVIEW_CHAIN,askInterviewProvider} from '../lib/interview-providers-rc24.js';
import {INTERVIEW_BUDGET,phaseTimeout} from '../lib/interview-budget-636.js';
import {SPECIALIZED_CHAINS,runSpecializedChain} from '../lib/specialized-router-rc33.js';
process.env.APINEX_API_KEY='test-secret-APINEX';
process.env.ZAI_API_KEY='test-secret-ZAI';
process.env.GROQ_API_KEY='test-secret-GROQ';
process.env.GEMINI_API_KEY='test-secret-GOOGLE';
const mock=(body,status=200)=>({ok:status>=200&&status<300,status,headers:{get:()=>null},json:async()=>body});
const choice=value=>mock({choices:[{message:{content:JSON.stringify(value)}}]});
const models=INTERVIEW_CHAIN.map(x=>interviewModels[x]);
assert.equal(INTERVIEW_CHAIN.length,12);
assert.equal(new Set(models).size,12);
assert.equal(models[0],'free/gpt-6-luna');
assert.equal(models.at(-2),'glm-4.7-flash');
assert.equal(models.at(-1),'witness-registry-rc24');
assert(!models.some(x=>/qwen-3.8-max|kimi-k3|claude|mimo-v2.6-flash/.test(x)),'subscription-only model in free chain');
assert.equal(INTERVIEW_BUDGET.totalMs,270000);
assert.equal(INTERVIEW_BUDGET.apinexWindowMs,210000);
assert.equal(INTERVIEW_BUDGET.zaiWindowMs,35000);
assert.equal(INTERVIEW_BUDGET.commitReserveMs,25000);
for(const p of INTERVIEW_CHAIN.filter(x=>x!=='local')){
 assert(INTERVIEW_BUDGET.phaseMs[p]?.generate>0 && INTERVIEW_BUDGET.phaseMs[p]?.['semantic-audit']>0);
 let sent=null;
 const answer=await askInterviewProvider({provider:p,system:'Fakty wyłącznie z bazy',payload:{x:'pytanie'},maxTokens:300,timeoutMs:200},async(url,opts)=>{
  sent={url,body:JSON.parse(opts.body),auth:opts.headers.Authorization};
  return choice({decision:'answer',text:'Nie pamiętam godzin.',factIds:['f0']});
 });
 assert.equal(answer.decision,'answer');
 assert.equal(sent.body.model,interviewModels[p]);
 assert.equal(sent.body.response_format.type,'json_object');
 assert(sent.auth.startsWith('Bearer test-secret-'));
 if(p==='zai')assert(sent.url.includes('api.z.ai'));else assert(sent.url.includes('api.apinex.bond'));
}
assert.equal(phaseTimeout({provider:'apinex-luna',phase:'generate',now:1000,turnDeadline:1000+270000,providerDeadline:16000}),11500);
assert.equal(phaseTimeout({provider:'apinex-luna',phase:'generate',now:20000,turnDeadline:270000,providerDeadline:16000}),0);
const front=fs.readFileSync(new URL('../src/integrations/35-zai-client.js',import.meta.url),'utf8');
const save=fs.readFileSync(new URL('../src/core/case-engine.js',import.meta.url),'utf8');
for(const p of INTERVIEW_CHAIN.filter(x=>x!=='local')){
 assert(front.includes("'"+p+"'"),'frontend lacks '+p);
 assert(save.includes("'"+p+"'"),'save metadata lacks '+p);
}
assert(front.includes('setTimeout(()=>ctrl.abort(),290000)'));
const vercel=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
assert.equal(vercel.functions['api/interview.js'].maxDuration,300);
assert.equal(vercel.functions['api/evidence-review.js'].maxDuration,90);
assert.equal(vercel.functions['api/lab-narrative.js'].maxDuration,80);
assert.equal(vercel.functions['api/defense-objections.js'].maxDuration,175);
assert.equal(SPECIALIZED_CHAINS.evidence.length,5);
assert.equal(SPECIALIZED_CHAINS.laboratory.length,4);
assert.equal(SPECIALIZED_CHAINS.defense.length,5);
// Shared APINEX 429: skip all its other models without burning more calls.
let hits=[];
let routed=await runSpecializedChain({task:'evidence',system:'test',payload:{},validate:x=>x.result==='accepted'?x:null,totalMs:20000,attemptMs:1000,transport:async(url,opts)=>{
 let req=JSON.parse(opts.body);hits.push(req.model);
 if(url.includes('apinex'))return mock({error:{code:429}},429);
 return choice({result:'accepted'});
}});
assert.equal(routed.provider,'groq');
assert.deepEqual(hits,['free/glm-5.3','openai/gpt-oss-120b']);
assert(routed.attempts.some(x=>x.model==='free/deepseek-v4-pro-0813'&&x.code==='shared_limit_skipped'));
// Invalid model reply does not end chain.
hits=[];
routed=await runSpecializedChain({task:'laboratory',system:'test',payload:{},validate:x=>x.findings?.length?x:null,totalMs:20000,attemptMs:1000,transport:async(url,opts)=>{
 const m=JSON.parse(opts.body).model;hits.push(m);
 return choice(m==='free/minimax-m3.1-flash'?{findings:[]}:{findings:[{sourceId:'LAB-01',text:'Wynik zatwierdzony.'}]});
}});
assert.equal(routed.model,'free/mimo-v2.6-pro');assert.equal(hits.length,2);
// Gemini APINEX 429 -> Google independent API, no wasted APINEX retries.
hits=[];
routed=await runSpecializedChain({task:'defense',system:'test',payload:{},validate:x=>x.objections?.length===6?x:null,totalMs:20000,attemptMs:1000,transport:async(url,opts)=>{
 hits.push(url);
 if(url.includes('apinex'))return mock({error:{code:429}},429);
 if(url.includes('generativelanguage'))return mock({candidates:[{content:{parts:[{text:JSON.stringify({objections:Array.from({length:6},(_,i)=>({title:'Punkt'+i}))})}]}}]});
 throw Error('unexpected request');
}});
assert.equal(routed.provider,'google');assert.equal(hits.length,2);
// Groq GPT-OSS fails -> Qwen must omit unsupported reasoning_effort.
hits=[];
routed=await runSpecializedChain({task:'evidence',system:'test',payload:{},validate:x=>x.result==='accepted'?x:null,totalMs:20000,attemptMs:1000,transport:async(url,opts)=>{
 const body=JSON.parse(opts.body);hits.push(body);
 if(url.includes('apinex'))return mock({error:{code:429}},429);
 if(body.model==='openai/gpt-oss-120b')return mock({error:{code:503}},503);
 return choice({result:'accepted'});
}});
assert.equal(routed.model,'qwen/qwen3.8-27b');
assert.equal(hits.at(-1).reasoning_effort,undefined);
console.log('PASS RC33: 12 interview layers; verified model IDs; 270s budget; client/server parity; specialist cascades; shared 429 skip; invalid answer retry; Google recovery; Qwen request');
