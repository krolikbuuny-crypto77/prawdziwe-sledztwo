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
const oldAccount=process.env.CLOUDFLARE_ACCOUNT_ID,oldToken=process.env.CLOUDFLARE_API_TOKEN;
try{
  delete process.env.CLOUDFLARE_ACCOUNT_ID;delete process.env.CLOUDFLARE_API_TOKEN;
  const headers={'content-type':'application/json','x-ps-client':'game',host:'test.local',origin:'https://test.local'};
  let res=response();await handler({method:'POST',body:sample,headers},res);
  assert.equal(res.statusCode,503);
  res=response();await handler({method:'GET',body:sample,headers},res);assert.equal(res.statusCode,405);
  res=response();await handler({method:'POST',body:sample,headers:{...headers,origin:'https://evil.example'}},res);assert.equal(res.statusCode,403);
  res=response();await handler({method:'POST',body:sample,headers:{...headers,'x-ps-client':null}},res);assert.equal(res.statusCode,415);
  console.log('PASS 6.16 legacy contract: validation, advisory output, method, origin, client header, unavailable config');
}finally{
 if(oldAccount===undefined)delete process.env.CLOUDFLARE_ACCOUNT_ID;else process.env.CLOUDFLARE_ACCOUNT_ID=oldAccount;
 if(oldToken===undefined)delete process.env.CLOUDFLARE_API_TOKEN;else process.env.CLOUDFLARE_API_TOKEN=oldToken;
}
