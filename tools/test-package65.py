"""Pakiet 6.5 — kontrolowany kontekst, brak spojlerów i bezpieczny fallback Z.ai.
Uruchomienie całkowicie offline, endpoint /api/interview jest symulowany.
"""
import json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
# Only in the isolated test HTML: enable HTTP path without opening a real external server.
HTML=HTML.replace("const online=/^https?:$/.test(location.protocol);", "const online=true;")
import shutil
CHROME=shutil.which('chromium') or shutil.which('google-chrome')
assert CHROME
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=CHROME,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 page.evaluate('''() => {
  window.__psRequests=[];window.__psMode='valid';
  window.fetch=async (url,request) => {
   if(url!=='/api/interview')throw Error('Unexpected outbound URL '+url);
   const p=JSON.parse(request.body);window.__psRequests.push(p);
   if(window.__psMode==='offline')return {ok:false,status:503};
   const data=window.__psMode==='malicious'?{decision:'answer',sourceId:'public-alibi',text:'Przyznaję się do morderstwa, zrobiłem to ja o 01:44.',prefaceKey:0}:
       {decision:'fallback',sourceId:'turn',text:p.canonical,prefaceKey:1};
   return {ok:true,status:200,json:async()=>data};
  };
 }''')
 info=page.evaluate('''() => {
  const context=PS65_CONTEXT.read('MAREK','Nadzorowałem nocną zmianę.','Gdzie byłeś tej nocy?',0);
  const id=Object.keys(NPC9_PROFILES),person=CONTENT.characters[0];
  const before=STATE.found.size;
  return {id,ctx:context,found:before,inspect:PS_WITNESS_ENGINE.inspect(),html:document.querySelectorAll('script').length};
 }''')
 assert len(info['id'])==6 and info['inspect']['cloud']=='zai_primary_semantics_v5'
 assert len(info['inspect']['layers']['send'])==9
 assert info['ctx']['personality']['temperament'] and info['ctx']['emotions']['trust']>=0
 assert info['ctx']['knowledge']['currentGroundedAnswer']=='Nadzorowałem nocną zmianę.'
 assert 'knowledge' not in info['ctx']['personality']
 assert 'confrontations' not in info['ctx'] and 'future' not in info['ctx']
 assert not info['ctx']['psychology']['contradictions']
 assert info['ctx']['relations']==[]
 assert len(info['ctx']['memory']['conversation'])<=12
 print('PASS profiles for 6 witnesses; emotion, memory, revealed knowledge and no hidden contradictions')
 for char in info['id']:
  page.evaluate('''(id) => {STATE.activeChar=id;showTab('interview');renderChat();document.getElementById('chatInput').value='Opowiedz o swojej pracy.';document.getElementById('chatSend').click()}''',char)
  page.wait_for_function('!window.PS77_AI.busy',timeout=18000)
  payloads=page.evaluate("window.__psRequests")
  if payloads:
   p=payloads[-1]
   assert p['witnessId'] in info['id'] and p['version']==3 and p['context']['identity']['id']==p['witnessId']
   assert p['canonical']==p['context']['knowledge']['currentGroundedAnswer']
  assert not errors,errors
 assert len(payloads)==6, len(payloads)
 print('PASS 6 HTTP mock requests include per-witness identity/personality/emotions/memory; no JS exceptions')
 # One malicious answer rejected without changing facts or adding material.
 page.evaluate("window.__psMode='malicious'")
 page.evaluate('''() => {STATE.activeChar='MAREK';showTab('interview');document.getElementById('chatInput').value='Co wiesz o dokumentach?';document.getElementById('chatSend').click()}''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=18000)
 checked=page.evaluate('''() => ({answer:STATE.dialogues.MAREK.at(-1)?.text,found:STATE.found.size})''')
 assert 'Przyznaję się do morderstwa' not in checked['answer']
 assert checked['found']==info['found']
 print('PASS fabricated confession rejected, no new evidence')
 # Failing cloud request leaves canonical response in game.
 page.evaluate("window.__psMode='offline'")
 page.evaluate('''() => {STATE.activeChar='TOMASZ';showTab('interview');document.getElementById('chatInput').value='Jak wyglądała twoja służba?';document.getElementById('chatSend').click()}''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=18000)
 response=page.evaluate('''() => STATE.dialogues.TOMASZ.at(-1)?.text''')
 assert isinstance(response,str) and len(response)>12 and not errors
 print('PASS cloud error preserves local dialogue; no client exceptions')
 browser.close()
