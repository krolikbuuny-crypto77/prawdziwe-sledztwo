import assert from 'node:assert/strict';
import handler from '../api/interview.js';
const fetchOld=globalThis.fetch;
process.env.ZAI_API_KEY='unit-test-only';
const scene={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},personality:{temperament:'rzeczowa'},knowledge:{currentGroundedAnswer:'Proszę doprecyzować pytanie.',alreadySaid:[],documentsShown:[],limits:[],groundedOptions:[{id:'turn',kind:'current',text:'Proszę doprecyzować pytanie.'},{id:'public-last_seen',kind:'public',text:'Rozmawiałam z nią o 21:47. To ostatni kontakt, który umiem potwierdzić.'}]},psychology:{blocked:false,contradictions:[]},memory:{conversation:[]}};
const payload={version:2,witnessId:'ELZBIETA',canonical:'Proszę doprecyzować pytanie.',question:'Kiedy ostatnio rozmawiałaś z Leną?',context:scene};
async function call(body){let output;const req={method:'POST',body,headers:{host:'game.test'},socket:{remoteAddress:'local'}};const res={setHeader(){return this},status(n){this.code=n;return this},json(j){output={status:this.code||200,body:j};return this}};await handler(req,res);return output}
try{
 let modelRequest;
 globalThis.fetch=async(_url,opts)=>{modelRequest=JSON.parse(opts.body);return{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'answer',sourceIds:['public-last_seen'],text:'Rozmawiałam z nią o 21:47. To ostatni kontakt, który umiem potwierdzić.',prefaceKey:0})}}]})}};
 let a=await call(payload);assert.equal(a.status,200);assert.equal(a.body.sourceId,'public-last_seen');assert.equal(a.body.decision,'answer');
 assert.ok(modelRequest.messages[0].content.includes('sens pytania'));assert.ok(modelRequest.messages[1].content.includes('21:47'));
 globalThis.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({decision:'answer',sourceIds:['secret-from-future'],text:'Wiem, kto zabił.',prefaceKey:0})}}]})});
 a=await call(payload);assert.equal(a.status,200);assert.equal(a.body.decision,'fallback');assert.equal(a.body.sourceId,'turn');
 a=await call({...payload,context:{...scene,knowledge:{...scene.knowledge,groundedOptions:[{id:'turn',kind:'current',text:'FAŁSZ'}]}}});assert.equal(a.status,400);
 a=await call({...payload,context:{...scene,knowledge:{...scene.knowledge,groundedOptions:new Array(14).fill(scene.knowledge.groundedOptions[0])}}});assert.equal(a.status,400);
 a=await call({...payload,context:{...scene,psychology:{blocked:true,contradictions:[]}}});assert.equal(a.status,400);
 console.log('PASS API66: sense-first prompt, vetted answer selection, unknown sources fallback, invalid source bank rejected');
}finally{globalThis.fetch=fetchOld;delete process.env.ZAI_API_KEY}
