"""RC57.10.56 geometric / navigation / plot-gating smoke in headless Chromium.
Tests do not grant evidence, change saves or query live AI."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, mimetypes, os, sys
R=Path(__file__).resolve().parents[1]; Q=R/'QA-RC571056';Q.mkdir(exist_ok=True)
SIZES=[(1920,1080),(1536,864),(1366,768),(1280,720),(1024,768),(390,844)]
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
output=[];errs=[];failed=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1,reduced_motion='reduce',accept_downloads=False)
 page.on('pageerror',lambda ex:errs.append(str(ex)))
 def route(r):
  import urllib.parse
  rel=urllib.parse.unquote(r.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]); file=(R/rel).resolve()
  if file.is_relative_to(R) and file.is_file():r.fulfill(status=200,body=file.read_bytes(),content_type=mimetypes.guess_type(file.name)[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://qa.game/**',route)
 html=(R/'index.html').read_text().replace('<head>','<head><base href="https://qa.game/">',1)
 page.set_content(html,wait_until='domcontentloaded',timeout=90000)
 page.wait_for_function('window.PS56_LAYOUT && document.querySelectorAll("#nav .ps56-nav-label").length===10',{ 'timeout':20000 } if False else None) if False else None
 page.wait_for_timeout(500)
 for w,h in SIZES:
  page.set_viewport_size({'width':w,'height':h})
  for i,tab in enumerate(TABS):
   page.evaluate('(name)=>showTab(name)',tab)
   page.wait_for_timeout(65)
   metrics=page.evaluate('''()=>{
    const active=document.querySelector('.section.active');const rect=e=>e?.getBoundingClientRect().toJSON();
    const nav=[...document.querySelectorAll('#nav button[data-tab]')].map(x=>({id:x.dataset.tab,r:rect(x),label:x.querySelector('.ps56-nav-label')?.textContent,labelR:rect(x.querySelector('.ps56-nav-label'))}));
    const story=document.querySelector('#story26Overview');const found=STATE.found;
    const unready=(window.STORY26_QA?.threads||[]).filter(x=>x.needs.some(id=>!found.has(id)));
    return {active:active?.id,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      nav,sourceCount:found.size,hiddenThreads:unready.length,
      storyText:story?.textContent||'', storyCards:story?.querySelectorAll('.story26-case').length||0,
      searchFirst:(()=>{const a=document.querySelector('#search #areas'),s=document.querySelector('#search .searchbox');return a&&s&&!!(s.compareDocumentPosition(a)&Node.DOCUMENT_POSITION_FOLLOWING)})(),
      witness:[...document.querySelectorAll('#interview .characterlist .character')].slice(0,6).map(e=>({r:rect(e),img:rect(e.querySelector('.wp-mini')),copy:rect(e.querySelector('.charactercopy'))})),
      panel:rect(active), navRegion:rect(document.querySelector('#nav'))};
   }''')
   desktop=w>=941
   checks={
    'active_tab':metrics['active']==tab,
    'root_no_horizontal_overflow':metrics['scrollWidth']<=w+2,
    'all_10_tabs':len(metrics['nav'])==10,
    'search_before_filters':metrics['searchFirst'],
   }
   if desktop:
    checks['menu_label_one_line']=all((not v['labelR']) or (v['labelR']['height']<=24) for v in metrics['nav'])
    checks['menu_label_inside_button']=all(v['labelR'] and v['labelR']['right']<=v['r']['right']-6 and v['labelR']['left']>=v['r']['left'] for v in metrics['nav'])
    checks['menu_buttons_noncrossing']=all(metrics['nav'][i]['r']['bottom']<=metrics['nav'][i+1]['r']['top']+0.5 for i in range(9))
    if tab=='interview':
     # Portrait/copy overlap only when in same row (normal desktop).
     checks['witness_images_no_collision']=all(not (v['img'] and v['copy'] and v['img']['left'] < v['copy']['right']-1 and v['img']['right']>v['copy']['left']+1 and v['img']['top']<v['copy']['bottom']-1 and v['img']['bottom']>v['copy']['top']+1) for v in metrics['witness'])
   if tab=='overview':
    checks['only_discovered_threads']=not any(t in metrics['storyText'] for t in ['Każdy ukrywa co innego','Oryginał protokołu jako przynęta'] if metrics['sourceCount']<5) # coarse smoke; precise check below
    if metrics['hiddenThreads']:
     checks['no_undiscovered_details']=all(not txt in metrics['storyText'] for txt in ['O 01:32 zaproponowano Lenie spotkanie','Fotografia oznaczenia L-2','Ostrzeżenia TCMS i wstrząs'] )
   row={'size':f'{w}x{h}','tab':tab,'checks':checks,'geo':metrics if w==1920 and tab in ('overview','interview','search') else None}
   output.append(row)
   if w in (1920,1366) and (tab in TABS):
    page.screenshot(path=str(Q/f'{tab.upper()}-{w}.png'),timeout=15000)
   bad=[k for k,v in checks.items() if not v]
   if bad:failed.append((w,h,tab,bad));print('FAIL',w,h,tab,bad,flush=True)
  print('SIZE',w,h,'done',flush=True)
 res={'totals':{'checks':sum(len(x['checks']) for x in output),'passed':sum(sum(x['checks'].values()) for x in output)},'failed':failed,'errors':errs,'results':output}
 (Q/'results.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
 print('RESULT',res['totals'],'FAILS',failed,'ERRORS',errs[:8],flush=True)
 browser.close()
 if failed or errs:sys.exit(1)
