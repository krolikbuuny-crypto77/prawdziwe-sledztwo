"""Offline Chromium: repeated blocked AI requests back off and preserve signed offset."""
from pathlib import Path
import subprocess,json,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
script="""import ui from './lib/admin-rc57-ui.js';process.env.RC57_ADMIN_PASSWORD='TEST_DEMO_ADMIN_PASSWORD_12345678';process.env.RC57_ADMIN_SECRET='TEST_DEMO_ADMIN_SECRET_123456789';const res={status(n){this.code=n;return this},setHeader(){},send(v){this.html=v;return this}};ui({method:'GET',headers:{}},res);console.log(JSON.stringify({html:res.html}));"""
html=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=root,text=True))['html']
for width in (390,1440):
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('about:blank')
  page.evaluate('''() => {
   window.__clock=1000000;window.__calls=[];window.__logged=false;
   const native=window.setTimeout.bind(window);Date.now=()=>window.__clock;
   window.setTimeout=(fn,ms,...a)=>{window.__clock+=Math.max(0,ms);return native(fn,0,...a)};
   window.fetch=async (path,opts={})=>{
    const b=opts.method==='POST'?JSON.parse(opts.body):{};
    let status=200;
    let out={ok:true,live:{enabled:true,providers:['apinex-luna']},blind:{stages:[]},gameAudit:{total:380},playthrough:{scenarios:[]}};
    if(opts.method==='POST'){
     if(b.action==='login')window.__logged=true;
     else if(b.action==='live-step'){
      window.__calls.push({offset:b.offset,time:Date.now(),token:b.token});
      const count=window.__calls.filter(x=>x.offset===0).length;
      const blocked=b.offset===0&&count<=3;
      out={offset:b.offset,total:18,results:[{
       id:'AI-001',witness:'MAREK',question:'Gdzie byłeś?',answer:blocked?'':'W warsztacie.',
       status:blocked?'blocked':'pass',elapsedMs:8,detail:blocked?'provider_timeout':'ok',
       failureDiagnostics:blocked?{code:'provider_timeout',phase:'semantic-audit',upstreamStatus:504,providerCalls:1}:null
      }],nextToken:blocked?b.token:'signed-'+(b.offset+1),
      stopped:blocked?'provider_timeout':null,retryable:blocked,suggestedPauseSeconds:20};
     }
    }else if(!window.__logged){status=401;out={error:'no_session'}}
    return {ok:status===200,status,json:async()=>out};
   }
  }''')
  page.set_content(html,wait_until='load')
  page.locator('#pass').fill('TEST_DEMO_ADMIN_PASSWORD_12345678')
  page.locator('#loginForm button').click()
  page.locator('#liveConsent').check()
  page.locator('#runLive').click()
  for number,pause in [(1,20),(2,40),(3,80)]:
   page.get_by_text('Próba '+str(number)+' tego pytania.',exact=False).wait_for(timeout=14000)
   assert 'Wznów po '+str(pause)+' s' in page.locator('#liveStatus').inner_text()
   assert page.locator('#liveDone').inner_text().strip()=='0 / 18'
   assert page.locator('#liveBlocked').inner_text().strip()==str(number)
   assert page.locator('#liveFailed').inner_text().strip()=='0'
   assert 'etap: semantic-audit' in page.locator('#liveIssues').inner_text()
   page.locator('#resumeLive').click()
  page.get_by_text('Test zakończony',exact=False).wait_for(timeout=16000)
  assert page.locator('#liveDone').inner_text().strip()=='18 / 18'
  calls=page.evaluate('window.__calls')
  assert [x['offset'] for x in calls[:5]]==[0,0,0,0,1],calls[:5]
  assert all(x['token']==calls[0]['token'] for x in calls[:4])
  intervals=[calls[i+1]['time']-calls[i]['time'] for i in range(3)]
  assert intervals[0]>=20000 and intervals[1]>=40000 and intervals[2]>=80000,intervals
  with page.expect_download() as d:page.locator('#exportLive').click()
  report=json.loads(Path(d.value.path()).read_text())
  assert [x['effectivePauseSeconds'] for x in report['blockedAttempts']]==[20,40,80]
  assert report['summary']['blocked']==3 and report['complete']
  assert not errors,errors
  browser.close()
  print('PASS RC57.10.7 browser',width,'px: adaptive 20/40/80 s, same question & token, no false pass, reports')
