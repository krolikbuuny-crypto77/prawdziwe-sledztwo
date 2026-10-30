"""The canonical local draft MUST NOT mutate gameplay while a free-form AI turn is pending."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text().replace('const online=/^https?:$/.test(location.protocol);','const online=true; /* QA fixture */')
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page()
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=80000)
    page.evaluate('''()=>{
      showTab('interview');STATE.activeChar='MAREK';
      window.__baseline={sim:JSON.stringify(STATE.sim),npc4:JSON.stringify(NPC4_STATE.MAREK),
         npc9:JSON.stringify(NPC9_MEMORY.MAREK),length:STATE.dialogues.MAREK.length,
         memory:JSON.stringify(PS68_MEMORY.inspect().MAREK),approved:PS65_CONTEXT.inspect().MAREK};
      window.fetch=(url,opts={})=>{
        if(url==='/api/game-state')return Promise.resolve({ok:true,status:200});
        if(url!=='/api/interview')throw Error('Unexpected '+url);
        const payload=JSON.parse(opts.body);window.__question=payload;
        return new Promise(resolve=>{window.__resolveInterview=()=>resolve({ok:true,status:200,json:async()=>({
          ok:true,serverCanonical:true,semanticVerified:true,decision:'answer',provider:'zai',
          turnId:payload.turnId,text:'Nie pamiętam dokładnej godziny spotkania.'
        })});});
      };
      document.getElementById('chatInput').value='Gdzie był pan w czasie alarmu?';
      document.getElementById('chatSend').click();
    }''')
    page.wait_for_function('()=>typeof window.__resolveInterview===\'function\'&&window.PS77_AI.busy',timeout=10000)
    interim=page.evaluate('''()=>({sim:JSON.stringify(STATE.sim),npc4:JSON.stringify(NPC4_STATE.MAREK),
      npc9:JSON.stringify(NPC9_MEMORY.MAREK),length:STATE.dialogues.MAREK.length,
      memory:JSON.stringify(PS68_MEMORY.inspect().MAREK),approved:PS65_CONTEXT.inspect().MAREK})''')
    baseline=page.evaluate('window.__baseline')
    assert interim==baseline,(interim,baseline)
    page.evaluate('window.__resolveInterview()')
    page.wait_for_function('()=>!window.PS77_AI.busy',timeout=12000)
    accepted=page.evaluate('''()=>({length:STATE.dialogues.MAREK.length,
      answer:STATE.dialogues.MAREK.at(-1)?.text,provider:STATE.dialogues.MAREK.at(-1)?.ai?.provider,
      context:PS65_CONTEXT.inspect().MAREK,memory:PS68_MEMORY.inspect().MAREK})''')
    assert accepted['length']==baseline['length']+2,accepted
    assert accepted['provider']=='zai',accepted
    assert accepted['answer']=='Nie pamiętam dokładnej godziny spotkania.',accepted
    assert accepted['context']>=baseline['approved']+1,accepted
    assert not errors,errors
    print('PASS 6.36 transaction: no gameplay changes while cloud pending; accepted response commits once; canonical ledger updated only after approval')
    browser.close()
