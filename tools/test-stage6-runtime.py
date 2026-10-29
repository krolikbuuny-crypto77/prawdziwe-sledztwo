"""Stage 6 targeted browser regressions: rendering coalescence and 4K lifecycle.
This is a deterministic DOM test, not a claim about real-device FPS or memory.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content((ROOT/'index.html').read_text(encoding='utf8'),wait_until='domcontentloaded',timeout=60000)
 # Verify image lifecycle; source images are not fetched in a set_content run.
 state=page.evaluate('''() => {
   showTab('inspection12');
   window.PS_ETAP2_QA.turn(180);
   const img=document.getElementById('et1SceneImage');
   const initialized={src:img.getAttribute('src'),decoding:img.decoding,detailDecoding:document.getElementById('et1EvidenceImage').decoding};
   document.getElementById('et2EnlargeScene').click();
   const viewerImg=document.getElementById('et2ViewerImage');
   const viewer={src:viewerImg.getAttribute('src'),visible:!document.getElementById('et2Viewer').hidden};
   document.getElementById('et2ViewerClose').click();
   const closed={src:viewerImg.getAttribute('src'),hidden:document.getElementById('et2Viewer').hidden};
   showTab('overview');
   const left={src:img.getAttribute('src'),detailSrc:document.getElementById('et1EvidenceImage').getAttribute('src')};
   return {initialized,viewer,closed,left};
 }''')
 assert state['initialized']['src'] and state['initialized']['decoding']=='async' and state['initialized']['detailDecoding']=='async',state
 assert state['viewer']['src'] and state['viewer']['visible'],state
 assert state['closed']['src'] is None and state['closed']['hidden'],state
 assert state['left']['src'] is None and state['left']['detailSrc'] is None,state
 print('PASS 4K: asynchronous decoding, modal opens and clears source on close, inspection image released on navigation')
 # Red Thread: multiple filters in the same frame should cause one render.
 setup=page.evaluate('''() => {
   showTab('deduction');
   const source=dedAvailable().keys().next().value;
   if(!source)throw Error('No owned source');
   for(let i=0;i<14;i++)STATE.deduction.cards.push({id:'P6-'+i,title:'Hipoteza '+i,kind:'przypuszczenie',statement:'Próbna hipoteza do testu rysowania',alternative:'Inne wyjaśnienie',test:'Weryfikacja',rival:'',links:[{source,role:'limits',note:'Zdobyte źródło ogranicza interpretację'}]});
   dedRender();
   const nodes=document.getElementById('threadSourceNodes'),cards=document.getElementById('threadCardNodes');
   const svg=document.getElementById('threadSvg');

   return {source,cardCount:cards.children.length,svg:svg.id,rendered:window.__stage6Rendered};
 }''')
 assert setup['source'] and setup['cardCount']>=14,setup
 # Finish any pre-existing scheduling from the dedRender() setup.
 page.wait_for_timeout(80)
 page.evaluate('''() => {
   const nodes=document.getElementById('threadSourceNodes'),original=nodes.replaceChildren.bind(nodes);
   window.__stage6Rendered=0;
   nodes.replaceChildren=(...args)=>{window.__stage6Rendered++;return original(...args);};
   const field=document.getElementById('threadSourceSearch');
   for(let i=0;i<20;i++){field.value=i%2?'':'a';field.dispatchEvent(new Event('input',{bubbles:true}));}
 }''')
 page.wait_for_timeout(80)
 result=page.evaluate('''() => {
   const nodes=document.getElementById('threadSourceNodes'),svg=document.getElementById('threadSvg');
   return {refreshes:window.__stage6Rendered,paths:svg.querySelectorAll('path').length,sourceCount:nodes.querySelectorAll('[data-thread-source]').length};
 }''')
 assert result['refreshes']==1,result
 assert result['paths']>=1,result
 print('PASS Red Thread: 20 rapid filter events grouped into one board render; links still drawn')
 # One frame for bursts of EventBus notifications without gameplay mutation.
 event=page.evaluate('''() => {
   showTab('overview');window.__stage6EventRefreshes=0;const original=window.renderCounts;
   window.renderCounts=function(...args){window.__stage6EventRefreshes++;return original.apply(this,args)};
   for(let i=0;i<25;i++) PS_EVENTS.emit('evidenceCollected',{id:'synthetic-for-coalescence-only'});
   return window.__stage6EventRefreshes;
 }''')
 assert event==0,event
 page.wait_for_timeout(80)
 event=page.evaluate('window.__stage6EventRefreshes')
 assert event==1,event
 print('PASS EventBus: 25 synthetic state-change signals coalesced to one UI refresh frame')
 assert not errors,errors[:3]
 print('PASS no uncaught JavaScript errors after rapid redraw and synthetic event burst')
 page.close();browser.close()
