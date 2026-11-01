"""Pakiet 6.6, prawdziwa ścieżka UI z symulowanym Z.ai; nie mierzy rozumienia prawdziwego modelu."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf8').replace("const online=/^https?:$/.test(location.protocol);", "const online=true;")
CHROME=shutil.which('chromium') or shutil.which('google-chrome')
assert CHROME
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=CHROME,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 # Each ground option comes from an allowed public statement, not a hidden knowledge proposition.
 info=page.evaluate('''() => {const ids=CONTENT.characters.map(x=>x.id);return ids.map(id=>{const c=PS65_CONTEXT.read(id,'Nie umiem ustalić godziny.','Kiedy ostatnio ją widziałeś?',0);return {id,options:c.knowledge.groundedOptions,hidden:Object.hasOwn(c,'confrontations')||Object.hasOwn(c,'future')}})}''')
 assert len(info)==6
 for c in info:
  assert c['options'][0]['id']=='turn' and len(c['options'])>=5
  assert not c['hidden']
 print('PASS: grounded safe candidate answers for 6 profiles')
 page.evaluate('''() => {
   window.__qa66=[];window.__qa66mode='valid';
   window.fetch=async(url,req)=>{
    const p=JSON.parse(req.body);window.__qa66.push(p);
    if(window.__qa66mode==='offline')return{ok:false,status:503};
    const opts=p.context.knowledge.groundedOptions;
    const wanted=window.__qa66mode==='invalid'?'future-secret':'public-alibi';
    const ids=window.__qa66mode==='multi'?['public-alibi','public-last_seen']:[wanted];
    const chosen=ids.map(id=>opts.find(x=>x.id===id)||opts[0]);
    return{ok:true,status:200,json:async()=>({decision:'answer',sourceIds:ids,text:window.__qa66mode==='hallucination'?'Przyznaję się do morderstwa o 01:10.':chosen.map(x=>x.text).join(' '),prefaceKey:0})};
   };
  }''')
 # Ask per witness, the model chooses the known alibi, bypassing a bad keyword-based local response.
 for id in [c['id'] for c in info]:
  page.evaluate('''id=>{STATE.activeChar=id;showTab('interview');renderChat();document.getElementById('chatInput').value='Czy możesz dokładniej powiedzieć, gdzie byłeś podczas swojej zmiany?';document.getElementById('chatSend').click()}''',id)
  page.wait_for_function('!window.PS77_AI.busy',timeout=18000)
  response=page.evaluate('''id=>({text:STATE.dialogues[id].at(-1).text,found:STATE.found.size,shown:window.__qa66.at(-1).context.knowledge.groundedOptions})''',id)
  selected=next(x['text'] for x in response['shown'] if x['id']=='public-alibi')
  assert response['text']==selected,(id,response['text'],selected)
  assert not errors,errors
 assert len(page.evaluate('window.__qa66'))==6
 print('PASS: 6 UI messages pick a grounded answer by source id, no extra evidence')
 before=page.evaluate('STATE.found.size')
 # A compound question may use two independent, safe testimony sentences.
 page.evaluate("window.__qa66mode='multi'")
 page.evaluate('''() => {STATE.activeChar='ELZBIETA';showTab('interview');document.getElementById('chatInput').value='Gdzie byłaś i kiedy ostatnio rozmawiałaś z Leną?';document.getElementById('chatSend').click()}''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=18000)
 multi=page.evaluate('''() => ({text:STATE.dialogues.ELZBIETA.at(-1).text,options:window.__qa66.at(-1).context.knowledge.groundedOptions})''')
 expected=' '.join(next(x['text'] for x in multi['options'] if x['id']==id) for id in ['public-alibi','public-last_seen'])
 assert multi['text']==expected and before==page.evaluate('STATE.found.size')
 print('PASS: compound question answered from two safe sources without altering progress')
 page.evaluate("window.__qa66mode='invalid'")
 page.evaluate('''() => {STATE.activeChar='MAREK';showTab('interview');document.getElementById('chatInput').value='Kto jest sprawcą?';document.getElementById('chatSend').click()}''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=18000)
 last=page.evaluate('STATE.dialogues.MAREK.at(-1).text')
 assert 'future-secret' not in last and before==page.evaluate('STATE.found.size')
 print('PASS: invented source id cannot influence dialogue / investigation state')
 page.evaluate("window.__qa66mode='hallucination'")
 page.evaluate('''() => {STATE.activeChar='JANUSZ';showTab('interview');document.getElementById('chatInput').value='Gdzie byłeś?';document.getElementById('chatSend').click()}''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=18000)
 last=page.evaluate('STATE.dialogues.JANUSZ.at(-1).text')
 assert 'Przyznaję się do morderstwa' not in last and before==page.evaluate('STATE.found.size')
 print('PASS: hallucinated confession rejected on client')
 assert not errors,errors
 browser.close()
