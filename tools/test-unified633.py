"""Server-browser parity and fail-closed topic routing; no production I/O."""
import json, pathlib, subprocess, shutil
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parent.parent
cases=[
 ('Gdzie byłeś między 01:30 a 02:05? Nie pytam o ostatnie spotkanie z Leną.','self_alibi',1),
 ('Nie pytam, kiedy ostatni raz widziałeś Lenę. Gdzie byłeś w nocy?','self_alibi',1),
 ('Nie pytam o Lenę, tylko o moje alibi.','self_alibi',1),
 ('Nie pytam, kiedy ostatnio widziałeś Lenę, tylko kto zgłosił alarm?','alarm_report',1),
 ('Kto zgłosił znalezienie Leny i o której godzinie?','alarm_report',1),
 ('Gdzie byłeś i kto zgłosił alarm?','self_alibi',2),
 ('Dlaczego brakuje wpisu w dokumentacji warsztatu?','workshop_missing_entry',1),
 ('Czy zgłoszenie BHP zostało wysłane?','bhp_sent',1),
 ('Czy nie wysłałaś zgłoszenia BHP?','bhp_sent',1),
 ('Co dokładnie potwierdza autoryzację?','test_authorization',1),
 ('Jak sprawdzić autoryzację testu?','test_authorization',1),
 ('Kiedy ostatnio widziałeś Lenę żywą?','last_contact',1),
 ('Gdzie była Lena?','last_contact',1),
 ('Skąd to wiesz?','knowledge_source',1),
 ('Co sam widziałeś?','direct_observation',1),
 ('Czy przyznajesz się do fałszowania autoryzacji?','direct_accusation',1),
 ('Kto zabił Lenę i dlaczego brakuje wpisu w zleceniu?','person',2),
 ('Czy zataiłaś zgłoszenie BHP i wysłałaś je?','bhp_sent',1),
 ('Co potwierdza T-17 i kto mógł użyć karty?','clarification',2),
 ('Nie pytam o T-17. Jak sprawdzić autoryzację testu?','test_authorization',1),
 ('Nie pytam o BHP. Gdzie byłeś między 01:30 a 02:05?','self_alibi',1),
]
questions=[c[0] for c in cases]
js='''import{analyzeQuestion}from './lib/question-intent-633.js';
let qs=JSON.parse(process.argv[1]);console.log(JSON.stringify(qs.map(q=>analyzeQuestion(q))));'''
node=subprocess.run(['node','--input-type=module','-e',js,json.dumps(questions,ensure_ascii=False)],cwd=root,text=True,capture_output=True,check=True)
server=json.loads(node.stdout)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 errs=[]
 page.on('pageerror',lambda error:errs.append(str(error)))
 page.set_content((root/'index.html').read_text(encoding='utf8'),timeout=120000,wait_until='domcontentloaded')
 client=page.evaluate('(questions)=>questions.map(q=>PS633_INTENT.analyzeQuestion(q))',questions)
 assert client==server,'Server and browser parser differ!'
 for (q,expected,n),plan in zip(cases,server):
  assert plan['primary']==expected,(q,plan['primary'],expected)
  assert len(plan['parts'])==n,(q,plan['parts'],n)
  assert plan['version']=='6.33'
 for idx in [0,1,2,3]:
  assert 'len' not in server[idx]['positiveQuestion'] or 'alarm' in server[idx]['positiveQuestion'],server[idx]
 for idx in [15,16,17]:assert server[idx]['sensitive'],(cases[idx],server[idx])
 assert page.evaluate("PS_WITNESS_ENGINE.inspect().layers.answer.at(-1)")== '85-unified-question-routing-633'
 layers=page.evaluate('PS_WITNESS_ENGINE.inspect().layers.answer')
 assert not any(x.startswith(('71-','72-','73-','83-','84-')) for x in layers),layers
 assert not errs,errs
 print(f'PASS unified 6.33: {len(cases)} cases; server/browser identical; exclusions, compounds, protected topics; active answer layers',len(layers))
 browser.close()
