from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat
import mimetypes
import json, time, sys, os
ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT; OPT=ROOT
checks=[];shots={};records=[];errors=[]
QA=ROOT/'QA-RC571060';QA.mkdir(exist_ok=True)
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for label,root in [('before',BASE),('after',OPT)]:
  for w,h in [(1920,1080),(1536,864),(1366,768),(1280,720),(390,844)]:
   context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,reduced_motion='reduce')
   page=context.new_page();page.on('pageerror',lambda err,l=label,wh=(w,h):errors.append(f'{l} {wh} {str(err)}'))
   t0=time.monotonic()
   def handler(route):
    rel=route.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]
    f=(root/rel).resolve()
    if f.is_relative_to(root) and f.is_file():
     route.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
    else: route.fulfill(status=404,body='')
   page.route('https://qa.game/**',handler)
   html=(root/('tools/.test-index-inline.html' if label=='before' else 'index.html')).read_text().replace('<head>','<head><base href="https://qa.game/">',1)
   page.set_content(html,wait_until='domcontentloaded',timeout=60000)

   page.wait_for_timeout(200)
   start=page.evaluate('''()=>({hasState:typeof STATE==='object',hasTab:typeof showTab==='function',style:getComputedStyle(document.body).fontFamily,nav:performance.getEntriesByType('navigation').map(n=>({domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd,transfer:n.transferSize,encoded:n.encodedBodySize})),res:performance.getEntriesByType('resource').filter(r=>r.name.includes('ps-')).map(r=>({name:r.name.split('/').pop(),transfer:r.transferSize,decoded:r.decodedBodySize})),htmlWidth:document.documentElement.scrollWidth,windowWidth:innerWidth})''')
   checks.append((label,w,'page loads',start['hasState'] and start['hasTab']))
   checks.append((label,w,'no page horizontal scroll',start['htmlWidth']<=start['windowWidth']+2))
   for tab in TABS:
    page.evaluate('t=>showTab(t)',tab);page.wait_for_timeout(15)
    rr=page.evaluate('''()=>({tab:STATE.tab,active:[...document.querySelectorAll('.section.active')].map(el=>el.id),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})''')
    checks.append((label,w,tab+' active',rr['tab']==tab and rr['active']==[tab]))
    checks.append((label,w,tab+' no global overflow',rr['scrollWidth']<=rr['clientWidth']+2))
    if tab in ('overview','interview','labs') and w in (1920,1366):
     pth=QA/f'{label}-{tab}-{w}.png';page.screenshot(path=str(pth),animations='disabled');shots[(label,tab,w)]=pth
   records.append({'version':label,'width':w,'measure':start,'elapsed_s':round(time.monotonic()-t0,2)})
   context.close()
 browser.close()

image_diffs=[]
for (label,tab,w),pth in shots.items():
 if label!='before':continue
 a=Image.open(pth).convert('RGB');b=Image.open(shots[('after',tab,w)]).convert('RGB');d=ImageChops.difference(a,b);stat=ImageStat.Stat(d);image_diffs.append({'tab':tab,'width':w,'pixel_mae':round(sum(stat.mean)/3,3),'ratio_nonidentical':round(sum(1 for pix in d.get_flattened_data() if pix!=(0,0,0))/float(w*a.height),4)})
failed=[c for c in checks if not c[3]]
res={'checks_passed':len(checks)-len(failed),'checks_total':len(checks),'failed':failed,'errors':errors,'measurements':records,'pixel_diff':image_diffs}
(QA/'comparison.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
print('BROWSER',res['checks_passed'],'/',res['checks_total'],'failed',failed[:15],'js errors',errors[:12],flush=True)
print('NAV',[(r['version'],r['width'],r['measure']['nav']) for r in records],flush=True)
print('pixel differences',image_diffs,flush=True)
sys.exit(bool(failed or errors))
