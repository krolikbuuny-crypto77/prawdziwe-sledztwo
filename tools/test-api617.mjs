import assert from 'node:assert/strict';
import handler,{attemptInterview} from '../api/interview.js';
import {initialState,validateAction,rules,appendReportedTurn,approvedHistory} from '../lib/server-state.js';
import {classifyCanonicalStatement,classifyModelReply} from '../lib/story-consistency.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
const oldFetch=globalThis.fetch,oldZ=process.env.ZAI_API_KEY,oldG=process.env.GROQ_API_KEY;
process.env.ZAI_API_KEY='mock-zai';process.env.GROQ_API_KEY='mock-groq';
const canonical='Nie pamiętam dokładnej godziny spotkania.';
const base={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},
 personality:{temperament:'rzeczowa',diction:['krótko'],speakingStyle:['spokojnie']},
 knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],
 groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'}]},
 psychology:{blocked:false,contradictions:[]},memory:{conversation:[]},request:{semanticPlan:{primary:'time_precision',intents:['time_precision'],aspects:['time_precision'],slots:{compound:false,negated:false}}}};
const answer={decision:'answer',factIds:['f0'],text:canonical};
const audit={relevant:true,entailed:true,complete:true,coveredParts:[]};
function withMock(routes){const calls=[];globalThis.fetch=async(url,opts)=>{
 const provider=url.includes('groq.com')?'groq':'zai';calls.push({provider,body:JSON.parse(opts.body)});
 const next=routes[provider]?.shift();if(next instanceof Error)throw next;
 if(next===undefined)return {ok:false,status:503,json:async()=>({})};
 return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(next)}}]})};
};return calls;}
async function submit(){let result;const req={method:'POST',headers:{host:'test.local'},socket:{remoteAddress:'test617'},body:{version:3,witnessId:'ELZBIETA',canonical,question:'O której doszło do spotkania?',context:base}};
const res={setHeader(){return this;},status(code){this.statusCode=code;return this;},json(body){result={status:this.statusCode||200,body};return this;}};
await handler(req,res);return result;}
try{
 let calls=withMock({zai:[answer,audit],groq:[]});let r=await submit();
 assert.equal(r.body.decision,'answer');assert.deepEqual(calls.map(x=>x.provider),['zai','zai']);
 calls=withMock({zai:[new Error('connection lost')],groq:[answer,audit]});r=await submit();
 assert.equal(r.body.decision,'answer');assert.deepEqual(calls.map(x=>x.provider),['zai','groq','groq']);
 calls=withMock({zai:[answer,{...audit,complete:false}],groq:[answer,audit]});r=await submit();
 assert.equal(r.body.decision,'answer');assert.deepEqual(calls.map(x=>x.provider),['zai','zai','groq','groq']);
 assert.deepEqual(calls[0].body.messages[1].content,calls[2].body.messages[1].content,'identical approved context for both providers');
 calls=withMock({zai:[{decision:'answer',factIds:['secret'],text:'Zabiłam Lenę.'}],groq:[new Error('rate limit')]});r=await submit();
 assert.equal(r.body.decision,'fallback');
 assert.equal(r.body.text,trustedScene({identity:{id:'ELZBIETA'},question:'O której doszło do spotkania?',knowledge:{documentsShown:[]}},null).knowledge.currentGroundedAnswer,
   'the safe fallback must come from the trusted server-owned canon, not the browser-supplied string');
 assert.deepEqual(calls.map(x=>x.provider),['zai','groq']);
 const scene=initialState();assert.deepEqual(scene.approvedEvidence,rules.initial);assert.equal(scene.verdict,null);
 const id=rules.searchable.find(id=>!rules.gates[id]?.length);assert(id);
 assert.equal(validateAction(scene,{type:'collect_evidence',docId:id,origin:'area-search',area:'BAD'}).ok,false);
 const ok=validateAction(scene,{type:'collect_evidence',docId:id,origin:'area-search',area:rules.documents[id].area});assert.equal(ok.ok,true);assert(ok.state.approvedEvidence.includes(id));
 assert.equal(validateAction(scene,{type:'caseCompleted',verdict:'win'}).ok,false);
 assert.equal(validateAction(scene,{type:'collect_evidence',docId:'MED-04',origin:'area-search',area:'med'}).ok,false);
 const spot=Object.values(rules.spots).find(x=>!rules.gates[x.doc]?.length);
 const c=rules.challenges[spot.id];
 assert.equal(validateAction(scene,{type:'collect_evidence',docId:spot.doc,origin:'scene-inspection',spotId:spot.id,room:spot.room,method:c.method,answer:c.correct+1}).ok,false);
 const allowed=validateAction(scene,{type:'collect_evidence',docId:spot.doc,origin:'scene-inspection',spotId:spot.id,room:spot.room,method:c.method,answer:c.correct});assert.equal(allowed.ok,true);
 const ledger=appendReportedTurn(scene,'ELZBIETA','Pytanie','Zatwierdzona odpowiedź',['f0']);
 assert.equal(approvedHistory(ledger,'ELZBIETA').length,2);assert.equal(scene.witnesses.ELZBIETA.length,0);
 assert.equal(ledger.verdict,null);
 assert.equal(classifyModelReply({relevant:true,entailed:false,complete:true},true),'model_error');
 assert.equal(classifyCanonicalStatement('MAREK','dowolna fałszywa wiadomość',rules.initial),'unresolved_statement');
 const w=rules.scriptedCorrections.MAREK;const advanced=[...new Set([...rules.initial,...w.gates[0]])];
 assert.equal(classifyCanonicalStatement('MAREK',w.text,advanced),'scripted_correction');
 console.log('PASS 6.17: provider priority, outage + semantic failover, common context, local fallback, server-side evidence rules, immutable witness ledger, no browser verdict');
}finally{globalThis.fetch=oldFetch;for(const [k,v] of [['ZAI_API_KEY',oldZ],['GROQ_API_KEY',oldG]]){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
