from pathlib import Path
import json,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
new=json.loads((root/'TEST-6.13/nowe_60_pytan.json').read_text())
old=json.loads((root/'WYNIKI-6.12/pytania_holdout_120.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 pg=b.new_page();pg.set_content((root/'index.html').read_text(),wait_until='domcontentloaded')
 for name,qs in [('old120',old),('new60',new)]:
  res=pg.evaluate('qs=>qs.map(x=>({expected:x.expected,question:x.question,plan:PS611_NLU.analyze(x.question)}))',qs)
  print(name,'any',sum(x['expected'] in x['plan']['intents'] for x in res),'primary',sum(x['expected']==x['plan']['primary'] for x in res),'unknown',sum(x['plan']['primary']=='unknown' for x in res))
  if name=='new60':
   for x in res:
    if x['expected'] not in x['plan']['intents']:print(x['expected'],'>>',x['plan']['primary'],x['question'])
 b.close()
