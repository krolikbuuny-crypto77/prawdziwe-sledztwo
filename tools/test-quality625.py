"""6.25: semantyczna trafność wybranych tematów + indywidualność głosu,
bez twierdzenia, że heurystyki rozumieją każdą parafrazę języka polskiego.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,json,re,collections
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'QA-625';OUT.mkdir(exist_ok=True)
CASES=[
 ('tech','Co wiesz o awarii L-2 i L-3?',r'L-?2|L-?3'),
 ('tech','Jaka usterka dotknęła L2 albo L3?',r'L-?2|L-?3'),
 ('tech','Co jest nie tak z L-3?',r'L-?3'),
 ('receipt','Kto odpowiada za protokół odbioru L-3?',r'L-?3'),
 ('receipt','Kto podpisał odbiór L3?',r'L-?3'),
 ('sequence','W jakiej kolejności nastąpił alarm i zmiana kursu?',r'alarm|kurs|dyspozycj'),
 ('routing','Dlaczego zmieniono dyspozycję TW-217?',r'TW-?217|dyspozycj|kurs'),
 ('workorder','Jakie były powody decyzji o zleceniu?',r'zlecen'),
 ('contradiction','Wcześniej mówiłaś inaczej.',r'mówi|powiedz|odpowiedz|zdani|wypowiedź|konkretnie|chodzi|różnic|inaczej'),
 ('contradiction','Co się nie zgadza w twoich zeznaniach?',r'nie zgadza|zeznan|konkretnie|różnic|rozbież|wypowiedź|odpowiedź|chodzi|miejs|zarzut'),
 ('contradiction','Przed chwilą powiedziałeś coś innego.',r'przed chwil|powiedz|różnic|inaczej|konkretnie|wypowiedź|odpowiedź|odnieść'),
]
CROSS=[
 'Czy Lena wiedziała o usterce?',
 'Czy Lena wiedziała o awarii L-2?',
 'Czy odpowiadasz za sabotaż L-3?',
 'Czy rejestr T-17 potwierdza alibi Magdaleny?',
 'Czy przyznajesz się do zabójstwa Leny?'
]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 records=[]
 for width in (390,1280):
  page=browser.new_page(viewport={'width':width,'height':844});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((ROOT/'index.html').read_text(encoding='utf8'),wait_until='domcontentloaded',timeout=100000)
  safety=page.evaluate('''()=>{const r=PS625_RELEVANCE;return [
  r.detect('Czy Lena wiedziała o awarii L-2?'),
  r.detect('Czy odpowiadasz za sabotaż L-3?'),
  r.detect('Dlaczego zmieniono dyspozycję TW-217 i kto użył T-17?'),
  r.detect('Co z L-2 i gdzie była Lena?')];}''')
  assert safety==[None,None,None,None],safety
  result=page.evaluate('''({cases,cross})=>{
   const before={found:[...STATE.found],deduction:JSON.stringify(STATE.deduction),trial:JSON.stringify(STATE.sim?.trial)};
   const rows=[];
   for(const c of CONTENT.characters){
    for(const [topic,q] of cases){const answer=npc4Answer(c,q,'');
     rows.push({id:c.id,topic,q,answer,modified:PS625_RELEVANCE.last()?.id===c.id&&PS625_RELEVANCE.last()?.changed===true});}
    for(const q of cross){rows.push({id:c.id,topic:'protected',q,answer:npc4Answer(c,q,'')});}
   }
   const after={found:[...STATE.found],deduction:JSON.stringify(STATE.deduction),trial:JSON.stringify(STATE.sim?.trial)};
   return {rows,stateUnchanged:JSON.stringify(before)===JSON.stringify(after),overflow:document.documentElement.scrollWidth-innerWidth,layer:PS_WITNESS_ENGINE.inspect().layers.answer.at(-1)};
  }''', {'cases':[[a,b] for a,b,_ in CASES],'cross':CROSS})
  assert result['stateUnchanged'] and result['overflow']<=2 and not errors,(result['stateUnchanged'],result['overflow'],errors)
  assert result['layer']=='83-question-focus-626'
  for row in result['rows']:
   assert row['answer'].strip(),(width,row)
   if row['topic']!='protected':
    regex=next(t[2] for t in CASES if t[0]==row['topic'] and t[1]==row['q'])
    if row['topic']=='contradiction':
     assert len(row['answer'])<240 and not re.search(r'(\bBHP\b|\bdyspozytorn)',row['answer'],re.I),(width,row)
    else: assert re.search(regex,row['answer'],re.I),(width,row)
  records.append({'viewport':width,'samples':result['rows']})
  print('PASS',width,'16 questions x 6 witnesses; no JS errors, overflow or evidence changes')
  page.close()
 browser.close()
for sample in records[:1]:
 for q in ['Wcześniej mówiłaś inaczej.','Co się nie zgadza w twoich zeznaniach?','Co wiesz o awarii L-2 i L-3?']:
  subset=[r['answer'] for r in sample['samples'] if r['q']==q]
  assert len(subset)==6 and len(set(subset))==6,(q,subset)
  print('PASS six distinct character voices:',q)
(OUT/'quality625-browser.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
