from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,sections in [(1440,900,['overview','notebook','deduction','timeline']),(390,844,['notebook','deduction'])]:
  page=b.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  page.set_content(HTML,wait_until='domcontentloaded',timeout=90000);page.evaluate("document.body.classList.remove('ps-resume-pending')");page.wait_for_timeout(800)
  for section in sections:
   page.evaluate('(tab)=>showTab(tab)',section);page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(700)
   page.screenshot(path=str(ROOT/f'PODGLAD-RC571036-{section}-{width}.png'),full_page=False)
  page.close()
 b.close()
print('Zrzuty Chromium: 6 gotowe')
