"""RC57.10.64: browser UI/nav and optional cross-version visual parity.

python tools/test-rc571064-browser.py [--baseline /path/to/RC57.10.63]
All external network calls blocked. No production AI testing.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat
import argparse, json, mimetypes, shutil, hashlib, sys

ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--baseline',type=Path);args=parser.parse_args()
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
PROPS='display position color backgroundColor backgroundImage borderTopColor borderTopWidth borderRadius width height paddingTop paddingLeft fontSize fontWeight lineHeight opacity visibility overflowX gridTemplateColumns flexDirection gap transform'.split()
QA=ROOT/'QA-RC571064';QA.mkdir(exist_ok=True)
errors=[];checks=[];screens={};results={};cssHashes={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for label,root in ([('before',args.baseline.resolve()),('after',ROOT)] if args.baseline else [('after',ROOT)]):
  for width in [390,1366,1920]:
   context=browser.new_context(viewport={'width':width,'height':844 if width==390 else 768 if width==1366 else 1080},device_scale_factor=1,reduced_motion='reduce',locale='pl-PL',timezone_id='Europe/Warsaw')
   pg=context.new_page();pg.on('pageerror',lambda e,label=label,width=width:errors.append(f'{label}/{width}: {e}'))
   html=(root/'index.html').read_text('utf8').replace('<head>','<head><base href="https://qa.game/">',1)
   def route(req):
    url=req.request.url
    if not url.startswith('https://qa.game/'):
     req.abort('blockedbyclient');return
    rel=url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]
    f=(root/rel).resolve()
    if f.is_relative_to(root) and f.is_file():
     req.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
    else:req.fulfill(status=404,body='')
   pg.route('**/*',route)
   pg.set_content(html,wait_until='load',timeout=60000)
   assert pg.evaluate("() => typeof showTab==='function' && !!window.PS_RC42"),f'No JS runtime: {label}/{width}'
   cssHashes[(label,width)]=pg.evaluate("() => [...document.styleSheets].filter(s=>s.href&&s.href.includes('ps-css-')).map(s=>s.href.split('/').pop())")
   for tab in TABS:
    pg.evaluate('tab=>showTab(tab)',tab)
    pg.wait_for_timeout(40)
    response=pg.evaluate('''props=>{
      const active=document.querySelector('.section.active');
      const nodes=[...document.querySelectorAll('.sidebar *'),...document.querySelectorAll('.section.active *')].slice(0,700);
      return {active:STATE.tab,visible:active?.id,navigation:document.querySelectorAll('.section.active').length,
       width:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
       evidence:STATE.found.size,dialogueCount:Object.values(STATE.dialogues).reduce((a,x)=>a+x.length,0),
       rendered:nodes.map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return [el.tagName,el.id,...props.map(k=>s[k]),
         ...[r.x,r.y,r.width,r.height].map(v=>Math.round(v*10)/10)]})
      }}''',PROPS)
    checks.append({'version':label,'width':width,'tab':tab,'ok':response['active']==tab and response['visible']==tab and response['navigation']==1 and response['width']<=response['clientWidth']+2})
    results[(label,width,tab)]=response
    if tab in ['overview','interview','labs']:
     target=QA/f'{label}-{width}-{tab}.png';pg.screenshot(path=str(target),animations='disabled',timeout=20000)
     screens[(label,width,tab)]=target
   print(f'{label} {width}px: 10 tabs checked',flush=True)
   context.close()
 browser.close()
visual=[];state=[]
if args.baseline:
 for width in [390,1366,1920]:
  for tab in TABS:
   old=results[('before',width,tab)];new=results[('after',width,tab)]
   # Dynamic CSS classes not included; all computed styles and layout are compared.
   same=old==new
   differences=[]
   if not same:
    for key in ['active','visible','navigation','width','clientWidth','evidence','dialogueCount']:
     if old[key]!=new[key]:differences.append({'field':key,'old':old[key],'new':new[key]})
    for i,(a,b) in enumerate(zip(old['rendered'],new['rendered'])):
     if a!=b:
      differences.append({'nodeIndex':i,'old':a[:7],'new':b[:7],
                          'differentFieldIndexes':[j for j,(x,y) in enumerate(zip(a,b)) if x!=y]})
      if len(differences)>5:break
   state.append({'width':width,'tab':tab,'identical':same,'elementsCompared':len(old['rendered']),'diffs':differences})
  for tab in ['overview','interview','labs']:
   a=Image.open(screens[('before',width,tab)]).convert('RGB');b=Image.open(screens[('after',width,tab)]).convert('RGB')
   diff=ImageChops.difference(a,b)
   different=0 if not diff.getbbox() else sum(1 for v in diff.get_flattened_data() if v!=(0,0,0))
   visual.append({'width':width,'tab':tab,'identical':different==0,'differentPixels':different,
                  'meanAbsChannelDiff':round(sum(ImageStat.Stat(diff).mean)/3,6)})
report={'version':'RC57.10.64','baseline':'RC57.10.63' if args.baseline else None,
        'method':'local Chromium intercepted static resources; 10 tabs x three widths; external network blocked',
        'checks':checks,'stateParity':state,'screenshots':visual,'stylesheet':{f'{label}:{width}':value for (label,width),value in cssHashes.items()},'errors':errors}
(QA/('browser-parity-vs-rc63.json' if args.baseline else 'browser-smoke.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
failed=[x for x in checks if not x['ok']];mismatch=[x for x in state if not x['identical']]
print('UI checks',len(checks)-len(failed),'/',len(checks),'computed states',len(state)-len(mismatch),'/',len(state),
      'exact screenshots',sum(x['identical'] for x in visual),'/',len(visual),'errors',len(errors),flush=True)
if failed or mismatch or errors or any(x['differentPixels']>100 or x['differentPixels']>0.0005*(x['width']*(844 if x['width']==390 else 768 if x['width']==1366 else 1080)) for x in visual):
 print('Failed:',failed[:2],mismatch[:3], [x for x in visual if x['differentPixels']][:5], errors[:4],flush=True);sys.exit(1)
