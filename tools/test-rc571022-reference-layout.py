"""Interrogation layout validation against approved reference proportions, preserving controls."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width in [320,390,768,1440,1920]:
        page=browser.new_page(viewport={'width':width,'height':960})
        errors=[]
        page.on('pageerror', lambda e:errors.append(str(e)))
        page.set_content(HTML,wait_until='domcontentloaded')
        page.eval_on_selector('[data-tab="interview"]', 'e=>e.click()')
        if width < 940:
            page.eval_on_selector('#psm-tab-chat', 'e=>e.click()')
        data=page.evaluate('''() => {
          const q=(s)=>document.querySelector(s);
          const box=s=>{let r=q(s).getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,w:r.width,h:r.height}};
          const details=q('#interview .ps22-advanced');
          const photo=box('#interview #witnessStage');
          const name=box('#interview #chatName');
          const list=box('#interview #characterList');
          const chat=box('#interview .chat');
          const log=box('#interview #chatLog');
          const inp=box('#interview #chatInput');
          const send=box('#interview #chatSend');
          return {width:document.documentElement.scrollWidth,photo,name,list,chat,log,inp,send,
                  inputCount:document.querySelectorAll('#interview #chatInput').length,
                  sendCount:document.querySelectorAll('#interview #chatSend').length,
                  witnesses:document.querySelectorAll('#interview .character').length,
                  meterGroups:document.querySelectorAll('#interview .npc4-metric').length,
                  stances:document.querySelectorAll('#interview [data-npc4-stance]').length,
                  evidenceSelect:!!q('#interview #attachedDoc'),
                  advanced:!!details && details.contains(q('#simInterrogation'))};
        }''')
        assert data['width']<=width+2,(width,'overflow',data)
        assert data['inputCount']==1 and data['sendCount']==1,(width,data)
        assert data['witnesses']==6 and data['meterGroups']==3,(width,data)
        assert data['stances']==3 and data['evidenceSelect'] and data['advanced'],(width,data)
        assert data['inp']['w']>80 and data['send']['w']>70,(width,data)
        assert data['log']['bottom']<=data['inp']['bottom'],(width,data)
        if width>=941:
            assert data['photo']['right']<=data['name']['x']+15,(width,'portrait is not left of name',data)
            assert data['list']['x']>=data['chat']['right']-5,(width,'witness list not on right',data)
        page.eval_on_selector('#interview .ps22-advanced','e=>e.open=true')
        assert page.locator('#simInterrogation').is_visible(),(width,'advanced controls inaccessible')
        assert not errors,(width,errors[:2])
        print(f'PASS width={width}: no horizontal overflow; 6 witnesses; 1 input; 1 behavior panel; portrait/list positions; advanced controls')
        page.close()
    browser.close()
