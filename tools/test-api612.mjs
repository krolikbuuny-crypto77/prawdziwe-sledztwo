import assert from 'node:assert/strict';
import handler from '../api/interview.js';
const oldFetch=globalThis.fetch,oldKey=process.env.ZAI_API_KEY;
process.env.ZAI_API_KEY='qa-test-only';
const canonical='Nie potrafię potwierdzić dokładnej godziny.';
const fact='Rozmawiałam z Leną o 21:47.';
const question='O której rozmawiałaś z Leną i kto to potwierdzi?';
const plan={primary:'time_precision',intents:['time_precision','corroboration'],aspects:['time_precision','corroboration'],
 slots:{negated:false,compound:true},clauses:[{text:'O której rozmawiałaś z Leną',intents:['time_precision']},
 {text:'kto to potwierdzi',intents:['corroboration']}]};
const context={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},
 knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],
 groundedOptions:[{id:'turn',kind:'current',text:canonical}],
 factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'},
 {id:'f1',text:fact,origin:'public',source:'public-last_seen',certainty:'statement'}]},
 psychology:{blocked:false,contradictions:[]},memory:{conversation:[],longTerm:[]},request:{question,semanticPlan:plan}};
const base={version:2,witnessId:'ELZBIETA',canonical,question,context};
async function execute(body){let out;const req={method:'POST',headers:{host:'test.local'},socket:{remoteAddress:'test-612'},body};
 const res={setHeader(){return this;},status(s){this.code=s;return this;},json(x){out={status:this.code||200,body:x};return this;}};
 await handler(req,res);return out;}
async function scenario(coveredParts){let calls=[];
 globalThis.fetch=async(url,options)=>{const scene=JSON.parse(JSON.parse(options.body).messages[1].content);calls.push(scene);
 const response=calls.length===1?{decision:'answer',factIds:['f1'],text:fact}:
 {relevant:true,entailed:true,coveredParts,reason:'mock'};
 return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(response)}}]})};};
 const out=await execute(base);return {out,calls};}
try{
 const no=await scenario([true,false]);assert.equal(no.out.status,200);assert.equal(no.out.body.decision,'fallback');
 assert.equal(no.calls.length,2);assert.equal(no.calls[1].questionParts.length,2);
 const yes=await scenario([true,true]);assert.equal(yes.out.body.decision,'answer');
 assert.equal(yes.out.body.text,fact);
 const missing=await scenario(undefined);assert.equal(missing.out.body.decision,'fallback');
 console.log('PASS API612: incomplete or absent clause coverage rejected; two-part coverage accepted only after independent audit');
}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=oldKey;}
