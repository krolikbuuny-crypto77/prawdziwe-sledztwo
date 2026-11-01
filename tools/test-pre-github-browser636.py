"""Browser: malformed HTTP 200 never emits local testimony or modifies turn counters."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parent.parent/'index.html').read_text()
html=html.replace('const online=/^https?:$/.test(location.protocol);','const online=true; /* test fixture */')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=80000)
 def inspect():
  return page.evaluate('''()=>({length:STATE.dialogues.MAREK.length,log:STATE.dialogues.MAREK.at(-1)?.text,
    input:document.getElementById('chatInput').value, time:STATE.sim.time,trust:STATE.sim.trust,errors:STATE.sim.errors,
    npc4:{...NPC4_STATE.MAREK},npc9:{...NPC9_MEMORY.MAREK},witness:{...simWitness(CONTENT.characters.find(x=>x.id==='MAREK'))},
    memory:PS68_MEMORY.inspect().MAREK,approved:PS65_CONTEXT.inspect().MAREK, stage:window.stage3.export()})''')
 page.evaluate('''()=>{showTab('interview');STATE.activeChar='MAREK';window.fetch=async(_u,opts)=>{
    if(_u==='/api/game-state')return {ok:true,status:200};
    const json=JSON.parse(opts.body);
    return {ok:true,status:200,json:async()=>({ok:true,decision:'answer',serverCanonical:true,
      semanticVerified:true,provider:'zai',text:'<nieprawidłowy HTML>',turnId:json.turnId})};
 };}''')
 baseline=inspect()
 page.evaluate("document.getElementById('chatInput').value='Gdzie był pan w czasie alarmu?';document.getElementById('chatSend').click()")
 page.wait_for_function('()=>!window.PS77_AI.busy',timeout=12000)
 result=inspect()
 for key in ('length','time','trust','errors','npc4','npc9','memory','approved','stage'):
  assert result[key]==baseline[key],(key,baseline[key],result[key])
 assert result['input']=='Gdzie był pan w czasie alarmu?',result
 assert 'nieprawidłową' in page.locator('#ps77-response-wait').inner_text().lower()
 assert not errors,errors
 page.evaluate('''()=>{window.fetch=async(_u,opts)=>{
   if(_u==='/api/game-state')return {ok:true,status:200};
   const json=JSON.parse(opts.body);
   return {ok:true,status:200,json:async()=>({ok:true,decision:'answer',serverCanonical:true,
     semanticVerified:true,provider:'zai',model:'glm-test',text:'Nie pamiętam dokładnej godziny spotkania.',turnId:json.turnId})};
 };document.getElementById('chatSend').click();}''')
 page.wait_for_function('()=>!window.PS77_AI.busy',timeout=12000)
 result=inspect();assert result['length']==baseline['length']+2,result
 assert result['log']=='Nie pamiętam dokładnej godziny spotkania.',result
 assert page.evaluate('STATE.dialogues.MAREK.at(-1).ai.provider')=='zai'
 assert not errors,errors
 print('PASS browser: invalid HTTP200 restores input and all known counters/memory; subsequent accepted AI reply displayed')
 browser.close()
