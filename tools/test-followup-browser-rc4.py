"""Browser should distinguish a missing Supabase SQL migration from a model outage."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
html=(Path(__file__).resolve().parent.parent/'index.html').read_text().replace('const online=/^https?:$/.test(location.protocol);','const online=true; /* test fixture */')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=80000)
 page.evaluate('''()=>{showTab('interview');STATE.activeChar='MAREK';window.fetch=async(u)=>u==='/api/game-state'?{ok:true,status:200}:{ok:false,status:503,json:async()=>({ok:false,error:'Shared rate limiter unavailable'})};document.getElementById('chatInput').value='Kto to może potwierdzić?';document.getElementById('chatSend').click();}''')
 page.wait_for_function('()=>!window.PS77_AI.busy',timeout=12000)
 result=page.evaluate('''()=>({status:document.getElementById('ps77-response-wait')?.textContent,input:document.getElementById('chatInput').value,last:STATE.dialogues.MAREK.at(-1)?.text})''')
 assert 'migrację SQL 003' in result['status'],result
 assert result['input']=='Kto to może potwierdzić?',result
 assert 'Kto to może potwierdzić?' not in result['last'],result
 assert not errors,errors
 page.evaluate('''()=>{window.fetch=async(u)=>u==='/api/game-state'?{ok:true,status:200}:{ok:false,status:503,json:async()=>({ok:false,error:'AI chwilowo niedostępne. Ponów pytanie.',fallbackReason:'zai_timeout;groq_upstream_unavailable'})};document.getElementById('chatSend').click();}''')
 page.wait_for_function('()=>!window.PS77_AI.busy',timeout=12000)
 status=page.locator('#ps77-response-wait').inner_text()
 assert 'Z.ai: przekroczony czas' in status,status
 assert 'Groq: błąd dostawcy' in status,status
 assert not errors,errors
 print('PASS browser RC4: 503 Supabase migration vs model outage; question restored; no local reply')
 browser.close()
