from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf8')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 for width in [390,1280]:
  page=browser.new_page(viewport={'width':width,'height':850},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  board=page.locator('#ps38Board')
  assert board.count()==1
  page.evaluate('''() => {for(const d of CONTENT.documents.slice(0,4))STATE.found.add(d.id);PS_NAV.open('notebook');}''')
  opts=page.locator('#ps38Board select[aria-label="Pierwszy dokument"] option')
  values=page.evaluate('''()=>[...document.querySelectorAll('#ps38Board select[aria-label="Pierwszy dokument"] option')].map(x=>x.value).filter(Boolean)''')
  assert len(values)>=2,values
  page.locator('#ps38Board select[aria-label="Pierwszy dokument"]').select_option(values[0])
  page.locator('#ps38Board select[aria-label="Drugi dokument"]').select_option(values[1])
  page.locator('#ps38Board select[aria-label="Rodzaj powiązania"]').select_option('conflict')
  page.locator('#ps38Board textarea').fill('Hipoteza gracza, nie dowód ani fakt.')
  page.locator('#ps38Board button[type=submit]').click()
  assert 'SPRZECZNOŚĆ DO WERYFIKACJI' in board.inner_text()
  saved=page.evaluate('''()=>PS_SAVE_MANAGER.build()''')
  assert len(saved['rc38Board'])==1
  page.locator('#ps38Board .ps38-connection button').click()
  assert page.evaluate('PS_RC38_BOARD.inspect().length')==0
  page.evaluate('''save=>PS_SAVE_MANAGER.apply(save)''',saved)
  assert page.evaluate('PS_RC38_BOARD.inspect().length')==1
  page.evaluate("PS_NAV.open('final')")
  assert page.locator('#ps40Epilogue').is_hidden()
  page.evaluate("()=>{STATE.sim.trial={kind:'returned'};PS_RC40_FINALE.render()}")
  assert page.locator('#ps40Epilogue').is_visible()
  page.evaluate("() => { const original=URL.createObjectURL.bind(URL); URL.createObjectURL=(blob)=>{window.__rc40ExportType=blob.type;return original(blob)}; }")
  page.evaluate("document.querySelector('#ps40Epilogue button').dispatchEvent(new MouseEvent('click',{bubbles:false}))")
  assert (page.evaluate('window.__rc40ExportType') or '').startswith('text/plain'),page.evaluate('window.__rc40ExportType')
  assert not errors,errors
  assert not errors,errors
  print('PASS RC40 stages browser',width,'px: board source selection, user-marked contradiction, checksum save roundtrip, locked/unlocked retrospective, TXT export')
  page.close()
 browser.close()
