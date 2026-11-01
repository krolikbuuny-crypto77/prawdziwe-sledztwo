from pathlib import Path
import csv,json,collections,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
BASE=Path('/mnt/data/ps_package_612')
DEV=json.loads((ROOT/'TEST-6.13/nowe_60_pytan.json').read_text())
DIAG=json.loads((ROOT/'WYNIKI-6.12/pytania_holdout_120.json').read_text())
ORIG=json.loads((ROOT/'WYNIKI-6.12/pytania_360.json').read_text())
W=['MAREK','JANUSZ','TOMASZ','KAMIL','ELZBIETA','MAGDALENA']
ALL=ORIG+DIAG+[{'id':481+i,'witness':W[i%6],**x} for i,x in enumerate(DEV)]
results={}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for name,folder in [('6.12',BASE),('6.13',ROOT)]:
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((folder/'index.html').read_text('utf8'),wait_until='domcontentloaded',timeout=60000)
  data=page.evaluate('''qs=>{
   let out=[],before=STATE.found.size;
   for (let i=0;i<qs.length;i++) {
    let x=qs[i],answer='',err='',plan=null;
    try{
      const w=CONTENT.characters.find(c=>c.id===x.witness);
      answer=String(npc4Answer(w,x.question,'')||'');
      plan=PS611_NLU.analyze(x.question);
    }catch(e){err=String(e)}
    out.push({expected:x.expected,question:x.question,witness:x.witness,answer,err,primary:plan?.primary||'',intents:plan?.intents||[]});
   }
   return {out,evidenceAdded:STATE.found.size-before,turns:out.length};
  }''',ALL)
  data['jsErrors']=errors
  data['unique']=len(set(x['answer'] for x in data['out']))
  results[name]=data
  print(name,'unique',data['unique'],'evidence',data['evidenceAdded'],'errors',sum(bool(x['err']) for x in data['out']),len(errors))
  for group,rows in [('known360',data['out'][:360]),('diagnostic120',data['out'][360:480]),('new60',data['out'][480:])]:
   print(group,'any',sum(x['expected'] in x['intents'] for x in rows),'primary',sum(x['expected']==x['primary'] for x in rows),'unknown',sum(x['primary']=='unknown' for x in rows),'distinct',len(set(x['answer'] for x in rows)))
  page.close()
 browser.close()
paired=[]
for x,y in zip(results['6.12']['out'],results['6.13']['out']):
 paired.append({'witness':x['witness'],'expected':x['expected'],'question':x['question'],'oldPrimary':x['primary'],'newPrimary':y['primary'],'oldHit':x['expected'] in x['intents'],'newHit':y['expected'] in y['intents'],'oldAnswer':x['answer'],'newAnswer':y['answer'],'changed':x['answer']!=y['answer'],'error':y['err']})
for i,(label,start,end) in enumerate([('known360',0,360),('diagnostic120',360,480),('new60',480,540)]):
 sub=paired[start:end]
 print('COMPARE',label,'changed',sum(x['changed'] for x in sub),'improvedIntent',sum(not x['oldHit'] and x['newHit'] for x in sub),'worsenedIntent',sum(x['oldHit'] and not x['newHit'] for x in sub))
 print('CHANGED EXAMPLES:')
 for x in [a for a in sub if a['changed']][:12]:print(x['expected'],'QUESTION',x['question'][:90],'OLD',x['oldAnswer'][:100],'NEW',x['newAnswer'][:135],sep=' | ')
with (ROOT/'TEST-6.13/porownanie_540.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(paired[0]));w.writeheader();w.writerows(paired)
(ROOT/'TEST-6.13/wyniki.json').write_text(json.dumps({'results':results,'paired':paired},ensure_ascii=False,indent=2))
assert all(r['evidenceAdded']==0 and not r['jsErrors'] and all(not x['err'] and x['answer'] for x in r['out']) for r in results.values())
