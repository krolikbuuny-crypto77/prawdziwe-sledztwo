"""RC57.10.37 — test wysokości, deduplikacji i dostępnych CTA.
Wyłącznie lokalny Chromium. Brak zapytań do AI i Supabase.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data/rc57_10_37_polish')
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
SIZES=[(320,700),(390,844),(390,560),(768,1024),(1024,768),(1280,800),(1440,900),(1920,1080)]
checks=0; failures=[]; details=[]
def ok(test,msg):
 global checks
 checks+=1
 if not test:failures.append(msg)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in SIZES:
  page=browser.new_page(viewport={'width':width,'height':height}, reduced_motion='reduce')
  page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_timeout(450)
  page.evaluate("document.body.classList.remove('ps-resume-pending')")
  for tab in TABS:
   page.evaluate('(id)=>showTab(id)',tab)
   data=page.evaluate('''() => {const s=document.querySelector('.section.active');const r=s.getBoundingClientRect();return {
    id:s.id,fullW:document.documentElement.scrollWidth,vw:innerWidth,rleft:r.left,rright:r.right,
    font:parseFloat(getComputedStyle(s).fontSize),
    hasButtons:s.querySelectorAll('button').length
    };}''')
   ok(data['id']==tab,f'{width}x{height} unexpected tab {tab}')
   ok(data['fullW']<=width+1,f'{width}x{height} horizontal overflow {tab}: {data["fullW"]}')
   ok(data['rleft']>=-1 and data['rright']<=width+1,f'{width}x{height} section overflow {tab}')
   ok(data['font']>=14.5,f'{width}x{height} too small module font {tab} {data["font"]}')
  page.evaluate("showTab('deduction')")
  deduction=page.evaluate('''() => {
    const e=id=>document.getElementById(id);
    const hidden=e('ux4TopNav'); const guide=e('ux4Guide');const row=guide.querySelector('.ux4-steps');
    const rect=e('dedTitle').getBoundingClientRect();const sec=e('deduction').getBoundingClientRect();
    const styles=el=>getComputedStyle(el);
    return {topNavHidden:styles(hidden).display==='none',guideTitleHidden:styles(guide.querySelector('.ux4-guide-title>div')).display==='none',
       bottomNavButtons:e('ux4BottomNav').querySelectorAll('button').length,steps:row.querySelectorAll('button').length,
       inputVisible:rect.width>50,inputInside:rect.left>=sec.left-1&&rect.right<=sec.right+1,
       stepRows:Math.round(row.getBoundingClientRect().height),
       firstButtonColor:styles(row.querySelector('button')).color};
    }''')
  for key in ['topNavHidden','guideTitleHidden','inputVisible','inputInside']:
   ok(deduction[key],f'{width}x{height} deduction {key}')
  ok(deduction['bottomNavButtons']>=2,f'{width}x{height} deduction nav missing')
  ok(deduction['steps']==3,f'{width}x{height} deduction steps missing')
  if width<=390:ok(deduction['stepRows']<130,f'{width}x{height} deduction mobile steps too tall {deduction["stepRows"]}')
  page.evaluate("showTab('notebook')")
  nav=page.evaluate('''() => {const n=document.querySelector('#notebook .ps36-section-index');
   const r=n.getBoundingClientRect();return {height:r.height,buttons:n.querySelectorAll('button').length,
       display:getComputedStyle(n).display,offscreen:r.right>innerWidth+1};}''')
  ok(nav['buttons']>=2,f'{width}x{height} notebook navigation missing')
  ok(not nav['offscreen'],f'{width}x{height} notebook navigation overflow')
  if width<=390:ok(nav['height']<98,f'{width}x{height} notebook nav too tall {nav["height"]}')
  if width in (390,1440):
   for tab in ['deduction','notebook','overview']:
    page.evaluate('(tab)=>showTab(tab)',tab)
    page.screenshot(path=str(OUT/f'PODGLAD-RC571037-{tab}-{width}.png'),full_page=False)
  details.append({'viewport':f'{width}x{height}','deduction':deduction,'notebookNav':nav})
  page.close()
 browser.close()
report={'release':'RC57.10.37','checks':checks,'passed':checks-len(failures),'failures':failures,'viewports':details,'limitations':'Local Chromium, without live AI, Supabase or physical mobile keyboard.'}
(OUT/'RAPORT-KONTROLI-WIDOKOW.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(f'RC57.10.37: {checks-len(failures)}/{checks} PASS')
for f in failures[:25]:print('FAIL',f)
if failures:raise SystemExit(1)
