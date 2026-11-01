"""Isolated admin-panel Chromium test: full-game button, 380 results, read-only game DOM audit."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess,json,shutil
root=Path(__file__).resolve().parent.parent
js='''import ui from './lib/admin-rc57-ui.js';import {runGameBatch,gameAuditInfo} from './lib/admin-rc57-whole-game.js';
process.env.RC57_ADMIN_PASSWORD='A very long browser-only admin password 2026';process.env.RC57_ADMIN_SECRET='A different browser-only admin secret for tests 2026';
const s={status(n){this.code=n;return this},setHeader(){},send(v){this.html=v;return this}};
await ui({method:'GET',headers:{}},s);
console.log(JSON.stringify({html:s.html,info:gameAuditInfo,batches:Array.from({length:Math.ceil(gameAuditInfo.total/20)},(_,i)=>runGameBatch({offset:i*20}))}));'''
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root,text=True))
pagehtml=(root/'index.html').read_text()
for width in [390,1440]:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':width,'height':850},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('about:blank')
    page.evaluate('''(v)=>{window.__game=v.game;window.__info=v.info;window.__batches=v.batches;
      window.__logged=false;window.fetch=async (path,opts={})=>{let code=200,content={ok:true,gameAudit:window.__info,live:{enabled:false,providers:[]}};
      if(path==='/'){return {status:200,ok:true,text:async()=>window.__game}};
      if(opts.method==='POST'){
       let x=JSON.parse(opts.body);if(x.action==='game-batch')content={ok:true,...window.__batches[x.offset/20]};
       else if(x.action==='login'){window.__logged=true;content={ok:true,gameAudit:window.__info};}
       else if(x.action==='logout')content={ok:true};
       else if(x.action==='batch')content={ok:true,offset:x.offset,total:60,results:[]};
       else{code=400;content={error:'unknown_action'}};
      }else if(!window.__logged){code=401;content={error:'login_required'}}
      return {status:code,ok:code===200,json:async()=>content};
      };}''',{'game':pagehtml,'batches':fixture['batches'],'info':fixture['info']})
    page.set_content(fixture['html'],wait_until='load')
    page.get_by_text('Logowanie administratora').wait_for()
    page.locator('#pass').fill('A very long browser-only admin password 2026')
    page.get_by_role('button',name='Zaloguj').click()
    page.locator('#gameRun').wait_for(state='visible')
    page.locator('#gameRun').click()
    page.get_by_text('Zakończono: 0 błędów.').wait_for(timeout=30000)
    assert page.locator('#gameDone').inner_text()=='380 / 380'
    assert page.locator('#gamePass').inner_text()=='380'
    assert page.locator('#gameFail').inner_text()=='0'
    with page.expect_download(timeout=15000) as d:
        page.locator('#gameExport').click()
    content=json.loads(Path(d.value.path()).read_text())
    assert content['complete'] is True and len(content['results'])==380
    page.locator('#uiRun').click()
    page.get_by_text('Sprawdzono 29 kontraktów ekranu; błędy: 0.').wait_for(timeout=30000)
    assert not errors,errors
    browser.close()
 print('PASS RC57.3 UI browser at',width,'px: authenticated full audit 380 cases, export JSON, 29 page contracts, no JS crashes')
