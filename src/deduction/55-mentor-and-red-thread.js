/* Starszy Śledczy + Czerwona Nitka — no network requests, no spoilers, no new proof. */
(function(){
'use strict';
const by=id=>document.getElementById(id);
const escText=s=>String(s||'');
const memo={enabled:true,step:0,key:'',open:false};
const mentorPref='ps_senior_detective_enabled_v1';
try{memo.enabled=localStorage.getItem(mentorPref)!=='off'}catch(_){}
function applyMentorSetting(value){
 memo.enabled=!!value;
 try{localStorage.setItem(mentorPref,value?'on':'off')}catch(_){}
 by('seniorToggle').checked=memo.enabled;
 const other=by('seniorSettingsSwitch');if(other)other.checked=memo.enabled;
 by('seniorFab').hidden=!memo.enabled;
 if(!memo.enabled)closeMentor();
}
function diagnose(){
 const progress=ui15Status();
 if(progress.complete)return {key:'finished',tab:'overview',label:'Ukończone dochodzenie',messages:[
  'Sprawa ma rozstrzygnięcie. Nie musisz zbierać wszystkich materiałów, by móc do niej wrócić.',
  'Możesz porównać pominięte źródła z już zapisanymi hipotezami, bez zmieniania wyników.',
  'Sprawdź, czy każda mocna teza ma niezależne potwierdzenie oraz czy wskazano ograniczenia źródeł.']};
 if(progress.charge)return {key:'defense',tab:'final',label:'Próba obrony aktu',messages:[
  'Rozstrzygnięcie wymaga jeszcze sprawdzenia odporności oskarżenia na kontrargumenty.',
  'Do każdego zarzutu dobierz źródła niezależne od tych, na których opiera się główna teza.',
  'Oddziel to, co dokument stwierdza wprost, od interpretacji i hipotezy. Nie traktuj braku alibi jako dowodu sprawstwa.']};
 if(progress.done===progress.checks.length)return {key:'charge',tab:'final',label:'Opracowanie oskarżenia',messages:[
  'Ustalenia wstępne są kompletne. Teraz oceń, czy argumentacja jest wystarczająco spójna.',
  'Przed złożeniem aktu porównaj metody, chronologię i przypisanie osób z niezależnymi dowodami.',
  'Nie opieraj identyfikacji człowieka wyłącznie na logu, identyfikatorze lub karcie dostępu.']};
 const sceneDone=progress.checks[2]?.ok;
 const timeDone=progress.checks[0]?.ok;
 const boardDone=progress.checks[1]?.ok;
 const here=STATE.tab;
 const focus=(here==='inspection12'&&!sceneDone)?'scene':(here==='timeline'&&!timeDone)?'time':(here==='deduction'&&!boardDone)?'board':!sceneDone?'scene':!timeDone?'time':!boardDone?'board':'complete';
 if(!sceneDone&&focus==='scene') {
  const visited=new Set(STATE.scene12?.visited||[]);
  const room=SC_ROOMS.find(r=>!visited.has(r.id));
  const base=STATE.scene12?.room||'bay';
  const incomplete=SC_SPOTS.filter(p=>p.room===base&&!STATE.scene12?.inspected?.includes(p.id));
  return {key:'scene:'+base+':'+(incomplete.length?'pending':'all'),tab:'inspection12',label:'Oględziny miejsca zdarzenia',messages:[
   'W dokumentacji miejsca zdarzenia brakuje jeszcze zweryfikowanej obserwacji. Sama fotografia nie przesądza o przyczynie zdarzenia.',
   incomplete.length?'W bieżącej strefie pozostały punkty, których nie poddano pełnemu badaniu. Zwróć uwagę na metodę i interpretację.':'Sprawdź na planie, czy odwiedzono wszystkie istotne strefy, a szczególnie miejsce pierwszych oględzin.',
   room?'Na planie pozostaje jeszcze nieodwiedzona strefa: '+room.title+'. Jeśli szukasz konkretnego tropu, skonfrontuj go z aktami.':'Przejrzyj dziennik oględzin: odróżnij punkt zbadany od materiału formalnie zabezpieczonego do akt.'
  ]};
 }
 if(!timeDone&&focus==='time'){
  const events=['e16','e17'].map(id=>TL_MAP.get(id)).filter(Boolean);
  const issue=events.map(e=>({e,r:tlAssessment(e,STATE.timeline11?.entries?.[e.id])})).find(x=>x.r.state!=='ok');
  const warn=issue?.r?.bad?.[0]||issue?.r?.warn?.[0];
  const having=issue?.e?.sources?.some(id=>STATE.found.has(id));
  return {key:'time:'+(issue?.e?.id||'complete')+':'+(issue?.r?.state||''),tab:'timeline',label:'Spójność chronologii',messages:[
   'Oś czasu nie ma jeszcze dwóch wystarczająco uzasadnionych punktów odniesienia.',
   having?'Sprawdź, czy dla wskazanego zdarzenia oddzielono znacznik urządzenia od przedziału czasu ustalonego inną metodą.':'Zanim oceniasz godzinę, uzyskaj niezależne źródło o charakterze medycznym lub technicznym.',
   warn?'W istniejącej rekonstrukcji warto sprawdzić: '+warn:'Przy każdym wpisie wskaż źródło, miejsce i własne uzasadnienie. Nie zawężaj udokumentowanego przedziału do jednej minuty.'
  ]};
 }
 if(!boardDone&&focus==='board'){
  const cards=STATE.deduction?.cards||[];
  const audit=cards.map(c=>dd7Reasoning(c)).sort((a,b)=>a.issues.length-b.issues.length)[0];
  const sources=dedAvailable();
  return {key:'ded:'+cards.length+':'+(audit?.issues.length||0)+':'+sources.size,tab:'deduction',label:'Argumentacja i źródła',messages:[
   cards.length?'Na tablicy są już hipotezy. Jeszcze nie wszystkie powiązania stanowią dostateczne uzasadnienie.':'Masz materiał do własnego wniosku, ale nie zapisano jeszcze hipotezy spełniającej kryteria argumentacji.',
   'Rozdziel obserwację od interpretacji. Dwie relacje oparte na tym samym zapisie nie są dwoma niezależnymi dowodami.',
   audit?.issues?.[0]?'Najbliższy punkt do sprawdzenia: '+audit.issues[0]:'Połącz zdobytą dokumentację z hipotezą, opisz znaczenie każdej nici i zaproponuj sprawdzenie alternatywy.'
  ]};
 }
 return {key:'scene:resume',tab:'inspection12',label:'Weryfikacja miejsca zdarzenia',messages:[
  'Przed kolejną decyzją porównaj zebrane materiały z obserwacjami miejsca.',
  'Sprawdź, które strefy zostały tylko odwiedzone, a które faktycznie zbadane.',
  'Jeżeli procedura oględzin dobiegła końca, upewnij się, że materiał zabezpieczono do akt.'
 ]};
}
function openMentor(){if(!memo.enabled)return;memo.open=true;by('seniorPanel').hidden=false;by('seniorFab').setAttribute('aria-expanded','true');drawMentor();}
function closeMentor(){memo.open=false;by('seniorPanel').hidden=true;by('seniorFab').setAttribute('aria-expanded','false');}
function drawMentor(){if(!memo.open)return;const d=diagnose();if(d.key!==memo.key){memo.key=d.key;memo.step=0;}
 by('seniorContext').textContent=d.label;
 by('seniorAdvice').textContent=memo.step?d.messages[Math.min(memo.step-1,2)]:'Nie podam rozwiązania. Mogę pomóc ustalić, które czynności lub źródła warto ponownie zweryfikować.';
 by('seniorLevel').textContent=memo.step?'Poziom '+memo.step+' z 3':'Podpowiedź na życzenie';
 by('seniorAsk').textContent=memo.step>=3?'Powtórz diagnozę':'Poproś o '+(memo.step===0?'subtelną wskazówkę':memo.step===1?'bardziej konkretną diagnozę':'wskazówkę proceduralną');
 by('seniorGo').dataset.tab=d.tab;by('seniorGo').textContent='Przejdź do: '+({inspection12:'Oględzin',timeline:'Osi czasu',deduction:'Dedukcji',final:'Finału',overview:'Pulpitu'}[d.tab]||d.tab);
}
function setupMentor(){
 const fab=document.createElement('button');fab.id='seniorFab';fab.type='button';fab.className='senior-fab';fab.setAttribute('aria-label','Starszy Śledczy — opcjonalne wskazówki');fab.setAttribute('aria-controls','seniorPanel');fab.setAttribute('aria-expanded','false');fab.innerHTML='<span class="senior-fab-symbol" aria-hidden="true">⌕</span><span>Starszy Śledczy</span>';
 const panel=document.createElement('section');panel.id='seniorPanel';panel.className='senior-panel';panel.hidden=true;panel.setAttribute('aria-label','Pomoc Starszego Śledczego');panel.innerHTML='<header><span class="senior-avatar" aria-hidden="true">SŚ</span><span><strong>Starszy Śledczy</strong><small>Opcjonalny konsultant proceduralny</small></span><button type="button" id="seniorClose" aria-label="Zamknij konsultację">×</button></header><div class="senior-content"><span class="senior-kicker">DIAGNOZA AKTUALNEGO POSTĘPU</span><h3 id="seniorContext"></h3><p id="seniorAdvice" aria-live="polite"></p><span id="seniorLevel" class="senior-level"></span><button type="button" id="seniorAsk" class="senior-action"></button><button type="button" id="seniorGo" class="senior-go"></button><p class="senior-disclaimer">Wskazówki nie dodają dowodów, nie zaliczają zadań i nie zdradzają sprawcy.</p><label class="senior-opt"><input type="checkbox" checked id="seniorToggle"> Włącz Starszego Śledczego</label></div>';
 document.body.append(fab,panel);
 fab.addEventListener('click',()=>memo.open?closeMentor():openMentor());
 by('seniorClose').addEventListener('click',closeMentor);
 by('seniorAsk').addEventListener('click',()=>{if(memo.step<3){memo.step++;if(typeof PS!=='undefined')PS.hints=(PS.hints||0)+1;}drawMentor();});
 by('seniorGo').addEventListener('click',()=>{const tab=by('seniorGo').dataset.tab;if(tab)showTab(tab);closeMentor();});
 by('seniorToggle').addEventListener('change',e=>applyMentorSetting(e.target.checked));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&memo.open)closeMentor();});
 const settings=by('ps80Settings')||document.querySelector('.sidebottom');
 if(settings){const div=document.createElement('label');div.className='senior-setting';div.innerHTML='<input type="checkbox" id="seniorSettingsSwitch"> Starszy Śledczy — podpowiedzi';settings.append(div);div.querySelector('input').addEventListener('change',e=>applyMentorSetting(e.target.checked));}
 applyMentorSetting(memo.enabled);
}
const T={search:'',more:12,cardSearch:'',from:null,drag:null,dialogData:null};
let boardEl,sourceEl,cardEl,svgEl,formDialog;
const roles={supports:{label:'Potwierdza',css:'supports',stroke:'#528b6e'},refutes:{label:'Podważa / sprzeczność',css:'refutes',stroke:'#ab4545'},limits:{label:'Ogranicza zakres',css:'limits',stroke:'#bc9658'},context:{label:'Kontekst',css:'context',stroke:'#9d9987'}};
function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function boardSources(){const list=[...dedAvailable().values()];const q=T.search.trim().toLowerCase();return list.filter(s=>!q||(s.label+' '+s.subtitle+' '+s.body).toLowerCase().includes(q));}
function boardCards(){const q=T.cardSearch.trim().toLowerCase();return STATE.deduction.cards.filter(c=>!q||(c.id+' '+c.title+' '+c.statement).toLowerCase().includes(q));}
function lineData(a,b){const dy=Math.abs(b.y-a.y);const curve=Math.min(125,Math.max(25,Math.abs(b.x-a.x)*.37));return 'M'+a.x+' '+a.y+' C'+(a.x+curve)+' '+a.y+' '+(b.x-curve)+' '+b.y+' '+b.x+' '+b.y;}
function drawLines(){
 if(!svgEl||!boardEl.isConnected||!boardEl.offsetParent)return;
 const w=boardEl.clientWidth,h=boardEl.clientHeight;
 svgEl.setAttribute('viewBox',`0 0 ${w} ${h}`);
 // Build lookup tables once: scrolling redraws must not run a DOM query per edge.
 const sources=new Map([...sourceEl.querySelectorAll('[data-thread-source]')].map(el=>[el.dataset.threadSource,el]));
 const targets=new Map([...cardEl.querySelectorAll('[data-thread-card]')].map(el=>[el.dataset.threadCard,el]));
 const sourceBounds=sourceEl.getBoundingClientRect(),cardBounds=cardEl.getBoundingClientRect(),boardBounds=boardEl.getBoundingClientRect();
 const geometry=new Map();
 const center=(el)=>{
  if(!geometry.has(el)){
   const rect=el.getBoundingClientRect();
   geometry.set(el,{rect,point:{x:rect.left-boardBounds.left+rect.width/2,y:rect.top-boardBounds.top+rect.height/2}});
  }
  return geometry.get(el);
 };
 const fragment=document.createDocumentFragment();
 for(const card of boardCards()){
  const dest=targets.get(card.id);if(!dest)continue;
  const d=center(dest);if(d.rect.bottom<cardBounds.top||d.rect.top>cardBounds.bottom)continue;
  for(const link of card.links||[]){
   const from=sources.get(link.source);if(!from)continue;
   const f=center(from);if(f.rect.bottom<sourceBounds.top||f.rect.top>sourceBounds.bottom)continue;
   const path=document.createElementNS('http://www.w3.org/2000/svg','path');
   path.setAttribute('d',lineData(f.point,d.point));
   path.setAttribute('class','thread-wire '+(roles[link.role]?.css||'context'));
   fragment.append(path);
  }
 }
 if(T.drag){
  const from=sources.get(T.drag.key);
  if(from){const a=center(from).point,b={x:T.drag.x,y:T.drag.y};const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',lineData(a,b));path.setAttribute('class','thread-wire preview');fragment.append(path);}
 }
 svgEl.replaceChildren(fragment);
}
function updateSelection(){sourceEl.querySelectorAll('[data-thread-source]').forEach(e=>e.classList.toggle('thread-picked',e.dataset.threadSource===T.from));if(T.from||window.PS_CORRELATIONS?.getSourceOrigin?.()==='board')window.PS_CORRELATIONS?.selectSource(T.from,'board');}
function threadRender(){if(!boardEl)return;const sources=boardSources(),cards=boardCards(),available=new Map(dedAvailable());
 sourceEl.replaceChildren();cardEl.replaceChildren();
 for(const s of sources.slice(0,T.more)){
  const node=make('article','thread-paper thread-source-card');node.dataset.threadSource=s.key;
  const title=make('strong','',s.label),sub=make('small','',s.type==='say'?'ZEZNANIE · '+s.subtitle:'DOKUMENT · '+s.subtitle);const excerpt=make('p','',s.body.slice(0,115).replace(/\s+/g,' ')+'…');
  const handle=make('button','thread-pin','●');handle.type='button';handle.setAttribute('aria-label','Wybierz źródło do połączenia: '+s.label);handle.title='Złap i przeciągnij do hipotezy albo dotknij źródła i hipotezy';
  handle.addEventListener('click',e=>{if(T.drag?.active)return;T.from=T.from===s.key?null:s.key;updateSelection();by('threadStatus').textContent=T.from?'Wybrano źródło. Dotknij hipotezy albo przeciągnij nić.':'Wybierz materiał, aby utworzyć połączenie.';});
  handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=boardEl.getBoundingClientRect();T.drag={key:s.key,startX:e.clientX,startY:e.clientY,x:e.clientX-r.left,y:e.clientY-r.top,active:false};handle.setPointerCapture(e.pointerId);});
  handle.addEventListener('pointermove',e=>{if(!T.drag||T.drag.key!==s.key)return;const r=boardEl.getBoundingClientRect();T.drag.x=e.clientX-r.left;T.drag.y=e.clientY-r.top;if(Math.hypot(e.clientX-T.drag.startX,e.clientY-T.drag.startY)>7)T.drag.active=true;if(T.drag.active){T.from=s.key;updateSelection();drawLines();}});
  handle.addEventListener('pointerup',e=>{if(!T.drag||T.drag.key!==s.key)return;const active=T.drag.active;T.drag=null;drawLines();if(active){e.preventDefault();e.stopPropagation();T.from=s.key;updateSelection();const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-thread-card]');if(target)openLinkDialog(s.key,target.dataset.threadCard);else by('threadStatus').textContent='Wskaż hipotezę, aby zakończyć połączenie.';}});
  handle.addEventListener('pointercancel',()=>{T.drag=null;drawLines();});
  node.append(handle,title,sub,excerpt);sourceEl.append(node);
 }
 if(!sourceEl.children.length){sourceEl.append(make('p','thread-empty',sources.length?'Pokaż więcej materiałów, aby zobaczyć dopasowanie.':'Brak zdobytych źródeł pasujących do filtra.'));}
 const count=by('threadSourceCount');count.textContent=`${Math.min(sources.length,T.more)} / ${psCount(sources.length,'źródło','źródła','źródeł')}`;by('threadMore').hidden=sources.length<=T.more;
 for(const c of cards){
  const node=make('article','thread-paper thread-hypothesis');node.dataset.threadCard=c.id;
  const h=make('div','thread-hyp-top');h.append(make('small','',c.id+' · '+(DD_KINDS[c.kind]||c.kind)));
  const target=make('button','thread-target','◉');target.type='button';target.title='Połącz z wybranym źródłem';target.setAttribute('aria-label','Połącz źródło z hipotezą '+c.title);target.dataset.threadCard=c.id;
  target.addEventListener('click',()=>{if(T.from)openLinkDialog(T.from,c.id);else by('threadStatus').textContent='Najpierw wybierz materiał w lewej kolumnie.';});h.append(target);
  node.append(h,make('strong','',c.title),make('p','thread-hyp-statement',c.statement.slice(0,185)));
  const bottom=make('div','thread-hyp-foot');const edit=make('button','thread-edit','Edytuj hipotezę');edit.type='button';edit.addEventListener('click',()=>{dedSelect(c.id);by('dedTitle')?.scrollIntoView({behavior:'smooth',block:'center'});});bottom.append(edit,make('span','',String(c.links.length)+' powiązań'));
  node.append(bottom);
  if(c.links?.length){const pins=make('div','thread-edge-list');for(const l of c.links.slice(0,24)){const s=available.get(l.source);if(!s)continue;const chip=make('button','thread-edge-pill '+(roles[l.role]?.css||'context'),(roles[l.role]?.label||'Kontekst')+' · '+s.short);chip.type='button';chip.title='Zmień rolę, uzasadnienie lub usuń połączenie';chip.addEventListener('click',()=>openLinkDialog(l.source,c.id));pins.append(chip);}node.append(pins);}
  cardEl.append(node);
 }
 if(!cardEl.children.length){const empty=make('div','thread-empty');empty.append(make('strong','',cards.length?'Brak wyników filtra hipotez':'Zacznij od własnej hipotezy.'),make('p','',cards.length?'Zmień wyszukiwane hasło.':'Utwórz kartę hipotezy w warsztacie. Potem połącz ją z dokumentem lub zapisanym zeznaniem.'));
  const button=make('button','thread-create','+ Utwórz hipotezę');button.type='button';button.addEventListener('click',()=>{by('dedNew').click();by('dedTitle').scrollIntoView({behavior:'smooth',block:'center'});});empty.append(button);cardEl.append(empty);}
 by('threadCardCount').textContent=psCount(cards.length,'hipoteza','hipotezy','hipotez');updateSelection();requestAnimationFrame(drawLines);window.PS_CORRELATIONS?.scheduleApply();
}
function openLinkDialog(sourceKey,cardId){const source=dedAvailable().get(sourceKey),card=STATE.deduction.cards.find(c=>c.id===cardId);if(!source||!card)return;
 if(STATE.deduction.dirty){by('threadStatus').textContent='Najpierw zapisz lub odrzuć niezapisane zmiany w edytorze hipotezy.';return;}
 const found=card.links.find(l=>l.source===sourceKey);
 T.dialogData={sourceKey,cardId};by('threadDialogTitle').textContent=found?'Zmień powiązanie':'Nowe powiązanie';by('threadPair').textContent=source.label+'  ↔  '+card.title;
 by('threadRole').value=found?.role||'supports';by('threadNote').value=found?.note||'';by('threadDelete').hidden=!found;
 by('threadError').textContent='';formDialog.showModal();by('threadNote').focus();
}
function saveLink(remove){if(!T.dialogData)return;const {sourceKey,cardId}=T.dialogData,card=STATE.deduction.cards.find(c=>c.id===cardId);if(!card||!dedAvailable().has(sourceKey))return;
 const note=by('threadNote').value.trim(),role=by('threadRole').value;
 if(!remove&&(!note||note.length<12)){by('threadError').textContent='Wyjaśnij znaczenie źródła dla hipotezy (co najmniej 12 znaków). Sama nić nie dowodzi związku.';by('threadNote').focus();return;}
 if(!remove&&!roles[role])return;
 try{window.PS_REASONING_ENGINE.linkHypothesis({cardId,sourceKey,role,note,remove});}
 catch(error){by('threadError').textContent=error.message;return;}
 T.from=null;T.dialogData=null;formDialog.close();
 by('threadStatus').textContent=remove?'Połączenie usunięto.':'Powiązanie zapisano. Kolor oznacza ocenę gracza, nie automatyczny werdykt.';
}
function setupBoard(){const section=by('deduction');if(!section)return;
 const panel=document.createElement('section');panel.id='threadBoardPanel';panel.className='thread-board-panel';
 panel.innerHTML='<div class="thread-heading"><div><span class="thread-eyebrow">TABLICA POWIĄZAŃ / AKTA ŚLEDCZE</span><h3>Czerwona Nitka</h3><p>Połącz zdobyte dokumenty i zeznania z własnymi hipotezami. Przeciągnij nić z punktu ● na punkt ◉ albo wybierz kolejno źródło i hipotezę.</p></div><div class="thread-legend"><span class="thread-label supports">Potwierdza</span><span class="thread-label refutes">Podważa</span><span class="thread-label limits">Ogranicza</span></div></div><div class="thread-controls"><label>Szukaj źródła<input id="threadSourceSearch" type="search" placeholder="Dokument, świadek lub fragment…"></label><label>Szukaj hipotezy<input id="threadCardSearch" type="search" placeholder="Nazwa albo treść hipotezy…"></label></div><div class="thread-cork" id="threadCanvas"><svg id="threadSvg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"></svg><div class="thread-column"><header><strong>Zdobyte materiały</strong><span id="threadSourceCount"></span></header><div id="threadSourceNodes" class="thread-node-list"></div><button type="button" id="threadMore" class="thread-more">Pokaż następne źródła</button></div><div class="thread-column"><header><strong>Twoje hipotezy</strong><span id="threadCardCount"></span></header><div id="threadCardNodes" class="thread-node-list"></div></div></div><div class="thread-status" id="threadStatus" role="status" aria-live="polite">Wskazówka: to Ty określasz, czy źródło potwierdza czy podważa tezę. Linia nie jest automatyczną oceną dowodu.</div>';
 const work=section.querySelector('.dd-work');work.before(panel);
 boardEl=by('threadCanvas');sourceEl=by('threadSourceNodes');cardEl=by('threadCardNodes');svgEl=by('threadSvg');
 // Existing list remains available, but the visual board is primary.
 const oldHead=section.querySelector('.dd-board-head'),oldBoard=by('dedBoard');const oldNote=oldBoard?.nextElementSibling;
 if(oldHead&&oldBoard){const details=document.createElement('details');details.className='thread-classic';details.innerHTML='<summary>Klasyczne karty i szczegółowa sieć wnioskowania</summary>';oldHead.before(details);details.append(oldHead,oldBoard);if(oldNote?.matches('p'))details.append(oldNote);}
 formDialog=document.createElement('dialog');formDialog.className='thread-dialog';formDialog.id='threadDialog';formDialog.innerHTML='<form method="dialog" id="threadForm"><header><span class="thread-eyebrow">KRYTYCZNA ANALIZA DOWODÓW</span><h3 id="threadDialogTitle">Nowe powiązanie</h3><p id="threadPair"></p></header><label>Rola źródła<select id="threadRole"><option value="supports">Potwierdza tezę — zielona nitka</option><option value="refutes">Podważa tezę — czerwona przerywana nitka</option><option value="limits">Ogranicza — bursztynowa nitka</option><option value="context">Tło / kontekst — szara nitka</option></select></label><label>Dlaczego łączysz te materiały?<textarea id="threadNote" maxlength="850" rows="4" placeholder="Co wynika ze źródła, a co jest jedynie interpretacją?"></textarea></label><p class="thread-error" id="threadError" role="alert"></p><footer><button type="button" id="threadDelete" class="thread-delete">Usuń nić</button><button type="button" id="threadCancel">Anuluj</button><button type="submit" id="threadConfirm">Zapisz powiązanie</button></footer></form>';
 document.body.append(formDialog);
 by('threadForm').addEventListener('submit',e=>{e.preventDefault();saveLink(false);});by('threadCancel').addEventListener('click',()=>formDialog.close());by('threadDelete').addEventListener('click',()=>saveLink(true));
 let filterRenderQueued=false;const scheduleFilterRender=()=>{if(filterRenderQueued)return;filterRenderQueued=true;requestAnimationFrame(()=>{filterRenderQueued=false;if(boardEl?.isConnected)threadRender();});};
 by('threadSourceSearch').addEventListener('input',e=>{T.search=e.target.value;T.more=12;scheduleFilterRender();});by('threadCardSearch').addEventListener('input',e=>{T.cardSearch=e.target.value;scheduleFilterRender();});by('threadMore').addEventListener('click',()=>{T.more+=12;threadRender()});
 const oldDedRender=dedRender;dedRender=function(){oldDedRender();threadRender();};
 registerNavigationHook({name:'mentor-red-thread',after:({id})=>{if(id==='deduction')requestAnimationFrame(()=>threadRender());}});
 new ResizeObserver(()=>{if(boardEl?.offsetParent)requestAnimationFrame(drawLines)}).observe(boardEl);
 let lineRedrawQueued=false;
  function scheduleLineRedraw(){
    if(lineRedrawQueued || !boardEl?.offsetParent)return;
    lineRedrawQueued=true;
    requestAnimationFrame(()=>{
      lineRedrawQueued=false;
      if(boardEl?.offsetParent)drawLines();
    });
  }
  sourceEl.addEventListener('scroll',scheduleLineRedraw,{passive:true});
  cardEl.addEventListener('scroll',scheduleLineRedraw,{passive:true});
  window.addEventListener('resize',scheduleLineRedraw,{passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&T.from){T.from=null;updateSelection();by('threadStatus').textContent='Anulowano wybór źródła.';}});
 threadRender();
}
function init(){try{setupMentor();setupBoard();}catch(error){console.error('Starszy Śledczy / Czerwona Nitka:',error);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
