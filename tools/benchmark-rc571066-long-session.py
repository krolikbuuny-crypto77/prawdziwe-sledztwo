"""Local offline long-interrogation DOM/JS-heap stress benchmark (not a leak proof)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil, mimetypes, json, statistics, argparse
ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--baseline',type=Path,default=None);args=parser.parse_args()
report={'release':'RC57.10.66','scenario':'1600 stored turns; 220 refreshes with changing transcript and evidence; network disabled','results':[],'errors':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--js-flags=--expose-gc','--enable-precise-memory-info'])
 for name,root in ([('before',args.baseline.resolve()),('after',ROOT)] if args.baseline else [('after',ROOT)]):
  c=browser.new_context(viewport={'width':1366,'height':768},reduced_motion='reduce',locale='pl-PL',timezone_id='Europe/Warsaw')
  pg=c.new_page(); pg.on('pageerror',lambda err:report['errors'].append(str(err)))
  def route_handler(route):
   url=route.request.url
   if not url.startswith('https://qa.game/'):
    route.abort();return
   rel=url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]
   f=(root/rel).resolve()
   if f.is_relative_to(root.resolve()) and f.is_file():
    route.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
   else:route.fulfill(status=404,body='')
  pg.route('**/*',route_handler)
  html=(root/'index.html').read_text('utf8').replace('<head>','<head><base href="https://qa.game/">',1)
  pg.set_content(html,wait_until='load',timeout=60000)
  result=pg.evaluate('''()=>{
    showTab('interview');const id=STATE.activeChar;
    let turns=Array.from({length:1600},(_,i)=>({role:i%2?'npc':'player',text:`Wypowiedź ${i}: rutynowe zadania, czas i źródła informacji.`}));
    STATE.dialogues[id]=turns;CHAT_VISIBLE[id]=100;
    renderChat();if(window.gc)window.gc();
    const log=document.getElementById('chatLog');
    const startingHeap=performance.memory?.usedJSHeapSize??null;
    const durations=[],countSamples=[],changeDurations=[];
    let mutationCount=0;
    const mo=new MutationObserver(()=>{});mo.observe(log,{subtree:true,childList:true});
    for(let i=0;i<220;i++){
      // Keep the canonical transcript capped as in normal game code.
      if(i%2===0){turns.push({role:'player',text:`Pytanie uzupełniające ${i}`},{role:'npc',text:`Odpowiedź świadka ${i}`});turns.splice(0,2);}
      const start=performance.now();renderChat();
      durations.push(performance.now()-start);
      mutationCount+=mo.takeRecords().length;
      if(i%20===0){countSamples.push(log.querySelectorAll(':scope > .bubble').length);}
      if(i%5===0){showTab('overview');showTab('interview');}
    }
    mo.disconnect();
    if(window.gc)window.gc();
    const afterHeap=performance.memory?.usedJSHeapSize??null;
    return {turns:turns.length,visible:log.querySelectorAll(':scope > .bubble').length,
      maxVisible:Math.max(...countSamples),heapAfterGCStart:startingHeap,heapAfterGCEnd:afterHeap,
      heapDifferenceAfterGC:startingHeap!==null&&afterHeap!==null?afterHeap-startingHeap:null,
      medianMs:durations.sort((a,b)=>a-b)[110],p95Ms:durations[208],mutations:mutationCount,
      qa:window.PS66_CHAT_QA?.metrics?.()??null,
      active:STATE.tab,hasLast:log.textContent.includes('Odpowiedź świadka 218')};
  }''')
  result['version']=name;report['results'].append(result)
  if result['turns']!=1600 or result['visible']>100 or not result['hasLast'] or result['active']!='interview':report['errors'].append(f'{name}: assertion failed: {result}')
  print(name,'median',round(result['medianMs'],1),'p95',round(result['p95Ms'],1),'heap_delta',result['heapDifferenceAfterGC'],'mutations',result['mutations'],flush=True)
  c.close()
 browser.close()
q=ROOT/'QA-RC571066'/'long-session-1366.json';q.parent.mkdir(exist_ok=True)
q.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('PASS' if not report['errors'] else 'FAIL',report['errors'])
if report['errors']:raise SystemExit(1)
