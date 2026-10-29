/* Studio V2 navigation + progressive document browsing. Does not mutate gameplay facts. */
(()=>{'use strict';
 const init=()=>{
 if(document.querySelector('.sv2-mobile-nav'))return;
 const modules=[
 ['overview','Pulpit','Rozpocznij lub kontynuuj sprawę'],['evidence','Akta','Czytaj zdobyte materiały'],
 ['search','Poszukiwania','Przeszukuj rejestry i archiwa'],['interview','Przesłuchania','Rozmawiaj ze świadkami'],
 ['timeline','Oś czasu','Weryfikuj chronologię'],['inspection12','Oględziny','Badaj strefy zajezdni'],
 ['notebook','Notatnik','Twoje zapiski i odkrycia'],['labs','Laboratorium','Pięć pracowni analitycznych'],
 ['deduction','Dedukcja','Buduj i sprawdzaj hipotezy'],['final','Finał','Akt oskarżenia i obrona']];
 const find=id=>document.getElementById(id);
 const current=()=>document.querySelector('#nav button.active')?.dataset.tab||document.querySelector('.section.active')?.id||'overview';
 const go=id=>showTab(id);
 const header=document.querySelector('.topbar');if(!header)return;
 const nav=document.createElement('nav');nav.className='sv2-mobile-nav';nav.setAttribute('aria-label','Sekcje śledztwa');
 const compactNavigationLabels={overview:'Pulpit',evidence:'Akta',search:'Szukaj',interview:'Świadkowie',timeline:'Oś czasu',inspection12:'Oględziny',notebook:'Notatki',labs:'Analizy',deduction:'Dedukcja',final:'Finał'};
 for(const m of modules){const b=document.createElement('button');b.type='button';b.dataset.sv2Tab=m[0];b.textContent=compactNavigationLabels[m[0]]||m[1];b.setAttribute('aria-label',m[1]);b.title=m[1];b.addEventListener('click',()=>go(m[0]));nav.append(b)}
 header.after(nav);
 function sync(){const tab=current();nav.querySelectorAll('button').forEach(b=>{const active=b.dataset.sv2Tab===tab;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
 registerNavigationHook({name:'studio-mobile-navigation',after:sync});sync();
 // Compact navigational landmarks inside long sections.
 const anchors={interview:[['Świadkowie','#characterList'],['Rozmowa','#chatLog'],['Pytanie','#chatInput']],inspection12:[['Strefy','#scRooms'],['Badaj','#scDetail'],['Zdjęcia','#et1Photos']],labs:[['Pracownie','#labCards'],['Raporty','#cross3Panel']],deduction:[['Źródła','#dedSourceList'],['Hipoteza','#ddCardForm'],['Tablica','#dedBoard']]};
 for(const [tab,targets] of Object.entries(anchors)){const sec=find(tab);if(!sec)continue;const bar=document.createElement('div');bar.className='sv2-subnav';bar.setAttribute('aria-label','Skróty w sekcji');const title=document.createElement('span');title.className='sv2-subnav-label';title.textContent='W TYM MODULE';bar.append(title);
 for(const [name,target] of targets){const el=sec.querySelector(target);if(!el)continue;const b=document.createElement('button');b.type='button';b.textContent=name;b.addEventListener('click',()=>{el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});if(el.matches('input,textarea'))el.focus({preventScroll:true})});bar.append(b)}
 const h=sec.querySelector(':scope > .sectionheading,:scope > .dd-head');if(h&&bar.childElementCount>1)h.after(bar)}
 // All documents still searched/filtered by the original system; this only limits rendered list length.
 const docs=find('docList');if(docs){let cap=20,all=false,frame=0;const foot=document.createElement('div');foot.className='sv2-doc-pager';foot.id='sv2DocPager';const label=document.createElement('span');const more=document.createElement('button');more.type='button';more.textContent='Pokaż 20 kolejnych';const showAll=document.createElement('button');showAll.type='button';showAll.textContent='Pokaż wszystkie';foot.append(label,more,showAll);docs.after(foot);
 const update=()=>{frame=0;const rows=[...docs.children].filter(el=>el.matches('.ev-file'));const chosen=rows.findIndex(el=>el.classList.contains('selected'));if(chosen>=cap)cap=Math.ceil((chosen+1)/20)*20;let visible=all?rows.length:Math.min(rows.length,cap);rows.forEach((el,i)=>el.classList.toggle('sv2-file-hidden',i>=visible));foot.hidden=rows.length<=20||visible>=rows.length;label.textContent=visible+' z '+rows.length+' materiałów';more.hidden=visible>=rows.length;showAll.hidden=visible>=rows.length};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};more.addEventListener('click',()=>{cap+=20;schedule()});showAll.addEventListener('click',()=>{all=true;schedule()});
 for(const id of ['filterDocs','filterCategory']){const el=find(id);el?.addEventListener(id==='filterDocs'?'input':'change',()=>{cap=20;all=false;schedule()})}
 new MutationObserver(schedule).observe(docs,{childList:true});schedule()}
 // First-run guidance shows the active task on narrow screens. The player can expand all three.
 const welcome=find('ps2Welcome');if(welcome){const steps=welcome.querySelector('.ps2-steps');if(steps){const expand=document.createElement('button');expand.type='button';expand.className='sv2-expand-steps';expand.textContent='Zobacz wszystkie 3 kroki';expand.setAttribute('aria-expanded','false');steps.before(expand);expand.addEventListener('click',()=>{const open=welcome.classList.toggle('sv2-show-steps');expand.textContent=open?'Zwiń plan wprowadzenia':'Zobacz wszystkie 3 kroki';expand.setAttribute('aria-expanded',String(open))})}}
 // Mobile document list/preview switch; never changes selected document or evidence state.
 const evidence=find('evidence'),work=evidence?.querySelector('.ev-workspace');
 if(evidence&&work){const switcher=document.createElement('div');switcher.className='sv2-doc-switch';switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Widok akt');const listBtn=document.createElement('button');const previewBtn=document.createElement('button');listBtn.type='button';previewBtn.type='button';listBtn.textContent='Lista dokumentów';previewBtn.textContent='Podgląd dokumentu';switcher.append(listBtn,previewBtn);work.before(switcher);
 const setView=view=>{evidence.classList.toggle('sv2-doc-view-list',view==='list');evidence.classList.toggle('sv2-doc-view-preview',view==='preview');listBtn.classList.toggle('active',view==='list');previewBtn.classList.toggle('active',view==='preview');listBtn.setAttribute('aria-pressed',String(view==='list'));previewBtn.setAttribute('aria-pressed',String(view==='preview'))};setView('list');listBtn.addEventListener('click',()=>setView('list'));previewBtn.addEventListener('click',()=>setView('preview'));
 find('docList')?.addEventListener('click',e=>{if(e.target.closest('.ev-file')&&matchMedia('(max-width:690px)').matches){setView('preview');switcher.scrollIntoView({block:'start',behavior:'smooth'})}});
 evidence.querySelectorAll('.ev-reader button').forEach(btn=>{if(/spis dokumentów/i.test(btn.textContent))btn.addEventListener('click',()=>setView('list'))})}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
