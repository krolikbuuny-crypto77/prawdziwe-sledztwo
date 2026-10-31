"""Standalone Chromium UI layout test for bottom chat and persistent takeover dock."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
html=Path(__file__).resolve().parents[1].joinpath('index.html').read_text()
SHIM="""() => {const storage=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}});window.fetch=async(url,init={})=>{let b=init.body?JSON.parse(init.body):{};if(b.action==='create')return {ok:true,status:200,json:async()=>({ok:true,code:'ABCDEFGHJ',roomId:'mock',version:1,owner:true,controller:true,players:1,frame:b.frame})};return {ok:false,status:404,json:async()=>({ok:false})}};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 for w in [320,375,390,640,768,1024,1440]:
  page=browser.new_page(viewport={'width':w,'height':850})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate(SHIM)
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  page.get_by_role('button',name='Utwórz pokój').click()
  page.wait_for_function('PS_COOP.active===true',timeout=9000)
  page.evaluate('window.scrollTo(0,document.body.scrollHeight)')
  assert page.locator('.ps-coop-bottom-dock').is_visible()
  toggle=page.locator('.ps-coop-chat-toggle');assert toggle.is_visible()
  assert page.locator('.ps-coop-control-info').is_visible()
  toggle.click()
  assert page.locator('.ps-coop-chat-panel').is_visible()
  boxes=page.evaluate('''()=>{let r=x=>document.querySelector(x).getBoundingClientRect();return {vw:innerWidth,vh:innerHeight,dock:r('.ps-coop-bottom-dock').toJSON(),ctrl:r('.ps-coop-control-dock').toJSON(),chat:r('.ps-coop-chat-panel').toJSON(),button:r('.ps-coop-chat-toggle').toJSON(),game:document.querySelector('#mainContent').getBoundingClientRect().toJSON(),padding:getComputedStyle(document.querySelector('.layout>.main')).paddingBottom}}''')
  for key in ['ctrl','chat','button']:
   box=boxes[key];assert box['left']>=-2 and box['right']<=w+2,(w,key,box)
   assert box['top']>=-2 and box['bottom']<=850+2,(w,key,box)
  if w<=720:
   assert boxes['chat']['bottom'] < boxes['ctrl']['top']+2,(w,'mobile panel covers takeover',boxes)
  assert not errors,(w,errors[:4])
  print(f'PASS RC35.5 layout {w}px: chat at bottom, controller bar accessible, viewport contained')
  page.close()
 browser.close()
