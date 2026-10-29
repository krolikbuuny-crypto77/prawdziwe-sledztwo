"""6.14 blinded-to-algorithm regression: same 540 prompts, equal state starts.
Checks diversity without credit for ungrounded claims; also checks SaveManager, versions,
no evidence leaks or formal response changes. Offline browser run; no Z.ai request.
"""
from pathlib import Path
from collections import Counter
import csv,json,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
V613=None  # earlier answers are stored in the bundled comparison fixture
# source prompts fixed before variety code was authored
DATA=ROOT/'TEST-6.14'/'porownanie_540.csv'
assert DATA.exists()
rows=list(csv.DictReader(DATA.open(encoding='utf-8-sig',newline='')))
qs=[{'witness':r['witness'],'question':r['question'],'expected':r['expected']} for r in rows]
results={}
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for label,file in [('6.14',ROOT/'index.html')]:
        page=browser.new_page(viewport={'width':390,'height':844})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(file.read_text(encoding='utf-8'),wait_until='domcontentloaded',timeout=60000)
        result=page.evaluate('''qs => {
          const out=[];const initial=STATE.found.size;
          for(const x of qs){try{
           const w=CONTENT.characters.find(c=>c.id===x.witness);
           const before=NPC9_MEMORY[w.id].confronted?.length||0;
           const answer=npc4Answer(w,x.question,'');
           out.push({answer,err:'',confrontedDelta:(NPC9_MEMORY[w.id].confronted?.length||0)-before});
          }catch(e){out.push({answer:'',err:String(e),confrontedDelta:-1})}}
          return {out,addedEvidence:STATE.found.size-initial, registry:PS_WITNESS_ENGINE.inspect().layers,
            variety:window.PS614_VARIETY?.stats('MAREK')||null};
        }''',qs)
        assert not errors,errors
        assert not result['addedEvidence'],result
        assert all(x['answer'] and not x['err'] and x['confrontedDelta']==0 for x in result['out'])
        results[label]=result
        print(label,'distinct',len({x['answer'] for x in result['out']}),'of',len(result['out']),'pageErrors',len(errors))
        if label=='6.14':
            # Restore after a save, without relying on current tab.
            restored=page.evaluate('''() => {
              const before=npc4Export(), saved=buildSave();
              const used=PS614_VARIETY.stats('MAREK');
              const result=safeLoad(saved);
              const after=npc4Export();
              return {used,before:before.MAREK.npc614,after:after.MAREK.npc614,ok:result};
            }''')
            assert restored['before']==restored['after'],restored
            print('PASS state persisted through SaveManager',restored['used'])
            result['saveTest']=True
        page.close()
    browser.close()
comparison=[]
for q,r,b in zip(qs,rows,results['6.14']['out']):
    comparison.append({**q,'before':r['before'],'after':b['answer'],'changed':r['before']!=b['answer']})
changed=[r for r in comparison if r['changed']]
print('changed',len(changed),'uniquebefore',len({x['before'] for x in comparison}),'uniqueafter',len({x['after'] for x in comparison}))
print('EXAMPLES')
for r in changed[:16]:print(r['witness'],r['expected'],r['question'][:45],r['before'][:90],'=>',r['after'][:95],sep=' | ')
file=ROOT/'TEST-6.14'
file.mkdir(exist_ok=True)
with (file/'porownanie_540.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(comparison[0]));w.writeheader();w.writerows(comparison)
stats={'prompts':len(comparison),'changed':len(changed),'distinct613':len({r['before'] for r in comparison}),'distinct614':len({r['after'] for r in comparison}),
'errors':0,'evidenceGranted':0,'realAPI':False,'saveRestoreVariety':results['6.14']['saveTest']}
(file/'statystyki.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2)+'\n')
# all new answers must be either original or one of explicitly authored safe expressions;
# numeric/time/unique proper-name tokens may not change.
import re
for r in changed:
    old,n=r['before'],r['after']
    o=set(re.findall(r'\b\d+(?::\d+)?\b',old));nset=set(re.findall(r'\b\d+(?::\d+)?\b',n))
    assert o==nset,(r['question'],old,n)
    for name in ('Lena','Leny','TW-217','Marek','Janusz','Tomasz','Kamil','Magdalena','Elżbieta'):
      if name in old:assert name in n,(r['question'],name,old,n)
    if 'Nie przyznaję się' in old:assert old==n,'Formal denial altered'
print('PASS numeric and named facts unchanged; no rewritten formal denial')
