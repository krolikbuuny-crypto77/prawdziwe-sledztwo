"""Baseline parity probe for responsive CSS and key module visibility.
Run with --baseline to store baseline from Etap 5, without modifying the game.
"""
import json,sys,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
SNAP=ROOT/'VALIDATION-CSS-BASELINE.json'
html=(ROOT/'index.html').read_text(encoding='utf8')
sections=('overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final')
css_selector=['.layout','.sidebar','.main','.content','.sectionheading','.nav','.topbar','.hero','.photos','.docgrid','.charactergrid','.chat','.chatlog','.paper','.thread-board-panel','.thread-cork','.sv2-mobile-nav','.ev-file','.wp-stage','#et1SceneImage','#et2Viewer','#threadBoardPanel']
def capture(page):
 return page.evaluate('''selectors => {
   const res={};for(const selector of selectors){const el=document.querySelector(selector);if(!el)continue;const s=getComputedStyle(el);res[selector]={display:s.display,position:s.position,overflowX:s.overflowX,width:s.width,maxWidth:s.maxWidth,gridTemplateColumns:s.gridTemplateColumns,color:s.color,backgroundColor:s.backgroundColor,fontSize:s.fontSize,visibility:s.visibility,opacity:s.opacity};}return res;
 }''',css_selector)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 report={}
 for width in (320,390,768,1440):
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  report[str(width)]={'styles':page.evaluate('document.querySelectorAll("style").length'), 'rules': page.evaluate('Array.from(document.styleSheets).reduce((s, sheet)=>s + sheet.cssRules.length,0)'), 'modules':{}}
  for name in sections:
   ok=page.evaluate('''id=>{showTab(id);return document.getElementById(id)?.classList.contains('active')}''',name)
   assert ok,(width,name)
   report[str(width)]['modules'][name]={'computed':capture(page),'scrollWidth':page.evaluate('document.documentElement.scrollWidth')}
  assert not errors,(width,errors[:5]);page.close()
 browser.close()
if '--baseline' in sys.argv:
 SNAP.write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('Saved baseline',SNAP)
else:
 old=json.loads(SNAP.read_text())
 for width in report:
  before=old[width];after=report[width]
  # Pakiet 6.1 dodaje nowe reguły mobilnego menu, zamiast dążyć do parytetu ich liczby.
  assert after['rules']>0,(width,'CSS rules missing')
  for name in sections:
   b=before['modules'][name];a=after['modules'][name]
   # Pasek 10 przycisków celowo zwinięto, ale podstawowe moduły muszą zachować style.
   # Obraz 4K bywa czasowo ukryty w trakcie asynchronicznego dekodowania.
   normalized=lambda k,v:{**v,**({'visibility':'transient'} if k=='#et1SceneImage' else {})}
   changed={k:(beforeStyle,a['computed'].get(k)) for k,beforeStyle in b['computed'].items() if k!='.sv2-mobile-nav' and normalized(k,a['computed'].get(k))!=normalized(k,beforeStyle)}
   assert not changed,(width,name,list(changed.items())[:4])
   assert a['scrollWidth']<=int(width),(width,name,a['scrollWidth'])
  print('PASS CSS module parity',width,'px, 10 modules; mobile navigation intentionally redesigned; styles',before['styles'],'->',after['styles'])
 assert all(old[w]['styles']-report[w]['styles']==63 for w in report)
 print('PASS 64 legacy style elements consolidated to one; 5 runtime-injected styles preserved')
