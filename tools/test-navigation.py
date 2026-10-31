"""Regression test for the Stage 1 single-owner navigation refactor.

Optional: Python Playwright + Chromium are needed for `python tools/test-navigation.py`.
This test deliberately never calls the paid AI endpoints or mutates save data.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
TABS = ('overview', 'evidence', 'search', 'interview', 'timeline', 'inspection12',
        'notebook', 'labs', 'deduction', 'final')

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=shutil.which('chromium') or shutil.which('google-chrome') or None,
        args=['--no-sandbox'],
    )
    for width in (320, 390, 768, 1440):
        page = browser.new_page(viewport={'width': width, 'height': 900})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.set_content(HTML, wait_until='domcontentloaded', timeout=60000)
        start = page.evaluate('''() => ({
          nav: showTab, found: STATE.found.size, dialogueCounts: Object.fromEntries(
            Object.entries(STATE.dialogues).map(([key,value])=>[key,value.length])),
          hooks: PS_NAV.inspect().hooks, phase: document.getElementById('final').dataset.psF1Phase
        })''')
        assert len(start['hooks']) == 29, (width, start['hooks'])
        assert len(set(start['hooks'])) == 29, (width, 'Duplicate hook')
        assert start['phase'] == '0', (width, 'Finale unlocked unexpectedly')
        for tab in TABS:
            selector = (f'.sv2-mobile-nav [data-sv2-tab="{tab}"]' if width < 1000
                        else f'#nav [data-tab="{tab}"]')
            if width < 1000:
                page.locator('#ps61MenuButton').click(timeout=15000)
                assert page.locator('#ps61MenuButton').get_attribute('aria-expanded') == 'true'
            page.locator(selector).click(timeout=15000)
            result = page.evaluate('''(tab) => ({
              selected:STATE.tab,
              active:[...document.querySelectorAll('.section.active')].map(el=>el.id),
              navActive:document.querySelector('#nav [data-tab="'+tab+'"]')?.getAttribute('aria-current'),
              width:document.documentElement.scrollWidth,
              mobileActive:document.querySelector('.sv2-mobile-nav [data-sv2-tab="'+tab+'"]')?.getAttribute('aria-current'),
              found:STATE.found.size,
              phase:document.getElementById('final').dataset.psF1Phase
            })''', tab)
            assert result['selected'] == tab and result['active'] == [tab], (width, tab, result)
            assert result['navActive'] == 'page', (width, tab, 'Sidebar focus out of sync')
            assert result['mobileActive'] == 'page', (width, tab, 'Mobile focus out of sync')
            assert result['width'] <= width, (width, tab, result['width'])
            assert result['found'] == start['found'], (width, tab, 'Navigation mutated evidence')
        # Finale: viewing prerequisites is valid; it must not unlock indictment or defense.
        assert page.evaluate('''() => document.getElementById('final').dataset.psF1Phase''') == '0'
        assert page.evaluate('''() => document.querySelector('#fcDefense')?.dataset.psF1Hidden''') == '1'
        # Unknown tabs must not deselect the currently opened module.
        assert page.evaluate('''() => showTab('nonexistent-tab') === false &&
          STATE.tab === 'final' && document.querySelectorAll('.section.active').length===1''')
        assert page.evaluate('''() => Object.values(STATE.dialogues).every((messages)=>
            messages.length===1)'''), 'Navigation mutated witness dialogue'
        # Explicit hook lifecycle: "before" hooks behave as the old outer wrappers.
        sequence = page.evaluate('''() => {
          const log=[];
          const removeFirst=registerNavigationHook({name:'test-A',before:()=>log.push('beforeA'),after:()=>log.push('afterA')});
          const removeSecond=registerNavigationHook({name:'test-B',before:()=>log.push('beforeB'),after:()=>log.push('afterB')});
          const ref=showTab;
          showTab('evidence');
          removeSecond();removeFirst();
          return {log, unchanged:ref===showTab, hooks:PS_NAV.inspect().hooks.length};
        }''')
        assert sequence == {'log':['beforeB','beforeA','afterA','afterB'], 'unchanged':True, 'hooks':29}, (width,sequence)
        assert not errors, (width, errors[:4])
        print(f'PASS navigation {width}px: 10 actual clicks, active/ARIA sync, finale gates, lifecycle, no JS errors')
        page.close()
    browser.close()
