"""Pakiet 6.16 — Cloudflare analizuje wyłącznie zdobytą wiedzę; nie zmienia stanu gry."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8').replace('if(!/^https?:$/.test(location.protocol))return;', 'if(false)return;',1)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 page=browser.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
 state=page.evaluate('''async()=>{
  const d=DOCS.find(x=>STATE.found.has(x.id));if(!d)throw Error('No source');
  const before={found:STATE.found.size,dialogues:JSON.stringify(STATE.dialogues),cards:STATE.deduction.cards.length};
  window.fetch=async(url,options)=>{
   if(!url.endsWith('/api/evidence-review'))throw Error('Unexpected URL');
   const req=JSON.parse(options.body);if(req.links[0].id!=='doc:'+d.id)throw Error('Missing ID');
   return {ok:true,status:200,json:async()=>({ok:true,assessment:{advisory:true,
    summary:'Źródło opisuje wyłącznie odnotowane zdarzenie.',
    confirmed:[{text:'Zapis występuje w dokumencie.',sourceIds:['doc:'+d.id]},
       {text:'FAKE',sourceIds:['doc:NOT_OWNED']}],
    uncertain:[{text:'Nie rozstrzyga automatycznie sprawstwa.',sourceIds:['doc:'+d.id]}],
    nextStep:'Możesz ponownie przeczytać źródło.'}})};
  };
  await psDualAssess({kind:'fakt',statement:'Zbadano zapis',links:[{source:'doc:'+d.id,role:'context',note:'Warto porównać'}]},dedAvailable());
  const panel=document.getElementById('psDualAssessment');
  return {text:panel.textContent,aria:panel.getAttribute('aria-live'),found:STATE.found.size,
   dialogues:JSON.stringify(STATE.dialogues),cards:STATE.deduction.cards.length,before};
 }''')
 assert 'CO WYNIKA ZE ŹRÓDEŁ' in state['text'] and 'CZEGO JESZCZE NIE WIEMY' in state['text'],state
 assert 'FAKE' not in state['text'] and 'NOT_OWNED' not in state['text'],state
 assert 'Wynik orientacyjny' not in state['text'] and state['aria']=='polite'
 assert state['found']==state['before']['found'] and state['cards']==state['before']['cards'] and state['dialogues']==state['before']['dialogues']
 print('PASS grounded advisory, no fake sources, no score, no mutations or new obstacles')

 legacy=page.evaluate('''async()=>{
  const d=DOCS.find(x=>STATE.found.has(x.id));
  window.fetch=async(url,options)=>url.endsWith('/api/evidence-review')?{ok:false,status:404}:
   {ok:true,json:async()=>({ok:true,assessment:{summary:'Stary endpoint działa',score:82,strengths:['Niezależna opinia'],issues:['Sprawdź zakres'],nextStep:'Porównaj źródła'}})};
  await psDualAssess({kind:'fakt',statement:'Zbadano zapis',links:[{source:'doc:'+d.id,role:'context',note:'Sprawdzić'}]},dedAvailable());
  return document.getElementById('psDualAssessment').textContent;
 }''')
 assert 'Stary endpoint działa' in legacy and '82/100' in legacy,legacy
 print('PASS legacy /api/evaluate fallback only when new route 404')

 offline=page.evaluate('''async()=>{
  const d=DOCS.find(x=>STATE.found.has(x.id));
  window.fetch=async()=>({ok:false,status:503});
  await psDualAssess({kind:'fakt',statement:'Zbadano zapis',links:[{source:'doc:'+d.id,role:'context',note:'Sprawdzić'}]},dedAvailable());
  return document.getElementById('psDualAssessment').textContent;
 }''')
 assert 'Lokalna ocena' in offline,offline
 assert not errors,errors[:4]
 print('PASS Cloudflare downtime does not break offline reasoning or game progression')
 browser.close()
