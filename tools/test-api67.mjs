import assert from 'node:assert/strict';
import handler from '../api/interview.js';
const oldFetch=globalThis.fetch; const oldKey=process.env.ZAI_API_KEY;
process.env.ZAI_API_KEY='test-key-never-shipped';
const canonical='Nie potrafię potwierdzić godziny.';
const bank=[
 {id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'},
 {id:'f1',text:'Rozmawiałam z nią o 21:47.',origin:'public',source:'public-last_seen',certainty:'statement'},
 {id:'f2',text:'To ostatni kontakt, który umiem potwierdzić.',origin:'public',source:'public-last_seen',certainty:'statement'},
 {id:'f3',text:'Nie obserwowałam tego miejsca.',origin:'prior-local',source:'journal-1',certainty:'statement'},
];
const context={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},personality:{temperament:'rzeczowa'},
 knowledge:{currentGroundedAnswer:canonical,alreadySaid:[],documentsShown:[],limits:[],
 groundedOptions:[{id:'turn',kind:'current',text:canonical}],factBank:bank},
 psychology:{blocked:false,contradictions:[]},memory:{conversation:[]}};
const base={version:2,witnessId:'ELZBIETA',canonical,question:'Kiedy ostatnio rozmawiałaś z Leną?',context};
function makeResponse(reply){return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}}
async function call(payload=base){let result;const req={method:'POST',body:payload,headers:{host:'qa.local'},socket:{remoteAddress:'qa67'}};
 const res={setHeader(){return this},status(n){this.code=n;return this},json(body){result={status:this.code||200,body};return this}};await handler(req,res);return result;}
try{
 let requests=[];
 const simulate=(model,review)=>{requests=[];globalThis.fetch=async(url,opts)=>{requests.push(JSON.parse(opts.body));return makeResponse(requests.length===1?model:review)}};
 simulate({decision:'answer',factIds:['f1','f2'],text:'Rozmawiałam z nią o 21:47. Potwierdzam, że to nasza ostatnia rozmowa.'},{relevant:true,entailed:true});
 let r=await call();assert.equal(r.status,200);assert.equal(r.body.decision,'answer');assert.equal(r.body.semanticVerified,true);
 assert.equal(r.body.factIds.length,2);assert.equal(requests.length,2);assert.ok(requests[0].messages[1].content.includes('f1'));
 simulate({decision:'answer',factIds:['f1'],text:'Widziałam ją o 21:47.'},{relevant:false,entailed:true});
 r=await call();assert.equal(r.body.decision,'fallback');assert.equal(r.body.text,canonical);
 simulate({decision:'answer',factIds:['f1'],text:'Spotkałam ją o 21:47, kiedy uciekaliśmy z budynku.'},{relevant:true,entailed:false});
 r=await call();assert.equal(r.body.decision,'answer');assert.equal(r.body.semanticVerified,false);assert.equal(r.body.text,bank[1].text);
 simulate({decision:'answer',factIds:['f3'],text:'Obserwowałam miejsce.'},{relevant:true,entailed:true});
 r=await call();assert.equal(r.body.text,bank[3].text);assert.equal(r.body.semanticVerified,false);
 simulate({decision:'answer',factIds:['f999'],text:'Wiem, kto zabił Lenę.'},{relevant:true,entailed:true});
 r=await call();assert.equal(r.body.decision,'fallback');assert.equal(requests.length,1);
 simulate({decision:'answer',factIds:['f0'],text:canonical},{relevant:true,entailed:true});
 r=await call({...base,context:{...context,knowledge:{...context.knowledge,factBank:[{...bank[0],id:'leaked'}]}}});assert.equal(r.status,400);
 r=await call({...base,context:{...context,knowledge:{...context.knowledge,factBank:[...bank,...Array(40).fill(bank[0])]}}});assert.equal(r.status,400);
 simulate({decision:'answer',factIds:['f1'],text:bank[1].text},{relevant:true,entailed:true});
 globalThis.fetch=async()=>{throw Error('upstream disconnected')};
 r=await call();assert.equal(r.status,503);
 console.log('PASS API67: two-pass semantic review, relevance fallback, unsupported claim rejection, uncertainty/negation safety, invalid fact IDs, malformed corpus, upstream failure');
}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=oldKey}
