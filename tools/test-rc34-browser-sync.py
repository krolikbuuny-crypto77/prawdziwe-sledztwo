"""RC34 browser test in Chromium with server API mocked in JS (no live network)."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
# Browser's about:blank cannot fetch a relative HTTP API. In the test fixture
# only, replace the protocol check and supply a fake fetch implementation.
HTML=(ROOT/'index.html').read_text(encoding='utf8').replace('!/^https?:$/.test(location.protocol)','false')
SHIM="""() => {
 const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}});
 window.__apiCalls=[];
 const server={revision:0,state:{witnesses:{},approvedEvidence:[],verdict:null,indictment:null}};
 window.fetch=async(url,init={})=>{
  const path=String(url);let out={ok:true};
  if(path==='/api/game-session-reset'){server.revision=0;server.state.witnesses={};}
  else if(path==='/api/game-state'){out={ok:true,revision:server.revision,state:server.state};}
  else if(path==='/api/interview-restore'){
    const req=JSON.parse(init.body);window.__apiCalls.push(req);
    const history=server.state.witnesses[req.witnessId]||[];
    for(const row of req.turns){history.push({role:'player',text:row.question},{role:'witness',text:row.text});}
    server.state.witnesses[req.witnessId]=history;server.revision++;
    out={ok:true,restored:req.turns.length,verified:0,unverified:req.turns.length,skipped:0};
  }
  return {ok:true,status:200,json:async()=>out};
 };
}"""
with sync_playwright() as pp:
 browser=pp.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome') or None,args=['--no-sandbox'])
 page=browser.new_page()
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate(SHIM)
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 saved=page.evaluate('''() => {
   STATE.activeChar='JANUSZ';
   STATE.dialogues.MAREK.push({role:'player',text:'Masz alibi?'},{role:'npc',text:'Nie byłem przez cały czas w biurze.'});
   STATE.dialogues.MAREK.push({role:'player',text:'Gdzie byłeś?'},{role:'npc',text:'Byłem też w dyspozytorni.'});
   return buildSave();
 }''')
 page.evaluate("STATE.activeChar='MAREK'")
 assert page.evaluate('(s)=>{safeLoad(s);return STATE.activeChar;}',saved)=='JANUSZ'
 result=page.evaluate('''async(s)=>window.PS617_SYNC.restoreTranscript(s,{fresh:true})''',saved)
 assert result['ok'] and result['restored']==2,result
 calls=page.evaluate('window.__apiCalls')
 assert len(calls)==1 and calls[0]['witnessId']=='MAREK' and len(calls[0]['turns'])==2,calls
 assert calls[0]['turns'][0]['question']=='Masz alibi?'
 assert page.evaluate('window.PS617_SYNC.restoring') is False
 assert not errors,errors
 print('PASS RC34 Chromium: selected witness restored, transcript sent to server endpoint, no browser script errors')
 browser.close()
