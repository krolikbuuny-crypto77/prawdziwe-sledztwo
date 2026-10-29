
(function(){
 'use strict';
 const by=id=>document.getElementById(id);
 if(by('ux6HelpButton'))return;
 const isMobile=()=>matchMedia('(max-width:700px)').matches;
 const top= document.querySelector('.topbar'),audio=by('ps80AudioBar'),fab=by('psFab');
 if(top&&audio&&fab){
  const b=document.createElement('button');b.id='ux6HelpButton';b.className='ux6-help';b.type='button';b.textContent='?';b.setAttribute('aria-label','Postęp i wskazówki');b.setAttribute('aria-controls','psPanel');b.setAttribute('aria-expanded','false');
  b.addEventListener('click',()=>{fab.click();b.setAttribute('aria-expanded',String(!by('psPanel')?.hidden));});
  top.insertBefore(b,audio);
  const panel=by('psPanel');
  if(panel){new MutationObserver(()=>b.setAttribute('aria-expanded',String(!panel.hidden))).observe(panel,{attributes:true,attributeFilter:['hidden']});}
 }
 // Nie przenosimy żadnych istniejących przycisków. Jedynie ujawniamy dodatkowe opcje na żądanie.
 const lightbar=document.querySelector('#inspection12 .ci-toolbar');
 if(lightbar){const details=document.createElement('details');details.id='ux6Visual';details.className='ux6-visual';const summary=document.createElement('summary');summary.textContent='Ustawienia obrazu i dźwięku';lightbar.before(details);details.append(summary,lightbar);details.open=!isMobile();window.addEventListener('resize',()=>{if(!isMobile())details.open=true;});}
 // Pakiet 6.1: wprowadzenie ma już własny przycisk aktywnego kroku.
 // Nie dublujemy go dodatkowym przyciskiem o statycznym tekście.
 const ddnote=document.querySelector('#deduction .dd-note');
 if(ddnote&&!ddnote.closest('details')){const details=document.createElement('details');details.id='ux6Method';details.className='ux6-method';const summary=document.createElement('summary');summary.textContent='Zasady interpretacji dowodów';ddnote.before(details);details.append(summary,ddnote);details.open=!isMobile();window.addEventListener('resize',()=>{if(!isMobile())details.open=true;});}
 const routes={
  overview:[['Otwórz akta',()=>by('overview')?.querySelector('[data-go="evidence"]')?.click()]],
  evidence:[['Przeglądaj dokumenty','#evidence .ev-workspace']],
  search:[['Wpisz, czego szukasz','#searchQuery'],['Wybierz obszar',()=>{by('areas')?.classList.toggle('ux6-open-areas');return by('areas');}]],
  interview:[['Rozpocznij rozmowę','#interview .chat']],
  inspection12:[['Wybierz strefę','#scRooms'],['Zbadaj wybrany ślad',()=>by('scDetail')?.querySelector('.sc-empty-state')?by('scRooms'):by('scDetail')]],
  timeline:[['Ustal chronologię','#timeline .tl-main']],
  notebook:[['Dodaj obserwację','#notebook .sc-notebook']],
  labs:[['Wybierz pracownię','#ux5Hub'],['Znajdź materiały',()=>{if(typeof showTab==='function')showTab('search');return by('searchQuery');}]],
  deduction:[['Utwórz hipotezę','#ux4Guide'],['Zobacz zapisane karty','#ux4Board']],
  final:[['Sprawdź warunki','#fcProgress']]
 };
 function focusTarget(sel){return typeof sel==='string'?document.querySelector(sel):typeof sel==='function'?sel():null;}
 Object.entries(routes).forEach(([tab,acts])=>{
  const section=by(tab);if(!section)return;
  const bar=document.createElement('nav');bar.className='ux6-shortcuts';bar.setAttribute('aria-label','Szybkie działania w sekcji');
  const head=section.querySelector('.sectionheading,.dd-head,.tl-head,.ev-header');
  if(head)head.after(bar);else section.prepend(bar);
  acts.forEach(([label,route])=>{
   const btn=document.createElement('button');btn.type='button';btn.textContent=label;
   btn.addEventListener('click',()=>{
    const target=focusTarget(route);if(!target)return;
    if(target.nodeType!==1)return;
    if(target.id==='searchQuery'||target.tagName==='INPUT'){target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});try{target.focus({preventScroll:true});}catch(_){}return;}
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
   });bar.appendChild(btn);
  });
 });
 // Na telefonie start musi otwierać się na najważniejszym przycisku; pełna fabuła pozostaje w dalszym ciągu strony.
 window.UX6_MOBILE={helpButton:()=>by('ux6HelpButton'),visual:()=>by('ux6Visual'),method:()=>by('ux6Method')};
})();
