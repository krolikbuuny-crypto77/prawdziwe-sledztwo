/* RC57.10.52: grupowanie drugorzędnych narzędzi bez modyfikowania ich danych ani zdarzeń. */
(()=>{'use strict';
const makeFold=(id,label,nodes,opts={})=>{
 if(document.getElementById(id))return;
 nodes=nodes.map(s=>document.querySelector(s)).filter(Boolean);
 if(!nodes.length)return;
 const parent=nodes[0].parentNode;
 if(!nodes.every(n=>n.parentNode===parent))return;
 const fold=document.createElement('details');fold.id=id;fold.className='ps52-fold';
 fold.setAttribute('aria-label',label);
 const summary=document.createElement('summary');summary.textContent=label;
 fold.append(summary);parent.insertBefore(fold,nodes[0]);nodes.forEach(n=>fold.append(n));
 if(opts.open)fold.open=true;
};
const init=()=>{
 // Automatyczna rekonstrukcja jest dodatkiem do podstawowej osi czasu.
 makeFold('ps52AutoTimeline','Automatyczna rekonstrukcja — analizy i korelacje',['#timeline #ps41AutoTimeline']);
 // Filtry zdjęć nie są metodą odblokowywania dowodów.
 makeFold('ps52InspectionVisual','Narzędzia obrazu: kontrast, UV i latarka',['#inspection12 .et1-actions']);
 // Zaawansowane zestawienia notatnika są dostępne, ale nie wypychają pola notatek.
 makeFold('ps52NotebookAdvanced','Dodatkowe narzędzia: adnotacje, diagnostyka, pochodzenie źródeł',
   ['#notebook #ps46Annotations','#notebook #ps49Diagnostics','#notebook #ps53Provenance']);
 // Umożliwiaj skokom do ukrytych wcześniej sekcji ich otwarcie.
 document.addEventListener('click',e=>{
  const a=e.target.closest?.('a[href^="#"]');if(!a)return;
  const id=a.getAttribute('href').slice(1);if(!id)return;
  const target=document.getElementById(id);if(!target)return;
  target.closest('.ps52-fold')?.setAttribute('open','');
 },{capture:true});
 window.PS52_LAYOUT=Object.freeze({inspect:()=>({
  folds:['ps52AutoTimeline','ps52InspectionVisual','ps52NotebookAdvanced'].map(id=>({id,exists:!!document.getElementById(id)})),
  tabs:document.querySelectorAll('#nav button[data-tab]').length
 })});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(init),{once:true});else requestAnimationFrame(init);
})();
