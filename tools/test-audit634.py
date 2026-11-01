"""Regression tests for production QA report. No public server or Supabase calls."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
R=Path(__file__).resolve().parent.parent
cases=[
 ('MAREK','Powiedział pan, że nie siedział tam bez przerwy. Dokąd pan wtedy wychodził i kto mógł pana tam widzieć?','Nie wskażę osoby'),
 ('ELZBIETA','Jakie zagrożenia BHP występowały przy stanowisku nr 3?','ryzyku'),
 ('ELZBIETA','Kiedy ostatnio rozmawiała pani z Leną?','21:47'),
 ('KAMIL','Czym różni się użycie konta od fizycznej obecności człowieka?','fizyczną obecność'),
]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content((R/'index.html').read_text(),wait_until='domcontentloaded',timeout=100000)
 for id,q,part in cases:
  answer=page.evaluate('''([id,q])=>{const c=CONTENT.characters.find(x=>x.id===id);const ans=npc4Answer(c,q,'');return {ans,plan:PS633_INTENT.analyzeQuestion(q),s:NPC9_MEMORY[id].semantic.at(-1),st:NPC9_MEMORY[id].statements.at(-1)};}''',[id,q])
  assert part.lower() in answer['ans'].lower(),(q,answer['ans'],answer['plan']['primary'])
  if id!='MAREK': assert answer['s']['answer']==answer['ans'] and answer['st']['text']==answer['ans'],(id,answer)
 locked=page.evaluate('''()=>{
  PS_MG3_QA.refresh();const status=PS_MG3_QA.status();
  const panel=document.getElementById('p3-tcms');
  document.querySelector('[data-open-lab="0"]')?.click();PS_MG3_QA.refresh();
  const html=panel?.innerHTML||document.getElementById('p3-tcms')?.innerHTML||'';
  return {ready:PS_MG3_QA.ready('tcms'),status:PS_MG3_QA.status(),validated:PS_MG3_QA.validate('tcms',0),html};
 }''')
 assert not locked['ready'] and locked['status']['tcms']==0,locked
 assert 'Brakuje wymaganych materiałów' in locked['validated'],locked
 assert 'P0326' not in locked['html'] and 'DIAG-217' not in locked['html'],locked['html'][:900]
 if locked['html']:assert 'Analiza niedostępna' in locked['html'],locked['html'][:1000]
 unlocked=page.evaluate('''()=>{
 STATE.found.add(TCMS_INPUT[1]);PS_MG3_QA.refresh();
 return {ready:PS_MG3_QA.ready('tcms'),html:document.getElementById('p3-tcms')?.innerHTML||''};
 }''')
 assert unlocked['ready'],unlocked
 assert unlocked['html'] and 'P0326' in unlocked['html'],unlocked['html'][:700]
 assert not errors,errors
 print('PASS 6.34 focused witness cases:',len(cases),'+ evidence status + TCMS locked/unlocked + JS runtime')
 browser.close()
# Real browser event path for presented VIS-02; neither live cloud nor DB is used.
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 page.set_content((R/'index.html').read_text(),wait_until='domcontentloaded',timeout=100000)
 photo=page.evaluate('''()=>{
  STATE.found.add('VIS-02');renderAttached();
  document.getElementById('attachedDoc').value='VIS-02';
  document.getElementById('chatInput').value='Czy widział pan osłonę przed przyjazdem ratowników?';
  ps52Ask();
  return {answer:STATE.dialogues.MAREK.at(-1).text,
    semantic:NPC9_MEMORY.MAREK.semantic.at(-1).answer,
    statement:NPC9_MEMORY.MAREK.statements.at(-1).text};
 }''')
 assert 'fotografia' in photo['answer'].lower() and 'wydruk godzin' not in photo['answer'].lower().replace('nie wydruk godzin','')
 assert photo['answer']==photo['semantic']==photo['statement']
 print('PASS 6.34 VIS-02 photographic evidence confrontation; transcript/memory aligned')
 browser.close()
