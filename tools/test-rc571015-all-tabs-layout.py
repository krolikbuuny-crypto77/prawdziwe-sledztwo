"""Every existing tab retains its controls and does not force horizontal viewport overflow."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in (390,768,1440,1920):
   page=await browser.new_page(viewport={'width':width,'height':900})
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   await page.set_content(HTML,wait_until='domcontentloaded')
   for tab in TABS:
    await page.evaluate('(tab)=>showTab(tab)',tab)
    await page.wait_for_timeout(35)
    over=await page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth')
    if over>2:
     raise AssertionError(f'{tab} at {width}px: horizontal overflow {over}px')
   assert not errors,errors[:3]
   print('PASS',width,'10/10 tabs; no document horizontal overflow')
   await page.close()
  await browser.close()
asyncio.run(main())
