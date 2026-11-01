"""Playwright browser test of 6.27 diagnostics, export/import, memory parity, debug overlay. Mocked backend."""
from pathlib import Path
import json,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf8').replace("const online=/^https?:$/.test(location.protocol);", "const online=true;").replace("const psShowAiDiagnostic=new URLSearchParams(location.search).get('debugAI')==='1';", "const psShowAiDiagnostic=true;")
rid='a29b27cf-135e-4ef0-9c47-93eb9872df05'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':900,'height':850});errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.set_content(html,wait_until='domcontentloaded',timeout=100000)
 assert page.evaluate('psShowAiDiagnostic') is True
 data={'ok':True,'serverCanonical':True,'decision':'answer','semanticVerified':True,
  'text':'Byłem dostępny z biura podczas nocnej zmiany. Nie mogę potwierdzić, że przebywałem tam bez przerwy.',
  'provider':'groq','model':'llama-3.3-70b-versatile','fallbackReason':'zai_rate_limited','requestId':rid,'durationMs':320}
 page.evaluate('''(payload)=>{
  window.fetch=async(url,opts)=>({ok:true,status:200,json:async()=>payload});
  STATE.activeChar='MAREK';showTab('interview');renderChat();
  document.getElementById('chatInput').value='Gdzie byłeś podczas nocnej zmiany?';
  document.getElementById('chatSend').click();
 }''',data)
 page.wait_for_function('!window.PS77_AI.busy',timeout=30000)
 row=page.evaluate('''()=>{
  const s=buildSave(),last=s.dialogues.MAREK.at(-1);const before=JSON.stringify(last);
  const diagHTML=document.getElementById('chatLog').innerText;
  const approved=s.ps67.approved.MAREK.at(-1).text;
  const episode=s.ps68.witnesses.MAREK.episodes.at(-1).a;
  applySave(s);
  const reread=buildSave().dialogues.MAREK.at(-1);
  return {last,before,diagHTML,approved,episode,reread,afterRestore:STATE.dialogues.MAREK.at(-1).ai};
 }''')
 assert row['last']['ai']==row['reread']['ai']==row['afterRestore'],row
 assert row['last']['ai']=={'provider':'groq','model':'llama-3.3-70b-versatile','fallbackReason':'zai_rate_limited','requestId':rid,'durationMs':320},row
 assert row['last']['text']==row['approved'] and row['last']['text'][:680]==row['episode'],row
 assert '320 ms' in row['diagHTML'] and 'Groq' in row['diagHTML'] and 'zai_rate_limited' in row['diagHTML'] and rid in row['diagHTML'],row['diagHTML'][-500:]
 assert not errors,errors
 print('PASS 6.27 browser: debugAI overlay, provider/model/reason/request ID, export and restore, ps67/ps68 parity, no JS exceptions')
 browser.close()
