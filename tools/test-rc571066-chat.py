"""RC57.10.66 — no-network Chromium regression and long transcript render benchmark.
Does not invoke external AI or mutate the authoritative game's rules.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import argparse, mimetypes, shutil, json, statistics

ROOT = Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--baseline',type=Path,default=None)
parser.add_argument('--output',type=Path,default=ROOT/'QA-RC571066'/'chat-regression.json')
parser.add_argument('--widths',default='390,1366')
a=parser.parse_args()
report={'release':'RC57.10.66','baseline':'RC57.10.65' if a.baseline else None,'runs':[],'errors':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in map(int,a.widths.split(',')):
  for version, root in ([('before',a.baseline.resolve()),('after',ROOT.resolve())] if a.baseline else [('after',ROOT.resolve())]):
   context=browser.new_context(viewport={'width':width,'height':844 if width==390 else 800},device_scale_factor=1,locale='pl-PL',reduced_motion='reduce',timezone_id='Europe/Warsaw')
   page=context.new_page()
   page.on('pageerror',lambda error,v=version,w=width:report['errors'].append(f'{v}-{w}: {error}'))
   def route_handler(route):
    url=route.request.url
    if not url.startswith('https://qa.game/'):
     route.abort();return
    rel=url.split('qa.game/',1)[1].split('?',1)[0].split('#',1)[0]
    f=(root/rel).resolve()
    if f.is_relative_to(root) and f.is_file():
     route.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
    else:route.fulfill(status=404,body='')
   page.route('**/*',route_handler)
   html=(root/'index.html').read_text('utf8').replace('<head>','<head><base href="https://qa.game/">',1)
   page.set_content(html,wait_until='load',timeout=60000)
   result=page.evaluate('''()=>{
    showTab('interview');
    const id=STATE.activeChar, c=CONTENT.characters.find(x=>x.id===id);
    // Keep this transient data out of save/autosave: the benchmark is isolated.
    const make=(n)=>Array.from({length:n},(_,i)=>({role:i%2?'npc':'player',text:`Pytanie ${i}: opis zadania i sprawdzalny szczegół rozmowy testowej ${i}` }));
    const log=document.getElementById('chatLog'),records={};
    STATE.dialogues[id]=make(1000);CHAT_VISIBLE[id]=1200;
    renderChat();
    records.initialMarkup=log.innerHTML;
    const first=log.querySelector('.bubble');
    const times=[];
    let mutations=0;
    const observer=new MutationObserver(()=>{});
    observer.observe(log,{childList:true,subtree:true});
    for(let n=0;n<20;n++){
      const t=performance.now();renderChat();times.push(performance.now()-t);
      mutations+=observer.takeRecords().length;
    }
    records.stableNode=first===log.querySelector('.bubble');
    records.stableMutations=mutations;
    records.medianMs=times.sort((a,b)=>a-b)[10];
    records.p95Ms=times[19];
    records.oldContentCorrect=log.querySelectorAll('.bubble').length===1000;
    // An edited turn must not be hidden by DOM caching.
    STATE.dialogues[id][999].text='Odpowiedź po korekcie';renderChat();
    records.editedContentCorrect=log.querySelector('.bubble:last-child').textContent.includes('Odpowiedź po korekcie');
    // An AI pending bubble is a presentation-only mutation; canonical transcript wins.
    const last=log.querySelector('.bubble:last-child');last.replaceChildren(document.createElement('em'));
    renderChat();records.externalMutationRepaired=log.querySelector('.bubble:last-child').textContent.includes('Odpowiedź po korekcie');
    // Roll a capped 60-message viewport forward by two messages.
    CHAT_VISIBLE[id]=60;renderChat();
    const visibleFirst=log.querySelector('.bubble');
    const beforeMsg=log.querySelectorAll('.bubble');
    const retained=beforeMsg[2];
    const beforeLen=beforeMsg.length;
    STATE.dialogues[id].push({role:'player',text:'NOWE pytanie dowodowe'}, {role:'npc',text:'NOWA odpowiedź świadoma ograniczeń'});
    renderChat();
    records.rollingCount=log.querySelectorAll('.bubble').length;
    records.rollingRetained=log.querySelector('.bubble')===retained;
    records.rollingTextCorrect=log.textContent.includes('NOWA odpowiedź świadoma ograniczeń') && !log.textContent.includes('Pytanie 940:');
    records.olderButtonText=log.querySelector('#chatOlder')?.textContent;
    const beforeScroll=log.scrollTop;
    log.scrollTop=22;renderChat();records.scrollStable=log.scrollTop===22 || log.scrollHeight<=log.clientHeight;
    log.querySelector('#chatOlder').click();
    records.olderWorks=log.querySelectorAll('.bubble').length>beforeLen;
    records.witnessSwitchRestores=(()=>{
       const other=CONTENT.characters.find(x=>x.id!==id);
       STATE.activeChar=other.id;renderChat();
       STATE.activeChar=id;renderChat();
       return log.textContent.includes('NOWE pytanie dowodowe');
    })();
    records.metrics=window.PS66_CHAT_QA?.metrics?.()||null;
    return records;
   }''')
   result.update(version=version,width=width)
   report['runs'].append(result)
   if version=='after':
    for key in ['stableNode','oldContentCorrect','editedContentCorrect','externalMutationRepaired','rollingRetained','rollingTextCorrect','scrollStable','olderWorks','witnessSwitchRestores']:
     if result.get(key) is not True:report['errors'].append(f'after-{width}:{key}: {result.get(key)}')
    if result['stableMutations']!=0:report['errors'].append(f'after-{width}: stable mut {result["stableMutations"]}')
   else:
    if not result['oldContentCorrect'] or not result['editedContentCorrect']:report['errors'].append(f'before-{width}: core baseline content')
   print(version,width,'mutations',mutations if False else result['stableMutations'],'median',round(result['medianMs'],2),'ms',flush=True)
   context.close()
 browser.close()
for width in map(int,a.widths.split(',')):
 x=[r for r in report['runs'] if r['width']==width]
 if a.baseline and len(x)==2 and x[0]['initialMarkup']!=x[1]['initialMarkup']:report['errors'].append(f'{width}: initial transcript HTML differs')
a.output.parent.mkdir(parents=True,exist_ok=True)
a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('PASS' if not report['errors'] else 'FAIL', len(report['errors']),report['errors'][:8],flush=True)
if report['errors']:raise SystemExit(1)
