import assert from 'node:assert/strict';
import handler from '../api/interview.js';
const wasFetch=globalThis.fetch,wasKey=process.env.ZAI_API_KEY;
process.env.ZAI_API_KEY='mock-only';
const canonical='Nie potrafię potwierdzić godziny rozpoczęcia zmiany.';
const memory=[{turn:1,topic:'alibi',statement:'Pracowałam przy dokumentacji.',status:'wcześniejsze zeznanie'},
 {turn:2,topic:'alibi',statement:'Nie widziałam nikogo przy bramie.',status:'sprostowane'}];
const context={schema:'ps-witness-context/1',identity:{id:'ELZBIETA',name:'Elżbieta',role:'BHP'},
 knowledge:{currentGroundedAnswer:canonical,groundedOptions:[{id:'turn',kind:'current',text:canonical}],
 factBank:[{id:'f0',text:canonical,origin:'current',source:'turn',certainty:'qualified'}],alreadySaid:[]},
 psychology:{blocked:false,contradictions:[]},memory:{conversation:[],longTerm:memory}};
async function request(extra=context){
 const req={method:'POST',body:{version:2,witnessId:'ELZBIETA',canonical,question:'Przypomnij wcześniejsze alibi.',context:extra},
  headers:{host:'local.qa68'},socket:{remoteAddress:'api68-test'}};
 let response;const res={setHeader(){return this},status(code){this.code=code;return this},json(body){response={status:this.code||200,body};return this}};
 await handler(req,res);return response;
}
try{
 let n=0,scenes=[];
 globalThis.fetch=async(_url,opt)=>{const parsed=JSON.parse(opt.body);scenes.push(parsed);n++;
  return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(n%2===1?
   {decision:'answer',factIds:['f0'],text:canonical}:{relevant:true,entailed:true})}}]})};};
 const ok=await request();assert.equal(ok.status,200);assert.equal(ok.body.decision,'answer');
 const scene=JSON.parse(scenes[0].messages[1].content);
 assert.equal(scene.memory.longTerm.length,2);
 assert.equal(scene.memory.longTerm[1].status,'sprostowane');
 assert.ok(!scene.knowledge.factBank.some(x=>x.text===memory[1].statement));
 const tooMany=await request({...context,memory:{...context.memory,longTerm:Array(7).fill(memory[0])}});
 assert.equal(tooMany.status,400);
 const old=await request({...context,memory:{conversation:[]}});
 assert.equal(old.status,200);
 console.log('PASS API68: long-term citations reach model, do not become independent evidence, bounded input, backward-compatible context');
}finally{globalThis.fetch=wasFetch;if(wasKey===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=wasKey;}
