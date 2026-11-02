from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,json
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text()
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (320,390,768,1440,1920):
  page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.route('**/assets/portraits/*.webp', lambda route:route.fulfill(path=ROOT/'assets/portraits'/route.request.url.rsplit('/',1)[-1],content_type='image/webp'))
  page.set_content(html.replace('<head>','<head><base href="https://preview.local/">',1),wait_until='load',timeout=120000)
  page.wait_for_timeout(380)
  assert page.locator('#ps18Boot').count()==0,'splash did not disappear'
  for tab in ('overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final'):
   page.evaluate('(tab)=>showTab(tab)',tab)
   data=page.evaluate('''()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth,active:document.querySelector('.section.active')?.id})''')
   assert data['doc'] <= width+2,(width,tab,data)
  page.evaluate("showTab('interview');STATE.activeChar='MAREK';renderChat()")
  if width<=740 and page.locator('#psm-tab-chat').count():page.locator('#psm-tab-chat').click()
  assert page.locator('#interview .ps18-guidance').count()==1
  assert page.locator('#interview #ps77-response-wait').count()==1
  assert page.locator('#interview #chatInput').count()==1
  assert page.locator('#interview #chatSend').count()==1
  assert page.locator('#interview .npc4-metrics').count()==1
  assert page.locator('#interview .character img.wp-photo').count()==6
  portrait=page.locator('#witnessStage img.wp-photo')
  portrait.evaluate('(el)=>el.decode()')
  assert portrait.evaluate('(el)=>el.naturalWidth>0')
  if width<=740:
   orders=page.evaluate('''()=>{
    const x=['.chathead','.chatlog','.chatfoot','#ps47Psychology'].map(y=>{const el=document.querySelector('#interview .chat '+y);return [y,el?getComputedStyle(el).order:null,el?.getBoundingClientRect().top||0]});
    return x; }''')
   assert orders[0][2]<orders[1][2]<orders[2][2],(width,orders)
  if width in (390,1440):page.screenshot(path=str(ROOT/f'QA-RC571018-interview-{width}.png'),full_page=True)
  assert not errors,(width,errors[:6])
  results.append({'width':width,'tabs':10,'portrait':True,'bootRemoved':True,'noHorizontalOverflow':True,'jsErrors':0})
  print('PASS',width,'all 10 tabs, witness portrait, no overflow, splash hidden')
  page.close()
 browser.close()
(ROOT/'QA-RC571018-presentations.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
