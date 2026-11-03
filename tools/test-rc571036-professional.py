"""RC57.10.36 — rzeczywisty Chromium: hierarchia, responsywność, zachowanie formularzy."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SIZES=[(320,700),(390,844),(390,560),(768,1024),(1024,768),(1280,800),(1440,900),(1920,1080)]
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
failures=[]; checks=0; details=[]
def check(condition,message):
 global checks
 checks+=1
 if not condition: failures.append(message)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in SIZES:
  page=browser.new_page(viewport={'width':w,'height':h})
  page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(350)
  page.evaluate("document.body.classList.remove('ps-resume-pending')")
  layout=page.evaluate('()=>window.PS36_LAYOUT?.inspect?.()||null')
  check(layout is not None,f'{w}x{h} professional script missing')
  if layout:
   check(len(layout['modules'])==10,f'{w}x{h}: styled modules {len(layout["modules"])}')
   check(len(layout['indices'])>=5,f'{w}x{h}: indices missing {layout["indices"]}')
   check(bool(layout['notebookPrimary']&4),f'{w}x{h}: notes appear below confrontation')
   check(bool(layout['deductionPrimary']&4),f'{w}x{h}: form appears below thread board')
  for tab in TABS:
   page.evaluate('(tab)=>showTab(tab)',tab)
   info=page.evaluate('''() => {const s=document.querySelector('.section.active'),r=s?.getBoundingClientRect();return {
    id:s?.id,width:document.documentElement.scrollWidth,viewport:innerWidth,
    left:r?.left,right:r?.right,navBtns:s?.querySelectorAll('.ps36-section-index button').length||0,
    heading:s?.querySelector('h1,h2,h3')?.textContent?.trim()?.length||0}}
   ''')
   check(info['id']==tab,f'{w}x{h}: wrong tab {tab}: {info["id"]}')
   check(info['width']<=w+1,f'{w}x{h}: horizontal overflow {tab} {info["width"]}')
   check(info['left']>=-1 and info['right']<=w+1,f'{w}x{h}: clipped {tab} [{info["left"]},{info["right"]}]')
   check(info['heading']>0,f'{w}x{h}: missing heading {tab}')
   if w in [390,1440] and tab in ['overview','notebook','deduction','timeline']:
    page.screenshot(path=str(ROOT/f'PODGLAD-RC571036-{tab}-{w}.png'),full_page=False)
  # Interaction: navigating between internal notebook sections is functional.
  page.evaluate("showTab('notebook')")
  index=page.locator('#notebook .ps36-section-index')
  if index.count():
   check(index.locator('button').count()>=2,f'{w}x{h}: notebook navigation buttons missing')
   index.locator('button').first.click()
   check(index.locator('button').first.get_attribute('aria-current')=='true',f'{w}x{h}: notebook nav did not select first anchor')
  page.evaluate("showTab('interview')")
  if w <= 1024:
   page.evaluate("document.querySelector('#interview').classList.add('psm-show-chat');document.querySelector('#interview').classList.remove('psm-show-witnesses')")
  state=page.evaluate('''()=>{const l=document.getElementById('chatLog'),foot=document.querySelector('#interview .chatfoot');
    let a=l.getBoundingClientRect(),b=foot.getBoundingClientRect();return {
      overlap:a.bottom-b.top,formClipping:foot.scrollHeight-foot.clientHeight,
      textArea:!!document.getElementById('chatInput'),send:!!document.getElementById('chatSend')};}''')
  check(state['overlap']<=3,f'{w}x{h}: chat overlaps form {state["overlap"]}')
  check(state['formClipping']<=3,f'{w}x{h}: chat form clipped {state["formClipping"]}')
  check(state['textArea'] and state['send'],f'{w}x{h}: missing own-question controls')
  details.append({'w':w,'h':h,'styledTabs':len(layout['modules']) if layout else 0,'indices':len(layout['indices']) if layout else 0,'formOverlap':state['overlap']})
  page.close()
 browser.close()
report={'release':'RC57.10.36','checks':checks,'passed':checks-len(failures),'failures':failures,'viewports':details,
'limitations':'Browser tests with local HTML. No live AI/provider, Supabase, external devices, or real keyboard.'}
(ROOT/'RAPORT-QA-RC57_10_36.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(f'RC57.10.36: {checks-len(failures)}/{checks} PASS')
for f in failures[:20]: print('FAIL',f)
if failures:raise SystemExit(1)
