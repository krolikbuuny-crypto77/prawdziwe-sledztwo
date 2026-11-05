"""RC57.10.65: compare neutral tab navigation DOM churn against RC57.10.64.
No external API use. Tests state changes and button handlers after cache hits.
"""
from pathlib import Path
import argparse, json, mimetypes, shutil, statistics, sys
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser()
p.add_argument('--baseline',type=Path,default=None)
p.add_argument('--output',type=Path,default=HERE/'QA-RC571065'/'render-regression.json')
p.add_argument('--widths',default='390,1366,1920')
p.add_argument('--only-new',action='store_true')
a=p.parse_args()
TABS=['interview','inspection12','deduction']
TARGETS={'interview':['characterList','attachedDoc','ps23EvidenceCards'],
         'inspection12':['scRooms','scPins','scHotspots','scMetrics','scBlueprintBase'],
         'deduction':['dedSourceList','dedBoard','dedMetrics']}
report={'version':'RC57.10.65','baseline':'RC57.10.64' if a.baseline and not a.only_new else None,'runs':[],'errors':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for version,root in ([('before',a.baseline),('after',HERE)] if a.baseline and not a.only_new else [('after',HERE)]):
  root=root.resolve()
  for width in [int(x) for x in a.widths.split(',')]:
   ctx=browser.new_context(viewport={'width':width,'height':844 if width==390 else 768 if width==1366 else 1080},device_scale_factor=1,reduced_motion='reduce',locale='pl-PL',timezone_id='Europe/Warsaw')
   page=ctx.new_page()
   page.on('pageerror',lambda e,version=version,width=width: report['errors'].append(f'{version}-{width}: {e}'))
   def router(route):
    url=route.request.url
    if not url.startswith('https://qa.game/'):
     route.abort('blockedbyclient');return
    rel=url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]; f=(root/rel).resolve()
    if f.is_relative_to(root) and f.is_file():
     route.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
    else:route.fulfill(status=404,body='')
   page.route('**/*',router)
   html=(root/'index.html').read_text('utf8').replace('<head>','<head><base href="https://qa.game/">',1)
   page.set_content(html,wait_until='load',timeout=60000)
   assert page.evaluate("() => typeof showTab==='function' && typeof STATE==='object'")
   page.evaluate("() => showTab('overview')")
   # Neutral navigation: same state, no edits. Track affected root nodes.
   for tab in TABS:
    targets=TARGETS[tab]
    result=page.evaluate('''({tab,ids})=>{
      showTab(tab);const roots=ids.map(id=>document.getElementById(id));
      if(roots.some(r=>!r))return {error:'Missing test target'};
      const mutations=Object.fromEntries(ids.map(id=>[id,0]));
      const observers=roots.map((root,i)=>{
        const observer=new MutationObserver(()=>{});
        observer.observe(root,{childList:true,subtree:true,attributes:false,characterData:false});return observer;
      });
      let times=[];
      for(let i=0;i<18;i++){
        showTab('overview');const t=performance.now();showTab(tab);
        document.querySelector('.section.active')?.getBoundingClientRect();
        times.push(performance.now()-t);
        observers.forEach((o,j)=>{mutations[ids[j]]+=o.takeRecords().length;});
      }
      observers.forEach(o=>o.disconnect());times.sort((a,b)=>a-b);
      return {tab,mutations,medianMs:times[Math.floor(times.length/2)],p95Ms:times[Math.floor(times.length*.95)],
        active:STATE.tab,navActive:document.querySelectorAll('.section.active').length,
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
    }''',{'tab':tab,'ids':targets})
    result.update(version=version,width=width)
    report['runs'].append(result)
    if result.get('error') or result['active']!=tab or result['navActive']!=1 or result['overflow']:
     report['errors'].append(f'{version}-{width}-{tab}: {result}')
    print(version,width,tab,'DOM mutations',result.get('mutations'),'median',round(result.get('medianMs',0),2),flush=True)
   # Only edited release needs state-change regression.
   if version=='after':
    tests=page.evaluate('''()=>{
      const results={};
      showTab('interview');const id=STATE.activeChar;
      const list=document.getElementById('characterList');
      const first=list.firstElementChild;
      for(let i=0;i<5;i++)renderCharacterList();
      results.witnessDOMStable=list.firstElementChild===first;
      STATE.dialogues[id].push({role:'player',text:'Pytanie testowe o godzinę'});
      renderCharacterList();
      const neighbor=CONTENT.characters.find(x=>x.id!==id);
      const neighborButton=()=>[...list.querySelectorAll('[data-char]')].find(b=>b.dataset.char===neighbor.id);
      const beforeStatus=neighborButton()?.querySelector('.ps23-witness-status')?.textContent;
      STATE.dialogues[neighbor.id].push({role:'player',text:'Test zmiany statusu'});renderCharacterList();
      results.witnessStatusUpdated=beforeStatus==='Wybierz świadka'&&neighborButton()?.querySelector('.ps23-witness-status')?.textContent==='Rozmowa rozpoczęta';
      STATE.dialogues[neighbor.id].pop();renderCharacterList();
      const other=list.querySelector('[data-char]:not(.active)');
      const otherId=other.dataset.char;other.click();
      results.witnessButtonWorks=STATE.activeChar===otherId;
      STATE.dialogues[id].pop();
      STATE.activeChar=id;renderChat();
      const select=document.getElementById('attachedDoc');
      const before=select.options.length;
      STATE.reviewedEvidence.add(INITIAL[0]);renderAttached();
      results.exhibitAppears=select.options.length>before;
      const next=[...select.options].find(o=>o.value);
      if(next){select.value=next.value;renderAttached();results.selectedExhibitPreserved=select.value===next.value;}
      STATE.reviewedEvidence.delete(INITIAL[0]);renderAttached();
      showTab('inspection12');
      const rooms=document.getElementById('scRooms'),node=rooms.firstElementChild;
      for(let i=0;i<5;i++)scRender();
      results.inspectionDOMStable=rooms.firstElementChild===node;
      const room=rooms.querySelector('[data-sc-room]:not(.active)');
      if(room){const expected=room.dataset.scRoom;room.click();results.roomButtonWorks=STATE.scene12.room===expected;}
      showTab('deduction');
      const source=document.getElementById('dedSourceList'),beforeNode=source.firstElementChild;
      for(let i=0;i<5;i++)dedRenderSources();
      results.deductionSourcesStable=source.firstElementChild===beforeNode;
      const filter=document.getElementById('dedSourceSearch');
      filter.value='unikatowy-ciag-brak-wyniku-12345';filter.dispatchEvent(new Event('input',{bubbles:true}));
      results.deductionFilterUpdates=source.textContent.includes('Nie ma źródeł spełniających filtr');
      filter.value='';filter.dispatchEvent(new Event('input',{bubbles:true}));
      results.deductionFilterResets=!source.textContent.includes('Nie ma źródeł spełniających filtr');
      return results;
    }''')
    print('interaction checks',width,tests,flush=True)
    report.setdefault('interactions',[]).append({'width':width,**tests})
    for k,v in tests.items():
     if not v:report['errors'].append(f'{width}px interaction {k} failed')
   ctx.close()
 browser.close()
a.output.parent.mkdir(exist_ok=True,parents=True)
a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Errors:',report['errors'][:10],flush=True)
sys.exit(bool(report['errors']))
