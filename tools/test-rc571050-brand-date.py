"""Regression QA of brand/date at notebook, phone, intermediate and desktop widths.
No production API calls; uses local project assets with Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import mimetypes,json,sys
R=Path(__file__).resolve().parents[1]
Q=R/'QA-RC571050';Q.mkdir(exist_ok=True)
HTML=(R/'index.html').read_text('utf8').replace('<head>','<head><base href="https://game.test/">',1)
VIEWPORTS=[(320,720),(390,844),(768,1024),(950,800),(1024,768),(1366,768),(1536,864),(1920,1080)]
records=[];fail=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1366,'height':768},device_scale_factor=1,reduced_motion='reduce')
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 def route(r):
  rel=r.request.url.split('game.test/',1)[-1].split('?',1)[0].split('#',1)[0]
  f=(R/rel).resolve()
  if f.is_relative_to(R) and f.is_file():r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
  else:r.fulfill(status=404)
 page.route('https://game.test/**',route)
 page.set_content(HTML,wait_until='domcontentloaded',timeout=30000)
 page.wait_for_timeout(400)
 for w,h in VIEWPORTS:
  page.set_viewport_size({'width':w,'height':h})
  page.wait_for_timeout(110)
  result=page.evaluate('''()=>{
   const brand=document.querySelector('#ui14Sidebar .brand'), b=brand.querySelector('b'), copy=brand.querySelector('.brand-copy'), date=document.querySelector('#overview .case-kicker');
   const rect=e=>e.getBoundingClientRect(),br=rect(brand),r=rect(b), d=rect(date),cr=rect(copy);
   const range=document.createRange();range.selectNodeContents(b);const lines=[...range.getClientRects()];
   const colors=x=>(x.match(/[0-9.]+/g)||[]).slice(0,3).map(Number);
   function lum(x){let [red,green,blue]=colors(x).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return red*.2126+green*.7152+blue*.0722;}
   const style=getComputedStyle(date);let a=lum(style.color),c=lum(style.backgroundColor);
   return {text:b.textContent,titleWhitespace:getComputedStyle(b).whiteSpace,titleLineRects:lines.map(x=>({x:x.x,y:x.y,width:x.width,right:x.right})),titleBox:{left:r.left,right:r.right,width:r.width},copy:{left:cr.left,right:cr.right},brand:{left:br.left,right:br.right,height:br.height},titleScrollWidth:b.scrollWidth,titleClientWidth:b.clientWidth,date:{fontSize:parseFloat(style.fontSize),color:style.color,background:style.backgroundColor,contrast:Math.round((Math.max(a,c)+.05)/(Math.min(a,c)+.05)*100)/100,left:d.left,right:d.right},viewportScrollWidth:document.documentElement.scrollWidth,navCount:document.querySelectorAll('#nav button[data-tab]').length,jsShowTab:typeof showTab};
  }''')
  criteria={
   'date_font_readable':result['date']['fontSize']>=11.5,
   'date_contrast':result['date']['contrast']>=7,
   'no_horizontal_scroll':result['viewportScrollWidth']<=w+1,
   'navigation_intact':result['navCount']==10 and result['jsShowTab']=='function',
  }
  # The drawer's brand is deliberately hidden at small widths; only test its
  # geometry while it is actually visible (the desktop/notebook scenario).
  if result['brand']['height']>0:
   criteria.update({
    'brand_full_text':result['text']=='Prawdziwe Śledztwo',
    'brand_wrap_enabled':result['titleWhitespace']=='normal',
    'brand_not_overflowing':bool(result['titleLineRects']) and all(x['right']<=result['brand']['right']-3 and x['x']>=result['brand']['left']+3 for x in result['titleLineRects']),
    'brand_natural_size':result['brand']['height']>=72,
   })
  if w in (1366,1536):
   page.evaluate('showTab("overview")')
   page.locator('#ui14Sidebar .brand').screenshot(path=str(Q/f'BRAND-{w}.png'))
   page.locator('#overview .case-kicker').screenshot(path=str(Q/f'DATA-{w}.png'))
   page.screenshot(path=str(Q/f'PULPIT-{w}.png'),full_page=False)
  for key,ok in criteria.items():
   if not ok:fail.append(f'{w}x{h} {key}: {result}')
  records.append({'size':f'{w}x{h}','checks':criteria,'metrics':result})
  print(w,'PASS' if all(criteria.values()) else 'FAIL','title lines',len(result['titleLineRects']),'contrast',result['date']['contrast'],'font',result['date']['fontSize'],flush=True)
 (Q/'wyniki-rc50.json').write_text(json.dumps({'pass':sum(sum(v['checks'].values()) for v in records),'total':sum(len(v['checks']) for v in records),'failed':fail,'records':records,'jsErrors':errs},ensure_ascii=False,indent=2),'utf8')
 b.close()
print('RESULT',sum(sum(v['checks'].values()) for v in records),'/',sum(len(v['checks']) for v in records),'JS errors',len(errs),'fail',len(fail),flush=True)
if fail:print('\n'.join(fail[:4]));sys.exit(1)
if errs:print('errors',errs[:5]);sys.exit(2)
