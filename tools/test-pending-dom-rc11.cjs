const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 let dom;const errors=[];
 try{
  const page={
   async setContent(html){
    const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
    dom=new JSDOM(html,{url:'https://qa.invalid',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
     w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
     w.fetch=async()=>({ok:false,status:503,json:async()=>({})});
     w.ResizeObserver=class{observe(){} disconnect(){}};
     w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.play=async function(){};w.HTMLMediaElement.prototype.pause=function(){};
     w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
    }});
   },
   async evaluate(fn){return dom.window.eval('('+fn.toString()+')()');},
   async waitForFunction(fn){const deadline=Date.now()+10000;while(!await this.evaluate(fn)){if(Date.now()>deadline)throw Error('DOM wait timeout');await new Promise(r=>setImmediate(r));}},
   locator(selector){return {innerText:async()=>dom.window.document.querySelector(selector).textContent};}
  };
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8')
   .replace('const online=/^https?:$/.test(location.protocol);','const online=true;');
  await page.setContent(html,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   showTab('interview');STATE.activeChar='MAREK';renderChat();
   window.testBaseline={length:STATE.dialogues.MAREK.length,sim:JSON.stringify(STATE.sim),npc:JSON.stringify(NPC4_STATE.MAREK)};
   window.fetch=async(url,opts)=>{
    if(url==='/api/game-state')return {ok:true,status:200};
    if(url!=='/api/interview')throw Error('Unexpected URL');
    const payload=JSON.parse(opts.body);
    return new Promise(resolve=>{window.testResolve=()=>resolve({ok:true,status:200,json:async()=>({
     decision:'answer',serverCanonical:true,semanticVerified:true,provider:'groq',turnId:payload.turnId,
     text:'Jestem kierownikiem zajezdni i odpowiadam za rozliczenia zmian.'
    })});});
   };
   document.getElementById('chatInput').value='Jaką funkcję pełnił pan w zajezdni?';
   document.getElementById('chatSend').click();
  });
  await page.waitForFunction(()=>typeof window.testResolve==='function');
  const pending=await page.evaluate(()=>({
   same:STATE.dialogues.MAREK.length===testBaseline.length&&JSON.stringify(STATE.sim)===testBaseline.sim&&JSON.stringify(NPC4_STATE.MAREK)===testBaseline.npc,
   text:document.getElementById('chatLog').textContent,
   disabled:document.getElementById('chatSend').disabled
  }));
  assert(pending.same);assert(pending.disabled);assert(pending.text.includes('Jaką funkcję'));assert(pending.text.includes('Formułuje odpowiedź'));
  await page.evaluate(()=>{showTab('inspection');showTab('interview');});
  assert.match(await page.locator('#chatLog').innerText(),/Jaką funkcję[\s\S]*Formułuje odpowiedź/);
  await page.evaluate(()=>window.testResolve());
  await page.waitForFunction(()=>!PS77_AI.busy);
  const accepted=await page.evaluate(()=>({length:STATE.dialogues.MAREK.length,before:testBaseline.length,
   provider:STATE.dialogues.MAREK.at(-1).ai?.provider,text:document.getElementById('chatLog').textContent,
   disabled:document.getElementById('chatSend').disabled}));
  assert.equal(accepted.length,accepted.before+2);assert.equal(accepted.provider,'groq');assert(!accepted.disabled);
  assert(accepted.text.includes('Jestem kierownikiem zajezdni i odpowiadam'));assert(!accepted.text.includes('Formułuje odpowiedź'));
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>{
   window.testCooldownCalls=0;
   document.getElementById('chatInput').value='Kto może potwierdzić pana obecność?';
   window.fetch=async url=>{
    if(url!=='/api/interview')return {ok:true,status:200,json:async()=>({})};
    window.testCooldownCalls++;
    return {ok:false,status:503,json:async()=>({fallbackReason:'gemini_invalid_request;groq_rate_limited',retryAfterSeconds:5})};
   };
   document.getElementById('chatSend').click();
  });
  await page.waitForFunction(()=>!PS77_AI.busy);
  assert(await page.evaluate(()=>document.getElementById('chatSend').disabled));
  assert.match(await page.locator('#ps77-response-wait').innerText(),/odczekać 5 s/);
  await page.evaluate(()=>{showTab('files');showTab('interview');document.getElementById('chatSend').click();});
  assert.equal(await page.evaluate(()=>window.testCooldownCalls),1);
  await page.waitForFunction(()=>!document.getElementById('chatSend').disabled);
  assert.equal(await page.evaluate(()=>window.testCooldownCalls),1);
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>{
   window.testFailedLength=STATE.dialogues.MAREK.length;
   window.fetch=async url=>url==='/api/game-state'?{ok:true,status:200}:{ok:false,status:503,json:async()=>({fallbackReason:'gemini_timeout;groq_rate_limited'})};
   document.getElementById('chatInput').value='Kto może potwierdzić pana obecność?';document.getElementById('chatSend').click();
  });
  await page.waitForFunction(()=>!PS77_AI.busy);
  assert(await page.evaluate(()=>STATE.dialogues.MAREK.length===window.testFailedLength));
  assert.equal(await page.evaluate(()=>document.getElementById('chatInput').value),'Kto może potwierdzić pana obecność?');
  assert.match(await page.locator('#ps77-response-wait').innerText(),/Gemini Flash.*Groq/);
  assert.deepEqual(errors,[]);
  console.log('PASS RC11 DOM runtime: pending question survives navigation, no provisional gameplay mutation, verified Groq accepted exactly once, controls restored, no JS errors');
 }finally{dom?.window.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
