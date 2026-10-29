
/* ETAP 3 / AUDYT POWIAZAN — nie zastępuje silników mini-gier ani oceny wypowiedzi. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc3=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const CHECKS=[
    {id:'tcms',terms:[/tcms|diagno|alarm|serwis/,/czujnik|stanowisk|wstrzas/],tag:'DIAGNOSTYKA POJAZDU',title:'Dwa niezależne sygnały',description:'Rozdziel zapis próby diagnostycznej TW-217 od późniejszego zdarzenia z infrastruktury hali.',source:'EVID_TCMS_SESSION',cross:'TEC-14',answer:'separate',character:'KAMIL',question:'Jak rozróżnić ostrzeżenia sesji diagnostycznej TW-217 od sygnału czujnika stanowiska nr 3? Co możesz potwierdzić z własnej wiedzy?',focus:/tcms|diagno|czujnik|stanowisk|ostrzezen|sygnal/,note:'Czy zbieżność czasów ma tu wartość dowodową, skoro rejestry pochodzą z różnych urządzeń?',alternative:'Przyjęcie, że każdy alarm oznacza faktyczny ruch pojazdu i bezpośredni związek ze zgonem.',statement:'TCMS i czujnik stanowiska mierzą różne zdarzenia. Ich zgodność czasowa wspiera chronologię, ale nie pozwala przypisać impulsu ruchowi wagonu.',options:[['same','Alarm TCMS oznacza, że tramwaj wykonał ruch w chwili wstrząsu.'],['separate','Raport TCMS i sygnał czujnika stanowiska pochodzą z innych układów i wymagają osobnego wyjaśnienia.'],['person','Pakiety diagnostyczne jednoznacznie wskazują osobę przy stanowisku.']]},
    {id:'msg',terms:[/wiadom|nadawc|watek/,/kont|operator|urzadzen|terminal/],tag:'ANALIZA KORESPONDENCJI',title:'Treść kontra tożsamość nadawcy',description:'Sprawdź, co wiadomość odtwarzana z fragmentów mówi o spotkaniu, a czego nie dowodzi identyfikator konta.',source:'EVID_MESSAGE_THREAD_RECOVERED',cross:'DIG-05',answer:'device',character:'MAGDALENA',question:'Co może pani powiedzieć o wiadomości wysłanej do Leny o 01:32? Zapis wskazuje konto i urządzenie, ale kto rzeczywiście z nich korzystał?',focus:/wiadom|01 32|konta|terminal|urzadzen|wyslan/,note:'Czy konto i urządzenie mogą wskazać człowieka bez dodatkowego potwierdzenia?',alternative:'Wniosek, że właściciel uprawnień automatycznie nacisnął przycisk wysyłania.',statement:'Fragmenty pozwalają odtworzyć treść zaproszenia, a metadane czas, konto i urządzenie. Faktycznego użytkownika trzeba ustalić niezależnie.',options:[['identity','Konto AUD-04 rozstrzyga tożsamość osoby wysyłającej.'],['device','Treść i metadane są ze sobą zgodne, ale rejestr konta nie rozpoznaje osoby fizycznej.'],['no_text','Metadane operatora pozwalają poznać pełną treść bez rekonstrukcji bloków.']]},
    {id:'cctv',terms:[/kamer|nagran|synchron|czas/,/kart|identyfikator|t 17|czytnik/],tag:'MONITORING',title:'Czas ruchu i kontrola dostępu',description:'Porównaj skorygowane znaczniki nagrań z odczytem identyfikatora przy przejściu.',source:'EVID_CCTV_SYNC',cross:'EVID_T17_DOOR_EVENT',answer:'path',character:'KAMIL',question:'Czy z odczytu karty T-17 i nagrania o skorygowanym czasie można rozpoznać osobę przechodzącą do hali? Co dowodzi sam czytnik?',focus:/kart|czytnik|monitor|kamer|wejsc|nagran|t 17/,note:'Czy czytnik lub nieostry obraz identyfikuje twarz i użytkownika karty?',alternative:'Identyfikacja osoby wyłącznie na podstawie posiadacza przypisanego numeru karty.',statement:'Synchronizacja kamer i odczyt T-17 pozwalają uporządkować ruch. Sam znacznik karty i nieostry obraz nie rozpoznają osoby.',options:[['badge','Czytnik zarejestrował nazwisko osoby, która otworzyła drzwi.'],['face','Synchronizacja zegarów podnosi jakość rozpoznania twarzy w każdym kadrze.'],['path','Wspólna oś czasu wzmacnia rekonstrukcję przejścia, ale nie rozstrzyga tożsamości człowieka.']]},
    {id:'forensic',terms:[/slad|wlok|smar|prob|laborator/,/uraz|obrazen|mechanizm|upad/],tag:'BADANIA MATERIAŁOWE',title:'Mechanizm obrażeń a ślady',description:'Zestaw badania porównawcze ze specjalistyczną oceną mechanizmu urazów.',source:'LAB-10',cross:'MED-09',answer:'mechanism',character:'JANUSZ',question:'Jakie elementy stanowiska mogły zostawić ślady kontaktowe i czy podobieństwo materiału pozwala ustalić, kto się nim posługiwał?',focus:/slad|obrazen|oslon|narzedz|uraz|kontakt|stanowisk/,note:'Czy możliwość kontaktu z elementem wyjaśnia wszystkie obrażenia i wskazuje sprawcę?',alternative:'Uznanie podobieństwa włókien, smaru lub śladu za pełną identyfikację osoby.',statement:'Ślady i opinia biomechaniczna pomagają ocenić mechanizm kontaktu oraz hipotezę upadku. Same nie identyfikują sprawcy.',options:[['mechanism','Źródła pomagają ocenić mechanizm kontaktu i jego ograniczenia, ale nie identyfikują osoby.'],['fingerprints','Każda zgodność mikrośladu jest równoznaczna z jednoznacznym odciskiem palca.'],['fall','Opinia dowodzi, że wszystkie obrażenia musiały powstać w zwykłym poślizgu.']]},
    {id:'access',terms:[/tras|przejsc|minut|drog|wejsc/,/sesj|polaczen|wideokonferenc|alibi|prezentac/],tag:'DOSTĘP I PRZEMIESZCZANIE',title:'Alibi cyfrowe i przemieszczanie',description:'Sprawdź, czy aktywna sesja internetowa rzeczywiście wyklucza fizyczne opuszczenie biura.',source:'ADM-04',cross:'EVID_CONFERENCE_SESSION',answer:'presence',character:'MAGDALENA',question:'Sesja audytowa była aktywna między 01:30 a 02:00. Czy przez cały ten czas była pani fizycznie przy komputerze i kto może to potwierdzić?',focus:/sesj|audyt|obecn|komputer|alibi|polaczen|konferen/,note:'Czy sama aktywność połączenia stanowi obserwację ciągłej obecności osoby?',alternative:'Założenie, że udostępnianie dokumentów z wyłączoną kamerą uniemożliwiało wyjście.',statement:'Trasa do stanowiska może być wykonalna mimo aktywnej wideokonferencji. Zbieżność tych zapisów nie dowodzi, kto faktycznie przeszedł.',options:[['online','Platforma konferencyjna mierzy bez przerwy położenie fizyczne uczestnika.'],['presence','Aktywne połączenie nie jest równoważne nieprzerwanej obecności; trzeba zestawić je z czasem przejścia.'],['route','Krótka droga sama dowodzi, kto pojawił się przy stanowisku.']]}
  ];

  const CROSS_FIVE_TRAPS={"tcms":["Rejestr TCMS i czujnik stanowiska mają zgodne znaczniki, dlatego rozbieżność ich funkcji nie wyklucza wspólnego mechanizmu ruchu wagonu.","Dwa układy mierzą inne zjawiska, ale retransmisja pakietu ostrzeżenia pozwala ustalić dodatkowy impuls infrastruktury.","Diagnostyka i czujnik można połączyć czasowo; skoro brak w nich identyfikatora osoby, wystarczy przypisać zdarzenie operatorowi konsoli.","Zbieżność obu sygnałów ogranicza liczbę możliwych scenariuszy do jednego kontaktu pojazdu ze stanowiskiem."],"msg":["Rekonstrukcja zaproszenia i metadane urządzenia wzajemnie się potwierdzają, więc jedno konto pozwala przypisać wiadomość jego formalnemu użytkownikowi.","Spójny łańcuch fragmentów dokumentuje treść, a zgodność czasu połączenia wskazuje, kto obsługiwał terminal.","Odtworzony tekst i rejestr sesji są zgodne, dlatego sam identyfikator urządzenia zamyka kwestię autorstwa.","Metadane określają konto i czas; jeśli wiadomość dotyczy spotkania, należy przyjąć, że adresat rzeczywiście na nie dotarł."],"cctv":["Korekta zegarów odtwarza kierunek przejścia, a przypisana karta T-17 wystarcza do wskazania formalnego posiadacza jako osoby z kadru.","Wspólna oś czasu wzmacnia związek zdarzeń, więc zgodność czytnika z nagraniem można przyjąć jako pośrednią identyfikację twarzy.","Synchronizacja porządkuje zdarzenia i ogranicza niepewność czasu, ale jej wynik wystarcza także do określenia użytkownika karty.","Dane kamery i bramki ustalają kierunek ruchu, a brak alternatywnego odczytu karty potwierdza tożsamość przechodzącej osoby."],"forensic":["Zestawienie urazów i próbek pozwala rozpoznać dwa rodzaje kontaktu; zgodne profile materiału wskazują też jedną konkretną osobę.","Opinia biomechaniczna ogranicza hipotezę poślizgu, dlatego wzorce materiałowe można traktować jako identyfikację narzędzia.","Mikroślady opisują możliwy kontakt; skoro pasują do wyposażenia stanowiska, można powiązać z nim wszystkie obrażenia.","Porównanie urazów i materiałów ogranicza mechanizm, a bez dokumentu trasy nie można wyciągać żadnych wniosków o kontakcie."],"access":["Czas dojścia i aktywność sesji pozwalają określić możliwą przerwę w alibi; zgodny odczyt karty wystarcza do przypisania tej przerwy osobie.","Wykonalna trasa wskazuje przedział przemieszczania, a brak aktywności klawiatury potwierdza, że uczestniczka sesji rzeczywiście ją pokonała.","Wideokonferencja nie dowodzi fizycznej obecności, ale zgodny czas czytnika i kamery rozstrzyga użytkownika T-17.","Rejestr dostępu i trasa wskazują możliwość przejścia; brak rozłączenia transmisji pozwala wykluczyć wyjście z pokoju."]};
  function crossFive(c,choice,done=false){const entries=[c.statement,...CROSS_FIVE_TRAPS[c.id]];return '<fieldset class="sc35-five"><legend>Wybierz uzasadnienie i granicę ustalenia</legend>'+sc35Order('cross-'+c.id,5).map((n,i)=>'<label class="sc35-option"><input data-cross3="reason" data-id="'+c.id+'" name="cross35-'+c.id+'" type="radio" value="'+(n===0?'best':'trap-'+n)+'" '+(choice===(n===0?'best':'trap-'+n)?'checked':'')+(done?' disabled':'')+'><span><b>'+String.fromCharCode(65+i)+'.</b> '+esc3(entries[n])+'</span></label>').join('')+'</fieldset>'+(done&&choice!=='best'?'<p class="muted tiny">Zachowano uzasadnienie z wcześniejszego zapisu.</p>':'');}

  const known=new Map(CHECKS.map(c=>[c.id,c]));
  const fresh=()=>({draft:{},passed:{},interviewed:{},selected:'tcms'});
  let data=fresh();
  function ready(c){return STATE.found.has(c.source)&&STATE.found.has(c.cross) && byId[c.source]?.family!==byId[c.cross]?.family;}
  function clean(x){const s=typeof x==='string'?x:'';return s.slice(0,1600);}
  function solved(c){return !!data.passed[c.id] && ready(c) && data.passed[c.id].source===c.source&&data.passed[c.id].cross===c.cross&&data.passed[c.id].answer===c.answer;}
  const count=()=>CHECKS.filter(solved).length;
  function exportData(){return {version:1,selected:data.selected,draft:Object.fromEntries(CHECKS.map(c=>[c.id,{source:clean(data.draft[c.id]?.source),cross:clean(data.draft[c.id]?.cross),answer:clean(data.draft[c.id]?.answer),reason:clean(data.draft[c.id]?.reason)}])),passed:Object.fromEntries(CHECKS.filter(solved).map(c=>[c.id,{...data.passed[c.id]}])),interviewed:Object.fromEntries(CHECKS.filter(c=>solved(c)&&data.interviewed[c.id]).map(c=>[c.id,true]))};}
  function restoreData(raw){data=fresh();if(raw&&typeof raw==='object'){
    if(known.has(raw.selected))data.selected=raw.selected;
    for(const c of CHECKS){const d=raw.draft?.[c.id];if(d&&typeof d==='object')data.draft[c.id]={source:clean(d.source),cross:clean(d.cross),answer:clean(d.answer),reason:clean(d.reason)};
      const p=raw.passed?.[c.id];if(p&&p.source===c.source&&p.cross===c.cross&&p.answer===c.answer&&typeof p.reason==='string'&&(p.reason==='best'||p.reason.trim().length>0)&&ready(c)){
        data.passed[c.id]={source:c.source,cross:c.cross,answer:c.answer,reason:clean(p.reason)};
        if(raw.interviewed?.[c.id]===true)data.interviewed[c.id]=true;
      }
    }
  }render();}
  function status(c){return solved(c)?data.interviewed[c.id]?'Zweryfikowano · zadano pytanie':'Zweryfikowano · czas na przesłuchanie':ready(c)?'Zebrano źródła · wymaga oceny':'Odkryj oba źródła';}
  function docOptions(selected){const ids=DOCS.filter(d=>STATE.found.has(d.id)).map(d=>d.id);return '<option value="">Wskaż dokument z akt...</option>'+ids.map(id=>`<option value="${esc3(id)}" ${selected===id?'selected':''}>${esc3(byId[id].title)}</option>`).join('');}
  function render(){const root=$('cross3Panel');if(!root)return;
    $('cross3Count').textContent=count()+' / '+CHECKS.length+' zweryfikowanych';
    $('cross3Tracker').textContent=CHECKS.filter(c=>data.interviewed[c.id]&&solved(c)).length+' / '+CHECKS.length+' konfrontacji';
    $('cross3Cards').innerHTML=CHECKS.map(c=>{const d=data.draft[c.id]||{},done=solved(c);return `<article class="cross3-card ${done?'cross3-done':''}">
      <div class="cross3-head"><div><span class="eyebrow">${esc3(c.tag)}</span><h3>${esc3(c.title)}</h3></div><span class="cross3-badge">${esc3(status(c))}</span></div>
      <p>${esc3(c.description)}</p>
      <div class="cross3-grid"><label>1. Raport z analizy<select data-cross3="source" data-id="${c.id}" ${done?'disabled':''}>${docOptions(done?c.source:d.source)}</select></label>
      <label>2. Niezależne źródło kontrolne<select data-cross3="cross" data-id="${c.id}" ${done?'disabled':''}>${docOptions(done?c.cross:d.cross)}</select></label></div>
      <label class="cross3-field">3. Najlepiej uzasadniony wniosek<select data-cross3="answer" data-id="${c.id}" ${done?'disabled':''}><option value="">Wybierz ocenę na podstawie źródeł...</option>${c.options.map(([v,t])=>`<option value="${v}" ${(done?c.answer:d.answer)===v?'selected':''}>${esc3(t)}</option>`).join('')}</select></label>
      ${crossFive(c,done?data.passed[c.id].reason:d.reason||"",done)}
      <div class="cross3-actions">${done?`<button type="button" class="btn alt" data-c3-act="interview" data-id="${c.id}">${data.interviewed[c.id]?'Ponownie zapytaj świadka':'Przygotuj konfrontację'}</button><button type="button" class="btn alt" data-c3-act="deduct" data-id="${c.id}">Przenieś do tablicy</button><button type="button" class="btn subtle" data-c3-act="review" data-id="${c.id}">Zmień ocenę</button>`:`<button type="button" class="btn" data-c3-act="check" data-id="${c.id}">Sprawdź rozumowanie</button>`}<div class="cross3-feedback" data-c3-feedback="${c.id}" role="status" aria-live="polite">${done?'Źródła z dwóch rodzin zostały sprawdzone. Dalsze ustalenia wymagają przesłuchania i pracy na tablicy.':ready(c)?'Analiza jest dostępna; wybierz oba dokumenty i sformułuj wniosek.':'Zbieraj dowody i kończ mini-gry. Nie można zatwierdzić samej deklaracji o przeprowadzeniu analizy.'}</div></div>
    </article>`;}).join('');
    const list=$('cross3InterviewList');if(list){list.innerHTML=CHECKS.map(c=>`<div class="cross3-interview-row"><span>${esc3(c.tag)} · ${esc3(c.title)}</span><span>${solved(c)?data.interviewed[c.id]?'Pytanie zadane':'Gotowa konfrontacja':'Wymaga audytu'}</span></div>`).join('');}
    const ded=$('cross3DedPrompt');if(ded)ded.textContent='Zweryfikowane analizy: '+count()+' / 5 wniosków. Wnioski możesz przenieść na tablicę hipotez.';
  }
  function feedback(id,text){const el=document.querySelector('[data-c3-feedback="'+id+'"]');if(el)el.textContent=text;}
  function doAction(act,id){const c=known.get(id);if(!c)return;
    if(act==='review'){delete data.passed[id];delete data.interviewed[id];render();return;}
    if(act==='check'){
      const d=data.draft[id]||{};const reason=clean(d.reason).trim();
      if(!ready(c))return feedback(id,'Najpierw trzeba rzeczywiście zdobyć materiał wynikowy i niezależny dokument.');
      if(!d.source||!d.cross||d.source===d.cross||!STATE.found.has(d.source)||!STATE.found.has(d.cross))return feedback(id,'Wybierz dwa różne dokumenty, które posiadasz w aktach.');
      if(!d.answer)return feedback(id,'Wybierz wniosek i jego ocenę.');
      if(reason!=='best')return feedback(id,'Wybierz uzasadnienie, które zachowuje granice obu źródeł. Cztery inne możliwości zawierają nadinterpretację lub pomijają istotną kontrolę.');
      if(d.source!==c.source||d.cross!==c.cross||d.answer!==c.answer)return feedback(id,'Tych zapisów nie można zestawić w proponowany sposób. Sprawdź pochodzenie i ograniczenia obu materiałów, a nie tylko zgodność dat.');
      if(byId[d.source]?.family===byId[d.cross]?.family)return feedback(id,'Źródła pochodzą z jednej rodziny. Poszukaj niezależnej kontroli.');
      data.passed[id]={source:c.source,cross:c.cross,answer:c.answer,reason};delete data.interviewed[id];render();toast('Zatwierdzono audyt dowodowy: '+c.title+'.');return;
    }
    if(!solved(c))return;
    if(act==='interview'){
      STATE.activeChar=c.character;showTab('interview');
      renderChat();$('attachedDoc').value=c.source;$('chatInput').value=c.question;$('chatInput').focus();$('chatInput').scrollIntoView({block:'center',behavior:'smooth'});
      toast('Pytanie przygotowane. Zweryfikuj je i wyślij, aby uzyskać wypowiedź świadka.');
      return;
    }
    if(act==='deduct'){
      if(typeof dedWarnSwitch==='function'&&!dedWarnSwitch())return;
      const st=STATE.deduction;st.selected=null;
      st.draft={title:c.title,kind:'przypuszczenie',statement:c.statement,alternative:c.alternative+' Granica źródeł: '+(data.passed[id].reason==='best'?c.statement:data.passed[id].reason).slice(0,600),test:c.note+' Zadaj pytanie: '+c.question,rival:'',links:[{source:'doc:'+c.source,role:'supports',note:'Wynik odpowiedniej mini-gry — zakres zgodny z dokumentem.'},{source:'doc:'+c.cross,role:'limits',note:'Niezależny zapis kontrolny — ogranicza zbyt daleko idące wnioskowanie.'}]};
      st.dirty=true;st.feedback='Szkic oparty na porównaniu źródeł. Sprawdź argument i zapisz kartę.';
      showTab('deduction');dedRender();$('dedTitle').focus();toast('Dodano szkic hipotezy. Sprawdź go i zapisz na tablicy.');
    }
  }
  function onQuestion(character,q,attached){for(const c of CHECKS){if(!solved(c)||c.character!==character||attached!==c.source||!c.focus.test(norm(q)))continue;
      data.interviewed[c.id]=true;
    }
    // Refresh only if the audit tab is visible, to avoid disrupting the live chat.
    if($('labs')?.classList.contains('active'))render();
  }
  // Delegowane zdarzenia są wiązane jednokrotnie. Kolejne otwarcia audytu
  // nie tworzą słuchaczy dla usuwanych i ponownie budowanych formularzy.
  const auditRoot=$('cross3Panel');
  if(auditRoot){
    auditRoot.addEventListener('input',event=>{
      const el=event.target.closest('[data-cross3]');
      if(!el||!auditRoot.contains(el))return;
      const c=el.dataset.id,d=data.draft[c]||(data.draft[c]={});
      d[el.dataset.cross3]=el.value;
    });
    auditRoot.addEventListener('click',event=>{
      const el=event.target.closest('[data-c3-act]');
      if(el&&auditRoot.contains(el))doAction(el.dataset.c3Act,el.dataset.id);
    });
  }
  window.stage3={render,export:exportData,restore:restoreData,reset:()=>restoreData(null),onQuestion,count};
  render();
})();

