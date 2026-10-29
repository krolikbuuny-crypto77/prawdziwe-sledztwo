
(()=>{
 'use strict';
 const root=document.getElementById('inspection12');
 const stage=root?.querySelector('.et1-photo-stage');
 const photo=document.getElementById('et1SceneImage');
 const art=window.PS_PHOTO_ASSETS;
 if(!root||!stage||!photo||!art||typeof scDiscover!=='function'||typeof SC_BY_SPOT==='undefined')return;
 const INFO={"bay_photo":{"mode":"photo","anchor":"Krawędź kanału obsługowego","detail":"Na zdjęciu widać krawędź kanału. To punkt odniesienia do dokumentacji osłony; fotografia nie ustala czasu powstania śladu."},"bay_body":{"mode":"record","anchor":"Dokumentacja pierwszych oględzin","detail":"Karta opisu pozycji i obrażeń; poszkodowanej nie przedstawiono na tym kadrze."},"bay_protocol":{"mode":"record","anchor":"Protokół zabezpieczenia","detail":"Numery plomb i kolejność czynności pochodzą z dokumentacji, nie z wyglądu podłogi."},"bay_sensor":{"mode":"record","anchor":"Dane czujnika stanowiska","detail":"Impuls czujnika pochodzi z rejestru instalacji; sam czujnik nie jest rozpoznawalny na zdjęciu."},"bay_objects":{"mode":"record","anchor":"Rejestr fotografii przedmiotów","detail":"Zdjęcia i numery opakowań są dostępne w dokumentacji, a nie jako osobne obiekty tego kadru."},"bay_compare":{"mode":"record","anchor":"Porównanie chronologii","detail":"Zestawienie czasu medycznego i zapisu czujnika; nie jest fizycznym śladem w pomieszczeniu."},"wrk_order":{"mode":"photo","anchor":"Blat stanowiska warsztatowego","detail":"Stanowisko pracy jest widoczne; zawartość karty TW-217 należy sprawdzić osobno."},"wrk_gaps":{"mode":"record","anchor":"Archiwum formularzy prac","detail":"Brakujące wpisy odczytuje się z formularzy, nie z fotografii regału."},"wrk_serial":{"mode":"photo","anchor":"Regały magazynowe części","detail":"Widać miejsce przechowywania części; ich numerów nie da się wiarygodnie odczytać z szerokiego kadru."},"wrk_device":{"mode":"photo","anchor":"Komputer stanowiska diagnostycznego","detail":"Widoczne urządzenie służy jako punkt dostępu do porównań wariantów."},"disp_order":{"mode":"photo","anchor":"Monitory stanowiska dyspozytora","detail":"Widoczne stanowisko; treść zmian dyspozycji należy odczytać z rejestru."},"disp_entry":{"mode":"photo","anchor":"Księgi i formularze na biurku","detail":"Na zdjęciu widać dokumenty służbowe; ich treść i czas wpisów wymagają osobnego sprawdzenia."},"disp_radio":{"mode":"photo","anchor":"Szafy urządzeń łączności","detail":"Widoczne szafy instalacji; treść i luki łączności ustala się z archiwum."},"aud_accept":{"mode":"photo","anchor":"Teczki dokumentów na biurku","detail":"Teczki są widoczne; autentyczność i treść protokołu należy zweryfikować w aktach."},"aud_versions":{"mode":"photo","anchor":"Szafa kartotek i archiwum","detail":"Widoczne miejsce przechowywania akt; historię zmian odtwarza się z dokumentacji."},"aud_stream":{"mode":"photo","anchor":"Monitor stanowiska audytowego","detail":"Widoczny ekran stacji; stan sesji nie oznacza stałej obecności użytkownika."},"aud_telemetry":{"mode":"record","anchor":"Logi aktywności komputera","detail":"Wejścia klawiatury i ich brak istnieją wyłącznie jako zapisy cyfrowe."},"aud_photo":{"mode":"record","anchor":"Archiwum fotografii podzespołu","detail":"Indeks zdjęć TW-217 to odrębny materiał cyfrowy, a nie przedmiot w tym kadrze."},"off_bhp":{"mode":"photo","anchor":"Komputer stanowiska BHP","detail":"Widoczne miejsce sporządzania dokumentacji; szkic zgłoszenia jest zapisem systemowym.","x":0.39,"y":0.62},"off_outbox":{"mode":"record","anchor":"Dziennik serwera wysyłek","detail":"Potwierdzenia bramki pocztowej znajdują się w rejestrze zdalnym, nie na biurku."},"off_payroll":{"mode":"photo","anchor":"Dokumenty na stole odpraw","detail":"Widoczna dokumentacja administracyjna; korekty wymagają kontroli w rejestrze."},"pass_card":{"mode":"record","anchor":"Rejestr wydanych identyfikatorów","detail":"Przydział karty potwierdza ewidencja. Nie jest nim żadna z szafek widocznych na zdjęciu."},"pass_cart":{"mode":"photo","anchor":"Wózek transportowy przy szafkach","detail":"Na zdjęciu widać wózek; dalsze przekazania jego zawartości wynikają z odrębnej ewidencji.","x":0.51,"y":0.67},"pass_reader":{"mode":"photo","anchor":"Czytnik przy południowych drzwiach","detail":"Widoczne urządzenie odczytuje identyfikatory; sam zapis nie rozpoznaje osoby.","x":0.85,"y":0.52},"pass_cctv":{"mode":"photo","anchor":"Monitory stanowiska ochrony","detail":"Widoczny system podglądu przejścia; kolejność zdarzeń wymaga synchronizacji zegarów."},"lab_catalog":{"mode":"photo","anchor":"Dokumentacja na stole laboratoryjnym","detail":"Widać stanowisko rejestracji próbek; numery i plomby sprawdza się w wykazie."},"lab_compare":{"mode":"photo","anchor":"Stół z materiałem porównawczym","detail":"Na blacie widać materiał do porównania; identyfikację próbek należy potwierdzić zapisem."},"lab_s3":{"mode":"record","anchor":"Karta próbki S-3","detail":"Nie można potwierdzić numeru S-3 na szerokim zdjęciu. Profil i pochodzenie odczytuje się z ewidencji."},"lab_w7":{"mode":"record","anchor":"Karta próbki W-7","detail":"Nie można potwierdzić numeru W-7 na szerokim zdjęciu. Materiał jest opisany w dokumentacji laboratorium."},"lab_med":{"mode":"record","anchor":"Akta medycyny sądowej","detail":"Przedział czasu zgonu pochodzi z opinii medycznej, nie z fotografii zaplecza."}};
 const find=id=>document.getElementById(id);
 const layer=stage.querySelector('.et2-parallax-layer')||stage;
 const markerLayer=document.createElement('div');markerLayer.className='ov36-region-layer';markerLayer.id='ov36Markers';
 layer.append(markerLayer);
 const nav=document.createElement('section');nav.className='ov36-navigator ov37-navigator';nav.id='ov36Navigation';nav.setAttribute('aria-label','Stanowiska i dokumentacja oględzin');
 nav.innerHTML='<div class="ov36-heading"><h4>Oględziny i dokumentacja</h4><span class="ov36-counter" id="ov36Count">—</span></div>'+
  '<p class="ov36-help">Na fotografii oznaczono wyłącznie rozpoznawalne przedmioty i stanowiska. Rejestry, logi oraz inne materiały niewidoczne na zdjęciu są dostępne osobno w dokumentacji strefy. Samo otwarcie materiału nie oznacza jeszcze zabezpieczenia dowodu.</p>'+
  '<section class="ov37-visual" aria-label="Obiekty widoczne na zdjęciu"><div class="ov37-section-head"><h5>Widoczne w tym kadrze</h5><span>Wybierz oznaczenie na zdjęciu lub kartę</span></div><div class="ov36-regions" id="ov36Regions"></div></section>'+
  '<section class="ov37-archive" aria-label="Dokumentacja strefy"><div class="ov37-section-head"><h5>Dokumentacja strefy</h5><span>Rejestry i materiały niewidoczne na fotografii</span></div><div class="ov36-regions ov37-documents" id="ov37Records"></div></section>'+
  '<div class="ov36-where"><p id="ov36FrameNote">Sprawdź trzy kadry pomieszczenia.</p><button type="button" id="ov36Next">Następny kadr</button></div>';
 const controls=stage.nextElementSibling;stage.parentNode.insertBefore(nav,controls?.nextSibling||null);
 const oldTools=find('ov35Workspace');if(oldTools){const fold=document.createElement('details');fold.id='ov36Advanced';fold.className='ov36-advanced';const summary=document.createElement('summary');summary.textContent='Narzędzia do własnych oznaczeń i pomiarów';fold.append(summary);nav.after(fold);fold.append(oldTools);}
 // The old picture-pixel search was intentionally removed. Keep optional annotations and measurements.
 window.PS_OGLEDZINY_35_QA?.setMode('pin');
 const regions=find('ov36Regions'),records=find('ov37Records'),count=find('ov36Count'),frameNote=find('ov36FrameNote');
 const room=()=>STATE?.scene12?.room||'bay';
 const frame=()=>{const m=(photo.dataset.frame||'').match(/:([0-2])$/);return m?Number(m[1]):0;};
 const all=()=>art.spots.filter(p=>p.room===room());
 const shown=()=>all().filter(p=>p.view===frame());
 const photospots=()=>shown().filter(p=>INFO[p.id]?.mode==='photo');
 const archival=()=>all().filter(p=>INFO[p.id]?.mode==='record');
 const known=id=>STATE.scene12.discovered.includes(id);
 const done=id=>STATE.scene12.inspected.includes(id);
 const label=p=>(SC_BY_SPOT[p.id]?.title||p.label||'Materiał');
 let drawnKey='',scheduled=false;
 function openSpot(id){const p=art.spots.find(p=>p.id===id);if(!p||p.room!==room()||!INFO[id])return;
  if(!known(id)){if(!scDiscover(id))return;}else scPick(id);
  render();const details=find('scDetail');
  if(window.innerWidth<=840&&details)requestAnimationFrame(()=>details.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'}));
 }
 function card(p,index,isArchive){const m=INFO[p.id];const c=document.createElement('button');c.type='button';
  c.className='ov36-region-card ov37-card '+(isArchive?'ov37-card-document':'ov37-card-photo')+(done(p.id)?' is-done':'')+(STATE.scene12.selected===p.id?' is-active':'');c.dataset.guidedSpot=p.id;
  const icon=document.createElement('span');icon.className='ov36-number';icon.textContent=done(p.id)?'✓':isArchive?'▤':String(index+1);
  const body=document.createElement('span');body.className='ov36-description';
  const title=document.createElement('strong');title.textContent=label(p);
  const source=document.createElement('span');source.className='ov37-source';source.textContent=(isArchive?'DOKUMENTACJA':'NA FOTOGRAFII')+' · '+m.anchor;
  const info=document.createElement('span');info.className='ov37-context';info.textContent=m.detail;
  const state=document.createElement('span');state.className='ov37-status';state.textContent=done(p.id)?'Zbadano — otwórz ustalenia':known(p.id)?'Odkryto — kontynuuj analizę':'Otwórz i wybierz metodę badania';
  body.append(title,source,info,state);c.append(icon,body);return c;
 }
 function render(){if(!root.isConnected)return;
  const s=STATE.scene12;const key=room()+':'+frame()+':'+s.discovered.join(',')+':'+s.inspected.join(',')+':'+(s.selected||'');
  if(key===drawnKey)return;drawnKey=key;
  const pp=photospots(),rr=archival(),roomSpots=all();
  count.textContent=roomSpots.filter(p=>done(p.id)).length+' / '+roomSpots.length+' zbadanych w strefie';
  markerLayer.replaceChildren();regions.replaceChildren();records.replaceChildren();
  pp.forEach((p,i)=>{
   const m=INFO[p.id];const n=i+1;
   const mark=document.createElement('button');mark.type='button';mark.className='ov36-region'+(done(p.id)?' is-done':'')+(s.selected===p.id?' is-active':'');
   mark.dataset.guidedSpot=p.id;mark.dataset.hint=m.anchor;
   const x=Number.isFinite(m.x)?m.x:p.x,y=Number.isFinite(m.y)?m.y:p.y;
   mark.style.left=(Math.max(7,Math.min(93,x*100)))+'%';mark.style.top=(Math.max(12,Math.min(88,y*100)))+'%';
   mark.textContent=done(p.id)?'✓':String(n);mark.setAttribute('aria-label','Widoczny obiekt: '+m.anchor+'. '+(done(p.id)?'Badanie zakończone.':'Otwórz kartę badania.'));
   markerLayer.append(mark);regions.append(card(p,i,false));
  });
  rr.forEach((p,i)=>records.append(card(p,i,true)));
  if(!pp.length){const e=document.createElement('p');e.className='ov36-empty';e.textContent='W tym kadrze nie ma jednoznacznego obiektu do oznaczenia. Zobacz dokumentację strefy lub przejdź do kolejnego ujęcia.';regions.append(e);}
  if(!rr.length){const e=document.createElement('p');e.className='ov36-empty';e.textContent='Brak osobnych rejestrów przypisanych do tej strefy.';records.append(e);}
  frameNote.textContent='Kadr '+(frame()+1)+' z 3 · '+pp.length+' widocznych stanowisk w ujęciu · '+rr.length+' pozycji dokumentacji strefy.';
  // The legacy floor-plan must not suggest that invisible digital records are physical spots.
  root.querySelectorAll('#scPins [data-sc-spot]').forEach(b=>{b.hidden=INFO[b.dataset.scSpot]?.mode==='record';});
  const heading=root.querySelector('#scHotspots .ov3-results-heading');if(heading)heading.textContent='Otwarte stanowiska i materiały: '+s.discovered.filter(id=>SC_BY_SPOT[id]?.room===room()).length+' / '+roomSpots.length;
  renderViewerLinks();
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;drawnKey='';render();});}
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-guided-spot]');if(b)openSpot(b.dataset.guidedSpot);});
 markerLayer.addEventListener('click',e=>{const b=e.target.closest('[data-guided-spot]');if(b)openSpot(b.dataset.guidedSpot);});
 find('ov36Next').addEventListener('click',()=>find('et1NextFrame')?.click());
 const info=find('ov35Info');if(info)info.textContent='Klikaj oznaczone na zdjęciu stanowiska lub otwieraj osobno materiały z dokumentacji strefy. Narzędzia własnych pomiarów nie przyznają dowodów.';
 const viewer=find('et2Viewer');let viewerLinks=null;
 if(viewer){viewerLinks=document.createElement('div');viewerLinks.className='ov36-viewer-area';viewerLinks.id='ov36ViewerAreas';viewer.append(viewerLinks);
  viewerLinks.addEventListener('click',e=>{const b=e.target.closest('[data-viewer-spot]');if(!b)return;openSpot(b.dataset.viewerSpot);find('et2ViewerClose')?.click();});}
 function renderViewerLinks(){if(!viewerLinks)return;viewerLinks.replaceChildren();const title=find('et2ViewerTitle')?.textContent||'';
  if(!title.startsWith('Kadr 4K')){viewerLinks.hidden=true;return;}viewerLinks.hidden=false;
  const lead=document.createElement('b');lead.textContent='Widoczne stanowiska w kadrze:';viewerLinks.append(lead);
  for(const [i,p] of photospots().entries()){const b=document.createElement('button');b.type='button';b.dataset.viewerSpot=p.id;b.textContent=(done(p.id)?'✓':String(i+1))+' · '+INFO[p.id].anchor;viewerLinks.append(b);}
 }
 find('et2EnlargeScene')?.addEventListener('click',()=>requestAnimationFrame(renderViewerLinks));
 new MutationObserver(schedule).observe(photo,{attributes:true,attributeFilter:['data-frame']});
 const title=find('scRoomTitle');if(title)new MutationObserver(schedule).observe(title,{childList:true,subtree:true});
 const detail=find('scDetail');if(detail)new MutationObserver(schedule).observe(detail,{childList:true});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="inspection12"],[data-go="inspection12"]'))schedule();});
 const oldRender=scRender;scRender=function(...args){const res=oldRender.apply(this,args);schedule();return res;};
 window.PS_GUIDED_INSPECTION_QA={spots:()=>[...photospots(),...archival()].map(p=>({id:p.id,view:p.view,mode:INFO[p.id].mode,label:label(p),done:done(p.id)})),open:openSpot,refresh:schedule,summary:()=>({total:art.spots.length,visible:photospots().length,archived:archival().length,markers:markerLayer.children.length,cards:regions.querySelectorAll('[data-guided-spot]').length+records.querySelectorAll('[data-guided-spot]').length,discovered:STATE.scene12.discovered.length,inspected:STATE.scene12.inspected.length})};
 schedule();
})();
