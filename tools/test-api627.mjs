import assert from 'node:assert/strict';
import handler from '../api/interview.js';
const before=globalThis.fetch;
const old={z:process.env.ZAI_API_KEY,g:process.env.GROQ_API_KEY,zm:process.env.ZAI_MODEL,gm:process.env.GROQ_MODEL};
process.env.ZAI_API_KEY='MOCK_PRIVATE_ZAI_TOKEN';process.env.GROQ_API_KEY='MOCK_PRIVATE_GROQ_TOKEN';
process.env.ZAI_MODEL='glm-4.7-flash';process.env.GROQ_MODEL='llama-3.3-70b-versatile';
const canonical='Nie pamiętam dokładnej godziny spotkania.';
const base={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},personality:{temperament:'rzeczowa',diction:['krótko'],speakingStyle:['spokojnie']},knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'}]},psychology:{blocked:false,contradictions:[]},memory:{conversation:[]},request:{semanticPlan:{primary:'time_precision',intents:['time_precision'],aspects:['time_precision'],slots:{compound:false,negated:false}}}};
const answer={decision:'answer',factIds:['f0'],text:canonical};
const audit={relevant:true,entailed:true,complete:true,coveredParts:[]};
const log=console.info;let logged=[];console.info=(...args)=>logged.push(args.join(' '));
function mock(zai,groq){let calls=[];const pool={zai:[...zai],groq:[...groq]};globalThis.fetch=async(url)=>{
 const provider=url.includes('groq.com')?'groq':'zai';calls.push(provider);const next=pool[provider].shift();
 if(next instanceof Error)throw next;
 if(next===undefined)return {ok:false,status:503,json:async()=>({})};
 return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify(next)}}]})};
};return calls;}
async function submit(){let result;const req={method:'POST',headers:{host:'test.local'},socket:{remoteAddress:'test627'},body:{version:3,witnessId:'ELZBIETA',canonical,question:'O której doszło do spotkania?',context:base}};
 const res={setHeader(){return this},status(code){this.statusCode=code;return this},json(body){result={status:this.statusCode||200,body};return this}};
 await handler(req,res);return result;}
function check(r,provider,model,reason){assert.equal(r.status,200);assert.equal(r.body.provider,provider);assert.equal(r.body.model,model);assert.match(r.body.requestId,/^[0-9a-f]{8}-/);assert.equal(r.body.fallbackReason,reason);assert(Number.isInteger(r.body.durationMs)&&r.body.durationMs>=0&&r.body.durationMs<=120000);assert(!JSON.stringify(r).includes('MOCK_PRIVATE'));}
try{
 let calls=mock([answer,audit],[]);let r=await submit();check(r,'zai','glm-4.7-flash',null);assert.deepEqual(calls,['zai','zai']);
 calls=mock([new Error('upstream-429')],[answer,audit]);r=await submit();check(r,'groq','openai/gpt-oss-120b','zai_rate_limited');assert.deepEqual(calls,['zai','groq','groq']);
 calls=mock([new Error('upstream-401')],[new Error('fetch failed')]);r=await submit();check(r,'local','witness-engine-local','zai_authorization_failed;groq_request_failed');assert.equal(r.body.decision,'fallback');
 calls=mock([{decision:'answer',factIds:['bad'],text:'Nie wiem.'}],[answer,audit]);r=await submit();check(r,'groq','openai/gpt-oss-120b','zai_rejected_by_validation');
 assert.equal(logged.length,4);assert(logged.every(x=>x.includes('requestId')&&!x.includes('MOCK_PRIVATE')&&!x.includes(canonical)));
 console.info=log;console.log('PASS 6.27 API diagnostics: Z.ai, Groq after 429, local after 401/connection failure, validation fallback, request IDs, no secrets');
}finally{globalThis.fetch=before;console.info=log;for(const [k,v] of Object.entries({ZAI_API_KEY:old.z,GROQ_API_KEY:old.g,ZAI_MODEL:old.zm,GROQ_MODEL:old.gm})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
