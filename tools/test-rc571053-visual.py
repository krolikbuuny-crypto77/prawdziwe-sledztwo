"""RC53: geometric layout regression for dynamic sidebar, witness heading and dashboard links."""
from pathlib import Path
import mimetypes, json, sys
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
QA=R/'QA-RC571053';QA.mkdir(exist_ok=True)
SIZES=[(390,844),(768,1024),(941,768),(1024,768),(1152,720),(1280,720),(1366,768),(1536,864),(1920,1080)]
RESULT=[];ERRORS=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce')
 page.on('pageerror',lambda e:ERRORS.append(str(e)))
 html=(R/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://qa.game/">',1)
 def route(r):
  rel=r.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]; f=(R/rel).resolve()
  if f.is_relative_to(R) and f.is_file():r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://qa.game/**',route)
 page.set_content(html,wait_until='domcontentloaded',timeout=60000)
 page.wait_for_timeout(300)
 initial=page.evaluate('''()=>({found:STATE.found.size,dialogues:Object.fromEntries(Object.entries(STATE.dialogues).map(([k,v])=>[k,v.length]))})''')
 for w,h in SIZES:
  page.set_viewport_size({'width':w,'height':h})
  # The sidebar is off-canvas on mobile, so validate it only on desktop layouts.
  page.evaluate('showTab("overview")')
  obj=page.evaluate('''()=>{const nav=document.querySelector('#nav'),side=document.querySelector('#ui14Sidebar'),btns=[...nav.querySelectorAll('button[data-tab]')], groups=[...nav.querySelectorAll('.ps49-nav-group')], tools=document.querySelector('#ps76Tools'), cards=[...document.querySelectorAll('#overview .ps38-actions-list button')];const r=e=>e.getBoundingClientRect();const styles=cards.map(b=>{let e=b.querySelector('small'),s=getComputedStyle(e);return {label:e?.textContent,font:parseFloat(s.fontSize),color:s.color,height:r(b).height}}); return {side:{h:side.clientHeight,sh:side.scrollHeight,overflow:getComputedStyle(side).overflowY},nav:{h:nav.clientHeight,sh:nav.scrollHeight,r:r(nav).toJSON()},navItems:btns.map(b=>({id:b.dataset.tab,r:r(b).toJSON()})),groups:groups.map(g=>r(g).toJSON()),tool:r(tools).toJSON(),actions:styles,fullWidth:document.documentElement.scrollWidth,viewport:innerWidth}}''')
  desktop=w>=941
  checks={
   'all_10_tabs':len(obj['navItems'])==10,
   'action_cards':len(obj['actions'])==4,
   'action_descriptions_legible':all(a['font']>=13 and int(a['color'].split('(')[1].split(',')[0])>=220 for a in obj['actions']),
   'no_root_horizontal_overflow':obj['fullWidth']<=w+2,
  }
  if desktop:
   checks['nav_fits_content']=obj['nav']['sh']<=obj['nav']['h']+2
   checks['sidebar_can_scroll']=obj['side']['sh']<=obj['side']['h']+2 or obj['side']['overflow'] in ('auto','scroll')
   checks['nav_buttons_inside_container']=all(x['r']['top']>=obj['nav']['r']['top']-1 and x['r']['bottom']<=obj['nav']['r']['bottom']+1 for x in obj['navItems'])
   checks['nav_not_touching_tools']=obj['nav']['r']['bottom']+6<obj['tool']['top']
   checks['no_nav_button_group_overlap']=all(not (a['r']['top']<g['bottom']-1 and a['r']['bottom']>g['top']+1) for a in obj['navItems'] for g in obj['groups'])
  if w in (1366,1536):
   page.screenshot(path=str(QA/f'PULPIT-{w}.png'))
   page.locator('#ui14Sidebar').screenshot(path=str(QA/f'MENU-{w}.png'))
  page.evaluate('showTab("interview")')
  dat=page.evaluate('''()=>{let l=document.querySelector('#characterList'),s=getComputedStyle(l,'::before'),a=l.querySelector('.character'),r=e=>e.getBoundingClientRect(),list=r(l),card=r(a),st=getComputedStyle(l);return {list:list.toJSON(),card:card.toJSON(),pseudo:{content:s.content,display:s.display,flex:s.flex,height:parseFloat(s.height),lineHeight:parseFloat(s.lineHeight),fontSize:parseFloat(s.fontSize)},scroll:st.overflowY,scrollH:l.scrollHeight,clientH:l.clientHeight}}''')
  if desktop:
   checks['witness_heading_single_line']= 'Świadkowie (6)' in dat['pseudo']['content'] and dat['pseudo']['height']>=48
   checks['witness_heading_not_overlaying_card']=dat['card']['top'] >= dat['list']['top'] + dat['pseudo']['height']+10
   checks['witness_cards_scrollable']=dat['scroll'] in ('auto','scroll') or dat['scrollH']<=dat['clientH']+1
  if w in (1366,1536):
   page.locator('#characterList').screenshot(path=str(QA/f'SWIADKOWIE-{w}.png'))
  # Actual user action must navigate, not only JS activate.
  if desktop:
   page.locator('#nav button[data-tab="evidence"]').click()
   checks['click_evidence_opens_tab']=page.evaluate('STATE.tab')=='evidence'
   page.locator('#nav button[data-tab="interview"]').click()
   checks['click_interview_opens_tab']=page.evaluate('STATE.tab')=='interview'
  result={'size':f'{w}x{h}','checks':checks,'nav':obj,'witness':dat}
  RESULT.append(result)
  bad=[k for k,v in checks.items() if not v]
  print(f'{w}x{h}: {len(checks)-len(bad)}/{len(checks)}',('FAIL:'+','.join(bad)) if bad else 'PASS',flush=True)
 after=page.evaluate('''()=>({found:STATE.found.size,dialogues:Object.fromEntries(Object.entries(STATE.dialogues).map(([k,v])=>[k,v.length]))})''')
 OTHER={'unchanged_found':initial['found']==after['found'],'unchanged_dialogues':initial['dialogues']==after['dialogues'],'no_js_errors':len(ERRORS)==0}
 (QA/'RESULTS.json').write_text(json.dumps({'views':RESULT,'other':OTHER,'errors':ERRORS},ensure_ascii=False,indent=2))
 total=sum(len(x['checks']) for x in RESULT)+len(OTHER)
 passed=sum(sum(x['checks'].values()) for x in RESULT)+sum(OTHER.values())
 print('TOTAL',passed,'/',total,'OTHER',OTHER,flush=True)
 browser.close()
 if passed!=total:sys.exit(1)
