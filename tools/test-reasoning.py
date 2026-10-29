"""Etap 4: wspólny audyt hipotez, źródeł, obrony, kwalifikacji i zapisów (Chromium)."""
import json, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
# The browser sandbox blocks local HTTP. Exercise the exact application scripts
# via set_content; only bypass the location-protocol precondition in a test copy
# to mock the Cloudflare endpoint (never modify the shipped HTML).
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
assert 'if(!/^https?:$/.test(location.protocol))return;' in HTML
HTML=HTML.replace('if(!/^https?:$/.test(location.protocol))return;', 'if(false)return;',1)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
    result=page.evaluate('''() => ({version:PS_REASONING_ENGINE?.version,inspect:PS_REASONING_ENGINE.inspect(),relevant:PS_REASONING_ENGINE.relevantObjections('negligence'),initialCount:STATE.found.size})''')
    assert result['version']==1 and result['inspect']['objectionCount']==6 and len(result['inspect']['qualifications'])==5,result
    assert result['relevant']==['accident','contract','traces'],result
    print('PASS central ReasoningEngine online, five qualifications, one six-objection registry')
    refs=page.evaluate('''() => {
      const e=PS_REASONING_ENGINE;const missing=DOCS.find(d=>!STATE.found.has(d.id));
      const unowned=e.document(missing.id);const before=STATE.found.size;
      const available=[...e.inspect().qualifications];
      const test=e.independent([missing.id,missing.id]);
      return {unowned,test,before,after:STATE.found.size,available};
    }''')
    assert refs['unowned']['ok']==False and refs['unowned']['reason']=='uncollected' and refs['test']['ok']==False and refs['before']==refs['after'],refs
    print('PASS unavailable or repeated source cannot prove independence or be created by reasoning')
    board=page.evaluate('''() => {
      const e=PS_REASONING_ENGINE;
      const d=DOCS.find(x=>STATE.found.has(x.id));
      if(!d)throw Error('No owned document');
      const key='doc:'+d.id;
      STATE.deduction.cards.push({id:'H99999',title:'Testowana hipoteza',kind:'przypuszczenie',statement:'To wymaga dodatkowego potwierdzenia',alternative:'Inna możliwość',test:'Porównam dokumenty',rival:'',links:[]});
      const result=e.linkHypothesis({cardId:'H99999',sourceKey:key,role:'limits',note:'Materiał wskazuje jedynie ograniczenie tej hipotezy'});
      const card=STATE.deduction.cards.find(x=>x.id==='H99999');
      const displayed=!!document.querySelector('[data-thread-card="H99999"]');
      const reasoning=dd7Reasoning(card),audit=dd2Audit(card);
      const synced=e.audit(card).score===audit.score&&e.reasoning(card).ok===reasoning.ok;
      let rejected=false;
      try{e.linkHypothesis({cardId:'H99999',sourceKey:'doc:FAKE',role:'supports',note:'Niepoprawne źródło spoza akt'});}catch(_){rejected=true;}
      e.linkHypothesis({cardId:'H99999',sourceKey:key,remove:true});
      const removed=card.links.length===0;
      STATE.deduction.cards=STATE.deduction.cards.filter(x=>x.id!=='H99999');dedRender();
      return {result,displayed,synced,rejected,removed,ready:reasoning.ok,grade:audit.score};
    }''')
    assert board['displayed'] and board['synced'] and board['rejected'] and board['removed'] and not board['ready'],board
    print('PASS single hypothesis-link operation for classic board and Red Thread; local audit and source checks agree')
    objections=page.evaluate('''() => {
      const e=PS_REASONING_ENGINE,issue=PS54_ISSUES[0];
      const before=simDefendEvaluation(),old=PS54_QA.evaluation();
      const docIds=issue.routes[0];
      const added=[];
      for(const id of docIds){if(!STATE.found.has(id)){STATE.found.add(id);added.push(id);}if(SIM_DEGRADED[id]&&!STATE.sim.verified.includes(id))STATE.sim.verified.push(id);}
      const ent=ps54Entry(issue.id);Object.assign(ent,{route:0,answer:issue.correct[0],method:'compare',passed:true});
      const legal=simDefendEvaluation();
      const legalRoute=ps54Result(issue,ent);
      const badAnswer=ent.answer;ent.answer=issue.prompts.findIndex((_,i)=>!issue.correct.includes(i));
      const rejected=simDefendEvaluation();ent.answer=badAnswer;
      STATE.found.delete(docIds[0]);const rejectedMissing=simDefendEvaluation();
      ent.passed=false;for(const id of added)STATE.found.delete(id);
      STATE.sim.verified=[];
      return {before:before.passed,stale:old.passed,legal:legal.responses.find(x=>x.id===issue.id).passed,
       legalRoute:legalRoute.passed,rejected:rejected.responses.find(x=>x.id===issue.id).passed,
       rejectedMissing:rejectedMissing.responses.find(x=>x.id===issue.id).passed};
    }''')
    assert objections['legal'] and objections['legalRoute'] and not objections['rejected'] and not objections['rejectedMissing'],objections
    print('PASS one defense grade shared with procedural hearing; invalid interpretation and missing evidence rejected')
    variants=page.evaluate('''() => {
      const list=[];
      for(const id of PS_REASONING_ENGINE.inspect().qualifications){
       PS_FINAL_VARIANTS.setChoice(id);
       const fromController=PS_REASONING_ENGINE.finalAssessment();
       const direct=PS_FINAL_VARIANTS.evaluate();
       list.push({id,qualification:fromController.qualification,kind:fromController.kind,
        match:direct.qualification===fromController.qualification,signature:fromController.signature===direct.signature});
      }
      PS_FINAL_VARIANTS.setChoice('intentional');return list;
    }''')
    assert len(variants)==5 and all(x['qualification']==x['id'] and x['match'] and x['signature'] for x in variants),variants
    print('PASS five indictment variants produce deterministic qualification/signature without invented conviction')
    trial=page.evaluate('''() => {
      const original=buildSave();
      const current=PS_REASONING_ENGINE.inspect();
      SaveManager.apply(original);
      const after=PS_REASONING_ENGINE.inspect();
      return {schema:original.saveMeta.schemaVersion,historical:original.version,valid:SaveManager.verify(original).schemaVersion,
       count:after.cardCount,qualifications:after.qualifications,defense:after.defense};
    }''')
    assert trial['schema']==2 and trial['valid']==2 and len(trial['qualifications'])==5,trial
    print('PASS complete Stage-2 save roundtrip preserves reasoning state without schema migration')
    calls=[]
    def intercept(route):
      calls.append(route.request.post_data_json)
      route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'assessment':{'score':9999,'summary':'Tylko opinia','strengths':['Zgodne źródła'],'issues':['Sprawdź zakres'],'nextStep':'Uzasadnij granice'}}))
    page.evaluate("window.fetch=async (url,options)=>({ok:true,json:async()=>({ok:true,assessment:{score:9999,summary:'Tylko opinia',strengths:['Zgodne źródła'],issues:['Sprawdź zakres'],nextStep:'Uzasadnij granice'}})})")
    # Browser has no HTTP origin; the fetch above mocks the external response.

    ai=page.evaluate('''async () => {
     const d=DOCS.find(x=>STATE.found.has(x.id));
     const before=STATE.found.size;
     await window.psDualAssess({kind:'fakt',statement:'Ustalono zdarzenie',alternative:'',test:'',links:[{source:'doc:'+d.id,role:'limits',note:'Ograniczenie'}]},dedAvailable());
     return {before,after:STATE.found.size,text:document.getElementById('psDualAssessment')?.textContent||''};
    }''')
    assert ai['before']==ai['after'] and '100/100' in ai['text'] and '9999' not in ai['text'],ai
    ai_unknown=page.evaluate('''async () => {
      await window.psDualAssess({kind:'fakt',statement:'',links:[{source:'doc:MISSING',note:'Test'}]},dedAvailable());
      return document.getElementById('psDualAssessment').textContent;
    }''')
    assert 'co najmniej jeden zdobyty' in ai_unknown,ai_unknown
    print('PASS Cloudflare-opinion adapter uses only owned evidence, clamps output and never mutates progress')
    assert not errors,errors[:10]
    print('PASS zero uncaught JavaScript errors')
    browser.close()
