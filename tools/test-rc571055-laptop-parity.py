"""RC57.10.55: same structural layout across laptop CSS viewports.
Only tests geometry and navigation; no AI provider endpoints are contacted."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, mimetypes, sys
R=Path(__file__).resolve().parents[1]
QA=R/'QA-RC571055';QA.mkdir(exist_ok=True)
SIZES=[(390,844),(1024,768),(1152,720),(1280,720),(1366,768),(1440,900),(1536,864),(1600,900),(1920,900),(1920,1080)]
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
errors=[];records=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1,reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 html=(R/'tools/.test-index-inline.html').read_text(encoding='utf8').replace('<head>','<head><base href="https://qa.game/">',1)
 def handler(route):
  rel=route.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]
  f=(R/rel).resolve()
  if f.is_relative_to(R) and f.is_file():
   route.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
  else:route.fulfill(status=404,body='')
 page.route('https://qa.game/**',handler)
 page.set_content(html,wait_until='domcontentloaded',timeout=60000)
 page.wait_for_timeout(250)
 before=page.evaluate('''()=>({found:STATE.found.size,notes:JSON.stringify(STATE.dialogues)})''')
 for w,h in SIZES:
  page.set_viewport_size({'width':w,'height':h})
  checks={};facts={}
  for tab in TABS:
   page.evaluate('(t)=>showTab(t)',tab)
   page.wait_for_timeout(20)
   d=page.evaluate('''t=>({tab:STATE.tab,active:[...document.querySelectorAll('.section.active')].map(e=>e.id),scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth})''',tab)
   checks[tab+':active']=d['tab']==tab and d['active']==[tab]
   checks[tab+':no-page-horizontal-scroll']=d['scroll']<=d['client']+2
   if tab=='overview' and w>=1080:
    r=page.evaluate('''()=>{const p=document.querySelector('#overview .ps38-front-grid'),h=p.querySelector('.hero'),g=document.querySelector('#photoGrid'),q=document.querySelector('#overview .heroText'),rr=e=>e.getBoundingClientRect();const a=rr(p),b=rr(h),c=rr(g),d=rr(q);return{hero:b.width,parent:a.width,photos:c.width,sideBySide:c.left>=d.right-2,heroVisible:b.width>0}}''')
    facts['overview']=r
    checks['overview:full-width']=r['hero']>=r['parent']-5
    checks['overview:two-regions']=r['sideBySide'] and r['photos']>=235
   if tab=='interview' and w>=1080:
    r=page.evaluate('''()=>{let el=s=>document.querySelector(s),rr=e=>e.getBoundingClientRect(),a=rr(el('#interview .charactergrid')),b=rr(el('#interview .charactergrid>.chat')),c=rr(el('#interview .charactergrid>.characterlist')),d=rr(el('#interview #chatLog')),e=rr(el('#interview .chatfoot'));return{grid:a.width,chat:b.width,witnesses:c.width,sideBySide:c.left>=b.right-2,noOverlap:c.left>=b.right-2,protocolInside:d.width>=b.width-12,questionInside:e.width>=b.width-12,characterCards:[...el('#characterList').querySelectorAll('.character')].map(z=>{let im=z.querySelector('.wp-mini'),t=z.querySelector('.charactercopy');return !im||!t||rr(im).right<=rr(t).left+2})}}''')
    facts['interview']=r
    checks['interview:two-regions']=r['sideBySide'] and r['chat']>r['witnesses']
    checks['interview:protocol-wide']=r['protocolInside'] and r['questionInside']
    checks['interview:no-overlapping-cards']=len(r['characterCards'])==6 and all(r['characterCards'])
   if tab=='timeline' and w>=1080:
    r=page.evaluate('''()=>{let x=document.querySelectorAll('#timeline .tl-main>.tl-panel');if(x.length<2)return{ok:false};let a=x[0].getBoundingClientRect(),b=x[1].getBoundingClientRect();return{ok:b.left>=a.right-3}}''')
    checks['timeline:two-regions']=r['ok']
   if tab=='evidence' and w>=1080:
    r=page.evaluate('''()=>{let g=document.querySelector('#evidence .ev-workspace');let c=getComputedStyle(g);return{columns:c.gridTemplateColumns.split(' ').length,scroll:g.scrollWidth,client:g.clientWidth}}''')
    checks['evidence:two-regions']=r['columns']>=2 and r['scroll']<=r['client']+3
  records.append({'size':f'{w}x{h}','checks':checks,'facts':facts})
  bad=[k for k,v in checks.items() if not v]
  print(f'{w}x{h} {len(checks)-len(bad)}/{len(checks)}',bad[:10],flush=True)
 after=page.evaluate('''()=>({found:STATE.found.size,notes:JSON.stringify(STATE.dialogues)})''')
 page.set_viewport_size({'width':1366,'height':768});page.evaluate('showTab("interview")');page.wait_for_timeout(100);page.screenshot(path=str(QA/'INTERVIEW-1366.png'))
 page.set_viewport_size({'width':1920,'height':1080});page.evaluate('showTab("overview")');page.wait_for_timeout(100);page.screenshot(path=str(QA/'OVERVIEW-1920.png'))
 browser.close()
checks={'no-state-mutation':before==after,'no-js-errors':len(errors)==0}
bad=[r['size']+' '+k for r in records for k,v in r['checks'].items() if not v]+[k for k,v in checks.items() if not v]
(QA/'laptop-parity.json').write_text(json.dumps({'results':records,'globals':checks,'errors':errors,'failures':bad},ensure_ascii=False,indent=2),encoding='utf8')
print('TOTAL',sum(sum(r['checks'].values()) for r in records)+sum(checks.values()),'/',sum(len(r['checks']) for r in records)+len(checks),'FAIL',bad[:25],flush=True)
sys.exit(bool(bad))
