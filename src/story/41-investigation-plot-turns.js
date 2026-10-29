
/* Mocniejsze zwroty fabularne — sceny warunkowe po zweryfikowanych przełomach.
   Nie tworzą dowodów, nie modyfikują werdyktu i nie zwalniają z przesłuchania. */
(function(){
'use strict';
if(!window.PS69_STORY||typeof STATE==='undefined'||typeof buildSave!=='function')return;
const $85=id=>document.getElementById(id);
const BEATS=[
 {id:'work',kind:'Pierwsza rysa',title:'Kurs, który wyprzedził papier',needs:['work'],
  pages:[
   'Na jednym ekranie masz dyspozycję kursu. Na drugim — dokumentację warsztatu. Osobno wyglądają jak rutynowe wpisy z tej samej zmiany.',
   'Dopiero zestawienie zmienia ich znaczenie. Jedno źródło opisuje decyzję organizacyjną, drugie stan obsługi wagonu. Nie można już opowiadać tej nocy tak, jakby wszystkie informacje dotarły do wszystkich równocześnie.',
   'To jeszcze nie odpowiedź na pytanie o śmierć Leny. Ale pytanie o odpowiedzialność za kurs przestało być pytaniem wyłącznie o rozkład jazdy.'
  ],choices:[['MAREK','Co wyjaśnia zestawienie dyspozycji kursu wagonu z dokumentacją warsztatu?'],['JANUSZ','Co wynika z różnicy między kartą warsztatu a decyzją o kursie wagonu?']]},
 {id:'warning',kind:'Pierwsza rysa',title:'Ostrzeżenie, które nie zatrzymało obiegu',needs:['warning'],
  pages:[
   'Projekt zgłoszenia BHP jest śladem obawy. Dokument odbioru jest śladem procedury. Przez długi czas można czytać je osobno, bez jednego trudnego pytania.',
   'Gdy oba obiegi trafiają na ten sam stół, nie zgadzają się w tym, co dają sobie nawzajem do wiadomości. Ostrzeżenie nie staje się automatycznie decyzją, a odbiór nie unieważnia istnienia wcześniejszego sygnału.',
   'Nie ma tu dowodu, że ktoś chciał skrzywdzić Lenę. Jest za to powód, by zapytać, kto i na którym etapie mógł coś przeoczyć.'
  ],choices:[['ELZBIETA','Dlaczego zgłoszenie BHP i dokument odbioru pokazują różne informacje?'],['MAGDALENA','Jak wyjaśnisz rozbieżności między zgłoszeniem BHP a protokołem odbioru?']]},
 {id:'access',kind:'Zmiana perspektywy',title:'Przepustka nie ma twarzy',needs:['access'],
  pages:[
   'Karta T-17 pozostawia zapis wejścia. Konto audytowe pozostawia zapis sesji. Oba noszą ślady czyjegoś działania — i oba kuszą, by do zapisu od razu dopasować człowieka.',
   'Dwa rejestry okazują się świadkami różnych rzeczy. Karta nie opisuje właściciela dłoni, a sesja nie jest fotografią osoby stojącej przy drzwiach.',
   'Ktoś może mieć pozornie mocne alibi zbudowane z danych, które wcale nie dokumentują jego fizycznej obecności. Nie wolno też zrobić z tej luki dowodu przeciw niemu.'
  ],choices:[['KAMIL','Dlaczego karta T-17 i sesja audytu nie mogą potwierdzić alibi jednej osoby?'],['MAGDALENA','Co wynika z zestawienia karty dostępu i sesji audytu dla twojego alibi?']]},
 {id:'lastcontact',kind:'Przesunięcie osi',title:'Między powrotem a wiadomością',needs:['lastcontact'],
  pages:[
   'Dyspozytornia zapisała zmianę kursu. Późniejsza wiadomość dotycząca Leny należy już do innego fragmentu nocy. W prostym streszczeniu łatwo zszyć te zdarzenia w jedną opowieść.',
   'Kiedy ustawisz je obok siebie, pomiędzy faktami pozostaje luka: wiadomość ma swoją godzinę, ale sama nie mówi, kto pojawił się później ani co zaszło przy stanowisku.',
   'Właśnie ta luka staje się teraz istotna. Nie dlatego, że podpowiada nazwisko, ale dlatego, że zmusza do osobnego sprawdzenia kolejnego odcinka nocy.'
  ],choices:[['TOMASZ','Czy powrót wagonu i późniejsza wiadomość do Leny mają wspólną chronologię?'],['MAREK','Jaki związek ma decyzja o powrocie kursu z późniejszą wiadomością Leny?']]},
 {id:'mechanism',kind:'Ciemna luka',title:'Kontakt to nie opis śmierci',needs:['mechanism'],
  pages:[
   'Ślad ostatniego kontaktu prowadzi do pytania o Lenę. Analiza obrażeń prowadzi do pytania o mechanizm zdarzenia. Przez chwilę oba tropy wydają się kolejnymi stronami tej samej relacji.',
   'Ale pomiędzy nimi nie ma obserwatora, który pozwalałby od razu opisać przebieg całej nocy. Nawet trafna chronologia nie zmienia korespondencji w świadka przemocy.',
   'To najtrudniejsza część dochodzenia: rozdzielić to, co naprawdę ustalono, od wersji, która wydaje się najbardziej przekonująca.'
  ],choices:[['ELZBIETA','Co wiadomo z ostatniej wiadomości Leny i analizy obrażeń, a czego nadal nie wiemy?'],['MAGDALENA','Czy ostatni kontakt z Leną i charakter obrażeń potwierdzają przebieg zdarzenia?']]},
 {id:'faultline',kind:'Duży zwrot',title:'Nie jeden błąd, lecz dwa łańcuchy',needs:['work','warning'],
  pages:[
   'Najpierw niespójna dokumentacja warsztatowa. Potem osobny obieg ostrzeżenia i odbioru. Każda z tych historii mogła wyglądać jak pojedyncze zaniedbanie.',
   'Połączone nie wyjaśniają śmierci Leny. Zmieniają jednak skalę pytania: czy na tej zmianie ktokolwiek widział całość informacji, zanim zapadły decyzje?',
   'Nie wolno zamienić systemowej luki w automatyczny dowód zabójstwa. Ale nie wolno też zasłonić nią indywidualnych decyzji. Warto wrócić do ludzi, którzy mieli różne części obrazu.'
  ],choices:[['MAREK','Czy dyspozycja kursu i protokół warsztatu były znane mimo wcześniejszego zgłoszenia BHP?'],['ELZBIETA','Jak zgłoszenie BHP łączy się z warsztatem i zatwierdzeniem odbioru wagonu?']]},
 {id:'presence',kind:'Duży zwrot',title:'Alibi złożone z cudzych zegarów',needs:['access','lastcontact'],
  pages:[
   'Rejestry dostępu pokazują operacje. Zapis późniejszego kontaktu pokazuje kolejny punkt w czasie. Pozornie wystarczy je ułożyć, by wskazać, kto gdzie był.',
   'Ale po tej rekonstrukcji zostaje niewygodna różnica: czas systemu nie jest obserwacją człowieka. Co więcej, dwa zgodne zegary nie muszą opisywać tej samej osoby.',
   'Historia sprawy zmienia kierunek. Teraz najważniejsze nie jest to, który numer widnieje w logu, lecz jakie niezależne źródło pozwoliłoby powiązać zdarzenie z konkretnym człowiekiem.'
  ],choices:[['KAMIL','Czy karta T-17 i późniejsza wiadomość do Leny mogą ustalić czyjąś obecność?'],['MAGDALENA','Czy sesja audytu oraz późniejszy kontakt z Leną potwierdzają alibi?']]},
 {id:'boundary',kind:'Ostatni zwrot',title:'Ostatnia wiadomość nie ma sprawcy',needs:['lastcontact','mechanism'],
  pages:[
   'Zmiana kursu, późniejszy kontakt i opinia o obrażeniach zaczynają układać się w ciąg wydarzeń. Z daleka wygląda on niemal jak gotowe oskarżenie.',
   'Im bliżej przyglądasz się źródłom, tym wyraźniej widać przerwę: wiadomość nie identyfikuje człowieka przy stanowisku, a dokumentacja medyczna nie zastępuje zeznań naocznych.',
   'Finał nie powinien być wyborem najlepiej brzmiącej historii. Powinien być decyzją o tym, czego można dowieść, a co nadal pozostaje niewiadomą. Od tej granicy zależy ciężar zarzutu.'
  ],choices:[['MAGDALENA','Czy kolejność wiadomości do Leny i analiza obrażeń mogą ustalić odpowiedzialność za śmierć?'],['ELZBIETA','Co mówi ostatni kontakt z Leną i opinia o obrażeniach, a czego nie potwierdza?']]}
];
const by=new Map(BEATS.map(b=>[b.id,b]));
const names=Object.fromEntries(CONTENT.characters.map(c=>[c.id,c.name]));
let current=null,frame=0,lastFocus=null;
function fresh(){return {read:[],routes:{}};}
let memory=fresh();
function available(){const a=new Set(window.PS69_STORY.available());return BEATS.filter(b=>b.needs.every(id=>a.has(id)));}
function verified(id){return available().some(x=>x.id===id);}
function ensure(){if(!Array.isArray(memory.read))memory.read=[];if(!memory.routes||typeof memory.routes!=='object')memory.routes={};}
const root=document.createElement('section');root.id='ps85Stories';root.className='surface padded';root.setAttribute('aria-label','Sceny przełomowe');root.hidden=true;
root.innerHTML='<div class="ps85-heading"><div><div class="eyebrow">ZDERZENIA FAKTÓW</div><h3>Kiedy akta zmieniają znaczenie</h3><p>Wielkie zwroty pojawiają się dopiero po niezależnym zweryfikowaniu odpowiednich wątków. Odczytaj scenę i zdecyduj, do kogo wrócić z pytaniem.</p></div><span class="ps85-counter" id="ps85Count"></span></div><div class="ps85-cards" id="ps85Cards"></div>';
const host=$85('ps69Breakthroughs');if(host)host.insertAdjacentElement('afterend',root);else $85('deduction')?.append(root);
const pulse=document.createElement('div');pulse.id='ps85Pulse';pulse.hidden=true;
pulse.innerHTML='<div><strong id="ps85PulseTitle"></strong><span id="ps85PulseCopy"></span></div><button type="button" class="btn alt" id="ps85PulseGo">Otwórz scenę</button>';
const anchor=$85('ps70Pulse');if(anchor)anchor.insertAdjacentElement('afterend',pulse);
const curtain=document.createElement('div');curtain.id='ps85Curtain';curtain.hidden=true;curtain.setAttribute('role','dialog');curtain.setAttribute('aria-modal','true');curtain.setAttribute('aria-labelledby','ps85FilmTitle');
curtain.innerHTML='<div class="ps85-stage"><button type="button" class="ps85-dismiss" id="ps85Close" aria-label="Zamknij scenę">✕</button><div class="ps85-film-label" id="ps85FilmKind"></div><div class="ps85-film-line"></div><h2 id="ps85FilmTitle"></h2><p id="ps85FilmText" aria-live="polite"></p><div id="ps85FilmMeta"></div><div class="ps85-film-actions" id="ps85FilmActions"></div><p class="ps85-panel-note">Te ustalenia opierają się wyłącznie na zweryfikowanych aktach. Scena nie dodaje dowodu, nie przesądza winy ani nie wysyła pytania automatycznie.</p></div>';
document.body.append(curtain);
const close=$85('ps85Close');
let restoreFocus=null;
function hide(){curtain.hidden=true;document.body.classList.remove('ps85-modal-on');current=null;restoreFocus?.focus?.({preventScroll:true});restoreFocus=null;}
close.addEventListener('click',hide);
curtain.addEventListener('click',e=>{if(e.target===curtain)hide();});
document.addEventListener('keydown',e=>{if(curtain.hidden)return;if(e.key==='Escape'){e.preventDefault();hide();}else if(e.key==='Tab'){const buttons=[...curtain.querySelectorAll('button:not(:disabled)')];if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
function renderFrame(){if(!current||!verified(current.id)){hide();return;}
 const stage=current,finished=frame>=stage.pages.length;
 $85('ps85FilmKind').textContent=stage.kind+' • '+(finished?'KIERUNEK DALSZYCH PYTAŃ':'CZĘŚĆ '+(frame+1)+' / '+stage.pages.length);
 $85('ps85FilmTitle').textContent=stage.title;
 $85('ps85FilmText').textContent=finished?'W aktach pozostaje pytanie, na które nie odpowie sama scena. Wybierz osobę, do której chcesz z nim wrócić. Pytanie pojawi się w polu przesłuchania — możesz je zmienić przed wysłaniem.':stage.pages[frame];
 $85('ps85FilmText').classList.remove('ps85-reveal');void $85('ps85FilmText').offsetWidth;$85('ps85FilmText').classList.add('ps85-reveal');
 $85('ps85FilmMeta').textContent=finished?'Rozmowa nie jest automatyczna':`Zweryfikowane powiązania: ${stage.needs.length} · ${stage.kind}`;
 const actions=$85('ps85FilmActions');actions.replaceChildren();
 if(!finished){const next=document.createElement('button');next.className='btn';next.textContent=frame===stage.pages.length-1?'Przejdź do decyzji':'Odsłoń dalszy ciąg';next.addEventListener('click',()=>{frame++;renderFrame();});actions.append(next);}
 else{
  if(!memory.read.includes(stage.id))memory.read.push(stage.id);
  for(const [id,question] of stage.choices){const btn=document.createElement('button');btn.className='btn alt ps85-dialog-choice';btn.textContent='Wróć do: '+(names[id]||id);btn.addEventListener('click',()=>choose(stage,id,question));actions.append(btn);}
  const later=document.createElement('button');later.className='btn subtle';later.textContent='Zachowaj w aktach i wróć później';later.addEventListener('click',()=>{hide();render();});actions.append(later);
 }
}
function show(id){const beat=by.get(id);if(!beat||!verified(id))return;restoreFocus=document.activeElement;current=beat;frame=0;curtain.hidden=false;document.body.classList.add('ps85-modal-on');renderFrame();close.focus({preventScroll:true});}
function choose(beat,person,question){if(!verified(beat.id)||!names[person])return;ensure();memory.read=[...new Set([...memory.read,beat.id])];memory.routes[beat.id]=person;
 hide();STATE.activeChar=person;showTab('interview');
 const field=$85('chatInput');if(field){field.value=question;field.focus({preventScroll:true});}
 render();}
function render(){ensure();const unlocked=available(),unread=unlocked.filter(b=>!memory.read.includes(b.id));
 root.hidden=!unlocked.length;
 if(unlocked.length){$85('ps85Count').textContent=`${memory.read.filter(id=>verified(id)).length} / ${unlocked.length} odczytanych`;
 $85('ps85Cards').innerHTML=unlocked.map(b=>`<article class="ps85-card ${b.needs.length>1?'ps85-cross':''} ${!memory.read.includes(b.id)?'ps85-unseen':''}"><small>${esc(b.kind)} · ${b.needs.length>1?'dwa przełomy':'sprawdzony trop'}</small><h4>${esc(b.title)}</h4><p>${esc(b.pages[0])}</p><span class="ps85-path">${memory.routes[b.id]?'Obrany kierunek: '+esc(names[memory.routes[b.id]]||''):(memory.read.includes(b.id)?'Scena odczytana':'Nowe odkrycie')}</span><button class="btn alt" type="button" data-ps85-open="${esc(b.id)}">${memory.read.includes(b.id)?'Przeczytaj ponownie':'Odkryj scenę'}</button></article>`).join('');
 root.querySelectorAll('[data-ps85-open]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.ps85Open)));
 }
 pulse.hidden=!unread.length;
 if(unread.length){const top=unread.find(b=>b.needs.length===2)||unread[0];$85('ps85PulseTitle').textContent='Nowy zwrot w aktach';$85('ps85PulseCopy').textContent=`${unread.length} ${unread.length===1?'scena czeka':'sceny czekają'} na odczytanie. Ustalono niezależne powiązania.`;$85('ps85PulseGo').onclick=()=>{showTab('deduction');show(top.id);};}
}
// Czynności śledcze są już w silniku; dopinamy wyłącznie narrację po ich weryfikacji.
const oldStoryRender=ps53Render;
ps53Render=function(){const result=oldStoryRender.apply(this,arguments);render();return result;};
registerNavigationHook({name:'investigation-plot-turns',after:render});

/* SaveManager: buildSave hook. */
registerSaveHook({name:"41-investigation-plot-turns-save1", build(__save){const data=__save;ensure();data.cinematic85={read:memory.read.filter(id=>verified(id)),routes:Object.fromEntries(Object.entries(memory.routes).filter(([id,person])=>verified(id)&&by.get(id)?.choices.some(([who])=>who===person)))};return data;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"41-investigation-plot-turns-load1", apply(data){const result=undefined;const saved=data?.cinematic85;
 memory=fresh();const eligible=new Set(available().map(b=>b.id));if(saved&&typeof saved==='object'){
  if(Array.isArray(saved.read))memory.read=[...new Set(saved.read.filter(id=>typeof id==='string'&&eligible.has(id)))].slice(0,BEATS.length);
  if(saved.routes&&typeof saved.routes==='object')for(const [id,person] of Object.entries(saved.routes)){if(eligible.has(id)&&by.get(id)?.choices.some(([who])=>who===person))memory.routes[id]=person;}
 }
 if(!curtain.hidden)hide();render();return result;}});
const oldReset=simReset;
simReset=function(){const out=oldReset.apply(this,arguments);memory=fresh();if(!curtain.hidden)hide();render();return out;};
// Existing epilogue remains authoritative: add a retrospective trace, not another verdict.
const after=$85('ps72Last');
if(after){const trail=document.createElement('p');trail.id='ps85Trail';trail.style.cssText='margin:12px 0 0;padding-top:12px;border-top:1px solid rgba(217,172,99,.25);font-size:12px;color:#bec9c5;line-height:1.7';after.appendChild(trail);
 const oldArc=window.PS70_ARC?.render;
 function epilogue(){if(after.hidden){trail.hidden=true;return;}const ids=memory.read.filter(verified),last=ids.at(-1),scene=by.get(last);trail.hidden=!scene;if(scene)trail.textContent='W ostatnich kartach śledztwa pozostało jeszcze zestawienie „'+scene.title+'”. '+(memory.routes[last]?'Wybrano dalszy kierunek pytań: '+(names[memory.routes[last]]||'')+'.':'Nie zastępuje ono dalszej weryfikacji.');}
 if(oldArc)window.PS70_ARC.render=function(){const r=oldArc.apply(this,arguments);epilogue();return r;};
 registerNavigationHook({name:'investigation-plot-epilogue',after:epilogue});
 epilogue();}
render();
window.PS85_STORY={available:()=>available().map(b=>b.id),read:()=>memory.read.slice(),route:id=>memory.routes[id]||null,open:show,render};
})();
