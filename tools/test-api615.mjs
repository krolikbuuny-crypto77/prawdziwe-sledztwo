import assert from 'node:assert/strict';
import handler from '../api/interview.js';
const oldFetch=globalThis.fetch,oldKey=process.env.ZAI_API_KEY;
process.env.ZAI_API_KEY='testing-only';
const canonical='Nie pamiętam dokładnej godziny spotkania.';
const context={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},
 personality:{temperament:'rzeczowa',diction:['krótko'],speakingStyle:['spokojnie']},
 knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],
 groundedOptions:[{id:'turn',kind:'current',text:canonical}],
 factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'},
 {id:'f1',text:'Ostatni kontakt z Leną był o 21:47.',origin:'public',source:'public-last_seen',certainty:'statement'},
 {id:'f2',text:'Nie widziałam jej potem.',origin:'public',source:'public-last_seen',certainty:'statement'}]},
 psychology:{blocked:false,contradictions:[]},memory:{conversation:[]},request:{semanticPlan:{primary:'time_precision',intents:['time_precision'],aspects:['time_precision'],slots:{compound:false,negated:false}}}};
let n=0,prompts=[];const answers=[];
function mock(first,audit){n=0;prompts=[];globalThis.fetch=async(_url,opts)=>{
 const req=JSON.parse(opts.body);prompts.push(req);const answer=++n===1?first:audit;
 return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(answer)}}]})};
}}
async function query(version=3){let result;
 const req={method:'POST',headers:{host:'test.local'},socket:{remoteAddress:'test615'},body:{version,witnessId:'ELZBIETA',canonical,question:'Kiedy rozmawiałaś z Leną i czy widziałaś ją później?',context}};
 const res={setHeader(){return this;},status(code){this.statusCode=code;return this;},json(body){result={status:this.statusCode||200,body};return this;}};
 await handler(req,res);return result;
}
try{
 const first={decision:'answer',factIds:['f1','f2'],text:'Rozmawiałam z Leną o 21:47. Później już jej nie widziałam.'};
 mock(first,{relevant:true,entailed:true,complete:true,coveredParts:[]});
 let r=await query(3);assert.equal(r.status,200);assert.equal(r.body.decision,'answer');assert.equal(r.body.primaryMode,true);assert.equal(r.body.semanticVerified,true);assert.equal(n,2);
 assert.match(prompts[0].messages[0].content,/oryginalnym pytaniem/i);assert.match(prompts[1].messages[0].content,/complete/i);
 mock(first,{relevant:true,entailed:true,complete:false,coveredParts:[]});r=await query(3);
 assert.equal(r.body.decision,'fallback');assert.equal(r.body.text,canonical);
 mock(first,{relevant:true,entailed:false,complete:true,coveredParts:[]});r=await query(3);
 assert.equal(r.body.decision,'fallback');assert.equal(r.body.text,canonical);
 mock({decision:'answer',factIds:['f500'],text:'Widziałam mordercę.'},{relevant:true,entailed:true,complete:true,coveredParts:[]});
 r=await query(3);assert.equal(r.body.decision,'fallback');assert.equal(n,1);
 mock(first,{relevant:true,entailed:true,coveredParts:[]});r=await query(2);assert.equal(r.body.decision,'fallback');
 mock(first,{relevant:true,entailed:true,coveredParts:[]});r=await query(3);assert.equal(r.body.decision,'fallback');
 console.log('PASS API 6.17: AI-first v3; whole-question audit; incomplete/unentailed fallback; backward-compatible v2 request');
}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=oldKey;}
