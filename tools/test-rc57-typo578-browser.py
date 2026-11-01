"""Chromium confirms player question interpretation with misspellings; no external API."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
html=(Path(__file__).parent.parent/'index.html').read_text(encoding='utf8')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
 for width in [390,1440]:
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  results=page.evaluate("""() => ({
   typo:PS633_INTENT.analyzeQuestion('Gdze byles po polnocy?').primary,
   negated:PS633_INTENT.analyzeQuestion('Nei pytam o Lenę, tylko gdze byłeś po północy?').slots.negatedCorrection,
   loc:PS633_INTENT.analyzeQuestion('Nei pytam o Lenę, tylko gdze byłeś po północy?').primary,
   rawDocument:PS633_INTENT.foldQuestion('Pokaż TEC-04 o 01:35')
  })""")
  assert results['typo']=='self_alibi',results
  assert results['negated'] and results['loc']=='self_alibi',results
  assert 'tec-04' in results['rawDocument'] and '01:35' in results['rawDocument'],results
  assert not errors,errors[:4]
  print('PASS RC57.8 Chromium:',width,'px, typo intent, negation, evidence IDs, no page errors')
  page.close()
 browser.close()
