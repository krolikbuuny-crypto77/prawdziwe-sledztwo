
/* Prawdziwe Śledztwo 5.4 — kontradyktoryjny finał i kontrola ryzyka.
   Wynik fikcyjnego procesu zależy od zdobytych, zweryfikowanych akt. Nie powstają nowe dowody.
   Wariant argumentacji A/B i dwie dopuszczalne interpretacje — brak pojedynczej pary rozstrzygającej. */
const PS54_ISSUES=[
 {id:'accident',routes:[['MED-04','LAB-08'],['MED-10','LAB-05']],
  prompts:['Porównuję odrębne grupy obrażeń i opinię specjalistyczną; nie utożsamiam ich z identyfikacją napastnika.',
   'Sam czujnik tramwaju wyklucza możliwość upadku i przesądza o zabójstwie.',
   'Rekonstrukcja urazów może podważać wersję jednego upadku, lecz nadal wymaga niezależnego ustalenia sprawcy.',
   'Każdy uraz głowy jest dowodem ataku konkretnej osoby.',
   'Niewykrycie nagrania samego zdarzenia unieważnia wyniki badania obrażeń.'],correct:[0,2],
  limit:'Opinia o mechanizmie obrażeń nie rozpoznaje automatycznie osoby.',kind:'mechanizm'},
 {id:'contract',routes:[['EVID_ACCEPTANCE_RECORD','EVID_MESSAGE_THREAD_RECOVERED','TEC-15'],['TEC-09','EVID_SERIAL_PHOTO','EVID_MESSAGE_DEVICE_METADATA']],
  prompts:['Rozbieżność odbiorowa wskazuje konflikt interesów; związek z konkretnym czynem trzeba sprawdzać poza protokołem.',
   'Samo zatwierdzenie niezgodnej części przesądza o udziale w zabójstwie.',
   'Wystarczy wykazać, kto podpisał dokument, aby rozstrzygnąć chronologię śmierci.',
   'Łączę dokumentację i kontakt z Leną, ale oddzielam motyw od tożsamości oraz przebiegu przemocy.',
   'Każdy dokument w zajezdni jest fałszywy, skoro protokół zmieniano.'],correct:[0,3],
  limit:'Motyw ani dokument administracyjny nie są samodzielnym dowodem sprawstwa.',kind:'motyw'},
 {id:'message',routes:[['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','EVID_CCTV_SYNC'],['DIG-04','DIG-05','ADM-04']],
  prompts:['Służbowe konto bezwarunkowo identyfikuje fizycznego nadawcę.',
   'Zestawiam treść, źródło cyfrowe i niezależny przebieg przejść; nie przesądzam, kto korzystał z konta.',
   'Odtworzenie wiadomości dowodzi, że do spotkania faktycznie doszło.',
   'Usunięta wiadomość nie może być przedmiotem weryfikacji.',
   'Weryfikuję pochodzenie wiadomości i możliwość dotarcia na miejsce, pozostawiając autorstwo otwartą kwestią.'],correct:[1,4],
  limit:'Autorstwo wiadomości wymaga kontroli wykraczającej poza identyfikator urządzenia.',kind:'tożsamość'},
 {id:'card',routes:[['EVID_T17_DOOR_EVENT','EVID_RESOURCE_HANDOVER','VIS-09'],['ADM-12','ADM-07','EVID_CCTV_SYNC']],
  prompts:['Użycie karty jest równoznaczne z potwierdzeniem twarzy jej formalnego posiadacza.',
   'Porównuję przekazanie karty, zapis drzwi i obraz, ale nie zamieniam numeru uprawnienia w rozpoznanie osoby.',
   'Karta była przekazywana, więc odczyt trzeba bez dalszej analizy usunąć.',
   'Odczyt wskazuje zdarzenie dostępu; połączony z niezależną trasą może ograniczyć wersje, nie identyfikuje samodzielnie użytkownika.',
   'Ten, kto kartę wydał, musi być sprawcą wejścia.'],correct:[1,3],
  limit:'Uprawnienie do wejścia nie oznacza udowodnionej obecności konkretnej osoby.',kind:'dostęp'},
 {id:'remote',routes:[['EVID_CONFERENCE_SESSION','DIG-09','ADM-04'],['DIG-10','VIS-10','EVID_CCTV_SYNC']],
  prompts:['Aktywna wideokonferencja wyklucza jakiekolwiek opuszczenie pomieszczenia.',
   'Brak aktywności klawiatury jednoznacznie dowodzi wyjścia i udziału w śmierci Leny.',
   'Rozróżniam trwanie sesji od fizycznej obecności; konfrontuję jej logi z możliwą trasą.',
   'Zapis konta jest całkowicie niewiarygodny, więc należy go zignorować.',
   'Zestawiam synchronizację czasu i geometrię przejść, nie przypisując samej ciszy na komputerze konkretnej osobie.'],correct:[2,4],
  limit:'Sesja może trwać bez osoby przy terminalu; luka nie dowodzi jeszcze dokonanego przejścia.',kind:'alibi'},
 {id:'traces',routes:[['LAB-07','LAB-10','EVID_MESSAGE_THREAD_RECOVERED'],['LAB-09','LAB-08','ADM-04']],
  prompts:['Podobieństwo włókien i smaru identyfikuje człowieka bez żadnych dalszych źródeł.',
   'Ślady mają wartość porównawczą; niezależnie badam czas i kontakt, nie zastępując tym identyfikacji.',
   'Materiał, który mógł występować w wielu miejscach, nie może być dowodem w żadnej sprawie.',
   'Zestawiam opinię o zgodności klasowej z innymi zdarzeniami, dopuszczając wtórne przeniesienie śladu.',
   'Wspólny profil materiałowy stanowi unikalny odpowiednik DNA.'],correct:[1,3],
  limit:'Zbieżność klasowa śladów nie jest indywidualnym rozpoznaniem osoby.',kind:'ślady'}
];
const PS54_MAP=new Map(PS54_ISSUES.map(x=>[x.id,x]));
function ps54Fresh(){return {arguments:{},decisions:[],disclosure:'',hearings:0,reviewed:false,version:1};}
STATE.sim.process54=ps54Fresh();
const ps54Clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function ps54Entry(id){const s=STATE.sim.process54||(STATE.sim.process54=ps54Fresh());return s.arguments[id]||(s.arguments[id]={route:-1,answer:-1,method:'',passed:false,attempts:[],last:''});}
function ps54Good(id){
 if(window.PS_REASONING_ENGINE)return window.PS_REASONING_ENGINE.document(id,{requireVerified:true,adversarial:true}).ok;
 if(!byId[id]||!STATE.found.has(id))return false;
 if(SIM_DEGRADED[id]&&!simIsVerified(id))return false;
 if(['overclaim','ignored'].includes(STATE.sim.auditJudgments?.[id]?.status))return false;
 return simQuality(id)>.8;
}
function ps54Route(issue,index){const docs=issue.routes[index]||[];
 const independent=new Set(docs.map(id=>byId[id]?.family||id)).size>=2;
 const ready=!!docs.length&&independent&&docs.every(ps54Good);
 const strength=docs.length?Math.round(docs.reduce((sum,id)=>sum+simQuality(id)*100,0)/docs.length):0;
 return {docs,ready,independent,strength};
}
function ps54Result(issue,entry){const r=ps54Route(issue,entry.route);
 const answerOk=issue.correct.includes(entry.answer);
 const methodOk=['compare','limits'].includes(entry.method);
 const passed=!!entry.passed&&r.ready&&r.strength>80&&answerOk&&methodOk;
 return {passed,ready:r.ready,score:r.strength,route:entry.route,answerOk,methodOk};
}
const ps54OldEvaluation=simDefendEvaluation;
simDefendEvaluation=function(){const base=ps54OldEvaluation();const responses=FC_CHALLENGES.map(q=>{
 const issue=PS54_MAP.get(q.id);const ent=ps54Entry(q.id),result=ps54Result(issue,ent);
 return {id:q.id,title:q.title,nodes:SIM_OBJECTION_NODES[q.id]||[],method:ent.method,passed:result.passed,limited:ent.method==='limits',route:ent.route,score:result.score};
 });return {responses,passed:responses.filter(x=>x.passed).length,all:responses.every(x=>x.passed),weak:responses.filter(x=>!x.passed).map(x=>x.title)};
};
function ps54Decision(id){const issue=PS54_MAP.get(id);if(!issue)return;
 const ent=ps54Entry(id),route=Number(document.querySelector(`[data-ps54-route="${id}"]:checked`)?.value),rawAnswer=document.getElementById('ps54Answer_'+id)?.value||'',answer=rawAnswer===''?-1:Number(rawAnswer),method=document.getElementById('ps54Method_'+id)?.value||'';
 if(!Number.isInteger(route)||![0,1].includes(route))return ps54Feedback(id,'Najpierw wybierz zestaw niezależnych materiałów do sprawdzenia zarzutu.');
 if(!['compare','limits'].includes(method))return ps54Feedback(id,'Wybierz sposób pracy ze źródłami: porównanie niezależnych ustaleń albo przyjęcie ograniczeń dowodu.');
 if(!Number.isInteger(answer)||answer<0||answer>4)return ps54Feedback(id,'Wybierz interpretację. Oceń, czy opisuje zakres źródeł bez przypisywania im większej pewności, niż rzeczywiście mają.');
 const r=ps54Route(issue,route);
 if(!r.ready){ps54Feedback(id,explainDefenseRouteUnavailable(r)+' Bez kosztu błędu.');return;}
 const signature=[route,answer,method].join(':');if(ent.passed&&ent.route===route&&ent.answer===answer&&ent.method===method)return toast('Ten argument zapisano już wcześniej.');
 if(ent.attempts.includes(signature))return toast('Tę interpretację już rozpatrzono. Możesz przedstawić inne uzasadnienie.');
 if(STATE.sim.time<2)return toast('Brak czasu na kontrolę odpowiedzi.');
 const correct=issue.correct.includes(answer);
 const cost=correct?2:3;if(STATE.sim.time<cost)return toast('Brak czasu śledczego na tę czynność.');
 ent.attempts.push(signature);ent.attempts=ent.attempts.slice(-30);
 ent.route=route;ent.answer=answer;ent.method=method;ent.passed=correct;
 if(correct){window.PS617_SYNC?.enqueue?.({type:'defend_objection',mode:'ps54',objection:id,route,answer,method});simTime(2,0,'Udokumentowana odpowiedź obrony: '+issue.id);ent.last='Ustalono niezależne źródła i granice wnioskowania. '+issue.limit;}
 else{ent.last='Odpowiedź odrzucona: '+explainDefenseInterpretation(issue,answer)+' '+issue.limit;simError('Odpowiedź na zarzut wymaga korekty. Szczegóły znajdują się poniżej.',3,4);}
 STATE.sim.process54.decisions.push({id,route,answer,method,correct});STATE.sim.process54.decisions=STATE.sim.process54.decisions.slice(-80);
 STATE.sim.trial=null;simRenderHearing();
}
function ps54Feedback(id,message){const el=document.getElementById('ps54Feedback_'+id);if(el)el.textContent=message;else toast(message);}
function ps54IssueCard(issue,index){const q=FC_CHALLENGES.find(x=>x.id===issue.id),ent=ps54Entry(issue.id),result=ps54Result(issue,ent);
 const method=ent.method||'';
 return `<article class="ps54-issue ${result.passed?'passed':''}"><div class="ps54-issuehead"><b>${index+1}. ${esc(q?.title||issue.id)}</b><span>${result.passed?'Argument zabezpieczony':'Odpowiedź do kontroli'}</span></div><p class="ps54-claim">${esc(q?.claim||'')}</p><p class="small muted">Wybierz jedną z dwóch niezależnych metod weryfikacji. Do zaliczenia potrzebny jest wynik &gt;80% i uzasadnienie respektujące ograniczenia dowodu.</p>
 <div class="ps54-paths">${issue.routes.map((route,i)=>{const r=ps54Route(issue,i);return `<label class="ps54-path ${r.ready?'ready':''}"><input type="radio" name="ps54_${issue.id}" data-ps54-route="${issue.id}" value="${i}" ${i===(ent.route>=0?ent.route:0)?'checked':''}><span><b>Metoda ${i?'B':'A'} · ${r.strength}%</b>${route.map(d=>`<small>${ps54Good(d)?'✓':STATE.found.has(d)?'◇':'○'} ${STATE.found.has(d)?esc(docName(d)):'Niepozyskany materiał'}</small>`).join('')}</span></label>`;}).join('')}</div>
 <div class="ps54-fields"><label>Taktyka odpowiedzi<select id="ps54Method_${issue.id}"><option value="">— wybierz —</option><option value="compare" ${method==='compare'?'selected':''}>Porównaj niezależne ustalenia</option><option value="limits" ${method==='limits'?'selected':''}>Przyjmij ograniczenie i odpowiedz innym materiałem</option></select></label><label>Uzasadnienie spośród pięciu wersji<select id="ps54Answer_${issue.id}"><option value="">— oceń argument —</option>${issue.prompts.map((v,i)=>`<option value="${i}" ${ent.answer===i?'selected':''}>${esc(v)}</option>`).join('')}</select></label></div>
 <div class="ps54-actions"><button type="button" class="btn alt" data-ps54-check="${issue.id}">Utrwal odpowiedź</button><span class="small muted">Poprawna odpowiedź: 2 czasu · błędna: 3 czasu i utrata zaufania</span></div><div class="ps54-feedback" id="ps54Feedback_${issue.id}" aria-live="polite">${esc(ent.last||'Nawet mocny dowód nie powinien być oceniany poza granicami swojej wiarygodności.')}</div></article>`;
}
function ps54Review(){const a=simCaseAssessment(),d=simDefendEvaluation(),v=STATE.sim.psych52?.violations?.length||0;
 const risk=(a.auditCritical?.length||0)+(a.auditOverclaims?.length||0)+(a.story53?.over||0);
 const ready=a.complete&&a.rolesReady&&a.keyLinked&&a.coherence&&a.strength>80&&a.timelineIssues.length===0&&!a.badKey&&!a.contradictory&&d.all&&STATE.sim.trust>=35&&v<=2&&!risk;
 return {assessment:a,defense:d,violations:v,risk,ready};
}
function ps54Render(){const area=document.getElementById('simHearingDetail');if(!area)return;
 const a=ps54Review(),old=area.querySelectorAll('.sim-objection');old.forEach(el=>el.remove());
 area.querySelector('#ps54Hearing')?.remove();area.querySelector('#ps54CaseNote')?.remove();
 const intro=document.createElement('section');intro.id='ps54Hearing';intro.className='ps54-hearing';
 intro.innerHTML=`<div class="eyebrow">FAZA OBRONY</div><h3>Sześć zarzutów · dwanaście metod weryfikacji</h3><div class="ps54-score"><b>${a.defense.passed}/6</b><span>odpartych zarzutów</span><b>${STATE.sim.trust}%</b><span>zaufania procesowego</span></div><p class="small muted">Obrona sprawdza dokładnie te materiały, które znajdują się w aktach. Żadna poprawna odpowiedź nie zastępuje brakujących dowodów sprawstwa.</p>${PS54_ISSUES.map(ps54IssueCard).join('')}
 <div class="ps54-procedure"><h4>Obowiązek ujawnienia wątpliwości</h4><p class="small muted">Rzetelne postępowanie wymaga pokazania materiałów odciążających i nierozstrzygniętych luk. Ukrywanie ich może wywołać konsekwencje procesowe w fikcyjnej rozprawie.</p><label>Postępowanie z materiałami odciążającymi<select id="ps54Disclosure"><option value="">— wybierz decyzję —</option><option value="disclose" ${STATE.sim.process54.disclosure==='disclose'?'selected':''}>Ujawnij obronie sprzeczności i ograniczenia materiałów</option><option value="defer" ${STATE.sim.process54.disclosure==='defer'?'selected':''}>Zwróć sprawę do uzupełnienia, zanim zapadnie rozstrzygnięcie</option><option value="suppress" ${STATE.sim.process54.disclosure==='suppress'?'selected':''}>Zataję wątpliwości, aby wzmocnić oskarżenie (poważne naruszenie)</option></select></label></div></section>`;
 const checkbox=area.querySelector('#simIgnoreTimeline')?.closest('label');if(checkbox)checkbox.before(intro);else area.appendChild(intro);
 const note=document.createElement('div');note.id='ps54CaseNote';note.className='ps54-notes';
 const problems=[];
 if(a.violations)problems.push(a.violations+' uchybień przesłuchań');
 if(a.risk)problems.push(a.risk+' zagrożeń wiarygodności źródeł/wątków');
 if(a.assessment.timelineIssues.length)problems.push(a.assessment.timelineIssues.length+' sprzeczności chronologii');
 if(!a.assessment.rolesReady)problems.push('niepełne role dowodowe');
 note.innerHTML=`<b>Ocena ryzyka przed rozstrzygnięciem</b><p>${problems.length?esc(problems.join(' · ')):'Nie stwierdzono dodatkowych uchybień proceduralnych; kontrola wszystkich zarzutów nadal obowiązuje.'}</p><p class="small muted">Wskaźnik siły akt jest narzędziem gry, a nie rzeczywistym prawdopodobieństwem winy.</p>`;
 intro.after(note);
 const result=area.querySelector('.sim-trial-result');if(result){result.querySelector('.ps54-verdict-extra')?.remove();const section=document.createElement('div');section.className='ps54-verdict-extra';section.innerHTML=`<h4>Uzasadnienie procesowe</h4><p>${esc(STATE.sim.trial?.procedural||'Wariant fabularny rozstrzygnięcia zależy od pełnej oceny materiału.')}</p><p>Spory obrony: ${a.defense.passed}/6. Zaufanie: ${STATE.sim.trust}%. Wątki nieweryfikowane nie zostają automatycznie uznane za prawdziwe.</p><button type="button" class="btn alt" data-ps54-export>Eksportuj protokół sprawy (.txt)</button>`;result.appendChild(section);}
}
const ps54OldHearing=simRenderHearing;
simRenderHearing=function(){ps54OldHearing();ps54Render();};
function ps54Trial(){if(!STATE.final13.submitted)return toast('Najpierw złóż projekt aktu do oceny.');
 const choice=STATE.sim.process54.disclosure;
 if(!choice)return toast('Wybierz sposób postępowania z materiałami odciążającymi.');
 if(choice==='defer'){
  if(STATE.sim.time<3)return toast('Brak czasu na przekazanie sprawy do uzupełnienia.');
  simTime(3,0,'Uzupełnienie akt przed decyzją procesową');STATE.sim.process54.hearings++;
  STATE.sim.trial={kind:'returned',title:'Zwrócenie akt do uzupełnienia',text:'Wykryte luki wymagają dalszych czynności. Fikcyjny organ procesowy nie rozstrzyga teraz winy. Możesz powrócić do akt, zweryfikować dowody i ponownie złożyć projekt.',strength:simCaseAssessment().strength,defense:'Nie oceniono jeszcze merytorycznie sześciu sporów',reasons:[],procedural:'Decyzja ostrożna: brak stwierdzenia winy i brak skazania przed uzupełnieniem materiału.'};
  simRenderHearing();return;
 }
 const pre=ps54Review(),s=STATE.final13;
 const wrong=s.culprit&&window.PS617_SYNC?.actorStatusFor?.(s.culprit,s)==='rejected';
 const badAlibi=['card_proves','remote_proves','console_proves','no_need'].includes(s.alibi);
 const deliberate=choice==='suppress',ignored=STATE.sim.ignoredTimeline;
 const miscarriage=!!wrong&&deliberate&&ignored&&(pre.assessment.timelineIssues.length>0||badAlibi||!pre.assessment.cs.identity.ready);
 if(STATE.sim.time>=2)simTime(2,0,'Końcowa kontrola kontradyktoryjna');
 if(deliberate){simError('Zatajenie okoliczności istotnych dla obrony w fikcyjnym postępowaniu.',6,15);}
 else if(pre.defense.responses.some(r=>!r.passed)){simTime(1,0,'Przeanalizowano nieodparte zastrzeżenia obrony');}
 const post=ps54Review();let result;
 if(miscarriage){result={kind:'miscarriage',title:'Błędne skazanie — zignorowano dowody odciążające',text:'Fikcyjna gałąź katastrofalna: śledczy oskarżył niewłaściwą osobę, świadomie zataił słabe ogniwa i pominął sprzeczności. W grze zapadło błędne skazanie, a dokumentacja ujawnia naruszenia wymagające ponownego rozpoznania.',defense:'Obrona pozbawiona ujawnionych materiałów',procedural:'To negatywne zakończenie obrazuje konsekwencje świadomego zatajenia i wadliwego wnioskowania, a nie dopuszczalną praktykę procesową.'};}
 else if(post.ready&&!deliberate){result={kind:'solid',title:'Mocny akt — zarzuty obrony odparte',text:'Niezależne źródła podtrzymują rekonstrukcję, sześć kontrargumentów sprawdzono bez skrótów, a wątpliwości ujawniono. Fikcyjne postępowanie kończy się utrzymaniem zarzutu.',defense:'6/6 rozstrzygniętych sporów na dwóch równorzędnych metodach dowodowych',procedural:'Zakres zarzutu nie przekracza wyników ekspertyz ani dokumentów. Kontrola wiarygodności jest oddzielona od samej narracji świadków.'};}
 else if(deliberate||post.violations>=3||post.risk>=3){result={kind:'excluded',title:'Uchylenie materiału — istotne uchybienia proceduralne',text:'Obrona skutecznie podważa dopuszczalność lub rzetelność istotnych części materiału. W fikcyjnym postępowaniu zarzut nie może być utrzymany w przedstawionej postaci.',defense:post.defense.passed+'/6 odpowiedzi pozostaje obronionych',procedural:'Uchybienia w sposobie prowadzenia przesłuchań, ujawniania okoliczności lub kontroli dowodów ograniczyły możliwość oparcia na nich aktu.'};}
 else if(wrong||!post.assessment.coherence||post.assessment.strength<55){result={kind:'acquittal',title:'Uniewinnienie — brak wystarczających podstaw',text:'W grze obrona wykazuje, że z akt nie wynika pewny i spójny związek oskarżonej osoby z czynem. Sąd nie może zastępować brakującego ogniwa poszlaką o słabym znaczeniu.',defense:post.defense.passed+'/6 skutecznie udokumentowanych odpowiedzi',procedural:'Luki w identyfikacji, związku przyczynowym lub chronologii nie mogą być domknięte samą podejrzliwością.'};}
 else{result={kind:'weak',title:'Akt nie utrzymany — materiał niewystarczający',text:'Istnieją istotne poszlaki, lecz nie wykazano spójności wszystkich ogniw albo nie obroniono wymaganych zarzutów. Fikcyjne postępowanie kończy się bez skazania.',defense:post.defense.passed+'/6 skutecznie udokumentowanych odpowiedzi',procedural:'Zgromadzone materiały mogą uzasadniać dalsze czynności, ale nie końcowy wniosek o sprawstwie.'};}
 result.strength=post.assessment.strength;result.reasons=[...post.assessment.weakReasons,...post.defense.weak.map(x=>'Nieodparty zarzut: '+x)];
 if(deliberate&&!miscarriage)result.reasons.push('Świadome nieujawnienie wątpliwości obronie.');
 STATE.sim.process54.hearings++;STATE.sim.trial=result;simRenderHearing();document.getElementById('simHearing')?.scrollIntoView({block:'start',behavior:'smooth'});
}
simTrial=ps54Trial;
function ps54Export(){const a=ps54Review(),trial=STATE.sim.trial,p=STATE.sim.process54;
 const lines=['PRAWDZIWE ŚLEDZTWO — OSTATNI KURS','PROTOKÓŁ FIKCYJNEJ KONTROLI PROCESOWEJ / WERSJA 5.4','',
 'Wskazana osoba: '+(CONTENT.characters.find(c=>c.id===STATE.final13.culprit)?.name||'nie wskazano'),
 'Siła materiału: '+a.assessment.strength+'%', 'Zaufanie prokuratorskie: '+STATE.sim.trust+'%',
 'Sprzeczności chronologii: '+a.assessment.timelineIssues.length,'Naruszenia przesłuchań: '+a.violations,
 'Postawa wobec materiałów odciążających: '+(p.disclosure||'nieokreślona'),
 'Rozstrzygnięcie fabularne: '+(trial?.title||'jeszcze nie zapadło'),''];
 for(const issue of PS54_ISSUES){const e=ps54Entry(issue.id),r=ps54Result(issue,e);lines.push(FC_CHALLENGES.find(q=>q.id===issue.id)?.title||issue.id);lines.push('Status: '+(r.passed?'odparty':'nieodparty'));
  if([0,1].includes(e.route))lines.push('Metoda '+(e.route?'B':'A')+': '+issue.routes[e.route].map(id=>docName(id)+' ['+id+']').join('; '));
  if(e.answer>=0)lines.push('Uzasadnienie: '+issue.prompts[e.answer]);lines.push('');}
 lines.push('Uwaga: wynik i procedura należą do fikcyjnej symulacji, nie są opinią prawną.');
 const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Ostatni_kurs_protokol_5_4.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
document.getElementById('simHearing')?.addEventListener('click',e=>{const el=e.target.closest('[data-ps54-check],[data-ps54-export]');if(!el)return;
 if(el.dataset.ps54Check)ps54Decision(el.dataset.ps54Check);else if(el.hasAttribute('data-ps54-export'))ps54Export();});
document.getElementById('simHearing')?.addEventListener('change',e=>{if(e.target.id==='ps54Disclosure'){STATE.sim.process54.disclosure=e.target.value;STATE.sim.trial=null;}});

/* SaveManager: buildSave hook. */
registerSaveHook({name:"14-adversarial-trial-save1", build(__save){const d=__save;d.investigationSim.process54=JSON.parse(JSON.stringify(STATE.sim.process54));return d;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"14-adversarial-trial-load1", apply(d){undefined;const raw=d?.investigationSim?.process54;STATE.sim.process54=ps54Fresh();
 if(raw&&typeof raw==='object'){
  for(const issue of PS54_ISSUES){const data=raw.arguments?.[issue.id];if(!data)continue;const target=ps54Entry(issue.id);
   target.route=[0,1].includes(data.route)?data.route:-1;
   target.answer=Number.isInteger(data.answer)&&data.answer>=0&&data.answer<5?data.answer:-1;
   target.method=['compare','limits'].includes(data.method)?data.method:'';
   target.passed=!!data.passed&&issue.correct.includes(target.answer)&&ps54Route(issue,target.route).ready;
   target.attempts=(Array.isArray(data.attempts)?data.attempts:[]).filter(x=>typeof x==='string'&&/^([01]):[0-4]:(compare|limits)$/.test(x)).slice(-30);
   target.last=String(data.last||'').slice(0,220);
  }
  STATE.sim.process54.disclosure=['disclose','defer','suppress'].includes(raw.disclosure)?raw.disclosure:'';
  STATE.sim.process54.hearings=ps54Clamp(Number(raw.hearings)||0,0,500);
  STATE.sim.process54.decisions=(Array.isArray(raw.decisions)?raw.decisions:[]).filter(x=>x&&PS54_MAP.has(x.id)).slice(-80);
 }
 simRenderHearing();}});
const ps54PrevReset=simReset;
simReset=function(){ps54PrevReset();STATE.sim.process54=ps54Fresh();simRenderHearing();};
const ps54Style=document.createElement('style');ps54Style.textContent=`
.ps54-hearing{padding:16px;border:1px solid #526573;border-radius:10px;background:#101c24;margin:16px 0}
.ps54-hearing h3{font-size:19px;margin:8px 0 10px}.ps54-score{display:grid;grid-template-columns:auto 1fr auto 1fr;align-items:center;gap:7px;padding:13px;background:#1b2830;border-radius:8px;margin-bottom:13px}.ps54-score b{font-size:24px;color:#e9be81}.ps54-score span{font-size:11px;color:#b7c5ca}
.ps54-issue{padding:14px;border:1px solid #394f59;background:#16242c;border-radius:9px;margin:13px 0;min-width:0}.ps54-issue.passed{border-color:#587967}
.ps54-issuehead{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:flex-start}.ps54-issuehead b{font-size:14px}.ps54-issuehead span{font-size:10px;color:#dfbb8a;border:1px solid #776449;padding:3px 7px;border-radius:15px}.ps54-issue.passed .ps54-issuehead span{color:#a5d5b6;border-color:#58846a}
.ps54-claim{font-size:12px;padding:12px;margin:12px 0!important;border-left:2px solid #c59b68;background:#251f1b;color:#e0cdbc}
.ps54-paths{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:11px 0}.ps54-path{display:flex;align-items:start;gap:9px;border:1px solid #3b4e57;background:#111c24;border-radius:7px;padding:11px;min-width:0;cursor:pointer}.ps54-path.ready{border-color:#52775f}.ps54-path input{flex-shrink:0;margin-top:3px;accent-color:#d6b277}.ps54-path span{min-width:0}.ps54-path b{display:block;font-size:12px;color:#e9c692}.ps54-path small{display:block;color:#b3c0c6;font-size:11px;line-height:1.45;margin:5px 0;overflow-wrap:anywhere}
.ps54-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:11px 0}.ps54-fields label,.ps54-procedure label{font-size:12px;color:#b9cbd0;display:grid;gap:7px;min-width:0}.ps54-fields select,.ps54-procedure select{width:100%;min-width:0;padding:10px;background:#0c171e;border:1px solid #4b6069;border-radius:6px;color:#edf1f0;font:inherit;font-size:12px}
.ps54-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.ps54-actions .btn{font-size:12px;padding:8px 10px}.ps54-feedback{font-size:12px;color:#c1c9c9;line-height:1.55;margin-top:9px}.ps54-procedure{border-top:1px solid #3c525b;margin-top:16px;padding-top:17px}.ps54-procedure h4{color:#e9c38f;margin-bottom:7px}.ps54-notes{padding:12px 14px;border:1px solid #5c5141;border-radius:7px;margin:12px 0;background:#261f1b;color:#e4c7a4;font-size:12px}.ps54-notes p{margin:7px 0!important}
.ps54-verdict-extra{margin-top:16px;padding-top:12px;border-top:1px solid #54616b}.ps54-verdict-extra h4{color:#e6c593}.ps54-verdict-extra .btn{margin:10px 0}
@media(max-width:680px){.ps54-hearing{padding:11px}.ps54-paths,.ps54-fields{grid-template-columns:minmax(0,1fr)}.ps54-score{grid-template-columns:auto 1fr;row-gap:8px}.ps54-issue{padding:11px}.ps54-path{padding:10px}.ps54-hearing h3{font-size:17px}}
`;document.head.appendChild(ps54Style);
simRenderHearing();
window.PS54_QA={issues:PS54_ISSUES,route:ps54Route,good:ps54Good,state:()=>STATE.sim.process54,decision:ps54Decision,evaluation:()=>simDefendEvaluation(),review:ps54Review,trial:ps54Trial,version:'5.4'};

