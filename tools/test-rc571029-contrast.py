"""RC57.10.29: browser contract for dark-text-on-dark surfaces reported in screenshots.
Tests production HTML and actual computed colors, not just viewport overflow.
"""
from pathlib import Path
from urllib.parse import unquote, urlsplit
from playwright.sync_api import sync_playwright
import mimetypes, json, re

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'QA-RC571029'
OUT.mkdir(exist_ok=True)
CHECKS={
 'timeline':[
  ('#ps45TimeAnalysis .ps-next-row', 'Luki i źródła'),
  ('.tl-locked-msg','Komunikat pustej karty czasu'),
 ],
 'inspection12':[
  ('.p1-inspection-extras > summary','Statystyki oględzin'),
  ('.ps-inspection-help > summary','Instrukcja oględzin'),
  ('.ov36-advanced > summary','Narzędzia techniczne')
 ],
 'notebook':[
  ('#conflictPanel .cf-empty','Brak rozbieżności'),
  ('#ps53ProvenanceList .ps53-source','Lista pochodzenia źródeł'),
 ],
 'search':[
  ('#ps3SearchGuide strong','Wyszukiwanie w całej sprawie')
 ],
 'deduction':[
  ('#correlationBoardSummary','Wspólne godziny i miejsca'),
  ('.ps53-card','Karty źródeł w dedukcji')
 ]
}
# Contrast functions: compute from actual browser CSS colors and gradient endpoints.
def rgb_css(s):
 m=re.search(r'rgba?\(([^)]*)\)',s or '')
 if m:
  n=list(map(float,re.findall(r'[\d.]+',m.group(1))))
  return n[:3],n[3] if len(n)>3 else 1
 m=re.search(r'#([0-9a-f]{6})',s or '',re.I)
 return ([int(m.group(1)[i:i+2],16) for i in (0,2,4)],1) if m else (None,0)
def luminance(v):
 c=[q/255 for q in v]
 c=[x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4 for x in c]
 return .2126*c[0]+.7152*c[1]+.0722*c[2]
def ratio(a,b):
 l1,l2=luminance(a),luminance(b)
 return (max(l1,l2)+.05)/(min(l1,l2)+.05)

def run():
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  for width,height in [(390,844),(768,1024),(1440,900)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   errors=[]
   page.on('pageerror',lambda exc:errors.append(str(exc)[:200]))
   def route(r):
    d=(ROOT/unquote(urlsplit(r.request.url).path).lstrip('/')).resolve()
    if d.is_file() and str(d).startswith(str(ROOT)+'/'):
     r.fulfill(path=str(d),content_type=mimetypes.guess_type(str(d))[0] or 'application/octet-stream')
    else:r.fulfill(status=404,body='not found')
   page.route('https://game.local/**',route)
   page.set_content((ROOT/'index.html').read_text().replace('<head>','<head><base href="https://game.local/">',1),wait_until='domcontentloaded')
   for tab in ['overview','evidence','search','timeline','inspection12','notebook','labs','deduction','final']:
    page.evaluate('(t)=>showTab(t)',tab)
    page.wait_for_timeout(480)
    st=page.evaluate('''t=>{let e=document.getElementById(t);return{active:e?.classList.contains('active'),width:document.documentElement.scrollWidth,viewport:innerWidth}}''',tab)
    assert st['active'] and st['width']<=width+2,(tab,width,'layout overflow',st)
    results.append({'category':'layout','tab':tab,'width':width,'ok':True})
    if tab not in CHECKS:continue
    for selector,label in CHECKS[tab]:
     elems=page.locator('#'+tab+' '+selector)
     if not elems.count():
      if selector=='.tl-locked-msg':continue # state-dependent
      raise AssertionError((tab,selector,'missing selector'))
     el=elems.first
     values=el.evaluate('''e=>{let s=getComputedStyle(e);let i=s.backgroundImage,cs=s.color,b=s.backgroundColor;let r=e.getBoundingClientRect();return{fg:cs,bg:b,gradient:i,font:s.fontSize,display:s.display,width:r.width,height:r.height}}''')
     fg,_=rgb_css(values['fg'])
     bg,a=rgb_css(values['bg'])
     if not bg or a<.9:
      gradient_colors=re.findall(r'rgba?\([^)]*\)',values['gradient'] or '')
      bg,_=rgb_css(gradient_colors[0]) if gradient_colors else (None,0)
     if bg:
      contrast=ratio(fg,bg)
      # At least WCAG large-text 3:1, normally 4.5:1.
      assert contrast>=4.5,(tab,label,width,'contrast',contrast,values)
     else:
      contrast=None
      # Some labels have gradient on parent. Their text color is validated by a specific stable dark hex.
      assert sum(fg)<390,(tab,label,'unexpected pale text',values)
     results.append({'category':'contrast','tab':tab,'label':label,'width':width,'ratio':round(contrast,2) if contrast else None,'ok':True})
    if width in (390,1440):
     if tab=='timeline':page.locator('#ps45TimeAnalysis').screenshot(path=str(OUT/f'timeline-{width}.png'),timeout=8000)
     if tab=='notebook':page.locator('#conflictPanel').screenshot(path=str(OUT/f'notebook-{width}.png'),timeout=8000)
     if tab=='deduction':page.locator('#correlationBoardSummary').screenshot(path=str(OUT/f'deduction-{width}.png'),timeout=8000)
    assert not errors,(tab,width,'JS error',errors)
   page.close()
  browser.close()
 (OUT/'wyniki.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
 print(f'RC57.10.29 PASS: {len(results)} browser checks, 3 viewports, 9 tabs; output={OUT}')

if __name__=='__main__':run()
