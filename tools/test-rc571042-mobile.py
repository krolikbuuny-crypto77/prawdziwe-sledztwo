from pathlib import Path
from playwright.sync_api import sync_playwright
import mimetypes,json,sys
root=Path(__file__).resolve().parents[1]
h=(root/'index.html').read_text().replace('<head>','<head><base href="https://game.test/">',1)
QA=root/'QA-RC571042';QA.mkdir(exist_ok=True)
checks=0;fails=[];measure=[]
def verify(cond,msg):
 global checks
 checks+=1
 if not cond:fails.append(msg)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(320,700),(390,844),(390,560),(768,1024),(1440,900)]:
  pg=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
  js_errors=[]
  pg.on('pageerror',lambda e:js_errors.append(str(e)))
  def route(r):
   path=(root/r.request.url.split('game.test/')[-1].split('?')[0].split('#')[0]).resolve()
   if path.is_file() and path.is_relative_to(root):r.fulfill(status=200,body=path.read_bytes(),content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream')
   else:r.fulfill(status=404,body=b'not found')
  pg.route('https://game.test/**',route)
  pg.set_content(h,wait_until='domcontentloaded',timeout=60000)
  pg.wait_for_timeout(500)
  pg.evaluate("document.body.classList.remove('ps-resume-pending');showTab('interview')")
  mobile=width<900 and width<=768
  info=pg.evaluate('''()=>{const e=document.querySelector('#characterList'),r=e.getBoundingClientRect(),d=document.querySelector('.ps42-confrontation-wrap');return {listWidth:r.width,listHeight:r.height,scrollW:e.scrollWidth,cols:getComputedStyle(e).gridTemplateColumns,display:getComputedStyle(e).display,overflowY:getComputedStyle(e).overflowY,firstW:e.querySelector('.character')?.getBoundingClientRect().width,advanced:getComputedStyle(d).display,advancedOpen:d.open,scrollWDoc:document.documentElement.scrollWidth,portrait:document.querySelector('#interview').classList.contains('psm-portrait-open')}}''')
  verify(not js_errors,f'{width}: JS errors {js_errors}')
  verify(info['scrollWDoc']<=width+1,f'{width}: document horizontal overflow {info["scrollWDoc"]}')
  if mobile:
   verify(info['display']=='flex',f'{width}: list not flex {info["display"]}')
   verify(info['scrollW']<=info['listWidth']+3,f'{width}: list horizontal scroll {info}')
   verify(info['firstW']>=info['listWidth']-35,f'{width}: first card cropped {info}')
   verify(info['listHeight']>=200,f'{width}: list collapsed {info}')
   verify(info['advanced']=='none',f'{width}: advanced visible while selecting witness')
   verify(not info['portrait'],f'{width}: initial portrait expanded')
   pg.locator('#characterList .character').nth(1).click()
   pg.wait_for_timeout(120)
   state=pg.evaluate('''()=>({chat:document.querySelector('#interview').classList.contains('psm-show-chat'),form:document.querySelector('#chatInput').getBoundingClientRect().width,action:document.querySelector('#chatSend').getBoundingClientRect().width,advanced:document.querySelector('.ps42-confrontation-wrap').open})''')
   verify(state['chat'],f'{width}: witness selection did not open chat')
   verify(state['form']>120 and state['action']>60,f'{width}: question/action missing {state}')
   verify(not state['advanced'],f'{width}: advanced not collapsed initially')
   pg.locator('.ps42-confrontation-wrap summary').click()
   verify(pg.locator('.ps42-confrontation-wrap').evaluate('(e)=>e.open'),f'{width}: advanced not expandable')
   # ensure the evidence rules still govern the button state
   verify(pg.locator('#ps43Confrontation button').count()==1,f'{width}: advanced button missing')
  else:
   verify(info['advanced']=='contents' and info['advancedOpen'],f'{width}: desktop advanced hidden {info}')
  measure.append({'size':f'{width}x{height}','state':info})
  if width in (390,1440):
   pg.evaluate("showTab('interview')")
   if width==390:
    pg.evaluate("window.PS_MOBILE_WORKSPACES.setInterviewView('witnesses')")
   pg.screenshot(path=str(QA/f'INTERVIEW-WITNESSES-{width}.png'),full_page=False)
   if width==390:
    pg.evaluate("window.PS_MOBILE_WORKSPACES.setInterviewView('chat')")
    pg.screenshot(path=str(QA/f'INTERVIEW-CHAT-{width}.png'),full_page=False)
  pg.close()
 browser.close()
(QA/'results.json').write_text(json.dumps({'checks':checks,'passed':checks-len(fails),'failures':fails,'viewports':measure},ensure_ascii=False,indent=2))
print('RESULT',checks-len(fails),'/',checks)
for a in fails:print('FAIL',a)
if fails:sys.exit(1)
