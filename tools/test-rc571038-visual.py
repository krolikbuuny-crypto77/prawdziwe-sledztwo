"""RC57.10.38 — wizualna regresja i responsywność bez połączeń zewnętrznych."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
HTML=HTML.replace('<head>','<head><base href="https://game.test/">',1)
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
SIZES=[(320,700),(390,844),(768,1024),(1024,768),(1280,800),(1440,900),(1920,1080)]
OUT=ROOT/'QA-RC571038';OUT.mkdir(exist_ok=True)
checks=0;failures=[];results=[]
def check(p,msg):
 global checks
 checks+=1
 if not p: failures.append(msg)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in SIZES:
  page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
  errors=[]
  page.on('pageerror',lambda ex:errors.append(str(ex)))
  def asset(route):
   relative=route.request.url.split('game.test/')[-1].split('?')[0].split('#')[0]
   path=(ROOT/relative).resolve()
   if not path.is_relative_to(ROOT) or not path.is_file():
    route.fulfill(status=404,body=b'not found');return
   route.fulfill(status=200,body=path.read_bytes(),content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream')
  page.route('https://game.test/**',asset)
  page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(600)
  page.evaluate("document.body.classList.remove('ps-resume-pending')")
  data=page.evaluate('''() => ({
   hasBanner:!!document.querySelector('#overview .ps38-case-banner'),
   hasFront:!!document.querySelector('#overview .ps38-front-grid'),
   hasLower:!!document.querySelector('#overview .ps38-lower-grid'),
   actions:document.querySelectorAll('#overview .ps38-actions-list button').length,
   icons:document.querySelectorAll('#ui14Sidebar #nav .ps38-nav-icon').length,
   photos:[...document.querySelectorAll('#photoGrid img')].map(x=>x.naturalWidth),
   bg:getComputedStyle(document.querySelector('#overview .ps38-case-banner')).backgroundImage,
   frontCols:getComputedStyle(document.querySelector('#overview .ps38-front-grid')).gridTemplateColumns,
  })''')
  for key in ['hasBanner','hasFront','hasLower'] :check(data[key],f'{w}x{h} missing {key}')
  check(data['actions']==4,f'{w}x{h} missing actions {data["actions"]}')
  check(data['icons']==10,f'{w}x{h} missing icons {data["icons"]}')
  check(all(x>0 for x in data['photos']),f'{w}x{h} lost photos {data["photos"]}')
  check('night-tram' in data['bg'],f'{w}x{h} banner art missing')
  for tab in TABS:
   page.evaluate('(id) => showTab(id)',tab)
   r=page.evaluate('''() => { const s=document.querySelector('.section.active'),r=s.getBoundingClientRect();return {tab:s.id,scrollW:document.documentElement.scrollWidth,width:innerWidth,x:r.x,right:r.right,buttons:s.querySelectorAll('button').length} }''')
   check(r['tab']==tab,f'{w}x{h} failed showTab({tab})')
   check(r['scrollW']<=w+2,f'{w}x{h} horizontal scroll in {tab}: {r["scrollW"]}')
   check(r['right']<=w+2,f'{w}x{h} section overflow {tab}: {r["right"]}')
  page.evaluate('showTab("overview")')
  check(not errors,f'{w}x{h} JS errors {errors[:3]}')
  if w in [390,1440,1920]:
   page.screenshot(path=str(OUT/f'PULPIT-{w}.png'),full_page=False)
   page.locator('#overview .ps38-front-grid').screenshot(path=str(OUT/f'PULPIT-KARTY-{w}.png'))
   for tab in ['interview','deduction','notebook']:
    page.evaluate('(id) => showTab(id)',tab)
    page.screenshot(path=str(OUT/f'{tab.upper()}-{w}.png'),full_page=False)
  results.append({'size':f'{w}x{h}','layout':data,'errors':errors})
  page.close()
 browser.close()
(OUT/'RAPORT-TESTOW.json').write_text(json.dumps({'pass':checks-len(failures),'total':checks,'failures':failures,'results':results},ensure_ascii=False,indent=2))
print(f'{checks-len(failures)}/{checks} kontrole zaliczone')
for f in failures[:30]:print('FAIL',f)
if failures:sys.exit(1)
