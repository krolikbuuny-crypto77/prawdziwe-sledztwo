import assert from 'node:assert/strict';
import handler from '../api/interview.js';
const saved=globalThis.fetch;
const results=[];
function invoke(payload,headers={},method='POST'){
 return new Promise(async resolve=>{
  const state={statusCode:200,headers:{},json:null};
  const req={method,body:payload,headers:{host:'game.example',...headers},socket:{remoteAddress:'127.0.0.1'}};
  const res={setHeader(k,v){state.headers[k]=v;return this},status(v){state.statusCode=v;return this},json(v){state.json=v;resolve(state);return this}};
  await handler(req,res);
 });
}
try{
 let result=await invoke({}, {},'GET');assert.equal(result.statusCode,405);
 result=await invoke({}, {origin:'https://evil.example'});assert.equal(result.statusCode,403);
 result=await invoke({});assert.equal(result.statusCode,503);
 process.env.ZAI_API_KEY='test-secret-not-real';
 const payload={version:2,witnessId:'MAREK',canonical:'Nie widziałem tego.',context:{schema:'ps-witness-context/1',identity:{id:'MAREK',name:'Marek Nowicki',role:'kierownik'},personality:{temperament:'ostrożny',diction:['rzeczowo']},knowledge:{currentGroundedAnswer:'Nie widziałem tego.',alreadySaid:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:'Nie widziałem tego.'}]},psychology:{blocked:false,contradictions:[]},memory:{conversation:[]}}};
 result=await invoke({...payload,witnessId:'FAKE'});assert.equal(result.statusCode,400);
 result=await invoke({...payload,canonical:'Zmieniona faktografia'});assert.equal(result.statusCode,400);
 result=await invoke({...payload,context:{...payload.context,psychology:{blocked:true,contradictions:[]}}});assert.equal(result.statusCode,400);
 let apiReq=null;
 globalThis.fetch=async (url,opts)=>{
  apiReq={url,headers:opts.headers,body:JSON.parse(opts.body)};
  return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'answer',sourceId:'turn',text:'Nie widziałem tego.',prefaceKey:2})}}]})};
 };
 result=await invoke(payload);
 assert.equal(result.statusCode,200);assert.equal(result.json.text,'Nie widziałem tego.');
 // Pakiet 6.17+ odrzuca stary, nieaudytowany format AI; fallback nie jest regresją.
 assert.ok(['answer','fallback'].includes(result.json.decision));
 assert.equal(result.json.prefaceKey,0); // Now fixed by the validated 6.17+ backend contract
 assert.equal(apiReq.url,'https://api.z.ai/api/paas/v4/chat/completions');
 assert.equal(apiReq.headers.Authorization,'Bearer test-secret-not-real');
 assert.ok(!JSON.stringify(result.json).includes('test-secret-not-real'));
 assert.ok(!apiReq.body.messages[1].content.includes('future'));
 console.log('PASS API65: method, origin, missing credentials, invalid identities, altered canonical, blocked witness, provider mock');
}catch(e){console.error(e);process.exitCode=1}
finally{globalThis.fetch=saved;delete process.env.ZAI_API_KEY}
