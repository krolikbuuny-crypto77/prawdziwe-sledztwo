/* RC57.10.56 — układ wyłącznie prezentacyjny.
 * Nie rusza identyfikatorów kart, źródeł, zapisów, przesłuchań i reguł fabularnych. */
(()=>{'use strict';
const once=()=>{
 if(document.documentElement.dataset.ps56Layout==='ready')return;
 const nav=document.getElementById('nav');
 if(!nav)return;
 document.documentElement.dataset.ps56Layout='ready';
 const labels={overview:'Pulpit',evidence:'Akta',search:'Szukaj',interview:'Przesłuchania',timeline:'Oś czasu',inspection12:'Oględziny',notebook:'Notatki',labs:'Laboratorium',deduction:'Dedukcja',final:'Finał'};
 for(const btn of nav.querySelectorAll('button[data-tab]')){
  if(btn.querySelector('.ps56-nav-label'))continue;
  const oldLabel=[...btn.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent.trim()).filter(Boolean).join(' ');
  const label=document.createElement('span');label.className='ps56-nav-label';
  label.textContent=labels[btn.dataset.tab]||oldLabel;
  btn.title=oldLabel||label.textContent;
  btn.setAttribute('aria-label',oldLabel||label.textContent);
  for(const text of [...btn.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE))text.remove();
  const icon=btn.querySelector('.ps38-nav-icon');if(icon)icon.after(label);else btn.append(label);
 }
 // Wyszukiwarka jako pierwsze zadanie, wybór obszaru jest filtrem pomocniczym.
 const search=document.getElementById('search');const areas=search?.querySelector('#areas');const searchbox=search?.querySelector('.searchbox');
 if(areas&&searchbox){
  const heading=search.querySelector('.sectionheading');
  if(heading)heading.after(searchbox);
  else areas.before(searchbox);
 }
 // Działanie jest pierwsze, raporty i tropy dopiero w drugim rzędzie Pulpitu.
 const lower=document.querySelector('#overview .ps38-lower-grid');
 const actions=document.querySelector('#overview .ps38-actions');
 if(lower&&actions&&lower.parentElement===actions.parentElement)lower.before(actions);
 // Przełączenie zakładki i przyciski "Pulpitu" pozostają obsługiwane przez istniejący kontroler.
 window.PS56_LAYOUT=Object.freeze({inspect:()=>({
  menu:[...nav.querySelectorAll('button[data-tab]')].map(btn=>({tab:btn.dataset.tab,label:btn.querySelector('.ps56-nav-label')?.textContent})),
  searchFirst:!!searchbox&&!!areas&&Boolean(searchbox.compareDocumentPosition(areas)&Node.DOCUMENT_POSITION_FOLLOWING),
  visibleThreads:[...(document.getElementById('story26Overview')?.querySelectorAll('.story26-case')||[])].length
 })});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(once),{once:true});
else requestAnimationFrame(once);
})();
