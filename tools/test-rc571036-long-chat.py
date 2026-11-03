from playwright.sync_api import sync_playwright
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in ((390,844),(390,560),(1440,900)):
  page=browser.new_page(viewport={'width':w,'height':h});page.set_content(HTML,wait_until='domcontentloaded',timeout=90000);page.wait_for_timeout(350)
  page.evaluate("document.body.classList.remove('ps-resume-pending');showTab('interview')")
  if w<=1024:page.evaluate("document.querySelector('#interview').classList.add('psm-show-chat');document.querySelector('#interview').classList.remove('psm-show-witnesses')")
  page.wait_for_timeout(800)
  before=page.evaluate("document.querySelector('#interview .chatfoot').getBoundingClientRect().top")
  page.evaluate('''()=>{const log=document.getElementById('chatLog');for(let i=0;i<100;i++){const e=document.createElement('div');e.className=i%2?'bubble npc':'bubble player';e.textContent='Wypowiedź '+i+': '+('Analiza zeznań i rzeczywistych źródeł sprawy. '.repeat(7));log.append(e)}}''')
  after=page.evaluate('''()=>{const log=document.getElementById('chatLog'),form=document.querySelector('#interview .chatfoot');return {scroll:log.scrollHeight>log.clientHeight,formDelta:form.getBoundingClientRect().top,clipped:form.scrollHeight>form.clientHeight+2,docWidth:document.documentElement.scrollWidth}}''')
  assert after['scroll'] and abs(after['formDelta']-before)<3 and not after['clipped'] and after['docWidth']<=w+1,(w,after,before)
  page.close()
 browser.close()
print('100 wiadomości: 3/3 warianty ekranu PASS')
