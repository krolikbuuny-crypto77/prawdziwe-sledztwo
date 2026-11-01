"""RC41 regression: discovered-only facts, labeled unverified witness mentions,
source navigation, shared snapshot restore, search, desktop/mobile overflow and XSS."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 for width in (320,390,768,1440):
  page=browser.new_page(viewport={'width':width,'height':850})
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  page.evaluate("PS_NAV.open('timeline')")
  assert page.locator('#ps41AutoTimeline').count()==1
  assert page.locator('#ps41AutoTimeline').is_visible()
  original=page.evaluate("PS_RC41_TIMELINE.inspect()")
  old_names={e['id'] for e in original if e['kind']=='document'}
  # Must not leak unknown event e17 before obtaining TEC-14.
  if 'TEC-14' not in page.evaluate("[...STATE.found]"):
   assert 'e17' not in old_names
   assert 'Impuls mechaniczny czujnika stanowiska 3' not in page.locator('#ps41List').inner_text()
  page.evaluate("""() => {STATE.found.add('TEC-14');PS_RC41_TIMELINE.refresh()}""")
  after=page.evaluate("PS_RC41_TIMELINE.inspect()")
  assert 'e17' in {x['id'] for x in after},after
  assert page.locator('.ps41-event.ps41-document').count()>=1
  # Link back to acquired document must work despite restrictive document filters.
  page.evaluate("""() => {document.getElementById('filterDocs').value='nieznany';document.getElementById('filterCategory').value=Array.from(document.getElementById('filterCategory').options).at(-1)?.value||''; }""")
  page.get_by_role('button',name='Otwórz TEC-14').first.click()
  assert page.evaluate('STATE.tab')=='evidence'
  assert page.evaluate('activeDoc')=='TEC-14'
  assert page.locator('#docPaper').inner_text().strip()
  # Witness claim is not promoted to a fact even if it quotes an inconsistent clock.
  page.evaluate("""() => {const c=CONTENT.characters[0];STATE.dialogues[c.id].push({role:'player',text:'Kiedy?'},{role:'npc',text:'O 01:55 czujnik stanowiska 3 się uruchomił. <img src=x onerror=alert(1)>'});PS_NAV.open('timeline');PS_RC41_TIMELINE.refresh();}""")
  assert page.locator('.ps41-event.ps41-witness').count()>=1
  assert 'niepotwierdzona data' in page.locator('.ps41-event.ps41-witness').first.inner_text()
  assert page.locator('.ps41-event.ps41-witness img').count()==0
  assert any(x['kind']=='witness' and x['issues'] for x in page.evaluate('PS_RC41_TIMELINE.inspect()'))
  page.locator('#ps41Filter').select_option('conflict')
  assert page.locator('.ps41-event').count()>=1
  page.locator('#ps41Filter').select_option('witness')
  page.get_by_role('button',name='Otwórz wypowiedź').first.click()
  assert page.evaluate('STATE.tab')=='interview'
  assert '01:55' in page.locator('#chatLog').inner_text()
  # Form/manual reconstruction untouched; dynamic timeline is never a separate trusted save.
  page.evaluate("PS_NAV.open('timeline')")
  before=page.evaluate('PS_SAVE_MANAGER.build()')
  assert 'rc41' not in str(before.keys())
  page.evaluate("""() => {STATE.timeline11.entries.e17={at:'2026-11-18T01:39',to:'',place:'bay3',actor:'',sourceIds:['TEC-14'],reason:'Hipoteza do weryfikacji.'};PS_RC41_TIMELINE.refresh();}""")
  assert any(x['id']=='e17' and x['issues'] for x in page.evaluate('PS_RC41_TIMELINE.inspect()'))
  # SaveManager roundtrip restores the same source-driven automatic timeline.
  saved=page.evaluate('PS_SAVE_MANAGER.build()')
  page.evaluate('save=>PS_SAVE_MANAGER.apply(save)',saved)
  page.evaluate("PS_NAV.open('timeline')")
  assert any(x['id']=='e17' for x in page.evaluate('PS_RC41_TIMELINE.inspect()'))
  assert page.locator('.ps41-auto').evaluate('(e)=>e.getBoundingClientRect().right') <= width+1
  assert not errors,errors
  print('PASS RC41 browser',width,'px: discovered-only chronology, links, testimony caveats, XSS, discrepancy, signed save roundtrip')
  page.close()
 browser.close()
