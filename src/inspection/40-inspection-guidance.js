
(function(){
  if(typeof window==='undefined') return;
  function ensure(){
    if(typeof STATE==='undefined'||!STATE.scene12) return null;
    const s=STATE.scene12;
    if(!Array.isArray(s.recent)) s.recent=[];
    if(typeof s.pendingOnly!=='boolean') s.pendingOnly=false;
    if(typeof s.compareA!=='string'||!s.inspected.includes(s.compareA)) s.compareA='';
    if(typeof s.compareB!=='string'||!s.inspected.includes(s.compareB)) s.compareB='';
    return s;
  }
  function roomById(id){return SC_ROOMS.find(r=>r.id===id);}
  function spotsForRoom(id){return SC_SPOTS.filter(h=>h.room===id);}
  function visibleForRoom(id){const s=ensure(); return spotsForRoom(id).filter(h=>s&&s.discovered.includes(h.id));}
  function inspectedSet(){const s=ensure(); return new Set((s&&s.inspected)||[]);}
  function pushRecent(id){const s=ensure(); if(!s||!id||!SC_BY_SPOT[id]) return; s.recent=[id,...s.recent.filter(x=>x!==id)].slice(0,8);}
  function statusText(h){const s=ensure(); if(!s) return ''; if(s.inspected.includes(h.id)){return h.doc?(STATE.found.has(h.doc)?'Zbadano · w aktach':scAccess(h).ready?'Zbadano · czeka na zabezpieczenie':'Zbadano · czeka na źródła'):'Zbadano · obserwacja';} return s.steps[h.id]?.method?'Trwa analiza':'Odkryto · wymaga badania';}
  function decoratePins(){
    const s=ensure(); if(!s) return;
    const room=s.room; const visible=visibleForRoom(room); const unresolved=visible.filter(h=>!s.inspected.includes(h.id));
    document.querySelectorAll('#scPins .sc-pin,#et1ScenePins .et1-pin,#et1ScenePins [data-sc-spot]').forEach(el=>el.classList.remove('sc84-priority'));
    unresolved.slice(0,3).forEach(h=>{
      document.querySelectorAll('[data-sc-spot="'+h.id+'"]').forEach(el=>el.classList.add('sc84-priority'));
    });
  }
  function renderSummary(){
    const s=ensure(); if(!s||typeof $!=='function') return;
    const room=roomById(s.room)||SC_ROOMS[0];
    const spots=spotsForRoom(room.id);
    const visible=visibleForRoom(room.id);
    const inspected=visible.filter(h=>s.inspected.includes(h.id));
    const unresolved=visible.filter(h=>!s.inspected.includes(h.id));
    const notFound=spots.length-visible.length;
    const roomDocs=spots.filter(h=>h.doc&&STATE.found.has(h.doc)).length;
    const recommendation = unresolved[0] ? ('W tej strefie najszybciej domkniesz postęp, jeśli sprawdzisz teraz: '+unresolved[0].title+'.') : (notFound>0 ? 'Przejrzyj kolejne kadry dokumentacji 4K i odszukaj następny punkt w tej strefie.' : 'Ta strefa jest przebadana. Możesz przejść do rekonstrukcji strefy albo zmienić pomieszczenie.');
    const summary=$('sc84RoomSummary');
    if(summary) summary.innerHTML=`<div class="eyebrow">ORIENTACJA W STREFIE</div><h4>${esc(room.title)}</h4><p>${esc(recommendation)}</p><div class="sc84-inline-stats"><div><b>${visible.length}/${spots.length}</b><span>odkrytych punktów</span></div><div><b>${inspected.length}</b><span>zbadanych w tej strefie</span></div><div><b>${unresolved.length}</b><span>czeka na badanie</span></div><div><b>${roomDocs}</b><span>materiałów w aktach</span></div></div>`;
    const toggle=$('sc84TogglePending'); if(toggle){ toggle.classList.toggle('active',!!s.pendingOnly); toggle.setAttribute('aria-pressed',String(!!s.pendingOnly)); }
    const count=$('sc84ToggleCount'); if(count) count.textContent=String(unresolved.length);
    const queue=$('sc84Queue');
    if(queue){
      const queueItems = unresolved.length? unresolved.slice(0,4).map((h,i)=>`<button type="button" class="sc84-queue-item ${s.selected===h.id?'active':''}" data-sc84-spot="${h.id}"><span>${i+1}</span><div><b>${esc(h.title)}</b><small>${esc(statusText(h))}</small></div></button>`).join('') : '<div class="sc84-empty">Nie ma odkrytych, niezbadanych punktów w tej strefie. Jeśli licznik nie jest pełny, przejrzyj jeszcze inne kadry.</div>';
      queue.innerHTML=`<div class="eyebrow">KOLEJKA PRACY</div><h4>Co warto sprawdzić teraz</h4><div class="sc84-queue-list">${queueItems}</div>`;
      queue.querySelectorAll('[data-sc84-spot]').forEach(btn=>btn.addEventListener('click',()=>scPick(btn.dataset.sc84Spot)));
    }
    const rec=$('sc84Recent');
    if(rec){
      const recent=(s.recent||[]).map(id=>SC_BY_SPOT[id]).filter(Boolean).slice(0,4);
      rec.innerHTML=`<div class="eyebrow">ŚLADY OSTATNIO OGLĄDANE</div><h4>Szybki powrót</h4><div class="sc84-recent-list">${recent.length?recent.map(h=>`<button type="button" class="sc84-recent-item" data-sc84-spot="${h.id}"><div><strong>${esc(h.title)}</strong><small>${esc(roomById(h.room)?.title||'')}</small></div><span class="sc84-label">${STATE.found.has(h.doc)?'w aktach':(s.inspected.includes(h.id)?'zbadano':'otwarte')}</span></button>`).join(''):'<div class="sc84-empty">Lista zapełni się automatycznie, gdy zaczniesz przechodzić między śladami.</div>'}</div>`;
      rec.querySelectorAll('[data-sc84-spot]').forEach(btn=>btn.addEventListener('click',()=>jumpTo(btn.dataset.sc84Spot)));
    }
  }

  // Porównanie wyłącznie zbadanych punktów: bez nowych danych i bez przyznawania postępu.
  function renderCompare(){
    const s=ensure(),panel=$('sc84Compare');
    if(!s||!panel) return;
    const ready=s.inspected.map(id=>SC_BY_SPOT[id]).filter(Boolean);
    if(!s.compareA&&ready[0])s.compareA=ready[0].id;
    if(!s.compareB&&ready[1])s.compareB=ready[1].id;
    const options='<option value="">Wybierz zbadany ślad</option>'+ready.map(h=>'<option value="'+esc(h.id)+'">'+esc((roomById(h.room)?.title||'')+' — '+h.title)+'</option>').join('');
    const card=(id,side)=>{
      const h=SC_BY_SPOT[id];
      if(!h||!s.inspected.includes(id))return '<div class="sc84-empty">Wybierz materiał, który został już zbadany.</div>';
      return '<div class="sc84-compare-card"><span class="eyebrow">ŚLAD '+side+'</span><h5>'+esc(h.title)+'</h5><small>'+esc(roomById(h.room)?.title||'')+'</small><p><b>Obserwacja:</b> '+esc(h.look)+'</p><p><b>Granice wnioskowania:</b> '+esc(h.obs)+'</p><span class="sc84-label">'+(h.doc&&STATE.found.has(h.doc)?'Materiał w aktach':'Badanie odnotowane')+'</span><button class="btn alt" type="button" data-sc84-open="'+esc(h.id)+'">Przejdź do śladu</button></div>';
    };
    panel.innerHTML='<div class="sc84-compare-top"><div><div class="eyebrow">PORÓWNANIE OGLĘDZIN</div><h4>Zestaw dwa zbadane ślady</h4><p>Porównuj obserwacje i ich ograniczenia. Samo zestawienie nie jest nowym dowodem.</p></div><span class="chip">'+ready.length+' zbadanych</span></div>'+
      '<div class="sc84-compare-selectors"><label>Ślad A<select id="sc84CompA">'+options+'</select></label><label>Ślad B<select id="sc84CompB">'+options+'</select></label></div>'+
      '<div class="sc84-compare-grid">'+card(s.compareA,'A')+card(s.compareB,'B')+'</div>';
    $('sc84CompA').value=s.compareA||''; $('sc84CompB').value=s.compareB||'';
    $('sc84CompA').addEventListener('change',e=>{s.compareA=e.target.value;renderCompare();});
    $('sc84CompB').addEventListener('change',e=>{s.compareB=e.target.value;renderCompare();});
    panel.querySelectorAll('[data-sc84-open]').forEach(b=>b.addEventListener('click',()=>jumpTo(b.dataset.sc84Open)));
  }

  function renderFocus(){
    const s=ensure(); if(!s||typeof $!=='function') return;
    const box=$('sc84Focus'); if(!box) return;
    const h=SC_BY_SPOT[s.selected];
    if(!h){
      box.innerHTML=`<div class="eyebrow">PUNKT OGLĘDZIN</div><h4>Brak wybranego obiektu</h4><div class="sc84-empty">Kliknij punkt na zdjęciu albo wybierz go z listy, aby od razu zobaczyć, czy jest odkryty, czy zbadany i co warto zrobić dalej.</div>`;
      return;
    }
    const inspected=!!s.inspected.includes(h.id);
    const found=!!(h.doc&&STATE.found.has(h.doc));
    const challenge=SC_CHALLENGES[h.id];
    const step=s.steps[h.id]||{};
    const stage=inspected ? 'badanie zakończone' : step.method===challenge?.method ? 'czeka na ocenę ustalenia' : 'czeka na dobór metody';
    const advice= inspected ? (found ? 'Powiązany materiał jest już w aktach. Możesz wykorzystać go dalej albo zapisać własne spostrzeżenie.' : h.doc?'Badanie jest zakończone, ale materiał nie trafił jeszcze do akt. Otwórz kartę punktu i sprawdź etap zabezpieczenia.':'Badanie zakończone. To obserwacja analityczna bez osobnego dokumentu.') : (step.method ? 'Wybrano metodę — teraz oceń wniosek i oddziel obserwację od przypuszczenia.' : 'Najpierw dobierz metodę najlepiej pasującą do tego typu śladu.');
    box.innerHTML=`<div class="eyebrow">PUNKT OGLĘDZIN</div><h4>Fokus badania</h4><div class="sc84-focus-grid"><div class="sc84-focus-copy"><b>${esc(h.title)}</b><p>${esc(advice)}</p><div class="sc84-focus-badges"><span class="sc84-badge ${inspected?'good':'warn'}">${inspected?'Zbadano':'Do zbadania'}</span><span class="sc84-badge ${found?'good':'warn'}">${found?'Materiał w aktach':(h.doc?'Wymaga zabezpieczenia':'Obserwacja analityczna')}</span><span class="sc84-badge">${esc(stage)}</span></div></div><div class="sc84-focus-actions"><button class="btn alt" type="button" id="sc84OpenCurrentRoom">Wróć do listy strefy</button><button class="btn subtle" type="button" id="sc84GoNotebook">Dodaj notatkę</button></div></div>`;
    $('sc84OpenCurrentRoom')?.addEventListener('click',()=>{document.getElementById('scHotspots')?.scrollIntoView({behavior:'smooth',block:'start'});});
    $('sc84GoNotebook')?.addEventListener('click',()=>showTab('notebook'));
  }
  function renderHotspotsEnhanced(){
    const s=ensure(); if(!s||typeof $!=='function') return;
    const room=roomById(s.room)||SC_ROOMS[0];
    const visible=visibleForRoom(room.id);
    const unresolved=visible.filter(h=>!s.inspected.includes(h.id));
    const resolved=visible.filter(h=>s.inspected.includes(h.id));
    const list=s.pendingOnly ? unresolved : [...unresolved,...resolved];
    const box=$('scHotspots'); if(!box) return;
    box.innerHTML='<div class="ov3-results-heading">Odkryte obiekty: '+visible.length+' / '+spotsForRoom(room.id).length+'</div>' + (s.pendingOnly?'<div class="sc84-sorted-note">Widok pokazuje tylko punkty, które nadal wymagają badania.</div>':'<div class="sc84-sorted-note">Na górze listy znajdują się punkty niezbadane, niżej już przeanalizowane.</div>') + (list.length?list.map((h,i)=>`<button type="button" class="sc-spot ${s.selected===h.id?'active':''} ${s.inspected.includes(h.id)?'done':''} ${!s.inspected.includes(h.id)?'sc84-priority':''}" data-sc-spot="${h.id}"><span class="sc-num">${s.inspected.includes(h.id)?'✓':i+1}</span><span class="sc-label"><b>${esc(h.title)}</b><small>${esc(statusText(h))}</small></span></button>`).join(''):'<p class="ov3-unfound">W tej chwili nie ma tu punktów spełniających wybrany filtr. Wyłącz filtr albo odkryj nowe miejsce na zdjęciu.</p>');
    box.querySelectorAll('[data-sc-spot]').forEach(b=>b.addEventListener('click',()=>window.scPick(b.dataset.scSpot)));
  }
  function jumpTo(id){
    const s=ensure(); const h=SC_BY_SPOT[id]; if(!s||!h) return;
    if(s.room!==h.room){scPickRoom(h.room);}
    if(!s.discovered.includes(id)){toast('Ten punkt nie został jeszcze odkryty w aktualnym przebiegu oględzin.'); return;}
    scPick(id);
    document.getElementById('scDetail')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function nextAction(){
    const s=ensure(); if(!s) return;
    // Nie przeskakuj gotowego, lecz niezabezpieczonego dowodu.
    const pending=visibleForRoom(s.room).filter(h=>h.doc&&s.inspected.includes(h.id)&&!STATE.found.has(h.doc)&&scAccess(h).ready);
    if(pending.length){const h=pending[0];jumpTo(h.id);toast('Ten punkt jest zbadany. Zabezpiecz materiał do akt, zanim przejdziesz dalej.');return;}
    const currentUnresolved=visibleForRoom(s.room).filter(h=>!s.inspected.includes(h.id));
    if(currentUnresolved[0]){jumpTo(currentUnresolved[0].id);toast('Przejście do najbliższego niezbadanego punktu.');return;}
    const guided=window.PS_GUIDED_INSPECTION_QA;
    const nextVisible=guided?.spots().find(h=>!s.inspected.includes(h.id));
    if(nextVisible){guided.open(nextVisible.id);toast('Otwarto kolejny punkt badania.');return;}
    // Gdy są tylko fizyczne obiekty w pozostałych kadrach, zmień ujęcie.
    if(spotsForRoom(s.room).some(h=>!s.inspected.includes(h.id))){
      $('et1NextFrame')?.click();
      requestAnimationFrame(()=>{
        const n=guided?.spots().find(h=>!s.inspected.includes(h.id));
        if(n)guided.open(n.id);
        else toast('Sprawdź kolejne ujęcie i wybierz punkt oględzin.');
      });return;
    }
    const otherRoom=SC_ROOMS.find(r=>visibleForRoom(r.id).some(h=>!s.inspected.includes(h.id)));
    if(otherRoom){scPickRoom(otherRoom.id); const first=visibleForRoom(otherRoom.id).find(h=>!s.inspected.includes(h.id)); if(first) scPick(first.id); toast('Przejście do kolejnej strefy z otwartym punktem.'); return;}
    const undiscovered=spotsForRoom(s.room).length-visibleForRoom(s.room).length;
    if(undiscovered>0){toast('W tej strefie są jeszcze nieodkryte punkty. Przejrzyj pozostałe kadry dokumentacji.');return;}
    toast('Wszystkie odkryte punkty są już zbadane.');
  }
  const oldRender=window.scRender;
  window.scRender=function(){const out=oldRender.apply(this,arguments); ensure(); renderHotspotsEnhanced(); renderSummary(); renderFocus(); renderCompare(); decoratePins(); bindToolbar(); return out;};
  const oldPick=window.scPick;
  window.scPick=function(id){const out=oldPick.apply(this,arguments); const s=ensure(); if(s&&s.selected===id) pushRecent(id); renderSummary(); renderFocus(); renderCompare(); decoratePins(); return out;};
  const oldPickRoom=window.scPickRoom;
  window.scPickRoom=function(id){const out=oldPickRoom.apply(this,arguments); ensure(); renderSummary(); renderFocus(); renderCompare(); decoratePins(); return out;};
  const oldInterpret=window.scInterpret;
  window.scInterpret=function(idx){const out=oldInterpret.apply(this,arguments); const s=ensure(); if(s&&s.selected&&s.inspected.includes(s.selected)) pushRecent(s.selected); renderSummary(); renderFocus(); renderCompare(); decoratePins(); return out;};
  const oldSecure=window.scSecure;
  window.scSecure=function(){const out=oldSecure.apply(this,arguments); renderSummary(); renderFocus(); renderCompare(); decoratePins(); return out;};
  const oldExport=window.scExport;
  window.scExport=function(){const data=oldExport.apply(this,arguments); const s=ensure(); if(s){data.recent=(s.recent||[]).slice(0,8); data.pendingOnly=!!s.pendingOnly; data.compareA=s.compareA||''; data.compareB=s.compareB||'';} return data;};
  const oldRestore=window.scRestore;
  window.scRestore=function(data){const out=oldRestore.apply(this,arguments); const s=ensure(); if(s&&data&&typeof data==='object'){ if(Array.isArray(data.recent)) s.recent=data.recent.filter(id=>SC_BY_SPOT[id]).slice(0,8); if(typeof data.pendingOnly==='boolean') s.pendingOnly=data.pendingOnly; if(typeof data.compareA==='string'&&s.inspected.includes(data.compareA)) s.compareA=data.compareA; if(typeof data.compareB==='string'&&s.inspected.includes(data.compareB)) s.compareB=data.compareB; } return out;};
  const oldReset=window.scReset;
  window.scReset=function(){const out=oldReset.apply(this,arguments); ensure(); return out;};
  function bindToolbar(){
    const toolbar=$('sc84Toolbar');
    if(!toolbar||toolbar.dataset.sc84Bound==='yes') return;
    toolbar.dataset.sc84Bound='yes';
    $('sc84NextAction')?.addEventListener('click',nextAction);
    $('sc84TogglePending')?.addEventListener('click',()=>{const s=ensure(); if(!s) return; s.pendingOnly=!s.pendingOnly; renderHotspotsEnhanced(); renderSummary(); decoratePins();});
    $('sc84JumpRecent')?.addEventListener('click',()=>{const s=ensure(); if(!s||!s.recent?.length){toast('Nie ma jeszcze historii oglądanych śladów.');return;} const target=(s.recent.find(id=>id!==s.selected)||s.recent[0]); jumpTo(target);});
  }
  document.addEventListener('DOMContentLoaded',()=>{ensure(); if(STATE?.tab==='inspection12'){ renderSummary(); renderFocus(); renderCompare(); decoratePins(); bindToolbar(); }});
})();
