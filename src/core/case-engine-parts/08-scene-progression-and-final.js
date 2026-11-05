
function sc35AnalysisOptions(h){
 const base=String(SC35_SUBTLE_CORRECT[h.id]||h.obs||'').trim();
 const t=h.title;
 const category=(h.room==='lab'||/próbek|śladow|próbk|włók|smar/.test(t.toLowerCase()))?'sample':
 /(zdję|fotograf|obraz|archiwum)/i.test(t)?'photo':
 /(czas|zegar|sesj|aktywnoś|czujnik|czytnik|rejestr wejść)/i.test(t)?'clock':'records';
 const curated=SC35_SUBTLE_ANALYSES[h.id];
 if(curated)return [base,...curated];
 const traps={
 sample:[`Przy analizie „${t}” sama zgodność właściwości materiału wskazuje jednego konkretnego sprawcę.`,`Poprawne oznaczenie próbki oznacza, że wtórny transfer materiału jest niemożliwy.`,`Każdy znaleziony ślad wskazuje dokładną godzinę kontaktu z badanym przedmiotem.`,`Ponieważ istnieje ryzyko zanieczyszczenia, profil materiału nie może dostarczyć żadnej wartościowej informacji.`],
 photo:[`Fotografia dotycząca „${t}” sama ustala kto i kiedy spowodował widoczną zmianę.`,`Sam poprawny numer zdjęcia rozstrzyga, że fotografowany stan pozostał niezmienny od chwili zdarzenia.`,`Skoro na fotografii nie widać osoby, można wykluczyć jej obecność przed wykonaniem zdjęcia.`,`Obraz wystarcza do odtworzenia wszystkich zdarzeń w miejscu bez konfrontacji z dokumentami.`],
 clock:[`Znacznik „${t}” jest bezpośrednim zapisem tożsamości osoby obecnej w tym miejscu.`,`Zbieżność godzin z kilku urządzeń sama dowodzi wspólnej przyczyny wszystkich zdarzeń.`,`Brak rejestrowanej aktywności potwierdza, że nikt nie przebywał w pomieszczeniu.`,`Sam zapis czasu wystarcza do wyznaczenia dokładnej chwili zgonu.`],
 records:[`Dokumentacja „${t}” dowodzi, że opisane czynności na pewno wykonano dokładnie tak, jak je zaplanowano.`,`Wpis identyfikatora lub uprawnienia jednoznacznie rozpoznaje osobę, która z niego skorzystała.`,`Brak rubryki albo brakujący zapis to pewny dowód celowego fałszowania przez konkretną osobę.`,`Jeden wpis w rejestrze bez niezależnej kontroli wystarcza do zamknięcia całego wątku.`]
 };
 return [base,...traps[category]];
}



/* Kolejnosc odpowiedzi podczas ogledzin jest niezalezna od indeksow poprawnych
   odpowiedzi w aktach i zapisach gry. W kazdej sesji losujemy zbalansowany
   uklad; seed jest zapisywany, wiec po wznowieniu nic sie nie przestawia. */
function scFreshAnswerSeed(){
 try{if(typeof crypto!=='undefined'&&crypto.getRandomValues){const v=new Uint32Array(1);crypto.getRandomValues(v);return v[0]||1;}}catch(_e){}
 return (Math.floor(Math.random()*4294967295)+1)>>>0||1;
}
const SC_ANSWER_ORDER_CACHE={seed:null,orders:null};
function scAnswerOrders(seed){
 const num=(seed>>>0)||1;
 if(SC_ANSWER_ORDER_CACHE.seed===num&&SC_ANSWER_ORDER_CACHE.orders)return SC_ANSWER_ORDER_CACHE.orders;
 let state=num;
 const random=()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 const shuffle=(a)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const count=SC_SPOTS.length,targets=[];
 // Zrownowazone A/B/C: kazda litera pojawia sie po 10 razy w 30 pytaniach.
 for(let i=0;i<count;i++)targets.push(i%3);
 let assigned=null;
 for(let attempt=0;attempt<400;attempt++){
   const test=shuffle(targets.slice());
   const triple=test.some((v,i)=>i>=2&&v===test[i-1]&&v===test[i-2]);
   const cycle=test.some((_v,i)=>i>=5&&test[i]===test[i-3]&&test[i-1]===test[i-4]&&test[i-2]===test[i-5]);
   if(!triple&&!cycle){assigned=test;break;}
 }
 if(!assigned)assigned=shuffle(targets.slice());
 const orders=Object.create(null);
 SC_SPOTS.forEach((spot,i)=>{
   const c=SC_CHALLENGES[spot.id];
   if(!c||!Array.isArray(c.options))return;
   const indices=c.options.map((_v,k)=>k),others=shuffle(indices.filter(k=>k!==c.correct));
   const target=assigned[i]%indices.length;
   const display=Array(indices.length);
   display[target]=c.correct;
   let next=0;for(let k=0;k<display.length;k++)if(k!==target)display[k]=others[next++];
   orders[spot.id]=display;
 });
 SC_ANSWER_ORDER_CACHE.seed=num;SC_ANSWER_ORDER_CACHE.orders=orders;
 return orders;
}
function scAnswerOrder(spotId){return scAnswerOrders(STATE.scene12.answerSeed)[spotId]||SC_CHALLENGES[spotId].options.map((_v,i)=>i);}

const SC_BY_SPOT=Object.fromEntries(SC_SPOTS.map(x=>[x.id,x]));
/* Spójne pochodzenie dowodów: akta archiwalne zbiera się w Poszukiwaniach,
   zaś 29 materiałów skojarzonych z fizycznymi punktami wyłącznie podczas Oględzin.
   Nie zmieniamy kategorii acquisition w scenariuszu, aby zachować zapis i zależności. */
const SC_DOC_LOCATIONS=Object.fromEntries(SC_SPOTS.filter(h=>h.doc).map(h=>[h.doc,h]));
function searchCanAcquire(d){return !!d && ['oględziny','przed-mg'].includes(d.acquisition) && !SC_DOC_LOCATIONS[d.id];}
function sceneSourceForDoc(id){return SC_DOC_LOCATIONS[id]||null;}
window.PS_EVIDENCE_PATHS={sceneDocuments:Object.keys(SC_DOC_LOCATIONS).length,
 locationFor:id=>sceneSourceForDoc(id)?.room||null,
 searchable:id=>searchCanAcquire(byId[id]),
 inspectOnly:id=>!!sceneSourceForDoc(id)};
// Bramki obowiązują również w starszym oknie „Przeszukiwanie akt”.
const SC_GATES={
 'MED-03':['MED-02'], 'EVID_SERVICE_FORM_GAPS':['EVID_WORK_ORDER_RAW'],
 'TEC-09':['EVID_ACCEPTANCE_RECORD'],'DIG-09':['EVID_CONFERENCE_SESSION'],
 'EVID_OUTBOX_MISSING_SUBMISSION':['EVID_BHP_DRAFT'],'EVID_RESOURCE_HANDOVER':['ADM-07'],
 'VIS-11':['ADM-13'],'LAB-01':['ADM-13'],'LAB-07':['LAB-01'],
 'LAB-02':['LAB-01'],'LAB-03':['LAB-01'],'EVID_SERIAL_PHOTO':['TEC-07'],
 'EVID_T17_DOOR_EVENT':['ADM-07']
};
function scDocMissing(id){return (SC_GATES[id]||[]).filter(prev=>!STATE.found.has(prev));}
function sceneDocBlocked(id){return scDocMissing(id).length>0;}
function scTimeReady(){const st=STATE.timeline11;if(!st)return false;return ['e16','e17'].every(id=>{const e=TL_MAP.get(id),x=st.entries[id];return e&&x&&tlIsOpen(e)&&tlAssessment(e,x).state==='ok';});}
function scAccess(h){if(h.gate==='timeline')return {ready:scTimeReady(),missing:scTimeReady()?[]:['Dwa zgodne ze źródłami wpisy osi czasu: przedział medyczny i impuls czujnika.']};
 const m=h.doc?scDocMissing(h.doc):[];return {ready:!m.length,missing:m.map(id=>byId[id]?.title||id)};}
function scDefault(){return {room:'bay',answerSeed:scFreshAnswerSeed(),selected:null,visited:[],inspected:[],steps:{},roomCases:{},caseDraft:{},notes:[],analyses:{},discovered:[],searched:[],fineSearched:[],photoMarks:[],seq:1,log:[],kind:'observation',editNote:null,feedback:{}};}
STATE.scene12=scDefault();
function scExport(){const s=STATE.scene12;return {challengeVersion:2,room:s.room,answerSeed:s.answerSeed,visited:s.visited,discovered:s.discovered,searched:s.searched,fineSearched:s.fineSearched,photoMarks:s.photoMarks,inspected:s.inspected,steps:s.steps,roomCases:s.roomCases,notes:s.notes.map(({id,ref,kind,text})=>({id,ref,kind,text})),analyses:s.analyses,seq:s.seq};}
function scRestore(data){const s=scDefault();if(!data||typeof data!=='object'){STATE.scene12=s;return;}
 if(Number.isSafeInteger(data.answerSeed)&&data.answerSeed>0&&data.answerSeed<=4294967295)s.answerSeed=data.answerSeed;
 if(SC_ROOMS.some(x=>x.id===data.room))s.room=data.room;
 s.visited=[...new Set(Array.isArray(data.visited)?data.visited:[])].filter(id=>SC_ROOMS.some(r=>r.id===id)).slice(0,7);
 const previous=[...new Set(Array.isArray(data.inspected)?data.inspected:[])].filter(id=>SC_BY_SPOT[id]&&s.visited.includes(SC_BY_SPOT[id].room)).slice(0,SC_SPOTS.length);
 // Stare zapisy pozostają kompatybilne; nowy format weryfikuje rozwiązania obu kroków.
 for(const id of previous){const c=SC_CHALLENGES[id],a=data.steps?.[id];if(data.challengeVersion===2){if(a?.method!==c.method||a?.answer!==c.correct)continue;s.steps[id]={method:c.method,answer:c.correct};}else{s.steps[id]={method:c.method,answer:c.correct};}s.inspected.push(id);}
 if(data.challengeVersion===2&&data.steps&&typeof data.steps==='object')for(const [id,step] of Object.entries(data.steps)){if(!SC_BY_SPOT[id]||!s.visited.includes(SC_BY_SPOT[id].room)||s.inspected.includes(id))continue;if(step?.method===SC_CHALLENGES[id].method)s.steps[id]={method:step.method};}
 const kinds=['observation','hypothesis','question','contradiction'];const valid=new Set(s.inspected);
 s.notes=(Array.isArray(data.notes)?data.notes:[]).filter(n=>n&&typeof n==='object'&&typeof n.text==='string'&&n.text.trim().length>=3&&(!n.ref||valid.has(n.ref))).slice(0,160).map((n,i)=>({id:i+1,ref:String(n.ref||''),kind:kinds.includes(n.kind)?n.kind:'observation',text:n.text.slice(0,3000)}));s.seq=s.notes.length+1;
 if(data.analyses&&typeof data.analyses==='object')for(const id of s.inspected){const a=data.analyses[id];if(!a||typeof a!=='object'||!SC_ANALYSIS_METHODS[a.method])continue;const docs=[...new Set(Array.isArray(a.docs)?a.docs:[])].filter(k=>STATE.found.has(k)&&byId[k]).slice(0,2);if(!docs.length||(a.method==='compare'&&(docs.length!==2||byId[docs[0]].family===byId[docs[1]].family)))continue;const reasoning=String(a.reasoning||'').slice(0,1800);if(!reasoning.trim()||(a.reasonCode&&a.reasonCode!=='best'))continue;s.analyses[id]={method:a.method,docs,reasoning,reasonCode:a.reasonCode==='best'?'best':null};}
 if(data.roomCases&&typeof data.roomCases==='object')for(const [room,v] of Object.entries(data.roomCases)){const c=SC_ROOM_CASES[room];if(!c||!v||v.answer!==c.correct||!(v.reasonCode==='best'||(typeof v.reasoning==='string'&&v.reasoning.trim()))||!c.needs.every(id=>s.inspected.includes(id)&&STATE.found.has(SC_BY_SPOT[id].doc)))continue;s.roomCases[room]={answer:c.correct,reasoning:String(v.reasoning||'').slice(0,1800),reasonCode:v.reasonCode==='best'?'best':null};}
 s.discovered=[...new Set([...(Array.isArray(data.discovered)?data.discovered:[]),...s.inspected])].filter(id=>typeof id==='string'&&SC_BY_SPOT[id]&&s.visited.includes(SC_BY_SPOT[id].room)).slice(0,SC_SPOTS.length);
 s.searched=[...new Set(Array.isArray(data.searched)?data.searched:[])].filter(key=>typeof key==='string'&&/^(bay|workshop|dispatch|audit|office|passage|lab):[0-2]:(?:[0-9]|1[01])$/.test(key)).slice(0,252);
 s.fineSearched=[...new Set(Array.isArray(data.fineSearched)?data.fineSearched:[])].filter(key=>typeof key==='string'&&/^(bay|workshop|dispatch|audit|office|passage|lab):[0-2]:(?:[0-9]|1[01]):[0-8]$/.test(key)).slice(0,2268);
 s.photoMarks=(Array.isArray(data.photoMarks)?data.photoMarks:[]).filter(m=>m&&typeof m==='object'&&SC_ROOMS.some(r=>r.id===m.room)&&Number.isInteger(m.view)&&m.view>=0&&m.view<3&&['pin','ruler'].includes(m.kind)&&[m.x,m.y,m.x2??m.x,m.y2??m.y].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)).slice(-100).map(m=>({room:m.room,view:m.view,kind:m.kind,x:m.x,y:m.y,x2:m.x2??m.x,y2:m.y2??m.y,label:String(m.label||'Obserwacja własna').slice(0,90)}));
 if(data.selected&&s.discovered.includes(data.selected)&&SC_BY_SPOT[data.selected]?.room===s.room)s.selected=data.selected;
 STATE.scene12=s;
}
function scReset(){STATE.scene12=scDefault();}
function scActivity(kind,h){const s=STATE.scene12;let text=kind==='inspect'?'Zbadano: ':kind==='secure'?'Zabezpieczono: ':kind==='case'?'Zrekonstruowano: ':kind==='discover'?'Odnaleziono: ':'Zapisano: ';s.log.unshift({kind,text:text+h});s.log=s.log.slice(0,60);}
const SC_KINDS={observation:'Obserwacja',hypothesis:'Hipoteza',question:'Pytanie do sprawdzenia',contradiction:'Możliwa sprzeczność'};
const SC_ANALYSIS_METHODS={scope:'Zakres informacji i ograniczenia',compare:'Porównanie dwóch niezależnych źródeł',alternative:'Alternatywne wyjaśnienie śladu',contamination:'Ryzyko zmian lub skażenia śladów'};
function scMarkRoom(){const s=STATE.scene12;if(!s.visited.includes(s.room))s.visited.push(s.room);}
function scPickRoom(id){if(!SC_ROOMS.some(r=>r.id===id))return;STATE.scene12.room=id;STATE.scene12.selected=null;scMarkRoom();scRender();}
function scPick(id){const h=SC_BY_SPOT[id];if(!h||h.room!==STATE.scene12.room||!STATE.scene12.discovered.includes(id))return;STATE.scene12.selected=id;scRender();}
function scDiscover(id){const h=SC_BY_SPOT[id],s=STATE.scene12;if(!h||h.room!==s.room)return false;if(!s.discovered.includes(id)){s.discovered.push(id);scActivity('discover',h.title);}scPick(id);return true;}
/* Poprawka 6: przewijanie wyłącznie po akcji użytkownika, bez automatycznego zaliczania. */
function sc6ScrollToNext(id){
 if(STATE.tab!=='inspection12'||window.innerWidth>840)return;
 requestAnimationFrame(()=>{const target=$(id)||$('sc6Result')||$('scDetail');
  if(!target)return;
  target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
 });
}
function scUseMethod(id){const s=STATE.scene12,h=SC_BY_SPOT[s.selected];if(!h)return;scMarkRoom();const c=SC_CHALLENGES[h.id];if(!c||!Object.hasOwn(SC_METHODS,id))return;
 if(c.method!==id){s.feedback[h.id]='Ta czynność nie pozwala wiarygodnie zbadać tego rodzaju materiału. Dobierz metodę do tego, co rzeczywiście jest w punkcie.';scDetail();return;}
 s.steps[h.id]={method:id};delete s.feedback[h.id];scDetail();sc6ScrollToNext('sc6Assessment');
}
function scInterpret(idx){const s=STATE.scene12,h=SC_BY_SPOT[s.selected];if(!h)return;const c=SC_CHALLENGES[h.id];if(s.steps[h.id]?.method!==c.method)return;
 if(!Number.isInteger(idx)||idx<0||idx>=c.options.length)return;
 const canonicalIndex=scAnswerOrder(h.id)[idx];
 if(canonicalIndex!==c.correct){s.feedback[h.id]='Ten wniosek wykracza poza to, co wynika z oglądu. Oddziel zapis źródłowy od przypuszczenia i spróbuj ponownie.';scDetail();return;}
 s.steps[h.id].answer=canonicalIndex;delete s.feedback[h.id];if(!s.inspected.includes(h.id)){s.inspected.push(h.id);scActivity('inspect',h.title);}scRender();sc6ScrollToNext('sc6Result');
}
function scSecure(){const s=STATE.scene12,h=SC_BY_SPOT[s.selected];if(!h||!s.inspected.includes(h.id)||s.steps[h.id]?.answer!==SC_CHALLENGES[h.id]?.correct)return;
 const gate=scAccess(h);if(!gate.ready){toast('Wymagane są wcześniejsze ustalenia.');scDetail();return;}
 if(h.doc){const d=byId[h.doc];if(!d||!['oględziny','przed-mg'].includes(d.acquisition))return;
  if(STATE.found.has(h.doc)){toast('Materiał jest już w aktach.');return;}
  STATE.found.add(h.doc);PS_EVENTS.evidence(h.doc,'scene-inspection');activeDoc=h.doc;scActivity('secure',d.title);renderDocs();renderAttached();tcmsRefresh();msgRefresh();cctvRefresh();forensicRefresh();accessRefresh();toast('Zabezpieczono materiał: '+d.title);scRender();sc6ScrollToNext('sc6Result');
 }else{toast('To obserwacja analityczna, nie nowy dowód. Zapisz własny wniosek w notatniku.');}
}
const SC_GEOMETRY={
 bay:'<rect x="40" y="55" width="510" height="246" rx="9"/><rect x="74" y="82" width="210" height="123" rx="6"/><path d="M310 80V275 M330 80V275"/><rect x="379" y="108" width="130" height="130" rx="8"/><path d="M75 230H284"/>',
 workshop:'<rect x="35" y="50" width="530" height="255" rx="8"/><rect x="65" y="95" width="132" height="170" rx="8"/><rect x="240" y="95" width="134" height="60" rx="5"/><rect x="420" y="95" width="110" height="185" rx="5"/><path d="M80 280H380"/>',
 dispatch:'<rect x="40" y="45" width="530" height="266" rx="9"/><rect x="75" y="88" width="170" height="110" rx="5"/><rect x="320" y="80" width="179" height="97" rx="5"/><rect x="194" y="236" width="250" height="40" rx="5"/>',
 audit:'<rect x="45" y="54" width="520" height="250" rx="8"/><rect x="65" y="75" width="158" height="75" rx="6"/><rect x="320" y="85" width="174" height="103" rx="6"/><rect x="240" y="208" width="244" height="64" rx="6"/>',
 office:'<rect x="42" y="50" width="515" height="260" rx="8"/><rect x="68" y="85" width="218" height="95" rx="6"/><rect x="358" y="85" width="165" height="95" rx="6"/><rect x="280" y="215" width="220" height="52" rx="4"/>',
 passage:'<rect x="30" y="46" width="535" height="264" rx="8"/><path d="M300 48V310 M324 48V310"/><rect x="62" y="88" width="158" height="95" rx="5"/><rect x="65" y="226" width="168" height="56" rx="5"/><path d="M525 100V258"/>',
 lab:'<rect x="35" y="50" width="530" height="260" rx="8"/><rect x="64" y="79" width="170" height="200" rx="5"/><rect x="270" y="86" width="245" height="55" rx="6"/><rect x="280" y="185" width="230" height="91" rx="5"/>'
};
function scSvg(room){return `<svg viewBox="0 0 600 350" aria-hidden="true"><g fill="none" stroke="#7395a7" stroke-width="3">${SC_GEOMETRY[room.shape]||SC_GEOMETRY.bay}</g><g font-family="monospace" font-size="11" fill="#8ea6b1"><text x="45" y="30">PLAN / ${esc(room.title.toUpperCase())}</text><text x="440" y="329">ZAJEZDNIA</text></g></svg>`;}
function scRender(){if(!$('scRooms'))return;const s=STATE.scene12,room=SC_ROOMS.find(r=>r.id===s.room)||SC_ROOMS[0],spots=SC_SPOTS.filter(h=>h.room===room.id),inspected=spots.filter(h=>s.inspected.includes(h.id)).length;
 const collected=SC_SPOTS.filter(h=>h.doc&&STATE.found.has(h.doc)).length;
 $('scMissionCount').textContent=s.inspected.length+' / '+SC_SPOTS.length;
 psRenderMarkup($('scMetrics'),[[s.visited.length+'/7','Odwiedzone strefy'],[s.inspected.length+'/'+SC_SPOTS.length,'Zbadane punkty'],[collected,'Materiały w aktach'],[Object.keys(s.roomCases).length+'/7','Rekonstrukcje stref']].map(([n,l])=>`<div class="sc-stat"><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join(''));
 const roomsMarkup=SC_ROOMS.map(r=>{const n=SC_SPOTS.filter(h=>h.room===r.id&&s.inspected.includes(h.id)).length,m=SC_SPOTS.filter(h=>h.room===r.id).length;return `<button type="button" class="sc-room ${s.room===r.id?'active':''} ${s.visited.includes(r.id)?'visited':''}" data-sc-room="${r.id}" aria-pressed="${s.room===r.id}"><b>${esc(r.title)}</b><small>${n}/${m} zbadanych</small></button>`;}).join('');
 const roomsChanged=psRenderMarkup($('scRooms'),roomsMarkup);
 $('scRoomTitle').textContent=room.title;$('scRoomDesc').textContent=room.desc;$('scRoomProgress').textContent=`${inspected} / ${spots.length}`;psRenderMarkup($('scBlueprintBase'),scSvg(room));
 const visible=spots.filter(h=>s.discovered.includes(h.id));
 const pinsMarkup=visible.map((h,i)=>`<button type="button" class="sc-pin ${s.inspected.includes(h.id)?'inspected':''} ${s.selected===h.id?'active':''}" data-sc-spot="${h.id}" style="left:${h.x}%;top:${h.y}%" title="${esc(h.title)}" aria-label="${esc(h.title)}">${s.inspected.includes(h.id)?'✓':(i+1)}</button>`).join('');
 const pinsChanged=psRenderMarkup($('scPins'),pinsMarkup);
 const hotspotsMarkup='<div class="ov3-results-heading">Odkryte obiekty: '+visible.length+' / '+spots.length+'</div>'+
  (visible.length?visible.map((h,i)=>`<button type="button" class="sc-spot ${s.selected===h.id?'active':''} ${s.inspected.includes(h.id)?'done':''}" data-sc-spot="${h.id}"><span class="sc-num">${s.inspected.includes(h.id)?'✓':i+1}</span><span class="sc-label"><b>${esc(h.title)}</b><small>${s.inspected.includes(h.id)?h.doc&&STATE.found.has(h.doc)?'Zbadano · w aktach':'Zbadano':s.steps[h.id]?.method?'Trwa analiza':'Odkryto · wymaga badania'}</small></span></button>`).join(''):'<p class="ov3-unfound">Wybierz oznaczony obszar na fotografii albo odpowiednią kartę pod kadrem. Następnie wybierz metodę badania.</p>');
 // The enhanced renderer owns this host after installation; avoid a redundant
 // legacy draw immediately before the enhanced draw. Preserve fallback alone.
 const hotspotsChanged=!window.PS84_HOTSPOTS_ACTIVE&&psRenderMarkup($('scHotspots'),hotspotsMarkup);
 $('scRoomProgress').textContent=`Odkryto ${visible.length}/${spots.length} · zbadano ${inspected}`;
 if(roomsChanged)document.querySelectorAll('#scRooms [data-sc-room]').forEach(b=>b.addEventListener('click',()=>scPickRoom(b.dataset.scRoom)));
 if(pinsChanged)document.querySelectorAll('#scPins [data-sc-spot]').forEach(b=>b.addEventListener('click',()=>scPick(b.dataset.scSpot)));
 if(hotspotsChanged)document.querySelectorAll('#scHotspots [data-sc-spot]').forEach(b=>b.addEventListener('click',()=>scPick(b.dataset.scSpot)));
 scDetail();scRenderRoomCase();scRenderActivity();
}
function scDetail(){const s=STATE.scene12,h=SC_BY_SPOT[s.selected],el=$('scDetail');
 if(!h){el.innerHTML='<div class="sc-empty-state"><span aria-hidden="true">⌖</span><h3>Wybierz miejsce badania</h3><p>Wybierz wskazany obszar na zdjęciu lub z listy pod kadrem, a potem rozpocznij procedurę badania.</p></div>';return;}
 const c=SC_CHALLENGES[h.id],step=s.steps[h.id]||{},inspected=s.inspected.includes(h.id),g=scAccess(h),have=h.doc&&STATE.found.has(h.doc),d=h.doc?byId[h.doc]:null;
 const stage=inspected?3:step.method===c.method?2:1;
 const phases=h.doc?['Metoda','Ocena','Zabezpieczenie']:['Metoda','Ocena'];
 const currentPhase=stage===1?0:stage===2?1:(h.doc&&!have?2:phases.length);
 let mission='<div class="sc6-flow" aria-label="Przebieg oględzin">'+phases.map((p,i)=>'<span class="sc6-phase '+(i<currentPhase?'is-done':i===currentPhase?'is-now':'')+'">'+(i<currentPhase?'✓':i+1)+' · '+p+'</span>').join('')+'</div>'+
 '<div class="sc-stephead"><span>'+(stage<3?'ETAP '+stage+' / '+phases.length:(h.doc&&!have?'OSTATNI ETAP':'BADANIE ZAKOŃCZONE'))+'</span><b>'+(stage===1?'Dobierz metodę':stage===2?'Oceń ustalenie':h.doc&&!have?'Zabezpiecz materiał':'Badanie zakończone')+'</b></div>';
 if(stage===1){mission+=`<p class="sc-task">Co zrobisz, żeby rzetelnie sprawdzić ten punkt?</p><div class="sc-method-list">${Object.entries(SC_METHODS).map(([id,label])=>`<button type="button" class="sc-method" data-sc-method="${id}"><span class="sc-method-icon">${({photo:'◈',record:'▤',compare:'⇄',sample:'⌕'})[id]}</span><span>${esc(label)}</span><span class="sc-method-arrow">›</span></button>`).join('')}</div>`;}
 if(stage===2){mission+=`<div id="sc6Assessment" class="sc-clue"><span>ODCZYT / OBSERWACJA</span><p>${esc(h.look)}</p></div><p class="sc-task">${esc(c.question)}</p><div class="sc-answer-list">${scAnswerOrder(h.id).map((originalIndex,i)=>`<button type="button" data-sc-answer="${i}" class="sc-answer"><span>${String.fromCharCode(65+i)}</span>${esc(c.options[originalIndex])}</button>`).join('')}</div><button type="button" class="sc-change" id="scChangeMethod">Zmień metodę badania</button>`;}
 if(stage===3){
  mission+=`<div class="sc-success"><b>Wniosek z badania</b><p>${esc(h.obs)}</p></div>`;
  if(h.doc&&!have){
   mission+=g.ready?`<section class="sc6-result sc6-awaiting" id="sc6Result"><b>Badanie zakończone — dowodu nie ma jeszcze w aktach.</b><p>Wybierz „Zabezpiecz do akt”, aby móc użyć tego materiału w kolejnych analizach.</p><button type="button" class="btn sc6-main-action" id="scSecure">Zabezpiecz do akt →</button></section>`:
    `<section class="sc6-result sc6-locked" id="sc6Result"><b>Badanie zakończone — zabezpieczenie jeszcze niedostępne.</b><p>Najpierw potrzebujesz: ${esc(g.missing.join('; '))}</p><button type="button" class="btn alt" id="sc6FindPrerequisite" data-sc6-tab="${h.gate==='timeline'?'timeline':'search'}">${h.gate==='timeline'?'Przejdź do osi czasu':'Znajdź brakujące materiały'} →</button></section>`;
  }else if(h.doc&&have){
   mission+=`<section class="sc6-result sc6-collected" id="sc6Result"><b>Materiał jest już w aktach.</b><p>Możesz wrócić do dokumentu albo przejść do kolejnego niezbadanego punktu.</p><div class="sc6-actions"><button type="button" class="btn alt" id="scReadDoc">Otwórz dokument</button><button type="button" class="btn" id="sc6NextSpot">Następny punkt →</button></div></section>`;
  }else{
   mission+=`<section class="sc6-result sc6-observation" id="sc6Result"><b>Obserwacja została zbadana.</b><p>Ten punkt nie zawiera osobnego dokumentu do zabezpieczenia. Wniosek możesz zanotować lub przejść dalej.</p><button type="button" class="btn alt" id="sc6NextSpot">Następny punkt →</button></section>`;
  }
 }
 if(s.feedback[h.id]&&!inspected)mission+=`<div class="sc-feedback" role="status">${esc(s.feedback[h.id])}</div>`;
 let status='';if(inspected){if(h.doc){status=have?'<div class="sc-status ready">Ten dokument jest w aktach i można go wykorzystać w dalszej analizie.</div>':g.ready?'<div class="sc-status ready">Badanie wykonane. Możesz zabezpieczyć powiązany materiał.</div>':`<div class="sc-status locked"><b>Potrzebujesz wcześniejszych ustaleń</b><p>${esc(g.missing.join('; '))}</p></div>`;}
 else status=g.ready?'<div class="sc-status ready">Porównanie gotowe. Zapisz własny wniosek.</div>':`<div class="sc-status locked"><b>Brakuje danych do porównania</b><p>${esc(g.missing.join('; '))}</p></div>`;}
 el.innerHTML=`<div class="sc-object-heading"><h3>${esc(h.title)}</h3><small>${esc(SC_ROOMS.find(x=>x.id===h.room).title)}</small></div><div class="sc-object-physical">${esc(h.look)}</div><div class="sc-investigation">${mission}</div>`+
 (inspected?'':'')+
 (inspected?scAnalysisMarkup(h):'')+
 (inspected?`<div class="rule"></div><div class="eyebrow">WŁASNE SPOSTRZEŻENIE</div><label class="sc-field">Rodzaj notatki<select id="scSpotKind">${Object.entries(SC_KINDS).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></label><label class="sc-field">Treść<textarea id="scSpotMemo" rows="3" maxlength="3000" placeholder="Co wynika z badania? Co wymaga dodatkowego źródła?"></textarea></label><button class="btn alt" id="scSpotSave" style="margin-top:11px">Dodaj do notatnika</button>`:'');
 el.querySelectorAll('[data-sc-method]').forEach(b=>b.addEventListener('click',()=>scUseMethod(b.dataset.scMethod)));
 el.querySelectorAll('[data-sc-answer]').forEach(b=>b.addEventListener('click',()=>scInterpret(Number(b.dataset.scAnswer))));
 if($('scChangeMethod'))$('scChangeMethod').addEventListener('click',()=>{delete s.steps[h.id];delete s.feedback[h.id];scDetail();});
 if($('scSecure'))$('scSecure').addEventListener('click',scSecure);
 if($('scReadDoc'))$('scReadDoc').addEventListener('click',()=>{activeDoc=h.doc;showTab('evidence');});
 if($('sc6NextSpot'))$('sc6NextSpot').addEventListener('click',()=>$('sc84NextAction')?.click());
 if($('sc6FindPrerequisite'))$('sc6FindPrerequisite').addEventListener('click',e=>showTab(e.currentTarget.dataset.sc6Tab));
 if($('scAnalysisDoc1'))$('scAnalysisDoc1').value=s.analyses[h.id]?.docs[0]||'';if($('scAnalysisDoc2'))$('scAnalysisDoc2').value=s.analyses[h.id]?.docs[1]||'';
 if($('scAnalysisSave'))$('scAnalysisSave').addEventListener('click',()=>scSaveAnalysis(h));
 if($('scSpotSave'))$('scSpotSave').addEventListener('click',()=>{let text=$('scSpotMemo').value.trim();if(text.length<3){toast('Zapisz własną obserwację przed dodaniem.');return;}scAddNote(text,$('scSpotKind').value,h.id);$('scSpotMemo').value='';toast('Dodano notatkę z oględzin.');scRender();});
}
function scRenderRoomCase(){const s=STATE.scene12,r=s.room,c=SC_ROOM_CASES[r],el=$('scRoomCase');if(!el)return;
 const done=!!s.roomCases[r],draft=s.caseDraft[r],acquired=SC_SPOTS.filter(h=>h.room===r&&h.doc&&s.inspected.includes(h.id)&&STATE.found.has(h.doc));
 const options='<option value="">Wybierz materiał</option>'+acquired.map(h=>`<option value="${h.id}">${esc(byId[h.doc]?.title||h.title)}</option>`).join('');
 const linked=draft&&c.needs.every(id=>draft.includes(id))&&draft.length===2;
 el.innerHTML=`<div class="sc-case-heading"><span>REKONSTRUKCJA STREFY</span><h3>${done?'Wniosek zapisany':linked?'Zestawienie źródeł':'Połącz dwa materiały'}</h3></div>`+
 (done?`<div class="sc-case-result"><b>Wniosek do dalszej weryfikacji</b><p>${esc(c.options[c.correct])}</p><small>${esc(s.roomCases[r].reasoning)}</small></div>`:
 `<p class="sc-case-intro">Po zbadaniu obiektów wybierz dwa materiały, które warto odczytać razem. Dopiero poprawne powiązanie otworzy rekonstrukcję wydarzeń w tej strefie.</p>
 <div class="sc-link-ui"><label>Materiał pierwszy<select id="scLinkA">${options}</select></label><label>Materiał drugi<select id="scLinkB">${options}</select></label></div>
 <div class="sc-actions"><button type="button" class="btn alt" id="scLinkApply">Zestaw materiały</button></div><div class="sc-case-feedback" id="scLinkFeedback" aria-live="polite"></div>`+
 (linked?`<div class="sc-side-by-side">${draft.map(id=>`<div><b>${esc(SC_BY_SPOT[id].title)}</b><p>${esc(SC_BY_SPOT[id].obs)}</p></div>`).join('')}</div>
 <p class="sc-case-question">${esc(c.question)}</p><div class="sc-case-options">${c.options.map((a,i)=>`<label><input type="radio" name="scCaseAnswer" value="${i}"><span>${esc(a)}</span></label>`).join('')}</div>${sc35Five('sc35-room-'+r,SC35_ROOM_REASONS[r])}<div class="sc-actions"><button class="btn" id="scCaseSubmit">Zapisz rekonstrukcję</button></div><div class="sc-case-feedback" id="scCaseFeedback" aria-live="polite"></div>`:'')
 );
 if(draft){if($('scLinkA'))$('scLinkA').value=draft[0]||'';if($('scLinkB'))$('scLinkB').value=draft[1]||'';}
 if($('scLinkApply'))$('scLinkApply').addEventListener('click',()=>{
  const a=$('scLinkA').value,b=$('scLinkB').value,feedback=$('scLinkFeedback');
  if(!a||!b||a===b){feedback.textContent='Wybierz dwa różne materiały zbadane w tej strefie.';return;}
  if(!acquired.some(h=>h.id===a)||!acquired.some(h=>h.id===b)){feedback.textContent='Oba materiały muszą być wcześniej zabezpieczone w aktach.';return;}
  if(!c.needs.every(id=>[a,b].includes(id))){delete s.caseDraft[r];feedback.textContent='To połączenie nie wyjaśnia głównej rozbieżności w tej strefie. Sprawdź inne źródła.';return;}
  s.caseDraft[r]=[a,b];scRenderRoomCase();
 });
 if($('scCaseSubmit'))$('scCaseSubmit').addEventListener('click',()=>{
  const checked=el.querySelector('[name=scCaseAnswer]:checked'),chosen=el.querySelector('[name="sc35-room-'+r+'"]:checked'),reason=chosen?SC35_ROOM_REASONS[r][Number(chosen.value)]:null,feedback=$('scCaseFeedback');
  if(!checked){feedback.textContent='Wybierz ustalenie, którego możesz bronić na podstawie źródeł.';return;}
  if(Number(checked.value)!==c.correct){feedback.textContent='To twierdzenie wykracza poza zebrane materiały. Wróć do obydwu źródeł i ich ograniczeń.';return;}
  if(!chosen){feedback.textContent='Wybierz jedno z pięciu uzasadnień.';return;}if(Number(chosen.value)!==0){feedback.textContent='To uzasadnienie nie wynika z obu zestawionych materiałów. Sprawdź, co potwierdza każde ze źródeł.';return;}
  if(!linked||!c.needs.every(id=>s.inspected.includes(id)&&STATE.found.has(SC_BY_SPOT[id].doc))){feedback.textContent='Najpierw połącz i zabezpiecz dwa źródła.';return;}
  s.roomCases[r]={answer:c.correct,reasoning:reason.slice(0,1800),reasonCode:'best'};delete s.caseDraft[r];scActivity('case',SC_ROOMS.find(x=>x.id===r).title);scRender();toast('Rekonstrukcja strefy zapisana.');
 });
}
function scAnalysisMarkup(h){const s=STATE.scene12,prev=s.analyses[h.id],docs=DOCS.filter(d=>STATE.found.has(d.id));
 const options='<option value="">Wybierz zdobyty dokument</option>'+docs.map(d=>`<option value="${esc(d.id)}">${esc(d.title)}</option>`).join('');
 return `<div class="rule"></div><div class="eyebrow">ANALIZA PRZEDMIOTU / METODA</div><div class="sc-detail-slab"><h4>Samodzielna ocena śladu</h4><p>Wybierz metodę i źródła, a następnie wskaż interpretację uwzględniającą granice dowodów. Sama analiza nie wskazuje sprawcy.</p></div>
 <label class="sc-field">Metoda analizy<select id="scAnalysisMethod">${Object.entries(SC_ANALYSIS_METHODS).map(([k,v])=>`<option value="${k}" ${prev?.method===k?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
 <label class="sc-field">Źródło pierwsze<select id="scAnalysisDoc1">${options}</select></label>
 <label class="sc-field">Źródło drugie (wymagane przy porównaniu)<select id="scAnalysisDoc2">${options}</select></label>
 ${sc35Five("sc35-analysis-"+h.id,sc35AnalysisOptions(h),prev?.reasonCode==="best"?"0":"")}${prev&&!prev.reasonCode?`<p class="muted tiny">Wcześniejszy zapis: ${esc(prev.reasoning)}</p>`:""}
 <div class="sc-actions"><button type="button" class="btn alt" id="scAnalysisSave">Zapisz analizę przedmiotu</button></div>
 ${prev?`<div class="sc-status ready">Analiza zapisana. Powiązane źródła: ${esc(prev.docs.join(', '))}. Możesz ją poprawić bez zmieniania oryginalnych akt.</div>`:''}`;
}
function scSaveAnalysis(h){const s=STATE.scene12;if(!s.inspected.includes(h.id))return;const method=$('scAnalysisMethod').value,a=$('scAnalysisDoc1').value,b=$('scAnalysisDoc2').value,chosen=document.querySelector('[name="sc35-analysis-'+h.id+'"]:checked');
 if(!SC_ANALYSIS_METHODS[method]||!STATE.found.has(a)){toast('Wskaż metodę i co najmniej jeden naprawdę zdobyty dokument.');return;}
 if(method==='compare'&&(!b||!STATE.found.has(b)||b===a||byId[a].family===byId[b].family)){toast('Porównanie wymaga dwóch różnych, niezależnych rodzin źródeł.');return;}
 if(!chosen){toast('Wybierz najlepiej uzasadnioną ocenę śladu.');return;}if(chosen.value!=='0'){toast('Ten wariant nie zgadza się z treścią lub zakresem zebranego źródła. Porównaj ustalenia.');return;}const reasoning=sc35AnalysisOptions(h)[0];
 const docs=method==='compare'?[a,b]:[a];
 s.analyses[h.id]={method,docs,reasoning:reasoning.slice(0,1800),reasonCode:'best'};scActivity('note','analiza punktu: '+h.title);scRender();toast('Zapisano analizę. Nie stanowi automatycznego rozstrzygnięcia.');
}
function scRenderActivity(){const s=STATE.scene12;const items=s.log.slice(0,18);$('scActivity').innerHTML=items.length?items.map((x,i)=>`<div class="sc-activity-row"><span class="sc-activity-num">${String(items.length-i).padStart(2,'0')}</span><div>${esc(x.text)}</div></div>`).join(''):'<div class="sc-empty">Dziennik zapełni się w miarę prowadzenia oględzin. Nie zastępuje notatnika gracza.</div>';}
function scAddNote(text,kind,ref){const s=STATE.scene12;const clean=String(text||'').trim().slice(0,3000);if(clean.length<3||s.notes.length>=160)return false;
 s.notes.unshift({id:s.seq++,text:clean,kind:Object.hasOwn(SC_KINDS,kind)?kind:'observation',ref:ref&&s.inspected.includes(ref)?ref:''});scActivity('note',ref&&SC_BY_SPOT[ref]?SC_BY_SPOT[ref].title:'notatka własna');scRenderNotebook();return true;
}
function scRenderNotebook(){if(!$('scNotebookList'))return;const s=STATE.scene12,$ref=$('scNoteRef');const current=$ref.value;
 const options=s.inspected.map(id=>SC_BY_SPOT[id]).filter(Boolean);
 $ref.innerHTML='<option value="">Notatka ogólna / bez obiektu</option>'+options.map(h=>`<option value="${h.id}">${esc(SC_ROOMS.find(r=>r.id===h.room).title+' — '+h.title)}</option>`).join('');if(options.some(h=>h.id===current))$ref.value=current;
 $('scNotebookCount').textContent=s.notes.length+' '+psPolishCount(s.notes.length,'zapis','zapisy','zapisów');
 $('scNotebookList').innerHTML=s.notes.length?s.notes.map(n=>{const h=SC_BY_SPOT[n.ref];return `<article class="sc-note"><div class="sc-note-top"><div><span class="sc-note-kind">${esc(SC_KINDS[n.kind])}</span> <strong>${esc(h?h.title:'Notatka ogólna')}</strong></div><small>#${n.id}</small></div><p>${esc(n.text)}</p>${h?`<small>${esc(SC_ROOMS.find(r=>r.id===h.room).title)}</small>`:''}<div class="formline"><button type="button" class="btn alt" data-sc-edit="${n.id}">Edytuj</button><button type="button" class="btn subtle" data-sc-remove="${n.id}">Usuń</button>${h?`<button type="button" class="btn subtle" data-sc-jump="${h.id}">Pokaż punkt</button>`:''}</div></article>`;}).join(''):'<div class="sc-empty">Brak wpisów z oględzin. Dodaj obserwację, hipotezę, pytanie lub możliwą sprzeczność.</div>';
 $('scNotebookList').querySelectorAll('[data-sc-edit]').forEach(b=>b.addEventListener('click',()=>{const n=s.notes.find(x=>x.id===Number(b.dataset.scEdit));if(!n)return;s.editNote=n.id;$('scNoteText').value=n.text;$('scNoteKind').value=n.kind;$('scNoteRef').value=n.ref;$('scNoteSave').textContent='Zapisz zmiany';$('scNoteCancel').hidden=false;$('scNoteText').focus();}));
 $('scNotebookList').querySelectorAll('[data-sc-remove]').forEach(b=>b.addEventListener('click',()=>{psAsk('Usunąć tę notatkę?',()=>{s.notes=s.notes.filter(x=>x.id!==Number(b.dataset.scRemove));scNoteCancel();scRenderNotebook();});}));
 $('scNotebookList').querySelectorAll('[data-sc-jump]').forEach(b=>b.addEventListener('click',()=>{const h=SC_BY_SPOT[b.dataset.scJump];s.room=h.room;s.selected=h.id;showTab('inspection12');}));
}
function scNoteCancel(){STATE.scene12.editNote=null;$('scNoteText').value='';$('scNoteKind').value='observation';$('scNoteRef').value='';$('scNoteSave').textContent='Dodaj notatkę';$('scNoteCancel').hidden=true;}
$('scNoteSave').addEventListener('click',()=>{const s=STATE.scene12,text=$('scNoteText').value.trim(),kind=$('scNoteKind').value,ref=$('scNoteRef').value;if(text.length<3){toast('Notatka wymaga co najmniej trzech znaków.');return;}
 if(s.editNote!==null){const n=s.notes.find(x=>x.id===s.editNote);if(n){n.text=text.slice(0,3000);n.kind=Object.hasOwn(SC_KINDS,kind)?kind:'observation';n.ref=s.inspected.includes(ref)?ref:'';}}else if(!scAddNote(text,kind,ref)){toast('Nie udało się dodać notatki.');return;}
 scNoteCancel();scRenderNotebook();toast('Zapisano notatkę.');});
$('scNoteCancel').addEventListener('click',scNoteCancel);
$('scGoNotes').addEventListener('click',()=>showTab('notebook'));

document.querySelectorAll('#photoGrid img').forEach((im,i)=>{im.src=CONTENT.images[i];});
renderAreas();renderDocs();renderEvents();tlRender();renderChat();scRender();scRenderNotebook();

/* ETAP 13 — finał. Walidacja opiera się na posiadanych dowodach i relacjach między źródłami. */
const FC_METHODS={
 two_stage:'Celowy pierwotny uraz głowy i późniejszy kontakt z podłożem',
 slip:'Jedno samoistne poślizgnięcie bez udziału drugiej osoby',
 wagon:'Samoczynny ruch tramwaju podczas próby technicznej',
 poison:'Zatrucie, a następnie utrata równowagi',
 unknown:'Nie da się odtworzyć mechanizmu'
};
const FC_ALIBIS={
 remote_not_presence:'Aktywna sesja nie potwierdza obecności; trasę trzeba odtworzyć z innych rejestrów',
 remote_proves:'Aktywne udostępnianie ekranu potwierdza ciągłą obecność przed komputerem',
 card_proves:'Użycie T-17 automatycznie wskazuje osobę wpisaną jako posiadacz karty',
 console_proves:'Zapis TCMS wskazuje osobę przebywającą przy stanowisku nr 3',
 no_need:'Alibi nie jest istotne, ponieważ znamy motyw'
};
const FC_ROLES={person:'Związek osoby i zdarzenia',method:'Mechanizm urazów',motive:'Konflikt / cel spotkania',alibi:'Weryfikacja alibi'};
const FC_CHALLENGES=[
 {id:'accident',title:'Hipoteza nieszczęśliwego wypadku',claim:'„Ofiara mogła po prostu się poślizgnąć. Zdarzenie mechaniczne w czujniku nie wskazuje napastnika.”',
  choices:['Dokładna minuta czujnika dowodzi, że ktoś zadał śmiertelny cios.','Porównać grupy obrażeń i sprawdzić, czego nie wyjaśnia pojedynczy upadek; czujnik traktować tylko jako kotwicę czasu.','Każdy uraz głowy powstaje w wyniku zamachu.','Wystarczy przyjąć, że świadkowie nie mówią prawdy.'],right:1,
  groups:[['MED-04','MED-09','MED-10'],['LAB-08']],
  concepts:[['uraz','obrazen','obrazen','glow','kontakt'],['upad','posliz','dwoch','dwoma','etap','mechanizm']]},
 {id:'contract',title:'Nadużycie dokumentacyjne to jeszcze nie zabójstwo',claim:'„Nawet podpis na błędnym protokole odbioru nie dowodzi, że jego autorka zabiła Lenę.”',
  choices:['Sama rozbieżność numerów części przesądza o sprawstwie przemocy.','Dokumentacja rozstrzyga jedynie motyw, więc nie wolno jej włączać do łańcucha poszlak.','Oddzielić konflikt odbiorowy od przemocy; powiązać go z niezależnie ustalonym zaproszeniem na spotkanie.','Kto pełnił funkcję audytora, musiał przebywać w niszy.'],right:2,
  groups:[['EVID_ACCEPTANCE_RECORD','TEC-09'],['EVID_SERIAL_PHOTO','TEC-07','TEC-15'],['EVID_MESSAGE_THREAD_RECOVERED']],
  concepts:[['odbior','dokument','zgodn','czesc','numer','protok'],['spotkan','wiadom','motyw','konflikt','zapros']]},
 {id:'message',title:'Kto naprawdę wysłał wiadomość?',claim:'„Wiadomość została wysłana z urządzenia służbowego. Ktoś inny mógł skorzystać z tego konta.”',
  choices:['Samo konto automatycznie identyfikuje nadawcę i osobę obecną na miejscu.','Połączyć treść wiadomości z metadanymi urządzenia, a ich ograniczenia skontrolować niezależną trasą.','Usunięta wiadomość jest z definicji fałszywa.','Jeśli nadawca jest znany, nagrania i przebieg nocy są zbędne.'],right:1,
  groups:[['EVID_MESSAGE_THREAD_RECOVERED'],['EVID_MESSAGE_DEVICE_METADATA'],['EVID_CCTV_SYNC','ADM-04','VIS-08']],
  concepts:[['wiadom','nadawc','konto','urzadzen','metadan'],['trasa','monitoring','kamer','przejsc','lokaliz','obecnos']]},
 {id:'card',title:'Pożyczony identyfikator T-17',claim:'„Odczyt karty pokazuje numer nośnika, nie twarz człowieka. Pożyczona karta równie dobrze wskazuje na kogoś innego.”',
  choices:['Przydział karty i tożsamość użytkownika są zawsze tym samym.','Odrzucić rejestr, ponieważ karty można przekazywać.','Sam kadr z drzwi wskazuje nazwisko, nawet jeśli twarz jest zasłonięta.','Połączyć historię przekazania, zdarzenie drzwi i niezależną sekwencję ruchu; nie utożsamiać numeru karty z osobą.'],right:3,
  groups:[['EVID_T17_DOOR_EVENT'],['EVID_RESOURCE_HANDOVER','ADM-07'],['VIS-08','EVID_CCTV_SYNC','ADM-04','VIS-09']],
  concepts:[['kart','identyfikator','nosnik','t 17','t17'],['drzwi','przekazan','tras','kamer','monitoring','przejsc']]},
 {id:'remote',title:'Wideokonferencja jako alibi',claim:'„Sesja trwała od 01:30 do 02:00. Jak jedna osoba mogła jednocześnie uczestniczyć w audycie i znaleźć się przy stanowisku nr 3?”',
  choices:['Odnotować różnicę między transmisją a fizyczną obecnością; ocenić interakcje komputera i wykonalną trasę w krytycznym czasie.','Uznać, że każda sesja z wyłączoną kamerą jest fałszywym alibi.','Przyjąć, że sam brak ruchu myszy dowodzi opuszczenia budynku.','Pominąć zapisy zegarów, skoro komputer nadal wysyłał obraz.'],right:0,
  groups:[['EVID_CONFERENCE_SESSION'],['DIG-09'],['ADM-04','EVID_CCTV_SYNC']],
  concepts:[['sesj','transmis','konferenc','komputer','ekran','prezentac'],['obecnos','tras','przejsc','wyjsc','przemieszcz','monitoring']]},
 {id:'traces',title:'Ślady z przedmiotu używanego przez wiele osób',claim:'„Włókna i powłoka mają tylko wspólne cechy materiałowe. Wiele osób mogło korzystać z tego wyposażenia.”',
  choices:['Podobny profil materiałowy oznacza bezsporną identyfikację właściciela.','Zestawić ograniczenia śladów kontaktowych z niezależnymi danymi o spotkaniu i trasie, bez przypisywania śladom wartości DNA.','Ponieważ ślad nie jest jednostkowy, wszystkie inne dowody też tracą znaczenie.','Liczba próbek sama określa liczbę osób biorących udział w zdarzeniu.'],right:1,
  groups:[['LAB-07','LAB-09'],['LAB-10','LAB-08'],['EVID_MESSAGE_THREAD_RECOVERED','ADM-04','EVID_CCTV_SYNC']],
  concepts:[['slad','wlok','material','pokrow','powlo','wyposaz'],['ogranicz','niejednoznac','poszlak','tras','wiadom','kontakt']]}
];
function fcDefault(){return {culprit:'',method:'',keystone:'',alibi:'',reasons:{person:'',method:'',proof:'',alibi:''},links:[],answers:{},submitted:false,feedback:'',defenseFeedback:'',attempts:0,checks:0};}
STATE.final13=fcDefault();
const fcOwned=()=>DOCS.filter(d=>STATE.found.has(d.id));
function fcChecks(){
 const e16=TL_MAP.get('e16'),e17=TL_MAP.get('e17');
 const timeline=!!(e16&&e17&&tlIsOpen(e16)&&tlIsOpen(e17)&&['e16','e17'].every(id=>tlAssessment(TL_MAP.get(id),STATE.timeline11.entries[id]).state==='ok'));
 const reviews=STATE.deduction.cards.map(c=>dd7Reasoning(c));
 const board=reviews.some(r=>r.ok);
 const boardIssue=reviews.length?reviews.sort((a,b)=>a.issues.length-b.issues.length)[0].issues[0]:'';
 const scene=STATE.scene12.inspected.some(id=>SC_BY_SPOT[id]?.room==='bay');
 return [
  {ok:timeline,label:'Spójne kotwice chronologii',help:'Na osi czasu zweryfikuj przedział medyczny oraz odrębne zdarzenie czujnika — wraz ze źródłem i uzasadnieniem.'},
  {ok:board,label:'Uzasadniony wniosek dedukcyjny',help:boardIssue||'Zapisz konkretną hipotezę: odrębne źródła, wyjaśnione role dowodów, alternatywa i możliwy sposób sprawdzenia.'},
  {ok:scene,label:'Oględziny miejsca zdarzenia',help:'Obejrzyj i zbadaj przynajmniej jeden punkt stanowiska nr 3.'}
 ];
}
function fcFamilies(ids){return new Set(ids.map(id=>byId[id]?.family||id)).size;}
function fcRoleDocs(role){return [...new Set(STATE.final13.links.filter(l=>l.role===role&&STATE.found.has(l.id)).map(l=>l.id))];}
function fcAllDocs(){return [...new Set(STATE.final13.links.filter(l=>STATE.found.has(l.id)).map(l=>l.id))];}
function fcHasGroup(ids,group){return ids.some(id=>group.includes(id));}

/* Akt końcowy: wnioski wielokrotnego wyboru oparte na relacjach dowodowych. */
const FC35_CHARGE={"person":["Treść wiadomości, dane urządzenia i niezależna analiza przejść mogą łącznie wspierać wskazanie osoby. Sam identyfikator konta lub karty jej nie rozpoznaje.","Rekonstrukcja wiadomości, dane urządzenia i zapis dostępu wskazują jedną osobę, jeśli konto i karta należały formalnie do tego samego pracownika.","Metadane sesji oraz poprawiona oś ruchu łączą komunikację z trasą, dlatego wystarczy potwierdzić godzinę logowania konta.","Ustalenie użytkownika karty pozwala wskazać autora wiadomości; dane terminala służą wówczas tylko do potwierdzenia czasu.","Odtworzona treść wiadomości i wykonalna trasa wskazują plan spotkania, co można uznać za identyfikację jego rzeczywistego inicjatora."],"method":["Dwie grupy urazów wymagają rozważenia odrębnych kontaktów. Materiały medyczne i porównawcze trzeba zestawić, nie utożsamiając śladu z człowiekiem.","Dwie grupy obrażeń można wyjaśnić dwoma uderzeniami tego samego elementu; podobieństwo materiału wystarcza do ustalenia narzędzia.","Opinia medyczna i profil kontaktowy wskazują więcej niż jeden mechanizm, a ich zgodność pozwala przypisać czyn konkretnej osobie.","Ustalenie odrębnych urazów pozwala wykluczyć upadek jako element przebiegu zdarzenia i skupić rekonstrukcję na działaniu celowym.","Materiałowe podobieństwo osłony i śladu pozwala ustalić narzędzie, a przedział zgonu można doprecyzować odczytem czujnika."],"proof":["Korespondencja i metadane łączą kontakt, czas i urządzenie, ale przypisanie działania osobie wymaga niezależnej kontroli źródeł.","Rekonstrukcja korespondencji wraz z metadanymi potwierdza spotkanie; wystarczającą kontrolą niezależną jest sam zapis użycia konta.","Wiadomość i historia urządzenia identyfikują nadawcę, natomiast CCTV wyznacza tylko kolejność zdarzeń po wysłaniu.","Odzyskany wątek jest osią aktu, więc zgodność jego fragmentów pozwala rozstrzygnąć przebieg rozmowy oraz udział autora w zdarzeniu.","Dane urządzenia i czas przesyłki stanowią dwa niezależne źródła identyfikacji, jeżeli występują pod tym samym identyfikatorem sesji."],"alibi":["Aktywna prezentacja nie jest obserwacją ciągłej obecności. Brak wejść klawiatury oraz czas drogi należy zestawić z innymi danymi o ruchu.","Brak aktywności klawiatury wyznacza przedział nieobecności, a wykonalna trasa pozwala ustalić, dokąd uczestniczka wyszła.","Aktywna konferencja potwierdza pracę stacji, więc przy zgodnym czasie CCTV można przyjąć nieprzerwaną obecność prowadzącej.","Zsynchronizowane logi komputera i drzwi wystarczą do dowodu przejścia, jeśli nie było interakcji z prezentacją.","Wykonalna trasa i przerwa wejść klawiatury pozwalają rozstrzygnąć alibi bez potrzeby osobnego ustalenia faktycznej osoby na nagraniu."]};
const FC35_DEFENSE={"accident":["Odrębne grupy obrażeń osłabiają hipotezę jednego poślizgu; badania porównawcze pomagają sprawdzić mechanizm. Sam impuls czujnika nie wskazuje osoby.","Dwie grupy obrażeń wymagają odrębnej analizy, jednak sam impuls czujnika wskazuje, która z nich powstała jako pierwsza.","Materiał kontaktowy przy osłonie osłabia hipotezę poślizgu, co można potraktować jako potwierdzenie działania innej osoby.","Porównanie medyczne wskazuje ograniczenia upadku, a zgodność z materiałem wyposażenia wystarcza do wskazania narzędzia.","Opis urazów pozostaje niejednoznaczny; rozbieżność z pomiarem czujnika przemawia więc za wykluczeniem hipotezy kontaktu."],"contract":["Spór odbiorowy może wyjaśniać okoliczności spotkania, ale nie dowodzi zabójstwa. Wiadomość i ruch wymagają odrębnej oceny.","Spór o odbiór tworzy tło zdarzenia, a powiązanie zmian w protokole z kontem pracownika pozwala wskazać uczestnika spotkania.","Odzyskana wiadomość i dokumentacja części wspólnie potwierdzają motyw, dlatego rekonstrukcja trasy służy jedynie ustaleniu czasu.","Rozbieżność odbiorowa wyjaśnia przyczynę konfliktu, a samo istnienie konfliktu pozwala odrzucić hipotezę przypadku.","Weryfikacja numerów podzespołów pozwala ustalić odpowiedzialnego za spór, co można uznać za wystarczające przypisanie czynu."],"message":["Odzyskaną treść trzeba zestawić z rejestrem sesji urządzenia i danymi trasy. Zgodność konta nie identyfikuje samodzielnie nadawcy.","Zgodność konta i urządzenia wraz z odzyskaną treścią pozwala ustalić nadawcę, jeśli metadane serwera są kompletne.","Fragmenty wiadomości odtwarzają jej treść, a zgodność godzin w logach wystarcza do połączenia autora z miejscem spotkania.","Wiadomość identyfikuje plan spotkania, więc kontrola fizycznego użycia urządzenia może zostać zastąpiona wpisem w rejestrze konta.","Odzyskane fragmenty są spójne, dlatego należy przypisać wysyłkę posiadaczowi terminala i osobno sprawdzić samą trasę."],"card":["T-17 potwierdza użycie identyfikatora. Historia wydania i niezależne zapisy ruchu pozwalają badać użytkownika, ale nie rozpoznają twarzy.","Rejestr użycia T-17 i przydział karty razem wskazują formalnego użytkownika; brak zgłoszonego wypożyczenia wystarcza do przypisania przejścia.","Zsynchronizowany monitoring uzupełnia odczyt T-17, dlatego odtwarza także tożsamość osoby widocznej w nieostrym kadrze.","Możliwość przekazania karty ogranicza wartość rejestru, ale nie podważa domyślnego przypisania jej użycia formalnemu właścicielowi.","Historia wydania identyfikatora ustala osobę odpowiedzialną za jego użycie; dane z kamer są jedynie dodatkowym potwierdzeniem godziny."],"remote":["Dziennik połączenia potwierdza sesję, nie nieprzerwaną obecność przy ekranie. Logi interakcji i czas drogi należy weryfikować osobno.","Transmisja wskazuje ciągłość sesji, a brak wpisów z klawiatury wystarcza do wyznaczenia przerwy w fizycznej obecności.","Aktywność połączenia i brak rozłączeń potwierdzają dostępność prowadzącej, więc droga do stanowiska nie wymaga weryfikacji.","Zestawienie zegarów komputera i drzwi wykazuje wykonalną trasę; można zatem przypisać nią przemieszczanie się uczestniczki sesji.","Wyłączona kamera nie ujawnia miejsca pobytu, ale w połączeniu z przerwą interakcji dowodzi opuszczenia stanowiska."],"traces":["Cechy włókien i powłoki wspierają hipotezę kontaktu, ale nie identyfikują osoby. Należy sprawdzić transfer i niezależne dane trasy.","Wspólne profile śladów potwierdzają kontakt z wyposażeniem, a zgodność ich cech wystarcza do przypisania źródła konkretnej sztuce odzieży.","Zgodne próbki wspierają mechanizm kontaktu; jeśli ślady występują w dwóch miejscach, można przyjąć tę samą osobę w obu punktach.","Porównanie włókien z powłoką wskazuje kontakt, co razem z trasą pozwala przypisać konkretnemu uczestnikowi przedmiot znaleziony w niszy.","Możliwy transfer wtórny trzeba rozważyć, ale zgodny profil smaru i włókien pozwala ustalić moment oraz kierunek nanoszenia śladów."]};
function fc35RenderCharge(){
 for(const id of ['person','method','proof','alibi']){
  const cap={person:'Person',method:'Method',proof:'Proof',alibi:'Alibi'}[id];
  const target=$('fcChoice'+cap),current=STATE.final13.reasons[id];
  if(!target)continue;
  target.innerHTML=sc35Five('fc35-charge-'+id,FC35_CHARGE[id],current==='best'?'0':'')+
   (current&&current!=='best'&&!current.startsWith('trap-')?'<p class="muted tiny">Zachowano uzasadnienie z wcześniejszego zapisu.</p>':'');
  target.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{
   $('fcWhy'+cap).value=input.value==='0'?'best':'trap-'+input.value;
   fcOnCharge();
  }));
 }
}
function fc35DefenseMarkup(q,selected){return sc35Five('fc35-defense-'+q.id,FC35_DEFENSE[q.id],selected==='best'?'0':'')+
 (selected&&selected!=='best'&&!selected.startsWith('trap-')?'<p class="muted tiny">Zachowano uzasadnienie z wcześniejszego zapisu.</p>':'');}

function fcArgued(text){const t=String(text||'').trim();if(t==='best')return true;const w=norm(t).split(' ').filter(x=>x.length>2);return t.length>=85&&w.length>=12&&new Set(w).size>=8;}
function fcChargeAssessment(){
 const s=STATE.final13,errors=[];
 for(const x of fcChecks())if(!x.ok)errors.push('Niespełniony warunek: '+x.label+'.');
 if(!s.culprit||!s.method||!s.keystone||!s.alibi)errors.push('Wypełnij wszystkie cztery rozstrzygnięcia.');
 for(const [id,label] of [['person','osoby'],['method','mechanizmu'],['proof','dowodu kluczowego'],['alibi','alibi']])if(!fcArgued(s.reasons[id]))errors.push('Wybierz właściwe uzasadnienie dotyczące '+label+'.');
 if(!STATE.found.has(s.keystone))errors.push('Kluczowy dowód musi faktycznie znajdować się w aktach.');
 const person=fcRoleDocs('person'),mechanism=fcRoleDocs('method'),motive=fcRoleDocs('motive'),alibi=fcRoleDocs('alibi');
 if(!fcHasGroup(person,['EVID_MESSAGE_THREAD_RECOVERED'])||!fcHasGroup(person,['EVID_MESSAGE_DEVICE_METADATA'])||!fcHasGroup(person,['EVID_CCTV_SYNC','ADM-04','VIS-08'])){
  errors.push('Związek osoby wymaga treści wiadomości, ustalenia źródła i niezależnej weryfikacji drogi.');
  const unrelated=person.find(id=>!['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','EVID_CCTV_SYNC','ADM-04','VIS-08'].includes(id));
  if(unrelated&&s.culprit){const explanation=explainAccusedPersonLink(unrelated);if(explanation)errors.push(explanation);}
 }
 if(!fcHasGroup(mechanism,['MED-04','MED-09','MED-10'])||!fcHasGroup(mechanism,['LAB-08','LAB-09'])||fcFamilies(mechanism)<2)errors.push('Mechanizm musi łączyć niezależne ustalenia medyczne i porównawcze.');
 if(!fcHasGroup(motive,['EVID_ACCEPTANCE_RECORD','TEC-09'])||!fcHasGroup(motive,['EVID_SERIAL_PHOTO','TEC-07','TEC-15']))errors.push('Konflikt dokumentacyjny wymaga porównania odbioru z niezależnym oznaczeniem części.');
 if(!fcHasGroup(alibi,['EVID_CONFERENCE_SESSION'])||!fcHasGroup(alibi,['DIG-09'])||!fcHasGroup(alibi,['ADM-04','EVID_CCTV_SYNC']))errors.push('Obalenie alibi musi rozdzielać ciągłość sesji, aktywność stacji i fizyczną wykonalność trasy.');
 if(fcAllDocs().length<9||fcFamilies(fcAllDocs())<7)errors.push('Oskarżenie wymaga co najmniej dziewięciu odrębnych materiałów z siedmiu rodzin źródłowych.');
 if(s.keystone&&!person.includes(s.keystone)){
  errors.push('Wybrany kluczowy dowód powiąż także z tezą o osobie.');
  if(STATE.found.has(s.keystone)){const mismatch=explainAccusedPersonLink(s.keystone);if(mismatch)errors.push(mismatch);}
 }
 // Tożsamość sprawcy rozstrzyga wyłącznie niezależny serwerowy werdykt.
 // Nie zdradzaj poprawnej odpowiedzi w przeglądarkowym walidatorze aktu.
 if(s.method&&s.method!=='two_stage')errors.push('Wybrany mechanizm nie wyjaśnia jednocześnie obu grup obrażeń.');
 if(s.keystone&&STATE.found.has(s.keystone)&&!['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA'].includes(s.keystone))errors.push('Kluczowy dowód nie łączy jeszcze dostatecznie osoby ze zdarzeniem; odróżnij motyw od czynu.');
 if(s.alibi&&s.alibi!=='remote_not_presence')errors.push('Rozumowanie o alibi przecenia pojedynczy zapis systemowy lub pomija trasę.');
 return {ok:errors.length===0,errors};
}
const FC_CAUTION=['nie dowod','nie oznacz','nie rozstrzyg','nie potwierdz','nie jest','nie wystarcz','nie identyfik','nie przesadz','ogranicz','sam','jedyn','wymaga','mozliw','mozna','tylko','poszlak','niejednoznacz','bez','chociaz','mimo','lecz','jednak','nie mozna'];
/* UX: rzeczowe diagnozy źródeł, bez podpowiadania konkretnego rozwiązania. */
const DEFENSE_EVIDENCE_DOMAINS={
 accident:'mechanizm obrażeń',contract:'motyw i konflikt dokumentacyjny',message:'autorstwo i fizyczną obecność',
 card:'tożsamość użytkownika identyfikatora',remote:'alibi i faktyczną obecność',traces:'znaczenie śladów kontaktowych'
};
const DEFENSE_EVIDENCE_GUIDANCE={
 accident:'Zestaw ustalenia medyczno-sądowe z niezależnym badaniem śladów. Sam znacznik czasu nie wyjaśnia mechanizmu obrażeń.',
 contract:'Rozdziel dokumentację odbiorową i konflikt interesów od bezpośredniego dowodu przemocy lub sprawstwa.',
 message:'Porównaj pochodzenie wiadomości, dane urządzenia i niezależne informacje o przemieszczaniu się osoby.',
 card:'Szukaj niezależnej weryfikacji użycia identyfikatora i trasy. Numer karty nie rozpoznaje użytkownika.',
 remote:'Porównaj historię sesji z aktywnością urządzenia oraz niezależną rekonstrukcją możliwej trasy.',
 traces:'Rozdziel zgodność materiałową od indywidualnej identyfikacji człowieka; skonfrontuj ślady z innym typem źródła.'
};
const DEFENSE_INTERPRETATION_ERRORS={
 accident:{1:'Odczyt czujnika porządkuje chronologię, lecz nie rozpoznaje rodzaju obrażenia ani sprawcy.',3:'Rodzaj urazu nie przesądza sam o działaniu konkretnej osoby.',4:'Brak nagrania nie unieważnia niezależnie przeprowadzonych badań medycznych.'},
 contract:{1:'Protokół może dokumentować niezgodność i interes w zatajeniu, ale sam nie dowodzi zabójstwa.',2:'Podpis na dokumencie nie ustala chwili zgonu. To inny zakres ustaleń.',4:'Wykryta korekta nie oznacza, że wszystkie dokumenty z tej placówki są fałszywe.'},
 message:{0:'Identyfikator konta opisuje dostęp cyfrowy, nie potwierdza automatycznie osoby fizycznej.',2:'Zaproszenie na spotkanie nie jest dowodem, że spotkanie się odbyło.',3:'Usunięcie wiadomości nie czyni jej bezwartościową; znaczenie ma wiarygodność odzyskania.'},
 card:{0:'Rejestr karty identyfikuje nośnik, a nie osobę przechodzącą przez drzwi.',2:'Możliwość przekazania karty ogranicza wniosek, ale nie pozwala odrzucić całego rejestru.',4:'Osoba wydająca identyfikator nie musi być osobą, która go później użyła.'},
 remote:{0:'Trwająca wideokonferencja nie potwierdza ciągłej obecności przy komputerze.',1:'Brak aktywności klawiatury nie wykazuje sam, że ktoś opuścił pomieszczenie.',3:'Niepewność co do obecności nie uzasadnia pominięcia całego rejestru sesji.'},
 traces:{0:'Zgodność klasowa włókien lub smaru nie jest indywidualnym rozpoznaniem człowieka.',2:'Ślad niejednostkowy nadal może mieć znaczenie po zestawieniu z niezależnym materiałem.',4:'Podobny profil materiałowy nie jest odpowiednikiem indywidualnego profilu DNA.'}
};
function classifyDefenseEvidence(evidenceId){
 const doc=byId[evidenceId];if(!doc)return 'unknown';
 const id=String(doc.id||''),title=norm(doc.title||'');
 if(['MED-01','MED-03','DIG-10','EVID_TCMS_SESSION'].includes(id)||/czas zgonu|godzin|alarmow|harmonogram|czas zdarzen/.test(title))return 'timeline';
 if(/sekcj|obrazen|uraz|powierzchn|włok|wlok|smar|kontaktow|slad|materialow|badanie porownawcze/.test(title)||id.startsWith('LAB-'))return 'forensic';
 if(/kart|identyfikator|monitoring|kamer|cctv|przejsc|wejsc|wideokonferenc|sesj/.test(title))return 'presence';
 if(/wiadom|korespondenc|metadan|urzadzen/.test(title))return 'communication';
 if(/protokol|odbior|podzespol|dokument|zmian|serwis|zleceni/.test(title))return 'technical';
 if(id.startsWith('MED-'))return 'medical';
 if(id.startsWith('DIG-')||id.startsWith('ADM-'))return 'records';
 return 'other';
}
function explainDefenseEvidenceMismatch(challenge,selectedEvidenceIds){
 const ids=[...new Set(selectedEvidenceIds)].filter(id=>STATE.found.has(id)&&byId[id]);
 const expected=new Set(challenge.groups.flat());
 const mismatch=ids.find(id=>!expected.has(id));
 if(!mismatch)return '';
 const doc=byId[mismatch],domain=classifyDefenseEvidence(mismatch),title='„'+doc.title+'”';
 if(domain==='timeline'&&['accident','contract','traces'].includes(challenge.id))
  return 'Dokument '+title+' ustala przede wszystkim kolejność lub czas zdarzeń. Nie stanowi samodzielnego dowodu na '+DEFENSE_EVIDENCE_DOMAINS[challenge.id]+'. '+DEFENSE_EVIDENCE_GUIDANCE[challenge.id];
 if(domain==='technical'&&['accident','traces'].includes(challenge.id))
  return 'Dokument '+title+' opisuje dokumentację lub stan techniczny, ale nie rozstrzyga bezpośrednio mechanizmu obrażeń. '+DEFENSE_EVIDENCE_GUIDANCE[challenge.id];
 if(domain==='forensic'&&['contract','message','card','remote'].includes(challenge.id))
  return 'Materiał '+title+' dotyczy obrażeń lub śladów. Nie ustala samodzielnie '+DEFENSE_EVIDENCE_DOMAINS[challenge.id]+'. '+DEFENSE_EVIDENCE_GUIDANCE[challenge.id];
 if(domain==='presence'&&['contract','accident','traces'].includes(challenge.id))
  return 'Zapis '+title+' może wskazywać zdarzenie dostępu albo przemieszczania, ale nie dowodzi sam w sobie '+DEFENSE_EVIDENCE_DOMAINS[challenge.id]+'. '+DEFENSE_EVIDENCE_GUIDANCE[challenge.id];
 return 'Materiał '+title+' nie pokrywa jednego z wymaganych aspektów zarzutu: '+DEFENSE_EVIDENCE_DOMAINS[challenge.id]+'. '+DEFENSE_EVIDENCE_GUIDANCE[challenge.id];
}
function explainDefenseEvidenceIndependence(challenge,selectedEvidenceIds){
 const ids=[...new Set(selectedEvidenceIds)].filter(id=>STATE.found.has(id)&&byId[id]);
 const covered=challenge.groups.filter(group=>group.some(id=>ids.includes(id))).length;
 if(covered===challenge.groups.length&&fcFamilies(ids)>=challenge.groups.length)return '';
 if(ids.length===0)return 'Nie wskazano źródeł. Dobierz już zdobyte materiały dotyczące różnych aspektów zarzutu i porównaj ich ograniczenia.';
 if(fcFamilies(ids)<Math.min(ids.length,challenge.groups.length))return 'Wybrane materiały pochodzą z tej samej rodziny źródeł. Powielenie tego samego rejestru nie daje niezależnego potwierdzenia.';
 return 'Wybrane źródła obejmują '+covered+' z '+challenge.groups.length+' wymaganych aspektów zarzutu. Brakuje niezależnej podstawy do pozostałej części odpowiedzi.';
}
function explainAccusedPersonLink(evidenceId){
 const doc=byId[evidenceId],person=CONTENT.characters.find(person=>person.id===STATE.final13.culprit);
 if(!doc||!person)return '';
 const surname=norm(person.name.split(/\s+/).slice(-1).join(' '));
 const text=norm([doc.title,doc.issuer,doc.body].join(' '));
 if(surname&&text.includes(surname))return '';
 return 'Dokument „'+doc.title+'” nie wskazuje bezpośrednio wybranej oskarżonej osoby ('+person.name+'). Samo ustalenie czasu, miejsca albo niezgodności technicznej nie stanowi jeszcze przypisania czynu. Porównaj niezależne źródła identyfikacji i przemieszczania.';
}
function explainDefenseRouteUnavailable(route){
 const missing=route.docs.filter(id=>!STATE.found.has(id));
 const unverified=route.docs.filter(id=>STATE.found.has(id)&&!ps54Good(id));
 if(missing.length)return 'W wybranym zestawie brakuje '+psCount(missing.length,'materiału','materiałów','materiałów')+'. Wróć do zdobywania źródeł; samo wybranie wariantu nie zastępuje ich zabezpieczenia.';
 if(unverified.length)return 'Zebrano potrzebne materiały, ale '+unverified.length+' wymaga dalszej kontroli wiarygodności. Sprawdź audyt źródeł i niezależne potwierdzenia przed przedstawieniem odpowiedzi.';
 if(!route.independent)return 'Wybrane materiały nie są dostatecznie niezależne. Dwa odczyty pochodzące z tego samego systemu mogą powtarzać jeden błąd.';
 return 'Zestaw nie spełnia jeszcze wymagań jakości. '+ 'Ustal ograniczenia wiarygodności i sprawdź zgodność niezależnych źródeł.';
}
function explainDefenseInterpretation(issue,answerIndex){
 return DEFENSE_INTERPRETATION_ERRORS[issue.id]?.[answerIndex]||'Wybrane uzasadnienie wykracza poza zakres materiałów. Oddziel to, co źródło opisuje, od wniosku o osobie, motywie lub mechanizmie.';
}

function fcChallengeAssessment(q,a){
 const errors=[],ids=[...new Set(Array.isArray(a?.ids)?a.ids:[])].filter(id=>STATE.found.has(id)&&byId[id]);
 if(Number(a?.strategy)!==q.right)errors.push('Przyjęta strategia nie odpowiada granicom dowodów przedstawionych przez obronę.');
 if(ids.length<q.groups.length||fcFamilies(ids)<q.groups.length||!q.groups.every(g=>fcHasGroup(ids,g))){
  const mismatch=explainDefenseEvidenceMismatch(q,ids),independence=explainDefenseEvidenceIndependence(q,ids);
  errors.push(mismatch||independence||'Zestaw nie obejmuje niezależnych źródeł niezbędnych do oceny tego zarzutu.');
  if(mismatch&&independence)errors.push(independence);
 }
 const t=String(a?.text||'').trim(),n=norm(t);
 if(t!=='best'){if(t.startsWith('trap-')||!t)errors.push('Wybierz uzasadnienie, które uwzględnia oba źródła i ograniczenia dowodu.');else{if(t.length<100)errors.push('Wybierz poprawne uzasadnienie lub zachowaj wcześniej zaliczony argument.');if(!q.concepts.every(g=>g.some(x=>n.includes(x))))errors.push('Wyjaśnienie nie obejmuje obu części zarzutu.');if(!FC_CAUTION.some(x=>n.includes(x)))errors.push('Wyjaśnienie pomija ograniczenia poszlaki.');}}
 return {ok:errors.length===0,errors};
}
function fcDefenseDone(){return FC_CHALLENGES.filter(q=>fcChallengeAssessment(q,STATE.final13.answers[q.id]).ok).length;}
function fcCompletion(){const s=STATE.final13;return s.submitted&&fcChargeAssessment().ok&&fcDefenseDone()===FC_CHALLENGES.length;}
function fcExport(){const s=STATE.final13;return {culprit:s.culprit,method:s.method,keystone:s.keystone,alibi:s.alibi,reasons:s.reasons,links:s.links,answers:s.answers};}
function fcRestore(data){const s=fcDefault(),f=data&&typeof data==='object'?data:{};
 s.culprit=CONTENT.characters.some(c=>c.id===f.culprit)?f.culprit:'';
 s.method=Object.hasOwn(FC_METHODS,f.method)?f.method:'';
 s.keystone=typeof f.keystone==='string'&&STATE.found.has(f.keystone)?f.keystone:'';
 s.alibi=Object.hasOwn(FC_ALIBIS,f.alibi)?f.alibi:'';
 for(const id of Object.keys(s.reasons))s.reasons[id]=String(f.reasons?.[id]||'').slice(0,4000);
 const seen=new Set();s.links=(Array.isArray(f.links)?f.links:[]).filter(x=>x&&STATE.found.has(x.id)&&Object.hasOwn(FC_ROLES,x.role)).filter(x=>{const k=x.role+':'+x.id;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,65).map(x=>({id:x.id,role:x.role}));
 for(const q of FC_CHALLENGES){const raw=f.answers?.[q.id];if(!raw||typeof raw!=='object')continue;
  s.answers[q.id]={strategy:/^[0-3]$/.test(String(raw.strategy))?String(raw.strategy):'',ids:(Array.isArray(raw.ids)?[...new Set(raw.ids)]:[]).filter(id=>STATE.found.has(id)&&byId[id]).slice(0,3),text:String(raw.text||'').slice(0,3500)};
 }
 STATE.final13=s;s.submitted=fcChargeAssessment().ok;
}
function fcReset(){STATE.final13=fcDefault();}
function fcSourceOptions(selected=''){return '<option value="">— wybierz zdobyty dowód —</option>'+fcOwned().map(d=>`<option value="${esc(d.id)}" ${d.id===selected?'selected':''}>${esc(d.title)}</option>`).join('');}
function fcPutValues(){const s=STATE.final13;
 $('fcCulprit').value=s.culprit;$('fcMethod').value=s.method;$('fcKeystone').innerHTML=fcSourceOptions(s.keystone);$('fcKeystone').value=s.keystone;
 $('fcAlibi').value=s.alibi;for(const id of Object.keys(s.reasons))$('fcWhy'+({person:'Person',method:'Method',proof:'Proof',alibi:'Alibi'}[id])).value=s.reasons[id];fc35RenderCharge();
 $('fcAddSource').innerHTML=fcSourceOptions($('fcAddSource').value);
}
function fcNotice(el,msg,ok=false){el.textContent=msg;el.className='fc-feedback'+(msg?(ok?' ok':' error'):'');}
function fcRefreshSide(){const checks=fcChecks();$('fcChecklist').innerHTML=checks.map(x=>`<div class="fc-check ${x.ok?'ok':'missing'}"><b>${x.ok?'✓':'○'} ${esc(x.label)}</b><span>${esc(x.ok?'Warunek spełniony.':x.help)}</span></div>`).join('');
 const cards=STATE.deduction.cards.filter(c=>c.links.length>0).slice(0,7);$('fcBoardHints').innerHTML=cards.length?cards.map(c=>`<div><b>${esc(c.title)}</b><div>${esc(c.kind)} • ${c.links.length} połączeń</div></div>`).join(''):'<p class="fc-empty">Nie zapisano jeszcze hipotez. Przejdź do tablicy i połącz źródła.</p>';
}
function fcRenderLinks(){const s=STATE.final13;$('fcLinks').innerHTML=s.links.length?s.links.map((l,i)=>`<div class="fc-proof"><span><b>${esc(FC_ROLES[l.role])}</b> · ${esc(docName(l.id))}</span><button type="button" data-fc-remove="${i}" aria-label="Usuń powiązanie ${esc(l.id)}">×</button></div>`).join(''):'<div class="fc-empty">Brak powiązanych źródeł. Wybierz dowód i jego rolę.</div>';
 $('fcLinks').querySelectorAll('[data-fc-remove]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.fcRemove);if(i>=0&&i<s.links.length){s.links.splice(i,1);fcInvalidate();fcRender();}}));
}
function fcRenderProgress(){const done=fcDefenseDone(),s=STATE.final13;const verdict=fcCompletion();$('fcProgress').innerHTML=[
 ['I. Zbudowanie aktu',s.submitted&&fcChargeAssessment().ok?'Przyjęto do konfrontacji':'Projekt wymaga uzasadnienia',s.submitted&&fcChargeAssessment().ok],
 ['II. Odpowiedzi na obronę',done+' / '+FC_CHALLENGES.length+' zweryfikowanych argumentów',done===FC_CHALLENGES.length],
 ['III. Ocena końcowa',verdict?'Przeprowadzono skuteczną obronę':'Wymaga ukończenia wszystkich zarzutów',verdict]
 ].map(([t,desc,ok])=>`<div class="${ok?'ready':''}"><b>${esc(t)}</b>${esc(desc)}</div>`).join('');}
function fcRender(){if(!$('fcProgress'))return;fcPutValues();fcRefreshSide();fcRenderLinks();fcRenderProgress();
 const s=STATE.final13,chargeOK=s.submitted&&fcChargeAssessment().ok;
 $('fcDefense').hidden=!chargeOK;
 $('fcDefenseCount').textContent=fcDefenseDone()+' / '+FC_CHALLENGES.length;
 fcNotice($('fcChargeFeedback'),s.feedback,s.submitted&&chargeOK);
 if(chargeOK)fcRenderDefense();
 fcNotice($('fcDefenseFeedback'),s.defenseFeedback,fcCompletion());
 $('fcVerdictPanel').hidden=!fcCompletion();if(fcCompletion())fcRenderVerdict();
}
function fcOnCharge(){const s=STATE.final13;if(s.submitted){s.submitted=false;s.answers={};s.defenseFeedback='';}s.feedback='';
 s.culprit=$('fcCulprit').value;s.method=$('fcMethod').value;s.keystone=$('fcKeystone').value;s.alibi=$('fcAlibi').value;
 for(const [id,suffix] of Object.entries({person:'Person',method:'Method',proof:'Proof',alibi:'Alibi'}))s.reasons[id]=$('fcWhy'+suffix).value.slice(0,4000);
 fcRenderProgress();$('fcDefense').hidden=true;$('fcVerdictPanel').hidden=true;fcNotice($('fcChargeFeedback'),'');
}
function fcInvalidate(){if(STATE.final13.submitted){STATE.final13.submitted=false;STATE.final13.answers={};STATE.final13.defenseFeedback='';}STATE.final13.feedback='';}
function fcRenderDefense(){const s=STATE.final13,el=$('fcDefenseList');el.innerHTML=FC_CHALLENGES.map((q,i)=>{const a=s.answers[q.id]||{strategy:'',ids:[],text:''},checked=fcChallengeAssessment(q,a).ok;
 return `<article class="fc-challenge ${checked?'passed':''}" id="fcChallenge_${esc(q.id)}"><div class="fc-challenge-top"><h4>Zarzut ${i+1} / ${FC_CHALLENGES.length} · ${esc(q.title)}</h4><span class="chip">${checked?'OBRONIONO':'DO ROZSTRZYGNIĘCIA'}</span></div><blockquote>${esc(q.claim)}</blockquote><label class="fc-long">Jaką strategię rozumowania przyjmujesz?<select data-fc-strategy="${esc(q.id)}"><option value="">— wybierz sposób odpowiedzi —</option>${q.choices.map((t,j)=>`<option value="${j}" ${String(j)===a.strategy?'selected':''}>${esc(t)}</option>`).join('')}</select></label><div class="fc-challenge-controls">${[0,1,2].map(j=>`<label>Źródło ${j+1}<select data-fc-doc="${esc(q.id)}" data-fc-index="${j}">${fcSourceOptions(a.ids[j]||'')}</select></label>`).join('')}</div>${fc35DefenseMarkup(q,a.text)}<div class="fc-actions"><button type="button" class="btn alt" data-fc-check="${esc(q.id)}">Sprawdź odpowiedź</button><span class="muted tiny">Odpowiedź wymaga powiązania niezależnych źródeł, a nie tylko wyboru wariantu.</span></div><div class="fc-challenge-result" data-fc-result="${esc(q.id)}">${checked?'Argument zaliczony: strategia, niezależne źródła i ograniczenie zostały wskazane.':''}</div></article>`;
 }).join('');
 el.querySelectorAll('[data-fc-check]').forEach(btn=>btn.addEventListener('click',()=>fcCheckChallenge(btn.dataset.fcCheck)));
}
function fcReadDefense(id){const card=$('fcChallenge_'+id);if(!card)return;
 const strategy=card.querySelector('[data-fc-strategy]').value;
 const ids=[...new Set([...card.querySelectorAll('[data-fc-doc]')].map(el=>el.value).filter(Boolean))];
 const choice=card.querySelector('[name="fc35-defense-'+id+'"]:checked');const prev=STATE.final13.answers[id]?.text||'';const text=choice?(choice.value==='0'?'best':'trap-'+choice.value):(prev&&!prev.startsWith('trap-')?prev:'');
 STATE.final13.answers[id]={strategy,ids,text};
}
function fcCheckChallenge(id){const q=FC_CHALLENGES.find(x=>x.id===id);if(!q||!STATE.final13.submitted)return;
 fcReadDefense(id);STATE.final13.checks++;
 const assessment=fcChallengeAssessment(q,STATE.final13.answers[id]);
 if(assessment.ok){STATE.final13.defenseFeedback='';fcRender();$('fcChallenge_'+id).scrollIntoView({block:'nearest'});}
 else{const result=$('fcChallenge_'+id).querySelector('[data-fc-result]');result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.textContent='Dlaczego odpowiedź nie została zaliczona:\n• '+assessment.errors.join('\n• ');}
 fcRenderProgress();$('fcDefenseCount').textContent=fcDefenseDone()+' / '+FC_CHALLENGES.length;
}
function fcRenderVerdict(){const s=STATE.final13,c=CONTENT.characters.find(x=>x.id===s.culprit),div=$('fcVerdictPanel');
 // Ocena proceduralna nie potwierdza osoby; tylko wynik zatwierdzony przez serwer.

 div.innerHTML=`<div class="eyebrow">PODSUMOWANIE POSTĘPOWANIA</div><h3>Lokalna kontrola argumentacji zakończona</h3><p>Zebrano odrębne podstawy wnioskowania o mechanizmie, konflikcie, kontakcie i trasie. Odpowiedzi nie traktowały karty, zapisu sesji ani podobieństwa materiałowego jako bezspornego rozpoznania osoby.</p><div class="fc-final-summary"><div><b>Oskarżona osoba:</b> ${esc(c?.name||'—')}</div><div><b>Przedstawiona rekonstrukcja:</b> ${esc(FC_METHODS[s.method]||'—')}</div><div><b>Dowód osiowy:</b> ${esc(s.keystone)} · ${esc(byId[s.keystone]?.title||'')}</div><div><b>Alibi:</b> ${esc(FC_ALIBIS[s.alibi]||'—')}</div><div><b>Zastosowane źródła:</b> ${fcAllDocs().length} odrębnych materiałów; argumenty obronne: ${FC_CHALLENGES.length}/${FC_CHALLENGES.length}</div></div><p><b>Uwaga:</b> to lokalna kontrola warsztatu i przedstawionych źródeł. Nie potwierdza prawidłowego wskazania osoby; końcowy wynik wymaga zatwierdzenia na serwerze. Nawet prawidłowo połączone poszlaki mają ograniczenia i nie zastępują rzeczywistego postępowania dowodowego.</p><div class="fc-actions"><button type="button" class="btn alt" id="fcExportFinal">Zapisz akta sprawy</button></div>`;
 $('fcExportFinal').addEventListener('click',exportSave);
}
// Zachowuj rozpoczęte odpowiedzi na pozostałe zarzuty również po przerysowaniu pojedynczej karty.
for(const eventType of ['input','change'])$('fcDefenseList').addEventListener(eventType,e=>{
 const card=e.target.closest('.fc-challenge');if(!card||!STATE.final13.submitted)return;
 const id=card.id.replace('fcChallenge_','');if(FC_CHALLENGES.some(q=>q.id===id))fcReadDefense(id);
});
$('fcCulprit').innerHTML='<option value="">— wskaż rozmówcę —</option>'+CONTENT.characters.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
$('fcMethod').innerHTML='<option value="">— wybierz rekonstrukcję —</option>'+Object.entries(FC_METHODS).map(([k,v])=>`<option value="${esc(k)}">${esc(v)}</option>`).join('');
$('fcAlibi').innerHTML='<option value="">— wybierz wniosek —</option>'+Object.entries(FC_ALIBIS).map(([k,v])=>`<option value="${esc(k)}">${esc(v)}</option>`).join('');
for(const el of ['fcCulprit','fcMethod','fcKeystone','fcAlibi','fcWhyPerson','fcWhyMethod','fcWhyProof','fcWhyAlibi'])$(el).addEventListener('input',fcOnCharge);
$('fcAddLink').addEventListener('click',()=>{const s=STATE.final13,id=$('fcAddSource').value,role=$('fcAddRole').value;
 if(!STATE.found.has(id)||!Object.hasOwn(FC_ROLES,role)){toast('Wybierz zdobyty dowód i rolę w rozumowaniu.');return;}
 if(s.links.some(x=>x.id===id&&x.role===role)){toast('Takie powiązanie już jest na liście.');return;}
 if(s.links.length>=65){toast('Osiągnięto maksymalną liczbę połączeń.');return;}
 s.links.push({id,role});fcInvalidate();fcRender();});
$('fcSubmit').addEventListener('click',()=>{const s=STATE.final13;fcOnCharge();s.attempts++;
 const audit=fcChargeAssessment();s.submitted=audit.ok;
 s.feedback=audit.ok?'Akt dopuszczono do konfrontacji. Teraz obroń każdy wniosek przed sześcioma alternatywnymi odczytaniami akt.':'Akt wymaga uzupełnienia:\n• '+audit.errors.slice(0,14).join('\n• ');
 fcRender();if(audit.ok)$('fcDefense').scrollIntoView({behavior:'smooth',block:'start'});
});
$('fcVerdict').addEventListener('click',()=>{const s=STATE.final13;
 for(const q of FC_CHALLENGES)fcReadDefense(q.id);
 const done=fcDefenseDone(),missing=FC_CHALLENGES.filter(q=>!fcChallengeAssessment(q,s.answers[q.id]).ok).map(q=>q.title);
 s.defenseFeedback=done===FC_CHALLENGES.length?'Wszystkie sześć kontrargumentów otrzymało obronę popartą źródłami. Wynik znajduje się poniżej.':'Pozostały argumenty bez dostatecznej obrony ('+done+'/'+FC_CHALLENGES.length+'):\n• '+missing.join('\n• ');
 fcRender();if(fcCompletion())$('fcVerdictPanel').scrollIntoView({behavior:'smooth',block:'start'});
});
$('fcEditCharge').addEventListener('click',()=>{STATE.final13.submitted=false;STATE.final13.answers={};STATE.final13.feedback='Zmiana oskarżenia wymaga ponownej obrony argumentów.';STATE.final13.defenseFeedback='';fcRender();$('fcCulprit').scrollIntoView({behavior:'smooth',block:'center'});});
$('fcClear').addEventListener('click',()=>{psAsk('Wyczyścić projekt aktu i odpowiedzi na zarzuty?',()=>{fcReset();fcRender();});});
$('fcGoEvidence').addEventListener('click',()=>showTab('evidence'));
$('fcGoDeduction').addEventListener('click',()=>showTab('deduction'));
$('fcGoTimeline').addEventListener('click',()=>showTab('timeline'));
fcRender();


/* ETAP 14 · nawigacja, wskaźniki sesji, obsługa mobilna */
const UI14_TITLES={overview:'Pulpit',evidence:'Akta',search:'Poszukiwania',interview:'Przesłuchania',timeline:'Oś czasu',inspection12:'Oględziny',notebook:'Notatnik',labs:'Analizy',deduction:'Dedukcja',final:'Finał'};
let ui14UpdateQueued=false;
/* Etapy pochodzą z rzeczywistych walidatorów finału (fcChecks / fcChargeAssessment /
   fcDefenseDone), nie z procentu zdobytych dokumentów. Nie tworzymy dodatkowych bramek. */
const UI15_CHECKS=[
 {label:'Chronologia zdarzeń',detail:'Sprawdź źródła i uporządkuj kluczowe zapisy na osi czasu.',tab:'timeline'},
 {label:'Wniosek dedukcyjny',detail:'Połącz niezależne źródła i zapisz własne uzasadnienie.',tab:'deduction'},
 {label:'Oględziny miejsca zdarzenia',detail:'Zbadaj co najmniej jeden punkt na miejscu zdarzenia.',tab:'inspection12'}
];
function ui15Status(){
 const checks=fcChecks();
 const done=checks.filter(c=>c.ok).length;
 const charge=!!STATE.final13?.submitted&&fcChargeAssessment().ok;
 const defended=charge?fcDefenseDone():0;
 const complete=charge&&defended===FC_CHALLENGES.length;
 return {checks,done,charge,defended,complete};
}
function ui14Update(){
 const progress=ui15Status(),saved=STATE.found.size;
 const talked=CONTENT.characters.filter(c=>(STATE.dialogues[c.id]||[]).some(m=>m.role==='player')).length;
 const timeline=Object.values(STATE.timeline11?.entries||{}).filter(e=>e?.at).length;
 const observed=STATE.scene12?.inspected?.length||0;
 const stage=progress.complete?'Zakończono':progress.charge?'Przyjęty':progress.done===progress.checks.length?'Do opracowania':'W przygotowaniu';
 const items=[
  [progress.done+' / '+progress.checks.length,'Wstępne ustalenia'],
  [stage,'Akt oskarżenia'],
  [progress.defended+' / '+FC_CHALLENGES.length,'Obrona argumentów']
 ];
 $('ui14Stats').innerHTML=items.map(([value,label])=>'<div class="ui14-stat"><b>'+esc(value)+'</b><span>'+esc(label)+'</span></div>').join('');
 $('ui14EvidencePercent').textContent=progress.done+' / '+progress.checks.length;
 $('ui14ProgressFill').style.width=Math.round(progress.done/Math.max(1,progress.checks.length)*100)+'%';
 $('ui14Progress').setAttribute('aria-valuemax',String(progress.checks.length));
 $('ui14Progress').setAttribute('aria-valuenow',String(progress.done));
 const next=progress.checks.findIndex(c=>!c.ok);
 $('ui15NextAction').textContent=progress.complete?'Dochodzenie zakończone. Możesz wrócić do akt i ocenić pominięte tropy.':
  progress.charge?'Akt został przyjęty. Pozostała obrona argumentów w finale ('+progress.defended+'/'+FC_CHALLENGES.length+').':
  next<0?'Ustalenia wstępne są gotowe. Możesz przygotować akt oskarżenia; potrzebne będą jeszcze dokumenty i obrona wniosków.':
  'Sugerowany kierunek: '+({scene:'oględziny miejsca zdarzenia',timeline:'weryfikacja chronologii',board:'uzasadnienie hipotezy'}[ps95Select().type]||UI15_CHECKS[next].label.toLowerCase())+'. Pozostałe działania możesz wykonywać we własnej kolejności.';
 const finalAction=$('ui15FinalAction');
 finalAction.hidden=progress.done!==progress.checks.length;
 $('ui15GoFinal').textContent=progress.complete?'Zobacz zakończenie':progress.charge?'Przejdź do obrony':'Przejdź do aktu oskarżenia';
 $('ui15Checklist').innerHTML=progress.checks.map((check,i)=>{
  const info=UI15_CHECKS[i]||{label:check.label,detail:'Sprawdź powiązane dowody.',tab:'final'};
  return '<div class="ui15-check '+(check.ok?'is-done':'')+'"><div class="ui15-check-state" aria-label="'+(check.ok?'Ukończono':'Do wykonania')+'">'+(check.ok?'✓':'○')+'</div><div class="ui15-check-text"><b>'+esc(info.label)+'</b><p>'+esc(check.ok?'Warunek potwierdzony na podstawie ustaleń.':info.detail)+'</p></div><button type="button" class="btn alt ui15-check-link" data-ui15-go="'+esc(info.tab)+'">'+(check.ok?'Przejrzyj':'Sprawdź')+'</button></div>';
 }).join('');
 $('ui15ExploreStats').innerHTML=[
  [saved+' / '+DOCS.length,'Materiały w aktach'],
  [talked+' / '+CONTENT.characters.length,'Przesłuchani świadkowie'],
  [timeline+' / '+TL_EVENTS.length,'Wpisy na osi czasu'],
  [observed+' / '+SC_SPOTS.length,'Zbadane punkty']
 ].map(([value,label])=>'<div><b>'+esc(value)+'</b><span>'+esc(label)+'</span></div>').join('');
 $('ui14CurrentTitle').textContent=UI14_TITLES[STATE.tab]||'Prawdziwe Śledztwo';
 document.querySelectorAll('#nav [data-tab]').forEach(btn=>{
  if(btn.dataset.tab===STATE.tab)btn.setAttribute('aria-current','page');
  else btn.removeAttribute('aria-current');
 });
}
function ui14ScheduleUpdate(){
 if(ui14UpdateQueued)return;
 ui14UpdateQueued=true;
 requestAnimationFrame(()=>{ui14UpdateQueued=false;ui14Update();});
}
function ui14CloseMenu(){
 document.body.classList.remove('ui14-nav-open');
 $('ui14Menu').setAttribute('aria-expanded','false');
 $('ui14Backdrop').hidden=true;
}
function ui14OpenMenu(){
 document.body.classList.add('ui14-nav-open');
 $('ui14Menu').setAttribute('aria-expanded','true');
 $('ui14Backdrop').hidden=false;
 $('ui14Close').focus();
}
$('ui14Menu').addEventListener('click',()=>document.body.classList.contains('ui14-nav-open')?ui14CloseMenu():ui14OpenMenu());
$('ui14Close').addEventListener('click',()=>{ui14CloseMenu();$('ui14Menu').focus();});
$('ui14Backdrop').addEventListener('click',ui14CloseMenu);
registerNavigationHook({name:'sidebar-status',after:()=>{ui14CloseMenu();ui14Update();}});





document.getElementById('ui15GoFinal').addEventListener('click',()=>showTab('final'));
document.getElementById('ui15Checklist').addEventListener('click',ev=>{
 const btn=ev.target.closest('[data-ui15-go]');
 if(btn&&UI15_CHECKS.some(x=>x.tab===btn.dataset.ui15Go))showTab(btn.dataset.ui15Go);
});
document.addEventListener('click',ui14ScheduleUpdate);
document.addEventListener('change',ui14ScheduleUpdate);
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&document.body.classList.contains('ui14-nav-open')){ui14CloseMenu();$('ui14Menu').focus();}
 if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='s'){
  event.preventDefault();exportSave();
 }
});
window.addEventListener('resize',()=>{if(window.innerWidth>950)ui14CloseMenu();});
// A restored browser history entry is treated as a reopened file and receives a fresh in-memory game state.
window.addEventListener('pageshow',event=>{if(event.persisted)window.location.reload();});
// Browser form autofill must not become an implicit save for new sessions.
for(const element of document.querySelectorAll('input:not([type="file"]), textarea, select'))element.setAttribute('autocomplete','off');
ui14Update();





/* ===== Rozbudowa: postęp, doba śledztwa, wskazówki, samotest, napięcie rozmówców, epilog ===== */
const PS_MODS=[['Analiza TCMS',TCMS_OUT,TCMS_INPUT],['Rekonstruktor wiadomości',MSG_OUTPUT,MSG_INPUT],['Kalibracja CCTV',CCTV_OUT,CCTV_SECRET.inputs],['Laboratorium',FO_OUTPUT,FORENSIC_KEY.inputs],['Archiwum wejść',ACCESS_SECRET.outputs,ACCESS_SECRET.inputs]];
const PS={seen:false,hints:0};let psHT=null,psHL=0,psOpenFlag=false;
function psSelfTest(){const have=new Set(INITIAL);DOCS.filter(d=>['oględziny','przed-mg','start'].includes(d.acquisition)).forEach(d=>have.add(d.id));let ch=true;while(ch){ch=false;for(const m of PS_MODS)if(m[2].every(i=>have.has(i)))for(const o of m[1])if(!have.has(o)){have.add(o);ch=true;}}return{total:DOCS.length,reachable:have.size,missing:DOCS.filter(d=>!have.has(d.id)).map(d=>d.id),gatesBad:CONTENT.gates.filter(g=>!g.needs.every(i=>have.has(i))).length};}
window.psSelfTest=psSelfTest;{const r=psSelfTest();if(r.missing.length||r.gatesBad)console.warn('Samotest: nieosiągalne materiały',r);}
function psLoad(o){const n=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));if(o&&typeof o==='object'){PS.seen=!!o.seen;PS.hints=n(o.hints,0,999);}else{PS.seen=false;PS.hints=0;}PS.seen=PS.seen||STATE.found.size>INITIAL.length;psHT=null;psHL=0;psRender();}
function psReset(){psLoad(null);PS.seen=true;psRender();}
registerSaveHook({name:'core-ps-hints',build(save){save.ps={seen:PS.seen,hints:PS.hints};},apply(d){psLoad(d&&d.ps);}});
const _rc=renderCounts;renderCounts=function(){_rc();psRender();};
function psStats(){return{n:STATE.found.size,t:DOCS.length,g:CONTENT.gates.filter(g=>g.needs.every(id=>STATE.found.has(id))).length,gt:CONTENT.gates.length};}
function psRes(id,dep){const d=byId[id];if(!d||dep>6)return null;if(d.acquisition==='po-mg'||d.acquisition==='analiza'){const m=PS_MODS.find(x=>x[1].includes(id));if(!m)return null;const lack=m[2].find(x=>!STATE.found.has(x));return lack?psRes(lack,dep+1):{key:'mod:'+m[0],mod:m[0]};}return{key:id,doc:d};}
function psTarget(){const miss=id=>!STATE.found.has(id);const gate=[...new Set(CONTENT.gates.flatMap(g=>g.needs))].filter(miss);const ids=gate.length?gate:DOCS.filter(d=>miss(d.id)).map(d=>d.id);for(const id of ids){const r=psRes(id,0);if(r)return r;}return null;}
/* Poprawka 5: wskazówki bazują na niespełnionych warunkach fcChecks,
   nie na najbliższym dokumencie w globalnym grafie zależności. */
let ps95Route=null;
function ps95Select(){
 const st=ui15Status();
 if(st.complete)return {key:'complete',tab:'final',type:'complete'};
 if(st.charge)return {key:'defense',tab:'final',type:'defense'};
 if(st.done===st.checks.length)return {key:'charge',tab:'final',type:'charge'};
 const remaining=['inspection12','timeline','deduction'].filter(tab=>{
  const index={timeline:0,deduction:1,inspection12:2}[tab];return !st.checks[index]?.ok;
 });
 // Jeśli użytkownik już pracuje w danym module, pomagaj w nim zamiast zmieniać temat.
 const tab=remaining.includes(STATE.tab)?STATE.tab:remaining[0];
 if(tab==='inspection12')return {key:'scene:bay',tab,type:'scene'};
 if(tab==='deduction')return {key:'board',tab,type:'board'};
 const pending=['e16','e17'].find(id=>{
  const e=TL_MAP.get(id);return e&&(!tlIsOpen(e)||tlAssessment(e,STATE.timeline11.entries[id]).state!=='ok');
 });
 return {key:'timeline:'+(pending||'validate'),tab:'timeline',type:'timeline',event:pending};
}
function ps95HintText(step,level){
 if(step.type==='complete')return 'Dochodzenie jest zakończone. Możesz wrócić do akt i zbadać pozostałe, opcjonalne tropy.';
 if(step.type==='defense')return 'Akt został przyjęty. W sekcji Finał odpowiedz na pozostałe zarzuty obrony, odwołując się do niezależnych źródeł.';
 if(step.type==='charge')return 'Warunki wstępne są spełnione. Przejdź do Finału, powiąż tezę z dokumentami i sprawdź kompletność aktu.';
 if(step.type==='scene'){
  const inBay=STATE.scene12.inspected.filter(id=>SC_BY_SPOT[id]?.room==='bay').length;
  if(inBay)return 'Oględziny stanowiska nr 3 są już zaliczone. Sprawdź pozostałe punkty planu śledztwa.';
  if(level===1)return 'Brakuje oględzin miejsca zdarzenia. W Oględzinach wybierz „Stanowisko nr 3”.';
  if(level===2)return 'Otwórz Stanowisko nr 3, odnajdź punkt na fotografii lub liście, dobierz metodę badania i oceń obserwację.';
  return 'Po poprawnym zbadaniu punktu sprawdź, czy materiał wymaga jeszcze przycisku „Zabezpiecz do akt”. Nie musisz badać wszystkich 30 punktów przed finałem.';
 }
 if(step.type==='board'){
  const cards=STATE.deduction.cards||[];
  const valid=cards.some(c=>c.links?.filter(l=>l?.source?.startsWith('doc:')&&STATE.found.has(l.source.slice(4))).length>=2);
  if(level===1)return cards.length?'Na tablicy jest hipoteza, ale nie spełnia jeszcze warunków uzasadnienia.':'Brakuje uzasadnionego wniosku. Otwórz Dedukcję i zapisz własną hipotezę.';
  if(level===2)return valid?'Sprawdź, czy powiązania wyjaśniają, dlaczego dokumenty wspierają lub ograniczają hipotezę.':'Połącz hipotezę z co najmniej dwoma zdobytymi dokumentami z różnych rodzin źródeł.';
  return 'Uzasadnienie powinno zawierać konkretną tezę oraz opis roli każdego źródła. Co najmniej jedno powiązanie musi ją potwierdzać; nie wystarczy samo dodanie dokumentów.';
 }
 const e=TL_MAP.get(step.event);
 if(!e)return 'Na Osi czasu sprawdź wpisy dotyczące przedziału medycznego i odrębnego impulsu czujnika. Potwierdź czas, miejsce, źródło i uzasadnienie.';
 const available=e.sources.some(id=>STATE.found.has(id));
 if(!available){
  const id=e.sources[0],d=byId[id],dep=psRes(id,0),target=dep?.doc||d,h=target?sceneSourceForDoc(target.id):null;
  if(level===1)return 'Na Osi czasu brakuje źródła do jednego z kluczowych zdarzeń. Znajdź dokumentację, zanim zaczniesz układać wpis.';
  if(level===2)return h?'Szukaj potrzebnego źródła w Oględzinach: '+(SC_ROOMS.find(r=>r.id===h.room)?.title||'właściwa lokacja')+'.':'Sprawdź Poszukiwania: '+((AREAS.find(a=>a.id===target?.area)?.title)||'archiwum dokumentów')+'.';
  return 'Potrzebne źródło: „'+(target?.title||'dokument chronologiczny')+'”. Po pozyskaniu wróć na Oś czasu i oceń zapis.';
 }
 if(level===1)return 'Źródło chronologiczne jest już w aktach. Na Osi czasu wybierz odpowiedni wpis i potwierdź jego zgodność.';
 if(level===2)return 'Otwórz wpis dotyczący „'+e.title+'”, ustaw czas i miejsce, następnie wybierz dokument źródłowy.';
 return 'Dopisz uzasadnienie i zatwierdź wpis. Zwróć uwagę na przedział czasu oraz różnicę między zapisem czujnika a wnioskiem o zdarzeniu.';
}
function ps95FollowHint(){
 const st=ps95Route||ps95Select();
 let focus=null;
 if(st.type==='scene'){
  scPickRoom('bay');showTab('inspection12');focus='scRoomTitle';
 }else if(st.type==='timeline'&&st.event&&psHL>=2){
  const e=TL_MAP.get(st.event),id=e?.sources.find(x=>STATE.found.has(x))||e?.sources[0];
  // Gdy źródło już jest w aktach, pracujemy z osią czasu.
  if(id&&!STATE.found.has(id)){
   const target=psRes(id,0)?.doc||byId[id];
   const source=target&&sceneSourceForDoc(target.id);
   if(source){
    scPickRoom(source.room);
    if(psHL>=3)scDiscover(source.id);
    showTab('inspection12');focus=psHL>=3?'scDetail':'scRoomTitle';
   }else if(target){
    showTab('search');focus='searchQuery';
    const area=document.querySelector('[data-area="'+target.area+'"]');
    if(area)area.click();
    if(psHL>=3){document.getElementById('searchQuery').value=target.title;document.getElementById('searchBtn')?.click();}
   }else showTab('timeline');
  }else showTab('timeline');
 }else showTab(st.tab);
 const panel=document.getElementById('psPanel');if(panel)panel.hidden=true;
 psOpenFlag=false;
 if(focus)requestAnimationFrame(()=>{
  const el=document.getElementById(focus);
  el?.scrollIntoView({block:focus==='searchQuery'?'center':'start',behavior:'smooth'});
  if(focus==='searchQuery')el?.focus();
 });
}
function psHint(){
 const step=ps95Select();ps95Route=step;
 if(!psHT||psHT.key!==step.key){psHT={key:step.key};psHL=0;}
 if(psHL<3){psHL++;PS.hints++;}
 return ps95HintText(step,psHL);
}
function psRender(){let f=document.getElementById('psFab');if(!f){f=document.createElement('button');f.id='psFab';f.type='button';f.setAttribute('aria-haspopup','dialog');// RC35.3: mount directly in navigation; never flash a floating button on start.
const sidebar=document.getElementById('ui14Sidebar');
let tools=document.getElementById('ps76Tools');
if(sidebar&&!tools){
 tools=document.createElement('div');tools.id='ps76Tools';tools.className='ps76-tools';
 const caption=document.createElement('div');caption.className='ps76-caption';caption.textContent='POSTĘP I WSKAZÓWKI';
 tools.append(caption);sidebar.append(tools);
}
(tools||document.body).append(f);const p=document.createElement('div');p.id='psPanel';p.hidden=true;p.setAttribute('role','dialog');p.setAttribute('aria-label','Postęp i wskazówki');document.body.append(p);f.addEventListener('click',()=>{psOpenFlag=!psOpenFlag;psRender();});p.addEventListener('click',ev=>{const a=ev.target&&ev.target.dataset&&ev.target.dataset.psAct;if(!a)return;if(a==='close'){PS.seen=true;psOpenFlag=false;}else if(a==='hint'){p.dataset.hint=psHint();}else if(a==='overview'){psOpenFlag=false;showTab('overview');}else if(a==='follow'){ps95FollowHint();}psRender();});document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&psOpenFlag){psOpenFlag=false;psRender();}});}
const s=psStats(),pr=ui15Status();f.textContent=pr.complete?'🔎 Zakończono':'🔎 Etap '+(pr.charge?'3/3':pr.done===pr.checks.length?'2/3':'1/3');const p=document.getElementById('psPanel');if(ps95Route&&ps95Route.key!==ps95Select().key){p.dataset.hint='';ps95Route=null;psHL=0;}if(!PS.seen&&!f.dataset.shown){f.dataset.shown='1';}p.hidden=!psOpenFlag;if(!psOpenFlag)return;
const caption=pr.complete?'Śledztwo zakończone':pr.charge?'Akt przyjęty – obrona '+pr.defended+'/'+FC_CHALLENGES.length:pr.done===pr.checks.length?'Gotowe warunki wstępne – opracuj akt oskarżenia':'Warunki przygotowania: '+pr.done+' / '+pr.checks.length;
p.innerHTML='<div class="ps-card"><div class="eyebrow">ETAPY DOCHODZENIA</div><p class="small"><b>'+esc(caption)+'</b></p><p class="small muted">Zebrano '+s.n+' z '+s.t+' materiałów. Nie musisz odkryć wszystkich, aby zakończyć sprawę.</p><div class="formline"><button type="button" class="btn alt" data-ps-act="overview">Pokaż plan śledztwa</button><button type="button" class="btn" data-ps-act="hint">Wskazówka</button></div><p class="ps-hint" aria-live="polite">'+esc(p.dataset.hint||'Wskazówki dotyczą brakujących ustaleń. Korzystanie z nich może wpłynąć na końcową ocenę dochodzenia.')+'</p>'+(p.dataset.hint?'<button type="button" class="btn alt ps95-follow" data-ps-act="follow">Przejdź do wskazanego etapu</button>':'')+'<details'+(PS.seen?'':' open')+'><summary>Jak grać</summary><ol class="small"><li><b>Materiały</b> — czytaj akta i szukaj w archiwach; ślady na miejscu zabezpieczaj w Oględzinach.</li><li><b>Przesłuchania</b> — pytaj, pokazuj dowody i sprawdzaj sprzeczności.</li><li><b>Laboratorium</b> — zatwierdzone analizy odblokowują nowe materiały.</li><li><b>Oś czasu i dedukcja</b> — potwierdzaj chronologię i porównuj niezależne źródła.</li><li><b>Finał</b> — uzasadnij oskarżenie i obroń je przed kontrargumentami.</li></ol></details><div class="formline"><button type="button" class="btn subtle" data-ps-act="close">'+(PS.seen?'Zamknij':'Zaczynam')+'</button></div></div>';}
function psMeter(){const head=document.querySelector('.chathead');if(!head)return;const mem=NPC9_MEMORY[STATE.activeChar];if(!mem)return;let m=document.getElementById('psMeter');if(!m){m=document.createElement('div');m.id='psMeter';head.append(m);}const f=v=>{v=Number(v)||0;return Math.round(Math.max(0,Math.min(1,v>1?v/100:v))*100);},s=f(mem.stress),t=f(mem.trust);m.innerHTML='<div class="ps-m"><span>Napięcie</span><i><b style="width:'+s+'%"></b></i><em>'+s+'%</em></div><div class="ps-m ok"><span>Zaufanie</span><i><b style="width:'+t+'%"></b></i><em>'+t+'%</em></div>'+(s>=75&&t<=30?'<div class="ps-warn">Rozmówca się zamyka — zmień ton albo pokaż dowód.</div>':'');}
const _rch=renderChat;renderChat=function(){_rch();try{psMeter();}catch(_){}};
function psEpilogue(){const old=document.getElementById('psEpilogue');if(old)old.remove();const b=document.getElementById('fcExportFinal');if(!b)return;const s=psStats(),pct=Math.round(100*s.n/s.t),miss=DOCS.filter(d=>!STATE.found.has(d.id));const traps=(STATE.deduction.cards||[]).filter(c=>(c.kind==='przypuszczenie'||c.kind==='alternatywa')&&(c.links||[]).some(l=>l&&l.role==='refutes'&&typeof l.source==='string'&&l.source.startsWith('doc:')&&STATE.found.has(l.source.slice(4))));const grade=pct>=90&&PS.hints<=3?'Śledztwo wzorowe':pct>=70?'Śledztwo rzetelne':'Śledztwo oparte na luce w aktach';const el=document.createElement('section');el.id='psEpilogue';el.className='ps-epi';el.innerHTML='<div class="eyebrow">EPILOG</div><h3>'+grade+'</h3><p class="small">Materiały: '+s.n+'/'+s.t+' · przesłuchania: '+s.g+'/'+s.gt+' · wskazówki: '+PS.hints+'.</p><h4>Fałszywe tropy</h4>'+(traps.length?'<ul class="small">'+traps.slice(0,6).map(c=>'<li>'+esc(String(c.statement||'').slice(0,140))+'</li>').join('')+'</ul><p class="small muted">Te hipotezy były podważane przez dokumenty, które miałeś w aktach — trop obalałeś, a nie potwierdzałeś.</p>':'<p class="small muted">Żadna z Twoich hipotez nie została podważona przez zebrane materiały.</p>')+'<h4>Ominięte ślady</h4>'+(miss.length?'<ul class="small">'+miss.slice(0,8).map(d=>'<li>'+esc(d.title)+'</li>').join('')+(miss.length>8?'<li>…oraz '+(miss.length-8)+' więcej</li>':'')+'</ul>':'<p class="small muted">Zebrano komplet materiałów.</p>');b.parentElement.after(el);}
const _fv=fcRenderVerdict;fcRenderVerdict=function(){_fv.apply(this,arguments);try{psEpilogue();}catch(_){}};
try{psLoad(null);}catch(_){}
function psAsk(msg,yes){
 const old=document.getElementById('psAsk');if(old)old.remove();
 const w=document.createElement('div');w.id='psAsk';w.setAttribute('role','alertdialog');w.setAttribute('aria-modal','true');
 const box=document.createElement('div');box.className='ps-ask-box';
 const p=document.createElement('p');p.textContent=msg;
 const row=document.createElement('div');row.className='ps-ask-row';
 const no=document.createElement('button');no.type='button';no.className='btn alt';no.textContent='Anuluj';
 const ok=document.createElement('button');ok.type='button';ok.className='btn';ok.textContent='Potwierdź';
 const key=ev=>{if(ev.key==='Escape'){ev.stopPropagation();close();}};
 function close(){document.removeEventListener('keydown',key,true);w.remove();}
 no.addEventListener('click',close);ok.addEventListener('click',()=>{close();yes();});
 w.addEventListener('click',ev=>{if(ev.target===w)close();});
 document.addEventListener('keydown',key,true);
 row.append(no,ok);box.append(p,row);w.append(box);document.body.append(w);ok.focus();
}
function psPolishCount(n,one,few,many){const v=Math.abs(Number(n)||0),last=v%10,tens=v%100;return v===1?one:last>=2&&last<=4&&!(tens>=12&&tens<=14)?few:many;}
const PS_KEY='ps_detective_autosave_v2';
const PS_TAB=(()=>{
 try{const k='ps_detective_tab_identity_v1',existing=sessionStorage.getItem(k);if(existing)return existing;
 const id=globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);sessionStorage.setItem(k,id);return id;}
 catch{return Math.random().toString(36).slice(2)}
})();
let psTimer=null,psWarned=false,psSessionActive=false;
let psStorageErrorNotified=false;function psSaveNow(){if(!psSessionActive)return;try{SaveManager.writeAutosave(PS_KEY,{tab:PS_TAB});psStorageErrorNotified=false;}catch(err){if(!psStorageErrorNotified){psStorageErrorNotified=true;console.warn('Automatyczny zapis nie powiódł się:',err);toast('Nie można użyć pamięci przeglądarki. Użyj przycisku „Zapisz”, aby pobrać kopię sesji.');}}}
function psSchedule(event){
  if(document.body.classList.contains('ps-resume-pending'))return;
  if(event?.target?.closest?.('#psResumeOffer'))return;
  psSessionActive=true;
  document.getElementById('psResumeOffer')?.remove();
  clearTimeout(psTimer);psTimer=setTimeout(psSaveNow,600);
}
function psClearSave(){clearTimeout(psTimer);psTimer=null;psSessionActive=false;try{SaveManager.clearAutosave(PS_KEY);}catch(_){}}
['click','input','change'].forEach(t=>document.addEventListener(t,psSchedule,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')psSaveNow();});
window.addEventListener('pagehide',psSaveNow);
window.addEventListener('storage',ev=>{
 // A removed key / reload / own-tab save does not prove a second active game.
 if(ev.key!==PS_KEY||ev.storageArea!==localStorage||!ev.newValue||psWarned||!psSessionActive)return;
 let other;try{other=JSON.parse(ev.newValue);}catch{return;}
 if(!other||typeof other.tab!=='string'||!other.tab||other.tab===PS_TAB||
    !Number.isSafeInteger(other.t)||Date.now()-other.t>15000)return;
 psWarned=true;toast('Wykryto zapis z innej aktywnej karty gry — obowiązuje ostatni zapis.');
});
(function(){
  // Zawsze zaczynamy z czystą kartą. Poprzedni automatyczny zapis jest tylko opcją.
  try{
    const previous=SaveManager.readAutosave(PS_KEY);if(!previous)return;
    if(!previous||typeof previous!=='object'||!previous.save)return;
    const overview=$('overview');if(!overview)return;
    const banner=document.createElement('div');banner.id='psResumeOffer';banner.className='surface padded ps-resume-offer';
    banner.setAttribute('role','region');banner.setAttribute('aria-label','Poprzednia sesja');
    const heading=document.createElement('strong');heading.textContent='Znaleziono zapis poprzedniej sesji';
    const hint=document.createElement('p');hint.className='small muted';hint.textContent='Nowa gra rozpoczyna się od zera. Poprzednią sesję możesz świadomie wznowić lub odrzucić.';
    const row=document.createElement('div');row.className='formline';
    const resume=document.createElement('button');resume.type='button';resume.className='btn';resume.textContent='Wznów poprzednią sesję';
    const discard=document.createElement('button');discard.type='button';discard.className='btn alt';discard.textContent='Nowa sesja — odrzuć zapis';
    resume.textContent='Kontynuuj śledztwo';discard.textContent='Nowe śledztwo';
    resume.addEventListener('click',()=>{try{window.PS628_RESTORING=true;const item=SaveManager.readAutosave(PS_KEY);if(!item?.save)throw Error('Brak zapisu');safeLoad(item.save);psSessionActive=true;window.PS617_SYNC?.resume?.();window.PS617_SYNC?.restoreTranscript?.(item.save,{fresh:false}).then(result=>{
 if(!result?.ok)toast('Historia jest widoczna, lecz pamięć AI wymaga synchronizacji z serwerem.');
 });banner.remove();document.body.classList.remove('ps-resume-pending');showTab('overview');toast('Wznowiono zapisaną sesję.');}catch(err){toast('Nie udało się wznowić: '+err.message);}finally{requestAnimationFrame(()=>{window.PS628_RESTORING=false;});}});
    discard.addEventListener('click',()=>{psClearSave();window.PS617_SYNC?.resetSession?.();banner.remove();document.body.classList.remove('ps-resume-pending');toast('Rozpoczęto nowe śledztwo.');});
    row.append(resume,discard);banner.append(heading,hint,row);
    // Keep the dialog directly under body: the overview section animates with
    // transform, which otherwise shifts fixed-position descendants offscreen.
    banner.setAttribute('role','dialog');banner.setAttribute('aria-modal','true');
    document.body.appendChild(banner);
    document.body.classList.add('ps-resume-pending');resume.focus({preventScroll:true});
  }catch(err){
    console.warn('Nie udało się odczytać poprzedniej sesji:',err);
    const overview=$('overview');if(!overview)return;
    // Odmowa dostępu do localStorage nie oznacza uszkodzenia danych.
    // W takiej sytuacji informujemy o ręcznym eksporcie, bez opcji kasowania.
    if(err?.name==='SecurityError'||err?.name==='NotSupportedError'||err?.name==='InvalidStateError'){
      const banner=document.createElement('div');banner.id='psStorageUnavailable';
      banner.className='surface padded ps-resume-offer';banner.setAttribute('role','status');
      banner.setAttribute('aria-label','Automatyczny zapis niedostępny');
      const title=document.createElement('strong');title.textContent='Automatyczny zapis jest niedostępny';
      const description=document.createElement('p');description.className='small muted';
      description.textContent='Przeglądarka blokuje pamięć lokalną. Możesz grać dalej; aby zachować postęp, pobierz plik zapisu z Notatnika.';
      const exportButton=document.createElement('button');exportButton.type='button';
      exportButton.className='btn alt';exportButton.textContent='Pobierz zapis ręcznie';
      exportButton.addEventListener('click',()=>exportSave());
      banner.append(title,description,exportButton);overview.insertBefore(banner,overview.firstChild);
      return;
    }
    const banner=document.createElement('div');banner.id='psResumeOffer';banner.className='surface padded ps-resume-offer';
    banner.setAttribute('role','alert');banner.setAttribute('aria-label','Niepoprawny automatyczny zapis');
    const title=document.createElement('strong');title.textContent='Poprzedni automatyczny zapis jest nieprawidłowy';
    const description=document.createElement('p');description.className='small muted';
    description.textContent='Dane poprzedniej sesji są niekompletne lub nie przeszły kontroli integralności. Nowa gra pozostaje dostępna.';
    const discard=document.createElement('button');discard.type='button';discard.className='btn alt';discard.textContent='Odrzuć uszkodzony zapis';
    discard.addEventListener('click',()=>{psClearSave();window.PS617_SYNC?.resetSession?.();banner.remove();toast('Odrzucono uszkodzony zapis.');});
    banner.append(title,description,discard);overview.insertBefore(banner,overview.firstChild);
  }
})();

/* SYSTEM SYMULACYJNY 5.0: graf dowodowy, kontrola źródeł, ryzyko procesowe i rozprawa.
   Działa wyłącznie na zdobytych materiałach; żadna ścieżka nie przyznaje dowodów.
   Celowo oddziela zgodność tematyczną od weryfikacji dowodu i sprawstwa. */
const SIM_NODES = [
 {id:'conceal',title:'Zatajono rozbieżności podzespołów L-2 i L-3',kind:'motyw',
  question:'Czy zmiana dokumentacji i testy diagnostyczne świadczą o świadomym ukrywaniu rozbieżności?',
  routes:[['EVID_TCMS_SESSION','TEC-15','TEC-09'],['EVID_SERIAL_PHOTO','EVID_ACCEPTANCE_RECORD','EVID_SERVICE_FORM_GAPS'],['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION','EVID_WORK_ORDER_RAW']],
  caution:'Dokumentacja pokazuje rozbieżności i decyzje proceduralne; nie przesądza sama o przemocy wobec Leny.'},
 {id:'meeting',title:'Ustalono okoliczności nocnego spotkania',kind:'powiązanie',
  question:'Czy można odtworzyć kontakt, miejsce i powód spotkania bez utożsamiania konta z człowiekiem?',
  routes:[['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','ADM-04'],['EVID_RAW_ENTRY_TIMES','EVID_T17_DOOR_EVENT','EVID_CCTV_SYNC'],['EVID_BHP_DRAFT','EVID_MESSAGE_THREAD_RECOVERED','ADM-04']],
  caution:'Sam SMS, użycie karty lub projekt raportu nie identyfikują bezpośrednio osoby przy stanowisku.'},
 {id:'mechanism',title:'Obrażenia wymagają oceny dwóch mechanizmów',kind:'mechanizm',
  question:'Czy upadek tłumaczy wszystkie obrażenia, czy niezbędny był wcześniejszy kontakt?',
  routes:[['MED-04','MED-09','LAB-08'],['MED-10','LAB-09','LAB-05'],['MED-02','LAB-10','LAB-08']],
  caution:'Podobieństwo włókien i smaru nie jest identyfikacją osoby ani bezspornym narzędziem czynu.'},
 {id:'alibi',title:'Alibi wymaga niezależnego sprawdzenia obecności',kind:'alibi',
  question:'Czy aktywna sesja audytowa lub karta wyklucza fizyczne przemieszczanie się?',
  routes:[['EVID_CONFERENCE_SESSION','DIG-09','ADM-04'],['EVID_CCTV_SYNC','VIS-12','ADM-04'],['EVID_T17_DOOR_EVENT','EVID_RESOURCE_HANDOVER','EVID_CONFERENCE_SESSION']],
  caution:'Zdarzenie w rejestrze nie dowodzi automatycznie tożsamości ani ciągłej obecności przy komputerze.'},
 {id:'chronology',title:'Oś zdarzeń odpowiada niezależnym zapisom',kind:'chronologia',
  question:'Czy zapis urazów, czujników, nagrań i przejść da się pogodzić czasowo?',
  routes:[['MED-03','TEC-14','VIS-06'],['EVID_CCTV_SYNC','VIS-12','EVID_RAW_ENTRY_TIMES'],['EVID_TCMS_SESSION','TEC-13','ADM-04']],
  caution:'Różne zegary mają odchylenia; błędna synchronizacja może pozornie obalić alibi.'},
 {id:'identity',title:'Powiązano ustalenia z konkretną osobą',kind:'sprawstwo',
  question:'Czy kilka niezależnych źródeł wiąże komunikację, trasę i działania osoby bez błędu identyfikacji?',
  routes:[['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','VIS-08'],['EVID_MESSAGE_DEVICE_METADATA','EVID_CCTV_SYNC','ADM-04'],['EVID_MESSAGE_DEVICE_METADATA','DIG-09','EVID_CONFERENCE_SESSION','EVID_RAW_ENTRY_TIMES']],
  caution:'To wniosek o zbieżności źródeł. Przypisanie winy pozostaje osobnym rozstrzygnięciem.'}
];
const SIM_NODE_MAP=new Map(SIM_NODES.map(n=>[n.id,n]));
const SIM_DEGRADED={
 'EVID_SERVICE_FORM_GAPS':{label:'Niejednoznaczna historia edycji',paths:[['TEC-09'],['EVID_ACCEPTANCE_RECORD','EVID_WORK_ORDER_RAW']],unit:'Ekspert dokumentacji'},
 'EVID_BHP_DRAFT':{label:'Projekt nigdy niewysłany',paths:[['EVID_OUTBOX_MISSING_SUBMISSION'],['DIG-16','EVID_WORK_ORDER_RAW']],unit:'Sprawdzenie bramki BHP'},
 'EVID_CCTV_SYNC':{label:'Rozbieżność znaczników czasu',paths:[['VIS-12','VIS-04'],['VIS-03','VIS-06']],unit:'Synchronizacja CCTV'},
 'VIS-08':{label:'Zamazana sylwetka',paths:[['VIS-12','EVID_CCTV_SYNC'],['VIS-03','VIS-04']],unit:'Ekspertyza obrazu'},
 'EVID_T17_DOOR_EVENT':{label:'Karta nie wskazuje osoby',paths:[['EVID_RESOURCE_HANDOVER','ADM-07'],['EVID_RAW_ENTRY_TIMES','VIS-09']],unit:'Audyt kontroli dostępu'},
 'EVID_TCMS_SESSION':{label:'Luka i brak części telemetrii',paths:[['TEC-12','TEC-13'],['EVID_TEST_AUTHORIZATION','TEC-03']],unit:'Odtworzenie sesji TCMS'},
 'EVID_MESSAGE_DEVICE_METADATA':{label:'Źródło techniczne ≠ fizyczny nadawca',paths:[['DIG-05','DIG-09'],['DIG-03','DIG-04']],unit:'Walidacja metadanych urządzenia'}
};
const SIM_NOISE=new Set(['EVID_PAYROLL_MANUAL_EDIT','DIG-15','DIG-14']);
const SIM_NODE_DOCS=new Map(SIM_NODES.map(n=>[n.id,new Set(n.routes.flat())]));
function simFresh(){return {time:85,trust:75,errors:0,events:[],links:{},verified:[],challenges:{},ignoredTimeline:false,trial:null,extensions:0,selected:'conceal',witness:{}};}
STATE.sim=simFresh();
const simClamp=n=>Math.max(0,Math.min(100,Math.round(n)));
const simEsc=esc;
function simTime(cost,trustDelta=0,reason=''){const s=STATE.sim;s.time=Math.max(0,s.time-cost);s.trust=simClamp(s.trust+trustDelta);s.events.unshift({cost,trustDelta,reason:String(reason).slice(0,180)});s.events.length=Math.min(s.events.length,100);simRenderTop();}
function simError(reason,cost=3,trust=5){STATE.sim.errors++;simTime(cost,-trust,reason);toast(reason);}
function simReset(){STATE.sim=simFresh();simRenderTop();simRenderGraph();simRenderHearing();simRenderInterrogation();}
function simIsVerified(id){return !SIM_DEGRADED[id]||STATE.sim.verified.includes(id);}
function simQuality(id){if(!STATE.found.has(id))return 0;
 if(SIM_NOISE.has(id))return .12;
 if(!simIsVerified(id))return .56;
 return .96;
}
function simSelectedDocs(nodeId,role='supports') {return (STATE.sim.links[nodeId]||[]).filter(l=>l.role===role&&STATE.found.has(l.id)).map(l=>l.id);}
const SIM_FACET_TITLES={
 conceal:['Rozbieżność techniczna','Weryfikacja zapisu','Kontekst decyzji'],
 meeting:['Kontakt / okoliczności','Weryfikacja źródła','Powiązanie z miejscem'],
 mechanism:['Obrażenia','Analiza mechanizmu','Porównanie śladów'],
 alibi:['Zapis aktywności','Niezależne potwierdzenie','Trasa i czas'],
 chronology:['Pierwsza kotwica','Drugi rejestr','Synchronizacja'],
 identity:['Komunikacja','Zapis niezależny','Kontakt lub trasa']
};
function simFacets(n){const out=[[],[],[]];for(const r of n.routes){for(let j=0;j<r.length;j++){const column=Math.min(j,2);if(!out[column].includes(r[j]))out[column].push(r[j]);}}return out;}
function simScore(n){
 const used=new Set(simSelectedDocs(n.id));
 const scores=n.routes.map((docs,i)=>{
  const selected=docs.filter(id=>used.has(id)),families=new Set(selected.map(id=>byId[id]?.family||id));
  const strength=docs.reduce((sum,id)=>sum+(used.has(id)?simQuality(id):0),0)/docs.length;
  const independence=families.size>=2?1:families.size===1?.64:0;
  const score=Math.max(0,Math.min(100,Math.round(strength*independence*100)));
  return {index:i,score,selected,required:docs,families:families.size,ready:score>80&&selected.length===docs.length&&families.size>=2&&selected.every(id=>!SIM_DEGRADED[id]||simIsVerified(id))};
 });
 scores.sort((a,b)=>b.score-a.score);
 // Compositional graph matching: one independently sourced observation from each facet.
 // This accepts mixed proof routes, but never counts the same document for two facets.
 const facets=simFacets(n),options=facets.map(f=>f.filter(id=>used.has(id)));
 let hybrid={index:'hybrid',score:0,selected:[],required:[],families:0,ready:false};
 for(const a of [null,...options[0]])for(const b of [null,...options[1]])for(const c of [null,...options[2]]){
  const chosen=[a,b,c].filter(Boolean),unique=new Set(chosen);
  if(unique.size!==chosen.length)continue;
  const fams=new Set(chosen.map(id=>byId[id]?.family||id));
  const quality=(simQuality(a)+simQuality(b)+simQuality(c))/3;
  const score=Math.round(quality*100*(fams.size>=2?1:fams.size===1?.64:0));
  if(score>hybrid.score)hybrid={index:'hybrid',score,selected:chosen,required:chosen,families:fams.size,ready:chosen.length===3&&score>80&&fams.size>=2&&chosen.every(id=>!SIM_DEGRADED[id]||simIsVerified(id))};
 }
 const best=[hybrid,...scores].sort((a,b)=>Number(b.ready)-Number(a.ready)||b.score-a.score)[0];
 const bad=simSelectedDocs(n.id).filter(id=>!SIM_NODE_DOCS.get(n.id).has(id));
 const ambiguity=(STATE.sim.links[n.id]||[]).filter(l=>l.role==='limits'||l.role==='refutes').length;
 return {best,score:Math.max(0,best.score-(bad.length*9)),ready:best.ready&&!bad.length,alternatives:scores,hybrid,facets,ambiguity};
}
function simConfidence(){return Object.fromEntries(SIM_NODES.map(n=>[n.id,simScore(n)]));}
function simAdd(nodeId,id,role){const node=SIM_NODE_MAP.get(nodeId);if(!node||!STATE.found.has(id))return;
 const links=STATE.sim.links[nodeId]||(STATE.sim.links[nodeId]=[]);
 if(links.some(x=>x.id===id&&x.role===role))return toast('Ten materiał już jest połączony w tej roli.');
 if(links.length>=32)return toast('Osiągnięto limit połączeń tego wniosku.');
 if(STATE.sim.time<=0)return toast('Brak czasu śledczego. Wnioskuj o przedłużenie albo przejdź do finału.');
 if(role==='supports'&&!SIM_NODE_DOCS.get(nodeId).has(id))simError('Materiał nie wykazuje związku z tą tezą. Samo podobieństwo tematu nie wystarcza.',2,3);
 else if(role==='supports'&&SIM_NOISE.has(id))simError('Próba użycia pobocznego materiału jako dowodu rozstrzygającego.',3,4);
 else simTime(1,0,'Sprawdzenie powiązania: '+node.title);
 links.push({id,role});STATE.sim.trial=null;simRenderGraph();simRenderHearing();
}
function simHasVerification(id){const rule=SIM_DEGRADED[id];return !!(rule&&rule.paths.some(path=>path.every(p=>STATE.found.has(p))));}
function simVerify(id){const rule=SIM_DEGRADED[id];if(!rule||!STATE.found.has(id))return;
 if(simIsVerified(id))return toast('Weryfikacja tego materiału została już wykonana.');
 if(!simHasVerification(id))return toast('Brakuje kompletnej ścieżki kontrolnej: '+rule.paths.map(path=>path.map(x=>docName(x)).join(' + ')).join(' LUB '));
 if(STATE.sim.time<3)return toast('Brak czasu na analizę. Możesz wnioskować o jednorazowe przedłużenie.');
 simTime(3,0,rule.unit+' — '+docName(id));STATE.sim.verified.push(id);STATE.sim.trial=null;
 simRenderGraph();simRenderHearing();toast('Zakończono kontrolę: '+docName(id));
}
function simRenderTop(){for(const root of document.querySelectorAll('.sim-brief'))root.innerHTML=`<span><b>${STATE.sim.time}</b> czasu śledczego</span><span><b>${STATE.sim.trust}%</b> zaufania prokuratorskiego</span><span><b>${STATE.sim.errors}</b> błędów</span>`;}
function simExtend(){if(STATE.sim.extensions>=1)return toast('Jednorazowe przedłużenie zostało już wykorzystane.');
 STATE.sim.extensions++;STATE.sim.time+=18;STATE.sim.trust=simClamp(STATE.sim.trust-12);STATE.sim.events.unshift({reason:'Formalne przedłużenie śledztwa',cost:-18,trustDelta:-12});simRenderTop();simRenderGraph();simRenderHearing();}
function simInitUI(){
 if(document.getElementById('simGraph'))return;
 const g=document.createElement('section');g.id='simGraph';g.className='surface padded sim-root';
 g.innerHTML=`<div class="eyebrow">SIEĆ DOWODOWA</div><h3>Wielościeżkowa weryfikacja hipotez</h3><p class="small muted">Wybierz tezę i wskaż faktycznie zdobyte materiały. Każdą można udokumentować trzema niezależnymi trasami. Wynik powyżej 80% oznacza przekroczenie progu tej trasy, a nie automatyczne uznanie winy.</p><div class="sim-brief" id="simGraphBrief"></div><div id="simNodeTabs" class="sim-nodes"></div><div id="simNodeDetail" class="sim-detail"></div>`;
 const deduction=document.getElementById('deduction');deduction.insertBefore(g,deduction.querySelector('.dd-work'));
 const hearing=document.createElement('section');hearing.id='simHearing';hearing.className='surface padded sim-root';
 hearing.innerHTML=`<div class="eyebrow">SYMULACJA KONTROLI PROCESOWEJ</div><h3>Ocena wniosków i zarzuty obrony</h3><p class="muted small">Możesz skierować sprawę z niepełnymi dowodami. Obrona bada słabe ogniwa, a nie szuka jednej przewidzianej kombinacji dokumentów.</p><div class="sim-brief"></div><div id="simHearingDetail"></div>`;
 document.getElementById('final').appendChild(hearing);
 const breakPanel=document.createElement('div');breakPanel.id='simInterrogation';breakPanel.className='sim-interrogation';
 const advanced=document.createElement('details');advanced.className='ps22-advanced';advanced.innerHTML='<summary>Taktyki, przerwy i przebieg rozmowy</summary>';advanced.appendChild(breakPanel);
 const tools=document.querySelector('#interview .ps21-tools');tools.appendChild(advanced);
 simRenderTop();
 for(const el of [g,hearing,breakPanel])el.addEventListener('click',simOnClick);
 for(const el of [g,hearing,breakPanel])el.addEventListener('change',simOnChange);
 const oldSubmit=$('fcSubmit');const replacement=oldSubmit.cloneNode(true);replacement.textContent='Złóż akt do kontroli';oldSubmit.replaceWith(replacement);
 replacement.addEventListener('click',simSubmit);
 $('fcDefense').hidden=true;$('fcVerdictPanel').hidden=true;
 const style=document.createElement('style');style.id='simStyle';style.textContent=`
 .sim-root{margin:18px 0 22px;border:1px solid #53636c;background:linear-gradient(150deg,#142029,#0c161e);min-width:0}
 .sim-root h3{font-size:19px;margin:7px 0 12px}.sim-root p{line-height:1.65}
 .sim-brief{display:flex;flex-wrap:wrap;gap:8px;margin:13px 0}
 .sim-brief>span{border:1px solid #51616a;background:#1a2a33;border-radius:6px;padding:6px 10px;font-size:12px;color:#becbd0}
 .sim-brief b{color:#efd09d;font-size:17px;margin-right:4px}
 .sim-nodes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:16px 0}
 .sim-node{background:#16232d;border:1px solid #4b5a64;border-radius:8px;text-align:left;padding:11px;min-height:87px;color:#e5ecec;font-size:12px;line-height:1.5}
 .sim-node[aria-pressed=true]{border-color:#d6ae73;background:#352c21}.sim-node b{display:block;font-size:16px;color:#efc78e;margin:6px 0}
 .sim-strong{color:#9bd3af!important}.sim-weak{color:#dfb58f!important}
 .sim-detail{border:1px solid #3f515a;border-radius:8px;padding:15px;background:#111c24}
 .sim-route-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:14px 0}
 .sim-route{padding:12px;border:1px solid #42535c;border-radius:7px;font-size:12px;line-height:1.7;background:#16242e;min-width:0}
 .sim-route b{display:block;color:#e9c998;font-size:13px}.sim-route.ready{border-color:#78a98b}
 .sim-route li{margin:4px 0}.sim-links{display:grid;gap:6px;max-height:220px;overflow:auto;margin:9px 0}
 .sim-link{display:flex;align-items:flex-start;gap:8px;padding:8px;border:1px solid #384951;border-radius:6px;justify-content:space-between;font-size:12px}
 .sim-link button{border:0;background:none;color:#e3bb83;font:inherit;cursor:pointer}
 .sim-controls{display:grid;grid-template-columns:minmax(0,1fr) 155px auto;gap:10px;align-items:end;margin:12px 0}
 .sim-controls label,.sim-check label{display:grid;gap:5px;font-size:12px;color:#d0d8dc;min-width:0}
 .sim-controls select,.sim-check select{width:100%;min-width:0;background:#0c151b;border:1px solid #50606b;padding:9px;border-radius:6px;color:var(--text)}
 .sim-check{display:flex;flex-wrap:wrap;align-items:flex-end;gap:9px;margin:10px 0}
 .sim-check label{flex:1 1 230px}.sim-trial-result{border-left:3px solid #d6ab6d;background:#1f292e;padding:15px;border-radius:5px;margin:14px 0;line-height:1.7;font-size:13px}
 .sim-trial-result.bad{border-left-color:#bd7471}.sim-trial-result.good{border-left-color:#8ebf9f}
 .sim-trial-result h4{font-size:17px;margin:0 0 7px}.sim-warning{font-size:12px;color:#e5bc8f;margin:10px 0}
 .sim-objection{border:1px solid #3d4f58;background:#121d25;border-radius:8px;padding:13px;margin:9px 0;display:grid;gap:9px}.sim-objection-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:13px}.sim-field{display:grid;gap:7px;font-size:12px;color:#d1dce1}.sim-field select{background:#0d161c;color:var(--text);border:1px solid #4c5e67;border-radius:6px;padding:10px;width:100%}
 .sim-interrogation{margin:5px 0 10px;padding:10px;border:1px solid #455862;border-radius:7px;background:#13212a;font-size:12px}
 .sim-interrogation .sim-meters{display:flex;flex-wrap:wrap;justify-content:space-between;gap:9px;margin-bottom:8px}
 .sim-interrogation .sim-meters b{color:#ebc48a}.sim-interrogation .btn{padding:7px 10px;font-size:12px}
 #fcDefense,#fcVerdictPanel{display:none!important}
 @media(max-width:820px){.sim-nodes,.sim-route-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:590px){.sim-nodes,.sim-route-list,.sim-controls{grid-template-columns:1fr}.sim-route-list{gap:7px}.sim-root{padding:13px}.sim-node{min-height:auto}}
 `;document.head.appendChild(style);
}
function simRenderGraph(){const root=$('simGraph');if(!root)return;
 simRenderTop();const selected=SIM_NODE_MAP.get(STATE.sim.selected)||SIM_NODES[0];const scores=simConfidence();
 $('simNodeTabs').innerHTML=SIM_NODES.map(n=>`<button type="button" class="sim-node" data-sim-node="${n.id}" aria-pressed="${n.id===selected.id}">${esc(n.title)}<b class="${scores[n.id].ready?'sim-strong':''}">${scores[n.id].score}%</b><small>${scores[n.id].ready?'Weryfikacja wiarygodna':'Do sprawdzenia'} · 3 drogi</small></button>`).join('');
 const mix=scores[selected.id].hybrid;const facetTitles=SIM_FACET_TITLES[selected.id];
 const routes=selected.routes.map((list,i)=>{
  const result=scores[selected.id].alternatives.find(r=>r.index===i);
  return `<div class="sim-route ${result.ready?'ready':''}"><b>Ścieżka ${'ABC'[i]} · ${result.score}%</b><ul>${list.map(id=>`<li class="${result.selected.includes(id)?'sim-strong':''}">${result.selected.includes(id)?'✓ ':STATE.found.has(id)?'○ ':'• '}${esc(docName(id))}${!simIsVerified(id)&&STATE.found.has(id)?' <span class="sim-weak">(do weryfikacji)</span>':''}</li>`).join('')}</ul></div>`;
 }).join('');
 const docLinks=STATE.sim.links[selected.id]||[];
 const options=fcOwned().map(d=>`<option value="${esc(d.id)}">${esc(d.title)}${SIM_DEGRADED[d.id]&&!simIsVerified(d.id)?' · niepełny':''}</option>`).join('');
 const unresolved=Object.entries(SIM_DEGRADED).filter(([id])=>STATE.found.has(id)&&!simIsVerified(id));
 $('simNodeDetail').innerHTML=`<h3>${esc(selected.title)}</h3><p class="small muted">${esc(selected.question)}</p><div class="sim-route-list">${routes}</div>
 <div class="sim-route ${mix.ready?'ready':''}" style="margin:12px 0"><b>Własne połączenie ścieżek · ${mix.score}%</b><p class="small muted">Możesz użyć dowolnej kombinacji, która pokrywa trzy niezależne aspekty tej tezy:</p><ul>${scores[selected.id].facets.map((facet,i)=>`<li>${esc(facetTitles[i])}: ${facet.some(id=>simSelectedDocs(selected.id).includes(id))?'materiał połączony':'wymaga źródła'}</li>`).join('')}</ul>${mix.selected.length?`<p class="small muted">Uwzględniono: ${mix.selected.map(id=>esc(docName(id))).join(' · ')}</p>`:''}</div>
 <p class="muted small">${esc(selected.caution)}</p><h4 style="margin:13px 0 9px">Powiązane materiały i ich role</h4>
 <div class="sim-links">${docLinks.length?docLinks.map((l,i)=>`<div class="sim-link"><span>${esc(docName(l.id))} · <b>${({supports:'Wspiera',refutes:'Podważa',limits:'Ogranicza',context:'Kontekst'})[l.role]}</b></span><button type="button" data-sim-delete="${i}" aria-label="Usuń połączenie">×</button></div>`).join(''):'<p class="muted small">Jeszcze nie przypisano materiałów.</p>'}</div>
 <div class="sim-controls"><label>Zdobyty materiał<select id="simSource"><option value="">— wybierz materiał —</option>${options}</select></label><label>Rola<select id="simRole"><option value="supports">Potwierdza</option><option value="refutes">Podważa</option><option value="limits">Ogranicza</option><option value="context">Kontekst</option></select></label><button type="button" class="btn alt" data-sim-add>Połącz</button></div>
 <h4 style="margin:18px 0 8px">Materiały niepełne i ekspertyzy</h4><div class="sim-check"><label>Źródło do weryfikacji<select id="simVerifySource"><option value="">— wybierz niezweryfikowane źródło —</option>${unresolved.map(([id,r])=>`<option value="${id}">${esc(docName(id))} · ${esc(r.label)}</option>`).join('')}</select></label><button type="button" class="btn alt" data-sim-verify>Otwórz audyt źródła</button></div><p id="simVerifyHint" class="small muted"></p>
 <p class="small muted">Ekspertyza wymaga jednej z dwóch dróg niezależnej kontroli i kosztuje czas. Dla wybranego źródła: ${unresolved.length?'sprawdź dostępne materiały pomocnicze':'brak materiałów wymagających ekspertyzy'}. Niezweryfikowane fragmenty zmniejszają wagę dowodu.</p>
 <div class="formline" style="margin-top:12px"><button class="btn subtle" type="button" data-sim-extend ${STATE.sim.extensions?'disabled':''}>Wniosek o przedłużenie śledztwa (+18 czasu, −12 zaufania)</button></div>`;
}
function simWitness(c){const w=STATE.sim.witness;return w[c.id]||(w[c.id]={blocked:false,breaks:0,lastEvidence:'',contradiction:false});}
function simRenderInterrogation(){const el=$('simInterrogation');if(!el)return;
 const c=CONTENT.characters.find(x=>x.id===STATE.activeChar);if(!c)return;
 const w=simWitness(c),st=NPC4_STATE[c.id];
 el.innerHTML=`<div class="sim-meters"><span><b>Stres</b> ${Math.round(st.tension)}%</span><span><b>Współpraca</b> ${Math.round(st.rapport)}%</span><span>${w.blocked?'<b>Rozmowa przerwana na żądanie świadka</b>':'Możliwe swobodne pytania i konfrontacja źródeł'}</span></div>
 <div class="formline"><button type="button" class="btn alt" data-sim-break ${STATE.sim.time<3?'disabled':''}>Zarządź przerwę (3 czasu)</button><span class="small muted">Przerwa może przywrócić możliwość rozmowy, ale nie oznacza przyznania się do winy.</span></div>`;
 $('chatSend').disabled=STATE.sim.time<=0;
}
function simBreak(){const c=CONTENT.characters.find(x=>x.id===STATE.activeChar),w=simWitness(c),st=NPC4_STATE[c.id];
 if(STATE.sim.time<3)return toast('Brakuje czasu na przerwę.');
 simTime(3,0,'Przerwa w przesłuchaniu: '+c.name);
 st.tension=npc4Clamp(st.tension-24);st.rapport=npc4Clamp(st.rapport+9);w.blocked=false;w.breaks++;
 STATE.dialogues[c.id].push({role:'npc',text:'Przerwijmy na chwilę. Mogę kontynuować spokojną rozmowę, ale nie będę potwierdzać tego, czego nie wiem.'});renderChat();
}
function simSendChat(){const input=$('chatInput'),q=input.value.trim().slice(0,2000);if(!q)return;
 const c=CONTENT.characters.find(x=>x.id===STATE.activeChar),attached=$('attachedDoc').value,log=STATE.dialogues[c.id],w=simWitness(c),st=NPC4_STATE[c.id],normQ=norm(q);
 if(STATE.sim.time<=0)return toast('Czas śledczy wyczerpany. Przedłuż dochodzenie lub skieruj sprawę do finału.');
 log.push({role:'player',text:q+(attached?'\n[Okazano: '+attached+']':'')});
 const hostile=npc9Tone(q)==='pressure'||/przyznaj sie|na pewno klamiesz|areszt|groze|zamkne cie/.test(normQ);
 const unsupported=attached&&(!STATE.found.has(attached)||!simIsVerified(attached)||STATE.sim.auditJudgments?.[attached]?.status==='overclaim');
 if(w.blocked){log.push({role:'npc',text:'Podtrzymuję odmowę. Proszę o formalną przerwę przed wznowieniem czynności.'});simTime(1,-1,'Ponowienie pytania mimo odmowy');}
 else if(unsupported&&attached){st.tension=npc4Clamp(st.tension+12);st.rapport=npc4Clamp(st.rapport-11);simError('Okazano materiał niezweryfikowany lub niepozyskany — świadek zakwestionował podstawę konfrontacji.',4,6);
  log.push({role:'npc',text:'To nie jest jeszcze sprawdzony materiał. Proszę najpierw ustalić jego pochodzenie i kompletność.'});}
 else if(hostile&&st.tension>=68 || (st.tension>=87&&st.rapport<=30)){
  st.tension=npc4Clamp(st.tension+12);st.rapport=npc4Clamp(st.rapport-12);w.blocked=true;simError('Przekroczono granicę dopuszczalnej presji: świadek przerwał rozmowę.',4,8);
  log.push({role:'npc',text:'Nie będę dalej odpowiadać w tych warunkach. Proszę przerwać przesłuchanie i umożliwić konsultację z pełnomocnikiem.'});}
 else{
  const beforePressure=st.tension;
  let answer=npc4Answer(c,q,attached);
  if(attached&&st.tension>=58&&st.tension<=83&&st.rapport>=24&&c.id==='MAGDALENA'&&['EVID_CONFERENCE_SESSION','DIG-09','ADM-04'].includes(attached)&&!w.contradiction){
   answer+='\n\nNie twierdzę, że cały czas siedziałam przed ekranem. Zapis połączenia sam tego nie wykazuje.';w.contradiction=true;
  }
  if(st.tension>=88&&st.rapport<25){w.blocked=true;answer+='\n\nNa tym zakończę. Dalsze pytania proszę kierować po przerwie i po konsultacji z pełnomocnikiem.';}
  if(hostile&&st.tension>beforePressure+7)simTime(2,-2,'Konfrontacja pod presją');
  else simTime(1,0,'Czynność przesłuchania');
  log.push({role:'npc',text:answer});if(window.stage3)window.stage3.onQuestion(c.id,q,attached);
 }
 if(log.length>1600)log.splice(0,log.length-1600);
 input.value='';renderChat();simRenderHearing();
}
function simOnClick(e){const target=e.target.closest('[data-sim-node],[data-sim-add],[data-sim-delete],[data-sim-verify],[data-sim-extend],[data-sim-break],[data-sim-continue]');if(!target)return;
 if(target.dataset.simNode){STATE.sim.selected=target.dataset.simNode;simRenderGraph();return;}
 if(target.hasAttribute('data-sim-add')){const id=$('simSource').value,role=$('simRole').value;if(id)simAdd(STATE.sim.selected,id,role);return;}
 if(target.hasAttribute('data-sim-delete')){const a=STATE.sim.links[STATE.sim.selected]||[];a.splice(Number(target.dataset.simDelete),1);STATE.sim.trial=null;simRenderGraph();simRenderHearing();return;}
 if(target.hasAttribute('data-sim-verify')){if($('simVerifySource').value)simVerify($('simVerifySource').value);return;}
 if(target.hasAttribute('data-sim-extend'))return simExtend();
 if(target.hasAttribute('data-sim-break'))return simBreak();
 if(target.hasAttribute('data-sim-continue'))return simTrial();
}
function simOnChange(e){if(e.target.id==='simVerifySource'){const id=e.target.value,el=$('simVerifyHint'),r=SIM_DEGRADED[id];if(el)el.innerHTML=r?'<b>Alternatywne drogi weryfikacji:</b> '+r.paths.map((path,i)=>'<span class=\"'+(path.every(p=>STATE.found.has(p))?'sim-strong':'sim-weak')+'\">'+String.fromCharCode(65+i)+': '+path.map(p=>esc(docName(p))+(STATE.found.has(p)?' ✓':' ○')).join(' + ')+'</span>').join(' LUB '):'';return;}if(e.target.id==='simIgnoreTimeline'){STATE.sim.ignoredTimeline=e.target.checked;STATE.sim.trial=null;}
 if(e.target.dataset.simObjection){STATE.sim.challenges[e.target.dataset.simObjection]=e.target.value;STATE.sim.trial=null;}
}
const SIM_OBJECTION_NODES={accident:['mechanism'],contract:['conceal','meeting'],message:['meeting','identity'],card:['meeting','alibi'],remote:['alibi','chronology'],traces:['mechanism','identity']};
function simDefendEvaluation(){
 const responses=FC_CHALLENGES.map(q=>{
  const nodes=SIM_OBJECTION_NODES[q.id]||[],method=STATE.sim.challenges[q.id]||'';
  const grounded=nodes.length>0&&nodes.every(id=>simScore(SIM_NODE_MAP.get(id)).ready);
  const limited=nodes.some(id=>(STATE.sim.links[id]||[]).some(l=>['limits','refutes'].includes(l.role)&&STATE.found.has(l.id)&&SIM_NODE_DOCS.get(id).has(l.id)));
  const passed=grounded&&(method==='compare'||(method==='limits'&&limited));
  return {id:q.id,title:q.title,nodes,method,passed,limited};
 });
 return {responses,passed:responses.filter(x=>x.passed).length,all:responses.every(x=>x.passed),weak:responses.filter(x=>!x.passed).map(x=>x.title)};
}
function simTimelineIssues(){try{return tlGlobalFindings().filter(x=>x.kind==='bad');}catch(_){return [];}}
function simCaseAssessment(){const s=STATE.final13,cs=simConfidence(),reasons=Object.values(s.reasons),allUsed=new Set(Object.values(STATE.sim.links).flatMap(a=>a.filter(l=>l.role==='supports').map(l=>l.id))),chargeDocs=fcAllDocs(),unique=new Set([...allUsed,...chargeDocs]);
 const validity=['meeting','mechanism','alibi','identity','chronology'].map(id=>cs[id].ready);
 const complete=validity.every(Boolean)&&cs.conceal.score>=70;
 const coherence=window.PS617_SYNC?.actorStatusFor?.(s.culprit,s)==='confirmed'&&s.method==='two_stage'&&s.alibi==='remote_not_presence';
 const invalidReason=reasons.some(r=>r.startsWith('trap-'))||reasons.some(r=>!r.trim());
 const contradictory=STATE.sim.ignoredTimeline||s.alibi==='card_proves'||s.alibi==='remote_proves'||s.alibi==='console_proves';
 const graphQuality=Math.round(validity.reduce((sum,ok,i)=>sum+cs[['meeting','mechanism','alibi','identity','chronology'][i]].score,0)/validity.length);
 const procedural=Math.max(0,100-(STATE.sim.errors*8)-(75-STATE.sim.trust)*.6);
 const filedRoles=['person','method','motive','alibi'].map(role=>({role,docs:fcRoleDocs(role)}));
 const rolesReady=filedRoles.every(o=>o.docs.length>=2&&fcFamilies(o.docs)>=2);
 const keyLinked=fcRoleDocs('person').includes(s.keystone);
 const strength=Math.max(0,Math.min(100,Math.min(Math.round(graphQuality*1.05),Math.round(graphQuality*.74+procedural*.18+(reasons.every(r=>r==='best')?8:0)-(invalidReason?9:0)-(contradictory?22:0)-(rolesReady?0:14)))));
 const badKey=!!(s.keystone&&!simIsVerified(s.keystone));
 const timelineIssues=simTimelineIssues();
 const weakReasons=[];
 for(const id of ['meeting','mechanism','alibi','identity','chronology'])if(!cs[id].ready)weakReasons.push('Niezweryfikowana teza: '+SIM_NODE_MAP.get(id).title+' ('+cs[id].score+'%).');
 if(badKey)weakReasons.push('Dowód kluczowy jest niekompletny lub niezweryfikowany.');
 if(!rolesReady)weakReasons.push('W akcie każdą z czterech ról dowodów powinny wspierać przynajmniej dwa źródła z niezależnych rodzin.');
 if(!keyLinked)weakReasons.push('Dowód kluczowy nie został przypisany do tezy o osobie.');
 if(!s.culprit||!s.method||!s.alibi||!s.keystone)weakReasons.push('Brakuje elementów aktu oskarżenia.');
 if(invalidReason)weakReasons.push('Jedno lub więcej uzasadnień nie respektuje ograniczeń źródeł.');
 if(!coherence)weakReasons.push('Wybrana rekonstrukcja osoby, mechanizmu lub alibi jest sprzeczna z pełną treścią akt.');
 if(timelineIssues.length)weakReasons.push('Oś czasu wykazuje '+timelineIssues.length+' nieusuniętych sprzeczności.');
 if(STATE.sim.trust<35)weakReasons.push('Błędy proceduralne obniżyły zaufanie prokuratorskie.');
 return {cs,complete,coherence,graphQuality,procedural,strength,weakReasons,badKey,rolesReady,keyLinked,timelineIssues,contradictory,unique:unique.size};
}
function simRenderHearing(){const area=$('simHearingDetail');if(!area)return;simRenderTop();
 const assessment=simCaseAssessment(),defense=simDefendEvaluation(),trial=STATE.sim.trial;
 $('fcChecklist').innerHTML=SIM_NODES.map(n=>{const q=assessment.cs[n.id];return `<div class=\"fc-check ${q.ready?'ok':'missing'}\"><b>${esc(n.title)} · ${q.score}%</b><span>${q.ready?'Próg wiarygodności osiągnięty':'Połącz niezależne źródła na tablicy dedukcyjnej'}</span></div>`;}).join('');
 $('fcBoardHints').innerHTML='<p class=\"muted small\">O jakości oskarżenia decydują powiązania źródeł i ich niezależność. Dodaj je także do czterech ról aktu. Brak obowiązkowej jednej pary dowodów.</p>';
 const messages=SIM_NODES.map(n=>`<div class="fc-check ${assessment.cs[n.id].ready?'ok':'missing'}"><b>${esc(n.title)}: ${assessment.cs[n.id].score}%</b><span>${assessment.cs[n.id].ready?'Istnieje kompletna niezależna droga dowodowa.':'Wymagany próg >80% dla przynajmniej jednej ścieżki.'}</span></div>`).join('');
 area.innerHTML=`<div class="sim-route-list"><div class="sim-route"><b>Siła materiału</b><strong style="font-size:25px">${assessment.strength}%</strong><p class="small muted">Wynik ważony, nie procent prawdopodobieństwa winy.</p></div><div class="sim-route"><b>Niezależne tezy</b><strong style="font-size:25px">${Object.values(assessment.cs).filter(x=>x.ready).length}/${SIM_NODES.length}</strong><p class="small muted">Sposób wykazania każdej tezy może być inny.</p></div><div class="sim-route"><b>Konsekwencje błędów</b><strong style="font-size:25px">${STATE.sim.errors}</strong><p class="small muted">Błędy kosztują czas i zaufanie.</p></div></div>
 <details><summary class="small" style="cursor:pointer;color:#efc990">Sprawdź, które tezy obrona może podważyć</summary>${messages}</details>
 <h4 style="margin:17px 0 9px">Kontradyktoryjna kontrola obrony · ${defense.passed}/${FC_CHALLENGES.length}</h4>
 <p class="small muted">Sześć zarzutów ma niezależne odpowiedzi. Każdy można odeprzeć albo porównaniem pełnego łańcucha źródeł, albo skonfrontowaniem go z kontrdowodem i jego ograniczeniami. Zaznaczenie wariantu bez materiałów nie wystarczy.</p>
 ${FC_CHALLENGES.map((q,i)=>{const answer=defense.responses.find(r=>r.id===q.id);return `<div class="sim-objection"><div class="sim-objection-head"><strong>${i+1}. ${esc(q.title)}</strong><span class="${answer.passed?'sim-strong':'sim-weak'}">${answer.passed?'Argument obroniony':'Wymaga uzasadnienia'}</span></div><p class="small muted">${esc(q.claim)}</p><label class="sim-field">Strategia odpowiedzi<select data-sim-objection="${q.id}"><option value="">— wybierz sposób konfrontacji —</option><option value="compare" ${answer.method==='compare'?'selected':''}>Porównaj niezależne źródła w grafie i ich ograniczenia</option><option value="limits" ${answer.method==='limits'?'selected':''}>Wskaż materiał podważający/ograniczający i odtwórz kontekst</option><option value="shortcut" ${answer.method==='shortcut'?'selected':''}>Uznaj jeden dowód za bezsporny</option><option value="skip" ${answer.method==='skip'?'selected':''}>Pomiń kontrargument</option></select></label><div class="small muted">Tezy do obrony: ${answer.nodes.map(id=>esc(SIM_NODE_MAP.get(id).title)).join(' · ')}</div></div>`;}).join('')}
 <label class="sim-warning" style="display:flex;align-items:flex-start;gap:10px"><input id="simIgnoreTimeline" type="checkbox" ${STATE.sim.ignoredTimeline?'checked':''}> Pomiń nierozwiązane sprzeczności chronologii i przedstaw wybraną wersję jako pewną — ryzyko błędu sądowego</label>
 <div class="formline" style="margin-top:14px"><button type="button" class="btn" data-sim-continue>Zamknij przewód i oceń rozstrzygnięcie</button><button type="button" class="btn alt" data-go="deduction">Wróć do sieci dowodowej</button></div>
 <p class="muted small" style="margin-top:12px">Nieprzygotowany akt nie blokuje zakończenia. W grze może zostać oddalony, a pominięcie dowodów odciążających grozi błędnym skazaniem.</p>
 ${trial?`<article class="sim-trial-result ${trial.kind==='solid'?'good':'bad'}" aria-live="polite"><div class="eyebrow">ROZSTRZYGNIĘCIE FABULARNE</div><h4>${esc(trial.title)}</h4><p>${esc(trial.text)}</p><p><b>Waga materiału:</b> ${trial.strength}%. <b>Analiza obrony:</b> ${esc(trial.defense)}</p>${trial.reasons.length?`<details><summary>Podważone elementy aktu</summary><ul>${trial.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></details>`:''}</article>`:''}`;
 // The only reliable tab switch for the added button is through the existing navigation API.
 area.querySelector('[data-go="deduction"]')?.addEventListener('click',()=>showTab('deduction'));
}
function simSubmit(){fcOnCharge();const s=STATE.final13;s.attempts++;s.submitted=!!(s.culprit&&s.method&&s.alibi&&s.keystone&&STATE.found.has(s.keystone));STATE.sim.trial=null;
 const a=simCaseAssessment();if(!s.culprit||!s.method||!s.alibi||!s.keystone){simError('Próba złożenia niekompletnego aktu oskarżenia.',4,5);s.feedback='Uzupełnij osobę, mechanizm, dowód kluczowy i ocenę alibi. Możesz już sprawdzić siłę materiału poniżej.';}
 else{if(!simScore(SIM_NODE_MAP.get('identity')).ready)simError('Bezpodstawne przypisanie sprawstwa bez zweryfikowanej identyfikacji.',4,6);else simTime(2,0,'Skierowano projekt aktu do oceny procesowej');s.feedback='Projekt przedstawiony. Zweryfikuj niezależne ścieżki dowodowe oraz odpowiedź na zarzuty obrony przed zamknięciem przewodu.';}
 if(s.submitted)window.PS617_SYNC?.enqueue?.({type:'file_indictment',indictment:{culprit:s.culprit,qualification:s.qualification||'intentional',method:s.method,alibi:s.alibi,keystone:s.keystone,reasons:{...s.reasons},links:s.links.map(x=>({role:x.role,id:x.id}))}});fcRender();simRenderHearing();PS_EVENTS.indictment();$('simHearing').scrollIntoView({block:'start',behavior:'smooth'});
}
function simTrial(){const s=STATE.final13,assessment=simCaseAssessment(),defense=simDefendEvaluation();
 if(!s.submitted)return toast('Najpierw złóż projekt aktu do kontroli.');
 if(defense.responses.some(x=>['shortcut','skip'].includes(x.method))){simError('Pominięto zarzut obrony lub przeceniono pojedynczy dowód.',3,4);}else simTime(2,0,'Kontrola kontradyktoryjna w fikcyjnej rozprawie');
 const differentPerson=!!s.culprit&&window.PS617_SYNC?.actorStatusFor?.(s.culprit,s)==='rejected';
 const miscarriage=differentPerson&&STATE.sim.ignoredTimeline&&(assessment.timelineIssues.length>0||['card_proves','remote_proves','console_proves'].includes(s.alibi));
 const solid=assessment.complete&&assessment.rolesReady&&assessment.keyLinked&&assessment.coherence&&assessment.strength>80&&STATE.sim.trust>=35&&!assessment.badKey&&defense.all&&!assessment.contradictory&&!assessment.timelineIssues.length;
 let result;
 if(miscarriage){result={kind:'miscarriage',title:'Błąd wymiaru sprawiedliwości — niewinna osoba skazana',
 text:'W tej alternatywnej gałęzi fabularnej obciążające poszlaki potraktowano jako wystarczające mimo sprzeczności osi czasu i dowodów odciążających. Zapadło błędne skazanie. Akta ujawniają zaniedbania śledczego.',defense:'Zignorowano kontrargumenty',reasons:[...assessment.weakReasons,...defense.weak]};}
 else if(solid){result={kind:'solid',title:'Pełny sukces — akt wytrzymał ocenę obrony',text:'Kilka niezależnych dróg prowadzi do zgodnej rekonstrukcji sprawy Leny. Materiał techniczny, osobowy i chronologia zostały zestawione z ich ograniczeniami. W realnym postępowaniu o wyniku rozstrzygałby sąd.',defense:'Obroniono wszystkie sześć zarzutów na podstawie niezależnych źródeł',reasons:[]};}
 else {result={kind:'weak',title:'Słaba sprawa — oskarżenie nie zostało utrzymane',text:'W fikcyjnej kontroli kontradyktoryjnej obrona skutecznie podważyła kluczowe ogniwa rozumowania. Postępowanie kończy się umorzeniem lub uniewinnieniem w zależności od przedstawionej rekonstrukcji; nie oznacza to automatycznego ustalenia, co zaszło.',defense:defense.all?'Odpowiedzi na zarzuty były poprawne, lecz materiał pozostał niewystarczający':'Nie obroniono '+defense.weak.length+' z sześciu zarzutów',reasons:[...assessment.weakReasons,...defense.weak.map(title=>'Nieodparty zarzut: '+title)]};}
 result.strength=assessment.strength;STATE.sim.trial=result;simRenderHearing();
 document.getElementById('simHearing').scrollIntoView({block:'start',behavior:'smooth'});
}
// Adaptacja dotychczasowych ekranów; stare, liniowe warunki nie rozstrzygają już zakończenia.
const simOldDedRender=dedRender;dedRender=function(){simOldDedRender();simRenderGraph();};
const simOldFcRender=fcRender;fcRender=function(){simOldFcRender();$('fcDefense').hidden=true;$('fcVerdictPanel').hidden=true;simRenderHearing();
 $('fcProgress').innerHTML=`<div><b>I. Budowa argumentacji</b>Trzy niezależne ścieżki dla każdej tezy</div><div><b>II. Decyzje śledczego</b>Każdy błąd wpływa na zasoby i sprawę</div><div><b>III. Kontrola kontradyktoryjna</b>Finał zależy od jakości materiałów</div>`;
};
const simOldRenderChat=renderChat;renderChat=function(){simOldRenderChat();simRenderInterrogation();};
// Funkcja została wcześniej podpięta referencją do przycisku; zmiana w DOM eliminuje stary listener.
const simSendButton=$('chatSend'),simNewButton=simSendButton.cloneNode(true);simSendButton.replaceWith(simNewButton);
simNewButton.addEventListener('click',simSendChat);sendChat=simSendChat; // Enter korzysta z dynamicznego odwołania.
registerSaveHook({name:'core-investigation-simulation',build(d){const st=STATE.sim;
 d.investigationSim={filed:STATE.final13.submitted,time:st.time,trust:st.trust,errors:st.errors,events:st.events,links:st.links,verified:st.verified,challenges:st.challenges,ignoredTimeline:st.ignoredTimeline,trial:st.trial,extensions:st.extensions,selected:st.selected,witness:st.witness};},apply(d){simRestore(d?.investigationSim);simRenderGraph();simRenderHearing();renderChat();}});
function simRestore(d){const fresh=simFresh();if(!d||typeof d!=='object'){STATE.sim=fresh;return;}
 fresh.time=Math.max(0,Math.min(150,Number(d.time)||0));fresh.trust=simClamp(d.trust);fresh.errors=Math.max(0,Math.min(1000,Number(d.errors)||0));
 fresh.extensions=Math.max(0,Math.min(1,Number(d.extensions)||0));
 fresh.verified=(Array.isArray(d.verified)?d.verified:[]).filter(id=>SIM_DEGRADED[id]&&STATE.found.has(id)&&simHasVerification(id));
 for(const n of SIM_NODES){const values=Array.isArray(d.links?.[n.id])?d.links[n.id]:[];const seen=new Set();fresh.links[n.id]=values.filter(l=>l&&typeof l.id==='string'&&STATE.found.has(l.id)&&['supports','refutes','limits','context'].includes(l.role)&&!seen.has(l.id+':'+l.role)&&seen.add(l.id+':'+l.role)).slice(0,32).map(x=>({id:x.id,role:x.role}));}
 fresh.events=(Array.isArray(d.events)?d.events:[]).filter(x=>x&&typeof x.reason==='string').slice(0,100).map(x=>({reason:x.reason.slice(0,180),cost:Math.max(-18,Math.min(20,Number(x.cost)||0)),trustDelta:Math.max(-20,Math.min(20,Number(x.trustDelta)||0))}));
 fresh.selected=SIM_NODE_MAP.has(d.selected)?d.selected:'conceal';fresh.ignoredTimeline=!!d.ignoredTimeline;
 fresh.challenges=Object.fromEntries(FC_CHALLENGES.map(q=>[q.id,['compare','limits','shortcut','skip'].includes(d.challenges?.[q.id])?d.challenges[q.id]:'']));
 for(const c of CONTENT.characters){const raw=d.witness?.[c.id];fresh.witness[c.id]={blocked:!!raw?.blocked,breaks:Math.max(0,Math.min(100,Number(raw?.breaks)||0)),contradiction:!!raw?.contradiction};}
 // Wyrok ponownie obliczany po wczytaniu — dane JSON nie są niezależnym dowodem.
 fresh.trial=null;STATE.sim=fresh;
 STATE.final13.submitted=!!d.filed&&!!STATE.final13.culprit&&!!STATE.final13.method&&!!STATE.final13.alibi&&!!STATE.final13.keystone;
}
const simBaseFcReset=fcReset;fcReset=function(){simBaseFcReset();if(STATE.sim){STATE.sim.trial=null;simRenderHearing();}};
// Reset odbywa się po potwierdzeniu, nie przy samym otwarciu okna potwierdzenia.
// Handler resetowania głównego zastąpiłby resztę mechanik, zatem wołanie simReset dodano w oryginalnej akcji.
simInitUI();simRenderGraph();simRenderHearing();renderChat();
window.PS_SIM_TEST={nodes:SIM_NODES,quality:simQuality,score:simScore,assess:simCaseAssessment,reset:simReset,select:(id)=>{STATE.sim.selected=id;simRenderGraph();},state:()=>STATE.sim};

