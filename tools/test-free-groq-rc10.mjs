import assert from 'node:assert/strict';
import {askGroq,models,ProviderFailure} from '../lib/ai-providers-rc7.js';
import {default as status} from '../api/status.js';
const old=process.env.GROQ_API_KEY;
process.env.GROQ_API_KEY='mock-key-not-a-real-secret';
const calls=[];
const response=data=>({ok:true,status:200,json:async()=>data});
const transport=async(url,options)=>{
  calls.push({url,body:JSON.parse(options.body),headers:options.headers});
  return response({choices:[{message:{content:'{"summary":"Zatwierdzony opis.","findings":[],"confirmed":[],"uncertain":[]}'} }]});
};
try {
 assert.equal(models().deduction,'openai/gpt-oss-120b');
 assert.equal(models().deductionBackup,'openai/gpt-oss-20b');
 assert.equal(models().laboratory,'llama-3.1-8b-instant');
 await askGroq({system:'Oceń fakty',payload:{},role:'deduction'},transport);
 await askGroq({system:'Przeanalizuj fakty',payload:{},role:'deduction',model:models().deductionBackup},transport);
 await askGroq({system:'Opisz dokument',payload:{},role:'laboratory'},transport);
 assert.equal(calls.length,3);
 assert(calls.every(c=>c.url==='https://api.groq.com/openai/v1/chat/completions'));
 assert.deepEqual(calls.map(c=>c.body.model),['openai/gpt-oss-120b','openai/gpt-oss-20b','llama-3.1-8b-instant']);
 assert.equal(calls[0].body.reasoning_effort,'medium');
 assert.equal(calls[1].body.reasoning_effort,'medium');
 assert.equal(calls[2].body.reasoning_effort,undefined);
 assert(calls.every(c=>c.body.response_format.type==='json_object'));
 assert(calls.every(c=>c.headers.Authorization==='Bearer mock-key-not-a-real-secret'));
 await assert.rejects(()=>askGroq({system:'Nie używaj płatnego',payload:{},role:'laboratory',model:'expensive-paid-model'},transport),e=>e instanceof ProviderFailure&&e.code==='groq_model_not_allowed');
 assert.equal(calls.length,3);
 let code,body;
 status({method:'GET'},{setHeader(){},status(x){code=x;return this;},json(x){body=x;}});
 assert.equal(code,200);assert.equal(body.release,'6.37-FREE-GROQ-RC10');
 assert.deepEqual(body.providers,['gemini','groq']);
 delete process.env.GROQ_API_KEY;
 await assert.rejects(()=>askGroq({system:'Brak klucza',payload:{}},transport),e=>e.code==='groq_not_configured');
 console.log('PASS RC10: one Groq key, two free models + one backup, JSON, no paid provider/fallback, status, auth');
} finally {if(old===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=old;}
