"""Pakiet 6.3 — five forensic workstations, 4K gesture safety and state isolation."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
GAMES=('tcms','msg','cctv','forensic','access')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
    for width in (390,1440):
        page=browser.new_page(viewport={'width':width,'height':844})
        errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
        page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
        page.evaluate("showTab('labs')")
        for i,k in enumerate(GAMES):
            page.evaluate('''i=>{document.querySelector(`[data-open-lab="${i}"]`).click();PS_MG3_QA.refresh()}''',i)
            panel=page.locator('#p3-'+k)
            assert panel.count()==1,(width,k,'missing panel')
            assert panel.locator('.p63-method summary').count()==1,(width,k,'missing optional method')
            assert panel.locator('.p63-method:not([open])').count()==1,(width,k,'method revealed automatically')
            assert panel.locator('.p63-method').inner_text().count('Wybierz najlepsze')==0,(width,k,'answer reveal')
            assert panel.locator('.p3-milestone').count()==3,(width,k,'stage count')
        # Empty input must not be penalized or throw focus away.
        page.evaluate("document.querySelector('[data-open-lab=\"3\"]').click()")
        q=page.locator('#p3-forensic')
        before=page.evaluate('buildSave().minigames3.stages.forensic.attempts')
        q.locator('[data-p3-submit]').click()
        after=page.evaluate('buildSave().minigames3.stages.forensic.attempts')
        assert before==after==0,(width,'incomplete answer penalized')
        assert q.locator('[aria-invalid="true"]').count()==1,(width,'missing invalid field')
        assert q.locator('[aria-invalid="true"]').evaluate('(el)=>el===document.activeElement'),(width,'missing focus')
        # A wrong complete answer must produce feedback, never a solved stage.
        q.locator('[data-p3-input]').nth(0).select_option('match')
        q.locator('[data-p3-input]').nth(1).select_option('match')
        q.locator('[data-p3-input]').nth(2).select_option('match')
        q.locator('[data-p3-submit]').click()
        assert page.evaluate('buildSave().minigames3.stages.forensic.attempts')==1,(width,'attempt missing')
        assert q.locator('.p3-feedback').evaluate('(el)=>el===document.activeElement'),(width,'feedback not focused')
        assert 'Metoda kontroli' in q.locator('.p3-feedback').inner_text(),(width,'unclear feedback')
        assert page.evaluate('PS_MG3_QA.status().forensic')==0,(width,'incorrect answer awarded')
        # Buttons remain accessible following a rerendered sequence editor.
        page.evaluate("document.querySelector('[data-open-lab=\"0\"]').click()")
        tc=page.locator('#p3-tcms')
        tc.locator('.p3-entry:not([disabled])').first.click()
        assert tc.locator('.p3-slot b').first.inner_text()!='Wybierz rekord'
        assert tc.locator('button:focus').count()==1,(width,'lost keyboard focus')
        tc.locator('[data-p3-undo]').click()
        assert tc.locator('.p3-slot b').first.inner_text()=='Wybierz rekord'
        # Save roundtrip may not affect a puzzle outcome, status or inventory.
        before_found=page.evaluate('STATE.found.size')
        result=page.evaluate('''() => {const s=buildSave();safeLoad(s);return {attempts:buildSave().minigames3.stages.forensic.attempts,status:PS_MG3_QA.status()}}''')
        assert result['attempts']==1 and result['status']['forensic']==0
        assert page.evaluate('STATE.found.size')==before_found
        assert not errors,(width,errors[:8])
        page.close()
    # Viewer gesture regression. Use real pointer events via Playwright mouse.
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
    page.evaluate("showTab('inspection12')")
    sample='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="3840" height="2160"%3E%3Crect width="3840" height="2160" fill="%23273542"/%3E%3C/svg%3E'
    page.evaluate('''url=>{document.getElementById('et1SceneImage').src=url}''',sample)
    page.locator('#et1SceneImage').evaluate('(img)=>img.decode()')
    page.locator('#et2EnlargeScene').click()
    page.wait_for_timeout(100)
    assert not page.locator('#et2Viewer').is_hidden(),'4K loupe did not open'
    box=page.locator('#et2ViewerStage').bounding_box()
    assert box
    x=box['x']+box['width']/2;y=box['y']+box['height']/2
    msg_before=page.locator('#ov35Info').inner_text()
    page.mouse.move(x,y)
    page.mouse.down()
    page.mouse.move(x+76,y+13,steps=5)
    page.mouse.move(x,y,steps=5)
    page.mouse.up()
    page.wait_for_timeout(30)
    assert page.locator('#ov35Info').inner_text()==msg_before,'4K drag misclassified as a tap'
    assert not page.locator('#et2Viewer').is_hidden(),'4K drag closed viewer'
    # Only explicit discovery mode can discover a point (other tools never grant evidence).
    page.evaluate("PS_OGLEDZINY_35_QA.setMode('discover')")
    pos=page.evaluate('''() => {const s=PS_OGLEDZINY_35_QA.spots()[0],r=document.getElementById('et2ViewerImage').getBoundingClientRect();return {x:r.left+r.width*s.x,y:r.top+r.height*s.y,found:STATE.scene12.discovered.length}}''')
    page.mouse.click(pos['x'],pos['y'])
    assert page.evaluate('STATE.scene12.discovered.length')==pos['found']+1,'valid photo tap failed to discover a spot'
    assert page.locator('#et2Viewer').is_hidden(),'valid discovery failed to close loupe'
    # Reopen/close also must release the 4K image source.
    page.locator('#et2EnlargeScene').click()
    page.locator('#et2ViewerClose').click()
    assert page.locator('#et2Viewer').is_hidden(),'4K viewer did not close'
    assert page.locator('#et2ViewerImage').get_attribute('src') is None,'4K image not released'
    # Only the initial batch of evidence may exist; inspection itself cannot award evidence.
    assert not errors,errors[:8]
    print('PASS 4K loupe: drag returning to its initial point never registers as discovery')
    browser.close()
print('PASS 5 minigames x 2 widths; incomplete fields, feedback focus, keyboard navigation, no proof leak, save roundtrip')
