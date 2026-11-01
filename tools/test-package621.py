"""Pakiet 6.21: sceny z kontekstem długiej rozmowy i filmowe zwroty.
Nie jest to test semantycznej naturalności Z.ai/Groq.
"""
from pathlib import Path
import json,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
OUT=ROOT/'QA-621';OUT.mkdir(exist_ok=True)
report={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,motion in [(390,'reduce'),(768,'no-preference'),(1280,'no-preference')]:
  page=browser.new_page(viewport={'width':width,'height':844},reduced_motion=motion)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='domcontentloaded',timeout=100000)
  data=page.evaluate('''async () => {
   if(!window.PS621_DIALOGUE||!window.PS621_CINEMA)throw Error('6.21 modules absent');
   const before={found:JSON.stringify([...STATE.found]),trial:JSON.stringify(STATE.sim?.trial),deduction:JSON.stringify(STATE.deduction),dialogues:JSON.stringify(STATE.dialogues)};
   const id='MAREK';STATE.activeChar=id;showTab('interview');
   const rows=STATE.dialogues[id];const start=rows.length;
   const questions=['Kiedy rozpoczął się nocny dyżur?','Co wynika z protokołu?','Kto posiadał kartę T-17?','Jak wygląda chronologia nocy?','Czy był Pan obecny?','Skąd się wzięły informacje o godzinie?','Kto odpowiada za dokument?','Co z rejestrem wejść?','Wracając do T-17, czy zapis potwierdza alibi i skąd pewność?'];
   questions.forEach(x=>rows.push({role:'player',text:x},{role:'npc',text:'Nie mogę tego potwierdzić na podstawie własnej obserwacji.'}));
   const a=window.PS621_DIALOGUE.analyze(id);window.PS621_DIALOGUE.render();
   if(!a.long||!a.multi||!a.returns.length)throw Error('No long-thread context');
   if(document.querySelector('#ps621ThreadCue').hidden)throw Error('No thread reaction shown');
   if(window.PS621_DIALOGUE.analyze('ELZBIETA').count!==0)throw Error('Inter-witness memory leak');
   rows.splice(start);window.PS621_DIALOGUE.render();
   if(!document.querySelector('#ps621ThreadCue').hidden)throw Error('Thread cue not cleared');
   if(before.found!==JSON.stringify([...STATE.found])||before.trial!==JSON.stringify(STATE.sim?.trial)||before.deduction!==JSON.stringify(STATE.deduction)||before.dialogues!==JSON.stringify(STATE.dialogues))throw Error('Game state changed');
   const old=window.PS69_STORY.available;window.PS69_STORY.available=()=>['work','warning','access','lastcontact','mechanism'];
   showTab('deduction');window.PS85_STORY.open('work');
   await Promise.resolve();window.PS621_CINEMA.render();
   let scene=window.PS621_CINEMA.status();if(!scene.active||scene.mood!=='paper')throw Error('Cinematic mood absent');
   if(scene.enabled)throw Error('Audio must default to OFF');
   if(!document.getElementById('ps85FilmText').textContent.includes('dyspozycję'))throw Error('Original scene overwritten');
   document.querySelector('#ps85Curtain .ps85-film-actions button').click();
   await Promise.resolve();window.PS621_CINEMA.render();
   if(!document.getElementById('ps85FilmText').textContent.includes('Dopiero zestawienie'))throw Error('No scene continuation');
   document.getElementById('ps85Close').click();
   if(!document.getElementById('ps85Curtain').hidden)throw Error('Scene not closable');
   const ids=['work','warning','access','lastcontact','mechanism','faultline','presence','boundary'];
   const atmos=[];
   for(const id of ids){
    window.PS85_STORY.open(id);await Promise.resolve();window.PS621_CINEMA.render();
    if(document.getElementById('ps85Curtain').hidden)throw Error('Cannot open '+id);
    const mood=window.PS621_CINEMA.status().mood;
    if(!['paper','warning','cold','night'].includes(mood))throw Error('Missing scene visual '+id);
    atmos.push({id,mood});document.getElementById('ps85Close').click();
   }
   window.PS69_STORY.available=old;
   return {questions:questions.length,threads:a.returns,combined:a.topics,scene:scene.caption,audioDefault:scene.enabled,scenes:atmos,docScroll:document.documentElement.scrollWidth,viewport:window.innerWidth};
  }''')
  assert not errors,errors[:4]
  assert data['docScroll']<=width+2,(width,data)
  report[str(width)]=data;print('PASS',width,motion,'thread memory, original cutscene, sound opt-in, no state mutations')
  page.close()
 browser.close()
(OUT/'browser-621.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
