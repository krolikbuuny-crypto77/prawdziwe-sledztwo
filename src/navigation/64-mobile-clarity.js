/* Pakiet 6.1 — uproszczenie dostępu do modułów i drugorzędnych skrótów.
   Warstwa prezentacji: nie modyfikuje STATE, zapisów, dowodów ani warunków sprawy. */
(()=>{'use strict';
 const init=()=>{
 const mobile=window.matchMedia('(max-width: 1000px)');
 const bar=document.querySelector('.sv2-mobile-nav');
 if(!bar)return;
 const buttons=Array.from(bar.querySelectorAll('[data-sv2-tab]'));
 const menu=document.createElement('div');
 menu.id='ps61Navigation';menu.className='ps61-navigation';
 menu.setAttribute('role','group');menu.setAttribute('aria-label','Bieżący moduł i nawigacja');
 const current=document.createElement('div');current.className='ps61-current';
 const eyebrow=document.createElement('span');eyebrow.textContent='AKTUALNY MODUŁ';
 const title=document.createElement('strong');title.id='ps61CurrentModule';
 current.append(eyebrow,title);
 const trigger=document.createElement('button');trigger.type='button';trigger.className='ps61-menu-button';
 trigger.id='ps61MenuButton';trigger.setAttribute('aria-controls','ps61ModuleMenu');
 trigger.setAttribute('aria-expanded','false');trigger.textContent='Moduły (10)';
 menu.append(current,trigger);bar.before(menu);
 bar.id='ps61ModuleMenu';
 const labelFor=id=>buttons.find(button=>button.dataset.sv2Tab===id)?.getAttribute('aria-label') || id;
 let opened=false;
 const selected=()=>window.STATE?.tab||document.querySelector('.section.active')?.id||'overview';
 function sync(){title.textContent=labelFor(selected());}
 function setOpen(next,{restoreFocus=false}={}){
  opened=Boolean(next)&&mobile.matches;
  menu.classList.toggle('ps61-open',opened);
  bar.classList.toggle('ps61-open',opened);
  trigger.setAttribute('aria-expanded',String(opened));
  bar.setAttribute('aria-hidden',String(mobile.matches&&!opened));
  bar.inert=mobile.matches&&!opened;
  if(restoreFocus)trigger.focus({preventScroll:true});
 }
 trigger.addEventListener('click',()=>setOpen(!opened));
 bar.addEventListener('click',event=>{
  if(!event.target.closest('[data-sv2-tab]'))return;
  setOpen(false);sync();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&opened){event.preventDefault();setOpen(false,{restoreFocus:true});}
 });
 document.addEventListener('pointerdown',event=>{
  if(opened&&!menu.contains(event.target)&&!bar.contains(event.target))setOpen(false);
 });
 function viewport(){if(!mobile.matches)setOpen(false);else setOpen(opened);sync();}
 mobile.addEventListener?.('change',viewport);
 if(typeof registerNavigationHook==='function')registerNavigationHook({name:'package61-navigation-clarity',after:()=>{sync();setOpen(false);}});
 viewport();
 // Optional in-section shortcuts: keep existing buttons, but reduce competing actions.
 // Details stays open on desktop; on mobile it starts collapsed and is never saved.
 const containers=[];
 for(const section of document.querySelectorAll('.section')){
  const shortcuts=section.querySelector(':scope .sv2-subnav');
  if(!shortcuts||shortcuts.querySelectorAll('button').length===0)continue;
  const wrap=document.createElement('details');wrap.className='ps61-secondary-shortcuts';
  const summary=document.createElement('summary');summary.textContent='Skróty do części modułu';
  shortcuts.before(wrap);wrap.append(summary,shortcuts);containers.push(wrap);
 }
 const syncDetails=()=>{for(const el of containers)if(!mobile.matches)el.open=true;};
 mobile.addEventListener?.('change',syncDetails);syncDetails();
 // Existing assistance button is the only global entry point on handheld devices.
 // Improving its accessible name does not create a second help workflow.
 const help=document.getElementById('ux6HelpButton');
 if(help){help.setAttribute('aria-label','Otwórz plan śledztwa i wskazówki');help.title='Plan śledztwa i wskazówki';}
 window.PS_UX61={inspect:()=>({current:selected(),menuOpen:opened,secondarySections:containers.length}),openMenu:()=>setOpen(true),closeMenu:()=>setOpen(false)};
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
