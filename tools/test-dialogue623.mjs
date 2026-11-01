import assert from 'node:assert/strict';
import handler from '../api/interview.js';
import {spokenStyleGuide,reviewSpokenReply} from '../lib/spoken-dialogue-623.js';
const ids=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
for(const id of ids){
 const guide=spokenStyleGuide(id,'Skąd pani to wie?');
 assert.match(guide,/mów|Mów|Odpowiadasz/);
 assert.match(guide,/Nie wygłaszaj|Nie wyjaśniaj/);
 assert(!guide.includes('SPOILER'));}
const good='Zapis pokazuje użycie karty T-17. Ale skąd pan wie, kto ją wtedy miał?';
const stiff='Nie twierdzę, że wyciąga pan z tego zbyt daleko idące wnioski. Twierdzę, że należy rozpatrzyć ten aspekt w szerszym kontekście.';
assert.equal(reviewSpokenReply(good).ok,true);
assert.equal(reviewSpokenReply(stiff).ok,false);
assert.equal(reviewSpokenReply('*patrzy nerwowo* Nie wiem.').ok,false);
assert.equal(reviewSpokenReply('Nie wiem.').ok,true);
assert.equal(reviewSpokenReply('O którą kartę chodzi?').ok,true);
const canonical='Rejestr pokazuje użycie karty T-17, ale nie potwierdza, kto fizycznie wszedł.';
const fact={id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'};
const base={schema:'ps-witness-context/1',identity:{id:'MAGDALENA',name:'Magdalena Kaczmarek',role:'audytorka'},
 personality:{temperament:'kontrolowana',diction:[],speakingStyle:[]},
 knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:[fact]},
 psychology:{blocked:false,contradictions:[]},memory:{conversation:[{role:'witness',text:'Nie byłam przy tych drzwiach.'},{role:'player',text:'Skąd pani wie, że nikt nie wszedł?'}]},
 request:{semanticPlan:{primary:'question',intents:['question'],aspects:[],slots:{compound:false,negated:false}}}};
const question='Twierdziła pani, że nikogo tam nie było. A zapis T-17?';
const audit={relevant:true,entailed:true,complete:true,coveredParts:[]};
const goodReply='Karta T-17 została użyta, ale nie wiadomo z tego zapisu, kto wszedł. Skąd pan wie, kto ją miał?';
const originalFetch=globalThis.fetch,priorZ=process.env.ZAI_API_KEY,priorG=process.env.GROQ_API_KEY;
process.env.ZAI_API_KEY='mock-623-z';process.env.GROQ_API_KEY='mock-623-g';
let calls=[],responses={};
function mock(zai,groq){calls=[];responses={zai:[...zai],groq:[...groq]};globalThis.fetch=async(url,opt)=>{
 const id=url.includes('groq.com')?'groq':'zai';const req=JSON.parse(opt.body);calls.push({provider:id,request:req});const reply=responses[id].shift();
 if(reply instanceof Error)throw reply;
 if(!reply)return {ok:false,status:503};
 return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})};
};}
async function submit(custom=base,q=question){const req={method:'POST',headers:{host:'local.623'},socket:{remoteAddress:'qa623'},body:{version:3,witnessId:'MAGDALENA',canonical:custom.knowledge.currentGroundedAnswer,question:q,context:custom}};
 const res={setHeader(){return this;},status(n){this.statusCode=n;return this;},json(obj){this.body=obj;return this;}};
 await handler(req,res);return res;}
try{
 // Sztuczny monolog Z.ai: bez kolejnego audytu, natychmiast Groq.
 mock([{decision:'answer',factIds:['f0'],text:stiff}], [{decision:'answer',factIds:['f0'],text:goodReply},audit]);
 const r=await submit();assert.equal(r.statusCode,200);assert.equal(r.body.decision,'answer');assert.equal(r.body.text,goodReply);
 assert.deepEqual(calls.map(x=>x.provider),['zai','groq','groq']);
 const sceneZ=JSON.parse(calls[0].request.messages[1].content),sceneG=JSON.parse(calls[1].request.messages[1].content);
 assert.equal(sceneZ.spokenGuide,sceneG.spokenGuide);assert.deepEqual(sceneZ.knowledge.factBank,sceneG.knowledge.factBank);
 assert.match(sceneZ.spokenGuide,/Mog|Magdalena|kart/i);
 // Naturalna odpowiedź pierwszego dostawcy pozostaje priorytetowa.
 mock([{decision:'answer',factIds:['f0'],text:goodReply},audit],[]);
 const primary=await submit();assert.equal(primary.body.decision,'answer');assert.deepEqual(calls.map(x=>x.provider),['zai','zai']);
 // Halucynowane przyznanie i awaria rezerwy -> bezpieczna odpowiedź lokalna.
 mock([{decision:'answer',factIds:['f0'],text:'To ja zabiłam Lenę.'}],[new Error('offline')]);
 const fallback=await submit();assert.equal(fallback.body.decision,'fallback');assert.equal(fallback.body.text,canonical);
 // Naturalna odpowiedź nie musi recytować obu godzin z wielofaktowego źródła.
 const timeFact='Karta T-17 została użyta o 01:44, ale zapis nie wskazuje osoby.';
 const extended={...base,knowledge:{...base.knowledge,currentGroundedAnswer:timeFact,groundedOptions:[{id:'turn',kind:'current',text:timeFact}],factBank:[{...fact,text:timeFact}]}};
 const concise='Karta T-17 została użyta, ale nie wiadomo z tego, kto ją miał.';
 mock([{decision:'answer',factIds:['f0'],text:concise},audit],[]);
 const omitted=await submit(extended,'Czy ten zapis mówi, kto miał kartę?');
 assert.equal(omitted.body.text,concise);
 const invented='O 03:20 użyto karty T-17, ale nie ustalono osoby.';
 mock([{decision:'answer',factIds:['f0'],text:invented}],[new Error('down')]);
 const changed=await submit(extended,'Kto miał kartę?');
 assert.equal(changed.body.decision,'fallback');assert.equal(changed.body.text,timeFact);
 // W przypadku pustego lub niedozwolonego banku nie używamy wymyślonych faktów.
 for(const bad of ['*zaciska pięści* Nie wiem.','W świetle przedstawionych materiałów nie jestem w stanie jednoznacznie potwierdzić, że tak było.'])assert(!reviewSpokenReply(bad).ok);
 console.log('PASS 6.23: natural dialogue, style rejection triggers Groq, approved Z.ai priority, identical bank of facts, fallback, no fictional confession');
}finally{
 globalThis.fetch=originalFetch;
 if(priorZ===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=priorZ;
 if(priorG===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=priorG;
}
