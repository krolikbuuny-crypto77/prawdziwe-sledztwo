"""Isolated Chromium smoke of RC57.5 blind panel with two fake model reports, no external requests."""
from pathlib import Path
import json,subprocess,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
js="""import ui from './lib/admin-rc57-ui.js';process.env.RC57_ADMIN_PASSWORD='RC57BlindTestPassword1234567890';process.env.RC57_ADMIN_SECRET='RC57BlindTestSecret1234567890123456789';const res={status(n){this.code=n;return this},setHeader(){},send(v){this.html=v;return this}};ui({method:'GET',headers:{}},res);console.log(JSON.stringify({html:res.html}));"""
html=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root,text=True))['html']
for w in [390,1440]:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':w,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('about:blank')
  page.evaluate('''() => {
   window.__calls=[];window.__logged=false;
   window.fetch=async(path,opts={})=>{
    const body=opts.method==='POST'?JSON.parse(opts.body):{};let code=200;
    let val={ok:true,live:{enabled:true,providers:['apinex-luna']},gameAudit:{total:380},playthrough:{scenarios:[]},blind:{version:'RC57.5',stages:[{id:'initial'},{id:'complete'}]}};
    if(opts.method==='POST'){
     if(body.action==='login')window.__logged=true;
     else if(body.action==='blind-stage'){
      window.__calls.push(body);
      val={ok:true,blind:true,phase:body.stage,decision:{suspectId:body.stage==='initial'?null:'MAGDALENA',certainty:'medium',evidenceIds:['MED-01','MED-02','ADM-01'],reasoning:'Na podstawie dokumentów.',counterargument:'Karta nie identyfikuje osoby.',missingProof:'Bezpośredni świadek.',alternativeId:'KAMIL'},grade:{graded:body.stage==='complete',assessment:body.stage==='complete'?'canon_match_with_source_errors':'not_graded',dimensions:{verdict:{label:body.stage==='complete'?'Wskazany sprawca jest zgodny z kanonem':'Bez oceny nazwiska na etapie początkowym'},evidence:{label:body.stage==='complete'?'Wykryto nieistniejące lub niedostępne źródła':'Identyfikatory źródeł są poprawne; interpretacja wymaga kontroli'},reasoning:{label:'Wykryto twierdzenia wymagające kontroli rozumowania'}}},qa:{findings:body.stage==='complete'?[{code:'unknown_document_in_text',detail:'Nieistniejący LAB-014'}]:[]},integrity:{documents:body.stage==='initial'?13:78}};
     }else if(body.action==='logout')window.__logged=false;
     else {code=400;val={error:'unknown_action'}};
    }else if(!window.__logged){code=401;val={error:'login_required'}};
    return {ok:code===200,status:code,json:async()=>val};
   }
  }''')
  page.set_content(html,wait_until='load')
  page.locator('#pass').fill('RC57BlindTestPassword1234567890')
  page.get_by_role('button',name='Zaloguj').click()
  page.locator('#blindRun').wait_for(state='visible')
  assert page.locator('#blindRun').is_disabled()
  page.locator('#blindConsent').check()
  assert page.locator('#blindRun').is_enabled()
  page.locator('#blindRun').click()
  page.get_by_text('Zakończono dwie niezależne analizy.',exact=False).wait_for(timeout=15000)
  assert len(page.locator('#blindResults .case').all())==2
  assert page.get_by_text('1. Trafność wskazania:',exact=False).count()==2
  assert page.get_by_text('2. Poprawność dowodowa:',exact=False).count()==2
  assert page.get_by_text('3. Jakość rozumowania:',exact=False).count()==2
  assert page.get_by_text('Nieistniejący LAB-014',exact=False).count()>=1
  assert page.evaluate('window.__calls.map(x=>x.stage)')==['initial','complete']
  with page.expect_download(timeout=10000) as download:
   page.locator('#blindExport').click()
  report=json.loads(Path(download.value.path()).read_text())
  assert report['complete'] and len(report['stages'])==2
  assert not errors,errors
  browser.close()
  print('PASS blind panel Chromium',w,'px; consent, 13/78 stages, JSON export, zero JS errors')
