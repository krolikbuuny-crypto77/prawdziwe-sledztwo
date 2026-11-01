from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 for width in (320,390,768,1440):
  page=browser.new_page(viewport={'width':width,'height':860});errors=[]
  page.on('pageerror',lambda error: errors.append(str(error)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  assert page.evaluate('typeof PS_RC42')=='object'
  page.evaluate('PS_NAV.open("interview")')
  assert page.locator('#ps42Memory').count()==1
  assert page.locator('#ps43Confrontation').count()==1
  assert page.locator('#ps47Psychology').count()==1
  page.evaluate('''() => {
    const a=CONTENT.characters[0],b=CONTENT.characters[1];
    STATE.activeChar=a.id;
    STATE.dialogues[a.id].push({role:'player',text:'Gdzie byłeś podczas zmiany?'},{role:'npc',text:'Nie pamiętam dokładnej minuty.'});
    STATE.dialogues[b.id].push({role:'player',text:'Gdzie byłeś?'},{role:'npc',text:'Zgłaszałem wcześniej niejasność w aktach <img src=x onerror=alert(1)>.'});
    renderChat();PS_RC42.render();PS_RC43.refresh();PS_RC47.render();
  }''')
  assert page.evaluate('PS_RC42.inspect().turns.length')>=1
  assert page.locator('#ps43Confrontation option').count()>=1
  page.locator('#ps43Confrontation select').first.select_option(index=1)
  page.get_by_role('button',name='Wstaw pytanie do przesłuchania').click()
  text=page.locator('#chatInput').input_value()
  assert 'niezweryfikowana wypowiedź' in text.lower()
  assert page.locator('#ps43Confrontation img').count()==0
  assert page.evaluate('PS_RC47.inspect().turns')>=1
  page.evaluate('PS_NAV.open("deduction")')
  assert page.locator('#ps44Scenes').count()==1
  assert not page.evaluate('PS_RC44.render()')
  page.evaluate('PS_NAV.open("timeline")')
  assert page.locator('#ps45TimeAnalysis').count()==1
  assert page.evaluate('PS_RC45.analyze().events')>=0
  page.evaluate('PS_NAV.open("notebook")')
  assert page.locator('#ps46Annotations').count()==1
  assert page.locator('#ps49Diagnostics').count()==1
  # Select an actually existing NPC line, not a fabricated quote.
  page.evaluate('''() => {document.querySelector('#ps46Annotations select').value=CONTENT.characters[0].id;document.querySelector('#ps46Annotations select').dispatchEvent(new Event('change'));}''')
  page.locator('#ps46Annotations select').nth(1).select_option(index=0)
  page.locator('#ps46Annotations input').fill('Ważny punkt do porównania')
  page.get_by_role('button',name='Oznacz wypowiedź').click()
  marks=page.evaluate('PS_RC46.inspect()')
  assert len(marks)==1,marks
  saved=page.evaluate('PS_SAVE_MANAGER.build()')
  assert len(saved['rc46Annotations'])==1
  page.evaluate('save=>{PS_SAVE_MANAGER.verify(save);PS_SAVE_MANAGER.apply(save)}',saved)
  assert len(page.evaluate('PS_RC46.inspect()'))==1
  assert len(page.evaluate('PS_RC49.audit()'))==10
  assert all(c['pass'] for c in page.evaluate('PS_RC49.audit()'))
  page.evaluate('PS_NAV.open("final")')
  assert page.locator('#ps48FinalReport').count()==1
  report=page.evaluate('PS_RC48.report()')
  assert 'DOKUMENTY ODKRYTE' in report and 'WERDYKT (NIEZMIENIONY)' in report
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),width
  page.close()
  print('PASS browser',width,'px; witness memory, confrontation, scenes, chronology, coop annotations saved, psychology, report, QA')
 browser.close()
