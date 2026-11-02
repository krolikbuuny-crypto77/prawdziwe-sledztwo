"""RC57.10.27 UI regression: desktop, tablet, smartphone and long transcripts.
No witness interactions or saves are mutated in the packaged game: QA only."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlsplit,unquote
import mimetypes,json
ROOT=Path(__file__).resolve().parents[1]
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(320,720),(390,844),(560,900),(768,1024),(1024,768),(1280,800),(1440,900),(1648,928),(1920,1080)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)[:300]))
  def local(route):
   dest=(ROOT/unquote(urlsplit(route.request.url).path).lstrip('/')).resolve()
   if dest.is_file() and str(dest).startswith(str(ROOT)+'/'):
    route.fulfill(path=str(dest),content_type=mimetypes.guess_type(str(dest))[0] or 'application/octet-stream')
   else:route.fulfill(status=404,body='Not found')
  page.route('https://game.local/**',local)
  page.set_content((ROOT/'index.html').read_text().replace('<head>','<head><base href="https://game.local/">',1),wait_until='domcontentloaded')
  page.evaluate("showTab('interview')")
  has_switch=page.locator('#interview .psm-mobile-tabs button:visible').count()>0
  if has_switch:
   assert page.locator('#interview').evaluate("e=>e.classList.contains('psm-show-witnesses')"),(width,'initial witness switch')
   assert page.locator('#characterList').is_visible() and not page.locator('#interview .chat').is_visible(),(width,'initial witness list')
   page.locator('#characterList .character').first.click(timeout=5000)
   assert page.locator('#interview .chat').is_visible() and not page.locator('#characterList').is_visible(),(width,'interview after selecting witness')
   page.locator('#psm-tab-witnesses').click()
   assert page.locator('#characterList').is_visible() and not page.locator('#interview .chat').is_visible(),(width,'back to witness list')
   page.locator('#psm-tab-chat').click()
   assert page.locator('#interview .chat').is_visible() and not page.locator('#characterList').is_visible(),(width,'return to chat')
  page.wait_for_timeout(120)
  dim=page.evaluate('''()=>{let r=x=>document.querySelector(x)?.getBoundingClientRect();let i=r('#chatInput'),b=r('#chatSend'),c=r('#chatLog'),h=r('#interview .chathead'),f=r('#interview .chatfoot');return {w:innerWidth,scrollW:document.documentElement.scrollWidth,pageY:scrollY,form:i?.toJSON(),button:b?.toJSON(),chat:c?.toJSON(),head:h?.toJSON(),foot:f?.toJSON(),select:document.querySelectorAll('#attachedDoc').length,stances:document.querySelectorAll('[data-npc4-stance]').length}}''')
  assert dim['scrollW']<=width+1,(width,'page overflow',dim)
  assert page.locator('#chatInput').count()==page.locator('#chatSend').count()==1,(width,'duplicate form')
  assert dim['stances']==3 and dim['select']==1,(width,'existing mechanics')
  assert dim['form']['width']>= min(260,width-36),(width,'input too narrow',dim)
  assert dim['form']['x']>=0 and dim['form']['right']<=width+1,(width,'input clipped',dim)
  assert dim['button']['x']>=0 and dim['button']['right']<=width+1,(width,'send clipped',dim)
  assert dim['chat']['height']>=185,(width,'chat too small',dim)
  assert dim['form']['top']>=dim['chat']['bottom']-3,(width,'input overlaps chat',dim)
  if width in (390,768,1648): page.screenshot(path=str(ROOT/f'PODGLAD-RC571027-{width}.png'))
  page.locator('#chatLog').evaluate('''e=>{e.innerHTML=Array.from({length:50},(_,i)=>'<div class="bubble '+(i%2?'player':'npc')+'"><span>'+(i%2?'Ty':'Świadek')+'</span><div>'+'Rozbudowane zeznanie wyłącznie do testu przewijania i zawijania wyrazów. '.repeat(3)+'</div></div>').join('')}''')
  after=page.evaluate('''()=>{let c=document.querySelector('#chatLog'),f=document.querySelector('#chatInput').getBoundingClientRect();return{scroll:c.scrollHeight,client:c.clientHeight,inputTop:f.top,pageY:scrollY,scrollW:document.documentElement.scrollWidth}}''')
  assert after['scroll']>after['client']+400,(width,'long conversation not scrollable',after)
  assert abs((after['inputTop']+after['pageY'])-(dim['form']['top']+dim['pageY']))<=12,(width,'form shifted after 50 messages',after,dim)
  assert after['scrollW']<=width+1,(width,'overflow after 50 messages')
  page.locator('#chatInput').fill('Gdzie byłeś po północy?')
  assert page.locator('#chatInput').input_value()=='Gdzie byłeś po północy?'
  assert not errors,(width,'JS error',errors)
  results.append(dict(width=width,height=height,mode='switch' if has_switch else 'desktop',chatHeight=dim['chat']['height'],formWidth=dim['form']['width'],longConversationScroll=after['scroll'],passed=True))
  page.close()
 # Reduced viewport for keyboard overlay simulation, only visual controls / no real mobile keyboard emulator.
 page=browser.new_page(viewport={'width':390,'height':560})
 page.route('https://game.local/**',local)
 page.set_content((ROOT/'index.html').read_text().replace('<head>','<head><base href="https://game.local/">',1),wait_until='domcontentloaded')
 page.evaluate("showTab('interview')")
 page.locator('#characterList .character').first.click()
 inp=page.locator('#chatInput');inp.focus();inp.scroll_into_view_if_needed()
 r=inp.evaluate('e=>e.getBoundingClientRect().toJSON()')
 assert r['width']>300 and r['left']>=0 and r['right']<=390,(r)
 results.append(dict(width=390,height=560,passed=True,mode='reduced-window'))
 browser.close()
print('RC57.10.27 responsive PASS')
print(json.dumps(results,ensure_ascii=False,indent=2))
