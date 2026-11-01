"""RC57 UI smoke test with isolated API fixtures (not production browser integration)."""
from pathlib import Path
import json,subprocess,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
js='''import ui from "./lib/admin-rc57-ui.js";import {runBatch} from "./lib/admin-rc57-suite.js";
process.env.RC57_ADMIN_PASSWORD="OnlyForLocalBrowserTests_RC57_0254";
process.env.RC57_ADMIN_SECRET="OnlyForLocalBrowserTests_Secret_RC57_abc123abc123";
const s={status(n){this.code=n;return this},setHeader(){},send(x){this.html=x;return this}};
await ui({method:"GET",headers:{}},s);
console.log(JSON.stringify({html:s.html,batches:[0,20,40].map(offset=>runBatch({mode:"quick",offset}))}));'''
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root,text=True))
with sync_playwright() as p:
    browser_path=shutil.which('chromium') or shutil.which('google-chrome') or None
    browser=p.chromium.launch(headless=True,**({'executable_path':browser_path} if browser_path else {}),args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('about:blank')
    page.evaluate("""(batches)=>{window.fetch=async (_path,options={})=>{let result={};let status=200;
      if(!options.method){status=401;result={error:'login_required'};}
      else{const data=JSON.parse(options.body);
       if(data.action==='login')result={ok:true};
       else if(data.action==='batch')result={ok:true,...batches[data.offset/20]};
       else if(data.action==='logout')result={ok:true};
       else{status=400;result={error:'unknown_action'}}}
      return {ok:status===200,status,json:async()=>result};};}""",fixture['batches'])
    page.set_content(fixture['html'],wait_until='load')
    page.get_by_text('Logowanie administratora').wait_for()
    assert not page.locator('#dashboard').is_visible()
    page.locator('#pass').fill('OnlyForLocalBrowserTests_RC57_0254')
    page.get_by_role('button',name='Zaloguj').click()
    page.get_by_role('button',name='Uruchom test').wait_for()
    page.get_by_role('button',name='Uruchom test').click()
    page.get_by_text('Test zakończony.',exact=False).wait_for(timeout=20000)
    assert '60 / 60' in page.locator('#done').inner_text()
    assert page.get_by_role('button',name='Eksportuj JSON').is_enabled()
    page.get_by_role('button',name='Wyloguj').click()
    page.get_by_text('Logowanie administratora').wait_for()
    assert not errors,errors
    browser.close()
print('RC57 PASS browser: private login display, mobile 390px, 60-case progress, export, logout (mocked API).')
