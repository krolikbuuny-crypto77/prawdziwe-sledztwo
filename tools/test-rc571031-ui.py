"""RC57.10.31: visual regression for interview details and audio preferences.
Uses local Chromium, test-only dialog initialization, no API or save changes.
"""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import mimetypes
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8').replace('<head>', '<head><base href="https://game.local/">', 1)

def luminance(rgb):
    channels = [int(x.strip())/255 for x in rgb[rgb.index('(')+1:rgb.index(')')].split(',')[:3]]
    ch = [v / 12.92 if v <= 0.04045 else ((v+0.055)/1.055)**2.4 for v in channels]
    return sum(a*b for a,b in zip(ch,(.2126,.7152,.0722)))

def contrast(fg, bg):
    a,b=luminance(fg),luminance(bg)
    return (max(a,b)+.05)/(min(a,b)+.05)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(320,640),(390,560),(390,844),(768,1024),(1440,900)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        def route(rt):
            path=(ROOT/unquote(urlsplit(rt.request.url).path).lstrip('/')).resolve()
            if path.is_file() and path.is_relative_to(ROOT):
                rt.fulfill(path=str(path),content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
            else: rt.fulfill(status=404,body='404')
        page.route('**/*',route)
        page.set_content(HTML,wait_until='domcontentloaded')
        page.evaluate("showTab('interview')")
        for selector in ('#ps54Director > summary','#ps66Explain_interview > summary'):
            page.locator(selector).click()
        vals=page.evaluate('''()=>({
         ry:getComputedStyle(document.querySelector('#ps54Director > summary')).color,
         help:getComputedStyle(document.querySelector('#ps66Explain_interview > summary')).color,
         background:getComputedStyle(document.querySelector('#ps54Director .ps54-path')).backgroundColor,
         viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
         open:document.getElementById('ps54Director').open&&document.getElementById('ps66Explain_interview').open
        })''')
        assert vals['open'] and vals['scrollWidth']<=width,(width,vals)
        assert contrast(vals['ry'],'rgb(233,205,166)')>=4.5,('scene heading',width,vals)
        assert contrast(vals['help'],'rgb(233,205,166)')>=4.5,('help heading',width,vals)
        assert vals['background']!='rgb(17, 28, 36)',('dark beat panel',vals)
        page.locator('#ps80MusicOptions').click()
        data=page.evaluate('''()=>{let el=document.getElementById('ps80Settings'),b=el.getBoundingClientRect(),s=getComputedStyle(el.querySelector('.senior-setting'));return {visible:!el.hidden,left:b.left,right:b.right,top:b.top,bottom:b.bottom,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,senior:s.color,z:getComputedStyle(document.getElementById('ps80AudioBar')).zIndex};}''')
        assert data['visible'] and data['left']>=-1 and data['right']<=width+1,(width,data)
        assert data['bottom']<=height+1,(width,height,data)
        assert contrast(data['senior'],'rgb(249,231,202)')>=4.5,('senior',width,data)
        assert int(data['z'])>20,('overlay',width,data)
        before=page.locator('#ps80Effects').is_checked()
        page.locator('#ps80Effects').uncheck() if before else page.locator('#ps80Effects').check()
        assert page.locator('#ps80Effects').is_checked()!=before,('audio control',width)
        if data['scrollHeight']>data['clientHeight']:
            page.locator('#ps80Settings').evaluate('(el)=>{el.scrollTop=el.scrollHeight;}')
            assert page.locator('#seniorSettingsSwitch').is_visible(),('scroll end',width)
        print(f'PASS {width}x{height}: panels, contrast, audio popover, input and scrolling')
        page.close()
    browser.close()
print('PASS RC57.10.31: 5 viewports; real DOM and computed contrast')
