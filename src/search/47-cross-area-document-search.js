
(function(){
 'use strict';
 const areaBox=document.getElementById('areas'),queryInput=document.getElementById('searchQuery');
 const goButton=document.getElementById('searchBtn'),resultBox=document.getElementById('searchResults');
 if(!areaBox||!queryInput||!goButton||!resultBox||typeof PS602_SEARCH==='undefined')return;
 const oldSearch=PS602_SEARCH.search;
 const oldRenderAreas=renderAreas;
 let scope='all';
 const guide=document.createElement('p');guide.className='ps3-search-guide';guide.id='ps3SearchGuide';
 guide.innerHTML='<strong>Szukaj w całej sprawie</strong> albo wybierz jeden z obszarów poniżej. Opisz własnymi słowami przedmiot, zdarzenie lub czynność; wyniki nie omijają oględzin ani analiz.';
 areaBox.before(guide);
 const label=id=>AREAS.find(a=>a.id===id)?.title||'Inny obszar';
 function updateScope(){
   areaBox.querySelectorAll('[data-area]').forEach(b=>{const selected=scope==='area'&&b.dataset.area===STATE.area;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
   const all=areaBox.querySelector('[data-ps3-all]');if(all){all.classList.toggle('selected',scope==='all');all.setAttribute('aria-pressed',String(scope==='all'));}
   queryInput.placeholder=scope==='all'?'Np. kto wchodził w nocy, nagrania przy hali, wypadek...':'Czego szukasz w obszarze: '+label(STATE.area)+'?';
   guide.querySelector('strong').textContent=scope==='all'?'Szukaj w całej sprawie':'Wybrany obszar: '+label(STATE.area);
 }
 // Zachowanie STATE.area dla pozostałych modułów; „wszystkie” jest wyłącznie filtrem wyszukiwarki.
 renderAreas=function(){
   oldRenderAreas();
   const b=document.createElement('button');b.type='button';b.className='location ps3-all-area';b.dataset.ps3All='1';
   b.innerHTML='<b>Wszystkie obszary</b><span>Przeszukaj rejestry całej sprawy</span>';
   b.addEventListener('click',()=>{scope='all';renderAreas();resultBox.textContent='Szukasz we wszystkich obszarach. Wpisz własne pytanie lub opis materiału.';});
   areaBox.prepend(b);updateScope();
 };
 areaBox.addEventListener('click',e=>{if(e.target.closest('[data-area]'))scope='area';},true);
 renderAreas();
 resultBox.textContent='Wpisz, czego szukasz. Nie musisz znać dokładnego tytułu dokumentu.';

 // Bez ujawniania treści nieodkrytych akt. Indeks zawiera wyłącznie nazwy, wydawców i ogólne określenia.
 const EXTRA={
  'MED-01':['wypadek','zdarzenie w zajezdni','co stalo sie lenie','znalezienie ofiary','zawiadomienie o wypadku','kto znalazl lene'],
  'MED-02':['badanie ciala','oględziny zwlok','co z obrazeniami','stan ofiary'],
  'MED-03':['kiedy zmarla lena','godzina smierci','pora zgonu','czas zgonu'],
  'MED-07':['wypadek','interwencja ratownikow','pogotowie','karetka','pomoc medyczna'],
  'TEC-03':['awaria wagonu','usterka tramwaju','alarm techniczny','blad komputera tramwaju'],
  'EVID_WORK_ORDER_RAW':['zlecenie naprawy','co mechanik mial naprawic','polecenie warsztatowe'],
  'EVID_SERVICE_FORM_GAPS':['zmiana formularza naprawy','kto poprawial protokol','uzupelniony protokol'],
  'EVID_ACCEPTANCE_RECORD':['odbior czesci','kontrola podzespolu','przyjeto element do tramwaju'],
  'TEC-14':['sygnal ze stanowiska','impuls czujnika','czujnik przy stanowisku numer 3'],
  'EVID_RAW_ENTRY_TIMES':['kto wchodzil do zajezdni','wejscia pracownikow','lista osob na bramce','ruch personelu'],
  'EVID_T17_DOOR_EVENT':['kto otwieral drzwi','czytnik karty','karta dostepowa','przepustka'],
  'EVID_PAYROLL_MANUAL_EDIT':['zmienione godziny pracy','korekta czasu pracy','ktos zmienil grafik','edycja godzin'],
  'EVID_DISPATCH_REVISION':['zmieniona dyspozycja','zmiana polecenia tramwaj','nowe polecenie dla wagonu'],
  'EVID_BHP_DRAFT':['zgloszenie zagrozenia','ostrzezenie bezpieczenstwa','skarga leny','ryzyko zagrozenia' ],
  'VIS-02':['zdjecie z wypadku','fotografia miejsca znalezienia','gdzie byla lena','zdjecie stanowiska'],
  'VIS-03':['nagranie korytarz','kamera poludniowa','monitoring korytarza'],
  'VIS-04':['monitoring hali','kamera hali','film z hali','nagranie przy hali'],
  'VIS-05':['kamera warsztatu','film z warsztatu','monitoring przy naprawach'],
  'VIS-10':['rozmieszczenie kamer','gdzie kamery','plan monitoringu'],
  'ADM-01':['kto pracowal w nocy','obsada nocnej zmiany','pracownicy na zmianie'],
  'ADM-13':['wypadek','miejsce wypadku','protokol miejsca zdarzenia','stanowisko numer trzy'],
  'LAB-01':['slady na stanowisku' ,'jakie probki','material z miejsca','pobrane probki'],
  'LAB-02':['slady smaru','tlusta substancja','olej przy stanowisku'],
  'LAB-03':['włókna na odziezy','nici na ubraniu','material na ubraniu'],
  'DIG-01':['z kim lena rozmawiala','rozmowy telefoniczne','polaczenia telefoniczne'],
  'DIG-10':['kto wezwal pomoc','alarm o drugiej','zgloszenie w dyspozytorni'],
  'EVID_RADIO_GAP':['brakujace nagranie radia','przerwa w radiu','zniknela lacznosc']
 };
 // P1: jawna mapa intencji -> identyfikatory znanych kategorii materiałów.
 // Nie indeksujemy tekstu jeszcze niezdobytych dokumentów ani nie zgadujemy sprawcy.
 const PS_P1_INTENTS=[
  {test:q=>/(znalezion|odnalezion|odkryt|natraf|zauwaz|zglosz)/.test(q)&&/(kiedy|godzin|czas|por[aey]|o ktorej)/.test(q)&&/(len|ofiar|cia[łl]|miejs|stanowis)/.test(q), docs:['MED-01','DIG-10','ADM-13'], score:3.65},
  {test:q=>/(obrazen|uraz|ran|siniak|slad|znak)/.test(q)&&/(cia[łl]|skor|len|ofiar|zwlok)/.test(q), docs:['MED-02','MED-03','LAB-03'],score:3.6},
  {test:q=>/(sekcj|autopsj|badani|medyczn|lekarz|obrazen|cial)/.test(q)&&/(len|zwlok|ofiar|ciel|cia[łl])/.test(q), docs:['MED-02','MED-03'],score:3.5},
  {test:q=>/^(log|logi|logow|logach|logami|logowac|logowanie)(\s|$)/.test(q), docs:['TEC-03','TEC-14','EVID_T17_DOOR_EVENT','EVID_RAW_ENTRY_TIMES'],score:3.1},
  {test:q=>/(log|zdarzen|histori)/.test(q)&&/(komputer|system|tramwaj|wagon|czujnik|sterownik)/.test(q), docs:['TEC-03','TEC-14'],score:3.55},
  {test:q=>/(kto|kim|czyj)/.test(q)&&/(wezwal|powiadomil|zglosil)/.test(q)&&/(pomoc|pogotow|alarm|ratown)/.test(q), docs:['DIG-10','MED-01'],score:3.4},
  {test:q=>/(kto|czyja|czyj)/.test(q)&&/(wszedl|wchodz|wejsc|bram|dostep)/.test(q), docs:['EVID_RAW_ENTRY_TIMES','EVID_T17_DOOR_EVENT'],score:3.45}
 ];
 const PS_P1_SPOILER_QUERY=q=>/(kto|czy|jak)/.test(q)&&/(zabil|zamordowal|morderc|sprawca|winny)/.test(q);
 const GROUPS=[
  ['wejscie',/^(wejsc|wejs|wchod|wchodz|wesz|wejd|wchodzil|wchodza|wejsci|bramk)/],
  ['smierc',/^(smierc|zgon|zmar|zwlok|trup)/],
  ['monitoring',/^(kamer|monitor|nagran|film|wideo|video|kadry|kadr)/],
  ['tramwaj',/^(tramwaj|wagon|pojazd|tabor)/],
  ['godzina',/^(godzin|czasu|czasow|czasie|czasy|pora)/],
  ['pracownik',/^(pracownik|personel|zatrudn|zalog|dyzur)/],
  ['dokument',/^(dokument|formularz|druk|pismo|protokol)/],
  ['naprawa',/^(napraw|serwis|warsztat|mechanik|remont)/],
  ['awaria',/^(awari|usterk|uszkodzen|blad|ostrzez)/],
  ['zmiana',/^(zmian|popraw|edyc|korekt|modyfik)/],
  ['zdjecie',/^(fotograf|zdjec|fotka|obraz)/],
  ['slad',/^(slad|probk|material|zabezpieczen)/],
  ['obrazenie',/^(obrazen|uraz|rana|kontuzj)/],
  ['bezpieczenstwo',/^(bhp|bezpiecz|zagrozen|ryzyk)/],
  ['polaczenie',/^(polaczen|dzwon|telefon|rozmow)/],
  ['drzwi',/^(drzwi|wejscie|furtk|bram)/]
 ];
 const IGNORE=new Set('czy ze jak jaka jakie jakiego gdzie kiedy ktora ktory ktore mozna mozliwe moge chce trzeba bylem byla bylo byli osoby ktos cos tego temu ten tam to jest sa sie oraz jestes jakieś czyje mnie pan pani zeby dlaczego sprawdz prosze poszukaj szukam znajdz szukaj potrzebuje interesuje o przy na w we do od ze i a z za pod nad przed po kto kogo dla ktorego informacje informacja informacji danych sprawy sprawa sprawie dotyczace dotyczacy dotyczaca dotyczacych'.split(' '));
 const GENERIC=new Set('dokument dokumenty rejestr raport zapis zapisy karta kart wykaz lista informacja cos dowod dowody sprawa'.split(' '));
 const fold=t=>norm(t);
 const words=t=>fold(t).split(' ').filter(w=>w.length>=3&&!IGNORE.has(w));
 function form(w){for(const [name,test] of GROUPS)if(test.test(w))return name;return w.slice(0,w.length<=5?w.length:5);}
 function lex(x){return words(x).map(form);}
 function closeness(a,b){if(a===b)return 1;if(a.length>=4&&b.length>=4&&(a.startsWith(b)||b.startsWith(a)))return .7;return 0;}
 function ratio(q,content){if(!q.length||!content.length)return 0;return q.reduce((v,x)=>v+Math.max(0,...content.map(y=>closeness(x,y))),0)/q.length;}
 const idx=new Map(DOCS.map(d=>[d.id,{
   title:lex(d.title+' '+d.id.replace(/[_-]/g,' ')),issuer:lex(d.issuer||''),
   aliases:(EXTRA[d.id]||[]).map(lex)
 }]));
 function relevance(query,d){
   const q=lex(query), i=idx.get(d.id);if(!q.length||!i)return 0;
   const old=PS602_SEARCH.score(query,d.id)||0;
   const titleMatch=ratio(q,i.title),issuerMatch=ratio(q,i.issuer);
   const aliasMatch=Math.max(0,...i.aliases.map(p=>ratio(q,p)));
   const qNorm=fold(query),title=fold(d.title);
   let score=Math.max(old,titleMatch*2.12,issuerMatch*.78,aliasMatch*2.52);
   if(!PS_P1_SPOILER_QUERY(qNorm)){
     for(const rule of PS_P1_INTENTS){if(rule.docs.includes(d.id)&&rule.test(qNorm))score=Math.max(score,rule.score);}
   }
   if(qNorm.length>=7&&title.includes(qNorm))score+=.28;
   // Tylko ogólne „dokument”, „raport” itd. nie otwiera od razu tajnych akt.
   if(words(query).every(w=>GENERIC.has(w)))score=0;
   return score;
 }
 function status(d){
  if(STATE.found.has(d.id))return 'found';
  if(sceneSourceForDoc(d.id))return 'scene';
  if(searchCanAcquire(d))return sceneDocBlocked(d.id)?'locked':'available';
  return 'analysis';
 }
 function actionFor(entry){
  const {d}=entry,st=status(d);if(st==='found')return ['W aktach','Otwórz'];
  if(st==='scene')return ['Oględziny','Zbadaj punkt'];
  if(st==='available')return ['Nowy materiał','Zabezpiecz'];
  if(st==='locked')return ['Wymaga ustaleń','Sprawdź warunki'];
  return ['Analiza','Przejdź do analiz'];
 }
 function goScene(d){
  const spot=sceneSourceForDoc(d.id);if(!spot)return;
  scPickRoom(spot.room);scDiscover(spot.id);showTab('inspection12');
  requestAnimationFrame(()=>document.getElementById('scDetail')?.scrollIntoView({block:'start',behavior:'smooth'}));
  toast('Odnaleziono punkt: '+spot.title+'. Wykonaj oględziny, by zdobyć dowód.');
 }
 function openFound(d){activeDoc=d.id;showTab('evidence');renderDocs();}
 function acquire(d){
  if(STATE.found.has(d.id)||!searchCanAcquire(d)||sceneDocBlocked(d.id)||sceneSourceForDoc(d.id)){
   searchStage3();return;
  }
  STATE.found.add(d.id);PS_EVENTS.evidence(d.id,'cross-area-search');activeDoc=d.id;renderCounts();renderAttached();
  tcmsRefresh();msgRefresh();cctvRefresh();forensicRefresh();accessRefresh();
  if(typeof ui14ScheduleUpdate==='function')ui14ScheduleUpdate();
  toast('Do akt dodano: '+d.title);searchStage3();
 }
 function act(entry){
  const d=entry.d,st=status(d);
  if(st==='found')return openFound(d);
  if(st==='scene')return goScene(d);
  if(st==='available')return acquire(d);
  if(st==='locked'){
   const missing=scDocMissing(d.id)||[];
   resultBox.replaceChildren();const p=document.createElement('p');p.className='ps3-empty';
   p.textContent='Ten materiał wymaga wcześniejszych ustaleń. '+(missing.length?'Najpierw sprawdź: '+missing.map(id=>byId[id]?.title||'wcześniejszy materiał').join('; ')+'.':'Kontynuuj dochodzenie w pozostałych modułach.');
   resultBox.append(p);return;
  }
  showTab('labs');
 }
 function searchStage3(){
  const q=queryInput.value.trim().slice(0,180);
  resultBox.replaceChildren();
  if(PS_P1_SPOILER_QUERY(fold(q))){
   const p=document.createElement('p');p.className='ps3-empty';p.textContent='Wskazanie sprawcy wymaga porównania źródeł i dedukcji. Wyszukaj konkretny zapis, zdarzenie lub ślad — wyszukiwarka nie rozstrzyga winy.';
   resultBox.append(p);return;
  }
  if(q.length<3||!words(q).length){resultBox.textContent='Opisz osobę, zdarzenie, miejsce albo zapis, np. „kto wchodził do zajezdni?” lub „kamera przy hali”.';return;}
  const pool=DOCS.filter(d=>scope==='all'||d.area===STATE.area);
  const threshold=lex(q).length>1?1.44:1.10;
  const matches=pool.map(d=>({d,sc:relevance(q,d)})).filter(x=>x.sc>=threshold).sort((a,b)=>b.sc-a.sc||xRank(a)-xRank(b));
  if(!matches.length){
   const no=document.createElement('div');no.className='ps3-empty';no.innerHTML='<strong>Nie znaleziono odpowiedniego materiału</strong><p>Spróbuj podać funkcję zapisu, osobę, miejsce albo inną nazwę tej samej rzeczy. Nie musisz znać dokładnego tytułu.</p>';
   const other=scope==='area'?DOCS.filter(d=>d.area!==STATE.area).map(d=>({d,sc:relevance(q,d)})).sort((a,b)=>b.sc-a.sc)[0]:null;
   if(other?.sc>=threshold){const b=document.createElement('button');b.type='button';b.className='btn alt';b.textContent='Szukaj we wszystkich obszarach';b.addEventListener('click',()=>{scope='all';renderAreas();searchStage3();});no.append(b);}
   resultBox.append(no);return;
  }
  const headline=document.createElement('p');headline.textContent='Pasujące materiały — '+matches.length+(matches.length>6?' (pokazano 6 najtrafniejszych)':'')+'. Wybierz czynność; samo wyszukanie nie zalicza badań.';
  resultBox.append(headline);
  const list=document.createElement('div');list.className='ps3-match-list';
  for(const item of matches.slice(0,6)){
   const d=item.d,[kind,buttonLabel]=actionFor(item),line=document.createElement('div');line.className='ps3-match ps602-result';line.dataset.ps3Id=d.id;
   const desc=document.createElement('div'),kindEl=document.createElement('span'),name=document.createElement('strong'),origin=document.createElement('small');
   kindEl.className='ps3-kind';kindEl.textContent=kind;
   name.textContent=d.title;
   origin.textContent='Obszar: '+label(d.area)+(status(d)==='scene'?' · punkt oględzin':status(d)==='analysis'?' · wymaga opracowania':'');
   desc.append(kindEl,name,origin);
   const button=document.createElement('button');button.type='button';button.className='btn alt';button.textContent=buttonLabel;
   button.addEventListener('click',()=>act(item));line.append(desc,button);list.append(line);
  }
  resultBox.append(list);
  const footer=document.createElement('p');footer.className='ps3-search-note';footer.textContent='Wyniki dopasowano do nazw i opisów poszukiwanych materiałów; nie przeszukiwano treści nieodkrytych dokumentów.';resultBox.append(footer);
 }
 function xRank(x){const order={found:0,scene:1,available:2,locked:3,analysis:4};return order[status(x.d)]||0;}
 goButton.removeEventListener('click',oldSearch);
 // Najpierw aktualizujemy wyniki, potem istniejący system pomocy może odczytać nowy stan.
 goButton.addEventListener('click',searchStage3,true);
 searchArea=searchStage3; // Obsługa klawisza Enter dodana we wcześniejszej wersji.
 window.PS3_SEARCH={search:searchStage3,score:(query,id)=>byId[id]?relevance(query,byId[id]):0,scope:()=>scope,setScope:(v,area)=>{scope=v==='area'?'area':'all';if(area&&AREAS.some(a=>a.id===area))STATE.area=area;renderAreas();}};
})();
