import assert from 'node:assert/strict';
import {askGemini,askGroq,models} from '../lib/ai-providers-rc7.js';
process.env.GEMINI_API_KEY='test-only';
process.env.GROQ_API_KEY='test-only';
const packets=[];
function reply(obj,status=200){return {ok:status>=200&&status<300,status,json:async()=>obj};}
async function mock(url,options){
 packets.push({url,options});
 if(url.includes('generativelanguage'))return reply({candidates:[{content:{parts:[{thought:true,text:'internal'},{text:JSON.stringify({ok:true,emotion:'guarded',objections:[1,2,3,4,5,6]})}]}}]});
 if(url.includes('api.groq.com')){
  const req=JSON.parse(options.body);
  return reply({choices:[{message:{content:JSON.stringify(req.model==='llama-3.1-8b-instant'?{summary:'Źródło potwierdza tylko zapis.',findings:[]}:{summary:'Hipoteza nie jest przesądzona.'})}}]});
 }
 throw Error('Unexpected URL: '+url);
}
assert.equal(models().interview,'gemini-3.8-flash');
assert.equal(models().defense,'gemini-3.8-flash');
assert.equal(models().laboratory,'llama-3.1-8b-instant');
assert.equal(models().deduction,'openai/gpt-oss-120b');
const a=await askGemini({system:'Świadek',payload:{question:'Kto to potwierdza?'},thinkingLevel:'low',maxTokens:2200},mock);
assert.equal(a.emotion,'guarded');
let body=JSON.parse(packets.at(-1).options.body);
assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'low');
assert.equal(body.generationConfig.maxOutputTokens,2200);
assert.equal(body.generationConfig.temperature,undefined);
assert.equal(packets.at(-1).options.headers['x-goog-api-key'],'test-only');
const b=await askGemini({system:'Obrona',payload:{indictment:{}},model:models().defense,thinkingLevel:'high',maxTokens:11000},mock);
assert.equal(b.objections.length,6);
body=JSON.parse(packets.at(-1).options.body);
assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'high');
assert.equal(body.generationConfig.maxOutputTokens,11000);
await assert.rejects(()=>askGemini({system:'X',payload:{},thinkingLevel:'minimal'},mock),e=>e?.code==='invalid_thinking_level');
const x=await askGroq({system:'Wyniki wyłącznie na podstawie zatwierdzonych akt',payload:{documents:[]},role:'laboratory'},mock);
assert.equal(x.summary,'Źródło potwierdza tylko zapis.');
assert.equal(JSON.parse(packets.at(-1).options.body).model,'llama-3.1-8b-instant');
await assert.rejects(()=>askGroq({system:'Test',payload:{},role:'laboratory',model:'llama-4-scout-17b-16e-instruct'},mock),e=>e?.code==='groq_model_not_allowed');
await assert.rejects(()=>askGroq({system:'Test',payload:{},model:'paid-or-unknown'},mock),e=>e?.code==='groq_model_not_allowed');
const c=await askGroq({system:'Audyt',payload:{}},mock);
assert.match(c.summary,/Hipoteza/);
const groqBody=JSON.parse(packets.at(-1).options.body);
assert.equal(groqBody.model,'openai/gpt-oss-120b');
assert.equal(groqBody.reasoning_effort,'medium');
assert.equal(groqBody.response_format.type,'json_object');
console.log('PASS: Gemini 3.8 low/high, Groq free deduction and laboratory models, no paid fallback');
