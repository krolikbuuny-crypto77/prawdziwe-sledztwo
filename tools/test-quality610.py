"""Pakiet 6.10: odtwarzalne 36 tur UI z audytu 6.9, bez rzeczywistego Z.ai.
Asercje sprawdzają bezpośredniość odpowiedzi i brak wycieku dowodów.
Nie zastępują niezależnej oceny jakości semantycznej przez człowieka.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, shutil, re
ROOT=Path(__file__).resolve().parent.parent
OUTPUT=ROOT/'qa610';OUTPUT.mkdir(exist_ok=True)
PROMPTS=[
 'Gdzie przebywałeś podczas nocnej zmiany?',
 'Kto może potwierdzić, że naprawdę tam byłeś?',
 'Nie pytam o dokument, tylko o to, co sam widziałeś.',
 'Jak możesz mieć pewność, że nikt tam nie wszedł, skoro tego nie obserwowałeś?',
 'Przypomnij wcześniejsze zeznanie o alibi.',
 'Czy przyznajesz się do zabójstwa Leny?'
]
html=(ROOT/'index.html').read_text('utf8')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=60000)
 ids=page.evaluate('CONTENT.characters.map(c=>c.id)')
 before=page.evaluate('STATE.found.size')
 results=[]
 for id in ids:
  for i,q in enumerate(PROMPTS):
   out=page.evaluate('''([id,q])=>{
     STATE.activeChar=id;showTab('interview');renderChat();
     const input=document.getElementById('chatInput'),button=document.getElementById('chatSend');
     if(!input||!button)return {error:'missing-ui'};
     const log=STATE.dialogues[id],n=log.length;input.value=q;button.click();
     return {delta:log.length-n,answer:log.at(-1)?.text||'',turn:log.at(-1)?.role,found:STATE.found.size,
       status:NPC9_MEMORY[id].semantic.at(-1)?.status,topic:NPC9_MEMORY[id].semantic.at(-1)?.topic};
   }''',[id,q]);results.append({'witness':id,'type':i,'question':q,**out})
 assert not errors,errors
 assert len(results)==36 and all(r['delta']==2 and r['turn']=='npc' and r['answer'] for r in results),results
 assert all(r['found']==before for r in results),'Dialogues generated evidence'
 def relevant(r):
  s=r['answer'].lower()
  t=r['type']
  if t==2:return 'widz' in s or 'obserw' in s
  if t==3:return ('pewno' in s or 'twierdzi' in s) and ('obserw' in s or 'widzia' in s)
  if t==5:return 'przyznaj' in s and ('zabójst' in s or 'zabój' in r['question'])
  return bool(s.strip())
 score={str(i):sum(relevant(r) for r in results if r['type']==i) for i in range(6)}
 assert all(score[str(i)]==6 for i in range(6)),{'score':score,'misses':[r for r in results if not relevant(r)]}
 # Separately test that a question about allegations in general is NOT classified as a confession request.
 for q in ['Kto zabił Lenę?','Co wiesz o zabójstwie Leny?','Czy Marek zabił Lenę?','Gdzie byłeś tej nocy?']:
  assert page.evaluate('(q)=>PS610_INTENT.classify(q)',q) is None,q
 assert all(page.evaluate('(q)=>PS610_INTENT.classify(q)',q)==kind for q,kind in [
  ('Nie pytam o dokument. Chcę usłyszeć, co widziałaś na własne oczy.','personalObservation'),
  ('Jak możesz mieć pewność, skoro nie widziałeś wejścia?','epistemicChallenge'),
  ('Czy przyznajesz się do zabójstwa Leny?','directAccusation')])
 OUTPUT.joinpath('qa610-ui-36.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),'utf8')
 OUTPUT.joinpath('qa610-summary.json').write_text(json.dumps({'source':'Chromium, offline; not real Z.ai','questions':len(results),'witnesses':len(ids),'score_by_type':score,'script_errors':errors,'evidence_added':0},ensure_ascii=False,indent=2),'utf8')
 browser.close()
 print('PASS: 36 UI turns; semantic intent smoke checks '+json.dumps(score)+'; no evidence and no JS errors')
