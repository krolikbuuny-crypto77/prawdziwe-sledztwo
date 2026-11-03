"""CSS-only regression: actual browser computed contrast in reported scenes.
No production data or mechanics altered; injected previous-session banner is test-only."""
from pathlib import Path
from urllib.parse import unquote,urlsplit
from playwright.sync_api import sync_playwright
import mimetypes,re,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'QA-RC571032'
OUT.mkdir(exist_ok=True)
HTML=(ROOT/'index.html').read_text().replace('<head>','<head><base href="https://game.local/">',1)

def rgb(x):
 m=re.search(r'rgba?\(([0-9.,\s]+)\)',x or '')
 return tuple(map(float,m.group(1).split(',')[:3])) if m else None

def luminance(c):
 x=[v/255 for v in c];x=[q/12.92 if q<=.04045 else ((q+.055)/1.055)**2.4 for q in x]
 return .2126*x[0]+.7152*x[1]+.0722*x[2]
def contrast(a,b):
 u,v=luminance(a),luminance(b)
 return (max(u,v)+.05)/(min(u,v)+.05)

results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(320,720),(390,844),(768,1024),(1440,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  err=[]
  page.on('pageerror',lambda e:err.append(str(e)[:400]))
  def local(r):
   dest=(ROOT/unquote(urlsplit(r.request.url).path).lstrip('/')).resolve()
   if dest.is_file() and dest.is_relative_to(ROOT):r.fulfill(path=str(dest),content_type=mimetypes.guess_type(str(dest))[0] or 'application/octet-stream')
   else:r.fulfill(status=404,body='Not found')
  page.route('https://game.local/**',local)
  page.set_content(HTML,wait_until='domcontentloaded')
  page.evaluate("showTab('overview')")
  page.evaluate('''()=>{let el=document.createElement('div');el.id='psResumeOffer';el.className='surface padded ps-resume-offer';el.innerHTML='<strong>Znaleziono zapis poprzedniej sesji</strong><p class="small muted">Nowa gra rozpoczyna się od zera. Poprzednią sesję możesz świadomie wznowić lub odrzucić.</p><div class="formline"><button class="btn">Kontynuuj śledztwo</button><button class="btn alt">Nowe śledztwo</button></div>';document.getElementById('overview').prepend(el)}''')
  cases=[('overview','#psResumeOffer > strong',(250,233,204),'tytuł wznowienia'),('overview','#psResumeOffer p',(250,233,204),'tekst wznowienia')]
  for tab,sel,bg,label in cases:
   el=page.locator(sel)
   color=el.evaluate('e=>getComputedStyle(e).color');ratio=contrast(rgb(color),bg)
   assert ratio>=4.5,(width,label,ratio,color)
   results.append(dict(width=width,element=label,ratio=round(ratio,2)))
  if width in (390,1440): page.locator('#psResumeOffer').screenshot(path=str(OUT/f'wznowienie-{width}.png'))
  page.locator('#psResumeOffer').evaluate('e=>e.remove()')
  page.evaluate("showTab('inspection12')")
  el=page.locator('#ciFocusCard .ci-focus-observation')
  assert el.count(),('missing inspection focus',width)
  color=el.evaluate('e=>getComputedStyle(e).color')
  ratio=contrast(rgb(color),(246,228,197))
  assert ratio>=4.5,('inspection',width,ratio,color)
  results.append(dict(width=width,element='opis oględzin',ratio=round(ratio,2)))
  if width in (390,1440):page.locator('#ciFocusCard').screenshot(path=str(OUT/f'ogledziny-{width}.png'))
  nav=page.locator('#inspection12 .sv2-subnav button').first
  assert nav.count(),('module nav missing',width)
  navcolor=nav.evaluate('e=>getComputedStyle(e).color')
  navratio=contrast(rgb(navcolor),(249,232,204))
  assert navratio>=4.5,('nav',width,navratio,navcolor)
  results.append(dict(width=width,element='skróty modułu',ratio=round(navratio,2)))
  if width==1440:page.locator('#inspection12 .sv2-subnav').screenshot(path=str(OUT/'skroty-1440.png'))
  page.evaluate("showTab('deduction')")
  for sel in ['#dedTitle','#dedKind','#dedStatement']:
   l=page.locator(f'label[for="{sel[1:]}"]')
   assert l.count(),('missing label',sel)
   color=l.evaluate('e=>getComputedStyle(e).color')
   ratio=contrast(rgb(color),(249,232,202))
   assert ratio>=4.5,(width,sel,ratio,color)
   results.append(dict(width=width,element=sel+' label',ratio=round(ratio,2)))
  if width in (390,1440):page.locator('#deduction .dd-editor-panel').screenshot(path=str(OUT/f'dedukcja-{width}.png'))
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'),('overflow',width)
  assert not err,('JS errors',width,err[:3])
  print('PASS',width,'contrast+layout')
  page.close()
 browser.close()
(OUT/'wyniki.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('PASS',len(results),'computed contrast checks')
