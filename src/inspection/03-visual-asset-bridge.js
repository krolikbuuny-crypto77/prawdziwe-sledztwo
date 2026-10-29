(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const payload=$('etap1-assets');
  if(!payload)return;
  let art;
  try{art=JSON.parse(payload.textContent);payload.textContent='';}catch(e){console.error('Zasoby zdjęć nieczytelne',e);return;}
  // Fotografie zachowują pełną rozdzielczość 4K. Wydanie Vercel używa
  // osobnych, buforowanych URL assets/, ładowanych przez przeglądarkę na żądanie.
  // W wydaniu offline źródła data: są zamieniane na Blob przy pierwszym użyciu.
  // Lekkie miniatury pozostają dostępne, zaś rozpakowane fotografie 4K
  // używają ograniczonej puli adresów Blob. Oryginalnych pikseli nie zmieniamy.
  // Bloby ze skompresowanymi zdjęciami zostają zachowane lokalnie; dzięki temu
  // starszy kadr można otworzyć ponownie bez sieci i bez ponownego dekodowania base64.
  const mobilePhotoStats={converted:0,bytes:0,failed:0,createdUrls:0,evictedUrls:0,peakLiveLarge:0};
  const mobilePhotoLive=new Set();
  const MAX_LARGE_PHOTO_URLS=6;
  let mobilePhotoClock=0,mobileCleanupScheduled=false;
  function mobileAsBlob(data){
    if(typeof data!=='string'||!data.startsWith('data:image/'))return null;
    const sep=data.indexOf(',');if(sep<0||data.slice(0,sep).indexOf(';base64')<0)return null;
    const mime=data.slice(5,sep).split(';')[0];
    const binary=atob(data.slice(sep+1));
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    mobilePhotoStats.converted++;
    mobilePhotoStats.bytes+=bytes.length;
    return new Blob([bytes],{type:mime});
  }
  function mobileCleanUnused(force=false){
    mobileCleanupScheduled=false;
    const live=[...mobilePhotoLive].filter(item=>item.kind!=='thumb');
    if(!force&&live.length<=MAX_LARGE_PHOTO_URLS)return;
    // Nie zwalniaj zdjęcia używanego przez scenę, lupę albo makrofotografię.
    const visibleUrls=new Set();
    for(const image of document.images){
      if(image.getAttribute('src')?.startsWith('blob:'))visibleUrls.add(image.getAttribute('src'));
      if(image.currentSrc?.startsWith('blob:'))visibleUrls.add(image.currentSrc);
    }
    const oldest=live.sort((a,b)=>a.used-b.used);
    let excess=Math.max(0,oldest.length-MAX_LARGE_PHOTO_URLS);
    for(const item of oldest){
      if(!excess&&!force)break;
      if(visibleUrls.has(item.url))continue;
      URL.revokeObjectURL(item.url);
      item.url='';mobilePhotoLive.delete(item);mobilePhotoStats.evictedUrls++;
      excess--;
    }
  }
  function mobileScheduleCleanup(){
    if(mobileCleanupScheduled)return;
    mobileCleanupScheduled=true;
    setTimeout(()=>mobileCleanUnused(false),600);
  }
  function mobileLazyImage(owner,key,kind){
    let encoded=owner[key];
    if(typeof encoded!=='string'||!encoded.startsWith('data:image/'))return;
    const item={blob:null,url:'',kind,used:0};
    Object.defineProperty(owner,key,{enumerable:true,configurable:true,
      get(){
        if(!item.blob){
          try {item.blob=mobileAsBlob(encoded);encoded=null;}
          catch(e){mobilePhotoStats.failed++;return encoded;}
        }
        if(!item.blob)return encoded;
        if(!item.url){
          item.url=URL.createObjectURL(item.blob);
          mobilePhotoLive.add(item);mobilePhotoStats.createdUrls++;
          mobilePhotoStats.peakLiveLarge=Math.max(mobilePhotoStats.peakLiveLarge,
            [...mobilePhotoLive].filter(x=>x.kind!=='thumb').length);
          if(kind!=='thumb')mobileScheduleCleanup();
        }
        item.used=++mobilePhotoClock;
        return item.url;
      },
      set(value){
        if(item.url){URL.revokeObjectURL(item.url);mobilePhotoLive.delete(item);item.url='';}
        item.blob=null;encoded=typeof value==='string'?value:null;
      }
    });
  }
  for(const photos of Object.values(art.views||{}))
    if(Array.isArray(photos))photos.forEach((_,i)=>mobileLazyImage(photos,i,'view'));
  for(const photos of Object.values(art.thumbs||{}))
    if(Array.isArray(photos))photos.forEach((_,i)=>mobileLazyImage(photos,i,'thumb'));
  for(const key of Object.keys(art.evidenceImages||{}))mobileLazyImage(art.evidenceImages,key,'evidence');
  document.addEventListener('visibilitychange',()=>{if(document.hidden)mobileCleanUnused(true);});
  window.addEventListener('pagehide',event=>{
    if(!event.persisted){for(const item of mobilePhotoLive)URL.revokeObjectURL(item.url);mobilePhotoLive.clear();}
  });
  window.PS_PHOTO_ASSETS=art;
  window.PS_MOBILE_PERF_QA={stats:()=>({...mobilePhotoStats,liveUrls:mobilePhotoLive.size,liveLarge:[...mobilePhotoLive].filter(x=>x.kind!=='thumb').length,limitLarge:MAX_LARGE_PHOTO_URLS,totalAssets:
    Object.values(art.views||{}).reduce((n,a)=>n+a.length,0)+Object.values(art.thumbs||{}).reduce((n,a)=>n+a.length,0)+Object.keys(art.evidenceImages||{}).length}),
    scene:()=>({active:!!document.getElementById('inspection12')?.classList.contains('active'),
      image:document.getElementById('et1SceneImage')?.currentSrc||'',
      width:document.getElementById('et1SceneImage')?.naturalWidth||0,
      height:document.getElementById('et1SceneImage')?.naturalHeight||0})};
  const rooms=Object.keys(art.views), heading=$('et1Photos');
  const stage=heading.querySelector('.et1-photo-stage');
  const image=$('et1SceneImage'), pins=$('et1ScenePins');
  // Fotografie są osobnymi ujęciami; nie stanowią źródła metrycznej panoramy equirectangular.
  const layer=document.createElement('div');layer.className='et2-parallax-layer';
  stage.insertBefore(layer,image);layer.append(image,pins);
  // The outer transform keeps photograph and future inspection markers aligned.
  const sceneZoomLayer=document.createElement('div');
  sceneZoomLayer.className='psm-scene-zoom-layer';
  stage.insertBefore(sceneZoomLayer,layer);sceneZoomLayer.append(layer);
  const glance=document.createElement('div');glance.className='et2-headsup';
  glance.innerHTML='<span class="et2-compass" id="et2Compass">◈ 000°</span>';
  stage.append(glance);
  stage.tabIndex=0;stage.setAttribute('aria-label','Przegląd fotografii. Przeciągnij w poziomie, aby zmienić kadr. Wybierz oznaczony obszar do badania.');
  stage.setAttribute('role','region');
  const picker=document.createElement('div');picker.className='et2-room-picker';
  picker.innerHTML='<label for="et2RoomSelect">Przejdź do pomieszczenia</label><select id="et2RoomSelect" aria-label="Wybierz pomieszczenie do oględzin">'+rooms.map(r=>'<option value="'+r+'">'+({'bay':'Stanowisko nr 3','workshop':'Warsztat TW-217','dispatch':'Dyspozytornia','audit':'Pokój dokumentacji','office':'Biuro BHP','passage':'Korytarz południowy','lab':'Depozyt śladów'}[r]||r)+'</option>').join('')+'</select>';
  heading.insertBefore(picker,heading.querySelector('.et1-photo-heading'));
  const control=heading.querySelector('.et1-photo-controls');
  const orient=document.createElement('div');orient.className='et2-orient';
  orient.innerHTML='<label for="et2Heading">Kierunek obserwacji</label><input type="range" id="et2Heading" min="0" max="359" step="1" value="60" aria-label="Obrót kadru w zakresie 360 stopni"><span id="et2Direction" aria-live="off">060°</span><button type="button" class="btn alt" id="et2EnlargeScene">Powiększ kadr</button>';
  // Sterowanie dodatkowe pozostaje dostępne, lecz nie zasłania fotografii i listy śladów.
  const advanced=document.createElement('details');advanced.className='ps-opt-orientation';
  const advancedTitle=document.createElement('summary');advancedTitle.textContent='Dokładne ustawienie kadru';
  advanced.append(advancedTitle);control.after(advanced);advanced.append(orient);
  const hint=document.createElement('p');hint.className='et2-hint';hint.textContent='Przeciągnij zdjęcie lub użyj suwaka, aby zmienić kierunek obserwacji.';
  advanced.append(hint);
  const zoomButton=$('et2EnlargeScene');if(zoomButton){zoomButton.classList.add('ps-scene-zoom');control.append(zoomButton);}
  const photoButton=document.createElement('button');photoButton.type='button';photoButton.className='et2-detail-zoom btn alt';photoButton.id='et2EnlargeEvidence';photoButton.textContent='Powiększ szczegół 4K';
  $('et1EvidenceVisual').append(photoButton);
  $('et1PreviousFrame').textContent='← Obróć o 120°';
  $('et1NextFrame').textContent='Obróć o 120° →';
  const range=$('et2Heading');
  const norm=n=>((n%360)+360)%360;
  const state={yaw:60,room:'',chosen:'',frame:-1,drag:null,ignoreClick:false,perRoom:Object.fromEntries(rooms.map(r=>[r,60]))};
  let drawing=false;
  const sceneGesture={scale:1,x:0,y:0,pointers:new Map(),mode:null,start:null,raf:0};
  const sceneZoomControls=document.createElement('div');
  sceneZoomControls.className='psm-photo-zoom';
  sceneZoomControls.setAttribute('role','group');
  sceneZoomControls.setAttribute('aria-label','Powiększanie zdjęcia oględzin');
  sceneZoomControls.innerHTML='<span class="psm-zoom-caption">Gesty: dwa palce · przesuń kadr</span><button type="button" data-psm-zoom="out" aria-label="Pomniejsz kadr">−</button><output id="psmSceneZoomLabel" aria-live="off">100%</output><button type="button" data-psm-zoom="in" aria-label="Powiększ kadr">+</button><button type="button" data-psm-zoom="reset">Dopasuj</button>';
  stage.after(sceneZoomControls);
  function clampScenePan(){
    const maxX=Math.max(0,(sceneGesture.scale-1)*stage.clientWidth/2);
    const maxY=Math.max(0,(sceneGesture.scale-1)*stage.clientHeight/2);
    sceneGesture.x=Math.max(-maxX,Math.min(maxX,sceneGesture.x));
    sceneGesture.y=Math.max(-maxY,Math.min(maxY,sceneGesture.y));
  }
  function redrawSceneZoom(){
    sceneGesture.raf=0;
    sceneZoomLayer.style.transform='translate3d('+sceneGesture.x+'px,'+sceneGesture.y+'px,0) scale('+sceneGesture.scale+')';
    const label=Math.round(sceneGesture.scale*100)+'%';
    document.getElementById('psmSceneZoomLabel').textContent=label;
  }
  function scheduleSceneZoom(){if(!sceneGesture.raf)sceneGesture.raf=requestAnimationFrame(redrawSceneZoom);}
  function scaleSceneAround(next,clientX,clientY){
    const oldScale=sceneGesture.scale,scale=Math.max(1,Math.min(4,Number(next)||1));
    const rect=stage.getBoundingClientRect();
    const focusX=clientX-rect.left-rect.width/2,focusY=clientY-rect.top-rect.height/2;
    sceneGesture.x=focusX-(focusX-sceneGesture.x)*scale/oldScale;
    sceneGesture.y=focusY-(focusY-sceneGesture.y)*scale/oldScale;
    sceneGesture.scale=scale;
    if(scale===1){sceneGesture.x=0;sceneGesture.y=0;}
    clampScenePan();scheduleSceneZoom();
  }
  function resetSceneZoom(keepPointers=false){sceneGesture.scale=1;sceneGesture.x=sceneGesture.y=0;if(!keepPointers){sceneGesture.mode=null;sceneGesture.pointers.clear();}scheduleSceneZoom();}
  sceneZoomControls.addEventListener('click',event=>{
    const action=event.target.closest('[data-psm-zoom]')?.dataset.psmZoom;
    if(!action)return;
    if(action==='reset'){resetSceneZoom();return;}
    const rect=stage.getBoundingClientRect();
    scaleSceneAround(sceneGesture.scale+(action==='in'?.5:-.5),rect.left+rect.width/2,rect.top+rect.height/2);
  });
  window.addEventListener('resize',()=>{clampScenePan();scheduleSceneZoom();},{passive:true});
  function active(){return $('inspection12')?.classList.contains('active');}
  function room(){try{return STATE.scene12?.room||'bay';}catch(e){return 'bay';}}
  function selected(){try{return STATE.scene12?.selected||'';}catch(e){return '';}}
  function frameIndex(yaw){return Math.floor(norm(yaw)/120)%3;}
  function setYaw(n,flush=false){
    state.yaw=norm(n);state.perRoom[room()]=state.yaw;
    range.value=String(Math.round(state.yaw));
    $('et2Direction').textContent=String(Math.round(state.yaw)).padStart(3,'0')+'°';
    $('et2Compass').textContent='◈ '+String(Math.round(state.yaw)).padStart(3,'0')+'°';
    const idx=frameIndex(state.yaw),changed=idx!==state.frame;
    if(changed||flush){if(changed)resetSceneZoom(true);updateVisual(true);}
    else{
      // Bardzo lekka paralaksa (2.5D) nadaje głębi bez fałszowania pozycji śladów.
      const local=(state.yaw%120)/120;
      layer.style.setProperty('--et2-x',((0.5-local)*3.8).toFixed(2)+'%');
    }
  }
  function openSpot(id){
    try{if(typeof scPick==='function')scPick(id);}
    catch(e){console.error('Etap 2: błąd otwarcia punktu',e);}
  }
  // Stage 6: all full-resolution inspection images decode asynchronously.
  // Their src attributes are still explicitly released on navigation / viewer close.
  image.decoding='async';
  const inspectedDetail=$('et1EvidenceImage');
  if(inspectedDetail)inspectedDetail.decoding='async';
  function updateHero(){
    const photos=document.querySelectorAll('#photoGrid img');
    [art.thumbs.bay?.[0],art.thumbs.audit?.[0],art.thumbs.workshop?.[0]].forEach((src,i)=>{if(src&&photos[i]){photos[i].src=src;photos[i].loading=i===0?'eager':'lazy';}});
  }
  function updateVisual(force=false){
    if(!active())return;
    const r=room(),choice=selected(),v=art.views[r];if(!v)return;
    if(r!==state.room){resetSceneZoom();state.room=r;state.frame=-1;state.chosen='';state.yaw=state.perRoom[r]??60;range.value=Math.round(state.yaw);$('et2RoomSelect').value=r;force=true;}
    const idx=frameIndex(state.yaw),local=(state.yaw%120)/120;
    if(force||state.frame!==idx){
      state.frame=idx;
      const frame=v[idx];
      if(image.dataset.frame!==r+':'+idx){image.src=frame;image.dataset.frame=r+':'+idx;}
      image.alt='Fotografia 4K — '+($('scRoomTitle')?.textContent||r)+', kierunek '+(idx+1)+' z 3';
      $('et1FrameCount').textContent='Kadr '+(idx+1)+' / '+v.length;
      pins.replaceChildren(); // Oględziny 3.5: brak gotowych znaczników na fotografii.
      $('et1SceneCaption').textContent=$('scRoomTitle')?.textContent||'Miejsce zdarzenia';
    }
    layer.style.setProperty('--et2-x',((0.5-local)*3.8).toFixed(2)+'%');
    range.value=String(Math.round(state.yaw));
    $('et2Direction').textContent=String(Math.round(state.yaw)).padStart(3,'0')+'°';
    $('et2Compass').textContent='◈ '+String(Math.round(state.yaw)).padStart(3,'0')+'°';
    const key=r+'::'+choice,ref=art.evidenceImages[key],visual=$('et1EvidenceVisual'),detailImage=$('et1EvidenceImage');
    if(ref){
      visual.hidden=false;
      if(state.chosen!==key||detailImage.getAttribute('src')!==ref){detailImage.src=ref;state.chosen=key;}
      const spot=art.spots.find(x=>x.id===choice&&x.room===r);
      $('et1EvidenceTitle').textContent=spot?.label||'Badany ślad';
      detailImage.alt='Fotografia szczegółowa: '+$('et1EvidenceTitle').textContent;
    }else{visual.hidden=true;state.chosen='';detailImage.removeAttribute('src');}
    
  }
  $('et2RoomSelect').addEventListener('change',e=>{if(typeof scPickRoom==='function')scPickRoom(e.target.value);else console.warn('Nie odnaleziono nawigacji strefy');updateVisual(true);});
  $('et1PreviousFrame').addEventListener('click',()=>setYaw(state.yaw-120));
  $('et1NextFrame').addEventListener('click',()=>setYaw(state.yaw+120));
  range.addEventListener('input',()=>setYaw(Number(range.value)));
  pins.addEventListener('click',ev=>{if(state.ignoreClick){ev.preventDefault();return;}const b=ev.target.closest('[data-et1-spot]');if(b)openSpot(b.dataset.et1Spot);});
  // One finger rotates the unzoomed scene; two fingers zoom around their midpoint.
  // Once zoomed, a one-finger drag pans without accidentally switching frames.
  function beginSceneGesture(){
    const points=[...sceneGesture.pointers.values()];
    if(points.length>=2){
      const [a,b]=points;
      sceneGesture.mode='pinch';
      sceneGesture.start={distance:Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)),scale:sceneGesture.scale};
    }else if(points.length===1){
      sceneGesture.mode=sceneGesture.scale>1?'pan':'rotate';
      sceneGesture.start={x:points[0].x,y:points[0].y,offsetX:sceneGesture.x,offsetY:sceneGesture.y,yaw:state.yaw,moved:false};
    }else{sceneGesture.mode=null;sceneGesture.start=null;}
  }
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    sceneGesture.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    stage.setPointerCapture(e.pointerId);
    beginSceneGesture();
  });
  stage.addEventListener('pointermove',e=>{
    if(!sceneGesture.pointers.has(e.pointerId))return;
    sceneGesture.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const points=[...sceneGesture.pointers.values()],start=sceneGesture.start;
    if(!start)return;
    if(sceneGesture.mode==='pinch'&&points.length>=2){
      const [a,b]=points;
      const distance=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));
      scaleSceneAround(start.scale*distance/start.distance,(a.x+b.x)/2,(a.y+b.y)/2);
      start.moved=true;
    }else if(sceneGesture.mode==='pan'&&points.length===1){
      sceneGesture.x=start.offsetX+points[0].x-start.x;
      sceneGesture.y=start.offsetY+points[0].y-start.y;
      clampScenePan();scheduleSceneZoom();start.moved=true;
    }else if(sceneGesture.mode==='rotate'&&points.length===1){
      const dx=points[0].x-start.x;
      if(Math.abs(dx)>7){start.moved=true;setYaw(start.yaw-dx*.43);}
    }
    if(start.moved)e.preventDefault();
  },{passive:false});
  function finishSceneGesture(e){
    if(!sceneGesture.pointers.has(e.pointerId))return;
    const wasGesture=sceneGesture.mode==='pinch'||sceneGesture.mode==='pan'||sceneGesture.start?.moved;
    sceneGesture.pointers.delete(e.pointerId);
    if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
    if(wasGesture){state.ignoreClick=true;setTimeout(()=>{state.ignoreClick=false;},130);}
    beginSceneGesture();
  }
  stage.addEventListener('pointerup',finishSceneGesture);
  stage.addEventListener('pointercancel',finishSceneGesture);
  stage.addEventListener('lostpointercapture',finishSceneGesture);
  stage.addEventListener('keydown',e=>{if(e.target!==stage)return;if(e.key==='ArrowLeft'||e.key==='a'){e.preventDefault();setYaw(state.yaw-20);}if(e.key==='ArrowRight'||e.key==='d'){e.preventDefault();setYaw(state.yaw+20);}});
  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;if(active())updateVisual();});};
  const title=$('scRoomTitle'),detail=$('scDetail');
  if(title)new MutationObserver(schedule).observe(title,{childList:true,subtree:true,characterData:true});
  if(detail)new MutationObserver(schedule).observe(detail,{childList:true,subtree:true,characterData:true});
  document.querySelectorAll('[data-tab="inspection12"],[data-go="inspection12"]').forEach(b=>b.addEventListener('click',schedule));
  // Pełnoekranowa lupa 4K: bez WebGL, bez modyfikowania stanu dowodów.
  const viewer=document.createElement('div');viewer.id='et2Viewer';viewer.hidden=true;viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Lupa fotograficzna 4K');
  viewer.innerHTML='<div class="et2-viewer-head"><b id="et2ViewerTitle">Lupa 4K</b><div class="et2-viewer-tools"><button id="et2ZoomOut" type="button">−</button><span id="et2ZoomReadout">100%</span><button id="et2ZoomIn" type="button">+</button><button id="et2ZoomReset" type="button">Dopasuj</button><button id="et2ViewerClose" type="button">Zamknij ✕</button></div></div><div class="et2-viewer-stage" id="et2ViewerStage"><img id="et2ViewerImage" alt="Powiększane zdjęcie 4K"></div><p class="et2-viewer-tip">Uszczypnij dwoma palcami, aby powiększyć, a jednym przesuwaj kadr. Działa też kółko myszy oraz przyciski + / −. Esc zamyka lupę.</p>';
  document.body.append(viewer);
  const viewState={scale:1,x:0,y:0,pointers:new Map(),mode:null,start:null,prevFocus:null,raf:0};
  const viewerImage=$('et2ViewerImage');
  viewerImage.decoding='async';viewerImage.loading='eager';
  function clampViewerPan(){
    const area=$('et2ViewerStage');
    const extentX=Math.max(0,(viewerImage.clientWidth*viewState.scale-area.clientWidth)/2);
    const extentY=Math.max(0,(viewerImage.clientHeight*viewState.scale-area.clientHeight)/2);
    viewState.x=Math.max(-extentX,Math.min(extentX,viewState.x));
    viewState.y=Math.max(-extentY,Math.min(extentY,viewState.y));
  }
  function redraw(){viewState.raf=0;viewerImage.style.transform='translate3d('+viewState.x+'px,'+viewState.y+'px,0) scale('+viewState.scale+')';$('et2ZoomReadout').textContent=Math.round(viewState.scale*100)+'%';}
  function scheduleViewerDraw(){if(!viewState.raf)viewState.raf=requestAnimationFrame(redraw);}
  function zoomAt(val,clientX,clientY){
    const previous=viewState.scale;
    const next=Math.max(1,Math.min(4,Number(val)||1));
    const rect=$('et2ViewerStage').getBoundingClientRect();
    const fx=clientX-rect.left-rect.width/2,fy=clientY-rect.top-rect.height/2;
    viewState.x=fx-(fx-viewState.x)*next/previous;
    viewState.y=fy-(fy-viewState.y)*next/previous;
    viewState.scale=next;
    if(next===1){viewState.x=0;viewState.y=0;}
    clampViewerPan();scheduleViewerDraw();
  }
  function zoom(val){const rect=$('et2ViewerStage').getBoundingClientRect();zoomAt(val,rect.left+rect.width/2,rect.top+rect.height/2);}
  function viewerOpen(ref,label){if(!ref)return;viewState.prevFocus=document.activeElement;viewerImage.src=ref;$('et2ViewerTitle').textContent=label;viewer.hidden=false;document.body.classList.add('et2-zoom-open');zoom(1);$('et2ViewerClose').focus();}
  function viewerClose(){if(viewer.hidden)return;viewer.hidden=true;document.body.classList.remove('et2-zoom-open');viewerImage.removeAttribute('src');viewState.pointers.clear();viewState.start=null;viewState.mode=null;if(viewState.prevFocus?.isConnected)viewState.prevFocus.focus();viewState.prevFocus=null;}
  viewerImage.addEventListener('load',()=>{clampViewerPan();scheduleViewerDraw();});
  $('et2EnlargeScene').addEventListener('click',()=>viewerOpen(image.getAttribute('src'),'Kadr 4K • '+($('scRoomTitle')?.textContent||'Lokacja')));
  photoButton.addEventListener('click',()=>viewerOpen($('et1EvidenceImage').getAttribute('src'),$('et1EvidenceTitle').textContent));
  $('et2ViewerClose').addEventListener('click',viewerClose);
  $('et2ZoomIn').addEventListener('click',()=>zoom(viewState.scale+.5));
  $('et2ZoomOut').addEventListener('click',()=>zoom(viewState.scale-.5));
  $('et2ZoomReset').addEventListener('click',()=>zoom(1));
  const viewerStage=$('et2ViewerStage');
  viewerStage.addEventListener('wheel',e=>{e.preventDefault();zoomAt(viewState.scale+(e.deltaY<0?.25:-.25),e.clientX,e.clientY);},{passive:false});
  function beginViewerGesture(){
    const points=[...viewState.pointers.values()];
    if(points.length>=2){const [a,b]=points;viewState.mode='pinch';viewState.start={scale:viewState.scale,distance:Math.max(1,Math.hypot(b.x-a.x,b.y-a.y))};}
    else if(points.length===1){viewState.mode='pan';viewState.start={x:points[0].x,y:points[0].y,atX:viewState.x,atY:viewState.y};}
    else{viewState.mode=null;viewState.start=null;}
  }
  viewerStage.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    viewState.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    viewerStage.setPointerCapture(e.pointerId);beginViewerGesture();
  });
  viewerStage.addEventListener('pointermove',e=>{
    if(!viewState.pointers.has(e.pointerId)||!viewState.start)return;
    viewState.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const points=[...viewState.pointers.values()];
    if(viewState.mode==='pinch'&&points.length>=2){
      const [a,b]=points;const distance=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));
      zoomAt(viewState.start.scale*distance/viewState.start.distance,(a.x+b.x)/2,(a.y+b.y)/2);
    }else if(viewState.mode==='pan'&&points.length===1&&viewState.scale>1){
      viewState.x=viewState.start.atX+points[0].x-viewState.start.x;
      viewState.y=viewState.start.atY+points[0].y-viewState.start.y;
      clampViewerPan();scheduleViewerDraw();
    }
    e.preventDefault();
  },{passive:false});
  function finishViewerGesture(e){
    if(!viewState.pointers.has(e.pointerId))return;
    viewState.pointers.delete(e.pointerId);
    if(viewerStage.hasPointerCapture(e.pointerId))viewerStage.releasePointerCapture(e.pointerId);
    beginViewerGesture();
  }
  viewerStage.addEventListener('pointerup',finishViewerGesture);
  viewerStage.addEventListener('pointercancel',finishViewerGesture);
  viewerStage.addEventListener('lostpointercapture',finishViewerGesture);
  window.addEventListener('resize',()=>{if(!viewer.hidden){clampViewerPan();scheduleViewerDraw();}},{passive:true});
  viewer.addEventListener('click',e=>{if(e.target===viewer)viewerClose();});
  document.addEventListener('keydown',e=>{if(viewer.hidden)return;if(e.key==='Escape'){e.preventDefault();viewerClose();}else if(e.key==='+'){zoom(viewState.scale+.5);}else if(e.key==='-'){zoom(viewState.scale-.5);}else if(e.key==='Tab'){const focusable=[...viewer.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable[focusable.length-1].focus();}else if(!e.shiftKey&&document.activeElement===focusable[focusable.length-1]){e.preventDefault();focusable[0].focus();}}},true);
  // Podgląd 2.5D nie zależy od WebGL.
  // Zachowanie orientacji w zapisie gry jest dodatkiem; zapis z Etapu 1 nadal się wczytuje.
  if(typeof buildSave==='function'&&typeof applySave==='function'){
    
    /* SaveManager: buildSave hook. */
registerSaveHook({name:"03-visual-asset-bridge-save1", build(__save){const save=__save;save.visual2={perRoom:{...state.perRoom}};return save;}});
    /* SaveManager: applySave hook. */
registerSaveHook({name:"03-visual-asset-bridge-load1", apply(save){undefined;for(const [k,v] of Object.entries(save?.visual2?.perRoom||{}))if(rooms.includes(k)&&Number.isFinite(Number(v)))state.perRoom[k]=norm(Number(v));state.room='';schedule();}});
  }
  registerNavigationHook({name:'visual-asset-bridge',
    before:({id})=>{
      if(id!=='inspection12'){
        resetSceneZoom();viewerClose();
        image.removeAttribute('src');delete image.dataset.frame;
        const detailImage=$('et1EvidenceImage');detailImage?.removeAttribute('src');
        state.frame=-1;state.chosen='';
      }
    },
    after:({id})=>{if(id==='inspection12')schedule();}
  });
  updateHero();
  window.PS_ETAP2_QA={
    check:()=>({documents:typeof DOCS==='undefined'?null:DOCS.length,witnesses:typeof CONTENT==='undefined'?null:CONTENT.characters.length,spots:typeof SC_SPOTS==='undefined'?null:SC_SPOTS.length,frames:rooms.reduce((n,r)=>n+art.views[r].length,0),photos:Object.keys(art.evidenceImages).length,room:room(),frame:frameIndex(state.yaw),yaw:state.yaw,renderer:'cinematic-2.5d'}),
    gotoInspection:()=>{document.querySelector('[data-tab="inspection12"]')?.click();schedule();},
    turn:y=>setYaw(y),
    showEvidence:id=>{openSpot(id);schedule();},
    current:()=>({room:room(),spot:selected(),yaw:state.yaw}),
    lookup:id=>art.spots.find(s=>s.id===id)||null
  };
})();
