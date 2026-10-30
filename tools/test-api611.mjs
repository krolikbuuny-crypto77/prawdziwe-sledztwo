import assert from 'node:assert/strict';
import handler from '../api/interview.js';
const oldFetch=globalThis.fetch, oldKey=process.env.ZAI_API_KEY;
process.env.ZAI_API_KEY='test-only';
const canonical='Nie potrafię potwierdzić godziny.';
const semanticPlan={primary:'time_precision',intents:['time_precision','victim_contact'],aspects:['time_precision','victim_contact'],
 slots:{negated:false,compound:true},needsClarification:false,evidenceSourceQuestion:false};
const context={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},
 knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],
 groundedOptions:[{id:'turn',kind:'current',text:canonical}],
 factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'},
 {id:'f1',text:'Rozmawiałam z nią o 21:47.',origin:'public',source:'public-last_seen',certainty:'statement'}]},
 psychology:{blocked:false,contradictions:[]}, memory:{conversation:[],longTerm:[]},request:{semanticPlan}};
const base={version:2,witnessId:'ELZBIETA',canonical,question:'O której rozmawiałaś z Leną?',context};
async function run(data){let out;const req={method:'POST',headers:{host:'test.local'},socket:{remoteAddress:'test-611'},body:data};
 const res={setHeader(){return this;},status(s){this.code=s;return this;},json(x){out={status:this.code||200,body:x};return this;}};
 await handler(req,res);return out;}
let calls=[];
try{
 globalThis.fetch=async(url,opts)=>{
  const payload=JSON.parse(opts.body);calls.push(payload);
  const scene=JSON.parse(payload.messages[1].content);
  const selected=scene?.knowledge?.factBank?.find(f=>/21:47/.test(f.text))||scene?.knowledge?.factBank?.[0];
  return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(
   {decision:'answer',factIds:[selected.id],text:selected.text})}}]})};
 };
 let r=await run(base);assert.equal(r.status,200);assert.equal(r.body.decision,'answer');
 assert.equal(calls.length,1); // Literal server-verified answer uses fast path.
 assert.ok(calls[0].messages[1].content.includes('last_contact'));
 assert(!calls[0].messages[1].content.includes('time_precision'));
 r=await run({...base,context:{...context,request:{semanticPlan:{...semanticPlan,intents:Array(20).fill('x')}}}});
 assert.equal(r.status,400);
 console.log('PASS API611: server-generated plan controls trusted facts; unbounded client plan rejected');
}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=oldKey;}
