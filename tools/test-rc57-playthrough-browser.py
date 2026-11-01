"""RC57.4 admin panel — drive the full 3-scenario playthrough button in Chromium.
Runs an isolated browser fixture; never contacts Supabase/production Vercel.
"""
from pathlib import Path
import subprocess,json,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
source="""import ui from './lib/admin-rc57-ui.js';import {runPlaythroughScenario,playthroughInfo} from './lib/admin-rc57-playthrough.js';
process.env.RC57_ADMIN_PASSWORD='RC57PlaythroughBrowserTestPassword123456789';
process.env.RC57_ADMIN_SECRET='RC57PlaythroughBrowserTestSecret12345678900000';
const response={status(n){this.code=n;return this},setHeader(){},send(v){this.html=v;return this}};
await ui({method:'GET',headers:{}},response);
console.log(JSON.stringify({html:response.html,info:playthroughInfo,results:Object.fromEntries(playthroughInfo.scenarios.map(x=>[x.id,runPlaythroughScenario(x.id)]))}));"""
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',source],cwd=root,text=True))
for width in [390,1440]:
  with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('about:blank')
    page.evaluate('''data=>{
      window.__rc574=data;window.__logged=false;
      window.fetch=async (path,opts={})=>{
        let code=200,content={ok:true,playthrough:window.__rc574.info,live:{enabled:false,providers:[]},gameAudit:{total:380}};
        if(opts.method==='POST'){
          const body=JSON.parse(opts.body);
          if(body.action==='login'){window.__logged=true;}
          else if(body.action==='playthrough-scenario'){content={ok:true,...window.__rc574.results[body.scenario]};}
          else if(body.action==='logout'){window.__logged=false;}
          else {code=400;content={error:'unknown_action'}};
        }else if(!window.__logged){code=401;content={error:'login_required'}}
        return {ok:code===200,status:code,json:async()=>content};
      };
    }''',{'info':fixture['info'],'results':fixture['results']})
    page.set_content(fixture['html'],wait_until='load')
    page.locator('#pass').fill('RC57PlaythroughBrowserTestPassword123456789')
    page.get_by_role('button',name='Zaloguj').click()
    page.locator('#playRun').wait_for(state='visible')
    page.locator('#playRun').click()
    page.get_by_text('Wszystkie 3 symulacje ukończone.').wait_for(timeout=30000)
    assert page.locator('#playDone').inner_text()=='3 / 3'
    assert page.locator('#playActions').inner_text()=='580'
    assert page.locator('#playFailed').inner_text()=='0'
    assert 'solid / returned / solid' in page.locator('#playVerdicts').inner_text()
    with page.expect_download(timeout=10000) as d:
      page.locator('#playExport').click()
    result=json.loads(Path(d.value.path()).read_text())
    assert result['complete'] is True and len(result['scenarios'])==3
    assert sum(len(s['steps']) for s in result['scenarios'])==580
    for s in result['scenarios']:
      assert s['summary']['completed'] is True
    assert not errors,errors
    browser.close()
    print('PASS RC57.4 browser panel at',width,'px; 3 paths, 580 steps, downloadable JSON, no JS errors')
