"""Real Chromium interactions at 4 breakpoints; *not* a complete human-like 580-click playthrough.
The full sequence is checked separately by the server-domain RC57.4 simulation.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text('utf-8')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 for width in [390,1440]:
  c=browser.new_context(viewport={'width':width,'height':850})
  page=c.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='domcontentloaded')
  assert page.evaluate('STATE.found.size')==13
  for tab in ['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']:
   if width<1000:page.locator('#ps61MenuButton').click()
   page.locator(f'.sv2-mobile-nav [data-sv2-tab="{tab}"]' if width<1000 else f'#nav [data-tab="{tab}"]').click()
   assert page.evaluate('STATE.tab')==tab
  assert page.locator('#final').get_attribute('data-ps-f1-phase')=='0'
  assert page.evaluate('STATE.found.size')==13
  assert not errors,errors
  c.close()
  print('PASS Chromium',width,'px: 10 real UI clicks, 13 starting docs, finale gated, no JS exceptions')
 browser.close()
