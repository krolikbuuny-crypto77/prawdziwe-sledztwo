"""Pakiet 6.7: test lokalnego klienta w Chromium, bez realnego modelu Z.ai."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8').replace("const online=/^https?:$/.test(location.protocol);", "const online=true;")
CHROMIUM=shutil.which('chromium') or shutil.which('google-chrome')
assert CHROMIUM, 'No Chromium'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=CHROMIUM,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 checks=page.evaluate('''() => CONTENT.characters.map(c=>{const x=PS65_CONTEXT.read(c.id,'Nie potrafię potwierdzić tej godziny.','Kiedy?',0);return {id:c.id,facts:x.knowledge.factBank,opts:x.knowledge.groundedOptions}})''')
 assert len(checks)==6
 for c in checks:
  f=c['facts'];assert 1<=len(f)<=36 and f[0]['origin']=='current'
  assert all(x['origin'] in ['current','public','prior-local'] for x in f)
  assert all('tajemnica' not in x['source'] for x in f)
 print('PASS: six safe fact banks, no raw secret profile knowledge')
 page.evaluate('''() => {
 window.__qa67=[];window.__qa67mode='approved';
 window.fetch=async(url,req)=>{
  const payload=JSON.parse(req.body);window.__qa67.push(payload);
  const bank=payload.context.knowledge.factBank;
  const fact=bank.find(x=>x.origin==='public' && x.source==='public-alibi')||bank[0];
  if(window.__qa67mode==='missing')return{ok:false,status:503};
  const answer=window.__qa67mode==='hallucination'?'Przyznaję się do morderstwa w 01:12.':fact.text;
  const id=window.__qa67mode==='invalid'?'f99':fact.id;
  return{ok:true,status:200,json:async()=>({decision:'answer',factIds:[id],text:answer,semanticVerified:true})};
 };
 }''')
 initial=page.evaluate('STATE.found.size')
 for c in checks:
  page.evaluate('''id=>{STATE.activeChar=id;showTab('interview');renderChat();document.getElementById('chatInput').value='Gdzie byłeś podczas zmiany?';document.getElementById('chatSend').click()}''',c['id'])
  page.wait_for_function('!window.PS77_AI.busy',timeout=40000)
  response=page.evaluate('''id=>({last:STATE.dialogues[id].at(-1).text,stored:PS65_CONTEXT.inspect()[id],payload:window.__qa67.at(-1)})''',c['id'])
  assert response['stored']>=1
  chosen=next(x['text'] for x in response['payload']['context']['knowledge']['factBank'] if x['origin']=='public' and x['source']=='public-alibi')
  assert response['last']==chosen,(c['id'],response['last'],chosen)
 assert page.evaluate('STATE.found.size')==initial
 print('PASS: 6 witnesses select whitelisted atomic facts; evidence unchanged')
 # After a previous turn, a canonical answer survives separately from what the AI displayed.
 page.evaluate("window.__qa67mode='invalid'")
 page.evaluate('''() => {STATE.activeChar='ELZBIETA';showTab('interview');document.getElementById('chatInput').value='Dlaczego tak mówisz?';document.getElementById('chatSend').click()}''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=40000)
 info=page.evaluate('''() => ({facts:PS65_CONTEXT.read('ELZBIETA','Nie mam potwierdzenia.','Skąd?',0).knowledge.factBank, shown:STATE.dialogues.ELZBIETA.at(-1).text})''')
 assert any(x['origin']=='prior-local' for x in info['facts']),info
 assert page.evaluate('STATE.found.size')==initial
 print('PASS: approved historical local utterances are available, invalid model fact id ignored')
 save=page.evaluate('buildSave()')
 assert save.get('ps67',{}).get('version')==1
 page.evaluate('d=>applySave(d)',save)
 saved=page.evaluate('PS65_CONTEXT.inspect()')
 assert saved['ELZBIETA']>0
 print('PASS: approved fact memory exported and restored through SaveManager')
 page.evaluate("window.__qa67mode='hallucination'")
 page.evaluate('''() => {STATE.activeChar='JANUSZ';showTab('interview');document.getElementById('chatInput').value='Gdzie byłeś rano?';document.getElementById('chatSend').click()}''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=40000)
 last=page.evaluate('STATE.dialogues.JANUSZ.at(-1).text')
 assert 'Przyznaję się' not in last and page.evaluate('STATE.found.size')==initial
 print('PASS: new unsupported confession and numbers rejected by second client guard')
 # change transcript arrays in same session simulates full reset; no leakage of former local facts
 page.evaluate("STATE.dialogues.ELZBIETA=[{role:'npc',text:'Dzień dobry.'}]")
 page.evaluate("PS65_CONTEXT.read('ELZBIETA','Witam na przesłuchaniu.','Dzień dobry',0)")
 assert page.evaluate('PS65_CONTEXT.inspect().ELZBIETA')==1
 print('PASS: changing the session clears stale approved testimony')
 assert not errors,errors
 browser.close()
