
/* Prawdziwe Śledztwo 6.0.2 — P1: język naturalny poszukiwań i bezpieczne przywracanie rozstrzygnięć. */
(function(){
'use strict';
const results=document.getElementById('searchResults');
const areaName=id=>AREAS.find(a=>a.id===id)?.title||id;
const origSearch=searchArea;
const searchButton=document.getElementById('searchBtn');
searchButton.removeEventListener('click',origSearch);
const common=new Set('sprawdz szukam znajdz znajdzcie potrzebuje interesuje prosze poszukaj chce pokaz dostep mam macie dokument dokumenty sprawa sprawie informacji info dowod dowody zapisy zapis raport raporty kart karta lista rejestr rejestry rzecz czegos cos dotyczacy dotyczace dotyczaca temat sprawdzic przeswietl czemu gdzie kiedy jaki jakiego jaka ktore ktory czy by'.split(' '));
// Domenowa mapa synonimów, bez odczytu treści nieodkrytych akt ani obejścia bramek.
const aliases={
 'MED-01':['alarm o lenie','zgloszenie znalezienia','znaleziono dziewczyne','znaleziono cialo','odkrycie leny'],
 'MED-02':['cialo leny','zwloki leny','oględziny ciala','co z cialem','obejrzec ofiare','stan zwlok'],
 'MED-03':['kiedy zmarla lena','pora smierci','godzina zgonu','czas smierci'],
 'TEC-03':['ostrzezenie wagonu','alarm wagonu','blad tramwaju','usterka wagonu','diagnostyka tw 217','komunikat o usterce'],
 'TEC-14':['czujnik przy hali','czujnik stanowiska','sygnal z czujnika'],
 'EVID_WORK_ORDER_RAW':['zlecenie warsztatu','zlecenie naprawy','co kazano mechanikowi'],
 'EVID_SERVICE_FORM_GAPS':['braki w naprawie','zmieniony protokol serwisu','kto poprawial naprawe'],
 'EVID_ACCEPTANCE_RECORD':['odbior czesci','protokol l2 l3','odbior podzespolu'],
 'EVID_BHP_DRAFT':['niewyslane bhp','lena skarga bhp','ostrzezenie o niebezpieczenstwie'],
 'EVID_RAW_ENTRY_TIMES':['lista wejsc pracownikow','kto wchodzil w nocy','kto wszedl do zajezdni','godziny wejsc','surowe wejscia'],
 'EVID_DISPATCH_REVISION':['zmiana polecenia tramwaju','kto zmienil dyspozycje wagonu','zmiana dyspozycji dla tw 217','polecenie dla wagonu'],
 'EVID_PAYROLL_MANUAL_EDIT':['kto zmienial grafik','kto zmienil grafik','kto poprawial grafik','korekty grafiku nocnej zmiany','poprawki czasu pracy','zmieniono ewidencje','ręczne zmiany godzin'],
 'EVID_RADIO_GAP':['brakujace radio','dziura w lacznosci','przerwa radiowa'],
 'EVID_CONFERENCE_SESSION':['alibi audytu','polaczenie audytowe','wideokonferencja audytora'],
 'VIS-02':['zdjecie ciala leny','fotografia z miejsca','zdjecie znalezienia','zdjecie ofiary'],
 'VIS-03':['kamera w korytarzu','korytarz poludniowy nagranie'],
 'VIS-04':['nagrania przy hali','kamera przy hali','monitoring wejscia do hali','film przy hali','kamera b'],
 'VIS-05':['kamery przy warsztacie','monitoring warsztatu','kamera c'],
 'VIS-09':['otwarcie drzwi na nagraniu','film z drzwi poludniowych'],
 'VIS-10':['zasieg monitoringu','gdzie sa kamery','plan kamer'],
 'ADM-01':['pracownicy na zmianie','kto byl na dyzurze','obsada zajezdni'],
 'ADM-07':['kto dostal karte t 17','wydanie przepustki'],
 'EVID_T17_DOOR_EVENT':['otwarcie karta t17','czytnik drzwi','wejscie na karte'],
 'DIG-01':['z kim rozmawiala lena','telefon leny i elzbiety','wykaz polaczen leny'],
 'DIG-10':['kto dzwonil po pomoc','alarm 0202','zgloszenie dyspozytorni'],
 'LAB-01':['probki z miejsca','co zebrano z miejsca','zabezpieczone probki'],
 'LAB-02':['smar przy stanowisku','slady smaru'],
 'LAB-03':['włókna na lenie','włókna z ubrania','slady na ubraniu'],
 'LAB-07':['włókna z audytu','ubranie audytora']
};
const stem=x=>x.slice(0,Math.min(5,x.length));
function terms(x){return norm(x).split(' ').filter(w=>w.length>=3&&!common.has(w)&&!STOP.has(w));}
function matchWords(a,b){if(a===b)return 1;if(a.length>=4&&b.length>=4&&(a.startsWith(stem(b))||b.startsWith(stem(a))))return .75;return 0;}
function similar(q,phrase){const a=terms(q),b=terms(phrase);if(!a.length||!b.length)return 0;const n=a.reduce((v,x)=>v+(Math.max(0,...b.map(y=>matchWords(x,y)))),0);return n/a.length;}
const special=/\b(?:lena|leny|lene|lenie|rudnickiej|tramwaj|wagon|tw\s*217|zajezdnia|zajezdni|pracownikow|hali|warsztat|kamera|nagran|kart\w*|t\s*17)\b/;
function enrichedScore(q,d){
 const titleScore=scoreDoc(q,d.title?d:{...d,title:''});
 const titleWords=similar(q,d.title);
 const issuerScore=similar(q,d.issuer||'');
 const candidate=(aliases[d.id]||[]).map(p=>similar(q,p));
 const aliasScore=Math.max(0,...candidate);
 let sc=Math.max(titleScore*1.4,titleWords*2.1,issuerScore*.55,aliasScore*2.55);
 const nq=norm(q),t=norm(d.title);
 if(/\b(?:zwlok|cialo|ciala|ofiara|ofiary)\b/.test(nq) && /ciala|zwlok|obrazen/.test(t))sc+=.38;
 if(/\b(?:nagran|monitor|film|kamer)\w*/.test(nq) && d.area==='cctv')sc+=.23;
 if(/\b(?:wejsc|wchod|czytnik)\w*/.test(nq) && /wejsc|dostep|kart/.test(t))sc+=.22;
 // Prevent a single very generic word from automatically capturing a wrong document.
 if(terms(q).length===1 && !aliases[d.id]?.some(x=>similar(q,x)===1))sc*=.66;
 return sc;
}
function openFound(d){activeDoc=d.id;showTab('evidence');renderDocs();}
function acquire(d){
 if(d.area!==STATE.area||STATE.found.has(d.id)||!searchCanAcquire(d)||sceneDocBlocked(d.id))return;
 STATE.found.add(d.id);PS_EVENTS.evidence(d.id,'natural-search');activeDoc=d.id;
 results.replaceChildren();const b=document.createElement('b');b.style.color='var(--green)';b.textContent='Zabezpieczono: '+d.title;
 const btn=document.createElement('button');btn.className='btn alt';btn.style.marginLeft='9px';btn.textContent='Odczytaj';btn.addEventListener('click',()=>openFound(d));results.append(b,' ',btn);
 renderCounts();renderAttached();tcmsRefresh();msgRefresh();cctvRefresh();forensicRefresh();accessRefresh();ui14Update();toast('Do akt dodano: '+d.title);
}
function displayOptions(entries,note,action){results.replaceChildren();const p=document.createElement('p');p.textContent=note;results.appendChild(p);
 for(const {d} of entries.slice(0,5)){
  const line=document.createElement('div');line.className='ps602-result';
  const label=document.createElement('span');label.textContent=d.title;
  const button=document.createElement('button');button.type='button';button.className='btn alt';button.textContent=action==='open'?'Otwórz':'Zabezpiecz';
  button.addEventListener('click',()=>action==='open'?openFound(d):acquire(d));line.append(label,button);results.append(line);
 }
}
function displaySceneOptions(entries){
 results.replaceChildren();
 const intro=document.createElement('p');intro.textContent='Ten materiał wymaga osobistego zbadania w lokacji. Wyszukiwarka nie zabezpiecza śladów za gracza.';results.appendChild(intro);
 for(const {d} of entries.slice(0,4)){
  const h=sceneSourceForDoc(d.id);if(!h)continue;
  const room=SC_ROOMS.find(r=>r.id===h.room);
  const line=document.createElement('div');line.className='ps602-result';
  const label=document.createElement('span');
  const title=document.createElement('b');title.textContent=d.title;
  const location=document.createElement('small');location.className='muted';location.style.display='block';location.textContent='Miejsce: '+(room?.title||'Oględziny')+' · punkt: '+h.title;
  label.append(title,location);
  const button=document.createElement('button');button.type='button';button.className='btn alt';button.textContent='Zbadaj wskazany punkt';
  button.addEventListener('click',()=>{
   scPickRoom(h.room);
   // Rozpoznanie pochodzenia źródła odkrywa punkt, lecz nie zalicza badania ani zabezpieczenia.
   scDiscover(h.id);
   showTab('inspection12');
   requestAnimationFrame(()=>document.getElementById('scDetail')?.scrollIntoView({block:'start',behavior:'smooth'}));
   toast('Wybrano punkt: '+h.title+'. Dobierz metodę badania i zabezpiecz materiał po poprawnej ocenie.');
  });
  line.append(label,button);results.appendChild(line);
 }
}
function searchNatural(){
 const q=document.getElementById('searchQuery').value.trim();
 if(q.length<3){results.textContent='Opisz, czego szukasz: np. „kto wchodził do zajezdni?” albo „kamera przy hali”.';return;}
 if(!terms(q).length){results.textContent='Podaj przedmiot, osobę lub miejsce, o które chodzi.';return;}
 const ranked=DOCS.filter(d=>d.area===STATE.area).map(d=>({d,sc:enrichedScore(q,d)})).filter(x=>x.sc>=.65).sort((a,b)=>b.sc-a.sc);
 const uncovered=ranked.filter(x=>!STATE.found.has(x.d.id)&&searchCanAcquire(x.d)&&!sceneDocBlocked(x.d.id));
 const scene=ranked.filter(x=>!STATE.found.has(x.d.id)&&sceneSourceForDoc(x.d.id));
 const found=ranked.filter(x=>STATE.found.has(x.d.id));
 const blocked=ranked.filter(x=>!STATE.found.has(x.d.id)&&searchCanAcquire(x.d)&&sceneDocBlocked(x.d.id));
 const lab=ranked.filter(x=>!STATE.found.has(x.d.id)&&['po-mg','analiza'].includes(x.d.acquisition));
 const external=DOCS.filter(d=>d.area!==STATE.area&&(STATE.found.has(d.id)||(searchCanAcquire(d)&&!sceneDocBlocked(d.id)))).map(d=>({d,sc:enrichedScore(q,d)})).sort((a,b)=>b.sc-a.sc)[0];
 const bestHere=Math.max(uncovered[0]?.sc||0,found[0]?.sc||0,scene[0]?.sc||0);
 const remoteScene=DOCS.filter(d=>d.area!==STATE.area&&!STATE.found.has(d.id)&&sceneSourceForDoc(d.id)).map(d=>({d,sc:enrichedScore(q,d)})).filter(x=>x.sc>=1.4).sort((a,b)=>b.sc-a.sc);
 if(remoteScene.length&&remoteScene[0].sc>Math.max(1.55,bestHere*1.35)){displaySceneOptions(remoteScene.filter(x=>x.sc>=remoteScene[0].sc*.75));return;}
 if(external&&external.sc>1.35&&external.sc>bestHere*1.42){results.textContent='Najbardziej pasujący materiał znajduje się w obszarze „'+areaName(external.d.area)+'”. Przełącz obszar, aby kontynuować.';return;}
 const max=uncovered[0]?.sc||0;
 if(scene.length&&scene[0].sc>=Math.max(.9,max*1.05)){displaySceneOptions(scene.filter(x=>x.sc>=Math.max(.9,scene[0].sc*.66)));return;}
 if(uncovered.length){displayOptions(uncovered.filter(x=>x.sc>=Math.max(.7,max*.58)),'Znaleziono możliwe materiały. Wybierz ten, który odpowiada Twojemu pytaniu:', 'acquire');return;}
 if(found.length){displayOptions(found,'Ten materiał jest już w Twoich aktach:','open');return;}
 if(scene.length){displaySceneOptions(scene);return;}
 if(blocked.length){results.textContent='Dostęp do pasującego materiału wymaga wcześniejszych ustaleń. Najpierw sprawdź: '+scDocMissing(blocked[0].d.id).map(id=>byId[id]?.title||'wcześniejszy ślad').join('; ')+'.';return;}
 if(lab.length){results.textContent='Pasujący materiał wymaga opracowania w pracowni lub ekspertyzy. Przejdź do Analiz i sprawdź warunki uzyskania raportu.';return;}
 const other=DOCS.filter(d=>d.area!==STATE.area&&(STATE.found.has(d.id)||(searchCanAcquire(d)&&!sceneDocBlocked(d.id)))).map(d=>({d,sc:enrichedScore(q,d)})).sort((a,b)=>b.sc-a.sc)[0];
 if(other&&other.sc>=1.35){results.textContent='W wybranym obszarze brak pasującego materiału. Spróbuj obszaru „'+areaName(other.d.area)+'”.';return;}
 results.textContent='Nie odnaleziono pasującego materiału w tym obszarze. Spróbuj opisać jego funkcję, np. „kto wchodził”, „ostrzeżenie wagonu” lub „kamera przy hali”.';
}
searchArea=searchNatural;
searchButton.addEventListener('click',searchNatural);
const css=document.createElement('style');css.textContent='.ps602-result{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0;padding:9px 11px;background:#1c2930;border:1px solid #475762;border-radius:8px}.ps602-result span{min-width:0;overflow-wrap:anywhere}.ps602-result button{flex-shrink:0;padding:7px 10px;font-size:12px}@media(max-width:480px){.ps602-result{flex-wrap:wrap}.ps602-result button{width:auto!important}}';document.head.append(css);
window.PS602_SEARCH={score:(q,id)=>byId[id]?enrichedScore(q,byId[id]):0,search:searchNatural};
})();
(function(){
'use strict';
if(typeof ps54Review!=='function'||typeof PS601_P0==='undefined')return;

const kinds={
 solid:['Mocny akt — zarzuty obrony odparte','Niezależne źródła podtrzymują rekonstrukcję; spory obrony rozpatrzono, a wątpliwości ujawniono.'],
 returned:['Zwrócenie akt do uzupełnienia','Wykryte luki wymagają dalszych czynności. W sprawie nie zapadło rozstrzygnięcie o winie.'],
 miscarriage:['Błędne skazanie — zignorowano dowody odciążające','Śledczy oskarżył niewłaściwą osobę, świadomie zataił wątpliwości i zignorował sprzeczności.'],
 excluded:['Uchylenie materiału — istotne uchybienia proceduralne','Istotne uchybienia ograniczyły możliwość wykorzystania dowodów.'],
 acquittal:['Uniewinnienie — brak wystarczających podstaw','Z akt nie wynika pewny i spójny związek oskarżonej osoby z czynem.'],
 weak:['Akt nie utrzymany — materiał niewystarczający','Zebrane materiały nie pozwalają obronić całego aktu oskarżenia.']
};
function expected(){
 if(!STATE.final13.submitted)return null;
 const disclosure=STATE.sim.process54?.disclosure;
 if(!['disclose','defer','suppress'].includes(disclosure))return null;
 if(disclosure==='defer')return 'returned';
 const post=ps54Review(),s=STATE.final13;
 const wrong=!!s.culprit&&s.culprit!=='MAGDALENA';
 const badAlibi=['card_proves','remote_proves','console_proves','no_need'].includes(s.alibi);
 if(wrong&&disclosure==='suppress'&&STATE.sim.ignoredTimeline&& (post.assessment.timelineIssues.length>0||badAlibi||!post.assessment.cs.identity.ready))return 'miscarriage';
 if(post.ready&&disclosure==='disclose')return 'solid';
 if(disclosure==='suppress'||post.violations>=3||post.risk>=3)return 'excluded';
 if(wrong||!post.assessment.coherence||post.assessment.strength<55)return 'acquittal';
 return 'weak';
}
function stateProof(){
 // Derived from live, revalidated gameplay. No proof is granted by this receipt.
 const review=ps54Review();
 const charge=STATE.final13;
 return JSON.stringify({
  found:[...STATE.found].sort(),
  core:SIM_NODES.map(n=>{const a=simScore(n);return [n.id,a.score,a.ready];}),
  critical:[...STATE.sim.verified].sort(),
  trialRoles:(charge.links||[]).map(l=>l.role+':'+l.id).sort(),
  person:charge.culprit,method:charge.method,keystone:charge.keystone,alibi:charge.alibi,
  p0:fcChecks().map(x=>x.ok),
  disclosure:STATE.sim.process54?.disclosure,ignoredTimeline:STATE.sim.ignoredTimeline,
  defense:PS54_ISSUES.map(x=>ps54Result(x,ps54Entry(x.id)).passed),
  trust:STATE.sim.trust,errors:STATE.sim.errors,
  audit:review.risk,violations:review.violations,ready:review.ready,
  issues:review.assessment.timelineIssues.length,strength:review.assessment.strength,
  submitted:charge.submitted
 });
}
function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function receipt(){return {version:1,kind:STATE.sim.trial?.kind||'',signature:hash(stateProof())};}
function normalForm(kind){const review=ps54Review();return {
  kind,title:kinds[kind][0],text:kinds[kind][1],
  strength:review.assessment.strength,defense:kind==='returned'?'Kontrola do uzupełnienia':review.defense.passed+'/6 rozpatrzonych odpowiedzi obrony',
  reasons:[...review.assessment.weakReasons,...review.defense.weak.map(x=>'Nieodparty zarzut: '+x)],
  procedural:kind==='solid'?'Ujawniono ograniczenia i zweryfikowano trzy filary śledztwa.':
    kind==='miscarriage'?'Zatajenie i zignorowanie sprzeczności skutkowało nieprawidłowym rozstrzygnięciem.':
    'Wynik fikcyjnego postępowania odzwierciedla stan zebranego materiału.'
 };
}
/* SaveManager: buildSave hook. */
registerSaveHook({name:"20-natural-language-search-save1", build(__save){const d=__save;if(STATE.sim.trial?.kind&&kinds[STATE.sim.trial.kind]&&d.investigationSim){d.investigationSim.verdictReceipt=receipt();}return d;}});
/* SaveManager: applySave hook. */
registerSaveHook({name:"20-natural-language-search-load1", apply(d){
 undefined;
 const raw=d?.investigationSim;
 const old=raw?.trial,check=raw?.verdictReceipt;
 const kind=typeof old?.kind==='string'?old.kind:'';
 const current=expected();
 let restored=false;
 if(kinds[kind]&&kind===current&&Number(STATE.sim.process54?.hearings||0)>0){
  const validated=!check||(check.version===1&&check.kind===kind&&check.signature===hash(stateProof()));
  if(validated){STATE.sim.trial=normalForm(kind);restored=true;}
 }
 if(!restored)STATE.sim.trial=null;
 simRenderHearing();
 window.PS602_LAST_RESTORE={restored,kind:restored?kind:null,reason:restored?'validated':old?'niezgodny wynik lub aktualne dowody':'brak rozstrzygnięcia'};
}});
window.PS602_VERDICT={expected,receipt,stateProof,normalForm,check:()=>({expected:expected(),trial:STATE.sim.trial?.kind||null,p0:PS601_P0.review().passed})};
})();

