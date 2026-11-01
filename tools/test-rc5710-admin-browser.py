"""Private RC57.10 panel in real Chromium, isolated mock responses only."""
from pathlib import Path
import subprocess,json,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
js="""import ui from './lib/admin-rc57-ui.js';import {runStressBatch}from './lib/admin-rc57-stress.js';
process.env.RC57_ADMIN_PASSWORD='RC5710_Admin_Browser_Test_Password_012345';process.env.RC57_ADMIN_SECRET='RC5710_Admin_Browser_Test_Secret_012345678901';
const res={status(n){return this},setHeader(){},send(html){this.html=html}};ui({method:'GET',headers:{}},res);
console.log(JSON.stringify({html:res.html,batches:Object.fromEntries([0,20,40,60,80,100].map(n=>[n,runStressBatch(n)]))}));"""
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root,text=True))
for width in [390,1440]:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':width,'height':850},accept_downloads=True)
  issues=[];page.on('pageerror',lambda e:issues.append(str(e)))
  page.goto('about:blank')
  page.evaluate('''b=>{window.mock=b;window.logged=false;window.fetch=async(path,opts={})=>{
    let code=200,v={ok:true,live:{enabled:false,providers:[]},blind:{stages:[]},gameAudit:{total:380},playthrough:{scenarios:[]}};
    if(opts.method==='POST'){
      const r=JSON.parse(opts.body);
      if(r.action==='login')window.logged=true;
      else if(r.action==='stress-batch')v={ok:true,...window.mock[r.offset]};
      else{code=400;v={error:'unexpected_action'}};
    }else if(!window.logged){code=401;v={error:'login_required'}}
    return {ok:code===200,status:code,json:async()=>v}
  }}''',fixture['batches'])
  page.set_content(fixture['html'],wait_until='load')
  page.locator('#pass').fill('RC5710_Admin_Browser_Test_Password_012345')
  page.get_by_role('button',name='Zaloguj').click()
  page.locator('#stressRun').wait_for(state='visible')
  page.locator('#stressRun').click()
  page.get_by_text('Ukończono 120 prób.',exact=False).wait_for(timeout=25000)
  assert '0' in page.locator('#stressStatus').inner_text()
  with page.expect_download(timeout=10000) as d:page.locator('#stressExport').click()
  data=json.loads(Path(d.value.path()).read_text())
  assert data['complete'] and len(data['results'])==120
  assert not issues,issues
  print('PASS RC57.10 panel',width,'px: 120 stress QA results, export and zero browser errors')
  browser.close()
