/* RC57.10.36 · Organizacja sekcji i nawigacja po zadaniach.
   Wyłącznie prezentacja: STATE, SaveManager, silniki AI i dowody pozostają nienaruszone. */
(()=>{
'use strict';
function init(){
 const get=id=>document.getElementById(id);
 const modules=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final'];
 modules.forEach(id=>get(id)?.classList.add('ps36-polished'));
 const moveBefore=(node,anchor)=>{if(node&&anchor&&node.parentNode===anchor.parentNode&&node!==anchor)anchor.before(node);};
 const notes=get('notebook');
 if(notes){
  const editor=notes.querySelector('.sc-notebook'),confrontation=get('conflictPanel');
  const quick=get('ps88QuickNotes'),saves=get('ps88SaveManagement');
  if(editor&&confrontation){moveBefore(editor,confrontation);moveBefore(quick,confrontation);moveBefore(saves,confrontation);}
 }
 const deduction=get('deduction');
 if(deduction){
  const work=deduction.querySelector('.dd-work'),thread=get('threadBoardPanel');
  if(work&&thread)moveBefore(work,thread);
 }
 const timeline=get('timeline');
 if(timeline){
  const auto=get('ps41AutoTimeline'),metrics=get('tlMetrics'),manual=timeline.querySelector('.tl-main');
  if(auto&&manual){moveBefore(metrics,auto);moveBefore(manual,auto);}
 }
 const keySections={
  overview:[['Pierwsze kroki','#ps2Welcome'],['Przebieg sprawy','#ps70Pulse'],['Wątki','#story26Overview']],
  evidence:[['Typy materiałów','#evTypeFilters'],['Kartoteka','#docList']],
  search:[['Obszary','#areas'],['Wyszukiwanie','.searchbox']],
  timeline:[['Chronologia','.tl-main'],['Automatyczne ustalenia','#ps41AutoTimeline'],['Podsumowanie','.tl-consistency']],
  notebook:[['Moje notatki','.sc-notebook'],['Konfrontacja','#conflictPanel'],['Tablica','#ps38Board']]
 };
 for(const [tab,list] of Object.entries(keySections)){
  const sec=get(tab);if(!sec||sec.querySelector('.ps36-section-index'))continue;
  const entries=list.map(([title,sel])=>({title,node:sec.querySelector(sel)})).filter(e=>e.node);
  if(entries.length<2)continue;
  const head=sec.querySelector(':scope > .sectionheading,:scope > .ev-header,:scope > .tl-head,:scope > .dd-head');
  const index=document.createElement('nav');index.className='ps36-section-index';index.setAttribute('aria-label','Przejdź do części zakładki');
  const label=document.createElement('span');label.className='ps36-index-title';label.textContent='W tej zakładce';index.append(label);
  for(const {title,node} of entries){
   const button=document.createElement('button');button.type='button';button.textContent=title;
   button.addEventListener('click',()=>{
    if(node.hidden||getComputedStyle(node).display==='none')return;
    node.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    index.querySelectorAll('button').forEach(b=>b.removeAttribute('aria-current'));
    button.setAttribute('aria-current','true');
   });
   index.append(button);
  }
  if(head)head.after(index);else sec.prepend(index);
 }
 const levels={
  overview:['ps2Welcome','ps70Pulse','story26Overview'],
  notebook:['conflictPanel','ps38Board','ps46Annotations','ps49Diagnostics','ps53Provenance'],
  labs:['ux5Hub','ps62LabStatus'],
  deduction:['ux4Guide','threadBoardPanel','ux4Board'],
  final:['psF1Gate','ps60CaseAudit','ps601Fundamenty']
 };
 for(const [tab,ids] of Object.entries(levels)){
  const sec=get(tab);if(!sec)continue;
  ids.forEach((id,i)=>{const el=get(id);if(el&&el.parentElement===sec)el.classList.add(i<=1?'ps36-primary':'ps36-secondary');});
 }
 const report=()=>({version:'RC57.10.36',modules:modules.filter(id=>get(id)?.classList.contains('ps36-polished')),
  indices:[...document.querySelectorAll('.ps36-section-index')].map(n=>({tab:n.closest('section.section')?.id,buttons:n.querySelectorAll('button').length})),
  notebookPrimary:get('notebook')?.querySelector('.sc-notebook')?.compareDocumentPosition(get('conflictPanel')),
  deductionPrimary:get('deduction')?.querySelector('.dd-work')?.compareDocumentPosition(get('threadBoardPanel'))});
 window.PS36_LAYOUT=Object.freeze({inspect:report});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(init),{once:true});
else requestAnimationFrame(init);
})();
