"""AI-required mode: a failed remote interview must not display a local draft."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parent.parent/'index.html').read_text()
html=html.replace('const online=/^https?:$/.test(location.protocol);','const online=true; /* offline test fixture */')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=80000)
 page.evaluate('''()=>{
  window.fetch=async(url)=>url==='/api/game-state'?{ok:true,status:200}:{ok:false,status:503,json:async()=>({error:'AI unavailable'})};
  showTab('interview');STATE.activeChar='MAREK';
  document.getElementById('chatInput').value='Gdzie pan był w czasie alarmu?';
  window.__n=STATE.dialogues.MAREK.length;
  document.getElementById('chatSend').click();
 }''')
 page.wait_for_function("()=>!window.PS77_AI.busy",timeout=8000)
 result=page.evaluate('''()=>({length:STATE.dialogues.MAREK.length,before:window.__n,
  input:document.getElementById('chatInput').value,
  status:document.getElementById('ps77-response-wait')?.textContent,
  last:STATE.dialogues.MAREK.at(-1)?.text,
  memory:PS68_MEMORY.inspect().MAREK,
  approved:PS65_CONTEXT.inspect().MAREK})''')
 assert result['length']==result['before'],result
 assert result['input']=='Gdzie pan był w czasie alarmu?',result
 assert 'AI' in result['status'],result
 assert result['memory']['episodes']==0,result
 assert result['approved']==0,result
 assert not errors,errors
 print('PASS browser AI required: HTTP 503 restores input, no local testimony or stage65/68 memory, status visible')
 browser.close()
