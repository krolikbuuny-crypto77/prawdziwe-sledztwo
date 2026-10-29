"""Optional browser smoke test. Requires Python + playwright + Chromium.

Run: python tools/smoke.py
No network or AI keys needed; set_content executes bundled scripts in Chromium.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf-8')
sections=('overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final')
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True, executable_path=shutil.which('chromium') or shutil.which('google-chrome') or None, args=['--no-sandbox'])
  for width in (320,390,768,1440):
    page=browser.new_page(viewport={'width':width,'height':900})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.set_content(html,wait_until='domcontentloaded',timeout=60000)
    for section in sections:
      result=page.evaluate("""id => { showTab(id); return {active:document.getElementById(id)?.classList.contains('active'), width:document.documentElement.scrollWidth}; }""",section)
      assert result['active'], f'Module {section} unavailable at {width}px'
      assert result['width']<=width, f'Horizontal overflow in {section} at {width}px'
    assert not errors, f'JS errors at {width}px: {errors[:2]}'
    print(f'PASS {width}px: 10 modules, no overflow or JS errors')
    page.close()
  browser.close()
