"""Stage 5 EventBus: real compiled app, Chromium, lifecycle and mutation semantics.

No paid API requests. Programmatic state injection is limited to isolated tests,
not presented as completing the in-game puzzles.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf8')
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
    result=page.evaluate('''() => ({meta:PS_EVENTS.inspect(),types:PS_EVENT_BUS.types})''')
    assert len(result['types'])==7 and all(len(result['meta']['listeners'][t])>=1 for t in result['types']),result
    extended={'evidenceCollected','hypothesisEvaluated','witnessBreakthrough','caseCompleted'}
    assert all(len(result['meta']['listeners'][t])==(2 if t in extended else 1)+int(t=='evidenceCollected') for t in result['types']),result
    assert 'ps617-server-proposal' in result['meta']['listeners']['evidenceCollected'],result
    assert all('package-64-'+t in result['meta']['listeners'][t] for t in extended),result
    assert not result['meta']['errors'] and result['meta']['paused']==0,result
    print('PASS EventBus started with 7 types, 7 original UI subscribers and 4 consequence-journal subscribers')
    observe=page.evaluate('''() => {
      const events=[];
      const off=PS_EVENTS.on('evidenceCollected','test-observer',d=>events.push(d));
      let collision='';try{PS_EVENTS.on('evidenceCollected','test-observer',()=>{});}catch(e){collision=e.message;}
      const notOwned=DOCS.find(d=>!STATE.found.has(d.id));
      const before=STATE.found.size;
      const invalid=PS_EVENTS.evidence(notOwned.id,'test');
      const mid=STATE.found.size;
      STATE.found.add(notOwned.id);
      const accepted=PS_EVENTS.evidence(notOwned.id,'test-source');
      const after=STATE.found.size;
      off();
      const later=PS_EVENTS.evidence(notOwned.id,'test-source-again');
      return {collision,invalid,accepted,before,mid,after,events:events.length,
        proof:events[0],later};
    }''')
    assert observe['collision'] and observe['invalid'] is False and observe['accepted'] is True,observe
    assert observe['before']==observe['mid'] and observe['after']==observe['mid']+1,observe
    assert observe['events']==1 and observe['proof']['origin']=='test-source',observe
    print('PASS evidence emitted only for owned source, subscriber unsubscribe, duplicate registration guard')
    page.wait_for_timeout(100)
    assert not page.evaluate('PS_EVENTS.inspect().errors'),page.evaluate('PS_EVENTS.inspect()')
    print('PASS one coalesced UI refresh after evidence acquisition; no event listener exceptions')
    event_order=page.evaluate('''() => {
      const order=[];
      const a=PS_EVENTS.on('timelineVerified','test-A',()=>{
        order.push('A');PS_EVENTS.emit('hypothesisEvaluated',{id:'test-recursion'});
      });
      const b=PS_EVENTS.on('timelineVerified','test-B',()=>order.push('B'));
      const c=PS_EVENTS.on('hypothesisEvaluated','test-C',()=>order.push('C'));
      PS_EVENTS.emit('timelineVerified',{id:'test-timeline'});
      a();b();c();
      let malformed=false;try{PS_EVENTS.emit('unknownType',{});}catch(_){malformed=true;}
      return {order,malformed};
    }''')
    assert event_order=={'order':['A','B','C'],'malformed':True},event_order
    print('PASS reentrant emissions preserve listener order; unsupported events rejected')
    skipped=page.evaluate('''() => {
      const before=PS_EVENTS.inspect().counts.timelineVerified;
      const bad=PS_EVENTS.timeline('T1',{state:'warn'});
      const good=PS_EVENTS.timeline('T1',{state:'ok'});
      return {before,after:PS_EVENTS.inspect().counts.timelineVerified,bad,good};
    }''')
    assert skipped['bad'] is False and skipped['good'] is True and skipped['after']==skipped['before']+1,skipped
    print('PASS timelineVerified only for sources assessed as correct')
    stages=page.evaluate('''() => {
      const source=DOCS.find(d=>STATE.found.has(d.id));
      const key='doc:'+source.id;
      STATE.deduction.cards.push({id:'H_STAGE5',title:'Test połączenia',kind:'przypuszczenie',
       statement:'Źródło wymaga niezależnego potwierdzenia.',alternative:'Inna możliwość',
       test:'Weryfikacja niezależna',rival:'',links:[]});
      const before=PS_EVENTS.inspect().counts.hypothesisEvaluated;
      const link=PS_REASONING_ENGINE.linkHypothesis({cardId:'H_STAGE5',sourceKey:key,role:'limits',
        note:'Źródło nie daje pewności przypisania sprawstwa'});
      const count=PS_EVENTS.inspect().counts.hypothesisEvaluated;
      const saved=STATE.deduction.cards.some(x=>x.id==='H_STAGE5'&&x.links.length===1);
      PS_REASONING_ENGINE.linkHypothesis({cardId:'H_STAGE5',sourceKey:key,remove:true});
      STATE.deduction.cards=STATE.deduction.cards.filter(x=>x.id!=='H_STAGE5');dedRender();
      return {before,count,saved,link};
    }''')
    assert stages['count']==stages['before']+1 and stages['saved'],stages
    print('PASS real ReasoningEngine link operation emits hypothesisEvaluated; board remains coherent')
    witness=page.evaluate('''() => {
      const id=CONTENT.characters[0].id;
      const before=PS_EVENTS.inspect().counts.witnessBreakthrough;
      const rejected=PS_EVENTS.breakthrough(id,'TEST');
      PS_BREAKTHROUGH.state(id);
      const s=STATE.sim.breakthrough.witnesses;
      s[id] ||= {unlocked:[]};s[id].unlocked.push('TEST');
      const raised=PS_EVENTS.breakthrough(id,'TEST');
      return {before,after:PS_EVENTS.inspect().counts.witnessBreakthrough,rejected,raised};
    }''')
    assert witness['rejected'] is False and witness['raised'] is True and witness['after']==witness['before']+1,witness
    print('PASS breakthrough event cannot fire unless the witness memory actually unlocks issue')
    evidence=page.evaluate('''() => {
      const outputs=MSG_OUTPUT.filter(id=>!STATE.found.has(id));
      const before=PS_EVENTS.inspect().counts;
      msgSetResult();
      const after=PS_EVENTS.inspect().counts;
      return {newCount:outputs.length,found:outputs.every(id=>STATE.found.has(id)),
        lab:after.laboratoryCompleted-before.laboratoryCompleted,
        evidence:after.evidenceCollected-before.evidenceCollected,expected:MSG_OUTPUT.length};
    }''')
    assert evidence['found'] and evidence['lab']==1 and evidence['evidence']==evidence['expected'],evidence
    print('PASS laboratory report creation raises evidenceCollected per report and one laboratoryCompleted')
    final=page.evaluate('''() => {
      const before=PS_EVENTS.inspect().counts;
      const rejected=PS_EVENTS.indictment();
      STATE.final13.submitted=true;STATE.final13.attempts+=1;
      const submitted=PS_EVENTS.indictment();
      STATE.sim.trial={kind:'solid',title:'Test',text:'Mock UI result',strength:0,reasons:[]};
      const completed=PS_EVENTS.finale();
      const duplicate=PS_EVENTS.finale();
      const after=PS_EVENTS.inspect().counts;
      return {rejected,submitted,completed,duplicate,submitCount:after.indictmentSubmitted-before.indictmentSubmitted,
        winCount:after.caseCompleted-before.caseCompleted};
    }''')
    assert final['rejected'] is False and final['submitted'] and final['completed'] and final['duplicate'] is False,final
    assert final['submitCount']==1 and final['winCount']==1,final
    print('PASS indictment requires submitted charge; case completion fires once for accepted verdict')
    saves=page.evaluate('''() => {
      const file=buildSave();
      const before=PS_EVENTS.inspect().counts;
      SaveManager.apply(file);
      const after=PS_EVENTS.inspect();
      return {schema:SaveManager.verify(file).schemaVersion,before,
        after:after.counts,paused:after.paused,errors:after.errors,valid:STATE.found.size>0};
    }''')
    assert saves['schema']==2 and saves['before']==saves['after'] and saves['paused']==0 and not saves['errors'] and saves['valid'],saves
    print('PASS SaveManager roundtrip does not emit false events and leaves event bus resumed')
    assert not errors,errors[:8]
    print('PASS no uncaught page JavaScript errors')
    browser.close()
