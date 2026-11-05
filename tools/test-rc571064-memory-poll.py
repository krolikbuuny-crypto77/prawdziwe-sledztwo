"""RC57.10.64: ensure idle interrogation-memory polling is quiet but state changes render.

Use --root /path/to/previous for a non-asserting historical comparison. No external AI requests.
"""
import argparse, json, mimetypes, shutil, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--root',default=str(HERE))
parser.add_argument('--compare-only',action='store_true')
args=parser.parse_args()
ROOT=Path(args.root).resolve()
report={'root':ROOT.name,'mode':'baseline comparison' if args.compare_only else 'RC57.10.64 regression','tests':[],'errors':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1366]:
  ctx=browser.new_context(viewport={'width':width,'height':844 if width==390 else 768},device_scale_factor=1,locale='pl-PL')
  ctx.add_init_script('''(()=>{
   const original=window.setInterval;
   window.setInterval=function(fn,delay,...args){
    if(delay===3400 && typeof fn==='function'){
     window.__rc42Tick=fn;return 999998;
    }
    return original.call(this,fn,delay,...args);
   };
  })();''')
  page=ctx.new_page();page.on('pageerror',lambda e,width=width:report['errors'].append(f'{width}px: {e}'))
  def route(req):
   url=req.request.url
   if not url.startswith('https://qa.game/'):
    req.abort('blockedbyclient');return
   relative=url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]
   file=(ROOT/relative).resolve()
   if file.is_relative_to(ROOT) and file.is_file():
    req.fulfill(status=200,body=file.read_bytes(),content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
   else:req.fulfill(status=404,body='')
  page.route('**/*',route)
  html=(ROOT/'index.html').read_text('utf8').replace('<head>','<head><base href="https://qa.game/">',1)
  page.set_content(html,wait_until='load',timeout=60000)
  assert page.evaluate("() => typeof __rc42Tick==='function' && !!window.PS_RC42"),'timer interception failed'
  page.evaluate("() => showTab('interview')")
  result=page.evaluate('''()=>{
   const panel=document.getElementById('ps42MemoryItems');
   const summary=document.getElementById('ps42MemorySummary');
   let changes=0;
   const mo=new MutationObserver(records=>changes+=records.length);
   mo.observe(panel,{childList:true,subtree:true,characterData:true});
   for(let i=0;i<100;i++)__rc42Tick();
   // Consume pending MutationObserver records before returning.
   changes+=mo.takeRecords().length;
   const idleChanges=changes;
   const before=summary.textContent;
   const id=STATE.activeChar;
   const log=STATE.dialogues[id];
   log.push({role:'player',text:'Czy zna pan godzinę odjazdu?'});
   __rc42Tick();
   const updated=summary.textContent.includes('Zadane pytania: 1') && panel.textContent.includes('godzinę odjazdu');
   log[log.length-1].text='Czy zna pan godzinę przyjazdu?';
   __rc42Tick();
   const edited=panel.textContent.includes('godzinę przyjazdu')&&!panel.textContent.includes('godzinę odjazdu');
   STATE.dialogues[id]=[{role:'npc',text:'Przykładowa odpowiedź.'},{role:'player',text:'Czy to potwierdzone?'}];
   __rc42Tick();
   const replaced=panel.textContent.includes('Czy to potwierdzone?') && !panel.textContent.includes('godzinę przyjazdu');
   STATE.activeChar=CONTENT.characters[1].id;
   __rc42Tick();
   const witnessSwitched=summary.textContent.includes('Zadane pytania: 0');
   const quietStart=changes+mo.takeRecords().length;
   for(let i=0;i<100;i++)__rc42Tick();
   const quietAfter=mo.takeRecords().length;
   mo.disconnect();
   return {idleChanges,originalSummary:before,updated,edited,replaced,witnessSwitched,quietAfter,
     active:STATE.activeChar,tab:STATE.tab};
  }''')
  result['width']=width
  report['tests'].append(result)
  print(f'{width}px: {json.dumps(result,ensure_ascii=False)}',flush=True)
  if not args.compare_only:
   assert result['idleChanges']==0, 'Idle UI redraw still present'
   assert result['quietAfter']==0, 'UI redraw continues after witness switch'
   assert all(result[x] for x in ['updated','edited','replaced','witnessSwitched']),result
  ctx.close()
 browser.close()
assert not report['errors'],report['errors']
if not args.compare_only:
 output=ROOT/'QA-RC571064/memory-idle-regression.json';output.parent.mkdir(exist_ok=True)
 output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print('RC57.10.64 idle memory poll — PASS')
