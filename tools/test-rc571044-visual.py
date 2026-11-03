"""Local Chromium visual and functional smoke checks for RC57.10.44.
Does not test Vercel APIs, mobile hardware keyboards or Supabase.
"""
from pathlib import Path
import json,mimetypes,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'QA-RC571044';QA.mkdir(exist_ok=True)
HTML=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://game.test/">',1)
SIZES=[(320,700),(390,844),(700,900),(768,1024),(1024,768),(1440,900)]
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
errors=[];checks=0;summary=[]
def check(condition,label,width):
 global checks
 checks+=1
 if not condition:errors.append(f'{width}: {label}')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in SIZES:
  page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
  js=[];failed=[]
  page.on('pageerror',lambda e:js.append(str(e)))
  page.on('response',lambda r:failed.append(r.url) if r.status>=400 and 'game.test' in r.url else None)
  def route(r):
   rel=r.request.url.split('game.test/',1)[-1].split('?',1)[0].split('#',1)[0]
   path=(ROOT/rel).resolve()
   if path.is_relative_to(ROOT) and path.is_file():
    r.fulfill(status=200,body=path.read_bytes(),content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
   else:r.fulfill(status=404,body='Missing asset')
  page.route('https://game.test/**',route)
  page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(350)
  check(not js,'no script error on load',w)
  for tab in TABS:
   page.evaluate('(tab)=>showTab(tab)',tab)
   page.wait_for_timeout(40)
   details=page.evaluate('''tab=>{
    const s=document.getElementById(tab);
    return {visible:!!s&&s.classList.contains('active'),
      scroll:document.documentElement.scrollWidth,
      bounds:s?s.getBoundingClientRect().toJSON():null,
      main:document.querySelector('#mainContent').getBoundingClientRect().toJSON()};
   }''',tab)
   check(details['visible'],f'{tab} selected',w)
   check(details['scroll']<=w+1,f'{tab} not horizontally overflowing ({details["scroll"]})',w)
  page.evaluate('showTab("interview")')
  if w<=700:
   page.locator('#psm-tab-chat').click()
   page.wait_for_timeout(100)
   info=page.evaluate('''()=>{
    const input=document.querySelector('#chatInput'),send=document.querySelector('#chatSend'),head=document.querySelector('#interview .chathead'),chatlog=document.querySelector('#interview .chatlog');
    const ir=input.getBoundingClientRect(),sr=send.getBoundingClientRect(),hr=head.getBoundingClientRect(),lr=chatlog.getBoundingClientRect();
    return {input:ir.toJSON(),send:sr.toJSON(),head:hr.toJSON(),log:lr.toJSON(),
      roleFont:parseFloat(getComputedStyle(document.querySelector('#chatRole')).fontSize)};
   }''')
   check(info['input']['width']>180,'wide input',w)
   check(info['roleFont']>=13,'role legible',w)
   check(info['send']['width']>=90,'send button tappable',w)
   check(info['head']['bottom']<=info['log']['top']+4,'chat header does not overlap transcript',w)
   page.locator('#chatInput').focus();page.wait_for_timeout(100)
   focused=page.evaluate('''()=>({a:document.activeElement.id,logMax:getComputedStyle(document.querySelector('#interview .chatlog')).maxHeight})''')
   check(focused['a']=='chatInput','input can focus',w)
  else:
   art=page.locator('#ui14Sidebar .ps38-sidebar-art')
   check(art.count()==1,'sidebar illustration exists',w)
   bg=art.evaluate('(el)=>getComputedStyle(el).backgroundImage')
   check('assets/images/db64b67b670299ca63cbee79.webp' in bg,'sidebar image resolves correct path',w)
   check('assets/ui/assets/images/' not in bg,'no broken double assets/ path',w)
   imageOk=page.evaluate('''async()=>{const u=getComputedStyle(document.querySelector('#ui14Sidebar .ps38-sidebar-art')).backgroundImage.match(/url\\("?([^"\\)]+)"?\\)/);if(!u)return false;
     return new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>100);i.onerror=()=>resolve(false);i.src=u[1]});}''')
   check(imageOk,'sidebar background actually loads',w)
  check(not js,'no script error after navigation',w)
  if w in (390,700,1440):
   page.screenshot(path=str(QA/f'PRZESLUCHANIE-{w}.png'),full_page=False)
   page.evaluate('showTab("overview")');page.wait_for_timeout(120)
   page.screenshot(path=str(QA/f'PULPIT-{w}.png'),full_page=False)
  summary.append({'viewport':f'{w}x{h}','jsErrors':js,'badResources':failed[:15]})
  page.close()
 browser.close()
report={'version':'RC57.10.44','passed':checks-len(errors),'total':checks,'failed':errors,'sizes':summary}
(QA/'wyniki.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(f'RC57.10.44 visual: {checks-len(errors)}/{checks} passed')
for error in errors[:20]:print('FAIL',error)
for row in summary:print(row['viewport'],'JS:',len(row['jsErrors']),'HTTP failed:',len(row['badResources']))
if errors:sys.exit(1)
