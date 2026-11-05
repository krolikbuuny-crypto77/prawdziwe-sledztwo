"""RC57.10.63: CSSOM/style/layout/pixel parity before and after comment-only delivery optimization. No external APIs."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat
import hashlib, json, mimetypes, sys, traceback, shutil
ROOT=Path(__file__).resolve().parent.parent
QA=ROOT/'QA-RC571063';QA.mkdir(exist_ok=True)
manifest=json.loads((ROOT/'src/build-manifest.json').read_text(encoding='utf8'))
old_css='\n'.join(''.join((ROOT / part).read_text(encoding='utf8') for part in entry['parts']) for entry in manifest['sections'] if entry['kind']=='style')
csspath=next(ROOT.glob('ps-css-*.css'))
new_css=csspath.read_text(encoding='utf8')
assert len(old_css.encode('utf8'))-len(new_css.encode('utf8'))==24187, 'Only reviewed comment removal is allowed'
html=(ROOT/'index.html').read_text('utf8').replace('<head>','<head><base href="https://qa.game/">',1)
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
PROPS='display position color backgroundColor backgroundImage borderTopColor borderTopWidth borderLeftWidth borderRadius width maxWidth minWidth height maxHeight minHeight marginTop paddingTop paddingLeft fontSize fontWeight lineHeight opacity visibility overflow overflowX gridTemplateColumns flexDirection alignItems justifyContent gap boxShadow textShadow transform zIndex'.split()
widths=[390,1366,1920]
results={};exceptions=[];jsErrors=[];shots={};checks=[];cssom={}
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
    if name == '':
     req.fulfill(status=200,content_type='text/html; charset=utf-8',body=html.encode('utf8'));return
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
    cssom[(mode,width)]=pg.evaluate("(css) => { const s = new CSSStyleSheet(); s.replaceSync(css); return {ruleCount: s.cssRules.length, cssText: Array.from(s.cssRules, rule => rule.cssText).join('\\n')}; }",old_css if mode=='before' else new_css)
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
   if aa[:2]!=bb[:2] or aa[3:]!=bb[3:]:
    diffprops=[PROPS[j-3] if 3<=j<3+len(PROPS) else f'field{j}' for j,(x,y) in enumerate(zip(aa,bb)) if x!=y]
    diffs.append({'elementIndex':i,'properties':diffprops[:15]})
    if len(diffs)>=12:break
 cssComparisons.append({'key':key,'status':'PASS' if not diffs else 'DIFF','diffs':diffs[:12], 'elements':a['nodeCount'],
  'dynamicClassDifferences':sum(x[2]!=y[2] for x,y in zip(a['computed'],b['computed']))})
pixel=[]
for (mode,width,tab),file in shots.items():
 if mode!='before' or ('after',width,tab) not in shots:continue
 a=Image.open(file).convert('RGB');b=Image.open(shots[('after',width,tab)]).convert('RGB')
 diff=ImageChops.difference(a,b)
 bbox=diff.getbbox()
 pix=0 if bbox is None else sum(1 for x in diff.get_flattened_data() if x!=(0,0,0))
 pixel.append({'width':width,'tab':tab,'identical':bbox is None,'nonidenticalPixels':pix,'totalPixels':width*a.height,
               'meanAbsDifference':round(sum(ImageStat.Stat(diff).mean)/3,5)})
cssomChecks=[{'width':w,'identical':cssom.get(('before',w))==cssom.get(('after',w)),
  'beforeRules':cssom.get(('before',w),{}).get('ruleCount',0), 'afterRules':cssom.get(('after',w),{}).get('ruleCount',0),
  'cssomSha256':hashlib.sha256(cssom.get(('after',w),{}).get('cssText','').encode()).hexdigest()} for w in widths]
fail=[x for x in cssComparisons if x['status']!='PASS']
failChecks=[x for x in checks if not all(x[3:])]
report={'version':'RC57.10.63','mode':'local browser intercepted resources / no API','checkedTabs':len(cssComparisons),
        'comparedElementStates':sum(x['elements'] for x in cssComparisons if 'elements' in x),
        'cssStyleComparisons':cssComparisons,'cssom':cssomChecks,'screenshots':pixel,'checksFailed':failChecks,
        'exceptions':exceptions,'jsErrors':jsErrors}
(QA/'cssom-and-visual-parity.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Computed style comparisons',len(cssComparisons)-len(fail),'/',len(cssComparisons),flush=True)
print('Element states compared',report['comparedElementStates'],flush=True)
print('Screenshots pixel-identical',sum(p['identical'] for p in pixel),'/',len(pixel),flush=True)
print('CSSOM parity',cssomChecks,flush=True)
print('Failures',fail[:3],'checks',failChecks[:3],'exceptions',exceptions[:3],'jsErrors',jsErrors[:3],flush=True)
if fail or failChecks or exceptions or jsErrors or not all(x['identical'] for x in cssomChecks) or any(x['nonidenticalPixels']>100 or x['nonidenticalPixels']/max(1,x['totalPixels'])>0.0005 for x in pixel):sys.exit(1)
