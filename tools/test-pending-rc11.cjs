const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||chromium.executablePath(),headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
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
  console.log('PASS RC11 browser: pending question survives navigation, no provisional gameplay mutation, verified Groq accepted exactly once, controls restored, no JS errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
