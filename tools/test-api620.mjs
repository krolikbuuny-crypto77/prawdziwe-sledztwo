import assert from 'node:assert/strict';
import {dialogueContinuity} from '../lib/dialogue-continuity-620.js';
import {styleForWitness} from '../lib/narrative-voice-619.js';
const people=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const cues=new Set();
for(const id of people){
 const cue=dialogueContinuity(id,[{role:'player',text:'Czy przyznajesz się do zabójstwa?'}, {role:'witness',text:'Nie potwierdzam.'}, {role:'player',text:'Czy przyznajesz się do zabójstwa?'}]);
 assert.ok(cue&&styleForWitness(id));assert.match(cue,/zarzut|oskarżeni|konfrontacji|decyzji/iu);cues.add(cue);
}
assert.equal(cues.size,6);
const prior=[{role:'player',text:'Skąd wiesz, co potwierdzają dokumenty?'},{role:'witness',text:'Nie mam pewności'}];
assert.match(dialogueContinuity('KAMIL',prior),/konkretne pytanie/u);
assert.equal(dialogueContinuity('UNKNOWN',prior),'');
assert.equal(dialogueContinuity('MAREK',[]),'');
assert.doesNotMatch(dialogueContinuity('MAREK',[{role:'witness',text:'Przyznaję się do nowego dowodu'}]),/zarzutu/);
console.log('PASS 6 distinct styles; no new evidence or guilt from testimony; approved-player-history cues only');

// Oba modele otrzymuja ten sam server-side opis zachowania, bez ujawniania kluczy przegladarce.
const {default: handler}=await import('../api/interview.js');
const originalFetch=globalThis.fetch,oldZ=process.env.ZAI_API_KEY,oldG=process.env.GROQ_API_KEY;
process.env.ZAI_API_KEY='qa620-only';process.env.GROQ_API_KEY='qa620-only';
const invoked=[];
globalThis.fetch=async (url,opts)=>{
  const payload=JSON.parse(opts.body);invoked.push({url,payload});
  return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'fallback',factIds:[],text:''})}}]})};
};
const canonical='Nie pamiętam szczegółu. Mogę wskazać wyłącznie zapis, który znam.';
const context={schema:'ps-witness-context/1',identity:{id:'KAMIL',name:'Kamil',role:'technik'},
 knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'}]},
 psychology:{blocked:false,contradictions:[]},
 memory:{conversation:[{role:'player',text:'Skąd wiesz, że tak było?'},{role:'witness',text:canonical},{role:'player',text:'Przypomnij, skąd wiesz, co pokazuje karta?'}]},
 request:{semanticPlan:{primary:'source',intents:['source'],aspects:['source'],slots:{compound:false,negated:false}}}};
let responded;
const req={method:'POST',headers:{host:'test620.local'},socket:{remoteAddress:'qa620'},body:{version:3,witnessId:'KAMIL',canonical,question:'Pokaż, jakie masz źródło.',context}};
const res={setHeader(){return this;},status(n){this.statusCode=n;return this;},json(x){responded={status:this.statusCode,body:x};return this;}};
try{
 await handler(req,res);
 assert.equal(responded.status,200);assert.equal(responded.body.decision,'fallback');
 assert.equal(invoked.length,2);
 const first=JSON.parse(invoked[0].payload.messages[1].content);
 const second=JSON.parse(invoked[1].payload.messages[1].content);
 assert.equal(first.deliveryGuide,second.deliveryGuide);
 assert.match(first.deliveryGuide,/logów|Kiedy wraca sprawa logów/u);
 assert.match(first.deliveryGuide,/konkretne pytanie/u);
 assert.equal(first.knowledge.factBank.length,second.knowledge.factBank.length);
 console.log('PASS Z.ai and Groq share server-side continuity cues and the same grounded fact bank');
}finally{
 globalThis.fetch=originalFetch;
 if(oldZ===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=oldZ;
 if(oldG===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=oldG;
}
