"""Pakiet 6.1: mobile menu, secondary shortcuts, storage warning, accessibility."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
TABS=('overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    for width in (320,390,768,1000,1440):
        page=browser.new_page(viewport={'width':width,'height':850},reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        # An in-memory browser storage mock avoids about:blank origin restrictions.
        page.evaluate("""() => {const cache=new Map();Object.defineProperty(window,'localStorage',{configurable:true,get(){return {getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)}}})}""")
        page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
        is_mobile=width<=1000
        initial_found=page.evaluate('STATE.found.size')
        menu=page.locator('#ps61MenuButton')
        assert menu.is_visible()==is_mobile,(width,'mobile menu display')
        if is_mobile:
            assert menu.get_attribute('aria-expanded')=='false'
            assert page.locator('#ps61ModuleMenu').get_attribute('aria-hidden')=='true'
            assert page.locator('#ps61CurrentModule').inner_text()=='Pulpit'
            assert page.locator('#ps61ModuleMenu button').count()==10
            menu.click()
            assert page.locator('#ps61ModuleMenu').get_attribute('aria-hidden')=='false'
            page.keyboard.press('Escape')
            assert menu.get_attribute('aria-expanded')=='false'
            for tab in TABS:
                menu.click()
                page.locator(f'#ps61ModuleMenu [data-sv2-tab="{tab}"]').click()
                assert page.evaluate('STATE.tab')==tab
                assert menu.get_attribute('aria-expanded')=='false'
                assert page.locator('#ps61CurrentModule').inner_text()==page.locator(f'#ps61ModuleMenu [data-sv2-tab="{tab}"]').get_attribute('aria-label')
        else:
            assert page.locator('.ps61-secondary-shortcuts').count()>=2
            assert page.locator('.ps61-secondary-shortcuts:not([open])').count()==0
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,'horizontal overflow')
        assert page.evaluate('STATE.found.size')==initial_found
        assert page.evaluate('document.getElementById("final").dataset.psF1Phase')=='0'
        if width==390:
            page.evaluate("showTab('overview')")
            page.screenshot(path=str(ROOT/'PACKAGE-6_1-MOBILE-390.png'),full_page=False)
            menu.click()
            page.screenshot(path=str(ROOT/'PACKAGE-6_1-MENU-390.png'),full_page=False)
            menu.click()
            page.evaluate("showTab('interview')")
            details=page.locator('#interview .ps61-secondary-shortcuts')
            assert details.count()==1
            assert not details.evaluate('(el)=>el.open')
            details.locator('summary').click()
            assert details.evaluate('(el)=>el.open')
            page.screenshot(path=str(ROOT/'PACKAGE-6_1-INTERVIEW-390.png'),full_page=False)
        assert not errors,(width,errors[:4])
        print(f'PASS 6.1 viewport {width}: menu/accessibility/overflow/progression')
        page.close()
    # Simulate a browser blocking localStorage before the game loads.
    page=browser.new_page(viewport={'width':390,'height':850})
    page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Denied','SecurityError')}})")
    page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
    assert page.locator('#psStorageUnavailable').count()==1,'blocked storage not distinguished'
    assert page.locator('#psResumeOffer').count()==0,'misleading corrupt-save message'
    assert page.locator('#psStorageUnavailable button').inner_text()=='Pobierz zapis ręcznie'
    print('PASS blocked localStorage: manual export offered, no corrupted-save claim')
    page.close()
    browser.close()
