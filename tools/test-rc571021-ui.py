from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
result=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for width in (390,1440):
  page=browser.new_page(viewport={'width':width,'height':920},reduced_motion='reduce')
  errs=[]; page.on('pageerror',lambda err:errs.append(str(err)))
  page.route('**/assets/portraits/*.webp',lambda route:route.fulfill(path=R/'assets'/'portraits'/route.request.url.rsplit('/',1)[-1],content_type='image/webp'))
  page.set_content((R/'index.html').read_text().replace('<head>','<head><base href="https://preview.local/">',1),wait_until='domcontentloaded',timeout=45000)
  page.wait_for_timeout(1000)
  page.evaluate("showTab('interview'); STATE.activeChar='MAREK'; renderChat();")
  if width<=740 and page.locator('#psm-tab-chat').count():page.locator('#psm-tab-chat').click()
  page.wait_for_timeout(350)
  val=page.evaluate('''()=>{const a=id=>document.getElementById(id);const r=id=>{const e=a(id);if(!e)return null;const x=e.getBoundingClientRect();return [Math.round(x.left),Math.round(x.top),Math.round(x.width),Math.round(x.height)];};return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,chat:r('chatLog'),input:r('chatInput'),send:r('chatSend'),list:r('characterList'),photo:r('witnessStage'),selector:r('attachedDoc'),tools:document.querySelector('.ps21-tools')?.getBoundingClientRect().width,oneInput:document.querySelectorAll('#chatInput').length,oneSend:document.querySelectorAll('#chatSend').length,visible:!!a('chatInput')?.offsetParent};}''')
  page.screenshot(path=str(R/f'QA-RC571021-{width}.png'),full_page=True,animations='disabled')
  print('VIEW',width,val,'errors',errs[:3],flush=True)
  assert val['scrollWidth']<=width+2,val
  assert val['oneInput']==1 and val['oneSend']==1,val
  assert val['photo'] and val['chat'] and val['input'] and val['send'],val
  assert not errs,errs[:3]
  result.append(val)
  page.close()
 browser.close()
(R/'QA-RC571021-ui.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
