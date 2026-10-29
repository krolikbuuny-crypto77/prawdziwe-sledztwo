
/* Wersja 6.2: nawigacja nieliniowa, kontekstowe podpowiedzi proceduralne i statusy pracowni.
   Wyłącznie obserwuje stan gracza. Nie zmienia odpowiedzi, progów, zawartości akt,
   stanu dowodów, zasobów ani zakończeń. Wszystkie wskazówki są opcjonalne. */
(function(){'use strict';
 if(typeof STATE==='undefined'||typeof showTab!=='function'||typeof buildSave!=='function')return;
 const overview=document.getElementById('overview'),labs=document.getElementById('labs');
 if(!overview||!labs||!document.getElementById('ps603Help'))return;
 const names={overview:'Pulpit',evidence:'Akta',search:'Poszukiwania',interview:'Przesłuchania',timeline:'Oś czasu',inspection12:'Oględziny',notebook:'Notatnik',labs:'Laboratorium',deduction:'Dedukcja',final:'Finał'};
 const labDefs=[
  {name:'TCMS',key:'tcms',inputs:()=>TCMS_INPUT},
  {name:'Wiadomości',key:'msg',inputs:()=>MSG_INPUT},
  {name:'CCTV',key:'cctv',inputs:()=>CCTV_INPUT},
  {name:'Kryminalistyka',key:'forensic',inputs:()=>FO_INPUT},
  {name:'Dostęp i trasy',key:'access',inputs:()=>ACCESS_SECRET.inputs}
 ];
 const panel=document.createElement('section');panel.className='ps62-shell';panel.id='ps62Orientation';panel.setAttribute('aria-label','Orientacja w śledztwie bez podpowiedzi fabularnych');
 panel.innerHTML='<div class="eyebrow">ORIENTACJA W DOCHODZENIU</div><h3>Możliwe kierunki działania</h3><p>Śledztwo nie ma jednej obowiązkowej kolejności. Wybierz obszar, który chcesz teraz rozwinąć; te informacje nie oceniają winy ani nie zdradzają treści dokumentów.</p><div class="ps62-metrics" id="ps62Metrics"></div><div class="ps62-directions" id="ps62Directions"></div>';
 const dashboard=overview.querySelector('.ui14-dashboard')||overview.querySelector('.hero');
 if(dashboard)dashboard.after(panel);else overview.prepend(panel);
 const labPanel=document.createElement('section');labPanel.className='ps62-shell';labPanel.id='ps62LabStatus';labPanel.setAttribute('aria-label','Stan pięciu pracowni');
 labPanel.innerHTML='<div class="eyebrow">PRACOWNIE</div><h3>Analiza i raport to dwa oddzielne kroki</h3><p>Źródła wejściowe otwierają drogę do analizy. Nawet poprawnie wykonana łamigłówka wymaga zatwierdzenia raportu końcowego, aby wynik trafił do akt.</p><div id="ps62LabCount" class="ps62-lab-state" aria-live="polite"></div><div class="ps62-lab-grid" id="ps62LabGrid"></div>';
 const labCards=document.getElementById('labCards');if(labCards)labs.insertBefore(labPanel,labCards);else labs.prepend(labPanel);
 const extraHelp={
  overview:['Zacznij od tego, co już możesz sprawdzić: znanych akt, miejsca zdarzenia albo rozmowy ze świadkiem.','Kiedy jedna droga nie daje rezultatu, spróbuj innego rodzaju źródła. Dokumenty, zeznania i oględziny wzajemnie się kontrolują.'],
  evidence:['Oddziel treść dokumentu od pytania, co faktycznie potwierdza: czas, czynność, osobę czy tylko zapis w systemie.','Wypisz w notatniku twierdzenie, możliwy kontrargument i inną rodzinę materiału, która pozwoli je zweryfikować.'],
  search:['Spróbuj określić funkcję dokumentu zamiast jego tytułu: co rejestrował, czego dotyczył i w jakim obszarze powstał.','Jeśli materiału nie ma, sprawdź wskazany obszar albo pracownię. Brak wyniku nie zawsze oznacza brak takiego dowodu w sprawie.'],
  interview:['Ustal, czy rozmówca mówi o własnej obserwacji, zapisie dokumentu czy relacji innej osoby.','Zanim użyjesz konfrontacji, nazwij konkretną sprzeczność i sprawdź, czy okazany materiał naprawdę rozstrzyga tę kwestię.'],
  timeline:['Rozdziel godzinę wystąpienia zdarzenia od godziny rejestracji lub zgłoszenia; nie muszą być identyczne.','Jeżeli dwa wpisy kolidują, sprawdź korekty zegarów, rodzaj źródła i ograniczenia przedziału czasowego.'],
  inspection12:['Wybierz strefę, obejrzyj kolejne kadry i dopiero potem określ metodę badania konkretnego obiektu.','Nie oceniaj śladu wyłącznie po wyglądzie: porównaj jego położenie i charakter z dokumentami oraz zapisz ograniczenia obserwacji.'],
  notebook:['Zapisuj nierozstrzygnięte pytania w formie, do której można później wrócić.','Przy każdej tezie dopisz, co mogłoby ją obalić. Później wróć do odpowiednich analiz lub przesłuchań.'],
  labs:['Najpierw sprawdź, czy masz źródła wejściowe, potem wykonaj czynności w pracowni i zatwierdź osobny raport.','Jeśli raport nie przechodzi kontroli, popraw tylko wskazany element: kompletność źródeł, chronologię, interpretację lub granice wniosku. Nie zgaduj wszystkich pól od nowa.'],
  deduction:['Dla jednej hipotezy wskaż osobno materiał wspierający, ograniczenie oraz możliwy kontrargument.','Więcej dokumentów z tej samej rodziny nie zastępuje niezależności. Spróbuj znaleźć źródło innego rodzaju.'],
  final:['Sprawdź nie tylko siłę dowodów, ale też zarzuty obrony, trzy filary dochodzenia i ujawnienie wątpliwości.','Dobry wniosek procesowy powinien mówić, co źródło potwierdza, ale również czego nie potwierdza; wysoki wynik procentowy nie wystarcza.']
 };
 const byId=id=>document.getElementById(id);
 let hintStep=0;
 let missedSearch=0;
 const help=byId('ps603Help'),helpText=byId('ps603HelpText');
 const hint=document.createElement('button');hint.type='button';hint.className='ps62-help-more';hint.id='ps62HintMore';hint.textContent='Pokaż dodatkową wskazówkę proceduralną';
 const hintBody=document.createElement('div');hintBody.className='ps62-extra';hintBody.id='ps62HintBody';hintBody.hidden=true;hintBody.setAttribute('role','status');
 help.append(hint,hintBody);
 function setHint(){const tab=STATE.tab||'overview',options=extraHelp[tab]||extraHelp.overview;hint.textContent=hintStep===0?'Dodatkowa wskazówka 1/2':hintStep===1?'Dodatkowa wskazówka 2/2':'Ukryj dodatkowe wskazówki';hintBody.hidden=hintStep===0;
  hintBody.textContent=hintStep>0?options.slice(0,hintStep).map((x,i)=>(i+1)+'. '+x).join('\n'):'';hintBody.style.whiteSpace='pre-line';}
 hint.addEventListener('click',()=>{hintStep=hintStep===2?0:hintStep+1;setHint();});
 const labStatus=()=>labDefs.map((lab,index)=>{
   const all=lab.inputs(),current=all.filter(id=>STATE.found.has(id)).length,done=!!STATE[lab.key]?.solved;
   return {index,name:lab.name,done,current,total:all.length,attempts:STATE[lab.key]?.attempts||0,phase:done?'Raport zatwierdzony':current<all.length?'Zbieranie źródeł':'Analiza i raport do ukończenia'};
 });
 function status(){const l=labStatus(),p0=typeof PS601_P0!=='undefined'?PS601_P0.review():{passed:0,complete:false};
  const timeline=Object.values(STATE.timeline11?.entries||{}).filter(x=>x?.at).length;
  return {documents:STATE.found.size,laboratories:l,labDone:l.filter(x=>x.done).length,inspections:STATE.scene12?.inspected?.length||0,timeline,notes:STATE.deduction?.cards?.length||0,pillars:p0.passed,interviews:CONTENT.characters.filter(c=>(STATE.dialogues?.[c.id]||[]).some(x=>x.role==='player')).length};
 }
 const routes=[
  {title:'Zdobywanie źródeł',tab:'search',description:s=>s.documents===13?'Zbadaj nowe obszary i weryfikuj dokumenty.':'Materiały w aktach: '+s.documents+' z '+DOCS.length+'.'},
  {title:'Oględziny i świadkowie',tab:'inspection12',description:s=>'Zbadane obiekty: '+s.inspections+'. Rozmowy i oględziny można prowadzić niezależnie.'},
  {title:'Pracownie',tab:'labs',description:s=>s.labDone+' z 5 raportów zatwierdzonych. Ukończona analiza bez raportu nie powiększa akt.'},
  {title:'Rekonstrukcja i dedukcja',tab:'deduction',description:s=>'Wpisy osi czasu: '+s.timeline+'; karty hipotez: '+s.notes+'. Sprawdzaj alternatywy.'}
 ];
 function render(){const s=status();const metrics=byId('ps62Metrics'),dirs=byId('ps62Directions'),labGrid=byId('ps62LabGrid');if(!metrics||!dirs||!labGrid)return s;
  // Widok nieaktywny nie powinien wymuszać przebudowy dwóch dużych paneli.
  // Dane pobierane są aktualnie po otwarciu odpowiedniej zakładki.
  if(STATE.tab==='overview'){
    metrics.innerHTML='<div class="ps62-metric"><strong>'+s.documents+' / '+DOCS.length+'</strong><span>Zdobyte materiały w aktach</span></div><div class="ps62-metric"><strong>'+s.labDone+' / 5</strong><span>Raporty pracowni</span></div><div class="ps62-metric"><strong>'+s.pillars+' / 3</strong><span>Filary pełnego finału</span></div>';
    dirs.replaceChildren();for(const r of routes){const card=document.createElement('div');card.className='ps62-route';const content=document.createElement('div');const title=document.createElement('strong');title.textContent=r.title;const desc=document.createElement('small');desc.textContent=r.description(s);content.append(title,desc);const go=document.createElement('button');go.type='button';go.textContent='Otwórz';go.dataset.ps62Tab=r.tab;card.append(content,go);dirs.append(card);}
  }
  if(STATE.tab==='labs'){
    byId('ps62LabCount').textContent=s.labDone+' z 5 pracowni posiada zatwierdzony raport. To status działań, nie podpowiedź rozwiązania.';
    labGrid.replaceChildren();for(const r of s.laboratories){const box=document.createElement('div');box.className='ps62-lab'+(r.done?' done':'');const name=document.createElement('strong');name.textContent=r.name;const phase=document.createElement('b');phase.textContent=r.phase;const detail=document.createElement('small');detail.textContent='Źródła wejściowe: '+r.current+'/'+r.total+(r.attempts&&!r.done?' · próby raportu: '+r.attempts:'');const go=document.createElement('button');go.type='button';go.className='ps62-lab-jump';go.dataset.ps62Lab=String(r.index);go.textContent=r.done?'Przejrzyj':'Otwórz';box.append(name,phase,detail,go);labGrid.append(box);}
  }
  return s;
 }
 panel.addEventListener('click',e=>{const el=e.target.closest('[data-ps62-tab]');if(el)showTab(el.dataset.ps62Tab);});
 labPanel.addEventListener('click',e=>{const el=e.target.closest('[data-ps62-lab]');if(!el)return;const card=byId('labCards')?.querySelector('[data-open-lab="'+el.dataset.ps62Lab+'"]');if(card)card.click();});
 registerNavigationHook({name:'nonlinear-progress',after:()=>{hintStep=0;setHint();render();}});
 // Only observe the result of the existing search handler; never alter matching or acquired evidence.
 const searchBtn=byId('searchBtn'),searchResults=byId('searchResults');
 const note=document.createElement('p');note.className='ps62-search-note';note.id='ps62SearchNote';note.hidden=true;searchResults?.after(note);
 function afterSearch(){if(!searchResults)return;
  const t=searchResults.textContent||'';
  if(searchResults.querySelector('.ps602-result')||/zabezpieczono materiał|już w twoich aktach/i.test(t)){missedSearch=0;note.hidden=true;return;}
  if(/brak pasującego|nie odnaleziono|zbyt ogólne|bardziej konkretny|brak wyników/i.test(t))missedSearch++;
  if(missedSearch>=2){note.textContent='Jeśli nie znasz tytułu, opisz funkcję dokumentu albo czynność, którą rejestrował. Wybierz właściwy obszar. To wskazówka dotycząca metody poszukiwań, nie ukryte rozwiązanie.';note.hidden=false;}
 }
 // Capture is installed after existing handlers: target listener is synchronous and checks result afterward.
 if(searchBtn)searchBtn.addEventListener('click',afterSearch);
 const searchField=byId('searchQuery');if(searchField)searchField.addEventListener('keydown',e=>{if(e.key==='Enter')queueMicrotask(afterSearch);});
 // State restoration is not modified; recompute from validated module state.
 /* SaveManager: applySave hook. */
registerSaveHook({name:"23-nonlinear-progress-load1", apply(data){const r=undefined;missedSearch=0;if(note)note.hidden=true;render();return r;}});
 const oldReset=psReset;psReset=function(){const r=oldReset.apply(this,arguments);missedSearch=0;if(note)note.hidden=true;render();return r;};
 // Rendering is intentionally limited to visible relevant sections to avoid expensive reflows after each input.
 document.addEventListener('click',e=>{if(e.target.closest('[data-open-lab],#tcmsSubmit,#msgSubmit,#cvSubmit,#foSubmit,#axSubmit,#fcSubmit,#dedSave,#tlSave,#scDetail button')){
  queueMicrotask(()=>{if(STATE.tab==='labs'||STATE.tab==='overview')render();});
 }},true);
 window.PS62_BALANCE={version:'6.2',status,render,hint:(tab,n)=>extraHelp[tab]?.slice(0,n)||[],labStatus};
 setHint();render();
})();
