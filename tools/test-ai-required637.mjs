import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {INTERVIEW_BUDGET,phaseTimeout} from '../lib/interview-budget-636.js';
assert.equal(INTERVIEW_BUDGET.totalMs,46000);
assert.equal(INTERVIEW_BUDGET.zaiWindowMs,25000);
assert.equal(phaseTimeout({provider:'zai',phase:'generate',now:0,turnDeadline:46000,providerDeadline:25000}),22000);
const old={fetch:globalThis.fetch,info:console.info};
const prior=Object.fromEntries(['ZAI_API_KEY','GROQ_API_KEY','GAME_SESSION_SECRET','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'].map(k=>[k,process.env[k]]));
process.env.ZAI_API_KEY='dummy-zai';process.env.GROQ_API_KEY='dummy-groq';
process.env.GAME_SESSION_SECRET='test-session-key'.padEnd(40,'x');
process.env.SUPABASE_URL='https://ai-required-test.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-key';
const {default:handler}=await import('../api/interview.js');
const {initialState}=await import('../lib/server-state.js');
let state=initialState(),revision=0;
const canonical='Nie pamiętam dokładnej godziny spotkania.';
const context={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},personality:{temperament:'rzeczowa',diction:['krótko'],speakingStyle:['spokojnie']},knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'}]},psychology:{blocked:false,contradictions:[]},memory:{conversation:[]},request:{semanticPlan:{primary:'time_precision',intents:['time_precision'],aspects:['time_precision'],slots:{compound:false,negated:false}}}};
let calls=[],pool=null,records=[];
console.info=(...a)=>records.push(a.join(' '));
globalThis.fetch=async(url,opts)=>{
 const name=String(url);
 if(name.includes('ai-required-test.supabase.co')){
  if(name.includes('rpc/ps_allow_interview'))return {ok:true,status:200,json:async()=>true};
  if(name.includes('rpc/ps_commit_session')){
   state=JSON.parse(opts.body).p_approved_state;revision++;
   return {ok:true,status:200,json:async()=>true};
  }
  return {ok:true,status:200,json:async()=>[{revision,approved_state:state}]};
 }
 const provider=name.includes('groq.com')?'groq':'zai';calls.push(provider);
 if(!pool)throw Error('upstream-503');
 const value=pool[provider].shift();if(value instanceof Error)throw value;
 return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify(value)}}]})};
};
async function submit(){
 let result;const res={setHeader(){return this},status(s){this.code=s;return this},json(body){result={status:this.code||200,body};return this}};
 await handler({method:'POST',headers:{host:'qa.local'},socket:{remoteAddress:'ai-required-test'},body:{version:3,witnessId:'ELZBIETA',canonical,question:'O której doszło do spotkania?',context,turnId:randomUUID()}},res);
 return result;
}
try{
 let result=await submit();assert.equal(result.status,503);assert.equal(result.body.ok,false);assert.equal(result.body.retryable,true);assert(!result.body.text);assert.deepEqual(calls,['zai','groq']);
 const client=readFileSync(new URL('../src/integrations/35-zai-client.js',import.meta.url),'utf8');
 assert(client.includes('log.splice(oldLen,2)'));assert(client.includes('if(input)input.value=question'));
 assert(client.includes('Nie otrzymano zatwierdzonej odpowiedzi AI'));
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.functions['api/interview.js'].maxDuration,60);
 calls=[];pool={zai:[new Error('upstream-503')],groq:[{decision:'answer',factIds:['f0'],text:canonical},{relevant:true,entailed:true,complete:true,coveredParts:[]}]};
 result=await submit();assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.body.provider,'groq');assert.equal(result.body.decision,'answer');assert.deepEqual(calls,['zai','groq','groq']);
 assert(records.every(x=>!x.includes('dummy-zai')&&!x.includes('dummy-groq')&&!x.includes(canonical)));
 console.log('PASS AI required: no local after both failures, Groq takeover, shared session/quota and bounded AI, safe logs');
}finally{
 globalThis.fetch=old.fetch;console.info=old.info;
 for(const [k,v] of Object.entries(prior))if(v===undefined)delete process.env[k];else process.env[k]=v;
}
