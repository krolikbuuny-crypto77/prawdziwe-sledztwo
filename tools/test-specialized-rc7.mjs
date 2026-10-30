import assert from 'node:assert/strict';
import {askGemini,askGroq,models} from '../lib/ai-providers-rc7.js';
process.env.GEMINI_API_KEY='test-gemini';process.env.GROQ_API_KEY='test-groq';
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='fake-key';process.env.GAME_SESSION_SECRET='a'.repeat(44);
function mockResponse(data,status=200){return {ok:status>=200&&status<300,status,json:async()=>data};}
const seen=[];
const transport=async(url,opts)=>{const body=opts.body?JSON.parse(opts.body):null;seen.push({url,body,headers:opts.headers});
 if(url.includes('generativelanguage'))return mockResponse({candidates:[{content:{parts:[{text:'{"decision":"answer","factIds":["f0"],"text":"O tej rozmowie pamiętam tylko to, co powiedziałem."}'}]}}]});
 if(url.includes('groq.com'))return mockResponse({choices:[{message:{content:body.model==='llama-3.1-8b-instant'?'{"summary":"Dane z logu.","findings":[{"sourceId":"TEC-03","text":"Dane dostępne."}],"limitations":"Nie ustalają osoby.","journalEntry":"Porównano źródła."}':'{"summary":"Materiały wymagają ostrożności.","confirmed":[],"uncertain":[],"nextStep":"Porównaj czas."}'}}]});
 throw Error('Unknown mock URL: '+url);
};
const x=await askGemini({system:'Świadek',payload:{question:'Kim była Lena?'},model:models().interview},transport);
assert.equal(x.decision,'answer');assert.match(seen[0].url,/gemini-3\.8-flash/);
assert.equal(seen[0].body.generationConfig.responseMimeType,'application/json');
assert.equal(seen[0].body.generationConfig.thinkingConfig.thinkingLevel,'low');
const y=await askGroq({system:'Audyt',payload:{statement:'Teza'},model:models().deduction},transport);
assert.ok(y.summary);assert.equal(seen[1].body.model,'openai/gpt-oss-120b');
const z=await askGroq({system:'Laboratorium',payload:{documents:[]},role:'laboratory'},transport);
assert.ok(z.findings.length);assert.equal(seen[2].body.model,'llama-3.1-8b-instant');
const w=await askGemini({system:'Obrona',payload:{indictment:{}},model:models().defense},transport);
assert.equal(w.decision,'answer');assert.match(seen[3].url,/gemini-3\.8-flash/);
assert.ok(seen.every(a=>!a.headers.Authorization||a.headers.Authorization.startsWith('Bearer ')));
assert.equal(seen[3].body.generationConfig.thinkingConfig.thinkingLevel,'low');
console.log('PASS: Gemini 3.8 Flash, Groq GPT-OSS 120B and Groq Llama 3.1 8B — request contracts and JSON parsing');
// Mock Supabase on the server side. No real database or network access in this test.
const {default:lab}=await import('../api/lab-narrative.js');
const {default:defense}=await import('../api/defense-objections.js');
const {default:deduction}=await import('../api/evidence-review.js');
const state={approvedEvidence:['TEC-03','TEC-12','ADM-14','LAB-01'],witnesses:{},indictment:{culprit:'MAREK',qualification:'intentional',method:'unknown',alibi:'unknown',keystone:'ADM-14',links:[{id:'ADM-14',role:'person'},{id:'LAB-01',role:'mechanism'}],reasons:{person:'Niepełne',method:'Niepełne',proof:'Niepełne',alibi:'Niepełne'}}};
let currentState=state;
const all=[];
globalThis.fetch=async(url,opts={})=>{all.push(url);if(url.includes('supabase.co')){
 if(url.includes('rpc/ps_allow_ai_review'))return mockResponse(true);
 if(url.includes('ps_game_sessions?'))return mockResponse([{revision:0,approved_state:currentState}]);
 return mockResponse(null,404);
 }
 if(url.includes('generativelanguage'))return mockResponse({candidates:[{content:{parts:[{text:JSON.stringify({objections:Array.from({length:6},(_,i)=>({title:'Zarzut '+(i+1),argument:'Brak pełnej pewności w zakresie '+(i+1),sourceId:'ADM-14',question:'Czy można to niezależnie potwierdzić?'}))})}]}}]});
 if(url.includes('api.groq.com')){
  const body=JSON.parse(opts.body);
  if(body.model==='llama-3.1-8b-instant')return mockResponse({choices:[{message:{content:JSON.stringify({summary:'Notatka z zatwierdzonego źródła',findings:[{text:'Tylko TEC-03 jest wskazany.',sourceId:'TEC-03'},{text:'Zmyślony dowód',sourceId:'FAKE-01'}],limitations:'Nie przesądza obecności.',journalEntry:'Przeanalizowano udostępnione źródła.'})}}]});
  return mockResponse({choices:[{message:{content:JSON.stringify({summary:'Słabe przesłanki.',confirmed:[{text:'Nie ma dodatkowych pomiarów.',sourceIds:['doc:TEC-03']}],uncertain:[],nextStep:'Porównaj źródła.'})}}]});
 }
 throw Error('Unexpected URL: '+url);
};
function req(body){return {method:'POST',headers:{'x-ps-client':'game','content-type':'application/json','host':'localhost'},body,socket:{remoteAddress:'1.2.3.4'}};}
function res(){return {code:null,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(n){this.code=n;return this;},json(x){this.payload=x;return this;},end(raw){this.payload=JSON.parse(raw);return this;}};}
let response=res();await lab(req({lab:'tcms'}),response);
assert.equal(response.code,200);assert.equal(response.payload.note.findings.length,1);assert.equal(response.payload.note.findings[0].sourceId,'TEC-03');
currentState={...state,approvedEvidence:['TEC-03']};response=res();await lab(req({lab:'tcms'}),response);assert.equal(response.code,409);
currentState=state;response=res();await defense(req({}),response);assert.equal(response.code,200);assert.equal(response.payload.objections.length,6);
response=res();await deduction(req({kind:'przypuszczenie',statement:'Wniosek wymaga niezależnych danych',links:[{id:'doc:TEC-03',name:'Dowód',body:'Dane',role:'context'}]}),response);
assert.equal(response.statusCode,200);assert.equal(response.payload.assessment.advisory,true);
console.log('PASS: server gatekeeping, unavailable laboratory sources, six defense objections, and advisory deduction');
