/* RC57.10.38 — układ wizualny zaakceptowanej koncepcji, bez modyfikowania stanu gry. */
(()=>{
 'use strict';
 function init(){
  const overview=document.getElementById('overview');
  if(!overview||overview.classList.contains('ps38-premium'))return;
  overview.classList.add('ps38-premium');
  const find=sel=>overview.querySelector(sel);
  const hero=find('.hero'),welcome=find('#ps2Welcome'),pulse=find('#ps70Pulse'),threads=find('#story26Overview'),more=find('#ps88MorePaths');
  if(hero&&welcome){
   const front=document.createElement('div');front.className='ps38-front-grid';
   hero.parentElement.insertBefore(front,hero);front.append(hero,welcome);
  }
  if(pulse&&threads){
   const lower=document.createElement('div');lower.className='ps38-lower-grid';
   const left=document.createElement('div');left.className='ps38-progress-stack';
   pulse.parentElement.insertBefore(lower,pulse);lower.append(left,threads);left.append(pulse);
   if(more)left.append(more);
  }
  const banner=document.createElement('header');banner.className='ps38-case-banner';
  banner.innerHTML='<span class="ps38-banner-kicker">PULPIT ŚLEDCZY · AKTA SPRAWY</span><h2>Stan sprawy</h2><p>Przeglądaj ustalenia, śledź wątki i planuj kolejne czynności.</p>';
  const sectionIndex=find('.ps36-section-index');
  if(sectionIndex)sectionIndex.insertAdjacentElement('afterend',banner);
  else overview.insertBefore(banner,overview.firstChild);
  const tasks=document.createElement('nav');tasks.className='ps38-actions';tasks.setAttribute('aria-label','Skróty do czynności śledczych');
  tasks.innerHTML='<div class="ps38-actions-heading"><span class="ps38-motif" aria-hidden="true">✧</span><strong>NAJBLIŻSZE DZIAŁANIA</strong></div><div class="ps38-actions-list">'+[
   ['evidence','▤','Przejrzyj akta','Dostępne dokumenty'],
   ['inspection12','◉','Oględziny','Zbadaj miejsce zdarzenia'],
   ['notebook','✎','Notatnik','Zapisz swoje ustalenia'],
   ['deduction','◇','Dedukcja','Połącz fakty i hipotezy']
  ].map(([id,icon,title,desc])=>'<button type="button" data-ps38-go="'+id+'"><span aria-hidden="true">'+icon+'</span><b>'+title+'</b><small>'+desc+'</small></button>').join('')+'</div>';
  const after=find('.ps38-lower-grid')||find('.ps38-front-grid');
  if(after)after.insertAdjacentElement('afterend',tasks);
  tasks.addEventListener('click',ev=>{
   const id=ev.target.closest('[data-ps38-go]')?.getAttribute('data-ps38-go');
   if(!id||typeof showTab!=='function')return;
   showTab(id);
  });
  const sidebar=document.getElementById('ui14Sidebar');
  if(sidebar){
   const nav=sidebar.querySelector('#nav');
   const icons={overview:'⌂',evidence:'▤',search:'⌕',interview:'☷',timeline:'◷',inspection12:'◉',notebook:'✎',labs:'⚗',deduction:'◇',final:'⚑'};
   nav?.querySelectorAll('button[data-tab]').forEach(btn=>{
    if(btn.querySelector('.ps38-nav-icon'))return;
    const icon=document.createElement('span');icon.className='ps38-nav-icon';icon.setAttribute('aria-hidden','true');icon.textContent=icons[btn.dataset.tab]||'◆';
    const number=btn.querySelector('.num');
    if(number)number.after(icon);else btn.prepend(icon);
   });
   if(!sidebar.querySelector('.ps38-sidebar-art')){
    const art=document.createElement('div');art.className='ps38-sidebar-art';art.setAttribute('aria-hidden','true');
    const tools=document.getElementById('ps76Tools');
    if(tools?.parentElement===sidebar)tools.before(art);else sidebar.append(art);
   }
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
