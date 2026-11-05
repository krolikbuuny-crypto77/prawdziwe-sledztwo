"""RC57.10.57 visual regression: screenshot-backed panel fixes, read-only gameplay checks.
Does not contact AI providers or alter persisted gameplay state."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import mimetypes, urllib.parse, json, sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'QA-RC571057'
OUT.mkdir(exist_ok=True)
SIZES=[(1920,1080),(1536,864),(1366,768),(1280,720),(1024,768),(390,844)]
checks=[]; errors=[]; failures=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1,reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  rel=urllib.parse.unquote(r.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0])
  file=(ROOT/rel).resolve()
  if file.is_relative_to(ROOT) and file.is_file():
   r.fulfill(status=200,body=file.read_bytes(),content_type=mimetypes.guess_type(file.name)[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://qa.game/**',route)
 html=(ROOT/'index.html').read_text().replace('<head>','<head><base href="https://qa.game/">',1)
 page.set_content(html,wait_until='domcontentloaded',timeout=90000)
 page.wait_for_timeout(280)
 for w,h in SIZES:
  page.set_viewport_size({'width':w,'height':h})
  def test(tab,name,passed,details=None):
   checks.append({'viewport':f'{w}x{h}','tab':tab,'test':name,'pass':bool(passed),'details':details})
   if not passed:failures.append((w,h,tab,name,details))
  for tab in ['overview','inspection12','labs','deduction']:
   page.evaluate('(id)=>showTab(id)',tab);page.wait_for_timeout(75)
   test(tab,'selected_section',page.locator('#'+tab).evaluate('(el)=>el.classList.contains("active")'))
   test(tab,'root_no_horizontal_overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
   if tab=='overview':
    data=page.evaluate('''()=>{const root=document.querySelector('.ps38-case-banner');const r=root.getBoundingClientRect();const els=[...root.children];const inBox=els.every(e=>{const x=e.getBoundingClientRect();return x.top>=r.top-2&&x.bottom<=r.bottom+2});return {inBox,overflow:getComputedStyle(root).overflow,height:r.height,children:els.length}}''')
    test(tab,'case_banner_unclipped',data['inBox'],data)
    if w>=941:test(tab,'case_banner_no_fixed_height',data['overflow']!='hidden')
    if w==1920:page.screenshot(path=str(OUT/'PULPIT-1920.png'),timeout=20000)
   if tab=='inspection12':
    data=page.evaluate('''()=>{const c=document.querySelector('#scHotspots');const h=c.querySelector('.ov3-results-heading');const note=c.querySelector('.sc84-sorted-note');const empty=c.querySelector('.ov3-unfound');const st=getComputedStyle(h);const r=h.getBoundingClientRect();return {status:st.color,font:parseFloat(st.fontSize),exists:!!note&&!!empty,emptyColor:getComputedStyle(empty).color,emptyHeight:empty.getBoundingClientRect().height,columns:getComputedStyle(c).gridTemplateColumns,statusWidth:r.width,rootScroll:document.documentElement.scrollWidth}}''')
    test(tab,'inspection_status_legible',data['font']>=13 and data['status']=='rgb(67, 43, 29)',data)
    test(tab,'empty_state_present',data['exists'] and data['emptyHeight']>0)
    if w==1920:
     page.locator('#scHotspots').screenshot(path=str(OUT/'OGLEDZINY-PUNKTY-1920.png'),timeout=18000)
   if tab=='labs':
    data=page.evaluate('''()=>{const box=document.querySelector('#ux5Hub .ux5-grid');const cards=[...document.querySelectorAll('#ux5Waiting .ux5-card')];const y=[...new Set(cards.map(x=>Math.round(x.getBoundingClientRect().top)))];const count=document.querySelector('#ux5Hub .ux5-count');return {total:cards.length,rows:y.map(z=>cards.filter(x=>Math.abs(x.getBoundingClientRect().top-z)<2).length),countColor:getComputedStyle(count).color,cols:getComputedStyle(box).gridTemplateColumns,overlap:cards.some((a,i)=>cards.some((b,j)=>i<j&&(()=>{let x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1})()))}}''')
    test(tab,'lab_cards_without_overlap',not data['overlap'] and data['total']==5,data)
    if w==1920:
     test(tab,'lab_balanced_3_plus_2',data['rows']==[3,2],data)
     test(tab,'lab_count_dark_on_cream',data['countColor']=='rgb(76, 48, 32)',data)
     page.screenshot(path=str(OUT/'LABORATORIUM-1920.png'),timeout=20000)
   if tab=='deduction':
    page.evaluate('UX4_DEDUCTION.go(2)');page.wait_for_timeout(80)
    data=page.evaluate('''()=>{const r=e=>e.getBoundingClientRect(),w=document.querySelector('#dedSourceList'),cards=[...w.querySelectorAll('.dd-source')],panel=document.querySelector('.dd-source-panel'), editor=document.querySelector('.dd-editor-panel');return {visible:getComputedStyle(panel).display!=='none',num:cards.length,within:cards.every(e=>r(e).right<=r(w).right+1&&r(e).left>=r(w).left-1),scrollable:w.scrollHeight>w.clientHeight,overflowX:getComputedStyle(w).overflowX,panelW:r(panel).width,editorW:r(editor).width,rootScroll:document.documentElement.scrollWidth}}''')
    test(tab,'source_panel_and_editor_active',data['visible'] and data['panelW']>0 and (data['editorW']>0 if w>=941 else True),data)
    test(tab,'source_cards_inside_scroller',data['within'] and data['overflowX']=='hidden',data)
    test(tab,'source_scroller_accessible',data['scrollable'] and data['num']>=10,data)
    if w==1920:page.locator('#deduction .dd-work').screenshot(path=str(OUT/'DEDUKCJA-ZRODLA-1920.png'),timeout=20000)
  print(f'{w}x{h} ok',flush=True)
 browser.close()
result={'checks':len(checks),'passed':len(checks)-len(failures),'failures':failures,'page_errors':errors,'rows':checks}
(OUT/'WYNIKI.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('RESULT',len(checks),len(checks)-len(failures),'FAIL',failures[:10],'PAGE_ERRORS',errors[:6],flush=True)
if failures or errors:sys.exit(1)
