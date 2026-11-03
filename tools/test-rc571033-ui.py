from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
DEST=ROOT/'QA-RC571033'
DEST.mkdir(exist_ok=True)
errors=[]
def check(cond,desc):
 if not cond: errors.append(desc)

def get_style(page, selector):
 return page.locator(selector).first.evaluate('''e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,overflowY:getComputedStyle(e).overflowY,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height},scroll:e.scrollHeight,client:e.clientHeight})''')

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (320,390,768,1440):
  page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
  page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
  page.evaluate("showTab('inspection12')")
  page.wait_for_timeout(100)
  sel='.et2-room-picker > label'
  label=get_style(page,sel)
  caption=get_style(page,'.psm-zoom-caption')
  output=get_style(page,'#psmSceneZoomLabel')
  zoom=get_style(page,'.psm-photo-zoom')
  check(label['color']=='rgb(66, 43, 29)',f'{width}: label is {label["color"]}')
  check(caption['color']=='rgb(67, 46, 31)',f'{width}: caption is {caption["color"]}')
  check(output['color']=='rgb(59, 41, 27)',f'{width}: zoom readout is {output["color"]}')
  check(zoom['rect']['w']<=width+1,f'{width}: zoom toolbar outside viewport')
  page.locator('[data-psm-zoom="in"]').first.click()
  page.wait_for_timeout(90)
  check(page.locator('#psmSceneZoomLabel').inner_text()!='100%',f'{width}: zoom in does not update readout')
  page.locator('[data-psm-zoom="reset"]').first.click()
  page.wait_for_timeout(90)
  check(page.locator('#psmSceneZoomLabel').inner_text()=='100%',f'{width}: zoom reset does not update readout')
  check(page.locator('#et2RoomSelect option').count()==7,f'{width}: room selector options changed')
  if width in (390,1440):
   page.locator('.psm-photo-zoom').first.screenshot(path=str(DEST/f'zoom-{width}.png'))
   page.locator('.et2-room-picker').first.screenshot(path=str(DEST/f'pomieszczenie-{width}.png'))
  page.evaluate("showTab('interview')")
  if width<900:
   page.evaluate("document.querySelector('#interview').classList.add('psm-show-chat');document.querySelector('#interview').classList.remove('psm-show-witnesses')")
  page.wait_for_timeout(100)
  toolbar=get_style(page,'.ps87-room-toolbar')
  check(toolbar['overflowY']=='visible',f'{width}: motion toolbar scrolls itself ({toolbar["overflowY"]})')
  check(toolbar['scroll']<=toolbar['client']+1,f'{width}: motion toolbar content overflows vertically ({toolbar["scroll"]}/{toolbar["client"]})')
  before=page.locator('.ps87-motion').first.get_attribute('aria-pressed')
  page.locator('.ps87-motion').first.click()
  after=page.locator('.ps87-motion').first.get_attribute('aria-pressed')
  check(before!=after,f'{width}: toggle not functional')
  if width in (390,1440):
   page.locator('.ps87-room-toolbar').first.screenshot(path=str(DEST/f'animacje-{width}.png'))
  print(width,'PASS' if not errors else 'CHECK',{'picker':label['color'],'caption':caption['color'],'zoom':output['color'],'toolbar_overflow':toolbar['overflowY'],'zoom_click':'pass','motion_toggle':'pass'})
  page.close()
 browser.close()
if errors:
 print('FAILED:',*errors,sep='\n');raise SystemExit(1)
print('RC57.10.33 UI PASSED, 4 viewport sizes × inspected contrast, layout, zoom, room navigation, animation toggle')
