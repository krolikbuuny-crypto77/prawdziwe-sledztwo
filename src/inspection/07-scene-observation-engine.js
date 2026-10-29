
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const root=$('inspection12'),stage=root?.querySelector('.et1-photo-stage'),photo=$('et1SceneImage');
 if(!root||!stage||!photo||typeof scDiscover!=='function'||!window.PS_PHOTO_ASSETS)return;
 const art=window.PS_PHOTO_ASSETS, groupByFrame=new Map();
 for(const p of art.spots){const key=p.room+':'+p.view;if(!groupByFrame.has(key))groupByFrame.set(key,[]);groupByFrame.get(key).push(p);}
 const getScene=()=>STATE.scene12;
 const room=()=>getScene().room;
 const frame=()=>{const m=(photo.dataset.frame||'').match(/^.+:([0-2])$/);return m?+m[1]:0;};
 const sceneKey=()=>room()+':'+frame();
 const currentSpots=()=>groupByFrame.get(sceneKey())||[];
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 let mode='discover',activeSector=-1,pending=null,noticeTimeout=0,press=null,vpress=null,frameKey='',lastImage='',lastRoom='',refreshBusy=false,detailId='';
 const photos=$('et1Photos'),box=document.createElement('section');box.id='ov35Workspace';box.className='ov35-workspace';
 box.innerHTML='<div class="ov3-find-head"><div><span class="eyebrow">POSZUKIWANIE I ZABEZPIECZANIE ŚLADÓW</span><h3>Odnajdź, udokumentuj, zbadaj</h3></div><span id="ov35Progress" class="chip">0/30</span></div>'+
 '<p class="ov35-tip">Przeszukanie szerokiego sektora nie odkrywa już automatycznie śladów. Zawęź obszar do dziewięciu pól lub samodzielnie wskaż konkretny fragment fotografii. Odkrycie i zabezpieczenie materiału pozostają oddzielnymi czynnościami. Filtry sceny są jedynie obróbką istniejących zdjęć.</p>'+
 '<div class="ov35-tools" role="group" aria-label="Tryb pracy ze sceną">'+
 '<button type="button" data-ov35-tool="discover" aria-pressed="true">⌖ Znajdź ślad</button>'+
 '<button type="button" data-ov35-tool="pin" aria-pressed="false">⊕ Zaznacz obserwację</button>'+
 '<button type="button" data-ov35-tool="ruler" aria-pressed="false">↔ Miarka obrazu</button>'+
 '</div><div class="ov35-flex"><button type="button" class="ov3-btn" id="ov35GridToggle" aria-pressed="false">Przeszukaj sektory</button><button type="button" class="ov3-btn" id="ov35Enlarge">Lupa 4K</button><button type="button" class="ov3-btn" id="ov35MacroGrid" aria-pressed="false">Siatka detalu</button></div>'+
 '<div class="ov35-detail"><label for="ov35Label">Opis własnego oznaczenia (nie jest dowodem)</label><input id="ov35Label" maxlength="90" value="Miejsce wymagające weryfikacji" placeholder="Np. nietypowa krawędź, zarys lub przerwa"><span class="ov35-tip">Miarka działa tylko w pikselach fotografii i nie podaje rzeczywistych wymiarów przedmiotów.</span></div>'+
 '<div id="ov35Info" class="ov3-hint" role="status" aria-live="polite">Kliknij fragment kadru, który budzi podejrzenie.</div>'+
 '<section class="ov35-sector" id="ov35Fine" hidden><h4 id="ov35SectorTitle">Sektor</h4><p class="ov35-tip">Wybierz dokładny podobszar, który chcesz obejrzeć.</p><div class="ov35-fine" id="ov35FineGrid" role="group" aria-label="Dziewięć pól zbliżenia sektora"></div><button type="button" class="ov3-btn" id="ov35Back">Powrót do siatki sektorów</button></section>'+
 '<div class="ov35-annotations" id="ov35Annotations" aria-label="Własne oznaczenia na kadrze"></div>';
 photos.insertBefore(box,stage);
 const overlay=document.createElement('div');overlay.className='ov3-grid';overlay.id='ov3Grid';overlay.hidden=true;overlay.setAttribute('role','group');overlay.setAttribute('aria-label','Przegląd sektorów sceny');
 for(let i=0;i<12;i++){const b=document.createElement('button');b.type='button';b.className='ov3-cell';b.dataset.ov35Sector=String(i);b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`Wybierz sektor ${i+1}, rząd ${Math.floor(i/4)+1}, kolumna ${i%4+1}`);overlay.append(b);}
 stage.append(overlay);
 const fine=$('ov35Fine'),fineGrid=$('ov35FineGrid'),info=$('ov35Info'),progress=$('ov35Progress'),annotations=$('ov35Annotations');
 const imageLayer=stage.querySelector('.et2-parallax-layer')||stage;
 const marks=document.createElement('div');marks.className='ov35-marks';marks.id='ov35Marks';imageLayer.append(marks);
 const status=message=>{info.textContent=message;};
 function found(p){if(!p||p.room!==room())return false;const old=getScene().discovered.includes(p.id);const ok=scDiscover(p.id);if(!ok)return false;
  status((old?'Wybrano wcześniej znaleziony punkt: ':'Odkryto punkt: ')+(SC_BY_SPOT[p.id]?.title||p.label)+'. Wykonaj procedurę badania po prawej.');
  stage.classList.remove('ov3-found');void stage.offsetWidth;stage.classList.add('ov3-found');clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>stage.classList.remove('ov3-found'),950);
  refresh();return true;
 }
 // Precise visual hit. Unlike Oględziny 3.0 there is no generous 14% auto-find radius.
 function directHit(x,y){let best=null,d=Infinity;for(const p of currentSpots()){const n=Math.hypot((p.x-x)*1.4,p.y-y);if(n<d){best=p;d=n;}}
  if(best&&d<=0.061)return found(best);
  status('Wskazany fragment nie odpowiada rozpoznanemu śladowi. Przyjrzyj się krawędziom i szczegółom w lupie albo sprawdź sektor w siatce 3 × 3.');return false;
 }
 function sectorFor(p){return Math.min(2,Math.floor(p.y*3))*4+Math.min(3,Math.floor(p.x*4));}
 function microFor(p){const x=p.x*4-Math.floor(p.x*4),y=p.y*3-Math.floor(p.y*3);return Math.min(2,Math.floor(y*3))*3+Math.min(2,Math.floor(x*3));}
 function gridState(){for(const b of overlay.children)b.classList.toggle('searched',getScene().searched.includes(sceneKey()+':'+b.dataset.ov35Sector));}
 function toggleGrid(on){overlay.hidden=!on;const b=$('ov35GridToggle');b.setAttribute('aria-pressed',String(on));b.textContent=on?'Zamknij sektory':'Przeszukaj sektory';if(!on){fine.hidden=true;activeSector=-1;}gridState();}
 function inspectSector(i){if(!Number.isInteger(i)||i<0||i>11)return;
  const key=sceneKey()+':'+i;
  if(!getScene().searched.includes(key))getScene().searched.push(key);
  activeSector=i;overlay.hidden=true;fine.hidden=false;const targets=currentSpots().filter(p=>sectorFor(p)===i&&!getScene().discovered.includes(p.id));
  $('ov35SectorTitle').textContent='Sektor '+String(i+1).padStart(2,'0')+' — kontrola szczegółowa';
  status(targets.length?'Są tu elementy wymagające bliższego sprawdzenia. Wybierz podobszar na siatce 3×3.':'Nie rozpoznano wyraźnego sygnału. Możesz mimo to skontrolować podobszary.');
  renderFine();gridState();
 }
 function renderFine(){fineGrid.replaceChildren();if(activeSector<0)return;
  for(let i=0;i<9;i++){const b=document.createElement('button');b.type='button';b.dataset.ov35Micro=String(i);const key=sceneKey()+':'+activeSector+':'+i;b.classList.toggle('observed',getScene().fineSearched.includes(key));b.textContent='Pole '+(i+1);b.setAttribute('aria-label',`Sprawdź podobszar: rząd ${Math.floor(i/3)+1}, kolumna ${i%3+1}`);fineGrid.append(b);}
 }
 function scanMicro(i){if(activeSector<0||!Number.isInteger(i)||i<0||i>8)return false;const key=sceneKey()+':'+activeSector+':'+i;if(!getScene().fineSearched.includes(key))getScene().fineSearched.push(key);
  const p=currentSpots().find(p=>sectorFor(p)===activeSector&&microFor(p)===i&&!getScene().discovered.includes(p.id));
  if(p){const ok=found(p);renderFine();return ok;}
  const already=currentSpots().some(p=>sectorFor(p)===activeSector&&microFor(p)===i&&getScene().discovered.includes(p.id));
  status(already?'Ten fragment zawiera wcześniej odkryty punkt.':'Podobszar sprawdzony: brak nowego punktu do zabezpieczenia.');renderFine();return false;
 }
 // Map taps to the *photograph*, not the cropped CSS box. The scene uses
 // object-fit:cover while the full-screen 4K magnifier uses contain.
 function normXY(clientX,clientY,img){
  const r=img.getBoundingClientRect();
  if(!r.width||!r.height||!img.naturalWidth||!img.naturalHeight)return null;
  const fit=getComputedStyle(img).objectFit;
  const ar=img.naturalWidth/img.naturalHeight;
  let rw=r.width,rh=r.height,ox=0,oy=0;
  if(fit==='cover'){
   rw=Math.max(r.width,r.height*ar);
   rh=Math.max(r.height,r.width/ar);
   ox=(rw-r.width)/2;oy=(rh-r.height)/2;
  }
  const x=(clientX-r.left+ox)/rw,y=(clientY-r.top+oy)/rh;
  return x>=0&&x<=1&&y>=0&&y<=1?{x,y}:null;
 }
 function setMode(next){mode=next;pending=null;stage.classList.toggle('ov35-annotate',mode!=='discover');for(const b of box.querySelectorAll('[data-ov35-tool]'))b.setAttribute('aria-pressed',String(b.dataset.ov35Tool===mode));
  status(mode==='discover'?'Wybierz numerowany obszar na fotografii lub jego kartę pod kadrem.':mode==='pin'?'Kliknij kadr, aby oznaczyć własną obserwację (bez zdobywania dowodu).':'Kliknij dwa punkty, by zmierzyć odcinek na obrazie w pikselach.');
 }
 function addMark(mark){const list=getScene().photoMarks||(getScene().photoMarks=[]);if(list.length>=100){status('Limit 100 oznaczeń. Usuń stare oznaczenie przed dodaniem nowego.');return;}
  list.push(mark);status(mark.kind==='ruler'?'Dodano pomiar odcinka na fotografii.':'Zapisano własne oznaczenie na fotografii.');renderMarks();
 }
 function handlePoint(x,y){if(mode==='discover')return directHit(x,y);
  const label=$('ov35Label').value.trim().slice(0,90);
  if(mode==='pin'){if(label.length<3){status('Podaj krótki opis obserwacji (minimum 3 znaki).');return false;}addMark({room:room(),view:frame(),kind:'pin',x,y,x2:x,y2:y,label});return true;}
  if(!pending){pending={room:room(),view:frame(),x,y};status('Punkt początkowy zapisany. Wskaż drugi koniec odcinka.');return true;}
  if(pending.room!==room()||pending.view!==frame()){pending=null;status('Zmieniono kadr. Zacznij pomiar od nowa.');return false;}
  const distance=Math.hypot((x-pending.x)*3840,(y-pending.y)*2160);
  if(distance<8){status('Wybierz drugi, oddalony punkt.');return false;}
  addMark({room:room(),view:frame(),kind:'ruler',x:pending.x,y:pending.y,x2:x,y2:y,label:'Odcinek: '+Math.round(distance)+' px (tylko obraz)'});pending=null;return true;
 }
 function renderMarks(){const list=getScene().photoMarks||[],scene=list.map((m,index)=>({m,index})).filter(({m})=>m.room===room()&&m.view===frame());
  marks.replaceChildren();annotations.replaceChildren();
  if(!scene.length){annotations.textContent='W tym kadrze nie ma własnych oznaczeń.';return;}
  for(const {m,index} of scene){const node=document.createElement('div');node.className=m.kind==='ruler'?'ov35-ruler':'ov35-marker';
   if(m.kind==='ruler'){const dx=(m.x2-m.x)*100,dy=(m.y2-m.y)*100;node.style.left=m.x*100+'%';node.style.top=m.y*100+'%';node.style.width=Math.hypot(dx,dy*9/16)+'%';node.style.transform='rotate('+Math.atan2(dy*9/16,dx)*180/Math.PI+'deg)';}
   else{node.style.left=m.x*100+'%';node.style.top=m.y*100+'%';}
   node.title=m.label;marks.append(node);
   const line=document.createElement('div');line.className='ov35-annotation';const text=document.createElement('span');text.textContent=(m.kind==='ruler'?'Miarka · ':'Znacznik · ')+m.label;
   const remove=document.createElement('button');remove.type='button';remove.textContent='Usuń';remove.setAttribute('aria-label','Usuń oznaczenie: '+m.label);remove.addEventListener('click',()=>{getScene().photoMarks.splice(index,1);renderMarks();});
   line.append(text,remove);annotations.append(line);
  }
 }
 overlay.addEventListener('click',e=>{const b=e.target.closest('[data-ov35-sector]');if(b)inspectSector(Number(b.dataset.ov35Sector));});
 fineGrid.addEventListener('click',e=>{const b=e.target.closest('[data-ov35-micro]');if(b)scanMicro(Number(b.dataset.ov35Micro));});
 $('ov35Back').addEventListener('click',()=>{fine.hidden=true;activeSector=-1;overlay.hidden=false;gridState();});
 $('ov35GridToggle').addEventListener('click',()=>toggleGrid(overlay.hidden));
 $('ov35Enlarge').addEventListener('click',()=>$('et2EnlargeScene')?.click());
 box.querySelectorAll('[data-ov35-tool]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.ov35Tool)));
 stage.addEventListener('pointerdown',e=>{if(e.button!==0||!overlay.hidden||e.target.closest('button')){press=null;return;}
  press={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};if(mode!=='discover')e.stopImmediatePropagation();},true);
 stage.addEventListener('pointermove',e=>{if(press?.id===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)press.moved=true;
  if(mode!=='discover'&&press?.id===e.pointerId)e.stopImmediatePropagation();},true);
 stage.addEventListener('pointerup',e=>{if(mode!=='discover'&&press?.id===e.pointerId)e.stopImmediatePropagation();},true);
 stage.addEventListener('click',e=>{if(!overlay.hidden||e.target.closest('button')||!press)return;const p=press;press=null;if(p.moved)return;
  const pos=normXY(e.clientX,e.clientY,photo);if(pos)handlePoint(pos.x,pos.y);},true);
 stage.addEventListener('pointercancel',()=>{press=null;pending=null;},true);
 // In the 4K viewer use its transformed bounding rectangle. It automatically accounts for zoom and pan.
 const viewer=$('et2Viewer'),vStage=$('et2ViewerStage'),vImage=$('et2ViewerImage');
 if(vStage&&vImage&&viewer){const tip=viewer.querySelector('.et2-viewer-tip');if(tip)tip.textContent='Lupa 4K: powiększ, przeciągnij i kliknij ślad. Odkrywanie nie działa podczas przesuwania fotografii.';
  // Track accumulated movement and multi-touch, not merely the distance
  // between pointerdown and pointerup (a drag returning to its start is NOT a tap).
  const vPointers=new Set();
  vStage.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button!==0)return;
   vPointers.add(e.pointerId);
   if(vPointers.size>1){vpress=null;return;}
   vpress={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,path:0,id:e.pointerId,moved:false};
  },true);
  vStage.addEventListener('pointermove',e=>{
   if(!vpress||vpress.id!==e.pointerId)return;
   vpress.path+=Math.hypot(e.clientX-vpress.lastX,e.clientY-vpress.lastY);
   vpress.lastX=e.clientX;vpress.lastY=e.clientY;
   if(vpress.path>9)vpress.moved=true;
  },true);
  vStage.addEventListener('pointerup',e=>{vPointers.delete(e.pointerId);},true);
  vStage.addEventListener('pointercancel',e=>{vPointers.delete(e.pointerId);vpress=null;},true);
  vStage.addEventListener('click',e=>{
   const p=vpress;vpress=null;
   if(!p||p.moved||vPointers.size||viewer.hidden||Math.hypot(e.clientX-p.x,e.clientY-p.y)>9||!$('et2ViewerTitle')?.textContent?.startsWith('Kadr 4K'))return;
   const pos=normXY(e.clientX,e.clientY,vImage);
   if(pos&&mode==='discover'&&handlePoint(pos.x,pos.y))$('et2ViewerClose').click();
  });
 }
 // Keep real full-resolution macro. Rotate/zoom manipulates photography, not a synthetic 3D model.
 const sourceImg=$('et1EvidenceImage'),evidence=$('et1EvidenceVisual'),macro=document.createElement('div');
 macro.className='ov3-macro';macro.id='ov3Macro';
 macro.innerHTML='<div class="ov3-macro-header"><strong>STOLIK MAKRO · Ogląd fotografii 4K</strong><span>Obrót zdjęcia, nie przedmiotu</span></div><div class="ov3-macro-stage" id="ov3MacroStage" style="position:relative"><div class="ov35-macro-grid" id="ov35MacroOverlay"></div></div><div class="ov3-macro-tools"><button type="button" class="ov3-btn" id="ov3Minus">−</button><output id="ov3Zoom">100%</output><button type="button" class="ov3-btn" id="ov3Plus">+</button><button type="button" class="ov3-btn" id="ov3Rotate">Obróć zdjęcie 90°</button><button type="button" class="ov3-btn" id="ov3Reset">Reset</button></div><small class="ov3-macro-note">Skala i odczyt położenia mają charakter fotograficzny. Nie pozwalają badać niewidocznej strony przedmiotu.</small>';
 const ms=macro.querySelector('#ov3MacroStage');if(sourceImg){sourceImg.after(macro);ms.insertBefore(sourceImg,$('ov35MacroOverlay'));}
 const t={scale:1,x:0,y:0,angle:0,drag:null};
 function drawMacro(){sourceImg.style.transform=`translate(${t.x}px,${t.y}px) scale(${t.scale}) rotate(${t.angle}deg)`;$('ov3Zoom').textContent=Math.round(t.scale*100)+'%';}
 function resetMacro(){t.scale=1;t.x=t.y=t.angle=0;drawMacro();}
 $('ov3Plus').addEventListener('click',()=>{t.scale=clamp(t.scale+.5,1,5);drawMacro();});
 $('ov3Minus').addEventListener('click',()=>{t.scale=clamp(t.scale-.5,1,5);if(t.scale===1){t.x=t.y=0;}drawMacro();});
 $('ov3Rotate').addEventListener('click',()=>{t.angle=(t.angle+90)%360;t.x=t.y=0;drawMacro();});
 $('ov3Reset').addEventListener('click',resetMacro);
 let gridMacro=false;$('ov35MacroGrid').addEventListener('click',()=>{gridMacro=!gridMacro;$('ov35MacroOverlay').classList.toggle('on',gridMacro);$('ov35MacroGrid').setAttribute('aria-pressed',String(gridMacro));});
 ms.addEventListener('pointerdown',e=>{if(e.button!==0)return;t.drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:t.x,startY:t.y};ms.setPointerCapture(e.pointerId);});
 ms.addEventListener('pointermove',e=>{if(!t.drag||t.drag.id!==e.pointerId||t.scale<=1)return;t.x=t.drag.startX+e.clientX-t.drag.x;t.y=t.drag.startY+e.clientY-t.drag.y;drawMacro();});
 const end=e=>{if(t.drag?.id===e.pointerId){t.drag=null;if(ms.hasPointerCapture(e.pointerId))ms.releasePointerCapture(e.pointerId);}};
 ms.addEventListener('pointerup',end);ms.addEventListener('pointercancel',end);
 ms.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();t.scale=clamp(t.scale+(e.deltaY<0?.25:-.25),1,5);drawMacro();},{passive:false});
 if(sourceImg)new MutationObserver(()=>{const src=sourceImg.getAttribute('src')||'';if(src!==lastImage){lastImage=src;resetMacro();}}).observe(sourceImg,{attributes:true,attributeFilter:['src']});
 function refresh(){const s=getScene(),current=sceneKey();progress.textContent=s.discovered.length+' / '+art.spots.length+' odkrytych';
  if(frameKey!==current){frameKey=current;pending=null;activeSector=-1;fine.hidden=true;overlay.hidden=true;$('ov35GridToggle').textContent='Przeszukaj sektory';$('ov35GridToggle').setAttribute('aria-pressed','false');gridState();}
  renderMarks();
 }
 const title=$('scRoomTitle');if(title)new MutationObserver(refresh).observe(title,{childList:true});
 new MutationObserver(refresh).observe(photo,{attributes:true,attributeFilter:['data-frame']});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="inspection12"],[data-go="inspection12"]'))requestAnimationFrame(refresh);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(!overlay.hidden||!fine.hidden)){toggleGrid(false);}});
 window.PS_OGLEDZINY_35_QA={
  status:()=>({room:room(),frame:frame(),discovered:getScene().discovered.length,inspected:getScene().inspected.length,searched:getScene().searched.length,annotations:getScene().photoMarks.length}),
  directHit:(x,y)=>directHit(x,y),inspectSector,scanMicro,sectorFor,microFor,spots:()=>currentSpots().map(p=>({id:p.id,x:p.x,y:p.y,sector:sectorFor(p),micro:microFor(p)})),setMode,refresh,
  allSpots:()=>art.spots.map(p=>({id:p.id,room:p.room,view:p.view,x:p.x,y:p.y,sector:sectorFor(p),micro:microFor(p)}))
 };
 refresh();
})();
