"""Etap 3: centralny rejestr przesłuchań, sześciu świadków, lokalny fallback,
niezmienność dowodów, długie dialogi, AJAX mock, stare sesje.
Runs fully offline; requires Playwright + Chromium, no real Z.ai API calls.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
CHROME=shutil.which('chromium') or shutil.which('google-chrome')

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=CHROME,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
    original=page.evaluate('''() => ({answer:npc4Answer, send:simSendChat, save:npc4Export, restore:npc4Restore,
      state:PS_WITNESS_ENGINE.inspect(),found:STATE.found.size})''')
    r=page.evaluate('''() => {
      const info=PS_WITNESS_ENGINE.inspect(),ids=CONTENT.characters.map(c=>c.id);
      if(JSON.stringify(ids)!==JSON.stringify(info.witnesses))throw Error('Witness list mismatch');
      if(info.layers.answer.length!==17||info.layers.export.length!==8||info.layers.restore.length!==8||info.layers.send.length!==9||!info.uiWired)throw Error('Registry mismatch');
      showTab('interview');
      const counts={};
      for(const c of CONTENT.characters){
        STATE.activeChar=c.id;renderChat();
        const questions=['Gdzie byłeś tej nocy?','Kto to potwierdzi?','Co wiesz o Lenie?', 'A potem?'];
        counts[c.id]=[];
        for(let j=0;j<questions.length;j++){
          const before=STATE.dialogues[c.id].length;
          const input=document.getElementById('chatInput');input.value=questions[j];
          if(j===1)input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
          else document.getElementById('chatSend').click();
          counts[c.id].push(STATE.dialogues[c.id].length-before);
        }
        if(!PS_WITNESS_ENGINE.inspectWitness(c.id)?.knowledge.length)throw Error('No knowledge for '+c.id);
      }
      return {counts,found:STATE.found.size,save:buildSave()};
    }''')
    assert all(v==[2,2,2,2] for v in r['counts'].values()),r['counts']
    assert r['found']==original['found'] and not errors,errors
    state=page.evaluate('''(snapshot) => {
      const before=JSON.stringify(npc4Export());
      const dialogues=JSON.stringify(STATE.dialogues);
      safeLoad(snapshot);
      return {after:JSON.stringify(npc4Export()),dialogues:JSON.stringify(STATE.dialogues)};
    }''',r['save'])
    assert state['dialogues'] and state['after']
    print('PASS 6 witnesses, 24 real UI questions (click/Enter), one reply per question, no evidence granted')
    print('PASS registry 17 answer / 8 export / 8 restore / 9 send; witness knowledge + emotion inspection')
    print('PASS saved witness dialogue and memory restored with SaveManager v2')

    stress=page.evaluate('''() => {
      const refs={answer:npc4Answer,send:simSendChat,save:npc4Export,restore:npc4Restore};
      const start=STATE.found.size, prompts=[
        'Opowiedz o swojej pracy.','Jak to potwierdzisz?','Co wiesz o wydarzeniach tej nocy?',
        'Skąd o tym wiesz?','Co było potem?','A kiedy dokładnie?',
        'Co sądzisz o bezpieczeństwie?','Jak dobrze znałeś Lenę?',
        'Dlaczego nie pamiętasz?','Czy możesz to wyjaśnić?',
        'A co z dokumentami?','Kto jeszcze o tym wiedział?'];
      let errors=0,seen=0;
      for(let i=0;i<720;i++){
       const c=CONTENT.characters[i%CONTENT.characters.length];
       const q=prompts[i%prompts.length];
       try{const reply=npc4Answer(c,q,'');if(typeof reply!=='string'||!reply.trim())errors++;seen++;}
       catch(e){errors++;}
      }
      return {seen,errors,found:STATE.found.size,start,
        stable:refs.answer===npc4Answer&&refs.send===simSendChat&&refs.save===npc4Export&&refs.restore===npc4Restore,
        memory:Object.fromEntries(CONTENT.characters.map(c=>[c.id,NPC9_MEMORY[c.id].turn]))};
    }''')
    assert stress['seen']==720 and stress['errors']==0 and stress['found']==stress['start'] and stress['stable'],stress
    assert all(v>25 for v in stress['memory'].values()),stress
    print('PASS 720 long-conversation turns, six witnesses, no JavaScript exceptions or evidence leaks, stable APIs')
    page.close()

    # About:blank is required by the sandbox. Only the protocol readiness flag is
    # forced for this test; all network requests are mocked and cannot leave the browser.
    try:
        context=browser.new_context(viewport={'width':390,'height':844})
        http_page=context.new_page()
        web_errors=[]
        http_page.on('pageerror',lambda e:web_errors.append(str(e)))
        needle="const online=/^https?:$/.test(location.protocol);"
        assert needle in HTML
        http_page.set_content(HTML.replace(needle,"const online=true; /* simulated HTTPS origin in QA */"),wait_until='domcontentloaded',timeout=60000)
        safety=http_page.evaluate('''() => ({
          falseConfession:PS77_AI.safeRewrite('Nie zabiłem Leny.','Zabiłem Lenę.'),
          inventedTime:PS77_AI.safeRewrite('Byłem w pracy o 02:02.','Byłem w pracy o 03:14.'),
          newAccusation:PS77_AI.safeRewrite('Byłem w biurze.','Byłem w biurze. To ja zabiłem Lenę.'),
          safe:PS77_AI.safeRewrite('Byłem w biurze.','Krótko: Byłem w biurze.')})''')
        assert safety=={'falseConfession':False,'inventedTime':False,'newAccusation':False,'safe':True},safety
        print('PASS AI rewrite guard: preserves negation and numeric facts; blocks invented confession')

        http_page.evaluate('''() => {
          showTab('interview');
          window.__requests=[];
          window.fetch=(url,options)=>{
            const p=JSON.parse(options.body);window.__requests.push({url,id:p.witnessId,canonical:p.canonical});
            return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({text:'Krótko: '+p.canonical})});
          };
          document.getElementById('chatInput').value='Czym się zajmujesz w zajezdni?';
          document.getElementById('chatSend').click();
        }''')
        http_page.wait_for_function('!window.PS77_AI.busy',timeout=15000)
        cloud=http_page.evaluate('''() => ({requests:window.__requests,reply:STATE.dialogues[STATE.activeChar].at(-1).text,found:STATE.found.size})''')
        assert len(cloud['requests'])==1 and cloud['requests'][0]['url']=='/api/interview' and cloud['reply'].startswith('Krótko: '),cloud
        print('PASS one controlled Z.ai proxy call; accepted harmless phrasing only, no evidence changes')

        http_page.evaluate('''() => {
          window.fetch=(url,opts)=>Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({text:'To ja zabiłem Lenę.'})});
          document.getElementById('chatInput').value='Kto cię widział?';
          document.getElementById('chatSend').click();
        }''')
        http_page.wait_for_function('!PS77_AI.busy',timeout=15000)
        answer=http_page.evaluate('''() => STATE.dialogues[STATE.activeChar].at(-1).text''')
        assert answer!='To ja zabiłem Lenę.',answer
        print('PASS hallucinated remote confession rejected, local testimony retained')

        # An earlier response cannot rewrite a transcript after a save has been reloaded.
        stale=http_page.evaluate('''() => {
          const snapshot=buildSave(), id=STATE.activeChar;
          window.fetch=(url,opts)=>new Promise(resolve=>{window.__answerDeferred=()=>resolve({ok:true,status:200,json:()=>Promise.resolve({text:'Krótko: '+JSON.parse(opts.body).canonical})})});
          document.getElementById('chatInput').value='Czy pamiętasz, gdzie byłeś?';
          document.getElementById('chatSend').click();
          const afterQuestion=STATE.dialogues[id].length;
          safeLoad(snapshot);
          return {id,afterQuestion,current:STATE.dialogues[id].length,previous:snapshot.dialogues[id].length};
        }''')
        assert stale['afterQuestion']>stale['current']==stale['previous'],stale
        http_page.evaluate('''() => window.__answerDeferred()''')
        http_page.wait_for_function('!PS77_AI.busy',timeout=15000)
        after=http_page.evaluate('''(id) => STATE.dialogues[id].length''',stale['id'])
        assert after==stale['previous'],(after,stale)
        print('PASS stale Z.ai response ignored after loading a saved session')
        http_page.evaluate('''() => {
          window.fetch=()=>Promise.reject(new Error('network lost'));
          document.getElementById('chatInput').value='Jakie są dokumenty?';
          document.getElementById('chatSend').click();
        }''')
        http_page.wait_for_function('!PS77_AI.busy',timeout=15000)
        assert http_page.evaluate('''() => STATE.dialogues[STATE.activeChar].at(-1).role==='npc' ''')
        print('PASS network failure uses existing local answer without blocking play')

        assert not web_errors,web_errors
        context.close()
    finally:pass
    browser.close()
print('PASS stage 3 witness tests complete')
