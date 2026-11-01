"""Pakiet 6.22: rzeczywiste renderowanie SVG i kontrola mimiki w Chromium.
Nie dowodzi ludzkiej naturalności mimiki ani jakości AI, testuje zmiany DOM.
"""
from pathlib import Path
import json,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf8')
OUT=ROOT/'QA-622';OUT.mkdir(exist_ok=True)
res={}
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,motion in ((320,'reduce'),(390,'no-preference'),(768,'no-preference'),(1440,'no-preference')):
  page=b.new_page(viewport={'width':width,'height':820},reduced_motion=motion)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
  result=page.evaluate('''async()=>{
    const api=window.PS622_FACES;
    if(!api)throw Error('PS622_FACES missing');
    const ids=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
    const baseline={evidence:JSON.stringify([...STATE.found]),deduction:JSON.stringify(STATE.deduction),trial:JSON.stringify(STATE.sim?.trial)};
    const test=[];
    showTab('interview');
    for(const id of ids){
      STATE.activeChar=id;renderChat();
      const stage=document.querySelector('#witnessStage .wp-stage');
      if(!stage?.querySelector('.wp-mouth-curve')||stage.querySelectorAll('.wp-eye-unit').length!==2||!stage.querySelector('.wp-brow-motion'))throw Error('Incomplete animated SVG '+id);
      if(!stage.dataset.ps622Emotion)throw Error('Missing expression '+id);
      const initial=stage.dataset.ps622Emotion;
      const st=NPC4_STATE[id],prior=st.tension,rows=STATE.dialogues[id],oldLength=rows.length;
      st.tension=90;rows.push({role:'player',text:'Przyznaj się, zabiłaś Lenę?'},{role:'npc',text:'Nie potwierdzam.'});
      api.refreshCurrent();const underPressure=stage.dataset.ps622Emotion;
      if(!underPressure)throw Error('Missing confrontation expression');
      rows.length=oldLength;st.tension=prior;api.refreshCurrent();
      test.push({id,initial,underPressure});
    }
    const ownedId=[...STATE.found].find(x=>typeof x==='string');
    if(!ownedId)throw Error('No initial owned evidence');
    const magSt=NPC4_STATE.MAGDALENA,magTension=magSt.tension;
    magSt.tension=96;
    const confrontation=api.derive('MAGDALENA',{question:'Co jest w tym dokumencie?',attachedEvidence:ownedId});
    if(confrontation.emotion!=='surprised'||confrontation.reason!=='documented-confrontation')throw Error('Evidence-linked animation missing');
    const unknown=api.derive('MAGDALENA',{question:'Co jest w tym dokumencie?',attachedEvidence:'NOT-COLLECTED'});
    if(unknown.reason==='documented-confrontation')throw Error('Locked proof unlocked facial scene');
    magSt.tension=magTension;
    const stage=document.querySelector('#witnessStage .wp-stage');
    const oldPath=stage.querySelector('.wp-mouth-curve').getAttribute('d');
    api.animate(stage,'MAGDALENA',{question:'Przepraszam, cofamy zarzut.'});
    const newPath=stage.querySelector('.wp-mouth-curve').getAttribute('d');
    if(oldPath===newPath)throw Error('No mouth morph');
    const old=PS69_STORY.available;
    PS69_STORY.available=()=>['work','warning','access','lastcontact','mechanism'];
    const scenes=[];
    for(const title of api.sceneTitles){
      const key={
       'Kurs, który wyprzedził papier':'work','Ostrzeżenie, które nie zatrzymało obiegu':'warning',
       'Przepustka nie ma twarzy':'access','Między powrotem a wiadomością':'lastcontact',
       'Kontakt to nie opis śmierci':'mechanism','Nie jeden błąd, lecz dwa łańcuchy':'faultline',
       'Alibi złożone z cudzych zegarów':'presence','Ostatnia wiadomość nie ma sprawcy':'boundary'
      }[title];
      PS85_STORY.open(key);await Promise.resolve();api.renderStory();
      const cards=[...document.querySelectorAll('#ps622SceneFaces .ps622-face-card')];
      if(cards.length!==2||cards.some(x=>!x.querySelector('.wp-eye-motion')||!x.dataset.ps622Emotion))throw Error('Scene portraits missing '+title);
      scenes.push({title,expressions:cards.map(x=>x.dataset.ps622Emotion)});
      document.getElementById('ps85Close').click();
    }
    PS69_STORY.available=old;
    const trial=STATE.sim.trial;STATE.sim.trial={kind:'returned'};api.renderFinale();
    const finalCards=document.querySelectorAll('#ps622FinalFaces .ps622-face-card');
    if(finalCards.length!==2)throw Error('Final portraits missing');
    STATE.sim.trial=trial;document.getElementById('ps622FinalFaces')?.remove();
    const reduced=api.reducedMotion();
    if(reduced!==matchMedia('(prefers-reduced-motion: reduce)').matches)throw Error('Reduced motion mismatch');
    if(baseline.evidence!==JSON.stringify([...STATE.found])||baseline.deduction!==JSON.stringify(STATE.deduction)||baseline.trial!==JSON.stringify(STATE.sim?.trial))throw Error('Progress changed');
    return {witnesses:test,scenes:scenes.length,finale:finalCards.length,reduced,overflow:document.documentElement.scrollWidth,viewport:innerWidth};
  }''')
  assert not errors,errors[:5]
  assert result['overflow']<=width+2,result
  res[str(width)]=result
  print('PASS',width,motion,'6 SVGs, 8 breakthrough scenes, finale, no progress mutations')
  page.close()
 b.close()
(OUT/'faces622-browser.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
