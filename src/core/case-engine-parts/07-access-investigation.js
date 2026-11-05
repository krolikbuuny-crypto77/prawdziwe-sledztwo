
const ACCESS_SECRET={"inputs":["VIS-09","ADM-07","EVID_T17_DOOR_EVENT","ADM-11","ADM-12","EVID_CCTV_SYNC","DIG-09","EVID_CONFERENCE_SESSION"],"gate_inputs":["VIS-09","ADM-07","ADM-11","ADM-12"],"outputs":["ADM-04"],"key_ids":["AC-QUIET","AC-AUD-CCTV","AC-SOUTH","AC-BAY","AC-SHOCK","AC-RETURN","AC-RESUME"],"source_pair":["EVID_CCTV_SYNC","EVID_T17_DOOR_EVENT"],"waypoints":["AUD","SOUTH","BAY3","SOUTH","AUD"],"minLegSeconds":[80,135,135,80],"waypointTimes":["01:38:00","01:39:24","01:41:40","01:49:41","01:52:48"],"judgments":{"badge":"karta_nie_osoba","meeting":"sesja_nie_obecnosc","route":"wykonalna_nie_dowodzi","exit":"wyjscie_bez_karty","blindspot":"brak_obserwacji_niszy"},"documentation":"Podstawowe czasy AUD→SOUTH 80 s, SOUTH→BAY3 135 s; czas zdarzenia czujnika 01:44 nie jest dokładną minutą zgonu."};
const AX_BYID=Object.fromEntries(ACCESS_RECORDS.map(x=>[x.id,x]));
const AX_ZONES=[['AUD','Pokój audytu'],['SOUTH','Drzwi południowe'],['BAY3','Stanowisko 3'],['WORK','Warsztat'],['DISP','Dyspozytornia'],['DIAG','Diagnostyka'],['ADMIN','Administracja'],['BAY2','Stanowisko 2']];
const AX_LEGS={'AUD|SOUTH':80,'SOUTH|BAY3':135,'AUD|BAY3':215,'DISP|BAY3':210,'DIAG|BAY3':130,'SOUTH|WORK':90,'WORK|BAY3':75,'ADMIN|AUD':65};
const AX_PAIRS=(a,b)=>AX_LEGS[a+'|'+b]??AX_LEGS[b+'|'+a]??null;
function accessDefault(){return {filters:{system:'',zone:'',credential:'',quality:'',query:''},page:0,selected:'',pinned:[],route:[{zone:'',time:''},{zone:'',time:''},{zone:'',time:''},{zone:'',time:''},{zone:'',time:''}],assessment:{badge:'',meeting:'',route:'',exit:'',blindspot:'',source1:'',source2:'',notes:''},attempts:0,solved:false};}
function accessExport(){const a=STATE.access;return {filters:{...a.filters},page:a.page,selected:a.selected,pinned:[...a.pinned],route:a.route.map(x=>({...x})),assessment:{...a.assessment},attempts:a.attempts};}
function accessAvailable(){return ACCESS_SECRET.gate_inputs.filter(id=>STATE.found.has(id)).length>=2;}
function accessToSeconds(t){if(!/^\d\d:\d\d:\d\d$/.test(t))return NaN;const [h,m,s]=t.split(':').map(Number);return h<24&&m<60&&s<60?h*3600+m*60+s:NaN;}
function accessSegments(route){return route.slice(0,-1).map((r,i)=>{const n=route[i+1],min=AX_PAIRS(r.zone,n.zone),a=accessToSeconds(r.time),b=accessToSeconds(n.time);return {from:r.zone,to:n.zone,min,actual:Number.isFinite(a)&&Number.isFinite(b)?b-a:null,valid:min!==null&&Number.isFinite(a)&&Number.isFinite(b)&&b-a>=min};});}
function accessCheck(st,found){if(!st||!ACCESS_SECRET.inputs.every(id=>found.has(id)))return false;
 const pins=new Set((st.pinned||[]).filter(id=>AX_BYID[id]));if(!ACCESS_SECRET.key_ids.every(x=>pins.has(x)))return false;
 const path=st.route;if(!Array.isArray(path)||path.length!==5)return false;
 if(path.some((node,i)=>!node||node.zone!==ACCESS_SECRET.waypoints[i]||node.time!==ACCESS_SECRET.waypointTimes[i]))return false;
 if(!accessSegments(path).every(x=>x.valid))return false;
 const v=st.assessment||{};
 if(Object.entries(ACCESS_SECRET.judgments).some(([k,val])=>v[k]!==val))return false;
 if(v.source1!=='EVID_CCTV_SYNC'||v.source2!=='EVID_T17_DOOR_EVENT')return false;
 const note=String(v.notes||'').trim();if(note.startsWith('m5:'))return mini5Correct('access',note);if(note.length<110)return false;
 if(!/(kart|identyfikat|t-17|nosnik)/i.test(note)||!/(sesj|audyt|transmisj|wideokonferenc)/i.test(note))return false;
 return true;
}
function accessFiltered(){const f=STATE.access.filters,q=norm(f.query);return ACCESS_RECORDS.filter(x=>(!f.system||x.system===f.system)&&(!f.zone||x.zone===f.zone)&&(!f.credential||x.credential===f.credential)&&(!f.quality||x.quality===f.quality)&&(!q||norm([x.id,x.day,x.time,x.system,x.zone,x.credential,x.action,x.detail].join(' ')).includes(q)));}
function accessRefresh(){tcmsCards();if($('accessPanel')&&!$('accessPanel').hidden)accessRender();}
let accessMapStep=0;
const AX_COORD={AUD:[124,68],ADMIN:[124,172],SOUTH:[316,68],WORK:[316,172],BAY3:[520,68],BAY2:[520,172],DIAG:[510,276],DISP:[124,276]};
function accessMapSvg(){
 const selected=STATE.access.route.map(p=>p.zone).filter(Boolean),links=Object.entries(AX_LEGS).map(([key,seconds])=>{const [a,b]=key.split('|'),p=AX_COORD[a],q=AX_COORD[b];return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#48606e" stroke-width="3" opacity=".65"/>`;}).join('');
 const nodes=Object.entries(AX_COORD).map(([id,[x,y]])=>`<g data-ax-map="${id}" tabindex="0" role="button" aria-label="Wstaw ${id} do punktu ${accessMapStep+1}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="29" fill="${selected.includes(id)?'#62482d':'#1b2b35'}" stroke="${selected.includes(id)?'#edbc73':'#66808c'}" stroke-width="2"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="12" font-weight="700" fill="#f1e9da">${id}</text></g>`).join('');
 return `<div class="ax-map-toolbar"><span>Mapa interaktywna: wybierz węzeł, aby wpisać go do punktu trasy</span><label>Aktualny punkt<select id="axMapStep">${[0,1,2,3,4].map(i=>`<option value="${i}" ${accessMapStep===i?'selected':''}>${i+1}</option>`).join('')}</select></label></div><div class="ax-svg-viewport"><svg role="group" aria-label="Mapa topologiczna przejść zajezdni, nie w skali" viewBox="0 0 660 345" xmlns="http://www.w3.org/2000/svg">${links}${nodes}</svg></div>`;
}
function accessWireMap(){const step=$('axMapStep');if(!step)return;step.addEventListener('change',()=>{accessMapStep=Number(step.value);accessMapRerender();});
 document.querySelectorAll('[data-ax-map]').forEach(el=>{
  const set=()=>{const id=el.getAttribute('data-ax-map');STATE.access.route[accessMapStep].zone=id;const sel=document.querySelector(`[data-ax-zone="${accessMapStep}"]`);if(sel)sel.value=id;accessMapStep=(accessMapStep+1)%5;accessMapRerender();};
  el.addEventListener('click',set);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();set();}});
 });}
function accessMapRerender(){const el=$('axMapRoot');if(!el)return;el.innerHTML=accessMapSvg();accessWireMap();}
function accessSelect(k,label,opts){return `<label>${esc(label)}<select id="ax_${k}"><option value="">Wybierz interpretację...</option>${opts.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>`;}
function accessRender(){const root=$('accessWorkspace'),st=STATE.access;if(!root)return;
 const pills=ACCESS_SECRET.inputs.map(id=>`<span class="ax-pill ${STATE.found.has(id)?'have':''}">${esc(docName(id))} · ${STATE.found.has(id)?'uzyskano':'do odnalezienia'}</span>`).join('');
 if(!accessAvailable()){root.innerHTML=`<section class="surface padded"><div class="eyebrow">KONTROLA DOSTĘPU</div><h3>Archiwum wejść zabezpieczone</h3><p>Znajdź co najmniej dwa odrębne materiały dotyczące dostępu i planu stref w aktach zajezdni. Dostęp do konsoli nie stanowi przyznania żadnego dowodu.</p><div class="ax-pills">${pills}</div></section>`;return;}
 root.innerHTML=`<div class="ax-header"><div><div class="eyebrow">REKONSTRUKCJA TRASY</div><h3>Analizator dostępu i przemieszczania</h3><p class="muted small">Archiwum 17–18 XI 2026. Rejestruje identyfikatory, otwarcia, stany sesji i sygnały po korekcie CCTV. Właściciel karty, aktywna sesja i niewidoczny fragment trasy to trzy różne rzeczy.</p></div><div class="ax-count"><b>${ACCESS_RECORDS.length}</b><small>REKORDÓW</small></div></div>
 <section class="surface padded"><div class="eyebrow">DOKUMENTACJA ŹRÓDŁOWA</div><div class="ax-pills">${pills}</div><p class="muted tiny">Do końcowego raportu wymagane są oryginalne wpisy, plan przejść, weryfikacja CCTV i telemetria stacji audytu. Pojedyncza karta nie identyfikuje osoby.</p></section>
 <div class="ax-columns"><section class="surface padded"><div class="eyebrow">ARCHIWUM ZDARZEŃ</div><div class="ax-filters"><label>System<select id="axSystem"><option value="">Wszystkie</option>${[...new Set(ACCESS_RECORDS.map(x=>x.system))].sort().map(v=>`<option value="${esc(v)}" ${st.filters.system===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label>Strefa<select id="axZone"><option value="">Wszystkie</option>${AX_ZONES.map(([v,t])=>`<option value="${v}" ${st.filters.zone===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>Identyfikator<select id="axCredential"><option value="">Wszystkie</option>${[...new Set(ACCESS_RECORDS.map(x=>x.credential))].sort().map(v=>`<option value="${esc(v)}" ${st.filters.credential===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label>Jakość<select id="axQuality"><option value="">Wszystkie</option>${[...new Set(ACCESS_RECORDS.map(x=>x.quality))].sort().map(v=>`<option value="${esc(v)}" ${st.filters.quality===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label class="wide">Przeszukiwanie surowych komunikatów<input id="axQuery" placeholder="Zdarzenie, kod, godzina, opis..." value="${esc(st.filters.query)}"/></label></div><div class="ax-scroll"><table class="ax-table"><thead><tr><th>Znacznik</th><th>System</th><th>Strefa</th><th>Nośnik</th><th>Zdarzenie</th></tr></thead><tbody id="axRows"></tbody></table></div><div class="ax-pages"><span id="axCount"></span><div><button class="btn alt" id="axPrev">Wstecz</button> <button class="btn alt" id="axNext">Dalej</button></div></div></section><section class="surface padded"><div class="eyebrow">INSPEKTOR I DZIENNIK</div><h3>Źródło czy retransmisja?</h3><div class="ax-detail" id="axDetail">Zaznacz wpis w tabeli.</div><button class="btn" id="axPin">Przypnij wpis</button><div class="eyebrow" style="margin-top:18px">WYBRANE ZAPISY (<span id="axPinCount">0</span>)</div><div class="ax-journal" id="axJournal"></div></section></div>
 <section class="surface padded"><div class="eyebrow">ANALIZA TRAS / 5 WĘZŁÓW</div><h3>Przebieg przejścia i kontrola czasu</h3><p class="muted small">Zrekonstruuj trasę rozważanej osoby i podaj czasy centralne z dokładnością do sekundy. Planuj na podstawie dokumentów i przypiętych wpisów. System sprawdza jedynie wykonalność poszczególnych odcinków, nie pokazuje właściwej trasy.</p><div class="ax-map"><div id="axMapRoot">${accessMapSvg()}</div><div class="ax-map-line">AUD <span>≥ 80 s</span> SOUTH <span>≥ 135 s</span> BAY3</div><div class="ax-map-line subdued">DISP <span>≥ 210 s</span> BAY3 · DIAG <span>≥ 130 s</span> BAY3</div><div class="ax-map-line subdued">Wewnętrzne wyjścia mogą nie wymagać przyłożenia karty. Nisza N-3 leży poza polem kamer.</div></div><div class="ax-route" id="axRoute">${st.route.map((r,i)=>`<div class="ax-stop"><label>Punkt ${i+1}<select data-ax-zone="${i}"><option value="">Strefa...</option>${AX_ZONES.map(([v,t])=>`<option value="${v}" ${r.zone===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>Godzina centralna<input data-ax-time="${i}" inputmode="numeric" placeholder="01:38:00" maxlength="8" value="${esc(r.time)}"></label></div>`).join('')}</div><button class="btn alt" id="axAssessRoute">Sprawdź wykonalność odcinków</button><div id="axRouteResult" class="ax-route-result">Brak ocenionej trasy.</div></section>
 <section class="surface padded"><div class="eyebrow">RAPORT ŚLEDCZY</div><h3>Odróżnij możliwość przejścia od dowodu obecności</h3><div class="ax-report">${accessSelect('badge','Znaczenie rejestru T-17',[['karta_nie_osoba','Dowodzi użycia karty, nie identyfikuje użytkownika'],['kamil_na_pewno','Dowodzi osobistego wejścia Kamila'],['brak_wpisu','W ogóle nie użyto tej karty']])}${accessSelect('meeting','Aktywna wideokonferencja',[['osoba_przy_komputerze','Dowodzi ciągłej obecności prowadzącej'],['sesja_nie_obecnosc','Dowodzi transmisji, nie ciągłej fizycznej obecności'],['nie_bylo_sesji','W tym czasie nie było sesji']])}${accessSelect('route','Znaczenie obliczonej trasy',[['wykonalna_nie_dowodzi','Trasa fizycznie możliwa, nie ustala tożsamości ani ciosu'],['pewna_wina','Sama trasa dowodzi dokonania zabójstwa'],['niemozliwa','Przejście wymagało nierealnego czasu']])}${accessSelect('exit','Wpis wyjścia od wewnątrz',[['wyjscie_bez_karty','Może nastąpić bez odbicia identyfikatora'],['zawsze_karta','Każde wyjście musi mieć odbicie T-17'],['brak_wyjscia','Brak dowodu otwarcia drzwi']])}${accessSelect('blindspot','Nisza N-3 na nagraniu',[['brak_obserwacji_niszy','Nieobserwowana — brak obrazu nie dowodzi braku osoby'],['cctv_widzi_atak','Kamera jednoznacznie zarejestrowała atak'],['pusta_nisza','Brak nagrania świadczy o pustej niszy']])}<label>Źródło synchronizacji wizualnej<select id="axSource1"><option value="">Wybierz zabezpieczone źródło...</option>${DOCS.filter(d=>STATE.found.has(d.id)).map(d=>`<option value="${esc(d.id)}">${esc(d.title)}</option>`).join('')}</select></label><label>Źródło rejestru identyfikatora<select id="axSource2"><option value="">Wybierz zabezpieczone źródło...</option>${DOCS.filter(d=>STATE.found.has(d.id)).map(d=>`<option value="${esc(d.id)}">${esc(d.title)}</option>`).join('')}</select></label><div class="wide">${mini5Select('access','axNotes',st.assessment.notes||'')}</div></div><div class="ax-actions"><button class="btn" id="axSubmit" ${st.solved?'disabled':''}>Zatwierdź raport logicznej weryfikacji</button><span class="muted">Próby: <b id="axAttempts">${st.attempts}</b></span></div><div id="axFeedback" class="ax-feedback">${st.solved?'Analiza zweryfikowana. Raport ADM-04 dołączono do akt. Wynik nie rozstrzyga sprawstwa.':'Zbierz dokumentację, przypnij niezależne zapisy, ustal trasę i sformułuj ograniczony wniosek. Błędy nie niszczą danych.'}</div></section>`;
 for(const [id,key] of [['axSystem','system'],['axZone','zone'],['axCredential','credential'],['axQuality','quality'],['axQuery','query']])$(id).addEventListener(id==='axQuery'?'input':'change',e=>{st.filters[key]=e.target.value;st.page=0;accessRows();});
 $('axPrev').addEventListener('click',()=>{st.page=Math.max(0,st.page-1);accessRows();});$('axNext').addEventListener('click',()=>{st.page++;accessRows();});$('axPin').addEventListener('click',accessPin);
 root.querySelectorAll('[data-ax-zone]').forEach(el=>el.addEventListener('change',e=>{st.route[Number(e.target.dataset.axZone)].zone=e.target.value;accessMapRerender();}));
 root.querySelectorAll('[data-ax-time]').forEach(el=>el.addEventListener('input',e=>st.route[Number(e.target.dataset.axTime)].time=e.target.value));
 accessWireMap();
 $('axAssessRoute').addEventListener('click',accessRouteFeedback);
 for(const k of Object.keys(ACCESS_SECRET.judgments)){const el=$('ax_'+k);el.value=st.assessment[k];el.addEventListener('change',e=>st.assessment[k]=e.target.value);}
 for(const k of ['source1','source2']){const el=$('axSource'+(k==='source1'?'1':'2'));el.value=st.assessment[k];el.addEventListener('change',e=>st.assessment[k]=e.target.value);}
 $('axNotes').value=st.assessment.notes;$('axNotes').addEventListener('input',e=>st.assessment.notes=e.target.value.slice(0,4000));$('axSubmit').addEventListener('click',accessSubmit);
 accessRows();accessDetail();accessJournal();}
function accessRows(){const st=STATE.access,all=accessFiltered(),pages=Math.max(1,Math.ceil(all.length/32));st.page=Math.min(st.page,pages-1);const items=all.slice(st.page*32,(st.page+1)*32);
 $('axRows').innerHTML=items.map(x=>`<tr data-ax-id="${x.id}" class="${st.selected===x.id?'ax-selected':''}"><td>${esc(x.day)}<small>${esc(x.time)}</small></td><td>${esc(x.system)}</td><td>${esc(x.zone)}</td><td>${esc(x.credential)}</td><td>${esc(x.action)}</td></tr>`).join('');
 $('axCount').textContent=`${all.length} / ${ACCESS_RECORDS.length} · strona ${st.page+1}/${pages}`;$('axPrev').disabled=st.page===0;$('axNext').disabled=st.page>=pages-1;
 $('axRows').querySelectorAll('[data-ax-id]').forEach(el=>el.addEventListener('click',()=>{st.selected=el.dataset.axId;accessRows();accessDetail();}));}
function accessDetail(){const x=AX_BYID[STATE.access.selected];$('axDetail').textContent=x?`${x.id} | ${x.day} ${x.time}\nSystem: ${x.system}\nStrefa: ${x.zone}\nIdentyfikator / urządzenie: ${x.credential}\nZdarzenie: ${x.action}\nJakość: ${x.quality}\nŹródło: ${x.source||'archiwum pomocnicze'}\n\n${x.detail}`:'Wybierz wpis w archiwum.';$('axPin').disabled=!x;}
function accessPin(){const x=STATE.access.selected,p=STATE.access.pinned;if(!AX_BYID[x])return;if(p.includes(x)){STATE.access.pinned=p.filter(v=>v!==x);}else if(p.length<24)p.push(x);else{toast('Dziennik ma limit 24 wpisów. Usuń mniej istotne obserwacje.');return;}accessJournal();}
function accessJournal(){const p=STATE.access.pinned;$('axPinCount').textContent=p.length;$('axJournal').innerHTML=p.length?p.map(id=>{const x=AX_BYID[id];return `<div><b>${esc(docName(id))}</b> · ${esc(x.time)} · ${esc(x.zone)} <button class="ax-remove" data-ax-unpin="${esc(id)}" aria-label="Usuń ${esc(id)}">×</button></div>`;}).join(''):'<div>Nie przypięto jeszcze zapisów.</div>';$('axJournal').querySelectorAll('[data-ax-unpin]').forEach(b=>b.addEventListener('click',()=>{STATE.access.pinned=STATE.access.pinned.filter(x=>x!==b.dataset.axUnpin);accessJournal();}));}
function accessRouteFeedback(){const legs=accessSegments(STATE.access.route);$('axRouteResult').innerHTML=legs.map((e,i)=>{const t=e.actual===null?'brak prawidłowego czasu':e.actual<0?'czas maleje':e.actual+' s';return `<div class="${e.valid?'ax-ok':'ax-bad'}">Odcinek ${i+1}: ${esc(e.from||'?')} → ${esc(e.to||'?')} · minimum ${e.min??'nieznane'} s · podano ${esc(t)} · ${e.valid?'wykonalny':'wymaga sprawdzenia'}</div>`;}).join('');}
function accessSubmit(){const a=STATE.access;a.attempts++;$('axAttempts').textContent=a.attempts;
 if(accessCheck(a,STATE.found)){a.solved=true;for(const id of ACCESS_SECRET.outputs)STATE.found.add(id);PS_EVENTS.laboratory('access',ACCESS_SECRET.outputs);renderDocs();renderAttached();toast('Analiza strefowa potwierdzona; raport ADM-04 dołączono do akt.');accessRefresh();return;}
 const errs=[];if(!ACCESS_SECRET.inputs.every(id=>STATE.found.has(id)))errs.push('Brakuje dokumentów wejściowych lub niezależnego materiału z synchronizacji kamer.');
 if(!ACCESS_SECRET.key_ids.every(id=>a.pinned.includes(id)))errs.push('Raport nie uwzględnia wszystkich istotnych klas pierwotnych zapisów (wejście, sesja, przejście, powrót).');
 if(!accessSegments(a.route).every(x=>x.valid))errs.push('Co najmniej jeden odcinek trasy jest niewykonalny lub niepełny.');
 if(Object.values(a.assessment).some(x=>!x))errs.push('W ocenie dowodów albo uzasadnieniu pozostają puste pola.');
 if(!errs.length)errs.push('Nie potwierdzono korelacji konkretnych wpisów, czasów i ograniczeń interpretacji. Sprawdź źródła oraz drogę powrotną.');
 $('axFeedback').textContent=errs.join('\n');}
function accessRestore(saved){const a=accessDefault();if(saved&&typeof saved==='object'){
 if(saved.filters&&typeof saved.filters==='object')for(const k of Object.keys(a.filters))if(typeof saved.filters[k]==='string')a.filters[k]=saved.filters[k].slice(0,90);
 if(Number.isInteger(saved.page))a.page=Math.max(0,Math.min(saved.page,99));
 if(typeof saved.selected==='string'&&AX_BYID[saved.selected])a.selected=saved.selected;
 if(Array.isArray(saved.pinned))a.pinned=[...new Set(saved.pinned.filter(id=>typeof id==='string'&&AX_BYID[id]))].slice(0,24);
 if(Array.isArray(saved.route)&&saved.route.length===5)a.route=saved.route.map(p=>({zone:AX_ZONES.some(z=>z[0]===p?.zone)?p.zone:'',time:typeof p?.time==='string'?p.time.slice(0,12):''}));
 if(saved.assessment&&typeof saved.assessment==='object')for(const k of Object.keys(a.assessment))if(typeof saved.assessment[k]==='string')a.assessment[k]=saved.assessment[k].slice(0,k==='notes'?4000:120);
 if(Number.isInteger(saved.attempts))a.attempts=Math.max(0,Math.min(saved.attempts,10000));
 a.solved=accessCheck(a,STATE.found);if(a.solved)ACCESS_SECRET.outputs.forEach(id=>STATE.found.add(id));
 }STATE.access=a;}
function accessReset(){accessMapStep=0;STATE.access=accessDefault();ACCESS_SECRET.outputs.forEach(id=>STATE.found.delete(id));if($('accessWorkspace')&&!$('accessPanel').hidden)accessRender();}


const LABS=[['04','TCMS','Przeszukiwanie surowych pakietów, rozpoznawanie sesji i rekonstrukcja chronologii.'],['05','Deszyfrator','Odzyskiwanie treści korespondencji z fragmentów bazy i metadanych.'],['06','CCTV','Synchronizacja trzech kamer o różnych znacznikach czasu.'],['07','Kryminalistyka','Porównanie urazów, śladów i możliwych skażeń wtórnych.'],['08','Dostęp i trasy','Weryfikacja czytników kart i czasu przemieszczania między strefami.']];
function tcmsCards(){
 $('labCards').innerHTML=LABS.map((lab,i)=>`<div class="surface padded"><div class="eyebrow">PRACOWNIA ${String(i+1).padStart(2,'0')}</div><h3 style="margin:11px 0">${lab[1]}</h3><p class="muted small">${lab[2]}</p><button class="btn" data-open-lab="${i}" style="margin-top:20px">${['Otwórz TCMS','Otwórz deszyfrator','Otwórz CCTV','Otwórz laboratorium','Otwórz analizę dostępu'][i]}</button></div>`).join('');
 $('labCards').querySelectorAll('[data-open-lab]').forEach(btn=>btn.addEventListener('click',()=>{
 const index=Number(btn.dataset.openLab),panels=['tcmsPanel','msgPanel','cctvPanel','forensicPanel','accessPanel'];
 panels.forEach((id,i)=>$(id).hidden=i!==index);
 if(index===0)tcmsSetInputs();else if(index===1)msgRender();else if(index===2)cctvRender();else if(index===3)forensicRender();else accessRender();
 $(panels[index]).scrollIntoView({behavior:'smooth',block:'start'});
 }));
}
function tcmsRefresh(){tcmsCards();if($('tcmsPanel')&&!$('tcmsPanel').hidden)tcmsSetInputs();}

STATE.cctv=CCTV_DEFAULT();
STATE.forensic=forensicDefault();
STATE.access=accessDefault();
tcmsCards();


/* ETAP 10 / DD10. Tablica autorska: żadnych ukrytych dedukcji ani przyznawania niezebranych dowodów. */
const DD_KINDS={fakt:'Fakt źródłowy',przypuszczenie:'Przypuszczenie',sprzecznosc:'Sprzeczność',alternatywa:'Alternatywne wyjaśnienie'};
const DD_ROLES={supports:'potwierdza',refutes:'podważa',limits:'ogranicza',context:'kontekst'};
function dedBlank(){return {title:'',kind:'przypuszczenie',statement:'',alternative:'',test:'',rival:'',links:[]};}
function dedDefault(){return {cards:[],selected:null,draft:dedBlank(),dirty:false,seq:1,sourceQuery:'',sourceType:'all',cardFilter:'all',feedback:''};}
STATE.deduction=dedDefault();
function dedSources(){
 const docs=DOCS.filter(d=>STATE.found.has(d.id)).map(d=>({key:'doc:'+d.id,type:'doc',label:d.id+' · '+d.title,short:d.id,body:d.body||'',family:'D:'+String(d.family||d.id),subtitle:d.category,docId:d.id}));
 const say=[];
 for(const c of CONTENT.characters){const entries=STATE.dialogues[c.id]||[];
  for(let i=1;i<entries.length;i++)if(entries[i]?.role==='npc'&&typeof entries[i].text==='string')say.push({key:'say:'+c.id+':'+i,type:'say',label:c.name+' · wypowiedź '+Math.floor((i+1)/2),short:c.name,body:entries[i].text,family:'Z:'+c.id,subtitle:'Zeznanie · zapis sesji',charId:c.id});
 }
 return docs.concat(say);
}
const DD2_SOURCE_STATE={signature:'',map:null};
function dedAvailable(){
 const signature=[...STATE.found].sort().join('|')+'#'+CONTENT.characters.map(c=>{
  const log=STATE.dialogues[c.id]||[];
  const last=log[log.length-1];return c.id+':'+log.length+':'+String(last?.text||'').slice(0,35);
 }).join('|');
 if(DD2_SOURCE_STATE.signature!==signature||!DD2_SOURCE_STATE.map){DD2_SOURCE_STATE.map=new Map(dedSources().map(s=>[s.key,s]));DD2_SOURCE_STATE.signature=signature;}
 return DD2_SOURCE_STATE.map;
}
function dedSafeLinks(items,sourceMap){const seen=new Set();return (Array.isArray(items)?items:[]).filter(x=>x&&typeof x==='object').map(x=>({source:String(x.source||''),role:Object.prototype.hasOwnProperty.call(DD_ROLES,x.role)?x.role:'context',note:String(x.note||'').slice(0,850)})).filter(x=>{if(!sourceMap.has(x.source)||seen.has(x.source))return false;seen.add(x.source);return true;}).slice(0,24);}
function dedExport(){return {cards:STATE.deduction.cards.map(c=>({id:c.id,title:c.title,kind:c.kind,statement:c.statement,alternative:c.alternative,test:c.test,rival:c.rival,links:c.links})),seq:STATE.deduction.seq};}
function dedRestore(data){const st=dedDefault();const sources=dedAvailable();const ids=new Set();const incoming=Array.isArray(data?.cards)?data.cards:[];
 for(const raw of incoming.slice(0,150)){
  if(!raw||typeof raw!=='object')continue;
  let id=typeof raw.id==='string'&&/^H\d{1,8}$/.test(raw.id)&&!ids.has(raw.id)?raw.id:'H'+st.seq;
  while(ids.has(id))id='H'+(++st.seq);ids.add(id);
  const x={id,title:String(raw.title||'').slice(0,120),kind:Object.prototype.hasOwnProperty.call(DD_KINDS,raw.kind)?raw.kind:'przypuszczenie',statement:String(raw.statement||'').slice(0,3000),alternative:String(raw.alternative||'').slice(0,2000),test:String(raw.test||'').slice(0,1500),rival:typeof raw.rival==='string'?raw.rival:'',links:dedSafeLinks(raw.links,sources)};
  if(x.title.trim()&&x.statement.trim()&&x.links.length)st.cards.push(x);
 }
 for(const c of st.cards){if(c.id===c.rival||!st.cards.some(x=>x.id===c.rival))c.rival='';}
 st.seq=Math.max(1,...st.cards.map(c=>Number(c.id.slice(1))+1).filter(Number.isFinite));STATE.deduction=st;
}
function dedReset(){STATE.deduction=dedDefault();}
function dedStatus(){const st=STATE.deduction;return st.dirty?'Niezapisane zmiany':st.selected?'Zapisano na tablicy':'Nowa, niezapisana hipoteza';}
function dedWarnSwitch(){return !STATE.deduction.dirty||confirm('Masz niezapisane zmiany. Odrzucić je i przejść do innej karty?');}
function dedSelect(id){const st=STATE.deduction;if(!dedWarnSwitch())return;const c=st.cards.find(x=>x.id===id);st.selected=c?c.id:null;st.draft=c?JSON.parse(JSON.stringify({...c,links:dedSafeLinks(c.links,dedAvailable())})):dedBlank();st.dirty=false;st.feedback='';dedRender();$('dedTitle').focus();}
function dedAddSource(key){const st=STATE.deduction;if(!dedAvailable().has(key))return;if(st.draft.links.some(x=>x.source===key)){toast('To źródło jest już połączone z bieżącą kartą.');return;}
 if(st.draft.links.length>=24){toast('Jedna karta może połączyć do 24 źródeł.');return;}
 st.draft.links.push({source:key,role:'supports',note:''});st.dirty=true;dedRenderEditor();dedRenderSources();}
function dedSave(){const st=STATE.deduction,d=st.draft;d.title=d.title.trim();d.statement=d.statement.trim();d.links=dedSafeLinks(d.links,dedAvailable());
 if(!d.title||!dd7Meaning(d.statement)){toast('Nadaj tytuł i sformułuj konkretny, sprawdzalny wniosek.');return;}
 if(!d.links.length){toast('Połącz kartę przynajmniej z jednym zdobytym źródłem.');return;}
 if(d.rival&&(!st.cards.some(c=>c.id===d.rival)||st.selected===d.rival))d.rival='';
 if(st.selected){const idx=st.cards.findIndex(x=>x.id===st.selected);if(idx<0)return;st.cards[idx]={id:st.selected,...JSON.parse(JSON.stringify(d))};}
 else{const id='H'+st.seq++;st.cards.push({id,...JSON.parse(JSON.stringify(d))});st.selected=id;}
 st.dirty=false;st.feedback='Karta zapisana. Zobacz poniżej, jakie źródła łączą się z Twoją tezą.';dedRender();PS_EVENTS.hypothesis(st.selected,ReasoningEngine.reasoning(st.cards.find(c=>c.id===st.selected)));toast('Zapisano kartę na tablicy dedukcyjnej.');}
function dedDelete(){if(!STATE.deduction.selected)return;psAsk('Usunąć tę kartę i powiązania z innymi kartami?',dedDeleteNow);}
function dedDeleteNow(){const st=STATE.deduction;if(!st.selected)return;
 st.cards=st.cards.filter(x=>x.id!==st.selected);for(const c of st.cards)if(c.rival===st.selected)c.rival='';st.selected=null;st.draft=dedBlank();st.dirty=false;st.feedback='';dedRender();}
/* DEDUKCJA 2.0 — niezależny, lokalny audyt argumentacji.
   To wyjaśnialny silnik heurystyczny, nie model językowy ani sędzia prawdy.
   Operuje WYŁĄCZNIE na zdobytych źródłach i zeznaniach z aktywnej sesji.
*/
const DD2_STOP = new Set('i a o u z ze za od po dla oraz albo lecz to ten ta te tej tym tego oni one ona ono jego jej ich pan pani my wy was nas ci czy że iż który która które których któremu co kto gdzie kiedy jak jednak ponadto również poprzez został została zostało zostały były była było jest są będą byłyby oraz tak nie jest tylko też już jeszcze wtedy teraz można należy w tym na do pod nad przed przy według pomiędzy poprzez'.split(' '));
const DD2_CONCEPTS = [
 ['tozsamosc','osoba','osob','identyfikac','ustaleni','uzytkownik','posiadacz','przypisany','sprawc'],
 ['wejscie','wejsc','przejsc','drzw','bramka','czytnik','dostep','trasa','karta','identyfikator','t17'],
 ['nagranie','kamera','kamer','monitor','cctv','wideo','film','obraz'],
 ['godzina','czas','czasow','minut','chwil','znacznik','zegara','moment','data'],
 ['alarm','czujnik','sygnal','impuls','wstrzas','ruch'],
 ['diagnostyka','diagnostycz','tcms','system','proba','test'],
 ['wiadomosc','wiadom','korespondenc','kontakt','sms','nadawc','wyslan'],
 ['sesja','online','polaczen','wideokonferenc','prezentac','kamera_wylaczona','alibi'],
 ['uraz','obrazen','medycz','uderzen','upad','mechanizm','smierc','zgon'],
 ['dokument','protokol','formularz','raport','karta_pracy','rejestr','wpis','log','wydruk','zapis'],
 ['wagon','tramwaj','tw217','pojazd','tabor'],
 ['smar','wlokien','probk','material','slad','mikroslad','porownan']
];
const DD2_STRONG = /\b(na pewno|bez watpienia|jednoznacznie|niewatpliwie|bezspornie|udowadnia|dowodzi|musial|wina|winny|sprawca|sprawczyni|zamordowal|zabil|uderzyl|atakowal|celowo|z premedytacja)\b/;
const DD2_CAUTION = /\b(nie wynika|nie rozstrzyga|nie potwierdza|nie dowodzi|nie wiadomo|brak podstaw|nie da sie|nie jest pewne|nie mozna uznac|nie przesadza|mozliwe|mozna przypuszczac|hipotez|wymaga sprawdzen|jedynie|sam w sobie|tylko zapis|nie musi)\b/;
const DD2_NEG = /\b(nie|bez|brak|zaprzecz|wyklucz|nigdy|ani)\b/;
const DD2_STEMS = ['owego','owych','owie','enia','anie','ami','ego','ej','om','ach','ach','owi','ach','ie','em','ów','owy','owa','owe','enie','ać','ić','ym','ych','mi','y','a','u','ę'];
function dd2Plain(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/\b(tw)[\s-]*(217)\b/g,'tw217').replace(/\b(t)[\s-]*(17)\b/g,'t17').replace(/\s+/g,' ').trim();}
function dd2Stem(s){
 const alias={'leny':'lena','lenie':'lena','magdaleny':'magdalena','kamilowi':'kamil','markowi':'marek','tomaszowi':'tomasz','janusza':'janusz','elzbiety':'elzbieta','wnioskow':'wniosek','godzinie':'godzina','godziny':'godzina','zapisow':'zapis','zeznania':'zeznanie','zeznan':'zeznanie'};
 if(alias[s])return alias[s];
 for(const word of DD2_CONCEPTS){for(const candidate of word.slice(1)){if(s.startsWith(candidate)&&candidate.length>=4)return word[0];}}
 if(s.length<=4)return s;
 for(const suff of DD2_STEMS){if(s.endsWith(suff)&&s.length-suff.length>=4)return s.slice(0,-suff.length);}
 return s;
}
function dd2Tokens(text){const list=dd2Plain(text).match(/[a-z0-9]+/g)||[];const count=new Map();
 for(const raw of list){if(raw.length<2||DD2_STOP.has(raw))continue;const word=dd2Stem(raw);if(!DD2_STOP.has(word))count.set(word,(count.get(word)||0)+1);}
 return count;
}
function dd2Clauses(text){
 const str=String(text||'').replace(/\s+/g,' ').trim();
 const parts=str.split(/(?<=[.!?;])\s+|\s*;\s*|\s+\b(?:natomiast|jednak|ale|chociaz|chociaż)\b\s+/i).map(s=>s.replace(/^[,.;\s]+|[,.;\s]+$/g,'').trim()).filter(s=>s.length>12);
 return parts.length?parts.slice(0,10):str?[str]:[];
}
function dd2Sentences(text){const lines=String(text||'').replace(/\s+/g,' ').split(/(?<=[.!?;])\s+|\s*\|\s*|\s*;\s*/).filter(x=>x.length>15);return (lines.length?lines:[String(text||'')]).slice(0,135).map(x=>x.slice(0,440));}
const DD2_SOURCE_CACHE=new Map();
function dd2SourceIndex(source){
 const key=source.key;
 const body=String(source.body||'');
 const previous=DD2_SOURCE_CACHE.get(key);
 if(previous&&previous.body===body)return previous.rows;
 const rows=dd2Sentences(body.slice(0,22000)).map(sentence=>({sentence, tokens:dd2Tokens(sentence)}));
 if(DD2_SOURCE_CACHE.size>350)DD2_SOURCE_CACHE.clear();
 DD2_SOURCE_CACHE.set(key,{body,rows});
 return rows;
}
function dd2Match(a,b){
 const ta=a instanceof Map?a:dd2Tokens(a),tb=b instanceof Map?b:dd2Tokens(b);
 if(!ta.size||!tb.size)return 0;
 let hits=0,total=0;
 for(const [w,n] of ta){const weight=/^\d{2,}$/.test(w)||w==='tw217'||w==='t17'?2.2:1;total+=weight;if(tb.has(w))hits+=weight;}
 // To zgodność tematów/pojęć, nie dowód zgodności logicznej.
 const coverage=hits/total;
 return Math.max(0,Math.min(1,coverage*(.82+.18*Math.min(1,hits/3))));
}
function dd2Best(clause,source){
 const query=dd2Tokens(clause);
 let best={score:0,sentence:'',source};
 for(const row of dd2SourceIndex(source)){const score=dd2Match(query,row.tokens);if(score>best.score)best={score,sentence:row.sentence,source};}
 return best;
}
/* POPRAWKA 7 — wyjaśnialna kontrola sensu, a nie objętości wypowiedzi.
   Bez API: ta heurystyka ocenia relacje i ograniczenia dowodowe; nie orzeka prawdy. */
const DD7_GENERIC=new Set(['dokument','zrodlo','material','dowod','informacja','potwierdza','wskazuje','wynika','poniewaz','dlatego','jest','to','ze','sam','same','dane','podstawa','hipoteza','fakt','teza','sprawa','mozna','nalezy','wpis','rejestr']);
function dd7Words(t){return [...dd2Tokens(t).keys()].filter(w=>!DD7_GENERIC.has(w));}
function dd7Meaning(t){return dd7Words(t).length>=2;}
function dd7Note(l,src,claim){
 const words=dd7Words(l.note),short=words.length<2;
 const relevance=src?Math.max(dd2Best(l.note,src).score,dd2Match(l.note,src.label+' '+src.body)):0;
 const tie=dd2Match(l.note,claim);
 return {ok:!short&&relevance>=.17&&(tie>=.09||dd2Best(claim,src).score>=.16),relevance,tie};
}
function dd7Alternative(d){const alt=String(d.alternative||'').trim();return dd7Meaning(alt)&&dd2Match(alt,d.statement)<.87;}
function dd7Test(d){
 const val=dd2Plain(d.test||'');
 return dd7Meaning(val)&&/\b(sprawdz|porown|zweryfik|zestaw|odczyt|ustal|przesluch|zapyt|zbada|zbierz|obejr|przeanaliz|uzysk|konfront|przeanalizuj|potwierdz|wyklucz|szukaj|odtworz|skontrol|oszacuj|przesledz)/.test(val);
}
function dd7Reasoning(d){
 const map=dedAvailable(),links=dedSafeLinks(d.links,map),docs=links.filter(l=>l.source.startsWith('doc:')).map(link=>({link,src:map.get(link.source)})).filter(x=>x.src);
 const families=new Set(docs.map(x=>x.src.family));const issues=[];
 if(!dd7Meaning(d.statement))issues.push('Sformułuj konkretne, sprawdzalne twierdzenie, a nie ogólną deklarację.');
 if(docs.length<2||families.size<2)issues.push('Połącz przynajmniej dwa zdobyte dokumenty z niezależnych rodzin.');
 if(!docs.some(x=>x.link.role==='supports'))issues.push('Zaznacz materiał, który rzeczywiście potwierdza fragment Twojej tezy.');
 const weak=docs.filter(x=>!dd7Note(x.link,x.src,d.statement).ok);
 if(weak.length)issues.push('Wyjaśnij konkretnie znaczenie źródeł: '+weak.map(x=>x.src.short).join(', ')+'. Każde uzasadnienie powinno nawiązywać do zawartości tego źródła i do tezy.');
 const supporting=docs.filter(x=>x.link.role==='supports');
 const matches=supporting.map(x=>dd2Best(d.statement,x.src).score);
 if(supporting.length&&!matches.some(v=>v>=.17)&&!supporting.some(x=>dd7Note(x.link,x.src,d.statement).tie>=.28))issues.push('Nie widać związku tezy z materiałem oznaczonym jako „potwierdza”. Sprawdź przypisane role źródeł.');
 if(d.kind==='sprzecznosc'&&(!docs.some(x=>x.link.role==='supports')||!docs.some(x=>x.link.role==='refutes')))issues.push('Przy sprzeczności wskaż osobno materiał potwierdzający i podważający.');
 if(d.kind==='przypuszczenie'||d.kind==='alternatywa'){
  if(!dd7Alternative(d))issues.push('Opisz konkretną, różną od tezy interpretację alternatywną.');
  if(!dd7Test(d))issues.push('Podaj wykonalną czynność sprawdzającą hipotezę, np. porównanie dwóch źródeł.');
 }
 const risks=dd2ClaimRisk(String(d.statement||''),d);
 if(risks.length&&docs.every(x=>dd2Best(d.statement,x.src).score<.4))issues.push('Kategoryczna teza wykracza poza to, co wprost potwierdzają połączone źródła.');
 return {ok:issues.length===0,issues,docs:docs.length,families:families.size};
}
function tl7ReasonAudit(e,x){
 const text=String(x.reason||'').trim();if(!text)return 'Dodaj własne wyjaśnienie, co ustala źródło, a czego nie można z niego wywnioskować.';
 if(!dd7Meaning(text))return 'Uzasadnienie jest zbyt ogólne. Odnieś je do konkretnego zapisu lub ograniczenia dowodu.';
 const relevant=dd2Match(text,e.title+' '+e.caution)>=.12||x.sourceIds.some(id=>{const d=byId[id];if(!d)return false;const src={key:'doc:'+id,body:d.body||'',label:d.title};return dd2Best(text,src).score>=.15||dd2Match(text,d.title+' '+d.body)>=.18;});
 if(!relevant)return 'Wyjaśnienie nie nawiązuje do wybranego wydarzenia ani jego źródeł. Uzasadnij właśnie ten wpis.';
 const txt=dd2Plain(text);
 if((e.id==='e16'||e.id==='e17')&&/\b(01:44|144)\b/.test(txt)&&/\b(zgon\w*|smier\w*|umar\w*|zmar\w*|chwil\w*|moment\w*)\b/.test(txt)&&/\b(wprost|dokladnie|na pewno|jednoznaczn\w*|udowadnia|dowodzi|ustala|nastap\w*|zmar\w*)\b/.test(txt)&&!DD2_CAUTION.test(txt)&&!/\b(nie|brak|bez)\b/.test(txt))return 'Nie utożsamiaj impulsu o 01:44 z dokładną chwilą zgonu. Rozróżnij przedział medyczny i znacznik czujnika.';
 if(e.id==='e17'&&/\b(sprawc|tozsamosc|kto uderz|kto zabil)\b/.test(txt)&&/\b(wskazuje|dowodzi|ustala|identyfikuj)\b/.test(txt)&&!DD2_CAUTION.test(txt))return 'Czujnik nie identyfikuje osoby ani mechanizmu zdarzenia.';
 return '';
}
function dd2ClaimRisk(claim, d){
 const txt=dd2Plain(claim),ctx=dd2Plain(String(d.alternative||'')+' '+String(d.statement||''));
 const risk=[];
 if(DD2_STRONG.test(txt)&&!DD2_CAUTION.test(txt))risk.push('Kategoryczna teza: sprawdź, czy źródło opisuje obserwację, czy jedynie pośrednią przesłankę.');
 if(/\b(karta|czytnik|t17|logowan|sesja|konto|adres ip|nagranie|monitoring)\b/.test(txt)&&/\b(tozsamosc|sprawca|sprawczyni|winny|zabil|zamordowal|na pewno|jednoznacznie)\b/.test(txt)&&!DD2_CAUTION.test(txt))risk.push('Identyfikator urządzenia, karty lub konta nie rozpoznaje sam osoby fizycznej.');
 if(/\b(zabil|zamordowal|zaboj|sprawc|winny|uderzyl|zaatakowal)\b/.test(txt)&&!DD2_CAUTION.test(txt)&&d.kind==='fakt')risk.push('Zarzut dotyczący sprawstwa nie powinien być oznaczony jako prosty fakt źródłowy.');
 if(/\b(zawsze|nigdy|kazdy|wszyscy|caly czas|nieprzerwanie)\b/.test(txt)&&!DD2_CAUTION.test(txt))risk.push('Uogólnienie absolutne wymaga źródła o równie szerokim zakresie.');
 return risk;
}
function dd2Audit(d){
 const map=dedAvailable(),links=dedSafeLinks(d.links,map),sources=links.map(l=>({link:l,src:map.get(l.source)})).filter(x=>x.src),claims=dd2Clauses(d.statement);
 const roles={supports:0,refutes:0,limits:0,context:0};links.forEach(l=>roles[l.role]++);
 const families=new Set(sources.map(x=>x.src.family)),issues=[];
 if(!claims.length)issues.push('Wpisz konkretne twierdzenie do oceny.');
 if(!sources.length)issues.push('Połącz co najmniej jedno zdobyte źródło z kartą.');
 if(sources.length===1)issues.push('Wniosek opiera się tylko na jednym źródle; porównaj go z niezależnym materiałem.');
 if(sources.length>=2&&families.size<2)issues.push('Wiele wpisów pochodzi z jednej rodziny źródeł — nie jest to niezależna weryfikacja.');
 if(!roles.supports && d.kind!=='alternatywa')issues.push('Żaden materiał nie ma roli „potwierdza”; określ, co rzeczywiście wspiera tezę.');
 if(d.kind==='sprzecznosc'&&(!roles.supports||!roles.refutes))issues.push('Sprzeczność wymaga materiałów o przeciwstawnych rolach.');
 if((d.kind==='przypuszczenie'||d.kind==='alternatywa')&&!dd7Alternative(d))issues.push('Dodaj konkretną alternatywną interpretację, nie powtórzenie tezy.');
 if(!dd7Test(d))issues.push('Wskaż możliwy do wykonania krok weryfikacji, np. porównanie źródeł.');
 const missingNotes=links.filter(l=>!dd7Note(l,map.get(l.source),d.statement).ok);
 if(missingNotes.length)issues.push('Wyjaśnij, dlaczego '+missingNotes.length+' połączone źródło/źródła wspiera, podważa lub ogranicza tezę.');
 const matched=[];let riskCount=0;
 for(const claim of claims){
   const support=sources.filter(x=>x.link.role==='supports');
   const candidates=(support.length?support:sources).map(x=>dd2Best(claim,x.src)).sort((a,b)=>b.score-a.score);
   const best=candidates[0]||{score:0,sentence:'',source:null};
   const risks=dd2ClaimRisk(claim,d);riskCount+=risks.length;
   const neg=DD2_NEG.test(dd2Plain(claim));
   const negSource=best.sentence&&DD2_NEG.test(dd2Plain(best.sentence));
   const polarityConflict=best.score>=.48 && neg!==negSource && !DD2_CAUTION.test(dd2Plain(claim)) && !/\b(bez|brak)\b/.test(dd2Plain(best.sentence));
   // Nie osądzaj automatycznie prawdziwości negacji. Zasygnalizuj konieczność porównania.
   if(polarityConflict)risks.push('Sprawdź negację: przytoczony fragment może mieć inny zakres zaprzeczenia niż teza.');
   const category=best.score>=.63?'wyraźne':best.score>=.36?'częściowe':'niejasne';
   matched.push({claim,level:category,score:best.score,source:best.source?.label||'',key:best.source?.key||'',excerpt:best.sentence,risks});
 }
 const avg=matched.length?matched.reduce((n,r)=>n+r.score,0)/matched.length:0;
 const diversity= Math.min(100,(families.size>1?55+Math.min(3,families.size-2)*12:families.size?24:0)+(roles.refutes?10:0)+(roles.limits?9:0));
 const evidence= Math.round(100*avg);
 const argument= Math.max(0,100-Math.min(50,missingNotes.length*15)-(d.kind==='sprzecznosc'&&(!roles.refutes||!roles.supports)?30:0)-(roles.supports?0:15));
 const counter= Math.min(100, (dd7Alternative(d)?55:0)+(roles.refutes?20:0)+(roles.limits?15:0)+(d.rival?10:0));
 const next= dd7Test(d)?80:0;
 const raw=Math.round(evidence*.40+diversity*.19+argument*.17+counter*.14+next*.10);
 const score=Math.max(0,Math.min(100,raw-Math.min(24,riskCount*8)-Math.min(16,matched.filter(r=>r.level==='niejasne').length*4)));
 if(matched.some(x=>x.level==='niejasne'))issues.push('Część zdań nie ma wyraźnego powiązania z treścią dostępnych źródeł.');
 if(matched.some(x=>x.risks.length))issues.push('Co najmniej jedno twierdzenie wymaga ostrożniejszego języka lub sprawdzenia zakresu źródła.');
 const readiness=dd7Reasoning(d); for(const note of readiness.issues)if(!issues.includes(note))issues.push(note);
 const status=readiness.ok&&score>=74?'dobrze uzasadniona':score>=46?'wymaga sprawdzenia':'słabo udokumentowana';
 const lines=[`Ocena uzasadnienia: ${score}/100 (${status}).`,`Źródła: ${sources.length}; niezależne zbiory: ${families.size}; sprawdzone twierdzenia: ${matched.length}.`,`Zgodność tematyczna ze źródłami: ${evidence}/100; analiza ról: ${argument}/100; kontrargumenty: ${counter}/100.`];
 for(const item of matched){lines.push(`• „${item.claim.slice(0,110)}${item.claim.length>110?'…':''}” — powiązanie ${item.level}${item.source?' ('+item.source.slice(0,75)+')':''}.`);}
 if(issues.length)lines.push('Do dopracowania:\n'+issues.map(t=>'• '+t).join('\n'));
 else lines.push('Nie wykryto braków formalnych. Nie jest to potwierdzenie prawdziwości tezy ani sprawstwa.');
 return {score,status,matched,issues,roles,families:families.size,evidence,argument,counter,diversity,next,text:lines.join('\n')};
}
function dd2RenderReview(d){
 const root=$('dd2Review');if(!root)return;
 const result=dd2Audit(d);
 const safety='<p class="dd2-disclaimer">Ocena pokazuje zgodność tematyczną i jakość argumentacji, nie dowodzi prawdziwości źródeł ani winy osoby. Przy skomplikowanej polszczyźnie potrzebna jest ocena gracza.</p>';
 const items=result.matched.map((m,i)=>{
  const status=m.level==='wyraźne'?'ok':m.level==='częściowe'?'warn':'weak';
  return `<article class="dd2-claim"><div class="dd2-claim-head"><span>Teza ${i+1}</span><b class="dd2-${status}">Powiązanie: ${esc(m.level)}</b></div><p class="dd2-quote">${esc(m.claim)}</p>${m.source?`<p class="dd2-src">Najbliższy materiał: <b>${esc(m.source)}</b></p>`:'<p class="dd2-src">Brak dostępnego materiału.</p>'}${m.excerpt?`<details><summary>Sprawdź porównywany fragment źródła</summary><blockquote>${esc(m.excerpt)}</blockquote></details>`:''}${m.risks.map(r=>`<p class="dd2-risk">${esc(r)}</p>`).join('')}</article>`;
 }).join('');
 const issues=result.issues.length?`<div class="dd2-issues"><h4>Co wymaga dopracowania</h4><ul>${result.issues.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></div>`:'<p>Nie znaleziono oczywistych braków formalnych — sprawdź nadal sens i kontekst źródeł.</p>';
 root.innerHTML=`<div class="dd2-grade"><div><b>Ocena warsztatu argumentacji</b><strong>${result.score}<small>/100</small></strong></div><p>${esc(result.status)} · ${result.families} niezależnych rodzin źródeł</p><div class="dd2-meter" role="meter" aria-label="Wynik audytu argumentacji" aria-valuenow="${result.score}" aria-valuemin="0" aria-valuemax="100"><span style="width:${result.score}%"></span></div></div>${safety}<div class="dd2-dimensions"><span>Powiązanie ze źródłami <b>${result.evidence}/100</b></span><span>Role źródeł <b>${result.argument}/100</b></span><span>Kontrargument <b>${result.counter}/100</b></span><span>Niezależność <b>${result.diversity}/100</b></span></div><div class="dd2-claims"><h4>Kontrola kolejnych części wniosku</h4>${items||'<p>Wpisz wniosek, aby zobaczyć ocenę zdań.</p>'}</div>${issues}`;
 root.hidden=false;
}

function dedAssessment(d){return dd2Audit(d).text;}
function ded2QuickNeeds(d){return !dd7Reasoning(d).ok;}
function dedSourceOpen(s){if(s.type==='doc'){activeDoc=s.docId;showTab('evidence');renderDocs();}else if(s.charId){STATE.activeChar=s.charId;showTab('interview');}}
function dedRenderSources(){const st=STATE.deduction,map=dedAvailable();const q=norm(st.sourceQuery),kind=st.sourceType,oldScroll=$('dedSourceList').scrollTop;
 const items=[...map.values()].filter(s=>(kind==='all'||s.type===kind)&&(!q||norm(s.label+' '+s.body+' '+s.subtitle).includes(q)));
 $('dedSourceCount').textContent=map.size+' dostępnych'+(items.length>120?' · pokazano 120 (użyj wyszukiwania)':'');const markup=items.length?items.slice(0,120).map(s=>{
  const used=st.draft.links.some(l=>l.source===s.key);
  return `<div class="dd-source"><div><span class="dd-tag">${s.type==='doc'?'DOKUMENT':'ZEZNANIE'}</span> <small>${esc(s.subtitle)}</small></div><strong>${esc(s.label)}</strong><details><summary>Przeczytaj źródło</summary><div class="dd-source-preview">${esc(s.body)}</div></details><div class="formline"><button class="btn ${used?'subtle':'alt'}" data-dd-add="${esc(s.key)}" ${used?'disabled':''}>${used?'Połączono':'+ Połącz'}</button><button class="btn subtle" data-dd-open="${esc(s.key)}">${s.type==='doc'?'Otwórz akta':'Otwórz rozmowę'}</button></div></div>`;
 }).join(''):'<div class="dd-empty">Nie ma źródeł spełniających filtr. Odkrywaj kolejne dokumenty lub prowadź przesłuchania.</div>';
 const changed=psRenderMarkup($('dedSourceList'),markup);
 if(changed){
  $('dedSourceList').scrollTop=oldScroll;
  $('dedSourceList').querySelectorAll('[data-dd-add]').forEach(b=>b.addEventListener('click',()=>dedAddSource(b.dataset.ddAdd)));
  $('dedSourceList').querySelectorAll('[data-dd-open]').forEach(b=>b.addEventListener('click',()=>{const s=map.get(b.dataset.ddOpen);if(s)dedSourceOpen(s);}));
 }
 window.PS_CORRELATIONS?.scheduleApply();
}
function dedRenderEditor(){const st=STATE.deduction,d=st.draft,map=dedAvailable();const review=$('dd2Review');if(review){review.hidden=true;review.innerHTML='';}
 $('dedEditorTitle').textContent=st.selected?'Edycja '+st.selected:'Nowa karta';$('dedDelete').disabled=!st.selected;
 for(const [id,k] of [['dedTitle','title'],['dedKind','kind'],['dedStatement','statement'],['dedAlternative','alternative'],['dedTest','test']])$(id).value=d[k];
 $('dedRival').innerHTML='<option value="">Brak wskazania</option>'+st.cards.filter(c=>c.id!==st.selected).map(c=>`<option value="${esc(c.id)}">${esc(c.id+' · '+c.title)}</option>`).join('');$('dedRival').value=d.rival||'';
 $('dedLinkCount').textContent=d.links.length+' połączeń';$('dedUnsaved').textContent=dedStatus();
 $('dedLinks').innerHTML=d.links.length?d.links.map((l,i)=>{const s=map.get(l.source);if(!s)return '';
  return `<div class="dd-link" data-role="${esc(l.role)}"><div class="dd-link-head"><b>${esc(s.label)}</b><button data-dd-remove="${i}" aria-label="Odłącz źródło">Odłącz</button></div><select aria-label="Rola źródła ${i+1}" data-dd-role="${i}">${Object.entries(DD_ROLES).map(([v,t])=>`<option value="${v}" ${l.role===v?'selected':''}>${esc(t)}</option>`).join('')}</select><textarea data-dd-note="${i}" maxlength="850" aria-label="Uzasadnienie roli ${i+1}" placeholder="Dlaczego to źródło ma znaczenie dla wniosku?">${esc(l.note)}</textarea></div>`;
 }).join(''):'<div class="dd-empty">Brak połączeń. Wybierz dowody lub zeznania z panelu po lewej.</div>';
 $('dedLinks').querySelectorAll('[data-dd-remove]').forEach(b=>b.addEventListener('click',()=>{d.links.splice(Number(b.dataset.ddRemove),1);st.dirty=true;dedRenderEditor();dedRenderSources();}));
 $('dedLinks').querySelectorAll('[data-dd-role]').forEach(el=>el.addEventListener('change',()=>{d.links[Number(el.dataset.ddRole)].role=el.value;st.dirty=true;$('dedUnsaved').textContent=dedStatus();if($('dd2Review'))$('dd2Review').hidden=true;el.closest('.dd-link').dataset.role=el.value;}));
 $('dedLinks').querySelectorAll('[data-dd-note]').forEach(el=>el.addEventListener('input',()=>{d.links[Number(el.dataset.ddNote)].note=el.value;st.dirty=true;$('dedUnsaved').textContent=dedStatus();if($('dd2Review'))$('dd2Review').hidden=true;}));
 $('dedFeedback').textContent=st.feedback||'Lokalna kontrola wskazuje luki i związki tematyczne między źródłami; nie zastępuje samodzielnej oceny śledczego.';
}
function dedRenderBoard(){const st=STATE.deduction,map=dedAvailable(),cards=st.cards.filter(c=>st.cardFilter==='all'||c.kind===st.cardFilter);
 const boardMarkup=cards.length?cards.map(c=>{
  const links=dedSafeLinks(c.links,map),rival=st.cards.find(x=>x.id===c.rival),families=new Set(links.map(l=>map.get(l.source)?.family).filter(Boolean));
  return `<article class="dd-card type-${esc(c.kind)} ${st.selected===c.id?'selected':''}"><div class="dd-card-top"><span class="dd-tag">${esc(c.id)} · ${esc(DD_KINDS[c.kind])}</span><span class="muted tiny">${links.length} źr. · ${families.size} rodzin</span></div><h4>${esc(c.title)}</h4><p>${esc(c.statement)}</p><div class="dd-branch">${links.map(l=>{const src=map.get(l.source);return `<div class="dd-branch-row"><span class="dd-tag">${esc(DD_ROLES[l.role])}</span><b>${esc(src.short)}</b><span>${esc(src.label.length>80?src.label.slice(0,77)+'…':src.label)}</span></div>`;}).join('')}${rival?`<div class="dd-branch-row"><span class="dd-tag">konkurencyjna</span><b>${esc(rival.id+' · '+rival.title)}</b></div>`:''}</div>${c.alternative?`<p><b>Inna interpretacja:</b> ${esc(c.alternative)}</p>`:''}${c.test?`<p><b>Do sprawdzenia:</b> ${esc(c.test)}</p>`:''}<div class="dd-card-footer"><span class="muted tiny">Hipoteza do dalszej weryfikacji</span><button class="btn alt" data-dd-edit="${esc(c.id)}">Edytuj / przeanalizuj</button></div></article>`;
 }).join(''):`<div class="dd-empty">${st.cards.length?'Brak kart w wybranej kategorii. Zmień filtr.':'Tablica jest jeszcze pusta. Zacznij od połączenia źródła z własnym ustaleniem, a następnie zapisz kartę.'}</div>`;
 if(!psRenderMarkup($('dedBoard'),boardMarkup))return;
 $('dedBoard').querySelectorAll('[data-dd-edit]').forEach(b=>b.addEventListener('click',()=>dedSelect(b.dataset.ddEdit)));
}
function dedRender(){const st=STATE.deduction,available=dedAvailable();
 const links=st.cards.reduce((n,c)=>n+dedSafeLinks(c.links,available).length,0);const families=new Set(st.cards.flatMap(c=>dedSafeLinks(c.links,available).map(l=>available.get(l.source)?.family).filter(Boolean)));
 const incomplete=st.cards.filter(ded2QuickNeeds).length;
 psRenderMarkup($('dedMetrics'),[[st.cards.length,'Utworzone karty'],[links,'Połączenia źródeł'],[families.size,'Rodziny źródeł'],[incomplete,'Karty do dopracowania']].map(([v,label])=>`<div class="dd-metric"><strong>${v}</strong><span>${esc(label)}</span></div>`).join(''));
 $('dedSourceSearch').value=st.sourceQuery;$('dedSourceType').value=st.sourceType;$('dedCardFilter').value=st.cardFilter;
 dedRenderSources();dedRenderEditor();dedRenderBoard();
}
for(const [id,k] of [['dedTitle','title'],['dedKind','kind'],['dedStatement','statement'],['dedAlternative','alternative'],['dedTest','test'],['dedRival','rival']]){
 const el=$(id);el.addEventListener(id==='dedKind'||id==='dedRival'?'change':'input',()=>{STATE.deduction.draft[k]=el.value;STATE.deduction.dirty=true;$('dedUnsaved').textContent=dedStatus();if($('dd2Review'))$('dd2Review').hidden=true;});
}
$('dedNew').addEventListener('click',()=>dedSelect(null));$('dedSave').addEventListener('click',dedSave);$('dedDelete').addEventListener('click',dedDelete);
$('dedAssess').addEventListener('click',()=>{const st=STATE.deduction;st.feedback=dedAssessment(st.draft);$('dedFeedback').textContent='Wykonano lokalną kontrolę źródeł i argumentacji. Szczegóły poniżej; wynik nie dowodzi prawdziwości tezy.';dd2RenderReview(st.draft);$('dd2Review').scrollIntoView({block:'nearest',behavior:'smooth'});if(window.psDualAssess)window.psDualAssess(st.draft,dedAvailable());});
$('dedSourceSearch').addEventListener('input',e=>{STATE.deduction.sourceQuery=e.target.value;dedRenderSources();});
$('dedSourceType').addEventListener('change',e=>{STATE.deduction.sourceType=e.target.value;dedRenderSources();});
$('dedCardFilter').addEventListener('change',e=>{STATE.deduction.cardFilter=e.target.value;dedRenderBoard();});

/* ETAP 11 · Dane referencyjne są odczytywane wyłącznie po pozyskaniu pasujących akt.
   Odzwierciedlają daty zapisów, nie skryte wyroki ani automatyczną identyfikację osób. */
const TL_BASE='2026-11-17T18:00', TL_END='2026-11-18T06:00';
const TL_PLACES={unknown:'Miejsce fizyczne nieustalone',zajezdnia:'Teren zajezdni / zmiana',ruch:'TW-217 / ruch pojazdu',warsztat:'Warsztat / kolejka serwisowa',system:'Zapis systemowy / lokalizacja osoby nieznana',dyspozytornia:'Konsola dyspozytorni',bhp:'Łączność służbowa / lokalizacje nieznane',dokumentacja:'Stanowisko dokumentacyjne',diagnostyka:'System diagnostyczny / stanowisko',audit:'Sesja zdalna / stacja audytowa',bay3:'Stanowisko nr 3',ewidencja:'Ewidencja kart / miejsce wydania nieustalone',depozyt:'Depozyt materiałów'};
const TL_ACTORS={'':'Nie przypisuj osoby (brak dowodu obecności)',MAREK:'Marek Nowicki',TOMASZ:'Tomasz Krawczyk',JANUSZ:'Janusz Wójcik',ELZBIETA:'Elżbieta Zięba',KAMIL:'Kamil Brzozowski',MAGDALENA:'Magdalena Kaczmarek',LENA:'Lena Rudnicka'};
const tlISO=(day,time)=>`2026-11-${day}T${time}`;
// source: alternatywne dokumenty pozwalające odkryć i zweryfikować dane zdarzenie.
const TL_EVENTS=[
 {id:'e01',title:'Otwarcie nocnej zmiany',day:17,time:'18:00',place:'zajezdnia',sources:['ADM-01'],caution:'Lista obsady nie odtwarza późniejszego przemieszczania się pracowników.'},
 {id:'e02',title:'Rozpoczęcie ostatniego kursu TW-217',day:17,time:'18:26',place:'ruch',sources:['TEC-02'],caution:'Początek kursu nie oznacza przyjęcia wagonu do warsztatu.'},
 {id:'e03',title:'Komunikat diagnostyczny w ruchu',day:17,time:'19:11',place:'ruch',sources:['TEC-03','TEC-02'],caution:'Ostrzeżenie podczas jazdy nie jest poleceniem awaryjnego ruchu.'},
 {id:'e04',title:'Utworzenie zlecenia DIAG-217/N',day:17,time:'19:46',place:'system',sources:['TEC-04'],caution:'Wystawienie dokumentu nie dowodzi osobistej obecności przy wagonie.'},
 {id:'e05',title:'Utworzenie pozycji kolejki warsztatowej',day:17,time:'20:54',place:'warsztat',sources:['EVID_WORK_ORDER_RAW','TEC-02'],caution:'Wpis kolejki nie oznacza ukończenia naprawy.'},
 {id:'e06',title:'Połączenie służbowe Lena – Elżbieta',day:17,time:'21:47',place:'bhp',sources:['DIG-01'],caution:'Biling potwierdza numery i połączenie, ale nie treść rozmowy ani miejsce pobytu.'},
 {id:'e07',title:'Rewizja dyspozycji TW-217',day:17,time:'23:14',place:'dyspozytornia',sources:['EVID_DISPATCH_REVISION'],caution:'Wpis konsoli to czynność systemowa, nie dowód późniejszego spotkania w niszy.'},
 {id:'e08',title:'Wydanie identyfikatora tymczasowego T-17',day:18,time:'00:16',place:'ewidencja',sources:['ADM-07','EVID_RESOURCE_HANDOVER'],caution:'Formalne wydanie nośnika nie dowodzi, kto używał go później.'},
 {id:'e09',title:'Przekazanie nośnika T-17',day:18,time:'00:39',place:'dokumentacja',sources:['EVID_RESOURCE_HANDOVER'],caution:'Skrót odbiorcy nie wystarcza do rozstrzygnięcia tożsamości osoby przy drzwiach.'},
 {id:'e10',title:'Otwarcie autoryzowanej sesji diagnostycznej',day:18,time:'01:06',place:'diagnostyka',sources:['EVID_TEST_AUTHORIZATION','EVID_TCMS_SESSION','TEC-12'],caution:'Log sesji identyfikuje autoryzację, nie ciągłą fizyczną obecność diagnosty.'},
 {id:'e11',title:'Zmiana fazy próby TCMS',day:18,time:'01:17',place:'diagnostyka',sources:['EVID_TCMS_SESSION','TEC-12'],caution:'Tryb testowy trzeba odczytać z pełnych pól sekwencji, nie z krótkiego alarmu.'},
 {id:'e12',title:'Ostrzeżenia TCMS w trybie testowym',day:18,time:'01:21',place:'diagnostyka',sources:['EVID_TCMS_SESSION','TEC-12'],caution:'To inny system i wcześniejsze zdarzenie niż czujnik stanowiska nr 3.'},
 {id:'e13',title:'Zamknięcie sesji diagnostycznej',day:18,time:'01:24',place:'diagnostyka',sources:['TEC-13','EVID_TCMS_SESSION','TEC-12'],caution:'Zakończenie testu nie rozstrzyga sporu o zgodność dokumentacji.'},
 {id:'e14',title:'Rozpoczęcie zdalnej sesji audytowej',day:18,time:'01:30',place:'audit',sources:['EVID_CONFERENCE_SESSION','DIG-09'],caution:'Aktywna prezentacja wideo bez kamery nie potwierdza przebywania osoby przy komputerze.'},
 {id:'e15',title:'Nadanie wiadomości z propozycją spotkania',day:18,time:'01:32',place:'system',sources:['EVID_MESSAGE_THREAD_RECOVERED'],caution:'Wysłanie wiadomości nie dowodzi jej odczytania ani fizycznej obecności nadawcy.'},
 {id:'e16',title:'Medyczny przedział czasu zgonu',day:18,time:'01:41',to:'01:49',place:'bay3',sources:['MED-03'],caution:'01:41–01:49 to przedział, nie ustalona minuta. Nie utożsamiaj go ze znacznikiem 01:44.'},
 {id:'e17',title:'Impuls mechaniczny czujnika stanowiska 3',day:18,time:'01:44',place:'bay3',sources:['TEC-14'],caution:'Czujnik nie podaje przyczyny impulsu, tożsamości osoby ani chwili zgonu.'},
 {id:'e18',title:'Zarejestrowanie alarmu medycznego',day:18,time:'02:02',place:'dyspozytornia',sources:['MED-01','DIG-10'],caution:'Alarm wyznacza czas zgłoszenia, a nie koniecznie moment odnalezienia ani zgonu.'},
 {id:'e19',title:'Rozpoczęcie formalnego zabezpieczenia stanowiska',day:18,time:'03:14',place:'bay3',sources:['ADM-13'],caution:'Ratownicy weszli do miejsca zdarzenia wcześniej; stan śladów może być wtórnie zmieniony.'},
 {id:'e20',title:'Przekazanie zaplombowanej kopii do depozytu',day:18,time:'05:41',place:'depozyt',sources:['ADM-13'],caution:'Depozyt potwierdza przekazanie kopii, nie poprawność wszystkich pierwotnych zapisów.'}
].map((e,i)=>({...e,order:i,from:tlISO(e.day,e.time),until:e.to?tlISO(e.day,e.to):null}));
// Stała mieszanka zapobiega pokazaniu poprawnej kolejności na liście.
const TL_SHUFFLE=['e13','e04','e18','e08','e16','e01','e11','e06','e20','e03','e14','e09','e02','e19','e07','e12','e05','e17','e15','e10'];
const TL_MAP=new Map(TL_EVENTS.map(e=>[e.id,e]));
function tlDefault(){return {entries:{},selected:null,filter:'all',showFeedback:false};}
STATE.timeline11=tlDefault();
function tlIsOpen(e){return e.sources.some(id=>STATE.found.has(id));}
function tlSources(e){return e.sources.filter(id=>STATE.found.has(id)&&byId[id]);}
function tlBlank(){return {at:'',to:'',place:'unknown',actor:'',sourceIds:[],reason:''};}
function tlCleanEntry(e,x){if(!x||typeof x!=='object')return null;
 const minute=v=>typeof v==='string'&&/^2026-11-(17|18)T\d\d:\d\d(?::[0-5]\d)?$/.test(v)?v.slice(0,16):'';
 const isDate=v=>!!v&&v>=TL_BASE&&v<=TL_END;
 const sources=tlSources(e);const unique=[...new Set(Array.isArray(x.sourceIds)?x.sourceIds:[])].filter(id=>sources.includes(id)).slice(0,8);
 return {at:isDate(minute(x.at))?minute(x.at):'',to:isDate(minute(x.to))?minute(x.to):'',place:Object.hasOwn(TL_PLACES,x.place)?x.place:'unknown',actor:Object.hasOwn(TL_ACTORS,x.actor)?x.actor:'',sourceIds:unique,reason:String(x.reason||'').slice(0,1500)};
}
function tlExport(){return {entries:Object.fromEntries(Object.entries(STATE.timeline11.entries).map(([id,x])=>[id,{at:x.at,to:x.to,place:x.place,actor:x.actor,sourceIds:x.sourceIds,reason:x.reason}]))};}
function tlRestore(data){const next=tlDefault();if(data?.entries&&typeof data.entries==='object')for(const e of TL_EVENTS){if(!tlIsOpen(e))continue;const x=tlCleanEntry(e,data.entries[e.id]);if(x)next.entries[e.id]=x;}STATE.timeline11=next;}
function tlReset(){STATE.timeline11=tlDefault();}
function tlAssessment(e,x){const bad=[],warn=[],good=[];if(!x?.at)return {state:'unplaced',bad,warn,good};
 if(x.at<TL_BASE||x.at>TL_END)bad.push('Czas poza zakresem rekonstrukcji (17.11 18:00 – 18.11 06:00).');
 if(e.until){if(!x.to)warn.push('Zdarzenie jest przedziałem, a nie pojedynczą minutą. Podaj także górną granicę.');else if(x.to<x.at)bad.push('Koniec przedziału poprzedza jego początek.');
   if(x.at!==e.from||x.to!==e.until)warn.push('Podany przedział nie jest zgodny z udokumentowanym zakresem źródła. Nie zawężaj czasu zgonu do jednej minuty.');
   else good.push('Zachowano medyczny przedział, bez sztucznej dokładności.');
 }else{if(x.to)warn.push('Źródło podaje konkretny znacznik czasu. Dodatkowy zakres wymaga osobnego uzasadnienia.');if(x.at!==e.from)bad.push('Wskazany czas nie zgadza się ze znacznikiem w uzyskanym materiale.');else good.push('Czas zgodny ze źródłem.');}
 if(x.place==='unknown')warn.push('Nie określono rodzaju miejsca / systemu zdarzenia.');
 else if(x.place!==e.place)warn.push('Wskazana lokalizacja nie odpowiada temu, co rejestruje źródło. Odróżnij punkt systemowy od fizycznej obecności osoby.');
 else good.push('Miejsce lub typ zapisu zgodne z dokumentem.');
 const ids=tlSources(e);if(!x.sourceIds.length)bad.push('Brak powiązanego, rzeczywiście zdobytego źródła zdarzenia.');else if(x.sourceIds.every(s=>ids.includes(s)))good.push('Dołączono dostępne, właściwe źródło.');else bad.push('Niepoprawne źródło.');
 if(x.actor){warn.push('Przypisanie osoby jest hipotezą: zapis konta, karty lub sesji nie potwierdza automatycznie jej fizycznej obecności.');}
 if(e.until&&x.at===e.from&&x.to===e.until)good.push('01:44 można analizować w obrębie zakresu 01:41–01:49, lecz nie wolno utożsamiać zdarzeń.');
 const reasonIssue=tl7ReasonAudit(e,x);if(reasonIssue)warn.push(reasonIssue);else good.push('Uzasadnienie odnosi się do tego zdarzenia i jego źródeł.');
 return {state:bad.length?'bad':warn.length?'warn':'ok',bad,warn,good};}
function tlOpts(obj,val){return Object.entries(obj).map(([k,v])=>`<option value="${esc(k)}" ${k===val?'selected':''}>${esc(v)}</option>`).join('');}
function tlForm(){const st=STATE.timeline11,e=TL_MAP.get(st.selected),el=$('tlEditor');if(!e||!tlIsOpen(e)){el.innerHTML='<div class="tl-locked-msg">Wybierz odkryty punkt rekonstrukcji. Zawartość pozostałych punktów jest ukryta do czasu zdobycia odpowiednich dokumentów.</div>';return;}
 const x=st.entries[e.id]||tlBlank(),res=tlAssessment(e,x),possible=tlSources(e);
 el.innerHTML=`<div class="formline" style="justify-content:space-between;margin:10px 0"><b>${esc(e.title)}</b><span class="tl-badge">Odkryta karta</span></div><p class="muted small">Zapisz własne ustalenie. Pola nie uzupełniają się automatycznie z kanonu.</p>
 <div class="tl-fields"><label class="tl-field">Od / znacznik czasu<input type="datetime-local" id="tlAt" step="60" min="${TL_BASE}" max="${TL_END}" value="${esc(x.at)}"></label><label class="tl-field">Do (tylko gdy źródło podaje zakres)<input type="datetime-local" id="tlTo" step="60" min="${TL_BASE}" max="${TL_END}" value="${esc(x.to)}"></label><label class="tl-field tl-wide">Miejsce zdarzenia lub pochodzenie zapisu<select id="tlPlace">${tlOpts(TL_PLACES,x.place)}</select></label><label class="tl-field tl-wide">Osoba wiązana z wydarzeniem (opcjonalna hipoteza)<select id="tlActor">${tlOpts(TL_ACTORS,x.actor)}</select></label></div>
 <div class="tl-form-help">Wpisuj godzinę z dokładnością do minuty (GG:MM). Jeżeli źródło podaje sekundy, zachowaj je w uzasadnieniu. Powiązanie konta lub użycia karty z osobą jest hipotezą wymagającą niezależnego dowodu. Nie traktuj go jako stwierdzonej obecności.</div>
 <div style="margin-top:13px"><b class="small">Powiązane zdobyte źródła</b>${possible.map(id=>`<label class="tl-source-check"><input type="checkbox" data-tl-source="${esc(id)}" ${x.sourceIds.includes(id)?'checked':''}><span><b>${esc(evDisplayRef(byId[id]))}</b> · ${esc(byId[id].title)}</span></label>`).join('')}</div>
 <label class="tl-field tl-wide" style="margin-top:14px">Uzasadnienie i ograniczenia źródła<textarea id="tlReason" maxlength="1500" placeholder="Co dokładnie ustala ten zapis, a czego nie potwierdza?">${esc(x.reason)}</textarea></label>
 <div class="tl-actions"><button class="btn" id="tlSave">Zapisz ustalenie</button><button class="btn alt" id="tlCheck">Sprawdź tę kartę</button><button class="btn subtle" id="tlClear">Wyczyść kartę</button></div><div class="tl-results" id="tlCardResult" role="status" aria-live="polite">${esc(e.caution)}${x.at?'\n\n'+esc(tlAssessmentText(res)):''}</div>`;
 $('tlSave').addEventListener('click',()=>tlSubmit(true));$('tlCheck').addEventListener('click',()=>tlSubmit(false));$('tlClear').addEventListener('click',()=>{psAsk('Wyczyścić ustalenia tego punktu?',()=>{delete st.entries[e.id];tlRender();});});
}
function tlAssessmentText(res){if(res.state==='unplaced')return 'Nie określono czasu. Wprowadź własne ustalenia i powiąż dowód.';
 return 'Ocena: '+(res.state==='bad'?'SPRZECZNOŚĆ ZE ŹRÓDŁEM':res.state==='warn'?'DO WERYFIKACJI':'ZGODNE Z DOKUMENTAMI')+'\n'+[...res.bad.map(s=>'✕ '+s),...res.warn.map(s=>'! '+s),...res.good.map(s=>'✓ '+s)].join('\n');}
function tlSubmit(save){const st=STATE.timeline11,e=TL_MAP.get(st.selected);if(!e||!tlIsOpen(e))return;
 const raw={at:$('tlAt').value,to:$('tlTo').value,place:$('tlPlace').value,actor:$('tlActor').value,sourceIds:[...$('tlEditor').querySelectorAll('[data-tl-source]:checked')].map(n=>n.dataset.tlSource),reason:$('tlReason').value};
 const entry=tlCleanEntry(e,raw);if(!entry?.at){toast('Podaj poprawny czas od 17.11 godz. 18:00 do 18.11 godz. 06:00 (dokładność do minuty).');return;}
 const assessment=tlAssessment(e,entry);if(save){st.entries[e.id]=entry;if(assessment.state==='ok')window.PS617_SYNC?.enqueue?.({type:'verify_timeline',eventId:e.id,entry:{...entry}});tlRender();PS_EVENTS.timeline(e.id,assessment);toast('Zapisano punkt rekonstrukcji.');}else{$('tlCardResult').textContent=e.caution+'\n\n'+tlAssessmentText(assessment);} }
function tlRenderChoices(){const st=STATE.timeline11;let items=TL_SHUFFLE.map(id=>TL_MAP.get(id));
 items=items.filter(e=>{const o=tlIsOpen(e),x=st.entries[e.id],r=tlAssessment(e,x);return st.filter==='all'||st.filter==='available'&&o||st.filter==='unplaced'&&o&&!x?.at||st.filter==='review'&&o&&x?.at&&r.state!=='ok';});
 $('tlChoices').innerHTML=items.length?items.map(e=>{const o=tlIsOpen(e),x=st.entries[e.id],r=tlAssessment(e,x);const label=!o?'Nieodkryty punkt rekonstrukcji':e.title;const desc=!o?'Wymaga zdobycia akt.':!x?.at?'Dostępne źródło · brak własnego czasu':(x.at.slice(5,10)+' '+x.at.slice(11)+' · '+(r.state==='bad'?'sprzeczność':r.state==='warn'?'do weryfikacji':'zgodne ze źródłami'));
 return `<button type="button" class="tl-choice ${!o?'locked':r.state==='ok'?'good':x?.at?'problem':''} ${st.selected===e.id?'active':''}" data-tl-pick="${esc(e.id)}" ${!o?'disabled':''}><b>${esc(label)}</b><small>${esc(desc)}</small></button>`;}).join(''):'<p class="muted small">Brak punktów zgodnych z filtrem.</p>';
 $('tlChoices').querySelectorAll('[data-tl-pick]').forEach(b=>b.addEventListener('click',()=>{st.selected=b.dataset.tlPick;tlRender();}));}
function tlMinutes(t){return (Date.parse(t+':00Z')-Date.parse(TL_BASE+':00Z'))/60000;}
function tlChart(){const st=STATE.timeline11,items=TL_EVENTS.filter(e=>tlIsOpen(e)&&st.entries[e.id]?.at).map(e=>({e,x:st.entries[e.id]})).sort((a,b)=>a.x.at.localeCompare(b.x.at));
 const axis=$('tlChart');axis.innerHTML=`<div class="tl-axis">${Array.from({length:13},(_,i)=>`<div class="tl-axis-line"><span>${String((18+i)%24).padStart(2,'0')}:00</span></div>`).join('')}</div><div class="tl-track" id="tlTrack"></div>`;
 const tr=$('tlTrack');let prev=-999,stack=0;for(const {e,x} of items){const minutes=Math.max(0,Math.min(720,tlMinutes(x.at)));const p=minutes/720*650;
 if(p-prev<23)stack++;else stack=0;prev=p;
 const btn=document.createElement('button');btn.type='button';btn.className='tl-pin '+(st.selected===e.id?'active ':'')+(tlAssessment(e,x).state==='bad'?'error':'');btn.style.top=(p+stack*16)+'px';btn.style.left=Math.min(stack*8,52)+'px';btn.style.width=`calc(100% - ${Math.min(stack*8,52)+10}px)`;btn.innerHTML='<b>'+esc(x.at.slice(11))+'</b><small>'+esc(e.title)+'</small>';btn.title=e.title+' · '+x.at.replace('T',' ');btn.addEventListener('click',()=>{st.selected=e.id;tlRender();});tr.append(btn);}
 $('tlChartCaption').textContent=items.length+' z 20 punktów umieszczonych przez śledczego. Zdarzenia o nakładających się przedziałach nie muszą być sprzeczne.';
}
const TL_TRAVEL={
 'audit|bay3':215,'bay3|audit':215,
 'audit|dyspozytornia':null,
 'dyspozytornia|bay3':210,'bay3|dyspozytornia':210,
 'diagnostyka|bay3':130,'bay3|diagnostyka':130
};
function tlGlobalFindings(){const findings=[];let entries=TL_EVENTS.filter(e=>tlIsOpen(e)&&STATE.timeline11.entries[e.id]?.at).map(e=>({e,x:STATE.timeline11.entries[e.id],r:tlAssessment(e,STATE.timeline11.entries[e.id])}));
 let nErr=entries.filter(z=>z.r.state==='bad').length,nWarn=entries.filter(z=>z.r.state==='warn').length;
 if(nErr)findings.push({kind:'bad',message:`${psCount(nErr,'karta','karty','kart')} ${nErr===1?'ma':'mają'} czas lub źródła sprzeczne z dokumentami. Popraw je przed zatwierdzeniem chronologii.`});
 if(nWarn)findings.push({kind:'warn',message:`${psCount(nWarn,'karta','karty','kart')} wymaga doprecyzowania miejsca, przedziału, źródeł, przypisanej osoby lub uzasadnienia.`});
 // Compare only events whose canonical time windows do not overlap. Death interval and sensor 01:44 are intentionally excluded.
 const swapped=[];
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  let a=entries[i],b=entries[j];const canonAEnd=a.e.until||a.e.from,canonBEnd=b.e.until||b.e.from;
  if(canonAEnd<=b.e.from&&a.x.at>b.x.at||canonBEnd<=a.e.from&&b.x.at>a.x.at)swapped.push([a.e.title,b.e.title]);
 }
 if(swapped.length)findings.push({kind:'bad',message:`Odwrócona kolejność w ${swapped.length} parach niepokrywających się zdarzeń. Przykład: „${swapped[0][0]}” oraz „${swapped[0][1]}”.`});
 const death=entries.find(z=>z.e.id==='e16'),impact=entries.find(z=>z.e.id==='e17');
 if(death&&impact&&death.x.to){if(impact.x.at<death.x.at||impact.x.at>death.x.to)findings.push({kind:'warn',message:'Znacznik czujnika poza wpisanym przedziałem zgonu. Zweryfikuj źródła, nie ustalaj automatycznie momentu śmierci.'});else findings.push({kind:'ok',message:'Zdarzenie czujnika przypada w rozważanym przedziale zgonu. To współwystępowanie, nie dowód tożsamości obu zdarzeń.'});}
 let travels=0;for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  let [a,b]=[entries[i],entries[j]].sort((p,q)=>p.x.at.localeCompare(q.x.at));if(!a.x.actor||a.x.actor!==b.x.actor)continue;
  const need=TL_TRAVEL[a.x.place+'|'+b.x.place];if(need==null)continue;
  const delta=(tlMinutes(b.x.at)-tlMinutes(a.x.to||a.x.at))*60;
  if(delta<need){travels++;if(travels<=3)findings.push({kind:STATE.found.has('ADM-11')?'bad':'warn',message:`Hipoteza ruchu (${TL_ACTORS[a.x.actor]}): między „${a.e.title}” a „${b.e.title}” potrzeba min. ${need} s; we wpisach jest ${Math.max(0,Math.round(delta))} s. To ocena wykonalności przypisanej przez Ciebie trasy, nie dowód tożsamości osoby.`});}
 }
 if(!entries.length)findings.push({kind:'warn',message:'Brak umieszczonych zdarzeń. Zacznij od dostępnych materiałów i wpisz własne godziny.'});
 else if(!swapped.length&&!nErr&&!travels)findings.push({kind:'ok',message:'Nie znaleziono sprzeczności kolejności w obecnie wpisanych zdarzeniach. To nie dowodzi kompletności ani prawdziwości wszystkich hipotez.'});
 let missing=TL_EVENTS.filter(e=>!tlIsOpen(e)).length; if(missing)findings.push({kind:'warn',message:`${missing} zdarzeń nadal ukrytych przez brak materiałów. Ocena całego przebiegu nie jest jeszcze kompletna.`});
 const placed=TL_EVENTS.filter(e=>STATE.timeline11.entries[e.id]?.at).length;if(!missing&&placed===20&&!nErr&&!nWarn&&!swapped.length&&!travels)findings.push({kind:'ok',message:'Wszystkie 20 punktów ma poprawnie udokumentowane ramy czasowe. Nie stanowi to samo w sobie wniosku o sprawcy.'});
 return findings;
}
function tlRenderChecks(){const list=tlGlobalFindings();$('tlConsistency').innerHTML=list.slice(0,12).map(f=>`<div class="tl-check ${f.kind}">${esc(f.message)}</div>`).join('');}
function tlRender(){if(!$('tlChoices'))return;const st=STATE.timeline11;const available=TL_EVENTS.filter(tlIsOpen).length,placed=TL_EVENTS.filter(e=>st.entries[e.id]?.at).length,clean=TL_EVENTS.filter(e=>st.entries[e.id]?.at&&tlAssessment(e,st.entries[e.id]).state==='ok').length;
 $('tlMetrics').innerHTML=[[20,'Punkty rekonstrukcji'],[available,'Odkryte w aktach'],[placed,'Rozmieszczone na osi'],[clean,'Bez uwag metodycznych']].map(([n,t])=>`<div class="tl-metric"><b>${n}</b><span>${esc(t)}</span></div>`).join('');
 $('tlFilter').value=st.filter;tlRenderChoices();tlForm();tlChart();tlRenderChecks();window.PS_CORRELATIONS?.scheduleApply();}
$('tlFilter').addEventListener('change',e=>{STATE.timeline11.filter=e.target.value;tlRenderChoices();});
$('tlVerifyAll').addEventListener('click',()=>{tlRenderChecks();$('tlConsistency').scrollIntoView({behavior:'smooth',block:'center'});toast('Sprawdzono zgodność wpisanej chronologii.');});

/* ETAP 12 — OGLĘDZINY ZAJEDNI. Istniejące dokumenty są jedynym źródłem nowych materiałów. */
const SC_ROOMS=[
 {id:'bay',title:'Stanowisko nr 3',short:'Nisza i osłony',desc:'Nisza N-3, osłona stanowiska, ślady i rejestr instalacji.',shape:'bay'},
 {id:'workshop',title:'Warsztat TW-217',short:'Wagon i formularze',desc:'Karty robocze, podzespoły i ewidencja magazynowa.',shape:'workshop'},
 {id:'dispatch',title:'Dyspozytornia',short:'Konsola i rejestry',desc:'Dyspozycje ruchowe, ewidencja wejść i korespondencja radiowa.',shape:'dispatch'},
 {id:'audit',title:'Pokój dokumentacji',short:'Audyt i archiwum',desc:'Dokumenty odbioru, stacja audytowa i dane techniczne.',shape:'audit'},
 {id:'office',title:'Biuro BHP',short:'Zgłoszenia i raporty',desc:'Dokumentacja bezpieczeństwa i rejestr zmian kadrowych.',shape:'office'},
 {id:'passage',title:'Korytarz południowy',short:'Drzwi i zasoby',desc:'Czytnik drzwiowy, punkt kart oraz wózek zasobów.',shape:'passage'},
 {id:'lab',title:'Depozyt śladów',short:'Próbki i plomby',desc:'Przechowywanie próbek, kontrola łańcucha przekazania.',shape:'lab'}
];
const SC_SPOTS=[
 {id:'bay_photo',room:'bay',title:'Krawędź osłony niszy',x:30,y:47,doc:'VIS-02',look:'Osłona stanowiska, krawędź niszy, skala pomiarowa i widoczne zabrudzenia.',obs:'Dokumentacja zdjęciowa pokazuje stan powierzchni po interwencji ratowników. Sama fotografia nie wskazuje mechanizmu urazu ani sprawcy.'},
 {id:'bay_body',room:'bay',title:'Miejsce pierwszych oględzin',x:56,y:62,doc:'MED-02',look:'Oznaczony obszar dokumentacji obrażeń i pozycji poszkodowanej.',obs:'Kartę pierwszych oględzin należy traktować jako zapis zmian i ich lokalizacji, nie gotową opinię o przyczynie zgonu.'},
 {id:'bay_protocol',room:'bay',title:'Punkt zabezpieczenia śladów',x:73,y:35,doc:'ADM-13',look:'Oznaczenia plomb i punkt fotografowania miejsca.',obs:'Protokół wskazuje kolejność czynności, w tym to, że ratownicy byli na miejscu przed formalnym zabezpieczeniem.'},
 {id:'bay_sensor',room:'bay',title:'Czujnik przy stanowisku',x:76,y:72,doc:'TEC-14',look:'Czujnik infrastruktury przeglądowej z dostępem do rejestru impulsów.',obs:'System czujnika jest oddzielny od telemetrii tramwaju. Rejestruje bodziec mechaniczny, nie osobę ani moment zgonu.'},
 {id:'bay_objects',room:'bay',title:'Rejestr zdjęć przedmiotów',x:40,y:77,doc:'VIS-11',look:'Indeksy fotografii i opakowań obiektów zabezpieczonych w niszy.',obs:'Stan przedmiotów po akcji ratunkowej nie musi być identyczny ze stanem bezpośrednio po zdarzeniu.'},
 {id:'bay_compare',room:'bay',title:'Porównanie ram czasowych',x:18,y:23,doc:null,gate:'timeline',look:'Miejsce do zestawienia znaczników czasu z dwóch niezależnych źródeł.',obs:'Zapis czujnika może pokrywać się z przedziałem medycznym. Zbieżność czasowa nie potwierdza wspólnej przyczyny ani konkretnego sprawcy.'},
 {id:'wrk_order',room:'workshop',title:'Pulpit kart pracy',x:23,y:65,doc:'EVID_WORK_ORDER_RAW',look:'Pierwotna karta zlecenia dla TW-217 w rejestrze kolejki.',obs:'Wersja pierwotna pozwala odróżnić zadanie zlecone od pomiaru rzeczywiście wpisanego.'},
 {id:'wrk_gaps',room:'workshop',title:'Regał formularzy zamknięcia',x:45,y:30,doc:'EVID_SERVICE_FORM_GAPS',look:'Elektroniczna historia wypełniania i zatwierdzania formularzy serwisowych.',obs:'Puste rubryki to brak danych; nie należy interpretować ich jako prawidłowych zerowych wartości.'},
 {id:'wrk_serial',room:'workshop',title:'Szafa magazynowa części',x:74,y:40,doc:'TEC-07',look:'Kartoteka wydanych i odebranych elementów TW-217.',obs:'Magazynowa karta numerów powinna zostać porównana z fizyczną tabliczką i dokumentem odbiorowym.'},
 {id:'wrk_device',room:'workshop',title:'Stanowisko porównania wariantów',x:77,y:74,doc:'TEC-15',look:'Dokumentacja różnic technicznych pomiędzy wariantami urządzenia bezpieczeństwa.',obs:'Różnice wariantów nie ustalają automatycznie przyczyny zgonu ani odpowiedzialności osoby.'},
 {id:'disp_order',room:'dispatch',title:'Terminal dyspozycji',x:27,y:39,doc:'EVID_DISPATCH_REVISION',look:'Rejestr zmian poleceń dla TW-217.',obs:'Wpis dyspozycji określa czynność systemową, a nie fizyczne położenie operatora w następnych minutach.'},
 {id:'disp_entry',room:'dispatch',title:'Księga służbowa',x:72,y:40,doc:'EVID_RAW_ENTRY_TIMES',look:'Wpisy odbić służbowych i ich znaczniki czasu.',obs:'Odbicie identyfikatora wskazuje operację w systemie; dane wymagają ostrożności przy przypisywaniu obecności.'},
 {id:'disp_radio',room:'dispatch',title:'Archiwum łączności',x:51,y:77,doc:'EVID_RADIO_GAP',look:'Rejestr indeksów zapisów radiowych, w tym przerw i metadanych.',obs:'Brak fragmentu zapisu nie stanowi samodzielnego dowodu treści brakującej rozmowy.'},
 {id:'aud_accept',room:'audit',title:'Teczka odbioru ZG-41',x:21,y:38,doc:'EVID_ACCEPTANCE_RECORD',look:'Archiwalna teczka dokumentacji odbiorowej podzespołów.',obs:'Autentyczność protokołu nie jest tym samym co prawdziwość wszystkich zawartych w nim ocen.'},
 {id:'aud_versions',room:'audit',title:'Repozytorium wersji dokumentu',x:70,y:32,doc:'TEC-09',look:'Historia kolejnych redakcji i adnotacji do dokumentu odbiorowego.',obs:'Historia zmian pozwala ocenić, czy rozbieżność była widoczna przed nocą zdarzenia; sama nie potwierdza czyjejś obecności.'},
 {id:'aud_stream',room:'audit',title:'Stacja prezentacji zdalnej',x:70,y:70,doc:'EVID_CONFERENCE_SESSION',look:'Zapis aktywnej prezentacji i historii połączenia audytowego.',obs:'Połączenie może być aktywne bez fizycznej obecności prowadzącego przed ekranem.'},
 {id:'aud_telemetry',room:'audit',title:'Rejestr wejść klawiatury',x:43,y:68,doc:'DIG-09',look:'Lokalne logi aktywności stacji audytowej.',obs:'Brak wejścia klawiatury nie dowodzi wyjścia z pokoju, a otwarty slajd nie dowodzi obecności.'},
 {id:'aud_photo',room:'audit',title:'Indeks zdjęć z TW-217',x:38,y:23,doc:'EVID_SERIAL_PHOTO',look:'Kopia fotografii numeru podzespołu zapisana w archiwum technicznym.',obs:'Oznaczenie na zdjęciu trzeba skonfrontować z ewidencją i protokołem. Fotografia nie wskazuje osoby montującej część.'},
 {id:'off_bhp',room:'office',title:'Stanowisko zgłoszeń BHP',x:24,y:48,doc:'EVID_BHP_DRAFT',look:'Lokalny szkic zgłoszenia wcześniejszego zdarzenia bezpieczeństwa.',obs:'Status wersji roboczej to nie dowód doręczenia zgłoszenia do zewnętrznej bramki.'},
 {id:'off_outbox',room:'office',title:'Serwerowa bramka wysyłek',x:73,y:34,doc:'EVID_OUTBOX_MISSING_SUBMISSION',look:'Historia przyjmowania zgłoszeń bezpieczeństwa przez oddzielny system.',obs:'Dziennik przyjęć można porównać ze szkicem; brak potwierdzenia wysyłki nie wskazuje sprawcy śmierci.'},
 {id:'off_payroll',room:'office',title:'Rejestr korekt zmianowych',x:63,y:75,doc:'EVID_PAYROLL_MANUAL_EDIT',look:'Dziennik administracyjny zmian rozliczeń dyżurów.',obs:'Autoryzacja zmiany pola księgowego nie odpowiada automatycznie na pytanie, kto był na miejscu zdarzenia.'},
 {id:'pass_card',room:'passage',title:'Punkt wydawania identyfikatorów',x:28,y:25,doc:'ADM-07',look:'Rejestr wydania kart tymczasowych.',obs:'Formalnie przydzielony posiadacz karty nie musi być osobą, która użyła jej później.'},
 {id:'pass_cart',room:'passage',title:'Wózek zasobów',x:31,y:71,doc:'EVID_RESOURCE_HANDOVER',look:'Ewidencja przenoszonych nośników i przedmiotów przeznaczonych do pracy nocnej.',obs:'Przekazanie przedmiotu nie dowodzi jego dalszego zastosowania ani tożsamości użytkownika przy drzwiach.'},
 {id:'pass_reader',room:'passage',title:'Czytnik południowych drzwi',x:79,y:47,doc:'EVID_T17_DOOR_EVENT',look:'Czytnik dostępu do strefy południowej i jego historia operacji.',obs:'Czytnik rejestruje identyfikator, nie wykonuje fotografii osoby przekraczającej przejście.'},
 {id:'pass_cctv',room:'passage',title:'Skrócony zapis wejścia',x:60,y:21,doc:'VIS-09',look:'Zapisy otwarcia drzwi w systemie monitoringu przejścia.',obs:'Przed połączeniem zdarzeń z różnych urządzeń trzeba sprawdzić ich synchronizację czasową.'},
 {id:'lab_catalog',room:'lab',title:'Katalog pobranych próbek',x:26,y:49,doc:'LAB-01',look:'Numerowany wykaz materiału pobranego przy stanowisku.',obs:'Numery próbek powinny zgadzać się z planem miejsca i plombami; część pobrano już po wejściu ratowników.'},
 {id:'lab_compare',room:'lab',title:'Próbka kontrolna wyposażenia',x:72,y:35,doc:'LAB-07',look:'Materiał porównawczy z wyposażenia używanego w obchodach dokumentacyjnych.',obs:'Podobieństwo klasy śladu nie identyfikuje jednej osoby. Potrzebne jest niezależne ustalenie pochodzenia przedmiotu.'},
 {id:'lab_s3',room:'lab',title:'Pojemnik profilu S-3',x:42,y:74,doc:'LAB-02',look:'Przygotowany materiał do badania porównawczego śladów smaru.',obs:'Ślady o charakterze warsztatowym mogą pochodzić z więcej niż jednego źródła.'},
 {id:'lab_w7',room:'lab',title:'Pojemnik profilu W-7',x:76,y:75,doc:'LAB-03',look:'Przygotowane włókna do porównania w laboratorium.',obs:'Zgodność klasy włókna nie jest indywidualną identyfikacją źródła.'},
 {id:'lab_med',room:'lab',title:'Teczka medycyny sądowej',x:20,y:22,doc:'MED-03',look:'Dokumentacja wnioskowania o zakresie czasu zgonu.',obs:'Czas medyczny ustala się jako przedział, nie pojedynczą minutę uzyskaną z instalacji technicznej.'}
];
// Etap oględzin: autorskie zadania proceduralne i rekonstrukcje, bez dodawania nowych faktów do akt.
const SC_METHODS={"photo": "Dokumentacja wizualna", "record": "Odczyt protokołu lub rejestru", "compare": "Porównanie niezależnych zapisów", "sample": "Badanie materiału śladowego"};
const SC_CHALLENGES={
 "bay_photo":{"method": "photo", "question": "Kiedy wykonano zdjęcia osłony i jej zabrudzeń, ratownicy byli już na miejscu. Co wolno ustalić?", "options": ["Fotografia przedstawia stan powierzchni po interwencji.", "Fotografia dowodzi chwili powstania zabrudzenia.", "Fotografia identyfikuje osobę, która użyła osłony."], "correct": 0},
 "bay_body":{"method": "photo", "question": "Karta wskazuje rozłożenie obrażeń i pozycję poszkodowanej. Jaki ma zakres?", "options": ["Jednoznacznie ustala narzędzie i sprawcę.", "Dokumentuje widoczne zmiany, bez pełnego wyjaśnienia przyczyny.", "Zastępuje opinię medycyny sądowej."], "correct": 1},
 "bay_protocol":{"method": "record", "question": "Zestawiono oznaczenia plomb i kolejność czynności. Który element ma znaczenie dla oceny śladów?", "options": ["Czy zdjęcia mają atrakcyjną kolorystykę.", "Czy formalne zabezpieczenie poprzedziło wezwanie pomocy.", "Czy ratownicy byli obecni przed zabezpieczeniem miejsca."], "correct": 2},
 "bay_sensor":{"method": "record", "question": "Zapisano impuls mechaniczny w instalacji stanowiska. Co mierzy ten system?", "options": ["Wystąpienie bodźca w czujniku.", "Tożsamość osoby w niszy.", "Dokładną minutę śmierci."], "correct": 0},
 "bay_objects":{"method": "photo", "question": "Dokumentacja zestawia zdjęcia przedmiotów z numerami opakowań. Co należy sprawdzić?", "options": ["Czy każdy przedmiot należał do napastnika.", "Czy fotografia odpowiada oznaczeniu i stanowi po interwencji.", "Czy zdjęcie rozstrzyga sposób powstania urazów."], "correct": 1},
 "bay_compare":{"method": "compare", "question": "Dwa niezależne źródła mówią o przedziale medycznym i impulsie czujnika. Co oznacza ich zbieżność?", "options": ["Dowód, że czujnik zarejestrował sam moment śmierci.", "Dowód obecności konkretnej osoby.", "Zgodność czasową wymagającą dodatkowej weryfikacji przyczyn."], "correct": 2},
 "wrk_order":{"method": "record", "question": "W rejestrze widoczna jest pierwotna karta pracy TW-217. Jak interpretować zleconą czynność?", "options": ["Zlecenie nie dowodzi jeszcze wykonania i pomiaru.", "Zlecenie jest zawsze potwierdzeniem wykonania.", "Zlecenie dowodzi prawidłowego stanu wagonu."], "correct": 0},
 "wrk_gaps":{"method": "compare", "question": "Historia formularzy obejmuje pola pozostawione bez wartości. Co oznacza pusta rubryka?", "options": ["Zerowy, lecz prawidłowy wynik pomiaru.", "Brak wpisanej informacji wymagający wyjaśnienia.", "Ustalony zamiar sfałszowania dokumentacji."], "correct": 1},
 "wrk_serial":{"method": "compare", "question": "Kartoteka zawiera numery podzespołów. Jak wiarygodnie ustalić zgodność części?", "options": ["Wystarczy nazwisko wydającego.", "Wystarczy zapis z jednej rubryki.", "Porównać ewidencję, oznaczenie fizyczne i dokument odbioru."], "correct": 2},
 "wrk_device":{"method": "compare", "question": "Zidentyfikowano dokumentację różnych wariantów urządzenia. Jaki jest właściwy wniosek?", "options": ["Różnica wersji wymaga ustalenia faktycznie zamontowanego wariantu.", "Każda różnica wersji oznacza sabotaż.", "Sam wariant rozstrzyga przyczynę śmierci."], "correct": 0},
 "disp_order":{"method": "record", "question": "Terminal zawiera zmianę dyspozycji dla wagonu. Co ten wpis potwierdza?", "options": ["Miejsce przebywania operatora przez całą noc.", "Zarejestrowaną decyzję w systemie, nie późniejsze położenie osoby.", "Tożsamość osoby przy stanowisku nr 3."], "correct": 1},
 "disp_entry":{"method": "record", "question": "Księga obejmuje odbicia identyfikatorów. Jak rozumieć taki zapis?", "options": ["Jako obserwację wideo użytkownika.", "Jako wiarygodne alibi dla całego dyżuru.", "Jako operację systemową bez pełnego potwierdzenia tożsamości."], "correct": 2},
 "disp_radio":{"method": "record", "question": "W archiwum występuje brakujący fragment łączności. Co z tego wynika?", "options": ["Brak ciągłego materiału do odtworzenia, nie treść rozmowy.", "Dowód, że ktoś świadomie usunął rozmowę.", "Dowód, że nie nadano żadnego polecenia."], "correct": 0},
 "aud_accept":{"method": "record", "question": "W teczce znajduje się protokół odbioru podzespołów. Co rozróżnić?", "options": ["Czy strona ma oryginalną pieczęć, i to wystarczy.", "Pochodzenie dokumentu i prawdziwość zawartych w nim ocen.", "Dokument odbiorowy i materiał identyfikujący napastnika."], "correct": 1},
 "aud_versions":{"method": "compare", "question": "Repozytorium pokazuje kolejne wersje dokumentu. Do czego służy taka historia?", "options": ["Do potwierdzenia miejsca pobytu każdej edytującej osoby.", "Do automatycznego wskazania sprawcy.", "Do ustalenia, kiedy zapis zmieniono i co w nim poprawiono."], "correct": 2},
 "aud_stream":{"method": "record", "question": "System zapisuje aktywną prezentację audytową. Co potwierdza?", "options": ["Działanie sesji, nie ciągłą obecność osoby przed ekranem.", "Nieprzerwany kontakt wzrokowy ze wszystkimi uczestnikami.", "Przebywanie prowadzącej w jednym miejscu przez całą sesję."], "correct": 0},
 "aud_telemetry":{"method": "compare", "question": "Na stacji zachowały się dane o wejściach klawiatury. Co oznacza ich brak?", "options": ["Pewny moment opuszczenia pokoju.", "Brak odnotowanej czynności przy klawiaturze, bez rozstrzygnięcia obecności.", "Wyłączenie komputera przez konkretną osobę."], "correct": 1},
 "aud_photo":{"method": "photo", "question": "W archiwum jest zdjęcie numeru podzespołu. Z czym je zestawić?", "options": ["Wyłącznie z nazwą pliku fotografii.", "Wyłącznie z relacją jednego świadka.", "Z ewidencją części i protokołem odbiorowym."], "correct": 2},
 "off_bhp":{"method": "record", "question": "Stanowisko przechowuje szkic zgłoszenia BHP. Co mówi jego status?", "options": ["Istniała wersja robocza; skuteczne wysłanie wymaga potwierdzenia.", "Organ zewnętrzny na pewno dostał zgłoszenie.", "Zgłoszenie nie miało żadnej treści."], "correct": 0},
 "off_outbox":{"method": "compare", "question": "Bramka serwerowa odrębnie rejestruje przyjęte wysyłki. Co należy porównać?", "options": ["Kolor i układ wiadomości.", "Szkic zgłoszenia z potwierdzeniem przyjęcia przez bramkę.", "Listę kontaktów i godzinę znalezienia ofiary."], "correct": 1},
 "off_payroll":{"method": "record", "question": "Dziennik administracyjny wskazuje korektę rozliczenia. Czego nie dowodzi?", "options": ["Zarejestrowania korekty.", "Istnienia wpisu księgowego.", "Fizycznej obecności osoby przy zdarzeniu."], "correct": 2},
 "pass_card":{"method": "record", "question": "Rejestr podaje osobę, której formalnie wydano kartę. Co wynika z wpisu?", "options": ["Przydział identyfikatora, a nie każde późniejsze użycie.", "Tożsamość osoby przechodzącej przez drzwi o dowolnej porze.", "Pewność, że karta nigdy nie zmieniła użytkownika."], "correct": 0},
 "pass_cart":{"method": "record", "question": "Ewidencja opisuje przekazanie zasobów. Jaki jest jej zakres?", "options": ["Rozstrzyga cel użycia przedmiotu po przekazaniu.", "Dokumentuje przekazanie, lecz nie wszystkie późniejsze działania.", "Stanowi nagranie osoby przy południowych drzwiach."], "correct": 1},
 "pass_reader":{"method": "record", "question": "Czytnik południowych drzwi rejestruje użycie karty. Co potwierdza?", "options": ["Tożsamość osoby ze zdjęcia czytnika.", "Całą trasę właściciela karty.", "Zdarzenie związane z identyfikatorem, nie twarz użytkownika."], "correct": 2},
 "pass_cctv":{"method": "compare", "question": "Porównywane są dane monitoringu i drzwi. Co zrobić przed ustaleniem kolejności?", "options": ["Skorygować różnice zegarów i sprawdzić synchronizację.", "Założyć, że każde urządzenie ma identyczny czas.", "Przypisać każde otwarcie właścicielowi karty."], "correct": 0},
 "lab_catalog":{"method": "record", "question": "Wykaz obejmuje próbki i plomby, część pobrano po wejściu ratowników. Co sprawdzić?", "options": ["Czy numery próbek są krótkie.", "Powiązanie numeru, miejsca pobrania i ciągłości zabezpieczenia.", "Czy wszystkie próbki pochodzą od jednej osoby."], "correct": 1},
 "lab_compare":{"method": "compare", "question": "Próbkę porównuje się z materiałem kontrolnym. Co może wynikać z podobieństwa?", "options": ["Pewna identyfikacja jednej osoby.", "Niezaprzeczalny motyw przestępstwa.", "Zgodność cech klasy, bez automatycznej identyfikacji źródła."], "correct": 2},
 "lab_s3":{"method": "sample", "question": "Pobrano próbkę smaru o profilu S-3. Co jest metodologicznie poprawne?", "options": ["Porównać profil ze źródłami i rozważyć inne pochodzenie.", "Uznać każdy ślad smaru za ślad jednego pracownika.", "Wyprowadzić z profilu dokładną godzinę nanoszenia."], "correct": 0},
 "lab_w7":{"method": "sample", "question": "W próbce są włókna o profilu W-7. Jak ocenić zgodność?", "options": ["Jako pewną identyfikację konkretnej odzieży.", "Jako zgodność grupowych cech wymagającą dalszego porównania.", "Jako rozstrzygnięcie miejsca pobytu osoby."], "correct": 1},
 "lab_med":{"method": "record", "question": "Dokumentacja medyczna wskazuje przedział czasu zgonu. Co z niego wynika?", "options": ["Pojedyncza minuta zgodna z impulsem czujnika.", "Moment zgonu ustalony co do sekundy.", "Przedział niepewności, którego nie wolno zawężać bez podstaw."], "correct": 2}
};
const SC_ROOM_CASES={
 "bay":{"needs": ["bay_photo", "bay_protocol"], "question": "Ratownicy weszli do niszy przed formalnym zabezpieczeniem miejsca. Jak to wpływa na interpretację fotografii i śladów?", "options": ["Nie można zakładać, że każdy widoczny układ przedmiotów odpowiada chwili zdarzenia.", "Fotografie na pewno przedstawiają niezmieniony stan sprzed interwencji.", "Samo wejście ratowników unieważnia wszystkie późniejsze materiały."], "correct": 0},
 "workshop":{"needs": ["wrk_order", "wrk_gaps"], "question": "Karta pracy wskazuje zadanie, natomiast historia formularza ma luki. Co można łącznie stwierdzić?", "options": ["Puste pola świadczą o pomiarze równym zero.", "Nie wszystkie czynności da się potwierdzić zapisem wykonania; potrzebne inne źródła.", "Brak rubryki przesądza o umyślnym działaniu konkretnej osoby."], "correct": 1},
 "dispatch":{"needs": ["disp_order", "disp_radio"], "question": "W systemie zapisano dyspozycję, a w łączności występuje luka. Jak ją ocenić?", "options": ["Luka potwierdza dokładną treść polecenia.", "Dyspozycja jest dowodem późniejszej obecności operatora przy niszy.", "Treści brakującej rozmowy nie można odtworzyć z samego braku zapisu."], "correct": 2},
 "audit":{"needs": ["aud_stream", "aud_telemetry"], "question": "Wideokonferencja trwała, a klawiatura nie rejestrowała aktywności. Jak ocenić alibi?", "options": ["Sesja nie potwierdza bez przerwy fizycznej obecności; trzeba szukać innych śladów.", "Aktywna prezentacja gwarantuje obecność prowadzącej przy komputerze.", "Brak naciśnięć klawiszy jednoznacznie oznacza opuszczenie pokoju."], "correct": 0},
 "office":{"needs": ["off_bhp", "off_outbox"], "question": "W komputerze jest szkic zgłoszenia, a oddzielny system przechowuje historię wysyłek. Jaki test ma sens?", "options": ["Sam szkic jest dowodem wpływu pisma do organu.", "Porównanie treści i statusu szkicu z potwierdzeniem przyjęcia przez bramkę.", "Brak wysyłki przesądza tożsamość sprawcy."], "correct": 1},
 "passage":{"needs": ["pass_card", "pass_reader"], "question": "Istnieje wydanie karty i jej użycie przy drzwiach. Co udowadnia ich zestawienie?", "options": ["Że właściciel karty na pewno przeszedł przez drzwi.", "Że czytnik zidentyfikował twarz użytkownika.", "Że przydzielony identyfikator został użyty; osobę trzeba ustalić osobno."], "correct": 2},
 "lab":{"needs": ["lab_catalog", "lab_compare"], "question": "Próbki zabezpieczono i wykonano porównanie materiałowe. Na czym opierać ostrożną interpretację?", "options": ["Na spójnej identyfikacji próbek i różnicy między zgodnością klasy a identyfikacją osoby.", "Wyłącznie na podobnym wyglądzie próbki.", "Na założeniu, że każde podobieństwo wskazuje jedną osobę."], "correct": 0}
};

/* WNIOSKOWANIE OGLĘDZIN: pięć interpretacji zamiast oceny liczby znaków. */
const SC35_ROOM_REASONS={"bay":["Ratownicy weszli przed zabezpieczeniem. Fotografie dokumentują późniejszy stan miejsca; jego wcześniejszy układ należy porównać z przebiegiem interwencji.","Zgodność plomby i fotografii pozwala przyjąć ułożenie obiektów jako wyjściowe, a ewentualne przesunięcia podczas pomocy ocenić na podstawie opisu ratowników.","Fotografia i protokół opisują dwa etapy dokumentacji; za punkt odniesienia dla chwili zdarzenia warto przyjąć pierwszy wykonany kadr.","Fakt wejścia ratowników wyjaśnia możliwe zmiany położenia, ale fotografie nie wymagają odrębnego porównania z kartą interwencji.","Oznaczenie kolejności plomb pozwala oddzielić przedmioty ruszane przez ratowników od wszystkich przedmiotów zastanych po zdarzeniu."],"workshop":["Karta potwierdza zlecenie, a historia formularza wskazuje braki wpisów. Bez innych dokumentów nie można uznać brakującego pomiaru za wykonany.","Zlecenie i historia formularza opisują tę samą czynność, zatem zapis zlecenia uzupełnia brak wartości pomiarowych w zamknięciu.","Puste rubryki ograniczają zakres ustaleń, ale podpis pod kartą pracy potwierdza, że przynajmniej sam pomiar został wykonany.","Historia formularza pozwala ustalić brak wpisu; pierwotne polecenie można wykorzystać jako zastępczy zapis pozytywnego wyniku.","Brak wartości w historii dokumentu wskazuje na błąd zapisu, a nie na brak pomiaru, jeśli obsada zmiany była zgodna z grafikiem."],"dispatch":["Rejestr potwierdza zmianę dyspozycji, lecz luka nagrania nie ujawnia treści rozmowy. Nie można z tych dwóch zapisów wywieść obecności przy niszy.","Zbieżność czasu dyspozycji i luki radiowej pozwala przyjąć wspólne polecenie; pozostałoby ustalenie jego adresata.","Dyspozycja dokumentuje decyzję, a przerwa w nagraniu pośrednio potwierdza, że przekazano ją przez radio.","Brak zapisu rozmowy jest zgodny z hipotezą wydania dodatkowego polecenia; na tej podstawie można odtworzyć jego ogólny cel.","Luka ogranicza rekonstrukcję słów rozmowy, ale rejestr dyspozycji pozwala przypisać operatorowi późniejsze działania przy niszy."],"audit":["Aktywna sesja potwierdza działanie połączenia, nie ciągłą obecność osoby. Brak wpisów klawiatury trzeba zestawić z niezależnymi śladami ruchu.","Połączenie i brak aktywności klawiatury potwierdzają wykonywanie prezentacji bez interakcji, co wystarcza do uznania obecności prowadzącej.","Nieprzerwana transmisja nie wskazuje miejsca pobytu, lecz brak naciśnięć klawiszy pozwala odtworzyć chwilę wyjścia z biura.","Log sesji daje mocne alibi cyfrowe, a jego zgodność z zegarem lokalnym zastępuje weryfikację przejścia przez drzwi.","Otwarte połączenie dowodzi działania stacji, dlatego przy ocenie obecności nie trzeba już sięgać do niezależnej chronologii przejść."],"office":["Szkic dowodzi przygotowania zgłoszenia; skuteczne przyjęcie wymaga wpisu bramki. Daty obu źródeł należy zweryfikować osobno.","Szkic i brak wpisu w bramce wskazują na zatrzymanie wysyłki, a status wersji roboczej można potraktować jako próbę doręczenia.","Porównanie szkicu z historią bramki pozwala ustalić treść i datę zgłoszenia do organu, choć sam odbiór wymaga osobnego potwierdzenia.","Brak dokumentu przyjęcia oznacza, że autor świadomie wycofał zawiadomienie, ale nie rozstrzyga przyczyn tej decyzji.","Szkic jest dokumentem zamiaru zgłoszenia, a zbieżność jego daty z rejestrem bramki wystarcza do wykazania skutecznego nadania."],"passage":["Ewidencja przydziału i czytnik dowodzą operacji identyfikatora. Użytkownika karty trzeba ustalić na podstawie innych źródeł.","Przydział karty i zapis czytnika wspólnie potwierdzają przejście uprawnionego posiadacza; monitoring jest potrzebny tylko do ustalenia kierunku.","Zgodność identyfikatora z ewidencją ogranicza liczbę użytkowników do formalnego właściciela, chyba że w systemie odnotowano pożyczenie.","Rejestr i czytnik ustalają zdarzenie dostępu, a do identyfikacji osoby wystarczy brak sprzecznego zapisu z innych kart.","Odnotowane użycie przy drzwiach potwierdza operację karty; pełną trasę osoby da się odtworzyć z samej kolejności czytników."],"lab":["Profile i plomby wspierają porównanie materiałów, ale transfer wtórny pozostaje możliwy. Zbieżność cech nie wskazuje sama człowieka.","Numery próbek i plomby potwierdzają materiał, a zgodność jego cech wystarcza do przypisania pochodzenia badanemu wyposażeniu.","Profil i protokół zabezpieczenia pozwalają ograniczyć źródło kontaktu do jednej osoby; transfer wtórny dotyczy tylko próbek pobranych później.","Zgodność klasy śladów wspiera związek z wyposażeniem, więc próbkę kontrolną z działań ratowników można wyłączyć z analizy.","Poprawna ciągłość zabezpieczenia pozwala traktować próbkę jako niezanieczyszczoną od chwili zdarzenia, niezależnie od czasu pobrania."]};
function sc35Order(tag,size){
 let h=((STATE.scene12?.answerSeed||1)>>>0)^2166136261;
 for(const c of String(tag))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
 const a=Array.from({length:size},(_,i)=>i);
 for(let i=a.length-1;i>0;i--){h=(Math.imul(h,1664525)+1013904223)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]];}
 return a;
}
function sc35Five(name,options,selected=''){
 return '<fieldset class="sc35-five"><legend>Wybierz najlepiej uzasadniony wniosek</legend>'+
 sc35Order(name,options.length).map((i,j)=>'<label class="sc35-option"><input type="radio" name="'+esc(name)+'" value="'+i+'" '+(selected===String(i)?'checked':'')+'><span><b>'+String.fromCharCode(65+j)+'.</b> '+esc(options[i])+'</span></label>').join('')+'</fieldset>';
}
const SC35_SUBTLE_CORRECT={"bay_photo":"Zdjęcie pokazuje zabrudzenia osłony po wejściu ratowników. Trzeba odróżnić utrwalony stan od przypuszczeń o wcześniejszych zdarzeniach.","bay_body":"Karta dokumentuje rozkład obrażeń i zastaną pozycję osoby. Przyczynę urazów należy ustalać z odrębnych badań medycznych.","bay_protocol":"Protokół rejestruje wejście ratowników przed zabezpieczeniem śladów. Ta kolejność jest ważna przy porównaniu zdjęć.","bay_sensor":"Czujnik rejestruje bodziec mechaniczny odrębny od diagnostyki wagonu. Nie identyfikuje osoby ani chwili zgonu.","bay_objects":"Indeks zdjęć wiąże obiekt z opakowaniem. Stan widoczny po interwencji trzeba porównać z protokołem zabezpieczenia.","bay_compare":"Czas impulsu można zestawić z przedziałem medycznym. Sama zbieżność nie wskazuje wspólnej przyczyny obu zdarzeń.","wrk_order":"Karta potwierdza zlecenie dla TW-217, ale nie wykonanie czynności. Wyniku pomiaru trzeba szukać w zapisach zamknięcia.","wrk_gaps":"Pusta rubryka oznacza brak zarejestrowanej wartości, nie wynik zerowy. Potrzebna jest kontrola historii formularza.","wrk_serial":"Kartę magazynową trzeba porównać z fizycznym numerem części i dokumentem odbiorowym, zanim ustali się zamontowany wariant.","wrk_device":"Dokumentacja wskazuje różnice wersji urządzenia. Najpierw należy ustalić wersję zamontowaną, a potem badać jej funkcje.","disp_order":"Wpis potwierdza zmianę dyspozycji w systemie. Dalsza obecność operatora w konkretnym miejscu wymaga innych źródeł.","disp_entry":"Księga dokumentuje operacje identyfikatora i czas odczytu. Osobę używającą karty trzeba ustalić niezależnie.","disp_radio":"Archiwum potwierdza przerwę w zapisie. Nie pozwala samo odtworzyć treści niezachowanej rozmowy ani jej adresata.","aud_accept":"Autentyczność protokołu nie dowodzi prawdziwości ocen technicznych. Konieczna jest kontrola oznaczeń i wersji dokumentów.","aud_versions":"Historia redakcji ustala czas dostępności rozbieżności. Nie dowodzi przeczytania zapisu ani obecności konkretnej osoby.","aud_stream":"Log pokazuje aktywną sesję prezentacji. Ciągłość połączenia nie jest jednak zapisem fizycznej obecności prowadzącego.","aud_telemetry":"Brak wpisów z klawiatury nie ustala wyjścia z pokoju. Dla oceny alibi potrzeba niezależnej chronologii ruchu.","aud_photo":"Fotografia dokumentuje numer podzespołu. Porównanie z ewidencją i odbiorem jest potrzebne do oceny jego pochodzenia.","off_bhp":"Lokalny szkic potwierdza sporządzenie projektu zgłoszenia. Doręczenie wymaga sprawdzenia odrębnej bramki wysyłkowej.","off_outbox":"Dziennik przyjęć można porównać ze szkicem BHP. Brak potwierdzenia nie rozpoznaje osoby ani przyczyny niewysłania.","off_payroll":"Dziennik potwierdza korektę rozliczenia dyżuru. Nie jest zapisem faktycznego położenia osoby w czasie zdarzenia.","pass_card":"Ewidencja dokumentuje formalny przydział identyfikatora. Nie ustala, kto później osobiście przyłożył go do czytnika.","pass_cart":"Rejestr przekazania wskazuje zasób i odbiorcę, ale nie wyjaśnia jego dalszego użycia ani użytkownika przy drzwiach.","pass_reader":"Czytnik rejestruje numer użytej karty. Nie wykonuje obserwacji twarzy, więc użytkownika trzeba ustalić innym sposobem.","pass_cctv":"Przed zestawieniem monitoringu z czytnikiem trzeba skorygować różnice zegarów i dopiero ustalić kolejność zdarzeń.","lab_catalog":"Wykaz wiąże próbki z miejscem i plombami. Czas pobrania trzeba zestawić z informacją o wejściu ratowników.","lab_compare":"Podobieństwo klasy materiału wspiera analizę kontaktu. Nie identyfikuje jednak konkretnej osoby ani przedmiotu.","lab_s3":"Smar S-3 może mieć kilka źródeł warsztatowych. Porównanie z kontrolami pomaga ocenić podobieństwo, nie osobę.","lab_w7":"Wspólne cechy włókien W-7 wskazują klasę materiału. Nie identyfikują jednej sztuki odzieży ani jej użytkownika.","lab_med":"Dokumentacja medyczna określa przedział czasu zgonu. Impuls techniczny nie redukuje go sam do jednej minuty."};
const SC35_SUBTLE_ANALYSES={"bay_photo":["Zdjęcie ustala stan powierzchni sprzed działań ratowniczych; protokół potrzebny jest wyłącznie do opisu późniejszego zabezpieczenia.","Widoczny ślad na osłonie pozwala wskazać miejsce urazu, ale jego pochodzenie należy dopiero porównać z dokumentacją medyczną.","Numer fotografii i widoczna skala pozwalają określić kolejność powstawania zabrudzeń, o ile potwierdza je karta czynności.","Układ plam na osłonie jest podstawą do ustalenia kierunku przemieszczenia osoby, a protokół służy jedynie kontroli plomby."],"bay_body":["Zgodność położenia obrażeń z fotografią osłony pozwala odtworzyć mechanizm upadku; do rozstrzygnięcia pozostaje kolejność czynności ratowników.","Karta pierwszych oględzin ma rangę opinii mechanizmu urazów, pod warunkiem że wskazano w niej wszystkie widoczne zmiany.","Rozkład obrażeń jest wystarczający do porównania dwóch typów kontaktu; dokumentacja medyczna ma znaczenie jedynie dla czasu zgonu.","Pozycja zastana wraz z obrażeniami wyznacza punkt pierwszego kontaktu, natomiast samą przyczynę można analizować później."],"bay_protocol":["Zgodność plomb obejmuje także okres działań ratowników poprzedzający formalne zabezpieczenie.","Pierwszy wpis protokołu należy traktować jako początek interwencji; wcześniejszego wejścia ratowników nie trzeba uwzględniać w rekonstrukcji.","Wystarczy ciągłość dokumentowania opakowań, aby porównywać położenie przedmiotów z chwilą ich zabezpieczenia jako pierwotne.","Protokół pozwala oddzielić czynności ratowników od utrwalania śladów, ale nie wymaga osobnego sprawdzenia kolejności tych działań."],"bay_sensor":["Impuls czujnika dokumentuje ruch infrastruktury, dlatego jego czas należy przypisać chwili przemieszczenia pojazdu z rejestru TCMS.","Zbieżność sygnału z przedziałem medycznym pozwala zawęzić czas zgonu do pojedynczego wskazania czujnika.","Zdarzenie techniczne należy powiązać z kartą dyspozytora, aby ustalić fizyczne położenie osoby przy stanowisku.","Czujnik stanowi niezależny pomiar mechaniczny, ale bez ustalenia użytkownika stanowiska zapis nie ma wartości chronologicznej."],"bay_objects":["Zgodna numeracja pozwala odtworzyć kolejność kontaktu z każdym z zabezpieczonych przedmiotów.","Fotografie i opakowania potwierdzają ciągłość przekazania, dlatego można odtworzyć wcześniejszą kolejność kontaktu z każdym przedmiotem.","Spójna numeracja pozwala przypisać przedmiot do konkretnego uczestnika zdarzenia, choć mechanizm obrażeń trzeba zbadać osobno.","Przy porównaniu zdjęć należy pominąć stan zastany po interwencji i odczytywać je jako stan bezpośrednio po zdarzeniu."],"bay_compare":["Zbieżność impulsu czujnika z ramami medycznymi określa chwilę głównego urazu; odrębnie trzeba ustalić jego mechanizm.","Dwa różne źródła o zbliżonym czasie wystarczają do potwierdzenia jednego zdarzenia, choć nie identyfikują uczestników.","Dane czujnika mogą skorygować medyczny przedział zgonu do jednego znacznika, jeżeli mieszczą się w pierwotnym zakresie.","Zgodność zegarów potwierdza wspólny mechanizm impulsu i obrażeń; jej znaczenie osobowe pozostaje nieustalone."],"wrk_order":["Zapis zlecenia potwierdza rozpoczęcie pomiaru, a formularz zamknięcia jest potrzebny wyłącznie do jego wartości końcowej.","Pierwotna karta pracy pozwala przyjąć wykonanie zadania, jeżeli w rejestrze kolejki nie widać adnotacji o odmowie.","Wpis zadania w kolejce dokumentuje wynik przeglądu; konieczne jest jedynie ustalenie osoby odbierającej pojazd.","Karta zlecenia pozwala odtworzyć stan wagonu w chwili przydziału, nawet jeśli osobne rubryki pomiarowe pozostają puste."],"wrk_gaps":["Brak liczby w formularzu potwierdza wykonanie kontroli bez stwierdzonych odchyleń.","Puste pola nie wyznaczają wyniku pomiaru, ale potwierdzają, że kontrola zakończyła się bez uwag zgłoszonych przez pracownika.","Historia zmian formularza wskazuje brak danych, z czego można wyprowadzić datę celowego usunięcia wartości pomiarowych.","Puste rubryki wymagają uzupełnienia, lecz zlecenie serwisowe pozwala już uznać samą kontrolę techniczną za wykonaną."],"wrk_serial":["Ewidencja magazynu i protokół odbioru wystarczają do identyfikacji zamontowanego wariantu; tabliczka fizyczna jest kontrolą pomocniczą.","Numer wydania części można przyjąć za numer części znajdującej się w wagonie, a rozbieżności protokołu wyjaśnić osobno.","Odczyt oznaczenia na fizycznym podzespole wystarcza do ustalenia, kto zatwierdził montaż; ewidencja dotyczy jedynie daty dostawy.","Karta magazynowa potwierdza ciągłość obiegu podzespołu i zastępuje porównanie fotografii oznaczenia z dokumentem odbioru."],"wrk_device":["Porównanie wersji urządzenia wyjaśnia, czy wariant mógł działać inaczej; to wystarcza do ustalenia mechanizmu obrażeń.","Rozbieżność między wariantami oznacza użycie wersji niezatwierdzonej, jeśli historia magazynowa pokazuje więcej niż jeden numer.","Dokumentacja wariantów wskazuje możliwe różnice funkcji, lecz sam protokół odbioru rozstrzyga, który wariant był faktycznie zamontowany.","Wykaz zmian konstrukcyjnych pozwala określić odpowiedzialnego za użycie wariantu niezależnie od tego, co było w wagonie."],"disp_order":["Wpis dyspozycji potwierdza obecność operatora przy konsoli aż do końca jego zmiany.","Polecenie systemowe może wskazać moment decyzji i trasę pojazdu; obecność dyspozytora przy niszy wynika z tego samego zapisu.","Numer operatora przypisany do rewizji potwierdza, kto osobiście zatwierdził polecenie; dalsze ustalenia dotyczą tylko wagonu.","Zmianę dyspozycji należy połączyć z godziną alarmu, ponieważ brak rejestru wyjścia dyspozytora oznacza ciągłą obecność przy konsoli."],"disp_entry":["Odbicie identyfikatora potwierdza przejście jego formalnego posiadacza.","Rejestr pozwala wyznaczyć przedział ciągłej obecności między dwoma odbiciami, choć nie wskazuje czynności wykonywanych w środku.","Zbieżne wpisy dwóch czytników wystarczają do rozpoznania posiadacza karty i kierunku jego ruchu bez obrazu z kamer.","Operacje karty można traktować jako osobistą obecność użytkownika, jeśli system nie odnotował jednoczesnego użycia identyfikatora."],"disp_radio":["Przerwa w nagraniu wskazuje na brak transmisji w tym czasie; treść sąsiednich komunikatów pozostaje osobnym zagadnieniem.","Metadane luk pozwalają odtworzyć rodzaj niewpisanego polecenia, jeżeli poprzednie połączenia dotyczą tego samego wagonu.","Brak nagrania nie oznacza braku rozmowy, ale pozwala powiązać przerwę z rewizją dyspozycji jako jedno potwierdzone zdarzenie.","Luka w zapisie świadczy o ingerencji w archiwum; ustalenia wymaga już tylko osoba, która miała do niego dostęp."],"aud_accept":["Autentycznie podpisany protokół jest wiarygodnym potwierdzeniem wartości pomiarów, choć późniejsze zmiany trzeba śledzić osobno.","Zgodny numer dokumentu pozwala uznać ocenę techniczną za prawdziwą, o ile wersja widoczna w archiwum jest pierwotna.","Protokół dowodzi złożenia oświadczeń, a historia rewizji określa, które z ocen były poprawne z punktu widzenia parametrów urządzenia.","Dokument odbioru potwierdza dopuszczenie części, więc różnice fizycznego oznaczenia można rozpatrywać jako osobny wątek magazynowy."],"aud_versions":["Historia wersji wskazuje czas wprowadzenia poprawek, a tym samym ustala obecność autora każdej zmiany przy stacji audytowej.","Wykaz redakcji ujawnia kolejność zmian; najstarszą wersję należy traktować jako ostateczne potwierdzenie stanu części.","Daty adnotacji pozwalają porównać wiedzę o rozbieżności z dyżurami, co wystarcza do przypisania jej konkretnemu świadkowi.","Historia zmian dowodzi dostępności dokumentu przed nocą zdarzenia, a więc także tego, że wszystkie osoby z dostępem przeczytały adnotacje."],"aud_stream":["Aktywna transmisja potwierdza stałą obecność gospodarza połączenia przed ekranem.","Ciągłość transmisji potwierdza pracę komputera, co można traktować jako ciągłą pracę operatora przy konsoli z wyłączoną kamerą.","Rejestr wideokonferencji jest samodzielnym źródłem alibi; aktywność klawiatury ma znaczenie tylko dla jakości obrazu.","Jeżeli brak rozłączenia, można wykluczyć wyjście na czas przejścia do hali, choć identyfikator połączenia nie podaje lokalizacji."],"aud_telemetry":["Brak wpisów klawiatury pozwala wyznaczyć moment opuszczenia biura.","Otwarta prezentacja i brak aktywności klawiatury razem dokumentują automatyczne działanie stacji, a zatem brak obecności człowieka.","Log aktywności określa moment ostatniej interakcji; na tej podstawie można wyznaczyć początek przemieszczania się z biura.","Brak wejść z klawiatury należy zestawić z rejestrem drzwi, ale gdy zegary są zbieżne, jednoznacznie wynika z tego trasa operatora."],"aud_photo":["Czytelny numer na zdjęciu wystarcza do ustalenia wariantu zamontowanego w wagonie.","Zgodność zdjęcia z wykazem wariantów wyznacza etap instalacji urządzenia, choć osobę montującą trzeba sprawdzić osobno.","Numer widoczny na obrazie potwierdza fizyczny montaż części w chwili odbioru; późniejszy obieg materiałów wymaga doprecyzowania.","Zdjęcie z archiwum technicznego można przyjąć za dowód tożsamości serwisanta, jeśli w metadanych znajduje się jego konto."],"off_bhp":["Treść szkicu pozwala ustalić datę zgłoszenia na zewnątrz, a osobna bramka jest potrzebna do sprawdzenia, czy organ odpowiedział.","Utworzenie projektu zgłoszenia oznacza podjęcie skutecznej próby doręczenia, o ile nie ma komunikatu o błędzie.","Metadane zapisu szkicu dokumentują kontakt z odbiorcą zewnętrznym, lecz do potwierdzenia jego treści trzeba sięgnąć do bramki.","Szkic ujawnia, że autor chciał zgłosić zagrożenie; jego wersja robocza wystarcza też do ustalenia, że odbiorca zapoznał się z treścią."],"off_outbox":["Brak potwierdzenia w bramce przesądza o niepodjęciu próby wysłania; rolą szkicu jest jedynie ustalenie treści.","Porównanie szkicu z historią przyjęć określa, czy zgłoszenie powstało, a sama nieobecność wpisu wskazuje osobę odpowiedzialną za blokadę.","Niezależny system doręczeń pozwala wnioskować o rejestracji zgłoszenia, lecz nie trzeba już analizować statusu jego przyjęcia.","Brak zdarzenia wysyłki może oznaczać problem techniczny, ale w połączeniu z konfliktem BHP potwierdza celowe ukrycie pisma."],"off_payroll":["Autoryzacja korekty rozliczenia ustala, kto znajdował się na tej zmianie.","Zmiana dyżuru w systemie wpływa na przebieg nocy, dlatego można odtworzyć trasę operatora na podstawie pola księgowego.","Autoryzacja poprawki ustala podmiot odpowiedzialny za rozliczenie, a to wystarcza do przypisania mu obecności przy stanowisku.","Dziennik rozliczeń może potwierdzić motyw organizacyjny; gdy korekta dotyczy tej samej zmiany, stanowi również osobowy ślad na miejscu."],"pass_card":["Przydział karty wskazuje uprawnionego użytkownika, co można traktować jako obecność tej osoby przy kolejnych zarejestrowanych przejściach.","Rejestr wydania i brak zgłoszenia utraty pozwalają przyjąć, że formalny posiadacz osobiście używał karty przez noc.","Wpis w ewidencji kart ustala osobę odpowiedzialną za każdy odczyt, choć ewentualne pożyczenie należy sprawdzić oddzielnie.","Karta tymczasowa potwierdza dostęp do strefy; dopiero godzina odczytu identyfikuje właściciela, który z niej skorzystał."],"pass_cart":["Numer przekazanego przedmiotu pozwala odtworzyć, kto później go używał.","Lista rzeczy na wózku określa możliwe zasoby, więc ich obecność w hali wskazuje, kto przeszedł przez południowe drzwi.","Rejestr przeniesienia i czytnik drzwi można połączyć czasowo, co wystarcza do ustalenia celu przeniesienia przedmiotu.","Zapis zasobów identyfikuje przekazany obiekt, dlatego pozwala powiązać każde późniejsze zdjęcie tego typu wyposażenia z tą trasą."],"pass_reader":["Numer karty wraz z jej przydziałem ustala użytkownika, a skorygowany czas CCTV służy wyłącznie do potwierdzenia kierunku przejścia.","Czytnik dokumentuje dostęp osoby uprawnionej, pod warunkiem że nie zarejestrowano zgłoszenia o zagubieniu identyfikatora.","Wpis bramki pozwala odróżnić wejście od wyjścia i przypisać każde zdarzenie do formalnego posiadacza karty.","Dane identyfikatora z czytnika są wystarczające do wskazania człowieka, jeżeli karta była ważna w danym przedziale."],"pass_cctv":["Kolejność z monitoringu można odczytać bez korekty czasu, jeżeli wszystkie urządzenia należą do tej samej strefy.","Zbieżność zegara czytnika i kamery potwierdza osobę korzystającą z karty, nawet gdy obraz twarzy nie jest czytelny.","Najpierw trzeba ustalić odchylenie czasu, ale do chronologii wystarczy korekta kamery o najwyższej rozdzielczości.","Korekta zegarów rozstrzyga, które zdarzenie było pierwsze, oraz określa czy identyfikator należał do osoby na obrazie."],"lab_catalog":["Zgodne plomby wykluczają wpływ interwencji na stan próbek pobranych z miejsca.","Wykaz pobrania potwierdza źródło próbki, a późniejsze dane o interwencji służą jedynie do określenia kolejności fotografowania.","Dopasowane numery opakowań dowodzą braku kontaktu wtórnego; kontrola materiałów ratowników nie jest wówczas potrzebna.","Katalog próbek pozwala wiarygodnie zestawić numery, ale sama data pobrania wskazuje również chwilę powstania śladu."],"lab_compare":["Zgodność profili materiału pozwala określić wspólne źródło przedmiotowe, a ustalenie osoby wymaga osobno sprawdzenia trasy.","Próbka kontrolna wyposażenia potwierdza tożsamość kontaktu, gdy sześć cech profilu jest podobnych w granicach błędu.","Wspólne cechy grupowe ograniczają krąg możliwych materiałów, więc bez dodatkowych źródeł można przypisać ślad tej samej sztuce wyposażenia.","Materiał kontrolny pozwala wykluczyć inne źródła transferu, jeśli był pobrany na tym samym stanowisku co ślad."],"lab_s3":["Zgodność S-3 z próbką kontrolną wskazuje jedno konkretne źródło warsztatowe.","Porównanie próbki S-3 z materiałem kontrolnym określa czas kontaktu, jeżeli skład chemiczny jest wystarczająco podobny.","Smar w strefie pracy pozwala przyjąć pochodzenie z najbardziej prawdopodobnego stanowiska serwisowego bez wykluczania innych osób.","Ustalony typ smaru identyfikuje źródło warsztatowe, a ewentualny transfer wtórny wpływa tylko na ilość materiału."],"lab_w7":["Zgodność cech W-7 pozwala przypisać włókno pojedynczemu egzemplarzowi odzieży, choć użytkownika należy ustalić osobno.","Porównanie klas włókna pozwala potwierdzić miejsce pierwszego kontaktu, jeżeli oba profile zostały zabezpieczone poprawnie.","Materiał W-7 może wspierać hipotezę kontaktu, a sama zgodność klasy wskazuje też dokładny przedział czasowy jego wystąpienia.","Podobne włókna można uznać za pochodzące z tego samego elementu wyposażenia, jeśli ich kolor i średnica są zgodne."],"lab_med":["Mediczny zakres czasu zgonu należy zawęzić do chwili impulsu czujnika, o ile impuls mieści się we wskazanym przedziale.","Przedział medyczny pozwala wskazać początek zdarzenia; koniec określa odpowiednio skorygowany zegar monitoringu.","Ramy szacowane medycznie można potraktować jako przedział działania sprawcy, jeśli rejestr dostępu zawiera jedno zbieżne wejście.","Dokumentacja medyczna określa czas zgonu w przybliżeniu, ale jego środek jest najlepszą pojedynczą godziną do dalszej rekonstrukcji."]};