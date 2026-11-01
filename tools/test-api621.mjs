import assert from 'node:assert/strict';
import {questionTopics,buildThreadCue} from '../lib/dialogue-threads-621.js';
import {appendReportedTurn,approvedHistory,initialState} from '../lib/server-state.js';
const ids=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const sequence=['Kiedy po nocnym dyżurze zmieniono kurs?','Skąd zna Pan godzinę wejścia?','Co potwierdzają dokumenty?','Czy karta T-17 daje pewne alibi?','Dlaczego ostrzeżenia nie wysłano?','Czy widziała Pani Lenę?','Wracając do karty T-17, kto wszedł i skąd mamy pewność?'];
assert(questionTopics(sequence.at(-1)).includes('access'));
assert(questionTopics(sequence.at(-1)).includes('sources'));
assert(questionTopics('Czy karta T-17 daje alibi?').length>1);
for(const id of ids){
 let s=initialState();for(let n=0;n<26;n++)s=appendReportedTurn(s,id,sequence[n%sequence.length],'Nie potwierdzam szczegółów, których nie obserwowałem.',[], 'unresolved_statement');
 const history=approvedHistory(s,id);assert.equal(history.length,48,'48 approved messages retained');
 const cue=buildThreadCue(id,history,sequence.at(-1));assert.match(cue,/temat|wątko|pytanie/u);assert.match(cue,/kart|log/u);
 assert.ok(cue.length<1200);assert.equal(buildThreadCue('INVALID',history,sequence.at(-1)),'');
 assert.equal(s.approvedEvidence.length,initialState().approvedEvidence.length);
 const correction=[...history,{role:'witness',text:'Sprostowanie zapisane formalnie.',narrativeStatus:'scripted_correction'}];
 assert.match(buildThreadCue(id,correction,sequence.at(-1)),/sprostowanie/i);
}
const oldZ=process.env.ZAI_API_KEY,oldG=process.env.GROQ_API_KEY,oldFetch=globalThis.fetch;
process.env.ZAI_API_KEY='test-only';process.env.GROQ_API_KEY='test-only';
const {default:handler}=await import('../api/interview.js');
const invoked=[];
globalThis.fetch=async (url,opts)=>{const p=JSON.parse(opts.body);invoked.push({url,p});return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'fallback',factIds:[],text:''})}}]})};};
const canonical='Nie mogę potwierdzić tego, czego osobiście nie widziałem.';
const context={schema:'ps-witness-context/1',identity:{id:'MAREK',name:'Marek',role:'kierownik'},knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'}]},psychology:{blocked:false,contradictions:[]},memory:{conversation:sequence.map(text=>({role:'player',text}))},request:{semanticPlan:{primary:'source',intents:['source'],aspects:['source'],slots:{compound:false,negated:false}}}};
const req={method:'POST',headers:{host:'local.test'},socket:{remoteAddress:'qa621'},body:{version:3,witnessId:'MAREK',canonical,question:sequence.at(-1),context}};
const res={setHeader(){return this;},status(x){this.statusCode=x;return this;},json(x){this.body=x;return this;}};
try{
 await handler(req,res);assert.equal(res.statusCode,200);assert.equal(res.body.decision,'fallback');assert.equal(invoked.length,2);
 const scenes=invoked.map(x=>JSON.parse(x.p.messages[1].content));
 assert.equal(scenes[0].deliveryGuide,scenes[1].deliveryGuide);
 assert.match(scenes[0].deliveryGuide,/wielowątkowej|powrac|temat/u);
 assert.deepEqual(scenes[0].knowledge.factBank,scenes[1].knowledge.factBank);
 console.log('PASS 6 witnesses x 26 turns (48 history entries); same Z.ai/Groq threaded context; fallback unchanged');
}finally{
 globalThis.fetch=oldFetch;
 if(oldZ===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=oldZ;
 if(oldG===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=oldG;
}
