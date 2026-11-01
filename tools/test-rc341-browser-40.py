"""RC34.1: Chromium proof that a 40-pair per witness save is sent to restore endpoint in five batches."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf8').replace('!/^https?:$/.test(location.protocol)','false')
SHIM="""() => {
 const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}});
 window.__batches=[];
 const server={revision:0,state:{witnesses:{},approvedEvidence:[],verdict:null,indictment:null}};
 window.fetch=async(url,init={})=>{
  let out={ok:true};
  if(String(url)==='/api/game-session-reset'){server.revision=0;server.state.witnesses={};}
  else if(String(url)==='/api/game-state')out={ok:true,revision:server.revision,state:server.state};
  else if(String(url)==='/api/interview-restore'){
    const req=JSON.parse(init.body);window.__batches.push(req);
    const history=server.state.witnesses[req.witnessId]||[];
    for(const row of req.turns)history.push({role:'player',text:row.question},{role:'witness',text:row.text});
    server.state.witnesses[req.witnessId]=history;server.revision++;
    out={ok:true,restored:req.turns.length,verified:0,unverified:req.turns.length,skipped:0};
  }
  return {ok:true,status:200,json:async()=>out};
 };
}"""
with sync_playwright() as pp:
 browser=pp.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome') or None,args=['--no-sandbox'])
 page=browser.new_page()
 errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 page.evaluate(SHIM)
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 saved=page.evaluate('''() => {
  for (let i=1;i<=42;i++) STATE.dialogues.MAREK.push({role:'player',text:'Pytanie Marka nr '+i+'?'},{role:'npc',text:'Odpowiedź Marka nr '+i+'.'});
  for (let i=1;i<=40;i++) STATE.dialogues.JANUSZ.push({role:'player',text:'Pytanie Janusza nr '+i+'?'},{role:'npc',text:'Odpowiedź Janusza nr '+i+'.'});
  return buildSave();
 }''')
 result=page.evaluate('''async(s)=>window.PS617_SYNC.restoreTranscript(s,{fresh:true})''',saved)
 assert result['ok'] and result['restored']==80,result
 batches=page.evaluate('window.__batches')
 for witness,n0 in [('MAREK',3),('JANUSZ',1)]:
  chunks=[b for b in batches if b['witnessId']==witness]
  assert len(chunks)==5 and all(len(b['turns'])==8 for b in chunks),chunks
  assert f'nr {n0}?' in chunks[0]['turns'][0]['question'],chunks[0]
  assert 'nr 40?' in chunks[-1]['turns'][-1]['question'] if witness=='JANUSZ' else 'nr 42?' in chunks[-1]['turns'][-1]['question']
 assert not errors,errors
 browser.close()
 print('PASS RC34.1 Chromium: 40 pairs × 2 witnesses (42 source pairs truncated to last 40); five 8-turn API batches per witness; no page errors')
