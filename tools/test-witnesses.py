"""AI-first regression for six witnesses (no offline-free-dialogue fallback)."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text().replace('const online=/^https?:$/.test(location.protocol);','const online=true; /* QA browser fixture */')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844}); errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
 result=page.evaluate('''async()=>{
  window.fetch=async(_url,opts)=>{if(_url==='/api/game-state')return {ok:true,status:200};const p=JSON.parse(opts.body);
   return {ok:true,status:200,json:async()=>({ok:true,decision:'answer',semanticVerified:true,serverCanonical:true,
    provider:'zai',model:'qa-zai',turnId:p.turnId,text:p.canonical})};};
  const start=STATE.found.size,info=PS_WITNESS_ENGINE.inspect();showTab('interview');
  const counts={};for(const c of CONTENT.characters){STATE.activeChar=c.id;renderChat();counts[c.id]=[];
   for(const q of ['Gdzie byłeś tej nocy?','Kto to potwierdzi?','Co wiesz o Lenie?','A potem?']){
    const n=STATE.dialogues[c.id].length;document.getElementById('chatInput').value=q;
    document.getElementById('chatSend').click();
    await new Promise(resolve=>setTimeout(resolve,50));
    counts[c.id].push(STATE.dialogues[c.id].length-n);
   }
  }
  const snapshot=buildSave();safeLoad(snapshot);
  let turns=0,failures=0;const prompts=['Opowiedz o swojej pracy.','Jak to potwierdzisz?','Co wiesz o wydarzeniach tej nocy?','Skąd o tym wiesz?','Co było potem?','A kiedy dokładnie?', 'Co sądzisz o bezpieczeństwie?','Jak dobrze znałeś Lenę?', 'Dlaczego nie pamiętasz?','Czy możesz to wyjaśnić?', 'A co z dokumentami?','Kto jeszcze o tym wiedział?'];
  for(let i=0;i<720;i++){try{const c=CONTENT.characters[i%6],a=npc4Answer(c,prompts[i%prompts.length],'');if(typeof a!=='string'||!a.trim())failures++;turns++;}catch{failures++;}}
  return {counts,turns,failures,found:STATE.found.size,start,registry:info.layers,dialogues:Object.keys(STATE.dialogues).length};
 }''')
 assert all(v==[2,2,2,2] for v in result['counts'].values()),result['counts']
 assert result['turns']==720 and result['failures']==0 and result['found']==result['start'],result
 assert result['dialogues']==6 and len(result['registry']['answer'])==17,result
 assert not errors,errors
 print('PASS AI-first witnesses: 24 UI turns over mocked AI, six witnesses, SaveManager, 720 grounding-engine stress turns, no evidence leaks')
 browser.close()
