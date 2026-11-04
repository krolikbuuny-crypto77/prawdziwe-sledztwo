"""RC57.10.54: geometry and state guards for Full HD and earlier breakpoints. Offline browser."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
R=Path(__file__).resolve().parents[1]
QA=R/'QA-RC571054'; QA.mkdir(exist_ok=True)
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
SIZES=[(390,844),(1366,768),(1536,864),(1600,900),(1920,900),(1920,1080)]
errors=[];results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1,reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 html=(R/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://qa.game/">',1)
 def route(r):
  rel=r.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0];f=(R/rel).resolve()
  if f.is_relative_to(R) and f.is_file():r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://qa.game/**',route)
 page.set_content(html,wait_until='domcontentloaded',timeout=60000);page.wait_for_timeout(250)
 before=page.evaluate('''()=>({found:STATE.found.size, dialogueLengths:Object.fromEntries(Object.entries(STATE.dialogues).map(([k,v])=>[k,v.length]))})''')
 for w,h in SIZES:
  page.set_viewport_size({'width':w,'height':h})
  checks={};metric={}
  for tab in TABS:
   page.evaluate('(t)=>showTab(t)',tab)
   page.wait_for_timeout(18)
   d=page.evaluate('''tab=>{let sec=document.getElementById(tab);return{tab:STATE.tab,active:[...document.querySelectorAll('.section.active')].map(x=>x.id),width:document.documentElement.scrollWidth,visibleControls:[...sec.querySelectorAll('input,textarea,button,select,summary')].filter(e=>{let r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0}).length}}''',tab)
   checks[f'{tab}:active']=d['active']==[tab] and d['tab']==tab
   checks[f'{tab}:no-horizontal-scroll']=d['width']<=w+1
   checks[f'{tab}:controls-visible']=d['visibleControls']>0
   if tab=='overview' and w>=1600:
    v=page.evaluate('''()=>{let a=document.querySelector('#overview .ps38-front-grid'),hero=a.querySelector('.hero'),r=x=>x.getBoundingClientRect();return{width:r(hero).width,container:r(a).width,photos:r(document.querySelector('#photoGrid')).width}}''')
    metric['overview']=v
    checks['fullhd:hero-uses-available-width']=v['width']>=v['container']-4
    checks['fullhd:gallery-not-cramped']=v['photos']>420
   if tab=='interview':
    v=page.evaluate('''()=>{let chat=document.querySelector('#psm-panel-chat'),log=document.querySelector('#chatLog'),foot=document.querySelector('#interview .chatfoot'),input=document.querySelector('#chatInput'),r=e=>e.getBoundingClientRect();const cards=[...document.querySelectorAll('#characterList .character')];return {chatWidth:r(chat).width,logWidth:r(log).width,footWidth:r(foot).width,fieldWidth:r(input).width,footBelowLog:r(foot).top>=r(log).bottom-1,fieldInside:r(input).left>=r(foot).left&&r(input).right<=r(foot).right+2,witnesses:cards.map(c=>{let a=r(c),photo=c.querySelector('.wp-mini'),t=c.querySelector('.charactercopy');if(!photo||!t)return null;let p=r(photo),q=r(t);return{noOverlap:p.right<=q.left+2,photoIn:p.left>=a.left-2&&p.right<=a.right+2,textIn:q.left>=a.left-2&&q.right<=a.right+2}})}}''')
    metric['interview']=v
    checks['interview:input-inside-panel']=v['fieldInside']
    checks['interview:question-below-log']=v['footBelowLog']
    if w>=1600:
     checks['fullhd:protocol-full-chat-width']=v['logWidth']>=v['chatWidth']-6
     checks['fullhd:question-full-chat-width']=v['footWidth']>=v['chatWidth']-6
    if w>=1366:
     checks['interview:witness-photos-separated']=len(v['witnesses'])==6 and all(c and c['noOverlap'] and c['photoIn'] and c['textIn'] for c in v['witnesses'])
   if tab=='evidence' and w>=1600:
    v=page.evaluate('''()=>{let a=document.querySelector('#evidence .ev-header').getBoundingClientRect(),b=document.querySelector('#evidence .ev-workspace').getBoundingClientRect();return{headerHeight:a.height,workspaceTop:b.top}}''');metric['evidence']=v
    checks['fullhd:evidence-header-compact']=v['headerHeight']<160
    checks['fullhd:evidence-workspace-reached']=v['workspaceTop']<700
  # Test actual clicking navigation, not only calling showTab.
  if w in (1920,1366):
   page.evaluate('showTab("overview")')
   e=page.locator('#ui14Sidebar #nav button').filter(has_text='Przesłuchania').first
   if e.count():
    e.click(timeout=8000)
    checks['navigation:click-interview']=page.evaluate('STATE.tab')=='interview'
   else: checks['navigation:click-interview']=False
  results.append({'size':f'{w}x{h}','checks':checks,'metrics':metric})
  print(f'{w}x{h}: {sum(checks.values())}/{len(checks)}', [k for k,v in checks.items() if not v][:5],flush=True)
 after=page.evaluate('''()=>({found:STATE.found.size, dialogueLengths:Object.fromEntries(Object.entries(STATE.dialogues).map(([k,v])=>[k,v.length]))})''')
 browser.close()
 allchecks={'no-found-mutation':before['found']==after['found'],'no-dialogue-mutation':before['dialogueLengths']==after['dialogueLengths'],'no-javascript-errors':not errors}
 report={'tests':results,'global':allchecks,'errors':errors}
 (QA/'fullhd-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 fail=[r['size']+':'+k for r in results for k,v in r['checks'].items() if not v];fail += [k for k,v in allchecks.items() if not v]
 print('TOTAL',sum(sum(r['checks'].values()) for r in results)+sum(allchecks.values()),'/',sum(len(r['checks']) for r in results)+len(allchecks),'FAILURES',fail,'JS',errors[:2]);sys.exit(1 if fail else 0)
