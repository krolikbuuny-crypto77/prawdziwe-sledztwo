"""One place for psychological indicators across all six witnesses and widths.
Visual-only refactor: keeps SVG expression, stance controls, history, saves.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf8')
WITNESSES=('MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA')
async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
      for width,height in ((390,844),(768,1024),(1440,900),(1920,1080)):
        page=await browser.new_page(viewport={'width':width,'height':height})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
        await page.evaluate("showTab('interview')")
        for id in WITNESSES:
          result=await page.evaluate('''(id)=>{
            STATE.activeChar=id;
            renderChat();
            const card=document.querySelector('#npc4Panel');
            const stage=document.querySelector('#witnessStage .wp-stage');
            const before=NPC4_STATE[id];
            const box=card.getBoundingClientRect(),picture=stage.getBoundingClientRect();
            const fields=['rapport','tension','fatigue'].map(k=>before[k]);
            const groupCount=document.querySelectorAll('#interview .npc4-metric').length;
            const portraitDuplicateCount=document.querySelectorAll('#witnessStage .wp-caption,#witnessStage .wp-metrics,#witnessStage .wp-metric').length;
            const quick=document.querySelector('#witnessQuickState');
            const currentMood=document.querySelector('#npc4Mood').textContent;
            const input=document.querySelector('#chatInput'),button=document.querySelector('#chatSend');
            return {id,groupCount,portraitDuplicateCount,quickInCard:card.contains(quick),portraitHasFace:!!stage.querySelector('.wp-mouth-curve'),portraitHasBrows:!!stage.querySelector('.wp-brow-motion'),portraitHasEye:!!stage.querySelector('.wp-eye-motion'),portraitMoodLabel:stage.querySelector('.wp-caption')?.textContent||'',labels:[...card.querySelectorAll('.npc4-label span:first-child')].map(e=>e.textContent),currentMood,fields,cardX:box.x,cardRight:box.right,pictureX:picture.x,pictureRight:picture.right,portraitAtRight:picture.x>box.x,interactiveStance:document.querySelectorAll('#interview [data-npc4-stance]').length,hasInput:!!input,hasButton:!!button}
          }''',id)
          assert result['groupCount']==3,result
          assert result['portraitDuplicateCount']==0,result
          assert result['quickInCard'],result
          assert result['portraitHasFace'] and result['portraitHasBrows'] and result['portraitHasEye'],result
          assert result['interactiveStance']==3 and result['hasInput'] and result['hasButton'],result
          if width>=950: assert result['pictureRight']<=result['cardX'] or result['pictureX']>=result['cardRight'],result  # left or right, but never overlapping
        # The facial expression still changes when the underlying witness state changes.
        emotion=await page.evaluate('''()=>{
          const id='MAREK';STATE.activeChar=id;renderChat();
          const before=NPC4_STATE[id].tension;
          const initial=document.querySelector('#witnessStage .wp-stage').className;
          NPC4_STATE[id].tension=85;
          npc4Render();
          const after=document.querySelector('#witnessStage .wp-stage').className;
          const meter=document.querySelector('#npc4Panel .npc4-metric.tension .npc4-value')?.textContent;
          NPC4_STATE[id].tension=before;npc4Render();
          return {initial,after,meter};
        }''')
        assert emotion['meter']=='85%',emotion
        assert emotion['initial']!=emotion['after'],emotion
        assert await page.locator('#chatInput').count()==1
        assert await page.locator('#chatSend').count()==1
        overflow=await page.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth')
        assert overflow<=2,(width,overflow)
        if width in (390,1440):
          await page.screenshot(path=str(ROOT/f'QA-RC571016-one-behavior-{width}.png'),full_page=False)
        assert not errors,errors[:3]
        print('PASS',width,'six witnesses; single metrics panel; portrait animation; controls; no overflow')
        await page.close()
    finally:
      await browser.close()
asyncio.run(main())
