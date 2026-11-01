"""Pakiet 6.4: dynamic consequence journal; no spoilers, grants or fake dialogue."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf8')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
    for width in (320,390,768,1440):
        page=browser.new_page(viewport={'width':width,'height':860})
        errors=[]
        page.on('pageerror',lambda ex: errors.append(str(ex)))
        page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
        assert page.evaluate('!!window.PS64_CONSEQUENCES'),'journal did not mount'
        assert page.locator('#ps64Consequences').is_hidden(),'unearned content leaked'
        assert page.evaluate('PS64_CONSEQUENCES.available()')==[],'unearned beat revealed'
        count_before=page.evaluate('STATE.found.size')
        proof=page.evaluate('''() => {
          const arcs=['pressure','service'],checked=[];
          for(const id of arcs){
            const arc=PS53_QA.arcs.find(a=>a.id===id);
            const route=arc.paths[0];
            for(const docId of route){STATE.found.add(docId);if(SIM_DEGRADED?.[docId]&&!STATE.sim.verified.includes(docId))STATE.sim.verified.push(docId);}
            checked.push({id,ready:PS53_QA.ready(arc,0),route});
            const current=ps53Entry(id);current.choice='careful';current.path=0;
          }
          PS64_CONSEQUENCES.render();return {checked,available:PS64_CONSEQUENCES.available()};
        }''')
        assert all(x['ready'] for x in proof['checked']),proof
        assert 'work' in proof['available'],proof
        page.evaluate("showTab('deduction')")
        assert page.locator('#ps64Consequences').is_visible(),page.evaluate('''() => ({tab:STATE.tab, hidden:document.getElementById('ps64Consequences').hidden, parent:document.getElementById('ps64Consequences').parentElement.id, parentHidden:document.getElementById('ps64Consequences').parentElement.hidden,computed:getComputedStyle(document.getElementById('ps64Consequences')).display, available:PS64_CONSEQUENCES.available(), className:document.getElementById('ps64Consequences').className})''')
        assert page.locator('#ps64Items article').count()==1
        assert page.locator('#ps64Items article').inner_text().count('Zadano')==0 # no falsely completed lead
        assert page.evaluate('PS64_CONSEQUENCES.status("warning")') is None,'unearned topic exposed'
        assert not page.locator('#ps64Teaser').get_attribute('hidden'),'no context after breakthrough'
        before=page.evaluate('STATE.found.size')
        # Action only prepares a question; never silently sends or unlocks.
        page.locator('[data-ps64-thread="work"][data-ps64-witness="MAREK"]').click()
        assert page.evaluate('STATE.tab')=='interview'
        assert page.evaluate('STATE.activeChar')=='MAREK'
        assert page.locator('#chatInput').input_value()==page.evaluate('PS64_CONSEQUENCES.prompt("work","MAREK")')
        assert page.evaluate('PS64_CONSEQUENCES.status("work")[0].answered')==False
        assert page.evaluate('STATE.found.size')==before
        page.locator('#chatSend').click()
        page.wait_for_timeout(60)
        assert page.evaluate('PS64_CONSEQUENCES.status("work")[0].answered')==True,'question was not tracked'
        assert page.evaluate('PS64_CONSEQUENCES.status("work")[1].answered')==False
        assert page.evaluate('STATE.found.size')==before,'dialogue awarded unearned documents'
        # Save + load derived state. Older saves have no dedicated journal fields.
        roundtrip=page.evaluate('''() => {
          const save=buildSave();const former=STATE.dialogues.MAREK.length;
          safeLoad(save);PS64_CONSEQUENCES.render();
          return {schema:save.saveMeta.schemaVersion,length:STATE.dialogues.MAREK.length,former,
           status:PS64_CONSEQUENCES.status('work'),extras:('ps64Consequences' in save)};
        }''')
        assert roundtrip['schema']==2 and roundtrip['length']==roundtrip['former']
        assert not roundtrip['extras'],roundtrip
        # Test-only synthetic found documents may be sanitized by the real import;
        # restore the verified fixture and verify that the historical *dialogue* survived.
        page.evaluate('''() => {
          for(const id of ['pressure','service']){
            const arc=PS53_QA.arcs.find(a=>a.id===id);
            for(const docId of arc.paths[0]){STATE.found.add(docId);if(SIM_DEGRADED[docId]&&!STATE.sim.verified.includes(docId))STATE.sim.verified.push(docId);}
            const entry=ps53Entry(id);entry.choice='careful';entry.path=0;
          }
          PS64_CONSEQUENCES.render();
        }''')
        assert page.evaluate('PS64_CONSEQUENCES.status("work")[0].answered'),'transcript history lost after save' 
        # The player draft cannot be overwritten by a recommendation.
        guard=page.evaluate('''() => {
          document.getElementById('chatInput').value='Moje własne pytanie';
          PS64_CONSEQUENCES.prepare('work','JANUSZ');
          return {value:document.getElementById('chatInput').value,who:STATE.activeChar};
        }''')
        assert guard['value']=='Moje własne pytanie',guard
        # Revert to unverified state: UI and API must conceal the topic even if conversation remains.
        page.evaluate('''() => {
          ps53Entry('pressure').choice='dismiss';PS64_CONSEQUENCES.render();
        }''')
        assert page.locator('#ps64Consequences').is_hidden(),width
        assert page.evaluate('PS64_CONSEQUENCES.status("work")') is None
        assert page.evaluate('STATE.found.size')==before
        assert not errors,(width,errors[:5])
        page.close()
        print(f'PASS {width}px: verified gating, prepare, real dialogue, save, blocked draft overwrite, revoke, no proof leaks')
    browser.close()
print('PASS Pakiet 6.4 behavioral test')
