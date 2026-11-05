"""CSS-only before/after regression test. Does not call external AI services."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat
import hashlib, json, mimetypes, sys, traceback, shutil
ROOT=Path(__file__).resolve().parent.parent
QA=ROOT/'QA-RC571062';QA.mkdir(exist_ok=True)
info=json.loads((QA/'removed-duplicate-rules.json').read_text(encoding='utf8'))
new_source=(ROOT/info['sourceFile']).read_text('utf8')
old_source=new_source
for rule in info['rules']:
 old_source=old_source[:rule['start']]+rule['text']+old_source[rule['start']:]
assert hashlib.sha256(old_source.encode()).hexdigest()==info['oldSha256']
csspath=next(ROOT.glob('ps-css-*.css'))
new_css=csspath.read_text('utf8')
assert new_css.count(new_source)==1
old_css=new_css.replace(new_source,old_source,1)
html=(ROOT/'index.html').read_text('utf8').replace('<head>','<head><base href="https://qa.game/">',1)
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
PROPS='display position color backgroundColor backgroundImage borderTopColor borderTopWidth borderLeftWidth borderRadius width maxWidth minWidth height maxHeight minHeight marginTop paddingTop paddingLeft fontSize fontWeight lineHeight opacity visibility overflow overflowX gridTemplateColumns flexDirection alignItems justifyContent gap boxShadow textShadow transform zIndex'.split()
widths=[390,1366,1920]
results={};exceptions=[];jsErrors=[];shots={};checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for mode in ('before','after'):
  for width in widths:
   height=844 if width==390 else 768 if width==1366 else 1080
   ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce',locale='pl-PL',timezone_id='Europe/Warsaw')
   pg=ctx.new_page();pg.on('pageerror',lambda err,mode=mode,width=width:jsErrors.append([mode,width,str(err)]))
   css_bytes=(old_css if mode=='before' else new_css).encode('utf8')
   def route(req):
    name=req.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]
    if name==csspath.name:
     req.fulfill(status=200,content_type='text/css',body=css_bytes);return
    target=(ROOT/name).resolve()
    if target.is_relative_to(ROOT) and target.is_file():
     req.fulfill(status=200,body=target.read_bytes(),content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
    else:req.fulfill(status=404,body='')
   pg.route('https://qa.game/**',route)
   try:
    print('Loading',mode,width,flush=True)
    pg.set_content(html,wait_until='domcontentloaded',timeout=45000)
    print('Loaded',mode,width,flush=True)
    pg.wait_for_timeout(220)
    assert pg.evaluate("() => typeof showTab === 'function' && typeof STATE === 'object'"),f'Runtime not loaded: {mode} {width}'
    for tab in TABS:
     print('Tab',mode,width,tab,flush=True)
     pg.evaluate('(t)=>showTab(t)',tab)
     pg.wait_for_timeout(30)
     rec=pg.evaluate('''(props) => {
       const active=document.querySelector('.section.active');
       const nodes=[...document.querySelectorAll('.sidebar *'),...document.querySelectorAll('.section.active *')]
         .filter((el,idx,arr)=>idx<700 && (el.nodeType===1));
       const data=nodes.map(el=>{
        const cs=getComputedStyle(el), rect=el.getBoundingClientRect();
        return [el.tagName,el.id,el.className && typeof el.className === 'string'?el.className:'',
          ...props.map(k=>cs[k]),
          Math.round(rect.x*10)/10,Math.round(rect.y*10)/10,Math.round(rect.width*10)/10,Math.round(rect.height*10)/10];
       });
       return {tab:STATE.tab,active:active?.id, width:document.documentElement.scrollWidth,
               clientWidth:document.documentElement.clientWidth, nodeCount:nodes.length, computed:data};
     }''',PROPS)
     checks.append([mode,width,tab,rec['tab']==tab and rec['active']==tab,rec['width']<=rec['clientWidth']+2])
     key=f'{width}:{tab}'
     results.setdefault(mode,{})[key]=rec
     if tab in ('overview','interview','labs'):
      fname=QA/f'{mode}-{tab}-{width}.png'
      pg.screenshot(path=str(fname),animations='disabled',timeout=20000)
      shots[(mode,width,tab)]=fname
   except Exception as e:
    exceptions.append(f'{mode}/{width}: {type(e).__name__}: {e}')
    traceback.print_exc()
   finally:ctx.close()
 browser.close()
cssComparisons=[]
for key, a in results.get('before',{}).items():
 b=results.get('after',{}).get(key)
 if not b:
  cssComparisons.append({'key':key,'status':'missing result'});continue
 diffs=[]
 if a!=b:
  for name in ('tab','active','width','clientWidth','nodeCount'):
   if a[name]!=b[name]:diffs.append([name,a[name],b[name]])
  for i,(aa,bb) in enumerate(zip(a['computed'],b['computed'])):
   if aa!=bb:
    diffprops=[PROPS[j-3] if 3<=j<3+len(PROPS) else f'field{j}' for j,(x,y) in enumerate(zip(aa,bb)) if x!=y]
    diffs.append({'elementIndex':i,'properties':diffprops[:15]})
    if len(diffs)>=12:break
 cssComparisons.append({'key':key,'status':'PASS' if a==b else 'DIFF','diffs':diffs[:12], 'elements':a['nodeCount']})
pixel=[]
for (mode,width,tab),file in shots.items():
 if mode!='before' or ('after',width,tab) not in shots:continue
 a=Image.open(file).convert('RGB');b=Image.open(shots[('after',width,tab)]).convert('RGB')
 diff=ImageChops.difference(a,b)
 bbox=diff.getbbox()
 pix=0 if bbox is None else sum(1 for x in diff.getdata() if x!=(0,0,0))
 pixel.append({'width':width,'tab':tab,'identical':bbox is None,'nonidenticalPixels':pix,'totalPixels':width*a.height,
               'meanAbsDifference':round(sum(ImageStat.Stat(diff).mean)/3,5)})
fail=[x for x in cssComparisons if x['status']!='PASS']
failChecks=[x for x in checks if not all(x[3:])]
report={'version':'RC57.10.62','mode':'local browser intercepted resources / no API','checkedTabs':len(cssComparisons),
        'comparedElementStates':sum(x['elements'] for x in cssComparisons if 'elements' in x),
        'cssStyleComparisons':cssComparisons,'screenshots':pixel,'checksFailed':failChecks,
        'exceptions':exceptions,'jsErrors':jsErrors}
(QA/'css-before-after-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Computed style comparisons',len(cssComparisons)-len(fail),'/',len(cssComparisons),flush=True)
print('Element states compared',report['comparedElementStates'],flush=True)
print('Screenshots pixel-identical',sum(p['identical'] for p in pixel),'/',len(pixel),flush=True)
print('Failures',fail[:3],'checks',failChecks[:3],'exceptions',exceptions[:3],'jsErrors',jsErrors[:3],flush=True)
if fail or failChecks or exceptions or jsErrors:sys.exit(1)
