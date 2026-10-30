"""6.36-IV UI and locale checks with real Chromium; no external AI or database access."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'), args=['--no-sandbox'])
    for width in [390, 768, 1280, 1920]:
        context=browser.new_context(viewport={'width':width,'height':850},device_scale_factor=1)
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
        # Responsive navigation and eleven? ten sections; no horizontal overflow in primary workspace.
        initial=page.evaluate('''() => ({nav:window.PS_NAV.inspect().modules.length,screen:document.documentElement.scrollWidth,viewport:innerWidth,plural:[psCount(1,'karta','karty','kart'),psCount(2,'karta','karty','kart'),psCount(5,'karta','karty','kart'),psCount(12,'źródło','źródła','źródeł'),psCount(22,'źródło','źródła','źródeł')]})''')
        assert initial['nav']==10,initial
        assert initial['plural']==['1 karta','2 karty','5 kart','12 źródeł','22 źródła'],initial
        # Some fixed-position decorative layers must not expand the document.
        assert initial['screen']<=initial['viewport']+2,(width,initial)
        page.evaluate("showTab('inspection12')")
        inspected=page.evaluate('''() => ({tab:STATE.tab,extras:['p1Stats','p1Orientation','p1Recent','p1RoomCase','p1Journal'].map(id=>({id,exists:!!document.getElementById(id),open:document.getElementById(id)?.open,summary:document.querySelector('#'+id+' > summary')?.textContent})),panel:document.getElementById('p1InspectionNow')!==null})''')
        assert inspected['tab']=='inspection12' and inspected['panel'],inspected
        assert all(x['exists'] and not x['open'] and x['summary'] for x in inspected['extras']),inspected
        # User can still expand an archival pane.
        page.locator('#p1Stats summary').click()
        assert page.locator('#p1Stats').evaluate('(e)=>e.open')
        # Timeline is minute-precision and never rejects a valid timestamp with seconds as an out-of-range date.
        timeline=page.evaluate('''() => {STATE.found.add('MED-01');showTab('timeline');const ev=TL_MAP.get('e18'),entry=tlCleanEntry(ev,{at:'2026-11-18T02:02:11',to:'',place:'dyspozytornia',actor:'',sourceIds:['MED-01'],reason:'Dokładna sekunda jest w źródle.'});STATE.timeline11.selected='e18';tlRender();return {time:entry.at,input:document.getElementById('tlAt')?.getAttribute('step'),help:document.getElementById('tlEditor')?.textContent.includes('dokładnością do minuty'),refs:document.getElementById('tlEditor')?.textContent.includes('EVID_RAW_ENTRY_TIMES')};}''')
        assert timeline['time']=='2026-11-18T02:02' and timeline['input']=='60' and timeline['help'],timeline
        assert not errors,(width,errors[:5])
        print(f'PASS Chromium {width}px: navigation, inspect disclosures, plural, timeline minute precision, no JS error')
        context.close()
    browser.close()
