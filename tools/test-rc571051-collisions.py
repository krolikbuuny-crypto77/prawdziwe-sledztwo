"""RC57.10.51: measurable clipping and image/text collision regressions.
This test uses the local built HTML and never calls the production APIs."""
from pathlib import Path
import json,mimetypes,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://game.test/">',1)
QA=ROOT/'QA-RC571051';QA.mkdir(exist_ok=True)
SIZES=[(390,844),(768,1024),(950,800),(1024,768),(1100,768),(1280,800),(1366,768),(1536,864),(1920,1080)]
results=[];failures=[];js_errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1366,'height':768},device_scale_factor=1,reduced_motion='reduce')
 page.on('pageerror',lambda e:js_errors.append(str(e)))
 def route(r):
  rel=r.request.url.split('game.test/',1)[-1].split('?',1)[0].split('#',1)[0]
  file=(ROOT/rel).resolve()
  if file.is_relative_to(ROOT) and file.is_file():r.fulfill(status=200,body=file.read_bytes(),content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://game.test/**',route)
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 page.wait_for_timeout(300)
 for w,h in SIZES:
  page.set_viewport_size({'width':w,'height':h})
  page.evaluate('showTab("interview")')
  page.wait_for_timeout(110)
  measured=page.evaluate('''()=>{
   const box=(e)=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
   const nav=[...document.querySelectorAll('#nav button[data-tab]')].map(b=>{
    const label=[...b.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).pop();
    const r=document.createRange();if(label)r.selectNodeContents(label);const spans=label?[...r.getClientRects()].map(a=>({x:a.x,right:a.right,y:a.y,bottom:a.bottom})):[];
    const brect=box(b);return {label:b.textContent.trim(),rect:brect,labelRects:spans,whiteSpace:getComputedStyle(b).whiteSpace,scrollHeight:b.scrollHeight,clientHeight:b.clientHeight};
   });
   const cards=[...document.querySelectorAll('#characterList .character')].map(c=>{
    const photo=c.querySelector('.wp-mini'),copy=c.querySelector('.charactercopy');
    const title=copy?.querySelector('b'),description=copy?.querySelector('small');
    return {name:title?.textContent||'',rect:box(c),photo:box(photo),copy:box(copy),title:box(title),description:description?box(description):null};
   });
   return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,nav,cardCount:cards.length,cards,sidebarVisible:document.querySelector('#ui14Sidebar').getBoundingClientRect().right>0};
  }''')
  checks={'all_10_nav_items':len(measured['nav'])==10,'all_6_witnesses':measured['cardCount']==6,'no_horizontal_page_scroll':measured['scrollWidth']<=w+1}
  if w>=941 and measured['sidebarVisible']:
   for idx,n in enumerate(measured['nav']):
    box=n['rect'];segs=n['labelRects']
    checks[f'nav_{idx+1:02d}_visible']=bool(segs) and all(s['x']>=box['x']+1 and s['right']<=box['right']-3 and s['y']>=box['y']+1 and s['bottom']<=box['bottom']-1 for s in segs)
    checks[f'nav_{idx+1:02d}_not_clipped']=n['whiteSpace']=='normal' and n['scrollHeight']<=n['clientHeight']+2
  if w>=941:
   for i,c in enumerate(measured['cards']):
    a,photo,copy=c['rect'],c['photo'],c['copy']
    checks[f'card_{i+1:02d}_photo_text_separated']=photo['right']+5<=copy['x']
    checks[f'card_{i+1:02d}_photo_inside']=photo['x']>=a['x']+1 and photo['right']<=a['right']-1 and photo['y']>=a['y'] and photo['bottom']<=a['bottom']
    checks[f'card_{i+1:02d}_text_inside']=copy['x']>=a['x']+1 and copy['right']<=a['right']-1 and copy['y']>=a['y'] and copy['bottom']<=a['bottom']
   # Enlarge sidebar font to mimic user text scaling without changing window size.
   if w in (1366,1536):
    style_test=page.add_style_tag(content='#ui14Sidebar #nav button{font-size:18px!important;}')
    scaled=page.evaluate('''()=>[...document.querySelectorAll('#nav button[data-tab]')].map(b=>{
      let t=[...b.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).pop(),r=document.createRange();r.selectNodeContents(t);return {button:b.getBoundingClientRect().toJSON(), text:[...r.getClientRects()].map(x=>x.toJSON())}
    })''')
    checks['nav_scaled_text_full']=all(all(s['x']>=n['button']['left'] and s['right']<=n['button']['right']-2 and s['top']>=n['button']['top'] and s['bottom']<=n['button']['bottom'] for s in n['text']) for n in scaled)
    if w==1366:
     page.locator('#nav').screenshot(path=str(QA/'NAV-FONT-18-1366.png'))
    style_test.evaluate('(node)=>node.remove()')
    page.wait_for_timeout(70)
  if w in (1366,1536):
   page.locator('#nav').screenshot(path=str(QA/f'NAV-{w}.png'))
   page.locator('#characterList').screenshot(path=str(QA/f'SWIADKOWIE-{w}.png'))
  results.append({'width':w,'height':h,'checks':checks,'metrics':measured})
  failed=[k for k,v in checks.items() if not v]
  failures.extend([f'{w}x{h}: {k}' for k in failed])
  print(f'{w}x{h}: {sum(checks.values())}/{len(checks)} checks', 'FAILS:'+','.join(failed[:3]) if failed else 'PASS',flush=True)
 (QA/'wyniki-rc51.json').write_text(json.dumps({'passed':sum(sum(r['checks'].values()) for r in results),'total':sum(len(r['checks']) for r in results),'failures':failures,'jsErrors':js_errors,'sizes':[{k:v for k,v in r.items() if k!='metrics'} for r in results]},ensure_ascii=False,indent=2))
 browser.close()
print('SUMMARY',sum(sum(r['checks'].values()) for r in results),'/',sum(len(r['checks']) for r in results),'js',len(js_errors),'failures',len(failures),flush=True)
if failures or js_errors:print('Problems:',failures[:10],js_errors[:3]);sys.exit(1)
