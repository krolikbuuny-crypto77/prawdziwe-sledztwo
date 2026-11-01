"""6.32 browser/local regression; no real providers, Supabase, or production changes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json, shutil
R=Path(__file__).resolve().parent.parent
questions=[
 ('JANUSZ','Dlaczego brakuje wpisu w dokumentacji warsztatu?','brakuje'),
 ('JANUSZ','Co oznacza brakujący wpis w dokumentacji zlecenia TW-217?','brakuje'),
 ('JANUSZ','Jak wyjaśnisz niepełny formularz zlecenia?','brakuje'),
 ('ELZBIETA','Czy zgłoszenie BHP zostało wysłane?','nie mogę potwierdzić'),
 ('ELZBIETA','Czy wysłałaś zgłoszenie BHP?','nie mogę potwierdzić'),
 ('ELZBIETA','Czy raport BHP został dostarczony?','nie mogę potwierdzić'),
 ('KAMIL','Co dokładnie potwierdza autoryzację?','autoryzację'),
 ('KAMIL','Co potwierdza autoryzację testu?','autoryzację'),
 ('KAMIL','Jak sprawdzić autoryzację testu?','autoryzację'),
 ('TOMASZ','Nie pytam, kiedy ostatni raz widziałeś Lenę. Gdzie byłeś w nocy?','dyspozytorni'),
 ('TOMASZ','Nie pytam, kiedy ostatni raz widziałeś Lenę. Kto zgłosił znalezienie jej ciała?','02:02'),
 ('TOMASZ','Nie pytam o ostatni kontakt z Leną, tylko gdzie byłeś od 01:30 do 02:05?','dyspozytorni'),
 ('TOMASZ','Gdzie przebywałeś między 01:30 a 02:05?','dyspozytor'),
 ('TOMASZ','Kto zgłosił znalezienie Leny i o której godzinie?','02:02'),
]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'), headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (390,1280):
  page=browser.new_page(viewport={'width':width,'height':844});errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content((R/'index.html').read_text(encoding='utf8'),wait_until='domcontentloaded',timeout=100000)
  data=page.evaluate('''questions=>{
    const old=[...STATE.found],total=STATE.found.size;
    const rows=questions.map(([id,q])=>{const c=CONTENT.characters.find(x=>x.id===id);
      const ans=npc4Answer(c,q,'');return {id,q,ans,focus:PS632_SCOPE.classify(id,q),
      sem:NPC9_MEMORY[id].semantic.at(-1)?.answer,st:NPC9_MEMORY[id].statements.at(-1)?.text};});
    const guarded=[['JANUSZ','Kto zabił Lenę i dlaczego brakuje wpisu w zleceniu?'],
      ['ELZBIETA','Czy zataiłaś zgłoszenie BHP i wysłałaś je?'],
      ['KAMIL','Czy przyznajesz się do fałszowania autoryzacji?']]
      .map(([id,q])=>({id,q,kind:PS632_SCOPE.classify(id,q)}));
    const chosen=PS_PHOTO_ASSETS.evidenceImages['bay::bay_photo'];
    STATE.scene12.discovered.push('bay_photo');scPick('bay_photo');
    PS_ETAP2_QA.gotoInspection();PS_ETAP2_QA.turn(180);
    const caption=()=>document.querySelector('#et1EvidenceVisual .et1-evidence-caption small')?.textContent;
    const before=caption();STATE.scene12.inspected.push('bay_photo');PS_ETAP2_QA.turn(300);
    const afterStudy=caption();STATE.found.add(SC_BY_SPOT.bay_photo.doc);PS_ETAP2_QA.turn(60);
    const afterSecure=caption();STATE.found.delete(SC_BY_SPOT.bay_photo.doc);
    return {rows,guarded,before,afterStudy,afterSecure,unchanged:STATE.found.size===total,layer:PS_WITNESS_ENGINE.inspect().layers.answer.at(-1)};
  }''',questions)
  for row,(_,_,contains) in zip(data['rows'],questions):
   assert row['ans'] and contains.lower() in row['ans'].lower(),row
   assert row['sem']==row['ans'] and row['st']==row['ans'],row
   assert 'nie pytam' not in row['ans'].lower(),row
  assert all(x['kind'] is None for x in data['guarded']),data['guarded']
  assert 'przed badaniem' in data['before'],data
  assert 'zbadano' in data['afterStudy'],data
  assert 'zabezpieczono do akt' in data['afterSecure'],data
  assert data['unchanged'] and data['layer']=='85-unified-question-routing-633',data
  assert not errors,errors
  print('PASS 6.32 viewport',width,'/ 14 witness questions + protected multi-topic + 3 caption states + memory consistency')
  page.close()
 browser.close()
