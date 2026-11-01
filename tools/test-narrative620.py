"""Pakiet 6.20: sprawdzenie pochodnego, nieautorytatywnego systemu reakcji.
Nie testuje rzeczywistej naturalnosci odpowiedzi chmurowych.
"""
from pathlib import Path
import json,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'QA-620';OUT.mkdir(exist_ok=True)
HTML=(ROOT/'index.html').read_text(encoding='utf8')
results={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (390,768,1280):
  page=browser.new_page(viewport={'width':width,'height':844})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
  results[str(width)]=page.evaluate('''() => {
   if(!window.PS620_SCENES)throw Error('No living-scene module');
   const before={found:JSON.stringify([...STATE.found]),trial:JSON.stringify(STATE.sim?.trial),
    progression:JSON.stringify(STATE.deduction),dialogue:JSON.stringify(STATE.dialogues)};
   const s=window.PS620_SCENES,ids=CONTENT.characters.map(x=>x.id);
   const texts=new Set(ids.map(id=>s.profiles[id]?.first));
   if(texts.size!==6)throw Error('Missing individual voices');
   STATE.activeChar='ELZBIETA';showTab('interview');s.render();
   const first=document.getElementById('ps620WitnessText').textContent;
   STATE.dialogues.ELZBIETA.push({role:'player',text:'Czy przyznajesz się do zabójstwa Leny?'},{role:'npc',text:'Nie potwierdzam tego.'},
    {role:'player',text:'Dlaczego skłamałaś w sprawie BHP?'},{role:'npc',text:'W aktach jest tylko projekt.'});
   const pressure=s.signals('ELZBIETA');s.render();
   const second=document.getElementById('ps620WitnessText').textContent;
   if(pressure.stage!=='pressure'||first===second)throw Error('No grounded pressure change');
   const irrelevant=s.signals('TOMASZ');if(irrelevant.accusations)throw Error('Inter-witness leak');
   STATE.dialogues.ELZBIETA.splice(-4);
   // Source response cannot be revealed from a question alone.
   STATE.dialogues.ELZBIETA.push({role:'player',text:'Skąd wiesz, że ostrzeżenie wysłano?'},{role:'npc',text:'Sprawdźmy potwierdzenie.'},
    {role:'player',text:'Pokaż, co potwierdzają źródła.'},{role:'npc',text:'Nie ma potwierdzenia wysłania.'});
   const noSource=s.signals('ELZBIETA');
   if(noSource.sourceUnlocked)throw Error('Unexpected BHP source already present');
   s.render();if(!document.querySelector('#ps620WitnessBeat .ps620-next').hidden)throw Error('Unapproved follow-up exposed');
   STATE.found.add('EVID_BHP_DRAFT');STATE.found.add('EVID_OUTBOX_MISSING_SUBMISSION');
   const withSource=s.signals('ELZBIETA');
   if(!withSource.sourceUnlocked)throw Error('Cannot detect verified pair');
   s.render();const displayed=document.getElementById('ps620WitnessText').textContent;
   if(document.querySelector('#ps620WitnessBeat .ps620-next').hidden)throw Error('Verified follow-up missing');
   document.getElementById('chatInput').value='';document.querySelector('#ps620WitnessBeat .ps620-next').click();
   if(!document.getElementById('chatInput').value.includes('projekt zgłoszenia BHP'))throw Error('Follow-up not prepared');
   document.getElementById('chatInput').value='';
   // Return to starting data for mutation audit.
   STATE.found.delete('EVID_BHP_DRAFT');STATE.found.delete('EVID_OUTBOX_MISSING_SUBMISSION');
   STATE.dialogues.ELZBIETA.splice(-4);
   s.render();
   if(before.found!==JSON.stringify([...STATE.found]))throw Error('Evidence mutation');
   if(before.trial!==JSON.stringify(STATE.sim?.trial))throw Error('Finale mutation');
   if(before.progression!==JSON.stringify(STATE.deduction))throw Error('Deduction mutation');
   if(before.dialogue!==JSON.stringify(STATE.dialogues))throw Error('Dialogue mutation');
   const section=document.getElementById('ps620WitnessBeat');
   return {witnesses:ids.length,uniqueScenes:texts.size,pressure:pressure.stage,sourceGated:withSource.sourceUnlocked,
    noEarlyLeak:!noSource.sourceUnlocked,displayedLength:displayed.length,visible:!section.hidden,
    width:document.documentElement.scrollWidth,viewport:window.innerWidth};
  }''')
  assert not errors,errors[:8]
  assert results[str(width)]['width'] <= width + 2,results[str(width)]
  print('PASS viewport',width,'6 identities, pressure, strict source gate, no state mutations')
  page.close()
 browser.close()
(OUT/'narrative620-browser.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
