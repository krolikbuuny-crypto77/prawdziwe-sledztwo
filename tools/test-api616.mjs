import assert from 'node:assert/strict';
import handler,{normalizeEvidenceRequest,filterEvidenceAssessment,buildCloudflareRequest} from '../api/evidence-review.js';

const sample={kind:'przypuszczenie',statement:'Zdarzenie miało miejsce o 01:44',alternative:'Czujnik odnotował impuls, nie moment zgonu',test:'Porównam opis czujnika z aktami',links:[
 {id:'doc:Q1',name:'Q1 · Raport czujnika',body:'Czujnik odnotował impuls o 01:44. Nie identyfikuje osoby.',role:'supports',note:'Impuls o 01:44'},
 {id:'doc:Q2',name:'Q2 · Opinia medyczna',body:'Przedział możliwego zgonu jest szerszy niż jedna minuta.',role:'limits',note:'Nie ustala jednej minuty'},
 {id:'doc:Q2',name:'zdublowany',body:'Błędny duplikat'}]};
const clean=normalizeEvidenceRequest(sample);
assert.equal(clean.links.length,2);
assert.equal(normalizeEvidenceRequest({...sample,links:[]}),null);
assert.equal(normalizeEvidenceRequest({...sample,links:[{id:'doc:Q1',body:'',name:'x'}]}),null);
assert.equal(normalizeEvidenceRequest({...sample,links:[{id:'invalid',body:'x',name:'x'}]}),null);
assert.equal(buildCloudflareRequest(clean).temperature,0.18);
assert.match(buildCloudflareRequest(clean).messages[0].content,/nie przesłuchujesz/i);
console.log('PASS only validated, deduplicated, already supplied evidence reaches Cloudflare');

const model={response:{summary:'Raport dowodzi jedynie impulsu, a nie momentu zgonu.',
 confirmed:[{text:'Impuls zarejestrowano o 01:44.',sourceIds:['doc:Q1']},{text:'Nieznany dowód',sourceIds:['doc:SECRET']}],
 uncertain:[{text:'Brak identyfikacji osoby.',sourceIds:['doc:Q1','doc:Q2','doc:SECRET']}],
 nextStep:'Możesz porównać raport i opinię medyczną.'}};
const filtered=filterEvidenceAssessment({result:model},clean);
assert.equal(filtered.confirmed.length,1);
assert.equal(filtered.uncertain[0].sourceIds.length,2);
assert.equal(filtered.advisory,true);
assert(!JSON.stringify(filtered).includes('SECRET'));
console.log('PASS unsupported source references removed, advice non-binding');

function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=JSON.parse(body)}}}
const originalFetch=globalThis.fetch;
const originalEnv={account:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN};
try{
 delete process.env.CLOUDFLARE_ACCOUNT_ID;delete process.env.CLOUDFLARE_API_TOKEN;
 let res=response();await handler({method:'POST',body:sample,headers:{}},res);
 assert.equal(res.statusCode,503);
 res=response();await handler({method:'GET',body:sample},res);assert.equal(res.statusCode,405);
 process.env.CLOUDFLARE_ACCOUNT_ID='0123456789abcdef0123456789abcdef';process.env.CLOUDFLARE_API_TOKEN='local-test-secret';
 let callCount=0,called;
 globalThis.fetch=async (url,config)=>{
  callCount++;called={url,config};return {ok:true,json:async()=>({success:true,result:model})};
 };
 res=response();await handler({method:'POST',body:sample,headers:{}},res);
 assert.equal(res.statusCode,200);assert.equal(res.body.ok,true);assert.equal(callCount,1);
 assert.match(called.url,/\/ai\/run\/@cf\/meta\/llama-3\.3-70b-instruct-fp8-fast$/);
 assert.equal(JSON.parse(called.config.body).messages[1].role,'user');
 assert(!JSON.stringify(res.body).includes('local-test-secret'));
 res=response();await handler({method:'POST',body:{...sample,statement:'z'.repeat(35000)},headers:{'content-length':'35000'}},res);
 assert.equal(res.statusCode,413);assert.equal(callCount,1);
 globalThis.fetch=async()=>({ok:false,status:503});res=response();await handler({method:'POST',body:sample,headers:{}},res);
 assert.equal(res.statusCode,502);assert.equal(res.body.error,'analysis_unavailable');
 console.log('PASS endpoint, authorization, input bounds, Cloudflare failure and no secret leak');
}finally{globalThis.fetch=originalFetch;
 if(originalEnv.account===undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID; else process.env.CLOUDFLARE_ACCOUNT_ID=originalEnv.account;
 if(originalEnv.token===undefined) delete process.env.CLOUDFLARE_API_TOKEN; else process.env.CLOUDFLARE_API_TOKEN=originalEnv.token;
}
