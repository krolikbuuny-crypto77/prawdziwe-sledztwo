(function(){'use strict';
/* RC57.10.39: porządkowanie DOM w warstwie prezentacji; wszystkie ID, zdarzenia i stan gry zachowane. */
(()=>{'use strict';
 const init=()=>{
  const overview=document.getElementById('overview');if(!overview)return;
  const lead=overview.querySelector('.hero .case-lead');
  if(lead&&!overview.querySelector('.ps39-read-more')){
   if(!lead.id)lead.id='ps39CaseDescription';
   const button=document.createElement('button');button.type='button';button.className='ps39-read-more';
   button.textContent='Pokaż cały opis';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',lead.id);
   lead.after(button);
   button.addEventListener('click',()=>{const expanded=!lead.classList.contains('ps39-expanded');lead.classList.toggle('ps39-expanded',expanded);button.textContent=expanded?'Zwiń opis':'Pokaż cały opis';button.setAttribute('aria-expanded',String(expanded));});
  }
  const banner=document.getElementById('psStorageUnavailable');
  if(banner&&!banner.classList.contains('ps39-save-alert')){
   banner.classList.add('ps39-save-alert');
   const details=document.createElement('details');details.className='ps39-storage-details';
   const summary=document.createElement('summary');summary.textContent='Uwaga: zapis automatyczny jest niedostępny';
   const content=document.createElement('div');content.className='ps39-storage-body';
   while(banner.firstChild)content.append(banner.firstChild);
   details.append(summary,content);banner.append(details);
  }
  const front=overview.querySelector('.ps38-front-grid');
  const lower=overview.querySelector('.ps38-lower-grid');
  const actions=overview.querySelector('.ps38-actions');
  const mobile=window.matchMedia('(max-width:700px)');
  const position=()=>{
   if(!front||!lower||!actions)return;
   if(mobile.matches){if(actions.nextElementSibling!==front)front.before(actions);}
   else if(lower.nextElementSibling!==actions)lower.after(actions);
  };
  position();mobile.addEventListener?.('change',position);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

})();
