from pathlib import Path
import json,shutil,csv,collections,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
BASE=Path('/mnt/data/ps_package_611')
OUT=ROOT/'WYNIKI-6.12';OUT.mkdir(exist_ok=True)
questions=json.loads(Path('/mnt/data/raport_test_610_vs_611/pytania_360.json').read_text('utf8'))
HOLDOUT={
 'personal_observation':'Opowiedz wyłącznie o obrazie, który zapamiętałeś, nie o cudzych opowieściach.',
 'knowledge_source':'Kto jest pierwotnym autorem tej informacji i jak do ciebie trafiła?',
 'certainty_limit':'Jak mocno ufasz swojej pamięci tego wieczoru?',
 'epistemic_challenge':'Twój wzrok nie obejmował bramy, więc dlaczego mówisz z taką pewnością o wejściu?',
 'time_precision':'Czy potrafisz określić czas tego zdarzenia z dokładnością do kwadransa?',
 'place_precision':'Czy chodziło o północną część zajezdni, czy zupełnie inne pomieszczenie?',
 'alibi':'Wyjaśnij swoje miejsce pobytu w krytycznym momencie nocy.',
 'corroboration':'Czy oprócz twoich słów da się jakoś niezależnie zweryfikować obecność?',
 'event_sequence':'Zacznij od pierwszego sygnału i poprowadź chronologię do zakończenia alarmu.',
 'action_taken':'Jak wyglądało twoje postępowanie, gdy dotarła do ciebie wiadomość o usterce?',
 'reason_for_action':'Co tobą kierowało, gdy postanowiłeś tego nie robić?',
 'report_recipient':'Która osoba była docelowym odbiorcą zgłoszenia?',
 'victim_contact':'Czy w trakcie rozmowy Lena pozostawiła ci jakąś wiadomość?',
 'relationship':'Czy miałeś z Leną relację osobistą czy czysto służbową?',
 'previous_statement':'Wróć do tego, jak opowiadałeś o tym na początku przesłuchania.',
 'contradiction':'W jednej relacji byłeś na miejscu, w drugiej nie; którą podtrzymujesz?',
 'clarify_reference':'Wspomniałeś o tej drugiej osobie. O kogo chodzi?',
 'direct_accusation':'Czy bierzesz na siebie odpowiedzialność za śmierć Leny jako jej zabójca?',
 'procedural_refusal':'Czy zamierzasz teraz przerwać przesłuchanie i niczego już nie wyjaśniać?',
 'documents':'Która wersja pisemnego protokołu opisuje tę sytuację?'
}
W=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']
holdout=[{'id':361+i*20+j,'witness':w,'expected':k,'question':v} for i,w in enumerate(W) for j,(k,v) in enumerate(HOLDOUT.items())]
(OUT/'pytania_holdout_120.json').write_text(json.dumps(holdout,ensure_ascii=False,indent=2),'utf8')
for fn,data in [('pytania_360.json',questions)]:
 (OUT/fn).write_text(json.dumps(data,ensure_ascii=False,indent=2),'utf8')
allq=questions+holdout
results={}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for v,folder in [('6.11',BASE),('6.12',ROOT)]:
  page=browser.new_page(viewport={'width':390,'height':844})
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content((folder/'index.html').read_text('utf8'),wait_until='domcontentloaded',timeout=60000)
  resp=page.evaluate('''questions=>{
   const rows=[], start=STATE.found.size,t0=performance.now();
   for(const x of questions){
    const c=CONTENT.characters.find(item=>item.id===x.witness);let answer='',exception=null,plan=null;
    try{answer=String(npc4Answer(c,x.question,'')||'')}catch(e){exception=String(e)}
    try{plan=PS611_NLU.analyze(x.question)}catch(e){exception=(exception||'')+' plan: '+e}
    rows.push({...x,answer,exception,plan});
   }
   return {rows,evidenceBefore:start,evidenceAfter:STATE.found.size,elapsedMs:performance.now()-t0};
  }''',allq)
  assert not errs,errs
  resp['pageErrors']=errs;results[v]=resp
  (OUT/f'odpowiedzi_{v.replace(".", "_")}.json').write_text(json.dumps(resp,ensure_ascii=False,indent=2),'utf8')
  hit=lambda arr:sum(x['expected'] in x['plan']['intents'] for x in arr)
  primary=lambda arr:sum(x['expected']==x['plan']['primary'] for x in arr)
  for key,subset in [('360',resp['rows'][:360]),('120',resp['rows'][360:])]:
   print(v,key,'any',hit(subset),'primary',primary(subset),'unknown',sum(x['plan']['primary']=='unknown' for x in subset),'empty',sum(not x['answer'].strip() for x in subset),'exceptions',sum(x['exception'] is not None for x in subset))
  print('time',v,resp['elapsedMs'],'evidence added',resp['evidenceAfter']-resp['evidenceBefore'])
  page.close()
 browser.close()
paired=[]
for a,b in zip(results['6.11']['rows'],results['6.12']['rows']):
 assert a['id']==b['id'] and a['question']==b['question']
 paired.append({'id':a['id'],'group':'existing360' if a['id']<=360 else 'holdout120','witness':a['witness'],
 'expected':a['expected'],'question':a['question'],'previous_intent':a['plan']['primary'],
 'new_intent':b['plan']['primary'],'previous_match':a['expected'] in a['plan']['intents'],
 'new_match':b['expected'] in b['plan']['intents'],'previous_answer':a['answer'],'new_answer':b['answer'],
 'changed':a['answer']!=b['answer'],'error':b['exception'] or ''})
with (OUT/'pelne_porownanie_480.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=paired[0].keys());w.writeheader();w.writerows(paired)
(OUT/'pelne_porownanie_480.json').write_text(json.dumps(paired,ensure_ascii=False,indent=2),'utf8')
summary={}
for v,r in results.items():
 summary[v]={'questions':len(r['rows']),'360_intent_any':sum(x['expected'] in x['plan']['intents'] for x in r['rows'][:360]),
 '360_intent_primary':sum(x['expected']==x['plan']['primary'] for x in r['rows'][:360]),
 '120_intent_any':sum(x['expected'] in x['plan']['intents'] for x in r['rows'][360:]),
 '120_intent_primary':sum(x['expected']==x['plan']['primary'] for x in r['rows'][360:]),
 'unknown360':sum(x['plan']['primary']=='unknown' for x in r['rows'][:360]),
 'empty':sum(not x['answer'].strip() for x in r['rows']),
 'errors':sum(bool(x['exception']) for x in r['rows']),
 'evidenceAdded':r['evidenceAfter']-r['evidenceBefore'],
 'distinctResponses':len(set(x['answer'] for x in r['rows']))}
summary['changed360']=sum(x['changed'] for x in paired[:360]);summary['changedHoldout']=sum(x['changed'] for x in paired[360:]);
(OUT/'podsumowanie.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),'utf8')
print('SUMMARY',json.dumps(summary,ensure_ascii=False))
print('EXAMPLES')
for x in [z for z in paired if z['changed'] and z['expected'] in ['reason_for_action','report_recipient','event_sequence','time_precision','knowledge_source','direct_accusation']][:20]:
 print(x['expected'],'QUESTION',x['question'],'OLD',x['previous_answer'][:140],'NEW',x['new_answer'][:160],sep=' | ')
