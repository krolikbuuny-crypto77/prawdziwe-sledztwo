"""QA 6.19: browser/UI, 1200 syntactically varied LOCAL turns, no live LLM API.
Dialogue naturalness requires independent human review: this does not claim to measure it.
"""
from pathlib import Path
import json, shutil, csv, time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'QA-619'
CHROME=shutil.which('chromium') or shutil.which('google-chrome')
PROMPTS=[
 'Gdzie byłeś wtedy', 'Czy to pamiętasz, czy masz jakiś dokument', 'Czemu nie powiedziano Lenie wcześniej',
 'Kto mógł potwierdzić twoje słowa', 'Jaki był porządek zdarzeń', 'Skąd właściwie o tym wiesz',
 'Co osobiście widziałeś', 'W jaki sposób otrzymałeś informację', 'Czy TW-217 był sprawny',
 'Po co wróciłeś do tego wątku', 'Co myślała Lena o zagrożeniu', 'Czy widziałeś podzespół L-2',
 'Czy twierdzisz, że dokument L-3 jest prawidłowy', 'Co robiłeś po zmianie dyspozycji',
 'Kiedy dostałeś wiadomość', 'Co zastałeś przy stanowisku trzecim', 'Czy twoja wcześniejsza odpowiedź nie była sprzeczna',
 'Czy przyznajesz się do zabójstwa Leny', 'Czy Marek zabił Lenę', 'A jeżeli mylisz osobę z numerem karty',
 'Czy to widziałeś i czy to zgłosiłeś', 'Co spowodowało zwłokę i komu ją zgłosiłeś',
 'Czy pamiętasz konkretną godzinę, a jeśli nie, dlaczego', 'Dlaczego nie chcesz odpowiedzieć',
 'Powiedziałeś coś innego przed chwilą, możesz to wyjaśnić', 'Kto zatwierdził odbiór i kto go sprawdził',
 'Czy z samej sesji można wywnioskować obecność', 'Co dokładnie było napisane w dzienniku',
 'Przepraszam, zapytałem niewłaściwie, chodzi mi o fakty', 'Nie wiem, czy dobrze cię rozumiem, powtórz proszę',
 'Jak Lena traktowała kolegów', 'Czy wiesz cokolwiek o jej wcześniejszym dyżurze',
 'Jaki jest związek między BHP a odbiorem', 'Wcześniej zaprzeczałeś, że miałeś kontakt',
 'Czy możesz odróżnić domysł od obserwacji', 'Jeżeli nie masz pewności, to na czym opierasz alibi',
 'Skoro nie byłeś tam obecny, jak możesz potwierdzić godzinę', 'Zależy mi na ścisłym źródle tej informacji',
 'Czy ktoś ci to powiedział i kiedy', 'Czy istnieje niezależny zapis',
 ]
questions=[]
for i in range(1200):
 text=PROMPTS[(i*13+i//40)%len(PROMPTS)]
 prefix=['','Panie świadku, ','Proszę wyjaśnić: ','Wróćmy do tego. ','Bez zgadywania: '][(i//len(PROMPTS))%5]
 suffix=['?','? Możesz sprecyzować?','? Proszę o krótką odpowiedź.','? Nie zakładajmy niczego z góry.'][(i//(len(PROMPTS)*5))%4]
 questions.append({'witness':['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'][i%6], 'question':prefix+text+suffix})
result={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (390,768,1280):
  page=browser.new_page(viewport={'width':width,'height':844});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((ROOT/'index.html').read_text('utf8'),wait_until='domcontentloaded',timeout=60000)
  snapshot=page.evaluate('''(queries)=>{
   if(!window.PS619_NARRATIVE)throw Error('Narrative layer did not load');
   const n=PS619_NARRATIVE,start=STATE.found.size;
   const first=document.querySelectorAll('#ps619Lena .ps619-tile').length;
   const unlocked=n.lena.filter(x=>x.requires.every(r=>STATE.found.has(r))).length;
   if(first!==unlocked)throw Error('Lena gate mismatch');
   const before=JSON.stringify(STATE.sim.trial);
   const profiles=Object.keys(n.profiles),dif=new Set(profiles.map(x=>n.profiles[x].cadence));
   const modes=['weak','returned','documentation','intentional','miscarriage','excluded'];
   for(const kind of modes){STATE.sim.trial={kind};n.renderEpilogue();
     if(!document.getElementById('ps619Epilogue')?.textContent.includes('Ludzie, którzy zostają'))throw Error('Epilogue missing: '+kind);}
   STATE.sim.trial=JSON.parse(before);n.renderEpilogue();
   const keys=['MED-01','TEC-01','DIG-01','TEC-03','TEC-04','EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION',
    'TEC-15','EVID_SERIAL_PHOTO','EVID_ACCEPTANCE_RECORD','EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA'];
   for(const key of keys)STATE.found.add(key);n.render();
   const after=document.querySelectorAll('#ps619Lena .ps619-tile').length;
   const all=queries.length;
   let empty=0,exception=0,answers=[],changed=0;
   for (const q of queries){try{const witness=CONTENT.characters.find(x=>x.id===q.witness);
     const text=String(npc4Answer(witness,q.question,'')||'');
     if(!text.trim())empty++;if(text.length>2100)changed++;answers.push(text);
   }catch(_){exception++;answers.push('');}}
   return {profileCount:profiles.length,profileStyles:dif.size,initialLena:first,initialExpected:unlocked,
     afterLena:after,turns:all,empty,exception,oversize:changed,unique:new Set(answers).size,
     foundStart:start,foundEnd:STATE.found.size,epilogues:modes.length,voice:n.aiContext('ELZBIETA').style,
     viewWidth:document.documentElement.scrollWidth,viewport:window.innerWidth,
     firstAnswers:answers.slice(0,10)};
  }''',questions if width==390 else [])
  assert snapshot['profileCount']==6 and snapshot['profileStyles']==6,snapshot
  assert snapshot['afterLena']==6 and snapshot['epilogues']==6,snapshot
  assert snapshot['empty']==0 and snapshot['exception']==0,snapshot
  assert snapshot['foundEnd']>=snapshot['foundStart'],snapshot
  if width==390:assert snapshot['turns']==1200,snapshot
  result[str(width)]={'snapshot':snapshot,'pageErrors':errors}
  print('VIEW',width,'JSERR',len(errors),'DIALOGUE',snapshot['turns'],'EMPTY',snapshot['empty'],'EXCEPTIONS',snapshot['exception'],'UNIQUE',snapshot['unique'])
  assert not errors,errors[:10]
  page.close()
 browser.close()
(OUT/'qa619-browser-1200.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('PASS local 1200-question stress, 6 profiles, 6 source-gated Lena chapters, 6 finale variants, desktop/tablet/mobile script load')
