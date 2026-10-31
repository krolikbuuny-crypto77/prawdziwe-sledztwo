from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 for width,height in [(1440,900),(1280,720),(1024,768),(768,900),(390,844),(320,700)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  stage=page.evaluate('''() => {
    const tools=document.getElementById('ps76Tools'),fab=document.getElementById('psFab'),mentor=document.getElementById('seniorFab');
    const a=mentor?.getBoundingClientRect().toJSON(),b=fab?.getBoundingClientRect().toJSON();
    return {parent:mentor?.parentNode?.id,progressParent:fab?.parentNode?.id,mentorPosition:getComputedStyle(mentor).position,progressPosition:getComputedStyle(fab).position,mentor:a,progress:b,sidebar:document.getElementById('ui14Sidebar').getBoundingClientRect().toJSON(),pageWidth:document.documentElement.scrollWidth};
  }''')
  assert stage['parent']=='ps76Tools',stage
  assert stage['progressParent']=='ps76Tools',stage
  assert stage['mentorPosition']=='static' and stage['progressPosition']=='static',stage
  assert stage['pageWidth']<=width,stage
  if width>1000:
   assert stage['mentor']['bottom']<=height+1,stage
   assert stage['progress']['bottom']<=height+1,stage
   page.locator('#seniorFab').click()
  else:
   # On small screens guidance appears inline after the shared-game controls.
   assert page.locator('#seniorFab').is_visible(),stage
   assert page.locator('#ps76Tools').evaluate('(e)=>e.parentElement.classList.contains("main")'),stage
   page.locator('#seniorFab').click()
  assert page.locator('#seniorPanel').is_visible(),(width,'mentor cannot open')
  page.locator('#seniorClose').click()
  assert not page.locator('#seniorPanel').is_visible(),width
  assert not errors,(width,errors[:4]);print('PASS mentor/no overlay',width,height)
  if width in (1440,390):page.screenshot(path=f'/mnt/data/rc353_layout_{width}.png')
  page.close()
 browser.close()
