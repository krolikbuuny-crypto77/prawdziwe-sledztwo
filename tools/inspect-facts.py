import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
p='/mnt/data/ps_package_612/index.html'
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 pg=b.new_page();pg.set_content(Path(p).read_text(),wait_until='domcontentloaded')
 x=pg.evaluate('''() => Object.fromEntries(CONTENT.characters.map(c=>[c.id,{F:NPC94_FACTS[c.id],D:NPC9_CUSTOM[c.id]}]))''')
 for id,y in x.items():
  print(id)
  for k,v in y['F'].items():print('F',k,str(v)[:150])
  for k,v in y['D'].items():print('D',k,str(v)[:150])
 b.close()
