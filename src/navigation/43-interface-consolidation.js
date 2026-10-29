
/* Poprawka 3: konsolidacja UI. Nie ingeruje w wymagania, akwizycję ani zapis stanu. */
(function(){
'use strict';
const by=id=>document.getElementById(id);
const details=(id,title,description)=>{
 const d=document.createElement('details');d.className='ps88-details';d.id=id;
 const summary=document.createElement('summary');summary.textContent=title;d.append(summary);
 if(description){const p=document.createElement('p');p.textContent=description;d.append(p);}
 return d;
};
// Laboratorium: jeden zestaw kart. Zachowujemy ukryte przyciski pierwotnego
// silnika (delegowane otwieranie pracowni przez ps62LabStatus).
const labs=by('labs'),labStatus=by('ps62LabStatus'),labGrid=by('ps62LabGrid'),labCards=by('labCards');
if(labs&&labStatus&&labGrid&&labCards){
 labs.classList.add('ps88-single-labs');
 const h=labStatus.querySelector('h3');if(h)h.textContent='Pracownie — wybierz analizę';
 const note=labStatus.querySelector('p');if(note)note.textContent='Sprawdź wymagane źródła, wykonaj analizę i zatwierdź raport. Kliknij Otwórz przy wybranej pracowni.';
 labGrid.setAttribute('aria-label','Pięć pracowni i ich bieżące statusy');
 labCards.setAttribute('aria-hidden','true');
 // Wywoływany przez istniejący system statusu przy wejściu do zakładki.
}
// Notatnik: jedna widoczna lista notatek, osobny rozwijany blok dawnych
// luźnych zapisków. Przyciski export/import/reset są nadal dostępne.
const notebook=by('notebook'),structured=notebook?.querySelector('.sc-notebook'),basic=notebook?.querySelector('.surface.padded:has(#notes)');
if(notebook&&structured&&basic){
 notebook.classList.add('ps88-notes-unified');
 const heading=structured.querySelector('.sc-header h3');if(heading)heading.textContent='Notatki śledcze';
 const eyebrow=structured.querySelector('.sc-header .eyebrow');if(eyebrow)eyebrow.textContent='JEDEN REJESTR OBSERWACJI';
 const secondary=details('ps88QuickNotes','Luźne zapiski','Dawne zapiski pozostają zapisane i edytowalne. Do nowych ustaleń z konkretnych oględzin używaj rejestru powyżej.');
 const actions=basic.querySelector('.formline');
 const management=details('ps88SaveManagement','Zarządzanie zapisem gry','Eksport i import postępu oraz rozpoczęcie nowego śledztwa.');
 if(actions){actions.classList.add('ps88-notepad-tools');management.append(actions);}
 basic.after(secondary,management);secondary.append(basic);
}
// Pulpit: rozbudowane alternatywne ścieżki jako opcjonalny szczegół,
// nie druga równorzędna tablica wymaganych czynności.
const orientation=by('ps62Orientation');
if(orientation){
 const extra=details('ps88MorePaths','Inne kierunki dochodzenia','Otwórz, jeśli chcesz zbadać sprawę poza aktualnymi wymaganymi ustaleniami.');
 orientation.before(extra);extra.append(orientation);orientation.classList.add('ps88-in-details');
 const unresolved=by('ps66Overview');if(unresolved)extra.append(unresolved);
}
// Finał: jedna główna kontrola; szczegółowe wskaźniki pozostają dostępne
// z jednego miejsca zamiast osobnego panelu na całej wysokości.
const final=by('final'),audit=by('ps60CaseAudit'),side=final?.querySelector('.fc-grid > .fc-side');
if(final&&audit){
 final.classList.add('ps88-final-simplified');
 const h=audit.querySelector('h3');if(h)h.textContent='Sprawdzenie argumentacji';
 const desc=audit.querySelector('.ps60-help');if(desc)desc.textContent='W jednym miejscu sprawdzisz, co potwierdzają akta i które twierdzenia wymagają dodatkowego uzasadnienia. Możesz kontynuować również z niepełnym materiałem — z konsekwencjami w finale.';
 if(side){
  const more=details('ps88FinalExtra','Szczegóły dowodów i tablicy','Dodatkowe informacje z tablicy dedukcyjnej; nie jest to osobny etap gry.');
  audit.append(more);more.append(side);
 }
 const tools=details('ps88FinalTools','Eksport bilansu','Opcjonalna kopia zestawienia. Nie jest potrzebna do ukończenia śledztwa.');
 const actions=audit.querySelector(':scope > .ps60-actions');
 if(actions){audit.append(tools);tools.append(actions);}
}
// Jeden punkt wejścia do pomocy: istniejący przycisk "Etap".
// Instrukcja kontekstowa jest nadal obsługiwana przez wcześniejszy kod.
const helpButton=by('ps603HelpBtn'),fab=by('psFab');
if(helpButton&&fab){
 const syncHelpLocation=()=>{
  const mobile=window.innerWidth<=950;
  document.body.classList.toggle('ps88-help-mobile',mobile);
  if(mobile){if(fab.parentElement!==document.body)document.body.append(fab);}
  else{const tools=by('ps76Tools');if(tools&&fab.parentElement!==tools)tools.append(fab);}
 };
 syncHelpLocation();document.addEventListener('DOMContentLoaded',syncHelpLocation,{once:true});window.addEventListener('resize',syncHelpLocation);
 fab.setAttribute('aria-label','Plan śledztwa i wskazówki');
 const old=psRender;
 psRender=function(){
  const result=old.apply(this,arguments),panel=by('psPanel');
  if(panel&&!panel.hidden&&!by('ps88ProcessButton')){
   const b=document.createElement('button');b.type='button';b.className='btn alt';b.id='ps88ProcessButton';b.textContent='Instrukcja dla aktualnej sekcji';
   b.addEventListener('click',()=>{
    if(!by('psPanel')?.hidden)fab.click();
    helpButton.click();
   });
   panel.querySelector('.ps-card')?.append(b);
  }
  return result;
 };
}
})();
