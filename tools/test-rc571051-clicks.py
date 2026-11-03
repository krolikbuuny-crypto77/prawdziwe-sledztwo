from pathlib import Path
import mimetypes
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
HTML=(R/'index.html').read_text('utf8').replace('<head>','<head><base href="https://game.test/">',1)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1366,'height':768})
 def route(r):
  rel=r.request.url.split('game.test/',1)[-1].split('?',1)[0]
  file=(R/rel).resolve()
  if file.is_relative_to(R) and file.is_file():r.fulfill(status=200,body=file.read_bytes(),content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
  else:r.fulfill(status=404)
 page.route('https://game.test/**',route)
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 page.locator('#nav button[data-tab="interview"]').click(timeout=10000)
 assert page.locator('#interview').evaluate('(e)=>!e.hidden && getComputedStyle(e).display!=="none"'), 'interview not displayed'
 cards=page.locator('#characterList .character');assert cards.count()==6
 cards.nth(4).click(timeout=10000)
 assert cards.nth(4).evaluate('(e)=>e.classList.contains("active")'), 'witness not selected'
 page.locator('#nav button[data-tab="evidence"]').click(timeout=10000)
 assert page.locator('#evidence').evaluate('(e)=>!e.hidden && getComputedStyle(e).display!=="none"'), 'evidence not displayed'
 print('PASS: navigation clicks + six witness cards + witness selection')
 b.close()
