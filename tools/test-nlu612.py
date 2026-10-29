import json,shutil,collections,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
q=json.loads(Path('/mnt/data/raport_test_610_vs_611/pytania_360.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844}); errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content((ROOT/'index.html').read_text(),wait_until='domcontentloaded',timeout=60000)
 results=page.evaluate('''qs=>qs.map(item=>({id:item.id,expected:item.expected,question:item.question,witness:item.witness,plan:PS611_NLU.analyze(item.question)}))''',q)
 correct=[r for r in results if r['expected'] in r['plan']['intents']];primary=[r for r in results if r['expected']==r['plan']['primary']];miss=[r for r in results if r not in correct]
 print('any',len(correct),'primary',len(primary),'unknown',sum(x['plan']['primary']=='unknown' for x in results),'errors',errs)
 for x in miss[:45]:print(x['expected'],'|',x['plan']['primary'],'|',x['question'][:100])
 (ROOT/'QA-6.12-360-INTENCJE.json').write_text(json.dumps({'total':len(q),'any':len(correct),'primary':len(primary),'errors':errs,'samples':results},ensure_ascii=False,indent=2))
 b.close()
