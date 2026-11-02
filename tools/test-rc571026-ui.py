from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlsplit,unquote
import mimetypes,json
ROOT=Path(__file__).resolve().parents[1]
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(320,720),(390,844),(768,1024),(1280,800),(1440,900),(1648,928),(1920,1080)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  def local(route):
   target=(ROOT/unquote(urlsplit(route.request.url).path).lstrip('/')).resolve()
   if not target.is_file() or not str(target).startswith(str(ROOT)+'/'):
    route.fulfill(status=404,body='missing');return
   route.fulfill(status=200,path=str(target),content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
  page.route('https://game.local/**',local)
  page.set_content((ROOT/'index.html').read_text().replace('<head>','<head><base href="https://game.local/">',1),wait_until='domcontentloaded')
  page.evaluate("showTab('interview')")
  if width<981: page.locator('#characterList .character').first.click(timeout=3500)
  page.wait_for_timeout(680)
  before=page.evaluate('''()=>{let c=document.querySelector('#chatLog'),f=document.querySelector('#chatInput'),s=document.querySelector('#chatSend');return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,footTop:f.getBoundingClientRect().top,footBottom:f.getBoundingClientRect().bottom,formCount:document.querySelectorAll('#chatInput').length,sendCount:document.querySelectorAll('#chatSend').length,empty: getComputedStyle(document.querySelector('.ps25-no-evidence')).display, cTop:c.getBoundingClientRect().top,cBottom:c.getBoundingClientRect().bottom}}''')
  assert before['scrollWidth']<=width+1,(width,'horizontal overflow',before)
  assert before['formCount']==before['sendCount']==1,(width,'duplicate forms')
  assert before['empty']!='none',(width,'empty evidence message hidden')
  page.locator('#chatLog').evaluate('''e=>{e.innerHTML=Array.from({length:50},(_,i)=>'<div class="bubble '+(i%2?'player':'npc')+'"><span>'+(i%2?'Ty':'Marek Nowicki')+'</span><div>'+'Przykładowo długie zeznanie służące wyłącznie do testu przewijania i zawijania tekstu. '.repeat(3)+'</div></div>').join('')}''')
  after=page.evaluate('''()=>{let c=document.querySelector('#chatLog'),f=document.querySelector('#chatInput');return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollHeight:c.scrollHeight,clientHeight:c.clientHeight,footTop:f.getBoundingClientRect().top,cBottom:c.getBoundingClientRect().bottom}}''')
  assert after['scrollWidth']<=width+1,(width,'overflow with 50 messages',after)
  assert after['scrollHeight']>after['clientHeight']+300,(width,'not internally scrollable',after)
  assert abs(after['footTop']-before['footTop'])<(18 if width<=680 else 2),(width,'input moved after chat growth',before,after)
  assert after['footTop']>=after['cBottom']-5,(width,'input overlaps chat',before,after)
  page.locator('#chatInput').fill('Gdzie byłeś po północy?')
  assert page.locator('#chatInput').input_value()=='Gdzie byłeś po północy?'
  if width==1648:page.screenshot(path=str(ROOT/'PODGLAD-RC571026-DLUGA-ROZMOWA.png'))
  results.append({'width':width,'height':height,'passed':True,'chatScroll':after['scrollHeight'],'chatViewport':after['clientHeight'],'inputStable':True,'emptyState':before['empty'],'pageErrors':errors})
  assert not errors,(width,errors)
  page.close()
 # Reduced height / virtual keyboard simulation (mobile), after focusing field.
 page=browser.new_page(viewport={'width':390,'height':560},device_scale_factor=1)
 page.route('https://game.local/**',local)
 page.set_content((ROOT/'index.html').read_text().replace('<head>','<head><base href="https://game.local/">',1),wait_until='domcontentloaded')
 page.evaluate("showTab('interview')")
 page.locator('#characterList .character').first.click()
 page.locator('#chatInput').focus();page.locator('#chatInput').scroll_into_view_if_needed()
 v=page.locator('#chatInput').evaluate('e=>e.getBoundingClientRect().toJSON()')
 assert v['width']>240 and v['left']>=0 and v['right']<=390,(v)
 results.append({'width':390,'height':560,'passed':True,'reason':'focused input remains usable with reduced viewport'})
 browser.close()
print('PASS RC57.10.26 — 50 wiadomości, jeden formularz, stan pustych dowodów, brak poziomego przepełnienia, 7 szerokości + klawiatura mobilna')
print(json.dumps(results,ensure_ascii=False,indent=2))
