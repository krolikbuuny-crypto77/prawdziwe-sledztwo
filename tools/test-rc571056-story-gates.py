"""Visual story UI must not leak uncollected story threads, even through DOM."""
from pathlib import Path
import mimetypes,sys,json
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1366,'height':768})
 def route(r):
  rel=r.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0];f=(R/rel).resolve()
  if f.is_file() and f.is_relative_to(R):r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://qa.game/**',route)
 html=(R/'index.html').read_text().replace('<head>','<head><base href="https://qa.game/">',1)
 page.set_content(html,wait_until='domcontentloaded')
 page.wait_for_timeout(250)
 result=page.evaluate('''()=>{
 const refresh=()=>{showTab('evidence');showTab('overview')};
 const box=()=>document.getElementById('story26Overview');
 const saved=new Set(STATE.found);
 const requirements=STORY26_QA.threads[0].needs;
 const get=()=>({text:box().textContent,cards:box().querySelectorAll(':scope > .story26-track > .story26-case').length,canNote:box().querySelectorAll('[data-story26-note]').length>=1});
 STATE.found.clear();refresh();const empty=get();
 STATE.found.add(requirements[0]);refresh();const partial=get();
 requirements.forEach(x=>STATE.found.add(x));refresh();const complete=get();
 STATE.found.clear();saved.forEach(x=>STATE.found.add(x));refresh();
 return {empty:{noCards:empty.cards===0,hasInstruction:empty.text.includes('Nie odkryto jeszcze'),notReveal:!empty.text.includes('01:32')},
 partial:{oneCard:partial.cards===1,noSecret:!partial.text.includes('Ostrzeżenia TCMS i wstrząs')&&!partial.text.includes('Oryginał protokołu'),topicLabel:partial.text.includes('Sygnalizacja i zdarzenia techniczne'),noWitnessLeaks:!partial.text.includes('Marek · rozliczenie zmiany')},
 complete:{oneCard:complete.cards>=1,fullTitle:complete.text.includes('Awaria czy zdarzenie na stanowisku?'),fullReason:complete.text.includes('Ostrzeżenia TCMS i wstrząs'),canNote:complete.canNote},restored:STATE.found.size===saved.size};
}''')
 browser.close()
 fail=[k+'.'+sub for k,v in result.items() if isinstance(v,dict) for sub,ok in v.items() if not ok]
 if result['restored'] is False:fail.append('restored')
 print(json.dumps(result,ensure_ascii=False,indent=2));print('STORY GATES',sum(len(v) if isinstance(v,dict) else 1 for v in result.values())-len(fail),'PASS; FAIL',fail)
 if fail:sys.exit(1)
