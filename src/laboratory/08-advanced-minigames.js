
/* Prawdziwe Śledztwo / Mini-gry 2.0. Kontrolowane rozszerzenie pięciu istniejących pracowni. */
(function(){
'use strict';
const GAMES=['tcms','msg','cctv','forensic','access'];
const TITLES={tcms:'Korelacja sygnałów TCMS',msg:'Laboratorium połączeń bloków',cctv:'Stół synchronizacji kamer',forensic:'Porównywarka profili materiałowych',access:'Konfrontacja zapisów strefowych'};
const EXPLAIN={
 tcms:'Porównaj samodzielnie dwa przypięte pakiety. Rozstrzygnij, czy reprezentują ten sam kod w tej samej sesji, różne kody w tej samej sesji czy inne sesje. Uważaj na retransmisje.',
 msg:'Zestaw sąsiadujące bloki wybrane do własnej rekonstrukcji. Oceń zgodność wskaźników prev/next oraz wątku. Spójny łańcuch nie rozstrzyga, kto wysłał wiadomość.',
 cctv:'Ustal robocze odchylenia zegarów, a następnie porównaj czas centralny dwóch ręcznie przypisanych kadrów. Nie myl kolejności zdarzeń z identyfikacją osoby.',
 forensic:'Zobacz sześć cech liczbowych próbek i sklasyfikuj ich podobieństwo. Porównanie materiału nie oznacza identyfikacji sprawcy ani pewnego pochodzenia śladu.',
 access:'Wybierz dwa wpisy z własnego dziennika i określ ich kolejność. Zestawienie czasu nie rozstrzyga tożsamości użytkownika karty ani fizycznej obecności.'
};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const mkOption=(v,l)=>`<option value="${esc(v)}">${esc(l)}</option>`;
const prog=()=>({tcms:0,msg:0,cctv:0,forensic:0,access:0});
let progress=prog();
let certified=Object.fromEntries(GAMES.map(k=>[k,[]]));
const ui={tcms:{a:'',b:'',answer:''},msg:{a:'',b:'',answer:''},cctv:{a:'',b:'',answer:''},forensic:{answer:''},access:{a:'',b:'',answer:''}};
let failures={};
let mounted=false;
function title(k){return `<div class="mg2-top"><div><span class="eyebrow">PORÓWNANIE MATERIAŁÓW</span><h3>${TITLES[k]}</h3><p>${EXPLAIN[k]} <b>Wykorzystaj poniższe narzędzia do sprawdzenia swoich ustaleń.</b></p></div><span class="mg2-status ${progress[k]?'done':''}" id="mg2-status-${k}">${progress[k]?'KONTROLA ZALICZONA':'KONTROLA PRZED RAPORTEM'}</span></div>`;}
const options=(arr,val)=>arr.map(([v,label])=>`<option value="${esc(v)}" ${v===val?'selected':''}>${esc(label)}</option>`).join('');
function choose(k,key,list,placeholder){return `<label>${esc(placeholder)}<select data-mg2-field="${key}"><option value="">— Wybierz —</option>${options(list,ui[k][key]||'')}</select></label>`;}
function question(k,choices){return `${choose(k,'answer',choices,'Ocena / hipoteza')}<div class="mg2-actions"><button class="mg2-action" data-mg2-check="${k}" type="button">Sprawdź ocenę</button><button class="mg2-action alt" data-mg2-refresh="${k}" type="button">Odśwież analizę</button></div><div class="mg2-message" id="mg2-feedback-${k}" role="status" aria-live="polite"></div>`;}
function chooseFrom(k,key,items,label){return choose(k,key,items.map(x=>[x.id,x.id+' · '+(x.code||x.block||x.display||x.time||x.kind||'')]),label);}
function selectedTc(){return STATE.tcms.bookmarks.map(id=>TCMS_LOGS.find(r=>r.id===id)).filter(Boolean);}
function plotTC(rows){
 if(!rows.length)return '<p class="mg2-help">Przypnij co najmniej dwa pakiety w tabeli TCMS, aby narysować oś czasu.</p>';
 const sorted=[...rows].sort((a,b)=>String(a.instant).localeCompare(String(b.instant)));
 const times=sorted.map(x=>Date.parse(x.instant)).filter(Number.isFinite);
 const min=Math.min(...times),max=Math.max(...times),span=Math.max(60000,max-min);
 const render=sorted.slice(0,30).map((r,i)=>{
 const ms=Date.parse(r.instant),x=36+((ms-min)/span)*696;
 const lane=i%3, y=38+lane*53;
 return `<g><circle cx="${x.toFixed(1)}" cy="${y}" r="6.5" fill="${r.quality==='RETRY'?'#9f7773':'#caa169'}"/><text x="${Math.min(696,x+8).toFixed(1)}" y="${y-10}" fill="#dde0de" font-size="10">${esc(r.id)}</text></g>`;
 }).join('');
 return `<svg viewBox="0 0 760 185" role="img" aria-label="Oś czasu ${sorted.length} przypiętych pakietów TCMS"><line x1="36" y1="18" x2="736" y2="18" stroke="#71808b"/><line x1="36" y1="159" x2="736" y2="159" stroke="#596d75"/><text x="35" y="177" fill="#b3c1c6" font-size="10">${new Date(min).toLocaleString('pl-PL')}</text><text x="735" y="177" text-anchor="end" fill="#b3c1c6" font-size="10">${new Date(max).toLocaleString('pl-PL')}</text>${render}</svg>`;
}
function tcmsUI(){
 const rows=selectedTc(),list=rows.map(r=>[r.id,`${r.id} · ${r.time} · ${r.session} · ${r.code}`]);
 return `<div class="mg2-plot">${plotTC(rows)}</div><div class="mg2-controls two">${choose('tcms','a',list,'Pakiet pierwszy (przypięty)')}${choose('tcms','b',list,'Pakiet drugi (przypięty)')}</div><div class="mg2-controls">${question('tcms',[['same_code','Ten sam kod i sesja'],['same_session','Ta sama sesja, inny kod'],['different','Różne sesje']])}</div>`;
}
function msgUI(){
 const rows=STATE.msg.chain.map(id=>MSG_BY_ID[id]).filter(Boolean);
 const list=rows.map(r=>[r.id,`${r.id} · blok ${r.block} · ${r.thread}`]);
 const nodes=rows.length?rows.map((r,i)=>`${i?'<span class="mg2-edge" aria-hidden="true">→</span>':''}<div class="mg2-node"><b>${esc(r.block)}</b><small>${esc(r.id)}</small><small>${esc(r.prev)} → ${esc(r.next)}</small><small>${esc(r.thread)}</small></div>`).join(''):'<p class="mg2-help">Wybierz fragmenty w tabeli i dodaj je do łańcucha. Ich kolejności nie zmieniamy automatycznie.</p>';
 return `<div class="mg2-nodes">${nodes}</div><div class="mg2-controls two">${choose('msg','a',list,'Blok poprzedzający')}${choose('msg','b',list,'Blok następujący')}</div><div class="mg2-controls">${question('msg',[['linked','Wskaźniki tworzą spójne połączenie'],['broken','Połączenie jest sprzeczne lub niepotwierdzone']])}</div>`;
}
function selectedCV(){const st=STATE.cctv;return [...new Set([st.selected,...Object.values(st.anchor||{}),...st.route||[]].filter(Boolean))].map(id=>CCTV_BYID[id]).filter(Boolean);}
function corrected(f){const raw=Date.parse(f.rawISO),val=STATE.cctv.offsets[f.camera];return val===''||!Number.isFinite(Number(val))?NaN:raw-Number(val)*1000;}
function cameraUI(){
 const list=selectedCV().map(x=>[x.id,`${x.id} · kamera ${x.camera} · ${x.display}`]);
 const clocks=['A','B','C'].map(cam=>{const raw=STATE.cctv.offsets[cam];const value=raw===''?'0':raw;return `<label>Kamera ${cam}<input type="range" min="-300" max="300" step="1" value="${esc(value)}" data-mg2-clock="${cam}" aria-label="Korekta zegara kamery ${cam} w sekundach"><strong id="mg2-clock-label-${cam}">${raw===''?'Nie ustawiono':value+' s'}</strong></label>`;}).join('');
 return `<p class="mg2-key">Przesunięcie oznacza różnicę czasu kamery względem zegara centralnego. Przesuwanie suwaka aktualizuje pola kalibracji w oryginalnym raporcie.</p><div class="mg2-clock">${clocks}</div><div class="mg2-controls two">${choose('cctv','a',list,'Porównywany kadr A')}${choose('cctv','b',list,'Porównywany kadr B')}</div><div class="mg2-controls">${question('cctv',[['earlier','A wcześniej niż B'],['later','A później niż B'],['same','Ten sam czas centralny']])}</div>`;
}
function forensicUI(){
 const a=FO_BYID[STATE.forensic.left],b=FO_BYID[STATE.forensic.right];
 if(!a||!b)return '<p class="mg2-help">W inspektorze próbek wybierz dwie próbki do porównania. Warsztat pokaże rzeczywiste cechy profili z archiwum, nie odgadnie wyniku za Ciebie.</p><button class="mg2-action alt" data-mg2-refresh="forensic" type="button">Sprawdź wybrane próbki</button>';
 const w=600,h=218,colors=['#d6b37a','#7db6bd'];
 const rects=a.vector.map((x,i)=>{
 const xx=46+i*90,bar=(arr,j)=>{const height=Math.max(0,Math.min(100,Number(arr.vector[i])||0))*1.4;return `<rect x="${xx+j*21}" y="${177-height}" width="18" height="${height}" fill="${colors[j]}" rx="2"/>`;};
 return `${bar(a,0)}${bar(b,1)}<text x="${xx+20}" y="194" fill="#aebfc5" font-size="10" text-anchor="middle">C${i+1}</text>`;
 }).join('');
 const svg=`<svg viewBox="0 0 600 218" role="img" aria-label="Sześć cech profilu dwóch wybranych próbek"><line x1="25" y1="177" x2="580" y2="177" stroke="#73818b"/>${rects}<text x="22" y="16" fill="#dfc296" font-size="11">● ${esc(a.id)} — bursztyn</text><text x="210" y="16" fill="#8dcbd1" font-size="11">● ${esc(b.id)} — błękit</text></svg>`;
 return `<div class="mg2-compare"><div class="mg2-sample"><strong>${esc(a.id)} · ${esc(a.kind)}</strong><p>${esc(a.description)}<br>Plomba: ${esc(a.seal)} · transfer: ${esc(a.risk)}</p></div><div class="mg2-sample"><strong>${esc(b.id)} · ${esc(b.kind)}</strong><p>${esc(b.description)}<br>Plomba: ${esc(b.seal)} · transfer: ${esc(b.risk)}</p></div></div><div class="mg2-plot">${svg}</div><div class="mg2-controls">${question('forensic',[['match','Zgodność klasy materiału'],['uncertain','Wynik niejednoznaczny'],['different','Brak zgodności klasy'],['uncomparable','Materiałów nie można porównać']])}</div>`;
}
function accessUI(){
 const rows=STATE.access.pinned.map(id=>AX_BYID[id]).filter(Boolean),list=rows.map(r=>[r.id,`${r.id} · ${r.day} ${r.time} · ${r.system}`]);
 const route=STATE.access.route||[];
 const legs=typeof accessSegments==='function'?accessSegments(route):[];
 const marks=route.map((r,i)=>`<div class="mg2-node"><b>${i+1}. ${esc(r.zone||'Nieustalone')}</b><small>${esc(r.time||'--:--:--')}</small></div>`).join('<span class="mg2-edge" aria-hidden="true">→</span>');
 const invalid=legs.filter(l=>!l.valid).length;
 return `<div class="mg2-nodes">${marks}</div><p class="mg2-key">Projekt trasy: ${route.filter(r=>r.zone).length}/5 punktów; ${invalid} z ${legs.length} odcinków wymaga sprawdzenia. Trasa opiera się na Twoich ustaleniach.</p><div class="mg2-controls two">${choose('access','a',list,'Przypięty wpis A')}${choose('access','b',list,'Przypięty wpis B')}</div><div class="mg2-controls">${question('access',[['earlier','Wpis A jest wcześniejszy'],['later','Wpis A jest późniejszy'],['same','Oba mają ten sam znacznik czasu']])}</div>`;
}
const renderers={tcms:tcmsUI,msg:msgUI,cctv:cameraUI,forensic:forensicUI,access:accessUI};
function feedback(k,msg,ok){const e=$(`mg2-feedback-${k}`);if(!e)return;e.textContent=msg;e.classList.toggle('ok',ok===true);e.classList.toggle('bad',ok===false);}
function verify(k){
 const u=ui[k],a=u.a,b=u.b;
 let result=false,description='',needs='';
 if(k==='tcms'){
  const r=TCMS_LOGS.find(x=>x.id===a),s=TCMS_LOGS.find(x=>x.id===b);
  if(!r||!s||a===b){needs='Wybierz dwa różne, przypięte pakiety.';}
  else {const expected=r.session!==s.session?'different':r.code===s.code?'same_code':'same_session';result=u.answer===expected;description=`${r.id}: ${r.session}, ${r.code}, ${r.quality}; ${s.id}: ${s.session}, ${s.code}, ${s.quality}. Porównaj również znaczniki czasu i retransmisje.`;}
 } else if(k==='msg'){
  const r=MSG_BY_ID[a],s=MSG_BY_ID[b];
  if(!r||!s||a===b||!STATE.msg.chain.includes(a)||!STATE.msg.chain.includes(b))needs='Najpierw wybierz dwa różne bloki z własnego łańcucha.';
  else {const expected=r.next===s.block&&s.prev===r.block&&r.thread===s.thread?'linked':'broken';result=u.answer===expected;description=`${r.block} → ${r.next}; ${s.prev} → ${s.block}. Wątki: ${r.thread} / ${s.thread}. To kontrola ciągłości indeksów, nie dowód tożsamości nadawcy.`;}
 } else if(k==='cctv'){
  const r=CCTV_BYID[a],s=CCTV_BYID[b];
  if(!r||!s||a===b)needs='Przypisz co najmniej dwa różne kadry w istniejącym narzędziu CCTV.';
  else {const x=corrected(r),y=corrected(s);if(!Number.isFinite(x)||!Number.isFinite(y))needs='Ustaw przesunięcia zegarów dla kamer wybranych kadrów.';
  else {const expected=x<y?'earlier':x>y?'later':'same';result=u.answer===expected;description=`Po Twojej korekcie: ${r.id} — ${new Date(x).toISOString().slice(11,19)}, ${s.id} — ${new Date(y).toISOString().slice(11,19)} (czas centralny). To nie oznacza potwierdzonej kalibracji.`;}}
 } else if(k==='forensic'){
  const x=FO_BYID[STATE.forensic.left],y=FO_BYID[STATE.forensic.right];
  if(!x||!y||x.id===y.id)needs='Wybierz dwie różne próbki z archiwum.';
  else {const distance=forensicDistance(x.id,y.id),expected=distance===null?'uncomparable':distance<=7?'match':distance<=17?'uncertain':'different';result=u.answer===expected;description=`Porównanie klas: ${x.kind} i ${y.kind}. ${distance===null?'Różne typy próbek — odległość nie ma znaczenia.':'Średnia różnica profili: '+distance.toFixed(1)+'.'} Podobieństwo nie identyfikuje konkretnej osoby.`;}
 } else if(k==='access'){
  const r=AX_BYID[a],s=AX_BYID[b];
  if(!r||!s||a===b||!STATE.access.pinned.includes(a)||!STATE.access.pinned.includes(b))needs='Przypnij dwa różne wpisy do dziennika w analizie dostępu.';
  else {const clock=z=>{const date=String(z.day||'18.11').split('.');return Number(date[0])*86400+Number((z.time||'00:00:00').split(':')[0])*3600+Number((z.time||'00:00:00').split(':')[1])*60+Number((z.time||'00:00:00').split(':')[2]);};const x=clock(r),y=clock(s),expected=x<y?'earlier':x>y?'later':'same';result=u.answer===expected;description=`${r.id}: ${r.day} ${r.time}, ${r.system}; ${s.id}: ${s.day} ${s.time}, ${s.system}. Uwaga na źródło i jakość obu zapisów.`;}
 }
 if(needs){feedback(k,needs,false);return;}
 if(!u.answer){feedback(k,'Wybierz interpretację do sprawdzenia.',false);return;}
 if(result){const signature=(k==='forensic'?[STATE.forensic.left,STATE.forensic.right].sort().join('|'):k==='cctv'?[a,b].sort().join('|')+'#'+['A','B','C'].map(c=>STATE.cctv.offsets[c]).join(','):[a,b].sort().join('|'));if(!certified[k].includes(signature)&&certified[k].length<150)certified[k].push(signature);progress[k]=certified[k].length;feedback(k,'Poprawna interpretacja. '+description,true);const badge=$(`mg2-status-${k}`);if(badge){badge.classList.add('done');badge.textContent='ZALICZONE · POPRAWNE OCENY: '+progress[k];}}
 else {failures[k]=(failures[k]||0)+1;feedback(k,'Wniosek nie zgadza się z danymi. Sprawdź identyfikatory, kolejność i pochodzenie zapisów, a następnie porównaj je ponownie.',false);}
}
function render(k){const host=$(`mg2-host-${k}`);if(!host)return;
 host.innerHTML=title(k)+(renderers[k]?.()||'');
 if(failures[k])feedback(k,'W tej sesji odrzucono '+failures[k]+' wcześniejszych interpretacji. Możesz spróbować ponownie.',null);
}
function mount(k){const root=$({tcms:'tcmsWorkspace',msg:'msgWorkspace',cctv:'cctvWorkspace',forensic:'forensicWorkspace',access:'accessWorkspace'}[k]);
 if(!root||!root.children.length)return;
 let host=$(`mg2-host-${k}`);
 if(!host){host=document.createElement('section');host.id=`mg2-host-${k}`;host.className='mg2-panel';host.setAttribute('aria-label',TITLES[k]);root.appendChild(host);render(k);}
}
function sync(){for(const k of GAMES){const pane=$(`${k}Panel`);if(pane&&!pane.hidden)mount(k);}}
function wire(){
 if(mounted)return;mounted=true;
 for(const k of GAMES){const root=$({tcms:'tcmsWorkspace',msg:'msgWorkspace',cctv:'cctvWorkspace',forensic:'forensicWorkspace',access:'accessWorkspace'}[k]);if(!root)continue;
  const ob=new MutationObserver(records=>{if(records.some(r=>r.type==='childList' && [...r.addedNodes].some(n=>n.nodeType===1 && n.id!==`mg2-host-${k}`)))queueMicrotask(()=>mount(k));});
  ob.observe(root,{childList:true});
 }
 // Minimalna kontrola analityczna przed złożeniem końcowego raportu.
 // Dotychczas rozwiązane minigry z wcześniejszych zapisów zachowują wynik.
 const submitIds={tcmsSubmit:'tcms',msgSubmit:'msg',cvSubmit:'cctv',foSubmit:'forensic',axSubmit:'access'};
 document.addEventListener('click',e=>{
  const button=e.target.closest?.('button');if(!button)return;
  const k=submitIds[button.id];if(!k||progress[k]>0||STATE[k]?.solved||window.PS_MG3_QA?.status?.()[k]===3)return;
  e.preventDefault();e.stopImmediatePropagation();
  mount(k);
  feedback(k,'Przed zatwierdzeniem raportu porównaj dane w pracowni analitycznej.',false);
  $(`mg2-host-${k}`)?.scrollIntoView({behavior:'auto',block:'center'});
 },true);
 document.addEventListener('click',e=>{
  const item=e.target.closest('[data-mg2-check],[data-mg2-refresh]');if(!item)return;
  const k=item.dataset.mg2Check||item.dataset.mg2Refresh;if(!GAMES.includes(k))return;
  if(item.dataset.mg2Check)verify(k);else render(k);
 });
 document.addEventListener('change',e=>{
  const field=e.target.closest('[data-mg2-field]');if(field){const host=field.closest('.mg2-panel'),k=host?.id?.replace('mg2-host-','');if(GAMES.includes(k))ui[k][field.dataset.mg2Field]=field.value;}
  const clock=e.target.closest('[data-mg2-clock]');if(clock){const cam=clock.dataset.mg2Clock;if(!['A','B','C'].includes(cam))return;STATE.cctv.offsets[cam]=clock.value;const native=$('cctvWorkspace')?.querySelector(`[data-cv-offset="${cam}"]`);if(native){native.value=clock.value;native.dispatchEvent(new Event('input',{bubbles:true}));}const label=$(`mg2-clock-label-${cam}`);if(label)label.textContent=clock.value+' s';}
 });
 document.addEventListener('input',e=>{
  const clock=e.target.closest('[data-mg2-clock]');if(!clock)return;
  const cam=clock.dataset.mg2Clock, label=$(`mg2-clock-label-${cam}`);if(label)label.textContent=clock.value+' s';
 });
 // Trwałość osiągnięć warsztatu: wynik pomocniczy, bez wpływu na warunki mini-gier i dostęp do akt.
 if(typeof buildSave==='function'&&typeof applySave==='function'){
  
  /* SaveManager: buildSave hook. */
registerSaveHook({name:"08-advanced-minigames-save1", build(__save){const saved=__save;saved.minigames2={v:2,progress:{...progress},certified:Object.fromEntries(GAMES.map(k=>[k,[...certified[k]]]))};return saved;}});
  /* SaveManager: applySave hook. */
registerSaveHook({name:"08-advanced-minigames-load1", apply(saved){undefined;const data=saved?.minigames2?.certified;progress=prog();certified=Object.fromEntries(GAMES.map(k=>[k,[]]));if(data&&typeof data==='object')for(const k of GAMES){const arr=data[k];if(Array.isArray(arr)){certified[k]=[...new Set(arr.filter(x=>typeof x==='string'&&x.length<=150))].slice(0,150);progress[k]=certified[k].length;}}for(const k of GAMES)render(k);}});
 }
 sync();
 document.querySelectorAll('[data-tab="labs"],[data-go="labs"]').forEach(el=>el.addEventListener('click',()=>queueMicrotask(sync)));
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-open-lab]'))queueMicrotask(sync);});
 window.PS_MG2_QA={check:()=>({progress:{...progress},hosts:GAMES.filter(k=>!!$(`mg2-host-${k}`)),games:GAMES.length}),refresh:sync,reset:()=>{progress=prog();certified=Object.fromEntries(GAMES.map(k=>[k,[]]));for(const k of GAMES)render(k);}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();

