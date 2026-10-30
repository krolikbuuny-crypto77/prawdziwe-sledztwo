
/* Prawdziwe Śledztwo — Minigry 3.1. Autonomiczne wieloetapowe zadania oparte na danych sprawy. */
(function(){
'use strict';
const KEYS=['tcms','msg','cctv','forensic','access'];
const NAME={tcms:'Rekonstrukcja sesji TCMS',msg:'Rekonstrukcja transmisji',cctv:'Weryfikacja wielokamerowa',forensic:'Badanie porównawcze',access:'Rekonstrukcja przemieszczania'};
const ROOT={tcms:'tcmsWorkspace',msg:'msgWorkspace',cctv:'cctvWorkspace',forensic:'forensicWorkspace',access:'accessWorkspace'};
// Wskazówki opisują wyłącznie metodę analizy. Nie zawierają identyfikatorów
// poprawnych rekordów, wartości zegarów ani odpowiedzi do testów.
const METHOD={
 tcms:['W oddzielnych kolumnach notuj sesję, rodzaj wpisu i czas. Uporządkuj zdarzenia, dopiero potem odrzucaj kopie.','Zestaw dwa zapisy po sesji, kodzie i typie transmisji; sam identyczny czas nie wystarcza.','Oddziel to, co rzeczywiście zmierzył rejestr techniczny, od hipotezy o osobie.'],
 msg:['Sprawdź każdy odnośnik poprzednik/następnik i ciągłość wątku. Zgodny numer slotu nie wystarczy.','Zastanów się, czy integralność dokumentu i autorstwo są tą samą kategorią dowodu.','Podziel dane na konto, urządzenie i fizycznego użytkownika. Oceń, czego brakuje do identyfikacji.'],
 cctv:['Porównaj zdarzenia wspólne dla kamer; zapisz kierunek błędu każdego zegara.','Najpierw przelicz surowe czasy na wspólną oś, dopiero potem ustaw kolejność kadrów.','Oddziel chronologię, jakość obrazu i obszary niewidoczne dla kamer.'],
 forensic:['Porównuj pary według typu materiału oraz wszystkich sześciu cech, nie samego podobieństwa nazw.','Sprawdź, czy materiał mógł zostać przeniesiony wtórnie podczas działań ratowniczych.','Porównaj siłę przesłanek o materiale z tym, co można powiedzieć o człowieku.'],
 access:['Wypisz dla każdego źródła: co rejestruje, a czego nie może pokazać.','Zapisz strefy i policz minimalne odcinki drogi osobno, bez zakładania tożsamości.','Sprawdź różnicę między aktywną sesją, użyciem identyfikatora i obecnością człowieka.']
};

const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fresh=()=>Object.fromEntries(KEYS.map(k=>[k,{step:0,stages:[],sequence:[],form:{},attempts:0,feedback:'',failed:false}]));
let data=fresh();
let stateObjects=null;
// Eligibility is identical to the visible laboratory workflow, not a second
// source of puzzle-specific secrets. Every path must check it before rendering
// records, evaluating answers, crediting stages or exposing saved progress.
const canAnalyze=k=>{
 const owned=STATE?.found;
 if(!owned||typeof owned.has!=='function')return false;
 if(k==='tcms')return TCMS_INPUT.filter(id=>owned.has(id)).length>=2;
 if(k==='msg')return MSG_INPUT.filter(id=>owned.has(id)).length>=2;
 if(k==='cctv')return CCTV_INPUT.every(id=>owned.has(id));
 if(k==='forensic')return FO_INPUT.filter(id=>owned.has(id)).length>=2;
 if(k==='access')return ACCESS_SECRET.gate_inputs.filter(id=>owned.has(id)).length>=2;
 return false;
};
const done=k=>canAnalyze(k)&&data[k].stages.length===3;
const choices=(id,items,placeholder='— Wybierz uzasadnioną odpowiedź —')=>`<label class="p3-field">${safe(id)}<select data-p3-input="${safe(id)}"><option value="">${safe(placeholder)}</option>${items.map(([v,l])=>`<option value="${safe(v)}">${safe(l)}</option>`).join('')}</select></label>`;

/* Każdy finał etapu 3 wymaga jednej z pięciu interpretacji, nie pisemnego eseju. */
const PUZZLE5_FINAL={"tcms":[["autofault","Alarm TCMS i sygnał stanowiska są zbliżone czasowo, więc po skorygowaniu zegarów można przypisać impuls ruchowi wagonu."],["single","Retransmisja tego samego pakietu wspiera jeden ciąg diagnostyczny; odpowiadający mu impuls stanowiska należy traktować jako część tej sesji."],["ignore","Diagnostyka ma wartość chronologiczną, ale bez identyfikatora osoby nie należy zestawiać jej z rejestrem czujnika stanowiska."],["best","TCMS i czujnik mierzą odrębne zdarzenia. Zbieżność czasu pomaga badać przebieg nocy, lecz nie dowodzi ruchu wagonu ani tożsamości osoby."],["person","Identyfikator sesji technicznej łączy alarm z operatorem, dlatego czas impulsu można przypisać jego obecności w niszy."]],"msg":[["account","Spójne metadane konta i urządzenia pozwalają przypisać wysyłkę formalnemu użytkownikowi, jeśli nie zgłoszono przekazania dostępu."],["erase","Odtworzenie łańcucha bloków dokumentuje treść, lecz bez pełnej historii serwera nie można korzystać z żadnych metadanych konta."],["best","Odzyskane fragmenty ustalają treść zaproszenia. Rejestr opisuje konto i urządzenie; rzeczywistego użytkownika trzeba potwierdzić osobno."],["checksum","Weryfikacja integralności pozwala ustalić konto nadawcze, a zgodny identyfikator konta uwiarygodnia kolejność fragmentów."],["motive","Treść zaproszenia potwierdza zamiar spotkania, a jego zgodność z godziną sesji wystarcza do przypisania fizycznej obecności autora."]],"cctv":[["face","Synchronizacja umożliwia zestawienie kadru z przejściem T-17; zgodność zdarzeń może zastąpić brak wyraźnego ujęcia twarzy."],["absence","Brak obrazu z niszy ogranicza dokumentację, ale zgodne znaczniki wejścia i wyjścia pozwalają przyjąć, że w środku nikogo nie było."],["discard","Zróżnicowanie odchyłek zegarów świadczy o braku wspólnej podstawy czasowej, dlatego porównywanie kolejności nie ma wartości."],["card","Użycie T-17 i skorygowany czas kamery tworzą wspólną sekwencję, która pozwala rozpoznać formalnego właściciela karty na nagraniu."],["best","Synchronizacja pozwala ustalić kolejność kadrów. Nie poprawia ostrości nagrań ani nie pokazuje obszaru poza polem kamer."]],"forensic":[["similar","Zgodność sześciu cech materiału ogranicza liczbę źródeł do jednego egzemplarza, choć jego użytkownika należałoby potwierdzić osobno."],["best","Profile materiałów wspierają porównanie śladów; próbki kontrolne służą ocenie transferu. Sam wynik nie ustala sprawcy."],["ignore","Próbka kontrolna ujawnia ryzyko wtórnego transferu, co wyłącza profile kontaktowe z rekonstrukcji, dopóki nie pojawi się bezpośredni świadek."],["fall","Dwa wzorce obrażeń mogą pochodzić z jednego upadku; obecność śladów materiałowych nie wymaga więc odrębnej hipotezy kontaktu."],["mix","Sześć cech profilu daje wspólną skalę porównania, dlatego możliwe jest zestawienie smaru z włóknem po normalizacji pomiarów."]],"access":[["identity","Przydział T-17 i zgodna godzina odczytu potwierdzają obecność formalnego posiadacza, a CCTV jest potrzebne do odtworzenia dalszej drogi."],["meeting","Nieprzerwana wideokonferencja dokumentuje aktywność połączenia i tym samym może być traktowana jako ciągła obecność uczestniczki."],["noexit","Brak odbicia karty przy wyjściu ogranicza wariant powrotu z hali; przy nieprzerwanej transmisji należy go uznać za niewykonalny."],["best","Logi karty i kamer wspierają rekonstrukcję trasy. Aktywna sesja nie dowodzi stałej obecności przy ekranie ani tożsamości przechodzącego."],["dismiss","Zapis karty i czas dojścia pozwalają analizować dostęp, ale bez wyraźnej twarzy na monitoringu nie da się formułować hipotez o trasie."]]};
function finalFive(k){return `<fieldset class="p3-final-choice"><legend>Wybierz najlepsze uzasadnienie spośród pięciu</legend><div class="p3-final-choices">${sc35Order('puzzle-final-'+k,PUZZLE5_FINAL[k].length).map((idx,i)=>{const [code,label]=PUZZLE5_FINAL[k][idx];return`<label class="p3-final-option"><input type="radio" name="p3-five-${k}" data-p3-input="Uzasadnienie" value="${safe(code)}"><span><b>${String.fromCharCode(65+i)}.</b> ${safe(label)}</span></label>`;}).join('')}</div></fieldset>`;}

const nInput=(id,placeholder)=>`<label class="p3-field">${safe(id)}<input data-p3-input="${safe(id)}" type="number" inputmode="numeric" min="-360" max="360" step="1" placeholder="${safe(placeholder)}"></label>`;
function points(text){return `<p class="p3-instruction">${text}</p>`;}
const pack=r=>`${r.id} · ${r.time} · ${r.session} · ${r.code} · ${r.quality}`;
const block=r=>`${r.id} · ${r.block} · prev: ${r.prev} · next: ${r.next} · ${r.thread}`;
const shot=r=>`${r.id} · kamera ${r.camera} · ${r.display} · ${r.marker}`;
const accessSourceOptions=[['EVID_CCTV_SYNC','Zsynchronizowane nagrania CCTV'],['EVID_T17_DOOR_EVENT','Dziennik czytnika T-17'],['EVID_CONFERENCE_SESSION','Aktywna sesja wideokonferencji'],['ADM-11','Dokument administracyjny ADM-11']];
function records(k,s){
 if(k==='tcms'&&s===0)return TCMS_LOGS.filter(r=>['auth','phase','warn','close','readback','readback2','decoy','retry','bridge'].includes(r.kind)).map(r=>({id:r.id,label:pack(r)}));
 if(k==='msg'&&s===0)return MSG_RECORDS.filter(r=>r.slot==='4107').map(r=>({id:r.id,label:block(r)}));
 if(k==='cctv'&&s===1)return ['CAM-0001','CAM-0003','CAM-0043','CAM-0067','CAM-0075','CAM-0243'].map(id=>CCTV_BYID[id]).filter(Boolean).map(r=>({id:r.id,label:shot(r)}));
 if(k==='access'&&s===1)return AX_ZONES.map(([id,label])=>({id,label:label+' · '+id}));
 return [];
}
function sequenceEditor(k,s,length){
 const d=data[k],items=records(k,s),have=d.sequence;
 return `<div class="p3-data-cards">${items.map(r=>`<button class="p3-entry ${have.includes(r.id)?'used':''}" type="button" data-p3-pick="${safe(r.id)}" ${(k!=='access'&&have.includes(r.id))||have.length>=length?'disabled':''}>${safe(r.label)}</button>`).join('')}</div>
 <div class="p3-sequence" aria-label="Ułożona sekwencja">${Array.from({length},(_,i)=>`<div class="p3-slot"><small>${i+1}</small><b>${safe(have[i]||'Wybierz rekord')}</b></div>`).join('')}</div>
 <div class="p3-actions"><button type="button" class="btn alt" data-p3-undo="1">Cofnij ostatni</button><button type="button" class="btn subtle" data-p3-clear="1">Wyczyść układ</button></div>`;
}
function caption(k,s){
 const x={
 tcms:['Odtwórz cztery etapy rzeczywistej sesji DIAG-217/N w kolejności: autoryzacja, uruchomienie testu, ostrzeżenie, zamknięcie. Odrzuć odczyty kontrolne, kopie i wpisy z innych sesji.','Wskaż pierwotny pakiet ostrzeżenia i jego retransmisję. Ta sama treść dwukrotnie nie musi oznaczać dwóch awarii.','Odróżnij diagnostykę tramwaju od odrębnego impulsu czujnika stanowiska. Wskaż dwie granice wnioskowania i wybierz najlepsze z pięciu uzasadnień.'],
 msg:['Zbuduj kompletny pięcioblokowy łańcuch slotu 4107, kontrolując pola prev/next. Dwa bloki tego samego slotu są fałszywymi tropami.','Rozstrzygnij, czy sam zgodny łańcuch dowodzi autorstwa, i oceń znaczenie technicznej integralności komunikatu.','Skonfrontuj konto nadawcze, urządzenie i człowieka. Wskaż dwa ograniczenia identyfikacji i wybierz jedno z pięciu uzasadnień.'],
 cctv:['Ustal przesunięcia zegarów trzech kamer w sekundach na podstawie kotwic z oryginalnej pracowni CCTV. Znak dodatni oznacza zegar wyprzedzający.','Ułóż trzy kadry ruchu w kolejności czasu centralnego, a nie kolejności identyfikatorów lub godzin surowych. Odrzuć inne zdarzenia.','Oceń, co daje synchronizacja, a czego nie może pokazać nieostry obraz. Wybierz najlepiej poparte uzasadnienie spośród pięciu.'],
 forensic:['Sklasyfikuj trzy pary próbek według sześciu cech liczbowych. Porównuj tylko tę samą klasę materiału; bliskość numeryczna nie oznacza pewnej tożsamości.','Zidentyfikuj wpływ próbki kontrolnej z rękawic ratowników na ocenę śladu S-3A i wyjaśnij ryzyko transferu.','Połącz ocenę urazów z granicami wnioskowania. Czy same profile określają mechanizm i osobę? Wybierz najlepiej poparte danymi stanowisko spośród pięciu.'],
 access:['Wybierz dwa niezależne źródła, które pozwalają odtwarzać ruch i użycie identyfikatora, oraz ustal, co każde faktycznie mierzy.','Ułóż trasę pięciu stref od pokoju audytu do stanowiska i z powrotem. Następnie sprawdź czas minimalny każdej z czterech części drogi.','Zestaw możliwą trasę, kartę dostępu i aktywną wideokonferencję. Odróżnij możliwość przejścia od dowodu tożsamości.']
 };return x[k][s];
}
function stageUI(k,s){
 if(k==='tcms'){
  if(s===0)return sequenceEditor(k,s,4);
  if(s===1){const ids=['P0326','P0327','P0328','P0329','P0330','P0354'],opts=ids.map(id=>TCMS_LOGS.find(r=>r.id===id)).filter(Boolean).map(r=>[r.id,pack(r)]);return `<div class="p3-fields">${choices('Pakiet pierwotny',opts)}${choices('Retransmisja',opts)}${choices('Ocena duplikatu',[['repeat','Retransmisja jednego ostrzeżenia'],['new','Dwie niezależne awarie'],['fatal','Dowód ruchu tramwaju podczas zgonu']])}</div>`;}
  return `<div class="p3-fields">${choices('Związek rejestrów',[['separate','Oddzielne urządzenia i zdarzenia'],['same','Jeden wspólny rejestr zdarzenia'],['person','Zapis wskazuje użytkownika karty']])}${choices('Granica wniosku',[['limited','Zbieżność nie dowodzi mechanizmu ani sprawcy'],['murder','Zapis sam dowodzi umyślnego zabójstwa'],['motion','Każde ostrzeżenie to ruch pojazdu']])}</div>${finalFive(k)}`;
 }
 if(k==='msg'){
  if(s===0)return sequenceEditor(k,s,5);
  if(s===1)return `<div class="p3-fields">${choices('Co potwierdzają wskaźniki prev/next?',[['chain','Kolejność fragmentów w konkretnym wątku'],['author','Tożsamość fizycznego nadawcy'],['location','Lokalizację osoby w chwili wysłania']])}${choices('Co daje kontrola integralności?',[['unchanged','Pomaga wykryć zmiany danych, nie identyfikuje osoby'],['identity','Jednoznaczny podpis własnoręczny'],['noevidence','Dowodzi całkowitej fałszywości metadanych']])}</div>`;
  return `<div class="p3-fields">${choices('Identyfikator konta',[['account','Potwierdza użyty kontekst konta, nie rękę operatora'],['face','Ustala twarz osoby fizycznej'],['motive','Ustala motyw działania']])}${choices('Dane urządzenia',[['device','Potrzebują niezależnego potwierdzenia użytkownika'],['sure','Samodzielnie wskazują sprawcę'],['erase','Unieważniają całą treść wiadomości']])}</div>${finalFive(k)}`;
 }
 if(k==='cctv'){
  if(s===0)return `<div class="p3-fields p3-nums">${nInput('Kamera A: przesunięcie [s]','np. +160')}${nInput('Kamera B: przesunięcie [s]','np. -80')}${nInput('Kamera C: przesunięcie [s]','np. +50')}</div>`;
  if(s===1)return sequenceEditor(k,s,3);
  return `<div class="p3-fields">${choices('Znaczenie synchronizacji',[['order','Poprawia ocenę następstwa zdarzeń'],['identity','Rozpoznaje twarz mimo braku szczegółów'],['cause','Dowodzi przyczyny zgonu']])}${choices('Nieostry obraz',[['limited','Nie wystarcza do pewnej identyfikacji osoby'],['strong','Pozwala bez wątpliwości wskazać posiadacza karty'],['none','Dowodzi braku jakiejkolwiek obecności']])}</div>${finalFive(k)}`;
 }
 if(k==='forensic'){
  if(s===0)return `<div class="p3-data-cards">${[['W-7A','P-A1'],['W-7A','C-0W'],['S-3A','S-W1']].map((pair,i)=>{const a=FO_BYID[pair[0]],b=FO_BYID[pair[1]];return `<div class="p3-card"><b>Para ${i+1}: ${safe(a.id)} ↔ ${safe(b.id)}</b><small>${safe(a.kind)} · ${safe(b.kind)}; wektory: ${safe(a.vector.join('/'))} i ${safe(b.vector.join('/'))}</small>${choices('Ocena pary '+(i+1),[['match','Zgodność klasy materiału'],['uncertain','Wynik graniczny'],['different','Różne profile'],['uncomparable','Nieporównywalne rodzaje']])}</div>`;}).join('')}</div>`;
  if(s===1){const a=FO_BYID['S-3A'],b=FO_BYID['C-RĘ'];return `<div class="p3-evidence"><b>${safe(a.id)} · ${safe(a.kind)}</b> · ryzyko: ${safe(a.risk)}<br><b>${safe(b.id)} · ${safe(b.kind)}</b> · ryzyko: ${safe(b.risk)}</div><div class="p3-fields">${choices('Znaczenie kontroli',[['transfer','Możliwy wtórny transfer, wymaga niezależnego potwierdzenia'],['suspect','Wskazuje osobę, która użyła smaru'],['ignore','Próbkę kontrolną wolno pominąć']])}${choices('Wniosek przy podobnych wektorach',[['class','Podobieństwo klasy bez identyfikacji źródła'],['finger','Niezbity dowód osobowy'],['nothing','W ogóle nie można porównywać smarów']])}</div>`;}
  return `<div class="p3-fields">${choices('Ocena profilu urazów',[['multiple','Należy rozważyć więcej niż jeden mechanizm kontaktu'],['fall','Zwykły upadek wyjaśnia każdy wynik'],['identity','Profil wskazuje konkretną osobę']])}${choices('Granica identyfikacji',[['limits','Zgodność cech nie przypisuje śladu człowiekowi'],['sure','Każdy podobny profil ma jednego właściciela'],['none','Dokumenty laboratoryjne nie mają znaczenia']])}</div>${finalFive(k)}`;
 }
 if(k==='access'){
  if(s===0)return `<div class="p3-fields">${choices('Źródło obrazu',accessSourceOptions)}${choices('Źródło użycia karty',accessSourceOptions)}${choices('Weryfikacja źródeł',[['independent','Dwa różne rejestry nie są dowodem tożsamości'],['person','Karta i obraz jednoznacznie rozpoznają osobę'],['same','To jeden duplikat tego samego rejestru']])}</div>`;
  if(s===1)return sequenceEditor(k,s,5)+`<div class="p3-fields p3-nums">${['Odcinek 1 [s]','Odcinek 2 [s]','Odcinek 3 [s]','Odcinek 4 [s]'].map(n=>nInput(n,'Czas przejścia w sekundach')).join('')}</div><p class="p3-note">Wpisz minimalny wiarygodny czas dla każdego odcinka, korzystając z planu i danych o przejściach. Czas równy minimum jest dopuszczalny.</p>`;
  return `<div class="p3-fields">${choices('Wniosek z trasy',[['possible','Przejście może być wykonalne, ale nie identyfikuje osoby'],['killer','Możliwość przejścia dowodzi sprawstwa'],['impossible','Każda aktywna sesja wyklucza wyjście']])}${choices('Wideokonferencja bez kamery',[['session','Aktywna sesja nie potwierdza nieprzerwanej obecności'],['presence','Potwierdza lokalizację przez cały czas'],['camera','Umożliwia rozpoznanie twarzy poza kadrem']])}</div>${finalFive(k)}`;
 }
 return '';
}
function evaluate(k,s,d){
 const f=d.form,seq=d.sequence;
 const invalid=msg=>'Etap niezaliczony. '+msg;
 const full=(fields)=>fields.every(key=>String(f[key]??'').trim());
 if(k==='tcms'){
  if(s===0){const good=['auth','phase','warn','close'].map(q=>TCMS_LOGS.find(r=>r.kind===q)?.id);if(seq.length!==4)return invalid('Potrzebujesz czterech pakietów.');if(seq.join('|')!==good.join('|'))return invalid('Przyjrzyj się sesji, kodowi i kolejności: odrzuć kontrolne odczyty i retransmisje.');return '';} 
  if(s===1){if(!full(['Pakiet pierwotny','Retransmisja','Ocena duplikatu']))return invalid('Uzupełnij wszystkie pola.');const a=TCMS_LOGS.find(r=>r.id===f['Pakiet pierwotny']),b=TCMS_LOGS.find(r=>r.id===f['Retransmisja']);if(!a||!b||a.kind!=='warn'||b.kind!=='retry'||a.code!==b.code||a.session!==b.session||f['Ocena duplikatu']!=='repeat')return invalid('Porównaj status PRIMARY/RETRY, kod i sesję obu rekordów.');return '';} 
  if(f['Związek rejestrów']!=='separate'||f['Granica wniosku']!=='limited')return invalid('Nie utożsamiaj pomiaru technicznego, czujnika i osoby.');
 }
 if(k==='msg'){
  if(s===0){if(seq.length!==5)return invalid('Łańcuch wymaga pięciu bloków.');const rows=seq.map(id=>MSG_BY_ID[id]);if(rows.some(r=>!r)||new Set(rows.map(r=>r.id)).size!==5)return invalid('Wybierz pięć odrębnych rekordów.');if(rows.some(r=>r.slot!==rows[0].slot||r.thread!==rows[0].thread)||rows[0].prev!=='—'||rows[4].next!=='—'||rows.slice(1).some((r,i)=>r.prev!==rows[i].block||rows[i].next!==r.block))return invalid('Łańcuch nie jest kompletny lub zawiera sprzeczne wskaźniki.');if(seq.join('|')!==MSG_ANSWER.ids.join('|'))return invalid('Sprawdź fałszywy trop wewnątrz tego samego slotu.');return '';} 
  if(s===1){if(f['Co potwierdzają wskaźniki prev/next?']!=='chain'||f['Co daje kontrola integralności?']!=='unchanged')return invalid('Integralność transmisji i autorstwo to różne ustalenia.');return '';} 
  if(f['Identyfikator konta']!=='account'||f['Dane urządzenia']!=='device')return invalid('Oddziel konto i urządzenie od fizycznego operatora.');
 }
 if(k==='cctv'){
  if(s===0){const fields=[['A','Kamera A: przesunięcie [s]'],['B','Kamera B: przesunięcie [s]'],['C','Kamera C: przesunięcie [s]']];if(!full(fields.map(p=>p[1])))return invalid('Ustaw korektę dla wszystkich kamer.');if(fields.some(([cam,key])=>Number(f[key])!==CCTV_SECRET.offsets[cam]))return invalid('Korekty nie odpowiadają kotwicom. Sprawdź znak przesunięcia.');return '';} 
  if(s===1){if(seq.length!==3)return invalid('Ułóż trzy kadry ruchu.');const rows=seq.map(id=>CCTV_BYID[id]);if(rows.some(r=>!r||r.marker!=='MOV'))return invalid('Nie wszystkie wybrane kadry rejestrują ruch.');if(seq.join('|')!==CCTV_SECRET.route.join('|'))return invalid('Po korekcie zegarów zdarzenia mają inną kolejność.');return '';} 
  if(f['Znaczenie synchronizacji']!=='order'||f['Nieostry obraz']!=='limited')return invalid('Korekta czasu nie poprawia rozdzielczości twarzy.');
 }
 if(k==='forensic'){
  if(s===0){const pairs=[['W-7A','P-A1'],['W-7A','C-0W'],['S-3A','S-W1']];for(let i=0;i<3;i++){const distance=forensicDistance(...pairs[i]);const expected=distance===null?'uncomparable':distance<=7?'match':distance<=17?'uncertain':'different';if(f['Ocena pary '+(i+1)]!==expected)return invalid(`Nieprawidłowo sklasyfikowano parę ${i+1}. Porównaj sześć wartości, nie samą nazwę.`);}return '';} 
  if(s===1){if(f['Znaczenie kontroli']!=='transfer'||f['Wniosek przy podobnych wektorach']!=='class')return invalid('Zgodność próbki z rękawicami wymaga analizy możliwego transferu.');return '';} 
  if(f['Ocena profilu urazów']!=='multiple'||f['Granica identyfikacji']!=='limits')return invalid('Nie utożsamiaj profilów materiałowych z osobową identyfikacją.');
 }
 if(k==='access'){
  if(s===0){if(f['Źródło obrazu']!=='EVID_CCTV_SYNC'||f['Źródło użycia karty']!=='EVID_T17_DOOR_EVENT'||f['Weryfikacja źródeł']!=='independent')return invalid('Wskaż niezależnie monitoring i zdarzenie czytnika oraz ograniczenie identyfikacji.');return '';} 
  if(s===1){if(seq.join('|')!==ACCESS_SECRET.waypoints.join('|'))return invalid('Trasa musi obejmować prawidłową kolejność pięciu stref.');const keys=['Odcinek 1 [s]','Odcinek 2 [s]','Odcinek 3 [s]','Odcinek 4 [s]'];if(!full(keys))return invalid('Podaj czasy czterech przejść.');for(let i=0;i<4;i++){const val=Number(f[keys[i]]),min=AX_PAIRS(seq[i],seq[i+1]);if(!Number.isFinite(val)||val<min||val>600)return invalid('Niektóre przejścia są szybsze niż dopuszcza plan lub mają nierealny czas.');}return '';} 
  if(f['Wniosek z trasy']!=='possible'||f['Wideokonferencja bez kamery']!=='session')return invalid('Możliwa trasa ani aktywna sesja nie wskazują bezpośrednio sprawcy.');
 }
 if(s===2 && f['Uzasadnienie']!=='best')return invalid('Wybrane uzasadnienie zbyt daleko interpretuje źródła albo pomija istotne ograniczenie. Porównaj wszystkie pięć możliwości.');
 return '';
}
function render(k){
 const holder=$('p3-'+k);if(!holder)return;
 const d=data[k],s=d.stages.length;
 if(!canAnalyze(k)){
  holder.innerHTML='<div class="p3-head"><div><span class="eyebrow">ANALIZA KROK PO KROKU</span><h3>'+safe(NAME[k])+'</h3></div></div>'+ 
    '<div class="p3-task p3-locked" role="status"><h4>Analiza niedostępna</h4><p>Zdobądź wymagane materiały źródłowe, aby zobaczyć dane sprawy i rozpocząć etapy. Możesz już teraz zapoznać się z ogólną metodą badania.</p>'+ 
    '<p>'+safe(METHOD[k][0])+'</p></div>';
  return;
 }
 const panels=Array.from({length:3},(_,i)=>`<div class="p3-milestone ${i<s?'done':i===s?'current':''}"><b>${i<s?'✓':i+1}</b><span>Etap ${i+1}</span></div>`).join('');
 holder.innerHTML=`<div class="p3-head"><div><span class="eyebrow">ANALIZA KROK PO KROKU</span><h3>${NAME[k]}</h3><p>Odtwórz przebieg zdarzeń, zweryfikuj sprzeczne wskazówki i wybierz najlepiej uzasadniony wniosek.</p></div><strong class="p3-counter">${s}/3</strong></div><div class="p3-milestones">${panels}</div>
 ${s===3?'<div class="p3-success"><b>Analiza ukończona.</b><p>Możesz teraz przedstawić raport końcowy, jeśli masz wszystkie wymagane materiały.</p></div>':`<div class="p3-task"><h4 tabindex="-1">Etap ${s+1} / 3</h4>${points(safe(caption(k,s)))}${stageUI(k,s)}<details class="p63-method"><summary>Jak zweryfikować dane (bez rozwiązania)</summary><p>${safe(METHOD[k][s])}</p></details><div class="p3-actions"><button type="button" class="btn" data-p3-submit="${k}">Sprawdź etap ${s+1}</button></div></div>`}
 <div class="p3-feedback ${d.failed?'bad':d.feedback?'good':''}" role="status" aria-live="polite" tabindex="-1">${safe(d.feedback)}</div>`;
 holder.querySelectorAll('[data-p3-input]').forEach(el=>{const v=d.form[el.dataset.p3Input];if(el.type==='radio')el.checked=v===el.value;else if(v!==undefined)el.value=String(v);});
}
function mount(k){const root=$(ROOT[k]);if(!root||!root.children.length)return;let div=$('p3-'+k);if(!div){div=document.createElement('section');div.id='p3-'+k;div.className='p3-panel';div.setAttribute('aria-label','Analiza szczegółowa: '+NAME[k]);root.appendChild(div);render(k);}}
function check(k){
 if(!canAnalyze(k)){render(k);return;}
 const d=data[k],idx=d.stages.length;if(idx>=3)return;
 const holder=$('p3-'+k);
 if(holder)holder.querySelectorAll('[data-p3-input]').forEach(el=>{if(el.type!=='radio'||el.checked)d.form[el.dataset.p3Input]=el.value;});
 // Puste pola to nie błędny wniosek. Gracz może poprawić je bez karania próby.
 const empty=holder&&[...holder.querySelectorAll('[data-p3-input]')].find(el=>el.type!=='radio'&&!String(el.value).trim());
 const missingChoice=holder?.querySelector('input[data-p3-input="Uzasadnienie"]')&&!holder.querySelector('input[data-p3-input="Uzasadnienie"]:checked');
 if(empty||missingChoice){
  const target=empty||holder.querySelector('input[data-p3-input="Uzasadnienie"]');
  if(target){target.setAttribute('aria-invalid','true');target.focus({preventScroll:true});}
  const message=holder.querySelector('.p3-feedback');if(message){message.textContent='Uzupełnij brakujące pole, zanim ocenisz cały etap.';message.classList.add('bad');}
  return;
 }
 const issue=evaluate(k,idx,d);
 if(issue){d.attempts=Math.min(d.attempts+1,9999);d.failed=true;d.feedback=issue+' Metoda kontroli jest dostępna pod formularzem.';}
 else{window.PS617_SYNC?.enqueue?.({type:'verify_puzzle_stage',puzzle:k,stage:idx,sequence:d.sequence.slice(),form:{...d.form}});d.stages.push({phase:idx,accepted:true});d.sequence=[];d.form={};d.feedback=`Etap ${idx+1} zaliczony. ${idx<2?'Przejdź do kolejnej analizy.':'Możesz przygotować końcowy raport.'}`;d.failed=false;}
 render(k);
 const next=$('p3-'+k);
 (issue?next?.querySelector('.p3-feedback'):next?.querySelector('.p3-task h4,.p3-success'))?.focus({preventScroll:true});
}
function sync(){for(const k of KEYS){const panel=$(`${k}Panel`);if(panel&&!panel.hidden){mount(k);render(k);}}}
const refs=()=>KEYS.map(k=>STATE[k]);
function clearIfReset(){if(!stateObjects){stateObjects=refs();return;}const next=refs();if(next.some((r,i)=>r!==stateObjects[i])){data=fresh();stateObjects=next;for(const k of KEYS)render(k);}}
function restore(raw){const newData=fresh();if(raw&&typeof raw==='object')for(const k of KEYS){const q=raw[k];if(!q||typeof q!=='object')continue;const stages=Array.isArray(q.stages)?q.stages:[];const length=Math.min(3,stages.length);if((canAnalyze(k)||STATE[k]?.solved)&&stages.slice(0,length).every((x,i)=>x&&x.phase===i&&x.accepted===true))newData[k].stages=stages.slice(0,length).map((x,i)=>({phase:i,accepted:true}));newData[k].attempts=Math.max(0,Math.min(9999,Number(q.attempts)||0));}data=newData;stateObjects=refs();for(const k of KEYS)render(k);}
function exportData(){return Object.fromEntries(KEYS.map(k=>[k,{stages:data[k].stages,attempts:data[k].attempts}]))}
function wire(){
 stateObjects=refs();
 const submitIds={tcmsSubmit:'tcms',msgSubmit:'msg',cvSubmit:'cctv',foSubmit:'forensic',axSubmit:'access'};
 // Domyślnie gry zachowują dotychczasowy stan dowodowy; nowe kontrole są wymagane tylko dla nieukończonych minigier.
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('button');const k=submitIds[b?.id];if(!k||STATE[k]?.solved||(done(k)&&canAnalyze(k)))return;
  e.preventDefault();e.stopImmediatePropagation();mount(k);const d=data[k];d.failed=true;d.feedback='Aby przedstawić raport, ukończ trzy etapy analizy.';render(k);$('p3-'+k)?.scrollIntoView({block:'center',behavior:'auto'});
 },true);
 document.addEventListener('click',e=>{
  const button=e.target.closest?.('button');if(!button)return;
  const area=button.closest('.p3-panel');if(!area)return;
  const k=area.id.replace('p3-','');if(!KEYS.includes(k)||!canAnalyze(k)||done(k))return;
  const d=data[k],s=d.stages.length;
  if(button.hasAttribute('data-p3-pick')){
   const length=k==='tcms'?4:k==='msg'?5:k==='cctv'?3:5,id=button.dataset.p3Pick;
   if(records(k,s).some(r=>r.id===id)&&d.sequence.length<length&&(k==='access'||!d.sequence.includes(id))){
    d.sequence.push(id);render(k);
    ($('p3-'+k)?.querySelector('.p3-entry:not(:disabled)')||$('p3-'+k)?.querySelector('[data-p3-undo]'))?.focus({preventScroll:true});
   }
  }
  if(button.hasAttribute('data-p3-clear')){d.sequence=[];render(k);$('p3-'+k)?.querySelector('.p3-entry:not(:disabled)')?.focus({preventScroll:true});}
  if(button.hasAttribute('data-p3-undo')){d.sequence.pop();render(k);$('p3-'+k)?.querySelector('[data-p3-undo]')?.focus({preventScroll:true});}
  if(button.hasAttribute('data-p3-submit'))check(k);
 });
 document.addEventListener('input',e=>{const el=e.target.closest?.('.p3-panel [data-p3-input]');if(!el)return;const k=el.closest('.p3-panel').id.replace('p3-','');if(KEYS.includes(k)){data[k].form[el.dataset.p3Input]=el.value;el.removeAttribute('aria-invalid');}});
 document.addEventListener('change',e=>{const el=e.target.closest?.('.p3-panel [data-p3-input]');if(!el)return;const k=el.closest('.p3-panel').id.replace('p3-','');if(KEYS.includes(k)){data[k].form[el.dataset.p3Input]=el.value;el.removeAttribute('aria-invalid');}});
 // Współdziałanie z istniejącym ręcznym zapisem: starsze zaliczone raporty pozostają zaliczone.
 if(typeof buildSave==='function'&&typeof applySave==='function'){
  
  /* SaveManager: buildSave hook. */
registerSaveHook({name:"09-multi-stage-puzzles-save1", build(__save){const value=__save;value.minigames3={version:1,stages:exportData()};return value;}});
  /* SaveManager: applySave hook. */
registerSaveHook({name:"09-multi-stage-puzzles-load1", apply(value){undefined;restore(value?.minigames3?.stages);}});
 }
 // Zresetowanie sesji powoduje wymianę obiektów STATE.* na nowe; dotychczasowe puzzle również czyścimy.
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="labs"],[data-go="labs"],[data-open-lab]'))queueMicrotask(()=>{clearIfReset();sync();});});
 // Różne pracownie są renderowane dopiero przy ich wybraniu; nie renderujemy ich w pętli animacji.
 for(const k of KEYS){const root=$(ROOT[k]);if(!root)continue;const observer=new MutationObserver(rs=>{if(rs.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('p3-panel')))){queueMicrotask(()=>mount(k));}});observer.observe(root,{childList:true});}
 sync();
 window.PS_MG3_QA={status:()=>Object.fromEntries(KEYS.map(k=>[k,canAnalyze(k)?data[k].stages.length:0])),validate:(k,s)=>!KEYS.includes(k)?'nieznana minigra':!canAnalyze(k)?'Brakuje wymaganych materiałów':evaluate(k,s,data[k]),ready:canAnalyze,refresh:sync,reset:()=>{restore(null);sync();}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();
