"""RC29: browser integration regression for accepted and rejected interview responses.
Mocked network responses, no external API calls.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf-8').replace('const online=/^https?:$/.test(location.protocol);','const online=true; /* browser QA */')
answer='Nie mam alibi na całą noc. Byłem na zmianie, ale nie byłem cały czas w biurze.'
tests=[
    ('apinex-luna',True,True,False,True),
    ('apinex-glm',True,True,False,True),
    ('apinex-deepseek',True,True,False,True),
    ('zai',True,True,False,True),
    ('gemini',True,True,False,True),
    ('groq',True,True,False,True),
    ('mistral',True,True,False,True),
    ('local',False,True,True,True),
    ('unknown',True,True,False,False),
    ('apinex-luna',False,True,False,False),
    ('apinex-luna',True,False,False,False),
    ('local',False,True,False,False),
]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    errors=[]
    for provider,verified,canonical,localVerified,expected in tests:
        page=browser.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded',timeout=80000)
        page.evaluate('''({provider,verified,canonical,localVerified,answer})=>{
          window.fetch=(url,opts={})=>{
            if(url==='/api/game-state')return Promise.resolve({ok:true,status:200});
            if(url!=='/api/interview')throw Error('Unexpected API '+url);
            const request=JSON.parse(opts.body);
            return Promise.resolve({ok:true,status:200,json:async()=>({ok:true,decision:'answer',
                serverCanonical:canonical,semanticVerified:verified,localVerified,
                provider,turnId:request.turnId,text:answer})});
          };
          STATE.activeChar='MAREK';showTab('interview');renderChat();
          window.__beforeLength=STATE.dialogues.MAREK.length;
          document.getElementById('chatInput').value='Masz alibi?';
          document.getElementById('chatSend').click();
        }''',{'provider':provider,'verified':verified,'canonical':canonical,'localVerified':localVerified,'answer':answer})
        page.wait_for_function('()=>!window.PS77_AI.busy',timeout=15000)
        status=page.evaluate('''()=>({size:STATE.dialogues.MAREK.length,before:window.__beforeLength,
           text:STATE.dialogues.MAREK.at(-1)?.text||'',provider:STATE.dialogues.MAREK.at(-1)?.ai?.provider||null, ai:STATE.dialogues.MAREK.at(-1)?.ai||null,
           input:document.getElementById('chatInput').value})''')
        accepted=status['size']==status['before']+2 and status['text']==answer and status['input']==''
        assert accepted==expected,(provider,verified,canonical,localVerified,expected,status)
        print('PASS',provider,'accepted' if accepted else 'rejected')
        page.close()
    assert not errors,errors
    browser.close()
print('PASS: RC29 browser provider parity, approved local fallback and invalid response rejection')
