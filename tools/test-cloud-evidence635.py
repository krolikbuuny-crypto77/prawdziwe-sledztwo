"""Isolated browser contract test; network mocked, never contacts Vercel or Supabase."""
import json, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
needle='const online=/^https?:$/.test(location.protocol);'
assert needle in html
html=html.replace(needle,'const online=true; /* Only for sandbox QA. */')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=100000)
 page.evaluate('''()=>{
   window.PS617_SYNC={...window.PS617_SYNC,ensureEvidence:async id=>id==='VIS-02'};
   window.__calls635=[];
   window.fetch=(url,options)=>{
    if(url==='/api/game-state')return Promise.resolve({ok:true,status:200});
    window.__calls635.push({url,payload:JSON.parse(options.body)});
    return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({ok:true,decision:'answer',semanticVerified:true,serverCanonical:true,
      text:'Zostańmy przy tej fotografii.',provider:'zai',model:'mock-zai',turnId:JSON.parse(options.body).turnId})});
   };
   showTab('interview');STATE.activeChar='MAREK';
   STATE.found.add('VIS-02');STATE.reviewedEvidence.add('VIS-02');renderAttached();
   document.getElementById('attachedDoc').value='VIS-02';
   document.getElementById('chatInput').value='Co pokazuje fotografia osłony?';
   document.getElementById('chatSend').click();
 }''')
 page.wait_for_timeout(1000)
 result=page.evaluate('''()=>({calls:window.__calls635,last:STATE.dialogues.MAREK.at(-1),busy:window.PS77_AI.busy})''')
 assert len(result['calls'])==1,result
 assert result['calls'][0]['url']=='/api/interview',result
 payload=result['calls'][0]['payload']
 assert payload.get('presentedEvidenceId')=='VIS-02',payload
 assert payload.get('question')=='Co pokazuje fotografia osłony?',payload
 assert result['last']['text']=='Zostańmy przy tej fotografii.',result
 assert result['last']['ai']['provider']=='zai',result
 assert not errors,errors
 print('PASS 6.35 browser: verified VIS-02 passed to cloud proxy with original question; cloud reply shown; JS errors 0')
 browser.close()
