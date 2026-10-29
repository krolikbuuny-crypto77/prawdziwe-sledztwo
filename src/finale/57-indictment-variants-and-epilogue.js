
/* Final 2.0 — warianty kwalifikacji i epilog. Nie dodaje dowodów ani nie zmienia dialogów/API. */
(function(){
'use strict';
if(typeof STATE==='undefined'||typeof simTrial!=='function'||typeof simCaseAssessment!=='function'||typeof simDefendEvaluation!=='function'||!document.getElementById('fcCulprit'))return;
const el=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const VARIANTS=[
 {id:'intentional',title:'Umyślne pozbawienie życia',explain:'Oskarżenie dotyczące bezpośredniej przemocy. Wymaga niezależnego powiązania osoby, kontaktu, obrażeń i chronologii.'},
 {id:'planned',title:'Umyślne zabójstwo z wcześniej powziętym zamiarem',explain:'Najpoważniejsza teza. Samo umówienie spotkania i istnienie motywu nie dowodzą wcześniejszego zamiaru zabójstwa.'},
 {id:'negligence',title:'Nieumyślne spowodowanie śmierci przez zaniedbanie techniczne',explain:'Weryfikacja naruszenia obowiązków technicznych i odrębnie — związku przyczynowego ze śmiercią.'},
 {id:'sabotage',title:'Świadome ukrywanie niezgodności i możliwy sabotaż dokumentacji',explain:'Dotyczy protokołów i działań organizacyjnych; samo fałszowanie zapisu nie przesądza o odpowiedzialności za śmierć.'},
 {id:'complicity',title:'Współudział w zatajeniu nieprawidłowości',explain:'Sprawdzenie współdziałania przy ukrywaniu danych, bez automatycznego przypisywania współsprawstwa zabójstwa.'}
];
const VARIANT_MAP=new Map(VARIANTS.map(v=>[v.id,v]));
const getChoice=()=>VARIANT_MAP.has(STATE.final13?.qualification)?STATE.final13.qualification:'intentional';
const setChoice=id=>{if(!VARIANT_MAP.has(id))return; if(STATE.final13.qualification===id)return;
 STATE.final13.qualification=id;STATE.sim.trial=null;
 if(STATE.final13.submitted){STATE.final13.submitted=false;STATE.final13.feedback='Zmiana kwalifikacji wymaga ponownego przedstawienia aktu.';}
 if(typeof fcRender==='function')fcRender();};
const has=id=>STATE.found.has(id);
const every=(...ids)=>ids.every(has);
const any=(...ids)=>ids.some(has);
const ready=(ass,id)=>!!ass.cs[id]?.ready;
const pscore=(ass,id)=>Math.round(ass.cs[id]?.score||0);
const grade=(...scores)=>Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
const RELEVANT={
 intentional:['accident','contract','message','card','remote','traces'],
 planned:['accident','contract','message','card','remote','traces'],
 negligence:['accident','contract','traces'],
 sabotage:['contract','message','card'],
 complicity:['contract','message','card','remote']
};
const MAPPING={
 MAREK:['EVID_PAYROLL_MANUAL_EDIT','EVID_ACCEPTANCE_RECORD','TEC-09'],
 TOMASZ:['EVID_TCMS_SESSION','TEC-13','EVID_WORK_ORDER_RAW'],
 JANUSZ:['EVID_WORK_ORDER_RAW','EVID_SERVICE_FORM_GAPS','TEC-09'],
 ELZBIETA:['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION','DIG-16'],
 KAMIL:['EVID_RESOURCE_HANDOVER','EVID_T17_DOOR_EVENT','EVID_TEST_AUTHORIZATION'],
 MAGDALENA:['EVID_ACCEPTANCE_RECORD','EVID_MESSAGE_DEVICE_METADATA','TEC-09']
};
const limit=['Nie utożsamiaj użytkownika konta lub karty z osobą bez niezależnego sprawdzenia.',
 'Dokumentacja serwisowa może dowodzić zaniedbań, lecz niekoniecznie mechanizmu śmierci.',
 'Odtworzona wiadomość wskazuje proponowane spotkanie; nie dokumentuje samego aktu przemocy.'];
function signature(){
 const sim=STATE.sim||{},final=STATE.final13||{};
 return JSON.stringify({qualification:getChoice(),found:[...STATE.found].sort(),links:sim.links,verified:sim.verified,
 challenges:sim.challenges,ignoredTimeline:sim.ignoredTimeline,errors:sim.errors,trust:sim.trust,
 person:final.culprit,method:final.method,alibi:final.alibi,keystone:final.keystone,
 roles:final.links,reasons:final.reasons,submitted:final.submitted,
 timeline:STATE.timeline11?.entries,scene:STATE.scene12?.inspected,cards:STATE.deduction?.cards,process54:sim.process54,sourceAudit:sim.auditJudgments,violations:sim.psych52?.violations});
}
function decide(){
 const branch=getChoice(),person=STATE.final13.culprit,method=STATE.final13.method;
 const a=simCaseAssessment(),d=simDefendEvaluation(),s=STATE.sim;
 const relevantIds=window.PS_REASONING_ENGINE?.relevantObjections(branch)||RELEVANT[branch]||RELEVANT.intentional;
 const relevant=d.responses.filter(x=>relevantIds.includes(x.id));
 const passed=relevant.filter(x=>x.passed).length, defenseAll=passed===relevant.length;
 const timelineOK=!a.timelineIssues.length&&!s.ignoredTimeline;
 const defect=every('EVID_SERIAL_PHOTO','EVID_ACCEPTANCE_RECORD')&&any('EVID_WORK_ORDER_RAW','TEC-09');
 const procedural=every('EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION')||every('EVID_WORK_ORDER_RAW','EVID_SERVICE_FORM_GAPS');
 const contact=every('EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA');
 const trauma=every('MED-04','MED-09')&&any('LAB-08','LAB-09');
 const actorDocs=(MAPPING[person]||[]).filter(has);
 const actorFit=actorDocs.length>=2;
 const roleDocs=new Set(typeof fcAllDocs==='function'?fcAllDocs():[]);
 const validActor=person==='MAGDALENA'&&ready(a,'identity')&&ready(a,'meeting');
 const mechanistic=method==='two_stage'&&trauma&&ready(a,'mechanism');
 const core=validActor&&mechanistic&&ready(a,'chronology')&&ready(a,'alibi')&&timelineOK;
 const rightProof=typeof fcFamilies==='function'&&roleDocs.size>=6&&fcFamilies([...roleDocs])>=4;
 const trustOK=s.trust>=35&&!a.badKey;
 const defenseGrade=passed/relevant.length;
 let score=0,verdict='',title='',text='',kind='weak',gaps=[],positive=[],needed=[],charge='';
 const addPositive=(cond,description)=>{if(cond)positive.push(description);else gaps.push('Brak potwierdzenia: '+description.toLowerCase()+'.');};
 const opposition=relevant.filter(x=>!x.passed).map(x=>'Nieodparty zarzut: '+x.title);
 const proceduralRisk=(a.auditCritical?.length||0)+(a.auditOverclaims?.length||0)+(a.story53?.over||0)+(s.psych52?.violations?.length||0);
 const poorProcedure=!trustOK||s.errors>=5||proceduralRisk>=3;
 if(branch==='intentional'||branch==='planned'){
  charge=branch==='planned'?'Zabójstwo z uprzednio powziętym zamiarem':'Umyślne pozbawienie życia';
  addPositive(contact,'Zweryfikowane źródło wiadomości i treść propozycji spotkania');
  addPositive(ready(a,'identity')&&person==='MAGDALENA','Niezależne powiązanie wskazanej osoby z kontaktem i trasą');
  addPositive(mechanistic,'Medyczna i techniczna rekonstrukcja dwóch faz obrażeń');
  addPositive(ready(a,'chronology')&&timelineOK,'Zgodna oś czasu po kontroli znaczników');
  addPositive(ready(a,'alibi'),'Niezależna kontrola ograniczeń alibi');
  addPositive(rightProof,'Źródła przypisane do ról oskarżenia');
  score=Math.max(0,Math.min(100,Math.round(grade(pscore(a,'identity'),pscore(a,'meeting'),pscore(a,'mechanism'),pscore(a,'chronology'),pscore(a,'alibi'))*.73+defenseGrade*18+(trustOK?8:0)-(rightProof?0:12)-(timelineOK?0:18)-(person==='MAGDALENA'?0:25))));
  if(branch==='planned'){
   const preparation=defect&&contact&&ready(a,'conceal');
   addPositive(preparation,'Łańcuch źródeł o przygotowaniu spotkania i interesie w ukryciu niezgodności');
   // Materiał fabularny nie zawiera bezpośredniego dowodu z góry powziętego zamiaru zabicia.
   gaps.push('Brak bezpośredniego dowodu wcześniejszego zamiaru zabójstwa; zaproszenie na spotkanie nie jest jego równoznacznikiem.');
   if(core&&passed>=5&&trustOK&&!poorProcedure&&rightProof){kind='returned';verdict='Rekwalifikacja — zamiar uprzedni nieudowodniony';title='Mocne ustalenia w sprawie przemocy, brak podstaw do premedytacji';text='Kontrola odmawia utrzymania zarzutu z góry powziętego zamiaru. Materiały mogą wspierać odrębną tezę umyślnego pozbawienia życia, lecz konieczna jest decyzja o zmianie kwalifikacji.';}
   else{kind='weak';verdict='Odmowa utrzymania zarzutu';title='Teza o premedytacji nie wytrzymała kontroli';text='Brakuje niezależnego, kompletnego łańcucha łączącego osobę, mechanizm i zamiar. Nie wolno zastąpić go samym motywem.';}
  }else if(core&&passed>=5&&trustOK&&!poorProcedure&&rightProof&&score>=76){kind='solid';verdict='Symulowany wyrok skazujący — oskarżenie utrzymane';title='Skazanie po odparciu istotnych zarzutów obrony';text='Niezależne źródła wiążą kontakt, przebieg zdarzenia i obrażenia. Obrona nie podważyła decydujących ogniw rozumowania. To fikcyjne rozstrzygnięcie, a nie gwarancja wyniku rzeczywistego procesu.';}
  else if(person!=='MAGDALENA'&&s.ignoredTimeline&&a.timelineIssues.length){kind='miscarriage';verdict='Błędne skazanie w symulacji';title='Ostrzeżenie: zignorowano dowody odciążające';text='Wariant ostrzegawczy: oskarżenie nieprawidłowej osoby zostało oparte na pominiętych sprzecznościach. Takie rozstrzygnięcie nie oznacza, że poszlaki rzeczywiście dowodzą winy.';}
  else if(passed>=2&&score>=48){kind='returned';verdict='Zwrot aktu do uzupełnienia';title='Niepełne powiązanie osoby i mechanizmu';text='Prokurator wymaga dalszego ustalenia brakujących ogniw. Obrona wykazała słabości, których nie można zastąpić większą liczbą niepowiązanych dokumentów.';}
  else{kind='acquittal';verdict='Brak podstaw do utrzymania oskarżenia';title='Oskarżenie nie osiągnęło progu wiarygodności';text='Zgromadzony materiał nie pozwala przypisać odpowiedzialności za śmierć w sposób dostatecznie spójny.';}
 } else if(branch==='negligence'){
  charge='Nieumyślne spowodowanie śmierci w następstwie zaniedbań technicznych';
  addPositive(defect,'Udokumentowana rozbieżność podzespołu i protokołu');
  addPositive(procedural,'Potwierdzona luka kontroli lub zgłoszenia ryzyka');
  addPositive(trauma,'Niezależna opinia o dwóch grupach obrażeń');
  addPositive(actorFit,'Dokumenty łączące wybraną osobę z obowiązkami proceduralnymi');
  const deathCausality=trauma&&method==='slip'&&!ready(a,'mechanism');
  // Zweryfikowane akta wskazują, że zwykły upadek nie tłumaczy całości obrażeń.
  gaps.push('Nie wykazano, że sama usterka techniczna spowodowała śmierć; opinie opisują odrębny uraz głowy.');
  score=Math.max(0,Math.min(100,Math.round((defect?27:0)+(procedural?24:0)+(actorFit?13:0)+(trauma?12:0)+passed*3-(poorProcedure?15:0))));
  if(defect&&procedural&&actorFit&&passed>=2){kind='returned';verdict='Odrębny wątek zaniedbań — bez wykazanej przyczynowości śmierci';title='Naruszenia procedur wymagają rozliczenia';text='Ustalono podstawy do kontroli odpowiedzialności za dopuszczenie wagonu i sposób dokumentowania ryzyka. Nie wykazano jednak, że te uchybienia same spowodowały śmierć Leny. Zarzut śmiertelnego skutku wymaga odrębnego dowodu.';}
  else{kind='weak';verdict='Brak podstaw do wskazanej kwalifikacji';title='Nie udowodniono związku zaniedbań ze śmiercią';text='Samo niedopełnienie procedury nie przesądza o skutku śmiertelnym ani o odpowiedzialności wskazanej osoby.';}
 } else if(branch==='sabotage'){
  charge='Świadome ukrywanie niezgodności w dokumentacji odbioru';
  const pattern=every('EVID_SERIAL_PHOTO','EVID_ACCEPTANCE_RECORD')&&any('TEC-09','EVID_SERVICE_FORM_GAPS');
  const signature=person==='MAGDALENA'&&has('EVID_ACCEPTANCE_RECORD');
  addPositive(pattern,'Niezależne porównanie oznaczeń L-2 i L-3');
  addPositive(signature,'Powiązanie zatwierdzenia protokołu ze wskazaną osobą');
  addPositive(ready(a,'conceal'),'Zweryfikowana teza o zatajaniu rozbieżności');
  gaps.push('Dokumenty nie przesądzają o fizycznym sabotażu urządzenia ani współsprawstwie zabójstwa.');
  score=Math.min(100,Math.max(0,Math.round((pattern?35:0)+(signature?26:0)+(ready(a,'conceal')?22:0)+passed*2-(poorProcedure?12:0))));
  if(pattern&&signature&&ready(a,'conceal')&&passed>=2&&!poorProcedure){kind='documentation';verdict='Utrzymanie wątku dokumentacyjnego';title='Potwierdzono podstawy odpowiedzialności za zapis odbioru';text='Łańcuch źródeł wspiera odrębną odpowiedzialność za ukrywanie niezgodności w dokumentacji. Nie jest to rozstrzygnięcie odpowiedzialności za śmierć ani za fizyczny sabotaż.';}
  else if(pattern){kind='returned';verdict='Skierowanie do dalszego ustalenia sprawstwa';title='Rozbieżność jest rzeczywista, udział osoby niepełny';text='Niezgodność podzespołów została udokumentowana, ale nie przypisano bez dostatecznych podstaw świadomego działania konkretnej osobie.';}
  else{kind='weak';verdict='Brak podstaw do utrzymania aktu';title='Zarzut oparto na niepełnej dokumentacji';text='Do oceny świadomej manipulacji konieczne są oryginały i niezależne potwierdzenie ich zmiany.';}
 } else {
  charge='Współudział w ukrywaniu nieprawidłowości proceduralnych';
  addPositive(actorFit,'Źródła wskazujące rolę osoby w obiegu dokumentów lub identyfikatorów');
  addPositive(procedural||defect,'Potwierdzone naruszenie zasad kontroli i dokumentowania');
  addPositive(ready(a,'conceal'),'Zweryfikowany kontekst zatajonych rozbieżności');
  gaps.push('Sam udział w obiegu dokumentów nie dowodzi porozumienia co do zabójstwa.');
  score=Math.min(100,Math.max(0,Math.round((actorFit?27:0)+(procedural||defect?29:0)+(ready(a,'conceal')?22:0)+passed*3-(poorProcedure?13:0))));
  if(actorFit&&(procedural||defect)&&ready(a,'conceal')&&passed>=2){kind='returned';verdict='Wydzielenie wątku współdziałania proceduralnego';title='Możliwe współdziałanie przy zatajeniu';text='Ustalono rolę wskazanej osoby i rozbieżności dokumentacyjne. Należy jeszcze wykazać świadome porozumienie; nie wolno rozszerzać tych ustaleń na współsprawstwo zabójstwa.';}
  else{kind='weak';verdict='Współudział nieudowodniony';title='Brak wystarczającego dowodu porozumienia';text='Dostęp do dokumentów lub pojedynczy błąd proceduralny nie wystarczają, by wykazać świadomy wspólny zamiar ukrywania informacji.';}
 }
 if(!timelineOK&&!gaps.some(x=>x.includes('chronolog')))gaps.push('Nieusunięte sprzeczności chronologii osłabiają wiarygodność wniosku.');
 if(poorProcedure)gaps.push('Błędy proceduralne lub niska wiarygodność prowadzenia czynności obniżyły wartość argumentacji.');
 if(!defenseAll)gaps.push(...opposition);
 if(!roleDocs.size)gaps.push('Brak dowodów wyraźnie przypisanych do elementów aktu.');
 // Obowiązek rzetelnego ujawnienia okoliczności odciążających dotyczy każdej ścieżki.
 const disclosure=s.process54?.disclosure||'';
 if(disclosure==='defer'){
  kind='returned';verdict='Akta skierowane do uzupełnienia na wniosek śledczego';
  title='Ujawniono wymagające wyjaśnienia luki';
  text='Śledczy nie forsuje orzeczenia, lecz zwraca materiał do dalszych czynności. Wniosek może zostać ponowiony po uzupełnieniu źródeł.';
 }else if(disclosure==='suppress'){
  gaps.push('Świadomie nie ujawniono materiałów odciążających, naruszając warunki rzetelnej oceny.');
  const wrong=person&&person!=='MAGDALENA';
  kind=wrong&&(!timelineOK||['card_proves','remote_proves','console_proves'].includes(STATE.final13.alibi))?'miscarriage':'excluded';
  verdict=kind==='miscarriage'?'Błąd wymiaru sprawiedliwości':'Istotne uchybienie proceduralne';
  title=kind==='miscarriage'?'Błędne rozstrzygnięcie na podstawie zatajonych wątpliwości':'Akt nie został utrzymany po zatajeniu materiałów';
  text=kind==='miscarriage'?'W fikcyjnej gałęzi błędnie oskarżono osobę, ignorując jej możliwe alibi i źródła odciążające.':'Nieujawnienie wątpliwości podważa rzetelność całego wnioskowania, niezależnie od kwalifikacji.';
 }
 const result={kind,title,text,defense:`Obroniono ${passed} z ${relevant.length} zarzutów właściwych dla tej kwalifikacji`,reasons:[...new Set(gaps)].slice(0,20),strength:score,
  qualification:branch,qualificationTitle:charge,verdict,signature:signature(),positive:[...new Set(positive)],defensePassed:passed,defenseTotal:relevant.length,
  assessedPerson:person, assessedAt:Date.now(), evidenceCount:STATE.found.size,trust:s.trust,errors:s.errors,graph:SIM_NODES.map(n=>({id:n.id,title:n.title,ready:a.cs[n.id].ready,score:a.cs[n.id].score}))};
 return result;
}
function thesisReport(){return (STATE.deduction?.cards||[]).slice(0,40).map((c,i)=>{
 let v={ok:false,issues:['Wymaga weryfikacji']};try{v=dd7Reasoning(c);}catch(_){}
 return {title:String(c.title||c.name||`Hipoteza ${i+1}`).slice(0,140),ok:!!v.ok,issues:Array.isArray(v.issues)?v.issues.slice(0,2):[],sources:(c.sourceIds||c.sources||c.ids||[]).length};
 });}
function epilogue(result){
 const area=el('simHearingDetail');if(!area||!result)return;
 let box=el('psFinalEpilogue');if(!box){box=document.createElement('section');box.id='psFinalEpilogue';box.className='ps-epilogue';area.appendChild(box);} // regenerated with hearing
 const hypotheses=thesisReport(),unverified=Object.keys(SIM_DEGRADED).filter(id=>has(id)&&!simIsVerified(id));
 const niceDocs=DOCS.filter(d=>has(d.id)).length;
 const protectedReasons=result.reasons.length?result.reasons.map(x=>`<li>${safe(x)}</li>`).join(''):'<li>W testowanej argumentacji nie ujawniono istotnej luki.</li>';
 const hypothesesMarkup=hypotheses.length?hypotheses.map(h=>`<li><b>${safe(h.title)}</b> — ${h.ok?'<span class="ps-good">argumentacja zaliczona</span>':'<span class="ps-warn">wymaga korekty</span>'}${h.issues.length?`<span class="ps-ep-note">${safe(h.issues[0])}</span>`:''}</li>`).join(''):'<li>Nie zapisano własnych kart hipotez poza obowiązkowymi ustaleniami.</li>';
 const nodes=result.graph.map(g=>`<div class="ps-ep-node"><strong>${safe(g.title)}</strong><span class="${g.ready?'ps-good':'ps-warn'}">${g.ready?'Weryfikacja zaliczona':'Do dalszego sprawdzenia'} · ${g.score}%</span></div>`).join('');
 box.innerHTML=`<div class="eyebrow">ZAMKNIĘCIE DOCHODZENIA · EPILOG</div><h3>Co rzeczywiście ustalono?</h3>
 <p class="ps-ep-lead">${safe(result.verdict)}. Wybrana kwalifikacja: <b>${safe(result.qualificationTitle)}</b>. Poniżej rozliczenie decyzji, bez przyznawania nowych dowodów.</p>
 <div class="ps-ep-stats"><div><strong>${niceDocs} / ${DOCS.length}</strong><span>Materiały w aktach</span></div><div><strong>${result.defensePassed} / ${result.defenseTotal}</strong><span>Odparte zarzuty</span></div><div><strong>${result.trust}%</strong><span>Zaufanie procesowe</span></div><div><strong>${result.errors}</strong><span>Błędy metodologiczne</span></div></div>
 <div class="ps-ep-columns"><section><h4>Wnioski i hipotezy</h4><div class="ps-ep-nodes">${nodes}</div><details><summary>Własne hipotezy gracza (${hypotheses.length})</summary><ul>${hypothesesMarkup}</ul></details></section>
 <section><h4>Co osłabiło oskarżenie?</h4><ul>${protectedReasons}</ul>${unverified.length?`<p class="muted small">Nie w pełni zweryfikowane materiały: ${unverified.slice(0,8).map(id=>safe(byId[id]?.title||id)).join('; ')}.</p>`:''}
 ${result.positive.length?`<details><summary>Ustalenia, które przetrwały kontrolę</summary><ul>${result.positive.map(x=>`<li>${safe(x)}</li>`).join('')}</ul></details>`:''}</section></div>
 <div class="ps-ep-actions"><button type="button" class="btn alt" data-ps-ep-go="deduction">Sprawdź hipotezy</button><button type="button" class="btn alt" data-ps-ep-go="timeline">Wróć do chronologii</button><button type="button" class="btn alt" data-ps-ep-go="evidence">Przejrzyj akta</button></div>
 <p class="small muted">To symulacja fabularna. Zaliczenie tezy w grze nie jest matematycznym prawdopodobieństwem winy ani rzeczywistym wyrokiem sądowym.</p>`;
 box.querySelectorAll('[data-ps-ep-go]').forEach(btn=>btn.addEventListener('click',()=>showTab(btn.dataset.psEpGo)));
}
function qualifyUI(){
 const first=el('fcCulprit');if(!first||el('psQualification'))return;
 const group=document.createElement('div');group.id='psQualification';group.className='ps-qualification';
 group.innerHTML=`<div class="eyebrow">WYBÓR KIERUNKU POSTĘPOWANIA</div><h3>Jak kwalifikujesz ustalony czyn?</h3><p class="muted small">Wybierz tezę odpowiadającą zebranemu materiałowi. Poważniejszy zarzut wymaga silniejszych podstaw; niezależny zarzut dokumentacyjny nie zastępuje dowodu przemocy.</p><div class="ps-qualification-grid">${VARIANTS.map(v=>`<label class="ps-q-choice"><input type="radio" name="psQualificationChoice" value="${v.id}"><span><b>${safe(v.title)}</b><small>${safe(v.explain)}</small></span></label>`).join('')}</div><p id="psQInfo" class="small muted" role="status"></p>`;
 first.closest('.fc-main')?.insertBefore(group,first.closest('.fc-fields'));
 group.addEventListener('change',e=>{if(e.target.name==='psQualificationChoice'){setChoice(e.target.value);renderChoice();}});
 renderChoice();
}
function renderChoice(){
 const group=el('psQualification');if(!group)return;
 const current=getChoice();
 group.querySelectorAll('input[name="psQualificationChoice"]').forEach(r=>{r.checked=r.value===current;r.closest('label').classList.toggle('selected',r.checked);});
 const desc=VARIANT_MAP.get(current);
 el('psQInfo').textContent='Wybrano: '+desc.title+'. Oceniane będą dowody właściwe tej kwalifikacji, nie tylko ogólny procent kompletności akt.';
}
// Zachowaj istniejący moduł i jego mechaniki, zastępując jedynie sposób zakończenia.
const oldTrial=simTrial;
simTrial=function(){
 if(!STATE.final13.submitted)return toast('Najpierw złóż akt do kontroli.');
 const mode=STATE.sim.process54?.disclosure||'';
 if(!mode)return toast('Przed rozstrzygnięciem wskaż, jak postępujesz z materiałami odciążającymi.');
 const relevant=window.PS_REASONING_ENGINE?.relevantObjections(getChoice())||RELEVANT[getChoice()];
 const defense=simDefendEvaluation().responses.filter(x=>relevant.includes(x.id));
 if(mode==='suppress')simError('Świadomie nie ujawniono wątpliwości obronie.',6,15);
 else if(mode==='defer')simTime(3,0,'Dobrowolne skierowanie akt do uzupełnienia');
 else if(defense.some(x=>['shortcut','skip'].includes(x.method)))simError('Pominięto zarzut obrony lub przeceniono pojedynczy dowód.',3,4);
 else simTime(2,0,'Kontrola kontradyktoryjna — '+VARIANT_MAP.get(getChoice()).title);
 if(STATE.sim.process54)STATE.sim.process54.hearings=(STATE.sim.process54.hearings||0)+1;
 STATE.sim.trial=decide();
 window.PS617_SYNC?.enqueue?.({type:'request_verdict'});
 simRenderHearing();
 el('simHearing')?.scrollIntoView({block:'start',behavior:'smooth'});
};
const oldHearing=simRenderHearing;
simRenderHearing=function(){const out=oldHearing.apply(this,arguments);
 // Konfrontacje proceduralne są dobierane do treści kwalifikacji.
 const cards=[...document.querySelectorAll('#ps54Hearing .ps54-issue')];
 const relevant=window.PS_REASONING_ENGINE?.relevantObjections(getChoice())||RELEVANT[getChoice()];
 if(cards.length){
  cards.forEach((card,i)=>{card.hidden=!relevant.includes(FC_CHALLENGES[i]?.id);});
  const h=el('ps54Hearing')?.querySelector('h3');if(h)h.textContent='Zarzuty obrony właściwe dla kwalifikacji · '+relevant.length;
  const count=el('ps54Hearing')?.querySelector('.ps54-score b');
  if(count)count.textContent=simDefendEvaluation().responses.filter(r=>relevant.includes(r.id)&&r.passed).length+'/'+relevant.length;
 }
 if(STATE.sim?.trial)epilogue(STATE.sim.trial);
 else el('psFinalEpilogue')?.remove();
 renderChoice();return out;};

/* SaveManager: buildSave hook. */
registerSaveHook({name:"57-indictment-variants-and-epilogue-save1", build(__save){const out=__save;if(out.investigationSim){out.investigationSim.finalQualification=getChoice();out.investigationSim.finalDecided=!!STATE.sim?.trial;}return out;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"57-indictment-variants-and-epilogue-load1", apply(data){const out=undefined;const raw=data?.investigationSim;
 STATE.final13.qualification=VARIANT_MAP.has(raw?.finalQualification)?raw.finalQualification:'intentional';
 if(raw?.finalDecided&&STATE.final13.submitted){STATE.sim.trial=decide();}else STATE.sim.trial=null;
 renderChoice();simRenderHearing();return out;}});
const oldReset=fcReset;
fcReset=function(){const out=oldReset.apply(this,arguments);STATE.final13.qualification='intentional';STATE.sim.trial=null;renderChoice();simRenderHearing();return out;};
const oldSimReset=simReset;
simReset=function(){const out=oldSimReset.apply(this,arguments);STATE.sim.trial=null;simRenderHearing();return out;};
const oldFcRender=fcRender;
fcRender=function(){const out=oldFcRender.apply(this,arguments);renderChoice();return out;};
qualifyUI();
window.PS_FINAL_VARIANTS={variants:VARIANTS,evaluate:decide,signature,epilogue,choice:getChoice,setChoice};
})();

