
/* Spójna, etapowa opowieść. Nie przyznaje dowodów i nie zmienia istniejących warunków minigier. */
(function(){
'use strict';
const THREADS=[
 {id:'accident',label:'Awaria czy zdarzenie na stanowisku?',needs:['TEC-03','EVID_TEST_AUTHORIZATION','TEC-14'],
  opening:'Pierwsze raporty sugerują problem techniczny tramwaju. Ustal, które sygnały dotyczą pojazdu, a które samego stanowiska.',
  revealed:'Ostrzeżenia TCMS i wstrząs stanowiska pochodzą z różnych układów. Sesję diagnostyczną trzeba badać niezależnie od urazów Leny.',
  check:'Nie łącz ostrzeżenia testowego z przyczyną obrażeń bez odrębnego potwierdzenia.',note:'Oddzieliłam/em ostrzeżenia TW-217 od czujnika stanowiska: TEC-03 / EVID_TEST_AUTHORIZATION / TEC-14.'},
 {id:'part',label:'Dwie wersje jednego podzespołu',needs:['TEC-07','EVID_ACCEPTANCE_RECORD','EVID_SERIAL_PHOTO'],
  opening:'Magazyn, odbiór i faktycznie zamontowana część nie muszą mówić tego samego. Poszukaj ich niezależnych opisów.',
  revealed:'Magazyn i zdjęcie Leny wskazują L-2, podczas gdy podpisany odbiór podaje L-3. To konflikt o odpowiedzialność i zgodność dokumentów, nie bezpośredni dowód przemocy.',
  check:'Ustal, kto zatwierdził niezgodny odbiór oraz kto znał rozbieżność przed tragedią.',note:'Niezgodność ZG-41: TEC-07 i fotografia EVID_SERIAL_PHOTO wskazują L-2, a odbiór EVID_ACCEPTANCE_RECORD — L-3.'},
 {id:'silences',label:'Każdy ukrywa co innego',needs:['EVID_PAYROLL_MANUAL_EDIT','EVID_SERVICE_FORM_GAPS','EVID_BHP_DRAFT','EVID_RADIO_GAP'],
  opening:'Korekta godzin, brak pomiarów, projekt BHP i luka łączności mogą wyglądać jak jedna zmowa. Sprawdź, czy dotyczą tego samego zdarzenia.',
  revealed:'Różne zaniedbania wywołują podobny opór świadków. Dokumenty wskazują osobne problemy rozliczeń, warsztatu, BHP i archiwizacji radia; nie tworzą jednego dowodu zabójstwa.',
  check:'Konfrontuj każdą osobę z właściwą parą źródeł zamiast traktować wszystkie przemilczenia jako przyznanie się.',note:'Różne przemilczenia: EVID_PAYROLL_MANUAL_EDIT / EVID_SERVICE_FORM_GAPS / EVID_BHP_DRAFT / EVID_RADIO_GAP; nie oznaczają wspólnego sprawstwa.'},
 {id:'invitation',label:'Oryginał protokołu jako przynęta',needs:['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','DIG-05'],
  opening:'Usunięta korespondencja może połączyć ostatnią aktywność Leny z konfliktem ZG-41. Najpierw odróżnij treść od identyfikatora urządzenia.',
  revealed:'O 01:32 zaproponowano Lenie spotkanie przy stanowisku nr 3 w sprawie oryginału protokołu. Konto i urządzenie audytowe są ustalone, lecz nie pokazują twarzy nadawcy.',
  check:'Konieczne jest niezależne powiązanie komunikacji z możliwą trasą i obecnością człowieka.',note:'Wiadomość 01:32 dotyczy protokołu i stanowiska nr 3; źródło techniczne nie jest samodzielną identyfikacją osoby.'},
 {id:'alibi',label:'Alibi działającego komputera',needs:['EVID_CONFERENCE_SESSION','DIG-09','EVID_CCTV_SYNC','ADM-04'],
  opening:'Zdalna prezentacja trwała podczas krytycznego przedziału. Czy aktywny komputer oznacza fizyczną obecność przed ekranem?',
  revealed:'Sesja działała, choć przez istotny okres brakowało interakcji; zsynchronizowane kamery i czasy przejścia dopuszczają opuszczenie biura. To możliwość, którą należy sprawdzić razem z innymi materiałami.',
  check:'Obecność przy stanowisku musi wynikać ze zbieżnych źródeł, nie z samej niewiarygodności alibi.',note:'Ciągłość AU-01 nie potwierdza ciągłej obecności. DIG-09, EVID_CCTV_SYNC i ADM-04 wspierają sprawdzenie wykonalności trasy.'}
];
const WITNESSES=[
 {id:'MAREK',gate:'MN_PAYROLL',needs:['EVID_PAYROLL_MANUAL_EDIT','EVID_RAW_ENTRY_TIMES'],label:'Marek · rozliczenie zmiany',
  open:'Kto zmienił rozliczenia godzin i co z tego wynika dla rzeczywistej obecności pracowników?',
  close:'Korekta w systemie płac nie zmienia surowego rejestru wejść. Kierownik odpowiada za wyjaśnienie własnych zapisów, nie za przypisaną mu bez dowodu przemoc.'},
 {id:'TOMASZ',gate:'TK_RADIO',needs:['EVID_RADIO_GAP','EVID_DISPATCH_REVISION'],label:'Tomasz · brakujące nagranie',
  open:'Czy luka radiowa dotyczy zmiany dyspozycji, a jeśli tak, czy znamy jej zawartość?',
  close:'Zmiana dyspozycji jest udokumentowana, treść R-903 nie. Nierzetelne archiwum utrudnia kontrolę dyżuru, ale brak segmentu nie jest zapisem spotkania z Leną.'},
 {id:'JANUSZ',gate:'JW_SERVICE',needs:['EVID_WORK_ORDER_RAW','EVID_SERVICE_FORM_GAPS'],label:'Janusz · zamknięta karta naprawy',
  open:'Dlaczego formularz naprawy jest zamknięty, skoro nie ma wymaganych pomiarów?',
  close:'Dokument zamknięto bez części potwierdzeń. To możliwe naruszenie procedury technicznej; nie ustala miejsca pobytu mistrza w krytycznej chwili.'},
 {id:'ELZBIETA',gate:'EZ_HAZARD',needs:['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION'],label:'Elżbieta · niewysłane ostrzeżenie',
  open:'Co oznacza zapisany projekt ostrzeżenia, który nie trafił do systemu BHP?',
  close:'Elżbieta rozumiała zagrożenie, lecz nie wysłała formalnego zgłoszenia. Jest to możliwe zaniedbanie obowiązku, odrębne od kwestii sprawstwa.'},
 {id:'KAMIL',gate:'KB_CARD',needs:['EVID_RESOURCE_HANDOVER','EVID_T17_DOOR_EVENT'],label:'Kamil · cudzy identyfikator',
  open:'Czy przydział T-17 wskazuje osobę, która później otworzyła południowe drzwi?',
  close:'Przekazanie karty przerywa prosty związek między pierwotnym odbiorcą a zdarzeniem przy czytniku. Trzeba osobno ocenić odpowiedzialność za przekazanie i identyfikację późniejszego użytkownika.'},
 {id:'MAGDALENA',gate:'MK_ACCEPTANCE',needs:['EVID_ACCEPTANCE_RECORD','EVID_SERIAL_PHOTO'],label:'Magdalena · podpis pod odbiorem',
  open:'Dlaczego zatwierdzony wariant L-3 nie zgadza się z fotografią podzespołu L-2?',
  close:'Podpis audytorski łączy osobę z nierzetelnym odbiorem. Jest to wątek motywu i wiarygodności dokumentacji; przemoc musi mieć oddzielne uzasadnienie.'}
];
function hasAll(ids){return ids.every(id=>STATE.found.has(id));}
function witnessDone(id,gate){return !!NPC9_MEMORY[id]?.confronted?.includes(gate);}
function storyMarkup(){
 let html='<div class="story26-head"><div><h3>Wątki śledztwa</h3><p>Odkrycia zmieniają obraz wydarzeń. Brak dokumentu nie jest dowodem jego treści.</p></div></div><div class="story26-track">';
 for(const t of THREADS){
  const count=t.needs.filter(id=>STATE.found.has(id)).length,done=count===t.needs.length;
  const label=done?t.label:({invitation:'Ślady korespondencji',alibi:'Weryfikacja elektronicznego alibi',silences:'Rozbieżności w relacjach'}[t.id]||t.label);
  html+='<article class="story26-case"><div class="story26-tag">'+(done?'Zestawiono materiały':'W toku · '+count+' / '+t.needs.length)+'</div><strong>'+esc(label)+'</strong><p>'+esc(done?t.revealed:t.opening)+'</p><div class="story26-bar"><i style="width:'+Math.round(count/t.needs.length*100)+'%"></i></div>';
  if(done)html+='<p>'+esc(t.check)+'</p><div class="story26-refs">Źródła: '+esc(t.needs.join(' · '))+'</div><div class="story26-notes"><button type="button" class="story26-note" data-story26-note="'+t.id+'">Zapisz ustalenie w notatniku</button></div>';
  html+='</article>';
 }
 html+='</div><details style="margin-top:16px"><summary>Co pozostaje do wyjaśnienia u świadków?</summary><div class="story26-track" style="margin-top:12px">';
 for(const w of WITNESSES){const ready=hasAll(w.needs),done=witnessDone(w.id,w.gate);
  html+='<article class="story26-case"><div class="story26-tag">'+(done?'Zeznanie skonfrontowane':ready?'Można skonfrontować':'Wymaga sprawdzenia')+'</div><strong>'+esc(w.label)+'</strong><p>'+esc(done?w.close:w.open)+'</p>'+(ready?'<div class="story26-refs">'+esc(w.needs.join(' · '))+'</div>':'')+'</article>';
 }
 html+='</div></details>';
 return html;
}
function renderStory(){
 let box=document.getElementById('story26Overview');
 if(!box){const home=document.getElementById('overview');if(!home)return;box=document.createElement('section');box.className='story26-panel';box.id='story26Overview';box.setAttribute('aria-label','Wątki śledztwa');home.append(box);}
 box.innerHTML=storyMarkup();
 box.querySelectorAll('[data-story26-note]').forEach(btn=>btn.addEventListener('click',()=>{
  const t=THREADS.find(x=>x.id===btn.dataset.story26Note);if(!t||!hasAll(t.needs))return;
  const note='• '+t.note;const prev=String(STATE.notes||'');if(!prev.includes(note)){STATE.notes=(prev?prev.trimEnd()+'\n\n':'')+note;const el=document.getElementById('notes');if(el)el.value=STATE.notes;toast('Ustalenie zapisano w notatniku.');}else toast('To ustalenie jest już w notatniku.');
 }));
}
// Odpowiedzi pogłębiające po faktycznej konfrontacji — bez ujawniania sprostowań na podstawie samych słów-kluczy.
const DEEP={
 MAREK:{gate:'MN_PAYROLL',rx:/(?:plac|rozliczen|grafik|godzin|korekt|ukryw|presj|powod)/,reply:'Poprawiałem rozliczenia zmiany. Sądziłem, że porządkowanie godzin to sprawa kadrowa, nie materiał do śledztwa. Myliłem się, bo zaciemniłem obraz dyżuru. Surowy rejestr wejść nie został przez to zmieniony; nie będę twierdził, że stąd wynika czyjś pobyt przy stanowisku.'},
 TOMASZ:{gate:'TK_RADIO',rx:/(?:radi|nagran|r.?903|brakuj|dyspozy|ukryw|dlaczego)/,reply:'Zmieniłem dyspozycję powrotu wagonu, a potem okazało się, że w archiwum nie ma segmentu R-903. Nie potrafię odtworzyć tego, czego nie zachowano. Powinienem był od razu zgłosić lukę. Nie będę z niej robił dowodu, że ktoś wysłał Lenie wiadomość.'},
 JANUSZ:{gate:'JW_SERVICE',rx:/(?:rubryk|protok|napraw|pomiar|zamkn|ukryw|dlaczego)/,reply:'Zatwierdziłem zamknięcie karty bez dwóch potwierdzeń, których tam nie było. Papier wyglądał na zakończony, a badanie nie było udokumentowane do końca. To mój obowiązek wyjaśnić. Nie wiedziałem, kto był przy stanowisku trzecim w chwili zdarzenia.'},
 ELZBIETA:{gate:'EZ_HAZARD',rx:/(?:bhp|zglosz|projekt|wysl|ostrzeg|ukryw|dlaczego)/,reply:'Rozmawiałam z Leną o zagrożeniu i zapisałam projekt zgłoszenia. Nie wysłałam go. Obawiałam się, że zgłoszenie bez kompletnej dokumentacji zostanie podważone, ale to nie usprawiedliwia zwłoki. Nie widziałam późniejszego zdarzenia.'},
 KAMIL:{gate:'KB_CARD',rx:/(?:kart|t.?17|przekaz|pozycz|czytnik|ukryw|dlaczego)/,reply:'Przekazałem T-17 Magdalenie przy dokumentacji. Wiem, że naruszyłem zasady i przez to ewidencja mogła wskazywać mnie. To, co mówi czytnik, dotyczy karty; nie pokazuje człowieka. O samym ataku niczego nie widziałem.'},
 MAGDALENA:{gate:'MK_ACCEPTANCE',rx:/(?:protok|odbior|l.?2|l.?3|podpis|zgodn|rozbiezn|ukryw|dlaczego)/,reply:'Zatwierdziłam dokument, w którym zapisano L-3. Fotografia oznaczenia L-2 i magazynowa ewidencja każą ten odbiór zweryfikować. Rozumiem wagę rozbieżności, ale sam podpis pod protokołem nie dowodzi, że byłam przy stanowisku w chwili urazu.'}
};
const originalAnswer=WitnessEngine.snapshotAnswer();
const ps3_11_linked_intrigue_npc4Answer = function(c,raw,attached){
 const mem=NPC9_MEMORY[c.id],priorCount=mem?.semantic?.length||0,priorConfronted=mem?.confronted?.length||0;
 const base=originalAnswer(c,raw,attached),config=DEEP[c.id],q=norm(raw);
 if(!config||attached||!witnessDone(c.id,config.gate)||!config.rx.test(q)||
 !/(?:dlaczego|czemu|po co|co ukryw|co popraw|czym tlumacz|powod|wina|prawda|co zrobil|pozycz|podpis|wyslal|zamkn)/.test(q)||
 /(?:zabil|zabiles|zabilas|zabojst|morder|przyznaj|przyznalas|przyznales|podczas ataku|gdzie byl)/.test(q)||
 mem.confronted.length!==priorConfronted||mem.semantic.length>priorCount+6) return base;
 const text=config.reply;
 const sem=(mem.semantic||[]).slice(priorCount).reverse().find(x=>x.answer===base&&x.status!=='USER_CLAIM');if(sem)sem.answer=text;
 const r=NPC4_STATE[c.id]?.recent?.at(-1);if(r?.answer===norm(base).slice(0,1550))r.answer=norm(text).slice(0,1550);
 const rr=NPC4_STATE[c.id]?.npc5?.recent?.at(-1);if(rr&&rr.answer===base)rr.answer=text;
 return text;
};
registerWitnessAnswerLayer("11-linked-intrigue",ps3_11_linked_intrigue_npc4Answer);
// Narrative consequences in the finale: never equate the prepared indictment with a court verdict.
const originalVerdict=fcRenderVerdict;
fcRenderVerdict=function(){
 originalVerdict.apply(this,arguments);
 if(!fcCompletion())return;
 const panel=document.getElementById('fcVerdictPanel');if(!panel)return;
 panel.querySelector('#story26Outcome')?.remove();
 const summary=document.createElement('section');summary.id='story26Outcome';summary.className='story26-epilogue';
 const documented=WITNESSES.filter(w=>hasAll(w.needs));
 const complete=THREADS.filter(t=>hasAll(t.needs)).length;
 const items=[
  ['MAREK','Korekty rozliczeń i rzeczywiste czasy obecności wymagają odrębnego wyjaśnienia.'],
  ['TOMASZ','Zmiana dyspozycji i brakujący segment łączności pozostają odrębnym problemem nadzoru.'],
  ['JANUSZ','Zamknięcie karty bez pomiarów wymaga przeglądu warsztatowych procedur odbioru.'],
  ['ELZBIETA','Projekt ostrzeżenia BHP nie zastępuje zgłoszenia przyjętego przez właściwy system.'],
  ['KAMIL','Przekazanie identyfikatora T-17 wymaga wyjaśnienia zasad dostępu do chronionych stref.'],
  ['MAGDALENA','Rozbieżność w odbiorze ZG-41 wymaga rozliczenia niezależnie od wniosków o przebiegu zdarzenia.']
 ].filter(([id])=>documented.some(w=>w.id===id));
 const title=document.createElement('h4');title.textContent='Co pozostaje po zamknięciu sprawy?';summary.append(title);
 const p=document.createElement('p');p.textContent='Akt śledczy odtwarza główny mechanizm i wskazuje osobę, którą należy rozliczyć z zarzucanego czynu. Nie jest prawomocnym wyrokiem. W toku dochodzenia ujawniono też inne przemilczenia, które nie muszą mieć wspólnego sprawcy ani tej samej przyczyny.';summary.append(p);
 const list=document.createElement('ul');for(const [,line] of items){const li=document.createElement('li');li.textContent=line;list.append(li);}if(items.length)summary.append(list);
 const end=document.createElement('p');end.textContent=complete===THREADS.length?'Sprawdzono wszystkie pięć osi intrygi. Większość odpowiedzi wynika z porównania niezależnych źródeł, a nie z pojedynczego wyznania.':'W części wątków brakuje pełnego zestawienia materiałów. Możesz wrócić do akt i uzupełnić obraz zaniedbań niezależnych od głównego oskarżenia.';summary.append(end);panel.append(summary);
};
const _renderCounts=renderCounts;renderCounts=function(){_renderCounts.apply(this,arguments);renderStory();};
registerNavigationHook({name:'linked-intrigue',after:({id})=>{if(id==='overview')renderStory();}});
/* SaveManager: applySave hook. */
registerSaveHook({name:"11-linked-intrigue-load1", apply(data){const r=undefined;renderStory();return r;}});
// UI refreshes after evidence checks and actual testimony, not on a timer.
document.addEventListener('click',ev=>{
 if(ev.target.closest?.('#chatSend,#fcVerdict,[data-story26-note]'))requestAnimationFrame(renderStory);
});
renderStory();
window.STORY26_QA={threads:THREADS.map(x=>({id:x.id,needs:x.needs})),witnesses:WITNESSES.map(x=>({id:x.id,needs:x.needs,gate:x.gate})),active:()=>THREADS.filter(t=>hasAll(t.needs)).map(t=>t.id)};
})();

