"""RC57.10.52. Browser checks: navigation, panels, disclosure, geometry. No API calls."""
from pathlib import Path
import json,mimetypes,sys
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
QA=R/'QA-RC571052';QA.mkdir(exist_ok=True)
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
SIZES=[(390,844),(768,1024),(1024,768),(1280,800),(1366,768),(1536,864),(1920,1080)]
results=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce')
 page.on('pageerror',lambda e: errors.append(str(e)))
 html=(R/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://qa.game/">',1)
 def route(r):
  rel=r.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0];f=(R/rel).resolve()
  if f.is_relative_to(R) and f.is_file():r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://qa.game/**',route)
 page.set_content(html,wait_until='domcontentloaded',timeout=60000)
 page.wait_for_timeout(350)
 baseline=page.evaluate('''()=>({found:STATE.found.size,dialogues:Object.fromEntries(Object.entries(STATE.dialogues).map(([k,v])=>[k,v.length]))})''')
 for w,h in SIZES:
  page.set_viewport_size({'width':w,'height':h})
  checks={};measures=[]
  for tab in TABS:
   page.evaluate('(tab)=>showTab(tab)',tab)
   page.wait_for_timeout(25)
   d=page.evaluate('''(tab)=>{const sec=document.getElementById(tab), rect=e=>e?.getBoundingClientRect();return {active:[...document.querySelectorAll('.section.active')].map(x=>x.id),tab:STATE.tab,viewport:innerWidth,pagewidth:document.documentElement.scrollWidth,found:STATE.found.size,controls:[...sec.querySelectorAll('input,textarea,select,button,summary')].filter(e=>{let r=rect(e);return r&&r.width>0&&r.height>0}).length,folds:[...sec.querySelectorAll('.ps52-fold')].map(x=>({id:x.id,open:x.open,summary:x.querySelector('summary')?.getBoundingClientRect().toJSON(),content:x.children[1]?.getBoundingClientRect().toJSON()}))}}''',tab)
   checks[f'{tab}_active']=d['active']==[tab] and d['tab']==tab
   checks[f'{tab}_no_page_overflow']=d['pagewidth']<=w+1
   checks[f'{tab}_has_controls']=d['controls']>0
   checks[f'{tab}_found_unchanged']=d['found']==baseline['found']
   measures.append(d)
  if w in (1366,1536):
   page.evaluate('showTab("interview")')
   geom=page.evaluate('''()=>{const cards=[...document.querySelectorAll('#characterList .character')];const r=e=>e.getBoundingClientRect();return cards.map(c=>{let a=r(c),photo=r(c.querySelector('.wp-mini')),txt=r(c.querySelector('.charactercopy'));return {overlap:photo.right>txt.left-3,photoInside:photo.left>=a.left&&photo.right<=a.right+1,textInside:txt.left>=a.left&&txt.right<=a.right+1}})}''')
   checks['witness_cards_separated']=len(geom)==6 and all(not c['overlap'] and c['photoInside'] and c['textInside'] for c in geom)
   page.evaluate('showTab("timeline")')
   checks['auto_timeline_available']=page.locator('#ps52AutoTimeline').count()==1
   page.locator('#ps52AutoTimeline>summary').click()
   checks['auto_timeline_opens']=page.locator('#ps52AutoTimeline').evaluate('(e)=>e.open&&e.querySelector("#ps41AutoTimeline")?.getBoundingClientRect().height>250')
   page.locator('#ps52AutoTimeline>summary').click()
   page.evaluate('showTab("inspection12")')
   checks['inspection_visual_available']=page.locator('#ps52InspectionVisual').count()==1
   page.locator('#ps52InspectionVisual>summary').click()
   checks['inspection_visual_opens']=page.locator('#ps52InspectionVisual').evaluate('(e)=>e.open&&e.querySelector("#ciPanel")?.getBoundingClientRect().height>100')
   page.locator('#ps52InspectionVisual>summary').click()
   page.evaluate('showTab("notebook")')
   checks['notebook_advanced_available']=page.locator('#ps52NotebookAdvanced').count()==1
   page.locator('#ps52NotebookAdvanced>summary').click()
   checks['notebook_advanced_opens']=page.locator('#ps52NotebookAdvanced').evaluate('(e)=>e.open&&["ps46Annotations","ps49Diagnostics","ps53Provenance"].every(id=>e.querySelector("#"+id)?.getBoundingClientRect().height>100)')
   page.locator('#ps52NotebookAdvanced>summary').click()
   page.evaluate('showTab("labs")')
   checks['five_labs_present']=page.locator('#ux5Waiting .ux5-grid>*').count()>=5
   page.evaluate('showTab("final")')
   checks['final_gates_unchanged']=page.locator('#psF1Gate').count()==1 and page.evaluate('document.querySelector("#final").dataset.psF1Phase')=='0'
  results.append({'size':f'{w}x{h}','checks':checks,'sample':measures})
  failed=[k for k,v in checks.items() if not v]
  print(f'{w}x{h}: {len(checks)-len(failed)}/{len(checks)}', 'FAIL:'+','.join(failed) if failed else 'PASS',flush=True)
 after=page.evaluate('''()=>({found:STATE.found.size,dialogues:Object.fromEntries(Object.entries(STATE.dialogues).map(([k,v])=>[k,v.length]))})''')
 checks_other={'no_found_change':baseline['found']==after['found'],'no_dialogue_change':baseline['dialogues']==after['dialogues'],'no_js_errors':not errors}
 print('OTHER',checks_other,'JS ERRORS',errors[:4])
 (QA/'QA52-results.json').write_text(json.dumps({'results':results,'other':checks_other,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
 browser.close()
 failures=[f'{r["size"]} {k}' for r in results for k,v in r['checks'].items() if not v]
 if failures or not all(checks_other.values()):print('FAILED',failures[:15]);sys.exit(1)
 print('TOTAL',sum(sum(r['checks'].values()) for r in results)+sum(checks_other.values()),'PASS')
