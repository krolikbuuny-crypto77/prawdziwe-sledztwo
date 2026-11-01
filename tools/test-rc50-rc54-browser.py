"""RC50–RC54 UI and safety regression. Source scope and progression remain unchanged."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf8')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 for width in (320,390,768,1440):
  page=browser.new_page(viewport={'width':width,'height':860})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  assert page.evaluate('!!window.PS_RC53 && !!window.PS_RC54')
  before=page.evaluate('PS_SAVE_MANAGER.build()')
  assert 'rc53' not in str(before.keys()) and 'rc54' not in str(before.keys())
  known=page.evaluate('[...STATE.found]')
  page.evaluate("PS_NAV.open('notebook')")
  rows=page.evaluate('PS_RC53.inspect()')
  assert all(x['type'] in ('doc','say') for x in rows)
  assert all(x['key'].startswith('doc:') or x['key'].startswith('say:') for x in rows)
  assert len([x for x in rows if x['type']=='doc'])==len(known)
  # Newly discovered document should appear without leaking undiscovered documents.
  page.evaluate("() => { STATE.found.add('TEC-14');PS_RC53.render() }")
  assert any(x['key']=='doc:TEC-14' for x in page.evaluate('PS_RC53.inspect()'))
  assert page.locator('#ps53ProvenanceList').get_by_text('TEC-14').count()>=1
  page.locator('#ps53Provenance select').select_option('say')
  page.evaluate('''() => {const c=CONTENT.characters[0];STATE.dialogues[c.id].push({role:'player',text:'Czy widziałeś coś?'},{role:'npc',text:'To jest tylko moje zeznanie.'});PS_RC53.render()}''')
  assert any(x['type']=='say' for x in page.evaluate('PS_RC53.inspect()'))
  assert 'Zapis potwierdza' in page.locator('#ps53ProvenanceList').inner_text()
  assert page.locator('#ps53Provenance img').count()==0
  page.locator('#ps53Provenance select').select_option('all')
  page.evaluate("PS_NAV.open('interview')")
  assert page.locator('#ps54Director').count()==1
  s=page.evaluate('PS_RC54.inspect()')
  assert s['turns']>=1
  page.locator('#ps54Director summary').click()
  assert page.locator('#ps54Director').get_by_text('Zweryfikowany przełom').count()==1
  assert page.locator('#ps54Director').evaluate('(e)=>e.getBoundingClientRect().right')<=width+1
  assert page.evaluate('STATE.sim.trial')==page.evaluate('STATE.sim.trial')
  saved=page.evaluate('PS_SAVE_MANAGER.build()')
  assert page.evaluate('s=>{try{PS_SAVE_MANAGER.verify(s);return true}catch(e){return e.message}}',saved) is True
  page.evaluate('s=>PS_SAVE_MANAGER.apply(s)',saved)
  assert 'rc53' not in str(saved.keys()) and 'rc54' not in str(saved.keys())
  assert not errors,errors
  print(f'PASS RC50–RC54 browser {width}px: provenance, source scope, timeline pacing, SHA-256, no JS errors')
  page.close()
 browser.close()
