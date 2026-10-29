/* Prawdziwe Śledztwo 5.1 — audyt źródeł: 78 indywidualnych reguł, dwa sposoby kontroli.
   Kontrola ustala wiarygodność danego twierdzenia, NIE rozstrzyga automatycznie winy. */
const SIM51_PATHS={"MED-01":[["DIG-10","MED-07"],["ADM-10","MED-02"]],"MED-02":[["VIS-02","ADM-13"],["LAB-08","MED-07"]],"MED-03":[["TEC-14","MED-07"],["VIS-06","LAB-08"]],"MED-04":[["LAB-08","VIS-02"],["MED-05","LAB-05"]],"MED-05":[["VIS-02","LAB-04"],["MED-04","ADM-13"]],"MED-06":[["MED-02","LAB-10"],["MED-07","ADM-13"]],"MED-07":[["DIG-10","ADM-10"],["MED-01","VIS-02"]],"MED-08":[["TEC-01","ADM-01"],["MED-01","DIG-01"]],"MED-09":[["TEC-16","LAB-08"],["VIS-02","LAB-05"]],"MED-10":[["LAB-08","VIS-02"],["LAB-10","TEC-16"]],"TEC-01":[["ADM-01","EVID_SERIAL_PHOTO"],["TEC-07","EVID_ACCEPTANCE_RECORD"]],"TEC-02":[["EVID_DISPATCH_REVISION","ADM-10"],["TEC-03","DIG-10"]],"TEC-03":[["TEC-12","ADM-10"],["EVID_TCMS_SESSION","TEC-02"]],"TEC-04":[["EVID_TEST_AUTHORIZATION","ADM-10"],["TEC-13","DIG-15"]],"EVID_WORK_ORDER_RAW":[["EVID_SERVICE_FORM_GAPS","TEC-07"],["TEC-04","EVID_ACCEPTANCE_RECORD"]],"EVID_SERVICE_FORM_GAPS":[["TEC-09","EVID_WORK_ORDER_RAW"],["EVID_ACCEPTANCE_RECORD","DIG-16"]],"TEC-07":[["EVID_SERIAL_PHOTO","EVID_ACCEPTANCE_RECORD"],["TEC-15","EVID_WORK_ORDER_RAW"]],"EVID_ACCEPTANCE_RECORD":[["TEC-07","EVID_SERIAL_PHOTO"],["TEC-09","DIG-16"]],"TEC-09":[["DIG-02","EVID_ACCEPTANCE_RECORD"],["EVID_SERVICE_FORM_GAPS","TEC-15"]],"EVID_TEST_AUTHORIZATION":[["TEC-04","EVID_TCMS_SESSION"],["TEC-12","DIG-15"]],"EVID_TCMS_SESSION":[["TEC-12","TEC-13"],["EVID_TEST_AUTHORIZATION","TEC-03"]],"TEC-12":[["EVID_TCMS_SESSION","TEC-04"],["TEC-13","DIG-15"]],"TEC-13":[["TEC-04","EVID_TCMS_SESSION"],["TEC-12","DIG-10"]],"TEC-14":[["MED-03","VIS-06"],["TEC-16","LAB-08"]],"TEC-15":[["EVID_SERIAL_PHOTO","EVID_ACCEPTANCE_RECORD"],["TEC-07","DIG-16"]],"TEC-16":[["ADM-11","LAB-04"],["VIS-10","MED-09"]],"DIG-01":[["EVID_BHP_DRAFT","ADM-10"],["MED-01","ADM-01"]],"DIG-02":[["TEC-09","EVID_ACCEPTANCE_RECORD"],["DIG-14","DIG-16"]],"DIG-03":[["DIG-04","DIG-11"],["DIG-05","EVID_MESSAGE_THREAD_RECOVERED"]],"DIG-04":[["DIG-03","DIG-11"],["EVID_MESSAGE_THREAD_RECOVERED","DIG-05"]],"DIG-05":[["DIG-03","EVID_MESSAGE_THREAD_RECOVERED"],["DIG-11","EVID_MESSAGE_DEVICE_METADATA"]],"EVID_MESSAGE_THREAD_RECOVERED":[["DIG-04","DIG-05"],["DIG-03","DIG-11"]],"EVID_MESSAGE_DEVICE_METADATA":[["DIG-05","DIG-09"],["DIG-03","DIG-04"]],"EVID_CONFERENCE_SESSION":[["DIG-09","ADM-04"],["DIG-02","EVID_RAW_ENTRY_TIMES"]],"DIG-09":[["EVID_CONFERENCE_SESSION","ADM-04"],["EVID_MESSAGE_DEVICE_METADATA","DIG-11"]],"DIG-10":[["MED-01","ADM-10"],["MED-07","TEC-02"]],"DIG-11":[["DIG-04","ADM-13"],["DIG-05","LAB-01"]],"EVID_PAYROLL_MANUAL_EDIT":[["EVID_RAW_ENTRY_TIMES","ADM-01"],["ADM-10","DIG-10"]],"EVID_RADIO_GAP":[["TEC-02","ADM-10"],["EVID_DISPATCH_REVISION","DIG-10"]],"DIG-14":[["DIG-02","ADM-10"],["EVID_ACCEPTANCE_RECORD","TEC-15"]],"DIG-15":[["EVID_TEST_AUTHORIZATION","TEC-04"],["TEC-13","ADM-01"]],"DIG-16":[["EVID_ACCEPTANCE_RECORD","DIG-02"],["TEC-15","ADM-10"]],"EVID_SERIAL_PHOTO":[["TEC-07","TEC-15"],["EVID_ACCEPTANCE_RECORD","VIS-11"]],"VIS-02":[["ADM-13","MED-02"],["LAB-01","TEC-16"]],"VIS-03":[["VIS-06","ADM-04"],["EVID_CCTV_SYNC","ADM-11"]],"VIS-04":[["VIS-06","ADM-12"],["VIS-12","EVID_RAW_ENTRY_TIMES"]],"VIS-05":[["VIS-06","ADM-11"],["VIS-10","EVID_CCTV_SYNC"]],"VIS-06":[["TEC-14","VIS-12"],["ADM-11","EVID_CCTV_SYNC"]],"EVID_CCTV_SYNC":[["VIS-12","VIS-06"],["VIS-03","VIS-04"]],"VIS-08":[["VIS-12","EVID_CCTV_SYNC"],["VIS-03","VIS-04"]],"VIS-09":[["EVID_T17_DOOR_EVENT","ADM-12"],["VIS-12","EVID_RAW_ENTRY_TIMES"]],"VIS-10":[["ADM-11","VIS-05"],["TEC-16","ADM-12"]],"VIS-11":[["ADM-13","LAB-01"],["LAB-04","MED-02"]],"VIS-12":[["VIS-06","VIS-04"],["TEC-14","VIS-03"]],"ADM-01":[["TEC-01","DIG-15"],["EVID_RAW_ENTRY_TIMES","MED-08"]],"EVID_RAW_ENTRY_TIMES":[["ADM-12","EVID_PAYROLL_MANUAL_EDIT"],["EVID_T17_DOOR_EVENT","ADM-01"]],"EVID_DISPATCH_REVISION":[["TEC-02","ADM-10"],["EVID_RADIO_GAP","DIG-10"]],"ADM-04":[["ADM-11","EVID_CCTV_SYNC"],["EVID_RAW_ENTRY_TIMES","VIS-12"]],"EVID_BHP_DRAFT":[["EVID_OUTBOX_MISSING_SUBMISSION","DIG-01"],["DIG-16","ADM-10"]],"EVID_OUTBOX_MISSING_SUBMISSION":[["EVID_BHP_DRAFT","DIG-01"],["DIG-16","ADM-10"]],"ADM-07":[["EVID_RESOURCE_HANDOVER","ADM-01"],["EVID_T17_DOOR_EVENT","ADM-12"]],"EVID_RESOURCE_HANDOVER":[["ADM-07","EVID_T17_DOOR_EVENT"],["ADM-10","EVID_RAW_ENTRY_TIMES"]],"EVID_T17_DOOR_EVENT":[["EVID_RESOURCE_HANDOVER","ADM-07"],["EVID_RAW_ENTRY_TIMES","VIS-09"]],"ADM-10":[["DIG-01","MED-01"],["EVID_RESOURCE_HANDOVER","TEC-02"]],"ADM-11":[["TEC-16","ADM-04"],["VIS-10","EVID_RAW_ENTRY_TIMES"]],"ADM-12":[["EVID_T17_DOOR_EVENT","VIS-09"],["ADM-11","EVID_RAW_ENTRY_TIMES"]],"ADM-13":[["VIS-11","LAB-01"],["MED-07","DIG-11"]],"ADM-14":[["LAB-01","LAB-10"],["ADM-13","LAB-06"]],"LAB-01":[["ADM-13","VIS-11"],["LAB-06","DIG-11"]],"LAB-02":[["LAB-06","VIS-11"],["LAB-09","ADM-14"]],"LAB-03":[["LAB-07","ADM-13"],["LAB-09","VIS-11"]],"LAB-04":[["VIS-02","LAB-05"],["ADM-13","MED-09"]],"LAB-05":[["LAB-08","TEC-16"],["LAB-04","VIS-11"]],"LAB-06":[["LAB-01","MED-07"],["ADM-13","LAB-02"]],"LAB-07":[["LAB-03","VIS-11"],["LAB-09","ADM-14"]],"LAB-08":[["MED-04","LAB-05"],["MED-09","TEC-16"]],"LAB-09":[["LAB-03","LAB-06"],["LAB-07","MED-10"]],"LAB-10":[["LAB-08","MED-04"],["LAB-06","ADM-14"]]};
const SIM51_TYPES={
 medical:{
  label:'Opinia medyczna',
  answers:['To jednoznaczne rozpoznanie sprawcy na podstawie obrażeń.',
   'Wynik ustala zakres medyczny, ale sam nie wskazuje sprawcy.',
   'Brak identyfikacji sprawcy jest dowodem, że zgon był przypadkowy.'],correct:1,
  warning:'Zbyt daleko idący wniosek z opinii medycznej może zniekształcić rekonstrukcję mechanizmu.'},
 technical:{label:'Zapis techniczny',answers:[
  'Rozbieżność techniczna automatycznie dowodzi motywu zabójstwa.',
  'Wpis, pomiar lub protokół pozwala zbadać zgodność części albo procedury, ale nie sprawstwo przemocy.',
  'Ponieważ dokument mógł być poprawiany, nie warto sprawdzać innych wersji.'],correct:1,
  warning:'Nieuprawnione przejście od usterki do zamiaru przemocy obniża wiarygodność zarzutu.'},
 digital:{label:'Zdarzenie cyfrowe',answers:[
  'Log przypisany do konta wskazuje jednoznacznie osobę fizycznie obecną przy urządzeniu.',
  'System potwierdza zdarzenie konta lub urządzenia; człowieka należy identyfikować innymi danymi.',
  'Niepełny log nie ma znaczenia, więc można pominąć chronologię.'],correct:1,
  warning:'Utożsamienie konta i osoby może prowadzić do błędnego przypisania sprawstwa lub alibi.'},
 communications:{label:'Korespondencja i rozmowy',answers:[
  'Treść lub metadane pozwalają ustalić kontakt, lecz autorstwo i obecność wymagają osobnej kontroli.',
  'Sama wiadomość dowodzi, kto osobiście stanął na miejscu zdarzenia.',
  'Wiadomość po usunięciu jest zawsze bezwartościowa.'],correct:0,
  warning:'Przecenienie wiadomości bez weryfikacji nadawcy osłabia tezę o spotkaniu.'},
 visual:{label:'Obraz lub ślad wizualny',answers:[
  'Zamazana sylwetka jest jednoznaczną identyfikacją sprawcy.',
  'Każdy kadr kamer ma prawidłowy czas nawet bez synchronizacji.',
  'Obraz potwierdza to, co rzeczywiście widać; tożsamość i czas trzeba sprawdzić niezależnie.'],correct:2,
  warning:'Nadmierne twierdzenia o obrazie mogą zniszczyć rekonstrukcję trasy.'},
 chronology:{label:'Czas i topografia',answers:[
  'Jeden znacznik czasu wyklucza każdą inną wersję wydarzeń.',
  'Sprawdzona synchronizacja i czasy przejść ograniczają możliwe zdarzenia, nie ustalając same z siebie tożsamości.',
  'Nie trzeba uwzględniać różnic zegarów, jeśli godziny są podobne.'],correct:1,
  warning:'Błędne wyrównanie zegarów może fałszywie obalić alibi.'},
 access:{label:'Karta i strefa',answers:[
  'Rejestr odnotowuje użycie uprawnienia, lecz posiadacza karty należy ustalić osobno.',
  'Numer karty to równocześnie niepodważalny wizerunek jej właściciela.',
  'Nie ma znaczenia, czy karta była komukolwiek przekazywana.'],correct:0,
  warning:'Utożsamienie karty z jej formalnym właścicielem sprzyja oskarżeniu niewłaściwej osoby.'},
 procedure:{label:'Dokument proceduralny',answers:[
  'Brak podpisu oznacza, że treść wszystkich innych dokumentów jest fałszywa.',
  'Niewysłany formularz jest równoważny formalnie odebranemu zgłoszeniu.',
  'Dokument potwierdza stan procedury, ale nie automatycznie czynność, której brakuje w rejestrze.'],correct:2,
  warning:'Pomylenie projektu z formalnym złożeniem dokumentu może wypaczyć ocenę zatajenia.'},
 trace:{label:'Ślady porównawcze',answers:[
  'Zgodność klasowa włókien lub smaru identyfikuje sprawcę z pewnością.',
  'Wynik porównuje rodzaj śladów; nie wyklucza wspólnego źródła ani wtórnego przeniesienia.',
  'Smar z warsztatu nie może niczego potwierdzać, bo występuje powszechnie.'],correct:1,
  warning:'Przecenienie niejednoznacznych śladów materiałowych jest podatne na krytykę obrony.'},
 register:{label:'Ewidencja i protokół',answers:[
  'Wpis poświadcza zapis lub przypisanie; obecność i prawdziwość relacji trzeba weryfikować.',
  'Sam wpis do ewidencji stanowi bezpośrednie świadectwo całego zdarzenia.',
  'Wystarczy zignorować różnice między rejestrem pierwotnym i skorygowanym.'],correct:0,
  warning:'Brak rozróżnienia wpisu i zdarzenia prowadzi do fałszywych wniosków o obecności.'}
};
const SIM51_TYPE_BY_ID={
 'MED-08':'register','TEC-14':'chronology','TEC-16':'chronology',
 'DIG-01':'communications','DIG-03':'communications','DIG-04':'communications','DIG-05':'communications',
 'EVID_MESSAGE_THREAD_RECOVERED':'communications','EVID_MESSAGE_DEVICE_METADATA':'digital',
 'DIG-10':'chronology','DIG-11':'register','EVID_RADIO_GAP':'communications',
 'EVID_CONFERENCE_SESSION':'digital','EVID_RAW_ENTRY_TIMES':'access','EVID_T17_DOOR_EVENT':'access',
 'EVID_RESOURCE_HANDOVER':'access','ADM-07':'access','ADM-12':'access',
 'EVID_BHP_DRAFT':'procedure','EVID_OUTBOX_MISSING_SUBMISSION':'procedure',
 'EVID_SERVICE_FORM_GAPS':'procedure','EVID_ACCEPTANCE_RECORD':'procedure',
 'TEC-09':'procedure','DIG-16':'procedure','EVID_WORK_ORDER_RAW':'procedure',
 'EVID_PAYROLL_MANUAL_EDIT':'register','EVID_DISPATCH_REVISION':'register',
 'ADM-04':'chronology','ADM-11':'chronology','VIS-06':'chronology','VIS-12':'chronology','EVID_CCTV_SYNC':'chronology',
 'VIS-10':'chronology','ADM-13':'procedure','ADM-14':'procedure',
 'EVID_SERIAL_PHOTO':'visual','ADM-10':'register', 'TEC-02':'chronology',
 'LAB-01':'register','LAB-06':'trace','LAB-10':'trace'
};
function sim51Type(id){return SIM51_TYPE_BY_ID[id]||(id.startsWith('MED-')?'medical':id.startsWith('TEC-')||id==='EVID_TCMS_SESSION'||id==='EVID_TEST_AUTHORIZATION'?'technical':id.startsWith('DIG-')?'digital':id.startsWith('VIS-')?'visual':id.startsWith('LAB-')?'trace':'register');}
// Siedem dokumentów z najpoważniejszymi lukami korzysta z tych samych, mocniejszych ścieżek
// zarówno na stacji ekspertyz, jak w indywidualnym audycie.
for(const [id,rule] of Object.entries(SIM_DEGRADED))rule.paths=SIM51_PATHS[id];
function sim51HasRoute(id,index){return !!(SIM51_PATHS[id]&&SIM51_PATHS[id][index]&&SIM51_PATHS[id][index].every(x=>STATE.found.has(x)));}
function sim51Audited(id){return STATE.sim.verified.includes(id);}
// Typowe, niesporne zapisy mają użyteczną wartość jeszcze przed analizą;
// źródła kluczowe z lukami wymagają pełnej walidacji w każdej ścieżce dowodowej.
simQuality=function(id){if(!id||!STATE.found.has(id))return 0;
 if(SIM_NOISE.has(id))return .12;
 if(SIM_DEGRADED[id]&&!sim51Audited(id))return .52;
 return sim51Audited(id)? .96:.86;
};
const sim51BaseAssessment=simCaseAssessment;
simCaseAssessment=function(){const a=sim51BaseAssessment(),j=STATE.sim.auditJudgments||{},filed=new Set(fcAllDocs());
 const critical=[...filed].filter(id=>SIM_DEGRADED[id]&&!sim51Audited(id));
 const overclaims=[...filed].filter(id=>j[id]?.status==='overclaim'||j[id]?.status==='ignored');
 if(critical.length){a.strength=Math.max(0,a.strength-critical.length*7);a.badKey=true;a.weakReasons.push('Akt opiera się na '+critical.length+' niepełnych materiałach bez kontroli niezależnej: '+critical.map(docName).join('; ')+'.');}
 if(overclaims.length){a.strength=Math.max(0,a.strength-overclaims.length*9);a.badKey=true;a.weakReasons.push('Niepoprawne interpretacje w dokumentach aktu: '+overclaims.map(docName).join('; ')+'.');}
 a.auditCritical=critical;a.auditOverclaims=overclaims;return a;};
const sim51BaseGraph=simRenderGraph;
simRenderGraph=function(){sim51BaseGraph();sim51Render();};
const sim51BaseHearing=simRenderHearing;
simRenderHearing=function(){sim51BaseHearing();const el=document.querySelector('#simHearingDetail');if(!el)return;
 const a=simCaseAssessment(),critical=a.auditCritical||[],overclaims=a.auditOverclaims||[];
 el.querySelector('#sim51ProcessRisk')?.remove();
 if(critical.length||overclaims.length)el.insertAdjacentHTML('afterbegin',`<div id="sim51ProcessRisk" class="sim51-risk" role="status"><b>Ryzyko procesowe</b> · ${critical.length} niezweryfikowanych materiałów krytycznych i ${overclaims.length} materiałów błędnie zinterpretowanych w akcie. Finał uwzględnia te braki.</div>`);
};

/* SaveManager: buildSave hook. */
registerSaveHook({name:"12-source-verification-save1", build(__save){const d=__save;if(d.investigationSim){d.investigationSim.auditJudgments=STATE.sim.auditJudgments||{};d.investigationSim.auditMistakes=(STATE.sim.auditMistakes||[]).slice(-40);}return d;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"12-source-verification-load1", apply(data){const r=undefined,saved=data?.investigationSim;
 if(saved&&typeof saved==='object'){
  const recovered=(Array.isArray(saved.verified)?saved.verified:[]).filter(id=>SIM51_PATHS[id]&&STATE.found.has(id)&&SIM51_PATHS[id].some((_,i)=>sim51HasRoute(id,i)));
  STATE.sim.verified=[...new Set([...STATE.sim.verified,...recovered])];
  STATE.sim.auditJudgments={};
  if(saved.auditJudgments&&typeof saved.auditJudgments==='object')for(const [id,item] of Object.entries(saved.auditJudgments)){
   if(!SIM51_PATHS[id]||!STATE.found.has(id)||!item||typeof item!=='object')continue;
   const status=['accepted','overclaim','ignored'].includes(item.status)?item.status:null;
   if(status){const idx=Number(item.path);if(status!=='accepted'||(STATE.sim.verified.includes(id)&&[0,1].includes(idx)&&sim51HasRoute(id,idx)))STATE.sim.auditJudgments[id]={status,path:[0,1].includes(idx)?idx:0};}
  }
  STATE.sim.auditMistakes=(Array.isArray(saved.auditMistakes)?saved.auditMistakes:[]).filter(x=>x&&SIM51_PATHS[x.id]).slice(-40).map(x=>({id:x.id,type:String(x.type||'').slice(0,20)}));
 }
 simRenderGraph();simRenderHearing();return r;
}});
const sim51Parent=document.querySelector('#simGraph');
if(sim51Parent){const section=document.createElement('section');section.id='simAudit51';section.className='surface padded sim51-root';
 section.innerHTML=`<div class="sim51-heading"><div><div class="eyebrow">KONTROLA WIARYGODNOŚCI</div><h3>Audyt źródeł</h3><p class="muted small">Dwa niezależne sposoby sprawdzenia każdego dokumentu. Sam audyt nigdy nie identyfikuje sprawcy.</p></div><div id="sim51Progress" class="sim51-progress"></div></div><div class="sim51-layout"><div class="sim51-library"><label for="sim51Search" class="small">Wyszukaj zdobyte dokumenty</label><input id="sim51Search" class="input" type="search" placeholder="Nazwa lub sygnatura" autocomplete="off"/><label class="small" for="sim51Filter">Pokaż</label><select id="sim51Filter"><option value="all">Wszystkie zdobyte</option><option value="pending">Wymagające kontroli</option><option value="verified">Sprawdzone</option><option value="critical">Materiały z lukami</option></select><div id="sim51Sources" class="sim51-sources"></div></div><div id="sim51Details" class="sim51-detail" aria-live="polite"></div></div>`;
 sim51Parent.insertAdjacentElement('afterend',section);
 section.addEventListener('click',event=>{
  const target=event.target.closest('[data-audit-source],[data-audit-path],[data-audit-commit]');if(!target)return;
  if(target.hasAttribute('data-audit-source')){STATE.sim.auditSelected=target.dataset.auditSource;sim51Render();return;}
  if(target.hasAttribute('data-audit-path')){STATE.sim.auditPath=Number(target.dataset.auditPath);sim51RenderDetail();return;}
  if(target.hasAttribute('data-audit-commit'))sim51Commit();
 });
 section.addEventListener('input',event=>{if(event.target.id==='sim51Search'){STATE.sim.auditFilter=event.target.value.slice(0,90);sim51RenderList();}});
 section.addEventListener('change',event=>{if(event.target.id==='sim51Filter'){STATE.sim.auditStatus=event.target.value;sim51RenderList();}});
}
function sim51DocList(){const s=STATE.sim;const search=norm(s.auditFilter||'');const status=s.auditStatus||'all';return DOCS.filter(d=>STATE.found.has(d.id)&&(!search||norm(d.id+' '+d.title).includes(search)))
 .filter(d=>status==='all'||status==='pending'&&!sim51Audited(d.id)||status==='verified'&&sim51Audited(d.id)||status==='critical'&&!!SIM_DEGRADED[d.id]);}
function sim51RenderList(){const host=document.getElementById('sim51Sources');if(!host)return;
 const docs=sim51DocList();host.innerHTML=docs.length?docs.map(d=>`<button type="button" class="sim51-doc ${STATE.sim.auditSelected===d.id?'active':''}" data-audit-source="${esc(d.id)}"><span><b>${esc(d.id)}</b> · ${esc(d.title)}</span><small>${sim51Audited(d.id)?'Kontrola zakończona':SIM_DEGRADED[d.id]?'Luki źródłowe':'Wstępnie wiarygodny'} · ${Math.round(simQuality(d.id)*100)}% wagi</small></button>`).join(''):'<p class="muted small" style="padding:12px">Nie znaleziono zdobytych dokumentów spełniających filtr.</p>';
}
function sim51Answers(id){const t=SIM51_TYPES[sim51Type(id)];const shift=[...id].reduce((a,c)=>a+c.charCodeAt(0),0)%3;
 const rotated=[0,1,2].map((_,i)=>(i+shift)%3);return {type:t,answers:rotated.map(i=>({text:t.answers[i],correct:i===t.correct}))};}
function sim51RenderDetail(){const host=document.getElementById('sim51Details');if(!host)return;
 const id=STATE.sim.auditSelected,d=byId[id];if(!d||!STATE.found.has(id)){host.innerHTML='<p class="muted small">Wybierz zdobyty dokument z katalogu.</p>';return;}
 const {type,answers}=sim51Answers(id);const audited=sim51Audited(id),pathIndex=[0,1].includes(STATE.sim.auditPath)?STATE.sim.auditPath:0;
 const routes=SIM51_PATHS[id];if(!routes){host.innerHTML='<p>Brak reguły kontroli.</p>';return;}
 const routeUI=routes.map((path,i)=>`<button type="button" class="sim51-path ${i===pathIndex?'active':''} ${sim51HasRoute(id,i)?'ready':''}" data-audit-path="${i}" aria-pressed="${i===pathIndex}"><b>Metoda ${i?'B':'A'} · ${sim51HasRoute(id,i)?'źródła dostępne':'niepełna'}</b><span>${path.map(x=>STATE.found.has(x)?esc(docName(x))+' ✓':'Niepozyskany materiał ○').join(' + ')}</span></button>`).join('');
 const prev=STATE.sim.auditJudgments?.[id];host.innerHTML=`<div class="eyebrow">AKTA · ${esc(id)}</div><h3>${esc(d.title)}</h3><p class="muted small">Kategoria kontroli: ${esc(type.label)}. Rodzina źródła: ${esc(d.family||'brak')}.</p><div class="sim51-quality"><b>Waga bieżąca: ${Math.round(simQuality(id)*100)}%</b><span>${audited?'Zweryfikowano zakres źródła':SIM_DEGRADED[id]?'Materiał istotnie niepełny':'Przed weryfikacją — wiarygodność wstępna'}</span></div><h4>Dwa alternatywne sposoby kontroli</h4><p class="small muted">Wybierz jedną kompletną metodę. Materiały niezebrane nie zdradzają nazw przed ich odkryciem.</p><div class="sim51-paths">${routeUI}</div><label for="sim51Interpretation" class="small">Co wolno wywnioskować z tego materiału?</label><select id="sim51Interpretation" ${audited?'disabled':''}><option value="">— wybierz uzasadnienie —</option>${answers.map((a,i)=>`<option value="${i}">${esc(a.text)}</option>`).join('')}</select><button class="btn" type="button" data-audit-commit ${audited?'disabled':''}>${audited?'Źródło już zweryfikowane':`Zatwierdź analizę (${SIM_DEGRADED[id]?3:2} czasu)`}</button><p class="small muted">${esc(type.warning)} Próba na niekompletnych źródłach nie zużywa czasu; niepoprawna interpretacja obniża zaufanie.</p>${prev?`<p class="sim51-result ${prev.status==='accepted'?'good':'bad'}">${prev.status==='accepted'?'Ograniczenia materiału zostały prawidłowo opisane.':'Poprzedni wniosek wykraczał poza zakres materiału. Możesz go skorygować po kontroli.'}</p>`:''}`;
}
function sim51Render(){const root=document.getElementById('simAudit51');if(!root)return;
 const acquired=DOCS.filter(d=>STATE.found.has(d.id));const checked=acquired.filter(d=>sim51Audited(d.id)).length;
 const summary=document.getElementById('sim51Progress');if(summary)summary.innerHTML=`<b>${checked}/${acquired.length}</b><small>sprawdzone z pozyskanych</small><small>78 kart w całej sprawie</small>`;
 if(!STATE.sim.auditSelected||!STATE.found.has(STATE.sim.auditSelected))STATE.sim.auditSelected=acquired[0]?.id||'';
 const query=document.getElementById('sim51Search');if(query&&query.value!==(STATE.sim.auditFilter||''))query.value=STATE.sim.auditFilter||'';
 const filter=document.getElementById('sim51Filter');if(filter)filter.value=STATE.sim.auditStatus||'all';
 sim51RenderList();sim51RenderDetail();
}
function sim51Commit(){const s=STATE.sim,id=s.auditSelected;if(!SIM51_PATHS[id]||!STATE.found.has(id))return;
 if(sim51Audited(id))return toast('Ten materiał już zweryfikowano.');
 const path=[0,1].includes(s.auditPath)?s.auditPath:0;
 if(!sim51HasRoute(id,path))return toast('Ta droga kontroli wymaga dwóch pozyskanych źródeł pomocniczych.');
 const el=document.getElementById('sim51Interpretation'),index=Number(el?.value);
 if(!el?.value)return toast('Przed zatwierdzeniem wskaż zakres wniosku.');
 const answer=sim51Answers(id).answers[index];if(!answer)return;
 const cost=SIM_DEGRADED[id]?3:2;if(s.time<cost)return toast('Brak czasu śledczego na kontrolę. Rozważ przedłużenie postępowania.');
 s.auditJudgments||={};s.auditMistakes||=[];
 if(!answer.correct){s.auditJudgments[id]={status:'overclaim',path};s.auditMistakes.push({id,type:sim51Type(id)});s.auditMistakes=s.auditMistakes.slice(-40);simError(SIM51_TYPES[sim51Type(id)].warning,3,5);}
 else{simTime(cost,0,'Audyt '+docName(id)+' · ścieżka '+(path?'B':'A'));
  s.auditJudgments[id]={status:'accepted',path};s.verified.push(id);s.trial=null;toast('Weryfikacja ukończona: '+docName(id));}
 simRenderGraph();simRenderHearing();
}
// Stara stacja ekspertyz otwiera właściwy audyt z wyborem drogi i uzasadnienia.
// Brak automatycznego zatwierdzenia materiałów krytycznych po samym kliknięciu.
simVerify=function(id){
 if(!SIM51_PATHS[id]||!STATE.found.has(id))return toast('Najpierw zdobądź materiał i źródła kontroli.');
 if(sim51Audited(id))return toast('Ten materiał został już zweryfikowany.');
 STATE.sim.auditSelected=id;STATE.sim.auditPath=0;
 sim51Render();document.querySelector('#simAudit51')?.scrollIntoView({block:'start',behavior:'smooth'});
 toast('Wybierz metodę kontroli oraz poprawne ograniczenie wniosku.');
};
// Wspólna prezentacja i testy nie uznają samych progów procentowych za identyfikację sprawcy.
sim51Render();simRenderGraph();simRenderHearing();
window.PS_SIM_TEST.audit={paths:SIM51_PATHS,ready:sim51HasRoute,checked:sim51Audited,commit:sim51Commit,answers:sim51Answers};
