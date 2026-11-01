"""Pakiet 6.15: Z.ai jest głównym twórcą widocznej odpowiedzi, bez utraty offline fallback."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf8').replace("const online=/^https?:$/.test(location.protocol);", "const online=true;")
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
    page.evaluate("""() => {window.__requests=[];window.__resolver=null;
      window.fetch=(url,options)=>{const payload=JSON.parse(options.body);window.__requests.push(payload);
       return new Promise(resolve=>{window.__resolver=resolve;});};}
    """)
    page.evaluate("""() => {STATE.activeChar='ELZBIETA';showTab('interview');renderChat();
      document.getElementById('chatInput').value='Kiedy rozmawiałaś z Leną?';
      document.getElementById('chatSend').click();}
    """)
    page.wait_for_function('window.PS77_AI.busy')
    assert page.evaluate('window.__requests[0].version')==3
    assert page.evaluate("document.querySelector('#chatLog .bubble.npc:last-child').textContent").endswith('Formułuje odpowiedź…')
    assert page.evaluate('STATE.dialogues.ELZBIETA.at(-1).text')!='Formułuje odpowiedź…'
    page.evaluate("""() => {window.__resolver({ok:true,status:200,json:async()=>({ok:true,decision:'fallback',text:window.__requests[0].canonical})});} """)
    page.wait_for_function('!window.PS77_AI.busy')
    assert not page.evaluate("document.querySelector('#chatLog .bubble.npc:last-child').textContent").endswith('Formułuje odpowiedź…')
    assert not errors,errors
    # Approved AI wording is the visible reply, but not a new canonical fact.
    page.evaluate("""() => {document.getElementById('chatInput').value='Co pamiętasz z pracy?';document.getElementById('chatSend').click();}""")
    page.wait_for_function('window.PS77_AI.busy')
    canonical=page.evaluate('STATE.dialogues.ELZBIETA.at(-1).text')
    old_memory=page.evaluate('NPC9_MEMORY.ELZBIETA.semantic.at(-1)?.answer')
    page.evaluate("""() => {
       const payload=window.__requests.at(-1);
       const selected=payload.context.knowledge.factBank.find(x=>x.origin==='current');
       window.__expected=selected.text+' To jest zakres informacji, który potrafię potwierdzić.';
       window.__resolver({ok:true,status:200,json:async()=>({ok:true,decision:'answer',primaryMode:true,
        semanticVerified:true,factIds:[selected.id],text:window.__expected})});
    }""")
    page.wait_for_function('!window.PS77_AI.busy')
    assert page.evaluate('STATE.dialogues.ELZBIETA.at(-1).text')==page.evaluate('window.__expected')
    assert page.evaluate('NPC9_MEMORY.ELZBIETA.semantic.at(-1)?.answer')==old_memory
    assert canonical!=page.evaluate('window.__expected')
    # Enter must use WitnessEngine.submit and API, not old direct sendChat.
    page.evaluate("""() => {document.getElementById('chatInput').value='Opowiedz o swojej pracy.';document.getElementById('chatInput').focus();}""")
    page.evaluate("document.getElementById('chatInput').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))")
    page.wait_for_function('window.PS77_AI.busy')
    assert page.evaluate('window.__requests.length')==3
    assert page.evaluate("document.querySelector('#chatLog .bubble.npc:last-child').textContent").endswith('Formułuje odpowiedź…')
    page.evaluate("""() => {window.__resolver({ok:false,status:503});}""")
    page.wait_for_function('!window.PS77_AI.busy')
    assert page.evaluate("STATE.dialogues.ELZBIETA.at(-1).role")== 'npc'
    assert not page.evaluate("document.querySelector('#chatLog .bubble.npc:last-child').textContent").endswith('Formułuje odpowiedź…')
    assert not errors,errors
    print('PASS UI 6.15: AI-first v3; pending text not saved; accepted AI reply visible but canonical memory preserved; Enter calls cloud; HTTP failure restores local answer; no JS exceptions')
    browser.close()
