"""6.28 browser regression tests; no external API keys or production mutations."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil, json, re
root=Path(__file__).resolve().parents[1]
HTML=(root/'index.html').read_text(encoding='utf8')
def document_with_store(store=None):
 data=json.dumps(store or {},ensure_ascii=False)
 stub=f"""<script>
 (function(){{
 const items={data};
 const persistent={{getItem(k){{return Object.prototype.hasOwnProperty.call(items,k)?items[k]:null;}},setItem(k,v){{items[k]=String(v)}},removeItem(k){{delete items[k]}},clear(){{for(const k of Object.keys(items))delete items[k];}},key(i){{return Object.keys(items)[i]||null}},get length(){{return Object.keys(items).length}}}};
 Object.defineProperty(window,'localStorage',{{configurable:true,value:persistent}});
 const session={{}};
 Object.defineProperty(window,'sessionStorage',{{configurable:true,value:{{getItem:k=>session[k]||null,setItem:(k,v)=>{{session[k]=String(v)}},removeItem:k=>{{delete session[k]}}}}}});
 }})();
 </script>"""
 return HTML.replace('<head>','<head>'+stub,1)
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':390,'height':844});errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(document_with_store(),wait_until='domcontentloaded',timeout=75000)
  page.wait_for_timeout(500)
  initial=page.evaluate('''()=>({spots:SC_SPOTS.length,room:STATE.scene12.room,ai:psShowAiDiagnostic,save:typeof SaveManager.writeAutosave})''')
  assert initial['save']=='function',initial
  scene=page.evaluate('''()=>{
   const p=SC_SPOTS.find(p=>p.room===STATE.scene12.room&&p.doc&& !STATE.found.has(p.doc));
   if(!p)throw Error('No document-bearing spot');
   scMarkRoom();scDiscover(p.id);
   const c=SC_CHALLENGES[p.id];scUseMethod(c.method);
   scInterpret(scAnswerOrder(p.id).indexOf(c.correct));
   STATE.scene12.selected=p.id;showTab('inspection12');scRender();
   return {id:p.id,doc:p.doc,room:p.room,amount:STATE.scene12.inspected.length};
  }''')
  page.wait_for_timeout(500)
  snap=page.evaluate('''()=>({
    count:document.querySelector('#ov36Count')?.textContent,
    guidance:document.querySelector('#ciFocusCard')?.textContent,
    photo:document.querySelector('#ov36Regions [data-guided-spot="'+STATE.scene12.selected+'"],#ov37Records [data-guided-spot="'+STATE.scene12.selected+'"]')?.textContent,
    metrics:document.querySelector('#scMissionCount')?.textContent
  })''')
  assert f"{scene['amount']}" in snap['metrics'],snap
  assert re.search(r'\d+\s*/\s*\d+\s*zbadanych',snap['count']),snap
  assert 'pozostało zabezpieczenie' in snap['guidance'].lower(),snap
  assert 'pozostało zabezpieczenie' in (snap['photo'] or '').lower(),snap
  assert 'materiałów zabezpieczonych' in snap['count'],snap
  # The two counters intentionally diverge until the evidence is secured.
  secure=page.evaluate('''()=>{
    const doc=SC_BY_SPOT[STATE.scene12.selected].doc;
    STATE.found.add(doc);scRender();return {doc,secured:STATE.found.has(doc)};
  }''')
  page.wait_for_timeout(250)
  afterSecuring=page.evaluate('''()=>({count:document.querySelector('#ov36Count')?.textContent,
    photo:document.querySelector('#ov36Regions [data-guided-spot="'+STATE.scene12.selected+'"],#ov37Records [data-guided-spot="'+STATE.scene12.selected+'"]')?.textContent})''')
  assert re.search(r'1\s*/\s*\d+\s+materiałów zabezpieczonych',afterSecuring['count']),afterSecuring
  assert 'Zabezpieczono' in (afterSecuring['photo'] or ''),afterSecuring
  page.evaluate('''doc=>{STATE.found.delete(doc);scRender();}''',secure['doc'])
  print('PASS photo and scene cards: inspected vs. secured, no outdated assessment prompt')
  page.evaluate('''()=>SaveManager.writeAutosave('ps_detective_autosave_v2',{tab:'test-628'})''')
  autosave=page.evaluate('''()=>localStorage.getItem('ps_detective_autosave_v2')''')
  assert autosave
  page.close()
  page=browser.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(document_with_store({'ps_detective_autosave_v2':autosave}),wait_until='domcontentloaded',timeout=75000)
  page.wait_for_timeout(450)
  prompt=page.evaluate('''()=>({pending:document.body.classList.contains('ps-resume-pending'),
    modal:document.querySelector('#psResumeOffer')?.getBoundingClientRect().toJSON(),
    continueLabel:document.querySelector('#psResumeOffer button')?.textContent,
    saved:STATE.scene12.inspected.length,
    computed:(()=>{const el=document.getElementById('psResumeOffer');return {position:getComputedStyle(el).position,z:getComputedStyle(el).zIndex,transform:getComputedStyle(el).transform,ancestors:[...function*(x){while(x){yield [x.tagName,x.className, getComputedStyle(x).transform,getComputedStyle(x).position];x=x.parentElement}}(el)]}})(),screenshotOverlay:!!document.querySelector('body.ps-resume-pending')})''')
  assert prompt['pending'] and 'Kontynuuj' in prompt['continueLabel'],prompt
  assert prompt['saved']==0,prompt
  box=prompt['modal'];assert box['width']>300 and box['height']>80 and 0 <= box['top'] < 844,prompt
  print('PASS resume choice shown as modal before zero-progress dashboard')
  page.locator('#psResumeOffer button').first.click()
  page.wait_for_timeout(850)
  restored=page.evaluate('''()=>({pending:document.body.classList.contains('ps-resume-pending'),
    saved:STATE.scene12.inspected.length,cinematic:document.getElementById('ps82Moment')?.classList.contains('ps82-visible'),
    photo:document.querySelector('#ov36Count')?.textContent})''')
  assert not restored['pending'] and restored['saved']>=scene['amount'],restored
  assert not restored['cinematic'],restored
  print('PASS restored scene state, no replayed new-evidence animation')
  memory=page.evaluate('''()=>{
    const c=CONTENT.characters.find(c=>c.id==='MAREK');
    const q='Nie pytam o ostatnie spotkanie z Leną, tylko o twoje miejsce pobytu od 01:30 do 02:05.';
    STATE.activeChar='MAREK';showTab('interview');
    document.getElementById('chatInput').value=q;
    document.getElementById('chatSend').click();
    const s=buildSave(),eps=s.ps68.witnesses.MAREK.episodes;
    return {topic:eps.at(-1)?.topic,question:eps.at(-1)?.q,text:STATE.dialogues.MAREK.at(-1)?.text};
  }''')
  assert memory['topic']=='alibi',memory
  migration=page.evaluate('''()=>{
    const d=buildSave(),w=d.ps68.witnesses.MAREK,ep=w.episodes.at(-1);
    ep.topic='lena';w.anchors={lena:{first:{turn:ep.turn,a:ep.a,canonical:ep.canonical,kind:ep.kind},
      last:{turn:ep.turn,a:ep.a,canonical:ep.canonical,kind:ep.kind},count:1}};
    delete d.saveMeta; // legacy migration path, not a forged SHA-256 save
    applySave(d);
    const restored=buildSave().ps68.witnesses.MAREK;
    return {episode:restored.episodes.at(-1)?.topic,anchor:restored.anchors.alibi?.last?.a,
      text:STATE.dialogues.MAREK.at(-1)?.text};
  }''')
  assert migration['episode']=='alibi' and migration['anchor']==migration['text'][:680],migration
  print('PASS memory assigns negated Lena mention to Marek alibi; old mislabeled episode migrated')
  assert not errors,errors
  browser.close()

