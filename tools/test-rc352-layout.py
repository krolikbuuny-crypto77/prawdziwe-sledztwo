"""RC35.2 responsive layout regression: coop join/chat reserve space, no overlays."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf8')
SHIM="""() => {
 const memory=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
 window.fetch=async (url,opts={})=>{
  const path=String(url);
  const body=opts.body?JSON.parse(opts.body):{};
  if(path.startsWith('/api/coop')){
   if(body.action==='create')return {ok:true,status:200,json:async()=>({ok:true,code:'ABCDEFGHJ',roomId:'test-room',version:1,controller:true,owner:true,players:1,frame:body.frame})};
   if(path.startsWith('/api/coop-chat'))return {ok:true,status:200,json:async()=>({ok:true,messages:[]})};
   return {ok:false,status:404,json:async()=>({ok:false,error:'not_in_coop_room'})};
  }
  return {ok:false,status:503,json:async()=>({ok:false,error:'not_ready'})};
 };
}"""
CHECK="""() => {
 const r = s=>document.querySelector(s)?.getBoundingClientRect();
 const bar=r('.ps-coop-bar'),main=r('.layout > .main'),top=r('.topbar'),content=r('#mainContent'),panel=r('.ps-coop-chat-panel'),join=r('.ps-coop-join');
 const vw=document.documentElement.clientWidth;
 const within=e=>!e|| (e.width===0&&e.height===0) || (e.left>=-1 && e.right<=vw+1 && e.width>0);
 return {vw,bar:bar?.toJSON(),main:main?.toJSON(),top:top?.toJSON(),content:content?.toJSON(),panel:panel?.toJSON(),join:join?.toJSON(),
  inFlow: !!(bar&&content&&bar.bottom <= content.top+1),
  belowHeader:!!(bar&&top&&bar.top>=top.bottom-1),
  horizontalFit: [bar,panel,join].every(within),
  nested:document.querySelector('.ps-coop-bar')?.parentElement?.matches('.layout > .main'),
  fixed:getComputedStyle(document.querySelector('.ps-coop-bar')).position==='fixed',
  shield:!!document.querySelector('.ps-coop-shield')};
}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 try:
  for width in [320,375,390,768,1024,1440]:
   page=browser.new_page(viewport={'width':width,'height':840})
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.evaluate(SHIM)
   page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
   page.get_by_role('button',name='Dołącz').click()
   stage1=page.evaluate(CHECK)
   assert stage1['inFlow'] and stage1['belowHeader'] and stage1['horizontalFit'] and stage1['nested'] and not stage1['fixed'] and not stage1['shield'],(width,'join',stage1)
   page.get_by_role('button',name='Dołącz').click()
   page.get_by_role('button',name='Utwórz pokój').click()
   page.wait_for_function('window.PS_COOP.active===true',timeout=10000)
   page.get_by_role('button',name='Czat').click()
   stage2=page.evaluate(CHECK)
   assert stage2['inFlow'] and stage2['belowHeader'] and stage2['horizontalFit'] and stage2['nested'] and not stage2['fixed'],(width,'chat',stage2)
   # The pane is entirely above gameplay, not on top of its elements.
   assert stage2['panel']['bottom']<=stage2['content']['top']+1,(width,stage2)
   assert not errors,(width,errors[:5])
   print(f'PASS RC35.2 {width}px: join/chat inline, header accessible, no game overlap or viewport overflow')
   page.close()
 finally:browser.close()
