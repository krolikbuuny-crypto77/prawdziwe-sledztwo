"""RC57.6 browser regression: mock API rate limit, manual resume and QA output. No network."""
from pathlib import Path
import subprocess,json,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
script="""import ui from './lib/admin-rc57-ui.js';process.env.RC57_ADMIN_PASSWORD='RC57BlindTestPassword1234567890';process.env.RC57_ADMIN_SECRET='RC57BlindTestSecret1234567890123456789';const res={status(n){this.code=n;return this},setHeader(){},send(v){this.html=v;return this}};ui({method:'GET',headers:{}},res);console.log(JSON.stringify({html:res.html}));"""
html=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=root,text=True))['html']
for width in [390,1440]:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('about:blank')
  page.evaluate('''() => {
   window.__log=[];window.__logged=false;window.__blockedOnce=false;
   // Mock accelerated clock: verifies the existing 429 resume flow without waiting 35s per test step.
   window.__qaTime=Date.now();Date.now=()=>{window.__qaTime+=40000;return window.__qaTime};
   window.fetch=async(path,opts={})=>{
    const body=opts.method==='POST'?JSON.parse(opts.body):{};let status=200;
    let val={ok:true,live:{enabled:true,providers:['apinex-luna']},blind:{stages:[]},gameAudit:{total:380},playthrough:{scenarios:[]}};
    if(opts.method==='POST'){
     if(body.action==='login')window.__logged=true;
     else if(body.action==='live-step'){
      window.__log.push({offset:body.offset,token:body.token});
      const blocked=body.offset===1&&!window.__blockedOnce;
      if(blocked)window.__blockedOnce=true;
      val={ok:true,offset:body.offset,total:18,results:[{id:'AI-'+String(body.offset+1).padStart(3,'0'),witness:'MAREK',question:'Jaką rolę?',answer:blocked?'':'Pełniłem rolę kierownika.',elapsedMs:15,status:blocked?'blocked':'pass',detail:blocked?'provider_rate_limited':'ok',qa:{findings:body.offset===2?[{code:'memory_evasion',detail:'Odmowa cytowania własnych słów.'}]:[]}}],nextToken:blocked?body.token:('signed-'+(body.offset+1)),stopped:blocked?'provider_rate_limited':null,retryable:blocked,suggestedPauseSeconds:60};
     }
     else if(body.action==='logout')window.__logged=false;
    }else if(!window.__logged){status=401;val={error:'login_required'}}
    return {ok:status===200,status,json:async()=>val};
   }
  }''')
  page.set_content(html,wait_until='load')
  page.locator('#pass').fill('RC57BlindTestPassword1234567890')
  page.get_by_role('button',name='Zaloguj').click()
  page.locator('#runLive').wait_for(state='visible')
  page.locator('#liveConsent').check()
  page.locator('#runLive').click()
  page.get_by_text('Żądanie dostawcy zostało wstrzymane',exact=False).wait_for(timeout=12000)
  assert page.locator('#liveDone').inner_text().strip()=='1 / 18'
  assert page.locator('#liveBlocked').inner_text().strip()=='1'
  assert page.locator('#liveFailed').inner_text().strip()=='0'
  assert page.locator('#resumeLive').is_enabled()
  page.locator('#resumeLive').click()
  page.get_by_text('Test zakończony',exact=False).wait_for(timeout=15000)
  assert page.locator('#liveDone').inner_text().strip()=='18 / 18'
  assert page.locator('#liveIssues').inner_text().count('memory_evasion')==1
  seq=page.evaluate('window.__log')
  assert [x['offset'] for x in seq][:3]==[0,1,1]
  assert seq[1]['token']==seq[2]['token']
  with page.expect_download(timeout=12000) as download:page.locator('#exportLive').click()
  data=json.loads(Path(download.value.path()).read_text())
  assert data['complete'] and data['summary']['blocked']==1
  assert len(data['results'])==18
  assert len(data['blockedAttempts'])==1
  assert not errors,errors
  browser.close()
  print('PASS RC57.6 Chromium',width,'px: 429 pause, same-offset resume, QA warning, JSON export')
