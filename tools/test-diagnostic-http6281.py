"""Regression: non-2xx backend responses retain real HTTP status in AI metadata."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=(Path(__file__).resolve().parents[1]/'index.html').read_text('utf8').replace(
    'const online=/^https?:$/.test(location.protocol);','const online=true;')
with sync_playwright() as playwright:
 browser=playwright.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for code in (429,503,404):
  page=browser.new_page()
  errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(html,wait_until='domcontentloaded',timeout=90000)
  page.evaluate('''(code)=>{
    window.fetch=async()=>({ok:false,status:code});
    STATE.activeChar='MAREK';showTab('interview');renderChat();
    document.getElementById('chatInput').value='Gdzie byłeś od 01:30 do 02:05?';
    document.getElementById('chatSend').click();
  }''',code)
  page.wait_for_function('!window.PS77_AI.busy',timeout=30000)
  result=page.evaluate('''()=>({
   answer:STATE.dialogues.MAREK.at(-1).text,
   ai:buildSave().dialogues.MAREK.at(-1).ai,
   memory:buildSave().ps67.approved.MAREK.at(-1).text
  })''')
  assert result['ai']['fallbackReason']==f'backend_http_{code}',result
  assert result['ai']['provider']=='local',result
  assert result['answer']==result['memory'],result
  assert not errors,errors
  print('PASS HTTP',code,'fallback reason, export, witness memory')
  page.close()
 browser.close()
