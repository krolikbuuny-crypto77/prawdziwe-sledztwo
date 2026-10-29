
(function(){
 'use strict';
 const by=id=>document.getElementById(id);
 const mobile=()=>matchMedia('(max-width:700px)').matches;
 const root=by('inspection12'),fin=by('final');
 // Naprawa przycisku kierującego wcześniej do ukrytego #fcProgress.
 const buttons=[...fin?.querySelectorAll('.ux6-shortcuts button')||[]];
 const shortcut=buttons.find(b=>b.textContent.includes('Sprawdź warunki'));
 if(shortcut){
  const fresh=shortcut.cloneNode(true);shortcut.replaceWith(fresh);
  function phase(){return window.PS_FINALE_STAGES?.status?.().phase??0;}
  function visible(el){return !!el&&!el.closest('[data-ps-f1-hidden="1"]')&&getComputedStyle(el).display!=='none'&&el.getClientRects().length>0;}
  function refresh(){const p=phase();fresh.textContent=['Sprawdź warunki','Otwórz akt oskarżenia','Przejdź do konfrontacji','Zobacz rozstrzygnięcie'][Math.min(3,p)];}
  fresh.addEventListener('click',()=>{
    const p=phase();
    const candidates=p===0?['psF1Gate']:p===1?['fcProgress','.fc-grid']:p===2?['fcDefense','simHearing','psF1Gate']:['#simHearingDetail .sim-trial-result','simHearing','psF1Gate'];
    const target=candidates.map(x=>x.startsWith('.')||x.startsWith('#')?fin.querySelector(x):by(x)).find(visible)||by('psF1Gate');
    target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
    if(target&&target!==by('psF1Gate')){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
  });
  if(fin){new MutationObserver(refresh).observe(fin,{attributes:true,attributeFilter:['data-ps-f1-phase']});}
  refresh();
 }
 if(!root||!by('scRooms')||!by('scDetail'))return;
 // Zachowujemy wszystkie istniejące elementy (wraz z ID i listenerami),
 // lecz przenosimy informacje drugorzędne do szczegółów na małym ekranie.
 const compact=[];
 function wrap(el,id,label){if(!el||by(id))return;
  const details=document.createElement('details');details.id=id;details.className='p1-inspection-extras';
  const sum=document.createElement('summary');sum.textContent=label;
  el.before(details);details.append(sum,el);compact.push(details);
 }
 wrap(by('scMetrics'),'p1Stats','Postęp i statystyki oględzin');
 wrap(by('sc84RoomSummary'),'p1Orientation','Szczegóły wybranej strefy');
 wrap(by('sc84Recent'),'p1Recent','Ostatnio oglądane ślady');
 wrap(by('scRoomCase'),'p1RoomCase','Rekonstrukcja i opis strefy');
 const journal=by('scActivity')?.closest('.surface.padded');
 wrap(journal,'p1Journal','Dziennik czynności oględzin');
 function resize(){for(const el of compact){if(!mobile())el.open=true;else if(!el.dataset.p1Touched)el.open=false;}}
 for(const el of compact)el.addEventListener('toggle',()=>{if(mobile()&&el.open)el.dataset.p1Touched='1';});
 window.addEventListener('resize',resize,{passive:true});resize();
 const roomBox=by('scRooms').closest('.surface');
 const card=document.createElement('div');card.id='p1InspectionNow';card.setAttribute('aria-label','Bieżący etap oględzin');card.innerHTML='<div class="p1-stage">BIEŻĄCE BADANIE</div><label class="p1-room-label">Wybierz strefę oględzin<select id="p1RoomSelect" aria-label="Wybierz strefę oględzin"></select></label><div class="p1-active" id="p1Active">Wybierz punkt oględzin</div><div class="p1-steps" id="p1Steps"></div><div class="p1-actions"><button id="p1Go" type="button">Otwórz punkt badania</button></div><div class="p1-sub" id="p1Tip">Metoda → Ocena → Zabezpieczenie. Dowód trafi do akt dopiero po osobnym zabezpieczeniu.</div>';
 const actionBar=root.querySelector('.ux6-shortcuts')||root.querySelector('.sectionheading');
 if(actionBar)actionBar.after(card);else roomBox.after(card);
 const roomSelect=by('p1RoomSelect');
 if(typeof SC_ROOMS!=='undefined')for(const room of SC_ROOMS){const option=document.createElement('option');option.value=room.id;option.textContent=room.title;roomSelect.append(option);}
 roomSelect.addEventListener('change',()=>{if(typeof scPickRoom==='function')scPickRoom(roomSelect.value);});
 const go=by('p1Go'),a=by('p1Active'),st=by('p1Steps'),tip=by('p1Tip');
 function paint(){
  if(typeof STATE==='undefined'||typeof SC_BY_SPOT==='undefined')return;
  const s=STATE.scene12||{},spot=SC_BY_SPOT[s.selected],c=spot&&SC_CHALLENGES[spot.id];
  if(roomSelect&&s.room&&roomSelect.value!==s.room)roomSelect.value=s.room;
  const known=!!spot,done=known&&(s.inspected||[]).includes(spot.id),inActs=done&&spot.doc&&STATE.found.has(spot.doc);
  const step= !known?0:done?(spot.doc&&!inActs?3:4):s.steps?.[spot.id]?.method===c?.method?2:1;
  const labels=spot?.doc?['Metoda','Ocena','Zabezpieczenie']:['Metoda','Ocena'];
  a.textContent=known?spot.title:'Wybierz strefę i odkryj pierwszy punkt';
  st.replaceChildren();for(let i=0;i<labels.length;i++){const b=document.createElement('span');b.textContent=(i+1)+'. '+labels[i];if((step===1&&i===0)||(step===2&&i===1)||(step===3&&i===2))b.setAttribute('aria-current','step');st.append(b);}
  if(step===0){go.textContent='Otwórz zdjęcie i punkty';tip.textContent='Odkryj punkt na fotografii albo wybierz go z listy strefy.';}
  else if(step===1){go.textContent='Dobierz metodę';tip.textContent='Zbadaj wybrany punkt. Metoda musi pasować do obserwacji.';}
  else if(step===2){go.textContent='Oceń obserwację';tip.textContent='Wybierz prawidłową interpretację — nie wystarczy samo odkrycie śladu.';}
  else if(step===3){go.textContent=by('scSecure')?'Zabezpiecz do akt':'Sprawdź wymagania zabezpieczenia';tip.textContent='Badanie jest zakończone, ale materiał jeszcze nie trafił do akt.';}
  else{go.textContent='Zobacz wynik badania';tip.textContent='Ten punkt został zbadany. Możesz przejść do kolejnego.';}
  card.dataset.stage=String(step);
 }
 go.addEventListener('click',()=>{
  // Przycisk „Zabezpiecz do akt” wykonuje czynność dopiero po świadomym naciśnięciu przez gracza.
  if(card.dataset.stage==='3'&&by('scSecure')){by('scSecure').click();return;}
  const target=card.dataset.stage==='0'?by('et1Photos'):by('scDetail');
  if(target){
   // Natychmiastowy skok na telefonie; płynne przewijanie kilku tysięcy px opóźniało dotarcie do przycisku.
   const top=Math.max(0,target.getBoundingClientRect().top+window.scrollY-80);
   const previous=document.documentElement.style.scrollBehavior;
   document.documentElement.style.scrollBehavior='auto';
   window.scrollTo({top,behavior:'instant'});
   document.documentElement.style.scrollBehavior=previous;
  }
  const current=card.dataset.stage==='3'?by('scSecure'):null;
  if(current){current.focus({preventScroll:true});return;}
  const other=target?.querySelector('.sc-method:not(:disabled),.sc-answer:not(:disabled),.sc6-main-action:not(:disabled)');
  if(other)other.focus({preventScroll:true});
 });
 let queued=false;const update=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;paint();});};
 new MutationObserver(update).observe(by('scDetail'),{childList:true,subtree:false});
 new MutationObserver(update).observe(by('scRoomTitle'),{childList:true});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-sc-room],[data-sc-spot],[data-ps3-id]'))update();});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="inspection12"],[data-go="inspection12"]'))update();});
 paint();window.PS_P1_UX={inspection:paint,final:()=>shortcut?.textContent};
})();
