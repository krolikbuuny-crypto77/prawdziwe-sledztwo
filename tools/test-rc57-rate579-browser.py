"""RC57.9 browser verification of 7-test-questions/minute shared pacing with virtual clock.
Offline: fake model API, accelerated timers. Does not invoke real Apinex.
"""
from pathlib import Path
import json,subprocess,shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
script="""import ui from './lib/admin-rc57-ui.js';process.env.RC57_ADMIN_PASSWORD='RC57RateTestPassword1234567890';process.env.RC57_ADMIN_SECRET='RC57RateTestSecret1234567890123456789';const res={status(n){this.code=n;return this},setHeader(){},send(v){this.html=v;return this}};ui({method:'GET',headers:{}},res);console.log(JSON.stringify({html:res.html}));"""
html=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=root,text=True))['html']
for width in (390,1440):
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':width,'height':850},accept_downloads=True)
  errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
  page.goto('about:blank')
  page.evaluate('''() => {
    window.__clock=1000000; window.__starts=[];window.__logged=false;window.__blockedOnce=false;
    const realTimeout=window.setTimeout.bind(window);
    Date.now=()=>window.__clock;
    // Skip real idle time while preserving the exact requested delay.
    window.setTimeout=(fn,ms,...args)=>{window.__clock+=Math.max(0,ms);return realTimeout(fn,0,...args)};
    window.fetch=async(path,opts={})=>{
      const body=opts.method==='POST'?JSON.parse(opts.body):{};
      let status=200;
      let val={ok:true,live:{enabled:true,providers:['apinex-luna','apinex-jev']},blind:{stages:[]},gameAudit:{total:380},playthrough:{scenarios:[]}};
      if(opts.method==='POST'){
        if(body.action==='login')window.__logged=true;
        else if(body.action==='live-step'){
          window.__starts.push({type:'live',offset:body.offset,time:Date.now()});
          const blocked=body.offset===4&&!window.__blockedOnce;
          if(blocked)window.__blockedOnce=true;
          window.__clock+=1500;
          val={ok:true,offset:body.offset,total:18,results:[{id:'AI-'+String(body.offset+1).padStart(3,'0'),witness:'MAREK',question:'Gdzie?',answer:blocked?'':'Byłem w biurze.',elapsedMs:1500,status:blocked?'blocked':'pass',detail:blocked?'provider_rate_limited':'ok'}],nextToken:blocked?body.token:('signed-'+(body.offset+1)),stopped:blocked?'provider_rate_limited':null,retryable:blocked,suggestedPauseSeconds:blocked?60:0};
        }else if(body.action==='blind-stage'){
          window.__starts.push({type:'blind',stage:body.stage,time:Date.now()});
          window.__clock+=1500;
          val={ok:true,blind:true,phase:body.stage,decision:{suspectId:body.stage==='complete'?'MAGDALENA':null,certainty:'medium',evidenceIds:['MED-01'],reasoning:'Analiza.',counterargument:'Inny podejrzany.',missingProof:'Brak.'},grade:{graded:false},integrity:{documents:body.stage==='initial'?13:78}};
        }
      }else if(!window.__logged){status=401;val={error:'login_required'}};
      return {ok:status===200,status,json:async()=>val};
    };
  }''')
  page.set_content(html,wait_until='load')
  page.locator('#pass').fill('RC57RateTestPassword1234567890')
  page.get_by_role('button',name='Zaloguj').click()
  page.locator('#runLive').wait_for(state='visible')
  page.locator('#liveConsent').check()
  page.locator('#runLive').click()
  page.get_by_text('Limit API lub timeout',exact=False).wait_for(timeout=15000)
  assert page.locator('#liveDone').inner_text().strip()=='4 / 18'
  page.locator('#resumeLive').click()
  page.get_by_text('Test zakończony',exact=False).wait_for(timeout=15000)
  assert page.locator('#liveDone').inner_text().strip()=='18 / 18'
  page.locator('#blindConsent').check()
  page.locator('#blindRun').click()
  page.get_by_text('Zakończono dwie niezależne analizy.',exact=False).wait_for(timeout=15000)
  calls=page.evaluate('window.__starts')
  assert len(calls)==21,len(calls)  # 18 successful + 1 retryable 429 + 2 blind stages
  intervals=[b['time']-a['time'] for a,b in zip(calls,calls[1:])]
  assert min(intervals)>=8572,intervals
  for i in range(len(calls)):
   assert sum(0<=calls[i]['time']-x['time']<60000 for x in calls[:i+1])<=7,calls
  blocked_time=next(x['time'] for x in calls if x['type']=='live' and x['offset']==4)
  retry_time=[x['time'] for x in calls if x['type']=='live' and x['offset']==4][1]
  assert retry_time-blocked_time>=61500,(blocked_time,retry_time)
  assert calls[-2]['stage']=='initial' and calls[-1]['stage']=='complete'
  assert not errors,errors
  with page.expect_download(timeout=10000) as d:page.locator('#exportLive').click()
  report=json.loads(Path(d.value.path()).read_text())
  assert report['rateLimit']['maxQuestionsPerMinute']==7
  assert report['complete'] and len(report['results'])==18 and len(report['blockedAttempts'])==1
  browser.close()
  print('PASS RC57.9',width,'px: 7 questions/rolling minute, 429 cooldown, resume, blind shared pacing, JSON')
