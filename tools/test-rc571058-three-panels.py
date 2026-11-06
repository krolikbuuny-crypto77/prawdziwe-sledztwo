"""Regresja układu trzech paneli ze zrzutów z 06.11.2026 (bez wywołań zewnętrznego AI)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import mimetypes, urllib.parse, json, sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'QA-RC571058-TRZY-PANELE'
OUT.mkdir(exist_ok=True)
SIZES=[(320,720),(390,844),(665,800),(930,760),(1280,900),(1705,900),(1920,1080)]
errors=[]; tests=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':900},device_scale_factor=1,reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  rel=urllib.parse.unquote(r.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0])
  path=(ROOT/rel).resolve()
  if path.is_relative_to(ROOT) and path.is_file():
   r.fulfill(status=200,body=path.read_bytes(),content_type=mimetypes.guess_type(path.name)[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://qa.game/**',route)
 html=(ROOT/'index.html').read_text().replace('<head>','<head><base href="https://qa.game/">',1)
 page.set_content(html,wait_until='domcontentloaded',timeout=90000)
 page.wait_for_timeout(450)
 for w,h in SIZES:
  page.set_viewport_size({'width':w,'height':h})
  for tab in ('overview','interview','deduction'):
   page.evaluate('(tab)=>showTab(tab)',tab)
   page.wait_for_timeout(90)
   if tab=='interview' and w<=680 and page.locator('#interview .chathead').evaluate('(e)=>e.getBoundingClientRect().width')<1:
    page.locator('#characterList .character').first.click()
    page.wait_for_timeout(100)
   if tab=='overview':
    m=page.evaluate('''()=>{const h=document.querySelector('#overview .hero'), t=document.querySelector('#overview .heroText');const s=getComputedStyle(t);return {heroH:h.getBoundingClientRect().height,textH:t.clientHeight,textScroll:t.scrollHeight,overflow:s.overflowY,overflowX:document.documentElement.scrollWidth-innerWidth}}''')
    checks={'no_inner_scroll':m['overflow']!='auto' and m['overflow']!='scroll' and m['textScroll']<=m['textH']+3, 'root_no_horizontal_overflow':m['overflowX']<=2}
   elif tab=='interview':
    m=page.evaluate('''()=>{const r=id=>document.querySelector(id)?.getBoundingClientRect().toJSON();return {role:r('#chatRole'),panel:r('#npc4Panel'),head:r('#interview .chathead'),overflowX:document.documentElement.scrollWidth-innerWidth}}''')
    checks={'head_visible':m['head']['width']>0 and m['head']['height']>0,'role_not_covered':m['panel']['height']<=1 or m['panel']['top']>=m['role']['bottom']-2,'meters_inside_header':m['panel']['height']<=1 or m['head']['bottom']>=m['panel']['bottom']-3,'root_no_horizontal_overflow':m['overflowX']<=2}
   else:
    m=page.evaluate('''()=>{const s=document.querySelector('#threadSourceNodes'),c=document.querySelector('#threadCardNodes'),b=document.querySelector('#threadCanvas'),p=document.querySelector('#threadBoardPanel');const e=document.querySelector('.thread-paper strong');return {exists:!!b,panelW:p?.getBoundingClientRect().width,sourceFont:parseFloat(getComputedStyle(e).fontSize),leftH:s?.clientHeight,rightH:c?.clientHeight,sourceCount:s?.children.length,emptyH:c?.querySelector('.thread-empty')?.getBoundingClientRect().height,overflowX:document.documentElement.scrollWidth-innerWidth}}''')
    checks={'board_present':m['exists'] and m['panelW']>0,'readable_sources':m['sourceFont']>=14,'source_visible':m['leftH']>0 and m['sourceCount']>0,'root_no_horizontal_overflow':m['overflowX']<=2}
   tests.append({'size':f'{w}x{h}','tab':tab,'metrics':m,'checks':checks})
   print(w,tab,checks,flush=True)
   if (w,h) in ((390,844),(1280,900),(1705,900)) and (tab!='interview' or m['head']['width']>0):
    target=page.locator('#overview .hero' if tab=='overview' else '#interview .chathead' if tab=='interview' else '#threadBoardPanel')
    target.screenshot(path=str(OUT/f'{tab}-{w}.png'),timeout=12000)
 browser.close()
fail=[(r['size'],r['tab'],k) for r in tests for k,v in r['checks'].items() if not v]
(OUT/'wyniki.json').write_text(json.dumps({'tests':tests,'failures':fail,'errors':errors},indent=2,ensure_ascii=False))
print('FAILURES',fail,'PAGE_ERRORS',errors,flush=True)
if fail or errors:sys.exit(1)
