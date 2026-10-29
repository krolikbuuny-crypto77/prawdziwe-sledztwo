
/* 6.6 — samodzielne dochodzenie. Wyłącznie odczytuje potwierdzone czynności i
   istniejące komunikaty. Nie zmienia dokumentów, wiedzy NPC, wyniku łamigłówek,
   czasu, zaufania, stanu zapisu ani warunków finału. */
(function(){'use strict';
 if(typeof STATE==='undefined'||typeof showTab!=='function'||typeof PS62_BALANCE==='undefined')return;
 const $=id=>document.getElementById(id);
 const topics=[
  {id:'sequence',title:'Czy odtworzyłem kolejność zdarzeń?',description:'Oddziel relacje osób od zapisów czasu. Dwie metody pozwalają sprawdzić tę samą rekonstrukcję.',routes:[
   {title:'Chronologia dokumentów',tab:'timeline',desc:'Umieść zdarzenia na osi i oceń zgodność wskazanych źródeł.'},
   {title:'Relacje i alibi',tab:'interview',desc:'Sprawdź, które minuty świadek pamięta, a które zna tylko z dokumentacji.'}]},
  {id:'technical',title:'Czy materiał techniczny jest spójny?',description:'Dane systemowe mogą się nie pokrywać z opisem na papierze. Odmienny typ źródła jest ważniejszy niż liczba kopii.',routes:[
   {title:'Odczyt z systemów',tab:'labs',labIndex:0,desc:'Sprawdź etap analizy TCMS i ograniczenia raportu.'},
   {title:'Historia dokumentacji',tab:'evidence',desc:'Porównaj pozyskane protokoły i ich status, nie utożsamiaj zapisu z intencją.'}]},
  {id:'access',title:'Co można ustalić o dostępie?',description:'Zdarzenie przy czytniku, nagranie i faktyczna obecność człowieka to różne rodzaje ustaleń.',routes:[
   {title:'Rejestry i przejścia',tab:'labs',labIndex:4,desc:'Oceń, czego dowodzi wpis dostępu lub możliwa trasa.'},
   {title:'Kontrola obrazem',tab:'labs',labIndex:2,desc:'Zestaw niezależne ujęcia CCTV, uwzględniając luki i czas kamer.'}]},
  {id:'scene',title:'Czy obraz miejsca zgadza się z aktami?',description:'Oględziny i ekspertyza powinny wzajemnie sprawdzać granice wniosku.',routes:[
   {title:'Obserwacja miejsca',tab:'inspection12',desc:'Zbadaj obiekt metodą, odróżnij obserwację od interpretacji.'},
   {title:'Ekspertyza śladów',tab:'labs',labIndex:3,desc:'Porównaj wyniki z niezależną próbką; nie traktuj podobieństwa jako identyfikacji.'}]},
  {id:'testimony',title:'Czy zeznania są sprawdzalne?',description:'Pamięć świadka, jego opinia i niezależny dowód nie mają tej samej wartości.',routes:[
   {title:'Dopytanie świadka',tab:'interview',desc:'Zapytaj o źródło informacji, szczegóły i to, czego świadek nie widział.'},
   {title:'Audyt materiałów',tab:'deduction',desc:'Sprawdź inną rodzinę dowodów i zanotuj, co przeczy relacji.'}]},
  {id:'hypothesis',title:'Czy własna hipoteza wytrzymuje krytykę?',description:'Silna argumentacja powinna uwzględniać dowody wspierające, ograniczenia i wersję konkurencyjną.',routes:[
   {title:'Tablica wnioskowania',tab:'deduction',desc:'Zapisz hipotezę, kontrargument oraz role niezależnych źródeł.'},
   {title:'Obrona kontradyktoryjna',tab:'final',desc:'Sprawdź, które twierdzenia przetrwałyby podważanie przez obronę.'}]}
 ];
 const types={overview:'Pulpit',evidence:'Akta',search:'Poszukiwania',interview:'Przesłuchania',timeline:'Oś czasu',inspection12:'Oględziny',notebook:'Notatnik',labs:'Laboratorium',deduction:'Dedukcja',final:'Finał'};
 let picked='sequence';
 function progress(){const labs=PS62_BALANCE.labStatus(),found=STATE.found?.size||0;
  const timeline=Object.values(STATE.timeline11?.entries||{}).filter(x=>x?.at).length;
  const verifiedTimeline=typeof TL_EVENTS!=='undefined'&&typeof tlAssessment==='function'?TL_EVENTS.filter(e=>STATE.timeline11?.entries?.[e.id]?.at&&tlAssessment(e,STATE.timeline11.entries[e.id]).state==='ok').length:0;
  return {labs,found,timeline,verifiedTimeline,rooms:STATE.scene12?.visited?.length||0,inspected:STATE.scene12?.inspected?.length||0,
   interviews:CONTENT.characters.filter(c=>(STATE.dialogues?.[c.id]||[]).some(x=>x.role==='player')).length,
   cards:STATE.deduction?.cards?.length||0,audited:STATE.sim?.verified?.length||0};
 }
 function topicStatus(id,s){
  switch(id){
   case 'sequence':return `Zapisane punkty osi czasu: ${s.timeline}; ocenione jako zgodne ze źródłami: ${s.verifiedTimeline}. Rozmowy rozpoczęto z ${s.interviews} z 6 osób.`;
   case 'technical':return `Analiza TCMS: ${s.labs[0]?.done?'raport zatwierdzony':'raport niezatwierdzony'}. W aktach: ${s.found} materiałów.`;
   case 'access':return `Raport dostępu: ${s.labs[4]?.done?'zatwierdzony':'niezatwierdzony'}. Raport CCTV: ${s.labs[2]?.done?'zatwierdzony':'niezatwierdzony'}.`;
   case 'scene':return `Zbadane obiekty oględzin: ${s.inspected}; odwiedzone strefy: ${s.rooms}. Raport śladów: ${s.labs[3]?.done?'zatwierdzony':'niezatwierdzony'}.`;
   case 'testimony':return `Rozmowy rozpoczęto z ${s.interviews} z 6 świadków; liczba materiałów po audycie: ${s.audited}.`;
   case 'hypothesis':return `Własne karty dedukcyjne: ${s.cards}. To informacja o czynnościach, nie o prawdziwości hipotezy.`;
  }
  return '';
 }
 const roots=[];
 function mount(parent,after,id){const details=document.createElement('details');details.className='ps66-root';details.id=id;
  const summary=document.createElement('summary');summary.textContent='Rejestr nierozstrzygniętych pytań — dwie drogi badania';
  const intro=document.createElement('p');intro.textContent='Wybierz kwestię. Zobaczysz dwa niezależne kierunki sprawdzenia i rzeczywisty stan wykonanych czynności. Nie jest to lista obowiązkowych rozwiązań.';
  const buttons=document.createElement('div');buttons.className='ps66-questions';
  const detail=document.createElement('div');detail.className='ps66-detail';
  details.append(summary,intro,buttons,detail);
  if(after)parent.after(details);else parent.prepend(details);
  roots.push({details,buttons,detail});
  details.addEventListener('click',e=>{const choose=e.target.closest('[data-ps66-topic]');if(choose){picked=choose.dataset.ps66Topic;render();return;}
   const go=e.target.closest('[data-ps66-go]');if(go){showTab(go.dataset.ps66Go);if(go.dataset.ps66LabIndex){const open=$('labCards')?.querySelector('[data-open-lab="'+go.dataset.ps66LabIndex+'"]');open?.click();}}});
 }
 const overview=$('overview'),notebook=$('notebook');
 if(overview)mount($('ps62Orientation')||overview.querySelector('.ui14-dashboard')||overview,true,'ps66Overview');
 if(notebook)mount(notebook,false,'ps66Notebook');
 function render(){const s=progress(),item=topics.find(x=>x.id===picked)||topics[0];
  for(const root of roots){if(!root.details.open||!root.details.closest('.section')?.classList.contains('active'))continue;root.buttons.replaceChildren();
   for(const q of topics){const b=document.createElement('button');b.type='button';b.className='ps66-question';b.dataset.ps66Topic=q.id;b.textContent=q.title;b.setAttribute('aria-pressed',String(item.id===q.id));root.buttons.append(b);}
   root.detail.replaceChildren();const h=document.createElement('h4');h.textContent=item.title;
   const desc=document.createElement('p');desc.textContent=item.description;
   const metric=document.createElement('div');metric.className='ps66-metric';metric.textContent=topicStatus(item.id,s);
   const routes=document.createElement('div');routes.className='ps66-routes';
   for(const r of item.routes){const box=document.createElement('div');box.className='ps66-route';const title=document.createElement('b');title.textContent=r.title;
    const text=document.createElement('small');text.textContent=r.desc;const button=document.createElement('button');button.type='button';button.dataset.ps66Go=r.tab;if(Number.isInteger(r.labIndex))button.dataset.ps66LabIndex=String(r.labIndex);button.textContent='Przejdź: '+types[r.tab];box.append(title,text,button);routes.append(box);}
   const caveat=document.createElement('small');caveat.className='ps66-noreveal';caveat.textContent='Wykonanie czynności nie oznacza, że teza została udowodniona. Możesz wybrać inną drogę.';
   root.detail.append(h,desc,metric,routes,caveat);
  }
  return {selected:picked,...s};
 }
 const explainers={
  search(){const txt=$('searchResults')?.textContent||'';
   if(/najbardziej pasujący materiał|spróbuj obszaru|przełącz obszar/i.test(txt))return 'W wybranej części zajezdni nie uzyskano odpowiedniego źródła. Przełącz obszar lub opisz funkcję materiału, nie jego nazwę.';
   if(/pracowni|ekspertyzy|analiz/i.test(txt))return 'Wskazany rodzaj materiału wymaga odrębnej analizy. Sprawdź w pracowniach źródła wejściowe i etap raportu.';
   if(/wcześniejszych ustaleń|wymaga wcześniejszych/i.test(txt))return 'Ograniczenie dotyczy dostępu do materiału, a nie niepoprawnej odpowiedzi. Wróć do posiadanych akt i odnotuj brakujące źródło.';
   if(/nie odnaleziono|brak pasującego|zbyt ogólne|nie znal/i.test(txt))return 'Brak rezultatu nie jest dowodem, że materiał nie istnieje. Zmień jedno kryterium naraz: obszar, funkcję albo nazwę obiektu.';
   if($('searchQuery')?.value.trim())return 'Przy znalezionych wynikach otwórz wybrany materiał. Liczba wyników nie potwierdza jeszcze Twojej hipotezy.';
   return 'Wybierz obszar i opisz przedmiot albo funkcję źródła. Nie musisz znać dokładnego tytułu dokumentu.';},
  labs(){const l=PS62_BALANCE.labStatus().filter(x=>!x.done);
   if(!l.length)return 'Raporty pięciu pracowni są zatwierdzone. Ich treść nadal należy zestawić z innymi źródłami i ograniczeniami.';
   const waiting=l.filter(x=>x.current<x.total);
   if(waiting.length)return `W ${waiting.length} pracowniach brakuje jeszcze kompletu dokumentów wejściowych. Wybierz jedną pracownię i sprawdź jej status; nie zgaduj pól raportu bez materiału.`;
   return 'Źródła wejściowe są zgromadzone, lecz część raportów nie jest zatwierdzona. Ukończ oddzielnie analizę i kontrolę raportu.';},
  timeline(){const s=progress();if(!s.timeline)return 'Wybierz odkryty punkt rekonstrukcji. Wskaż czas, źródła i zakres ich pewności, a następnie użyj sprawdzenia zgodności.';
   if(s.verifiedTimeline<s.timeline)return `Z ${s.timeline} zapisanych punktów ${s.verifiedTimeline} ma ocenę „zgodne”. Sprawdź szczegółowy komunikat przy problematycznym punkcie: godzinę, źródło i ograniczenia.`;
   return 'Zapisane punkty są ocenione jako zgodne. Sprawdź jeszcze ich wzajemną spójność oraz zakres czasowy; sama liczba wpisów nie rozstrzyga przebiegu zdarzeń.';},
  inspection12(){const s=STATE.scene12||{};if(!s.selected)return 'Wybierz strefę, obejrzyj widok i wskaż obiekt do oględzin. Brak znaczników nie oznacza, że miejsce jest puste.';
   if(!s.inspected?.includes(s.selected))return 'Obiekt został wskazany, ale nie ma jeszcze ukończonych oględzin. Sprawdź metodę badania i interpretację, zamiast próbować kolejnych obiektów przypadkowo.';
   return 'Obiekt jest zbadany. Oddziel obserwację od wniosku i spróbuj powiązać ją z niezależnym materiałem.';},
  deduction(){const d=STATE.deduction;if(!d.cards?.length&&!d.draft?.links?.length)return 'Zacznij od twierdzenia, które da się obalić lub potwierdzić. Połącz co najmniej jedno posiadane źródło i zapisz kartę.';
   if(d.dirty)return 'Masz niezapisane zmiany. Sprawdź tytuł i treść wniosku, role źródeł oraz kontrargument, a następnie zapisz kartę.';
   return 'Oceń, czy posiadane źródła są niezależne. Dopisz ograniczenie lub kontrargument; sama liczba połączeń nie dowodzi prawdziwości tezy.';},
  interview(){return 'Zapytaj, czy świadek mówi z własnej obserwacji. Oddziel jego przypuszczenia od zapisów i nie naciskaj bez zweryfikowanego źródła.';},
  final(){const p=PS601_P0.review();if(!p.complete)return `Pełny sukces ograniczają filary dochodzenia: ${p.entries.filter(x=>!x.ok).map(x=>x.label).join(', ')}. Słabsze zakończenia nadal są możliwe.`;
   return 'Trzy filary zostały zapisane. Sprawdź teraz odrębnie jakość argumentacji, ujawnienie sprzeczności i odpowiedzi na zarzuty obrony.';},
  evidence(){return 'Przy każdym akcie rozdziel: co dokument rejestruje, co z tego logicznie wynika i jakie inne źródło mogłoby temu zaprzeczyć.';},
  notebook(){return 'Wybierz jedno nierozstrzygnięte pytanie z rejestru, sprawdź je niezależnymi metodami i zapisz kontrargument. Nie trzeba wykonywać wszystkich ścieżek.';},
  overview(){return 'Sprawdź rejestr nierozstrzygniętych pytań. Zamiast jednej nakazanej kolejności dostępne są dwa kierunki kontroli dla każdej kwestii.';}
 };
 for(const [id,name] of Object.entries(types)){
  const section=$(id);if(!section)continue;
  const details=document.createElement('details');details.className='ps66-explain';details.id='ps66Explain_'+id;
  const summary=document.createElement('summary');summary.textContent='Nie wiem, co sprawdzić dalej — wyjaśnij stan';
  const button=document.createElement('button');button.className='ps66-check';button.type='button';button.textContent='Sprawdź aktualny stan';
  const body=document.createElement('div');body.className='ps66-analysis';body.setAttribute('role','status');body.setAttribute('aria-live','polite');
  const explanation=()=>{body.textContent=explainers[id]?.()||'Sprawdź źródła i ograniczenia w tym module.';};
  details.append(summary,button,body);section.append(details);explanation();
  details.addEventListener('toggle',()=>{if(details.open)explanation();});button.addEventListener('click',explanation);
 }
 for(const root of roots)root.details.addEventListener('toggle',()=>{if(root.details.open)render();});
 registerNavigationHook({name:'independent-investigation',after:()=>{const active=$('ps66Explain_'+(STATE.tab||'overview'));if(active?.open)active.querySelector('.ps66-check')?.click();render();}});
 /* SaveManager: applySave hook. */
registerSaveHook({name:"26-independent-investigation-load1", apply(data){const r=undefined;render();return r;}});
 const oldReset=psReset;psReset=function(){const r=oldReset.apply(this,arguments);picked='sequence';render();return r;};
 window.PS66_INQUIRY={version:'6.6',progress,topicStatus,select(id){if(topics.some(x=>x.id===id)){picked=id;render();}return picked;},render,explain:(tab)=>explainers[tab]?.()||''};
})();
