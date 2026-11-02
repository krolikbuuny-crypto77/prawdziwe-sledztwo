"""Presentation-only smoke test: existing controls and no sideways document overflow."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()

async def check(browser, width, height):
    page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)[:200]))
    await page.set_content(HTML,wait_until='domcontentloaded',timeout=35000)
    await page.evaluate("showTab('interview')")
    await page.wait_for_timeout(180)
    if width <= 940:
        await page.locator("#characterList .character").first.click()
        await page.wait_for_timeout(180)
    await page.screenshot(path=str(ROOT/f'QA-RC571015-interview-{width}.png'))
    details=await page.evaluate('''() => {
      const selectors=['.sidebar','.topbar','.content','#interview','.charactergrid','.characterlist','.chat','.chathead','.chatlog','.chatfoot','#chatInput','#chatSend'];
      const dims=Object.fromEntries(selectors.map(s=>{const r=document.querySelector(s)?.getBoundingClientRect();return [s,r?{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}:null]}));
      const sidebarOpen=document.body.classList.contains('ui14-nav-open');
      return {width:innerWidth,documentScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,dims,sidebarOpen};
    }''')
    assert await page.locator('#chatInput').count()==1
    assert await page.locator('#chatSend').count()==1
    assert await page.locator('[data-npc4-stance]').count()==3
    assert await page.locator('#attachedDoc').count()==1
    assert await page.locator('button[data-tab]').count()==10
    assert details['documentScrollWidth']<=width+2, details
    assert details['bodyScrollWidth']<=width+2, details
    assert details['dims']['.chat']['w']>240, details
    assert details['dims']['#chatInput']['w']>=min(210,width-100), details
    boxes=details['dims']
    def overlaps(a,b):
        a,b=boxes[a],boxes[b]
        if not a or not b or not a['w'] or not b['w']: return False
        return min(a['x']+a['w'],b['x']+b['w'])>max(a['x'],b['x'])+1 and min(a['y']+a['h'],b['y']+b['h'])>max(a['y'],b['y'])+1
    assert not overlaps('#chatInput','#chatSend'), details
    assert not overlaps('.characterlist','.chat'), details
    assert not errors, errors
    await page.evaluate("showTab('evidence')")
    assert await page.locator('#evidence').evaluate('(e)=>e.classList.contains("active")')
    await page.evaluate("showTab('overview')")
    assert await page.locator('#overview').evaluate('(e)=>e.classList.contains("active")')
    await page.screenshot(path=str(ROOT/f'QA-RC571015-overview-{width}.png'))
    await page.close()
    return details

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        try:
            for w,h in [(390,844),(768,1024),(1440,900),(1920,1080)]:
                try:
                    details=await check(browser,w,h)
                    print('PASS',w,details['documentScrollWidth'],{k:v for k,v in details['dims'].items() if k in ['.charactergrid','.chat','#chatInput','#chatSend']})
                except Exception as e:
                    print('FAIL',w,str(e)[:800]); raise
        finally: await browser.close()

asyncio.run(main())
