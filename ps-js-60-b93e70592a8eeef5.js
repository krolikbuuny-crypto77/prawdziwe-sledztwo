
/* Statystyki ukończenia: nowy moduł nie zmienia reguł walidacji ani oceny dowodów. */
(function(){
 'use strict';
 if(typeof STATE==='undefined'||typeof simTrial!=='function'||typeof buildSave!=='function'||typeof applySave!=='function')return;
 const MAX_DURATION_MS=365*24*60*60*1000;
 const RELEVANT_OBJECTIONS={
  intentional:['accident','contract','message','card','remote','traces'],
  planned:['accident','contract','message','card','remote','traces'],
  negligence:['accident','contract','traces'],
  sabotage:['contract','message','card'],
  complicity:['contract','message','card','remote']
 };
 let investigationStartedAt=null,activeDurationMs=0,visibleSince=null,successfulResult=null;
 // Czas pełny tylko dla nowych sesji. Starsze, nieukończone zapisy mierzymy od wznowienia.
 let timingCoverage='full'; // full | partial | unavailable
 // Trwała historia ocen obu trybów obrony. Błędy nie znikają po zmianie aktu.
 const DEFENSE_IDS=['accident','contract','message','card','remote','traces'];
 const createDefenseHistory=(incomplete=false)=>({version:2,incomplete,objections:{}});
 let defenseHistory=createDefenseHistory();
 function recordDefenseAttempt(id,stage,passed){
  if(!DEFENSE_IDS.includes(id))return;
  const entry=defenseHistory.objections[id]||(defenseHistory.objections[id]={attempts:0,errors:0,stages:{form:0,hearing:0}});
  entry.attempts++;
  if(!passed)entry.errors++;
  entry.stages[stage]=(entry.stages[stage]||0)+1;
 }
 function restoreDefenseHistory(stored){
  if(!stored||stored.version!==2||!stored.objections||typeof stored.objections!=='object')return createDefenseHistory(true);
  const history=createDefenseHistory(stored.incomplete===true);
  for(const id of DEFENSE_IDS){
   const raw=stored.objections[id];if(!raw||typeof raw!=='object')continue;
   const attempts=Number(raw.attempts),errors=Number(raw.errors);
   if(!Number.isSafeInteger(attempts)||attempts<0||attempts>100000||!Number.isSafeInteger(errors)||errors<0||errors>attempts){history.incomplete=true;continue;}
   const form=Number(raw.stages?.form||0),hearing=Number(raw.stages?.hearing||0);
   if(!Number.isSafeInteger(form)||form<0||!Number.isSafeInteger(hearing)||hearing<0||form+hearing!==attempts){history.incomplete=true;continue;}
   history.objections[id]={attempts,errors,stages:{form,hearing}};
  }
  return history;
 }

 let previouslyFocused=null;
 const isVisible=()=>document.visibilityState==='visible';
 function startInvestigation(){
  if(investigationStartedAt||successfulResult||isAcceptedFinal())return;
  // W starym zapisie nie da się odtworzyć czasu sprzed migracji.
  if(timingCoverage==='unavailable')timingCoverage='partial';
  investigationStartedAt=Date.now();
  visibleSince=isVisible()?performance.now():null;
 }
 function stopVisibleClock(){
  if(visibleSince!==null){
   activeDurationMs=Math.min(MAX_DURATION_MS,activeDurationMs+Math.max(0,performance.now()-visibleSince));
   visibleSince=null;
  }
 }
 function currentDuration(){
  return Math.max(0,Math.min(MAX_DURATION_MS,activeDurationMs+(visibleSince===null?0:Math.max(0,performance.now()-visibleSince))));
 }
 function getTimingCoverage(){return investigationStartedAt?timingCoverage:'unavailable';}
 function formatDuration(milliseconds){
  if(milliseconds===null||milliseconds===undefined)return 'Brak danych';
  const allSeconds=Math.floor(milliseconds/1000);
  const h=Math.floor(allSeconds/3600),m=Math.floor(allSeconds%3600/60),s=allSeconds%60;
  return h?`${h} godz. ${String(m).padStart(2,'0')} min`:`${m} min ${String(s).padStart(2,'0')} s`;
 }
 function isAcceptedFinal(){return STATE.sim?.trial?.kind==='solid'&&!!STATE.final13?.submitted;}
 function getRelevantObjections(){
  const qualification=window.PS_FINAL_VARIANTS?.choice?.()||STATE.final13?.qualification||'intentional';
  return window.PS_REASONING_ENGINE?.relevantObjections(qualification)||RELEVANT_OBJECTIONS[qualification]||RELEVANT_OBJECTIONS.intentional;
 }
 function getFirstTryDefenseCount(){
  const relevant=getRelevantObjections();
  if(defenseHistory.incomplete)return {firstTry:null,total:relevant.length,attempts:0,errors:0,complete:false};
  let firstTry=0,attempts=0,errors=0;
  for(const id of relevant){
   const history=defenseHistory.objections[id];
   if(history){attempts+=history.attempts;errors+=history.errors;}
   // Nie nagradzamy poprawnego finału, jeśli wcześniej odrzucono choć jedną próbę
   // w formularzu obrony lub w symulacji procesowej.
   if(!history||history.attempts<1||history.errors!==0)continue;
   const answer=STATE.sim?.process54?.arguments?.[id];
   if(!answer?.passed)continue;
   if(typeof ps54Result==='function'&&typeof PS54_MAP!=='undefined'){
    const issue=PS54_MAP.get(id);
    if(!issue||!ps54Result(issue,answer).passed)continue;
   }
   firstTry++;
  }
  return {firstTry,total:relevant.length,attempts,errors,complete:true};
 }
 function calculateSuccessfulResult(){
  if(!isAcceptedFinal())return null;
  const {firstTry,total,attempts,errors,complete}=getFirstTryDefenseCount();
  const evidenceCount=STATE.found.size;
  return {
   durationMs:investigationStartedAt?Math.round(currentDuration()):null,
   durationCoverage:getTimingCoverage(),
   startedAt:investigationStartedAt,
   finishedAt:Date.now(),
   collected:evidenceCount,
   evidenceTotal:typeof DOCS!=='undefined'?DOCS.length:78,
   firstTry,
   defenseTotal:total,
   defenseAttempts:attempts,
   defenseMistakes:errors,
   defenseHistoryComplete:complete,
   qualification:STATE.sim.trial.qualification||STATE.final13.qualification||'intentional'
  };
 }
 function getSuccessfulResult(){return isAcceptedFinal()?successfulResult:null;}
 function showSummary(){
  const result=getSuccessfulResult();if(!result)return;
  const overlay=document.getElementById('psaSummaryOverlay');if(!overlay)return;
  document.getElementById('psaTime').textContent=formatDuration(result.durationMs);
  document.getElementById('psaTimeLabel').textContent=result.durationCoverage==='partial'?'Czas od wznowienia':'Czas śledztwa';
  document.getElementById('psaEvidence').textContent=Math.round(result.collected/result.evidenceTotal*100)+'%';
  document.getElementById('psaEvidenceDetail').textContent=result.collected+' z '+result.evidenceTotal+' materiałów';
  document.getElementById('psaDefense').textContent=result.defenseHistoryComplete?result.firstTry+' / '+result.defenseTotal:'— / '+result.defenseTotal;
  document.getElementById('psaDefenseDetail').textContent=result.defenseHistoryComplete
   ?'Bez żadnej odrzuconej próby w obu etapach obrony ('+result.defenseAttempts+' ocen)'
   :'Starszy zapis: niepełna historia prób';
  document.getElementById('psaDurationDetail').textContent=result.durationMs===null
   ?'Starszy ukończony zapis: brak historycznego pomiaru'
   :result.durationCoverage==='partial'
    ?'Starszy zapis — pomiar rozpoczęty po wznowieniu, wcześniejszy czas nieznany'
    :'Zliczono czas aktywnej karty gry';
  previouslyFocused=document.activeElement;
  overlay.hidden=false;document.body.classList.add('psa-modal-open');
  document.getElementById('psaSummaryClose').focus();
 }
 function hideSummary(){
  const overlay=document.getElementById('psaSummaryOverlay');if(!overlay||overlay.hidden)return;
  overlay.hidden=true;document.body.classList.remove('psa-modal-open');
  if(previouslyFocused?.isConnected&&typeof previouslyFocused.focus==='function')previouslyFocused.focus();
 }
 function injectReplayButton(){
  const actions=document.querySelector('#psFinalEpilogue .ps-ep-actions');
  if(!actions||!isAcceptedFinal()||actions.querySelector('[data-psa-open]'))return;
  const button=document.createElement('button');button.type='button';button.className='psa-ep-open';
  button.dataset.psaOpen='';button.textContent='Pokaż osiągnięcia śledztwa';actions.prepend(button);
 }
 function captureVictory(){
  if(!isAcceptedFinal())return false;
  // Nie wytwarzamy czasu w chwili samego rozstrzygnięcia: pomiar zaczyna się od czynności gracza.
  successfulResult=calculateSuccessfulResult();
  stopVisibleClock();injectReplayButton();return true;
 }
 function validNumber(v,min,max){return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
 
 /* SaveManager: buildSave hook. */
registerSaveHook({name:"60-success-statistics-save1", build(__save){
  const save=__save;
  save.caseAchievements={version:3,startedAt:investigationStartedAt,timingCoverage:timingCoverage,activeDurationMs:Math.round(currentDuration()),
   defenseHistory:JSON.parse(JSON.stringify(defenseHistory)),
   victory:getSuccessfulResult()?{...successfulResult}:null};
  return save;
 }});
 
 /* SaveManager: applySave hook. */
registerSaveHook({name:"60-success-statistics-load1", beforeApply(){hideSummary();},apply(data){
  const result=undefined;
  const stored=data?.caseAchievements;
  defenseHistory=restoreDefenseHistory(stored?.defenseHistory);
  // Migracja wersji 2 oraz plików sprzed pomiaru czasu, bez szacowania nieznanej przeszłości.
  const hasStoredStart=validNumber(stored?.startedAt,1577836800000,Date.now()+60000);
  const hasStoredDuration=validNumber(stored?.activeDurationMs,0,MAX_DURATION_MS);
  const isVersion3=stored?.version===3;
  investigationStartedAt=hasStoredStart?stored.startedAt:null;
  activeDurationMs=hasStoredStart&&hasStoredDuration?stored.activeDurationMs:0;
  if(isVersion3){
   const coverage=stored?.timingCoverage;
   timingCoverage=hasStoredStart
    ?(coverage==='partial'?'partial':coverage==='full'?'full':'partial')
    :(coverage==='full'?'full':coverage==='partial'?'partial':'unavailable');
  }else if(stored?.version===2){
   // Wersja 2: niezaczęta nowa gra pozostaje pełnym pomiarem;
   // starszy brak danych (timingUnavailable) oznacza czas od wznowienia.
   timingCoverage=stored.timingUnavailable===true
     ?(hasStoredStart?'partial':'unavailable'):'full';
  }else timingCoverage='unavailable';
  successfulResult=null;
  // Zakończonych sesji nie wznawiamy; widoczna karta nie dopisuje sekund do werdyktu.
  visibleSince=investigationStartedAt&&!isAcceptedFinal()&&isVisible()?performance.now():null;
  if(isAcceptedFinal()){
   const victory=stored?.victory;
   if(victory&&(stored?.version===2||stored?.version===3)&&
      validNumber(victory.collected,0,typeof DOCS!=='undefined'?DOCS.length:78)&&
      validNumber(victory.defenseTotal,1,6)&&
      victory.qualification===(STATE.sim.trial.qualification||STATE.final13.qualification||'intentional')){
    const defense=getFirstTryDefenseCount();
    const victoryHasDuration=validNumber(victory.durationMs,0,MAX_DURATION_MS);
    const snapshotCoverage=stored.version===3
      ?(victory.durationCoverage==='partial'?'partial':victory.durationCoverage==='full'?'full':'unavailable')
      :(victoryHasDuration&&investigationStartedAt?timingCoverage:'unavailable');
    successfulResult={...victory,
      firstTry:defense.firstTry,defenseTotal:defense.total,
      defenseAttempts:defense.attempts,defenseMistakes:defense.errors,
      defenseHistoryComplete:defense.complete,
      durationMs:victoryHasDuration&&snapshotCoverage!=='unavailable'?victory.durationMs:null,
      durationCoverage:victoryHasDuration?snapshotCoverage:'unavailable'};
   }else successfulResult=calculateSuccessfulResult();
   stopVisibleClock();
  }
  injectReplayButton();return result;
 }});
 const formerReset=psReset;
 psReset=function(){const result=formerReset.apply(this,arguments);
  hideSummary();investigationStartedAt=null;activeDurationMs=0;visibleSince=null;successfulResult=null;timingCoverage='full';defenseHistory=createDefenseHistory();
  return result;
 };
 // Formularz konfrontacji: rejestrujemy ocenę dopiero po zatwierdzeniu odpowiedzi.
 const formerCheckChallenge=fcCheckChallenge;
 fcCheckChallenge=function(id){
  const before=STATE.final13.checks||0;
  const result=formerCheckChallenge.apply(this,arguments);
  if((STATE.final13.checks||0)>before){
   const challenge=FC_CHALLENGES.find(item=>item.id===id);
   if(challenge)recordDefenseAttempt(id,'form',fcChallengeAssessment(challenge,STATE.final13.answers[id]).ok);
  }
  return result;
 };
 // Zbiorcza weryfikacja również ocenia odpowiedzi, których nie sprawdzano pojedynczo.
 document.getElementById('fcVerdict')?.addEventListener('click',()=>{
  if(!STATE.final13.submitted)return;
  for(const challenge of FC_CHALLENGES){
   const answer=STATE.final13.answers[challenge.id];
   // Puste pole to brak próby, nie błędna odpowiedź.
   if(!answer||(answer.strategy===''&&!answer.ids?.length&&!answer.text))continue;
   recordDefenseAttempt(challenge.id,'form',fcChallengeAssessment(challenge,answer).ok);
  }
 });
 // Symulacja: zachowujemy również pierwsze nieudane interpretacje (nie tylko 80
 // ostatnich pozycji z dziennika). Odrzucona próba nigdy nie jest wymazywana.
 const formerProcessDecision=ps54Decision;
 ps54Decision=function(id){
  const decisions=STATE.sim?.process54?.decisions;
  const before=decisions?.[decisions.length-1];
  const result=formerProcessDecision.apply(this,arguments);
  const afterDecisions=STATE.sim?.process54?.decisions;
  const last=afterDecisions?.[afterDecisions.length-1];
  if(last&&last!==before&&last.id===id){
   recordDefenseAttempt(id,'hearing',last.correct===true);
  }
  return result;
 };
 const formerTrial=simTrial;
 simTrial=function(){
  const before=isAcceptedFinal();
  const result=formerTrial.apply(this,arguments);
  if(isAcceptedFinal()&&!before&&captureVictory())showSummary();
  else if(!isAcceptedFinal())successfulResult=null;
  PS_EVENTS.finale();
  injectReplayButton();return result;
 };
 const formerRenderHearing=simRenderHearing;
 simRenderHearing=function(){const result=formerRenderHearing.apply(this,arguments);injectReplayButton();return result;};
 // Weryfikowalny początek pomiaru: pierwsza akcja w module, nie sama wizyta w menu.
 // Po wznowieniu starszej gry nie zliczamy czasu spędzonego na ekranie importowania zapisu.
 document.addEventListener('click',event=>{
  const target=event.target.closest?.('button,a');if(!target)return;
  const tab=target.dataset?.tab||target.dataset?.go||target.dataset?.ps2Go;
  if((tab&&tab!=='overview')||target.matches('#ux6StartNow,#ps2Welcome button[data-ps2-go],#chatSend,#searchBtn')||
     (target.closest('#mainContent section.active:not(#overview)')&&!target.closest('#psResumeOffer')))
   startInvestigation();
 },true);
 document.addEventListener('input',event=>{
  if(event.target.closest?.('#mainContent section.active:not(#overview)'))startInvestigation();
 },true);
 document.addEventListener('visibilitychange',()=>{
  if(!investigationStartedAt||successfulResult)return;
  if(isVisible()){if(visibleSince===null)visibleSince=performance.now();}else stopVisibleClock();
 });
 window.addEventListener('pagehide',stopVisibleClock);
 window.addEventListener('pageshow',()=>{if(investigationStartedAt&&!successfulResult&&visibleSince===null&&isVisible())visibleSince=performance.now();});
 const overlay=document.createElement('div');overlay.id='psaSummaryOverlay';overlay.className='psa-backdrop';overlay.hidden=true;
 overlay.innerHTML=`<section class="psa-dialog" role="dialog" aria-modal="true" aria-labelledby="psaSummaryTitle" aria-describedby="psaSummaryDescription">
   <header class="psa-head"><div class="psa-eyebrow">AKTA ZAMKNIĘTE · SUKCES ŚLEDCZEGO</div><button type="button" class="psa-close" id="psaSummaryClose" aria-label="Zamknij podsumowanie">×</button><h2 id="psaSummaryTitle">Sprawa zakończona sukcesem</h2><p id="psaSummaryDescription">Akt oskarżenia został utrzymany po kontroli dowodów i obrony. Oto statystyki Twojego śledztwa.</p></header>
   <div class="psa-stats"><div class="psa-stat"><strong class="psa-stat-value" id="psaTime">—</strong><span class="psa-stat-label" id="psaTimeLabel">Czas śledztwa</span><small class="psa-stat-sub" id="psaDurationDetail"></small></div>
   <div class="psa-stat"><strong class="psa-stat-value" id="psaEvidence">—</strong><span class="psa-stat-label">Odkryte materiały</span><small class="psa-stat-sub" id="psaEvidenceDetail"></small></div>
   <div class="psa-stat"><strong class="psa-stat-value" id="psaDefense">—</strong><span class="psa-stat-label">Zarzuty bez pomyłek</span><small class="psa-stat-sub" id="psaDefenseDetail"></small></div></div>
   <footer class="psa-bottom"><p class="psa-note">Bez pomyłek oznacza brak odrzuconych ocen w obu etapach obrony: formularzu aktu i symulacji procesowej. Brak pełnej historii w starszym zapisie oznaczamy zamiast zgadywać wynik. Podsumowanie nie zmienia oceny aktu ani epilogu.</p><div class="psa-actions"><button type="button" id="psaSummaryEpilogue">Przejdź do epilogu</button><button type="button" id="psaSummaryDismiss">Zamknij podsumowanie</button></div></footer></section>`;
 document.body.append(overlay);
 overlay.addEventListener('click',event=>{if(event.target===overlay)hideSummary();});
 document.getElementById('psaSummaryClose').addEventListener('click',hideSummary);
 document.getElementById('psaSummaryDismiss').addEventListener('click',hideSummary);
 document.getElementById('psaSummaryEpilogue').addEventListener('click',()=>{hideSummary();showTab('final');document.getElementById('psFinalEpilogue')?.scrollIntoView({block:'start',behavior:'smooth'});});
 document.addEventListener('click',event=>{if(event.target.closest('[data-psa-open]'))showSummary();});
 document.addEventListener('keydown',event=>{
  if(overlay.hidden)return;
  if(event.key==='Escape'){event.preventDefault();hideSummary();return;}
  if(event.key==='Tab'){
   const controls=[...overlay.querySelectorAll('button:not([disabled])')];const index=controls.indexOf(document.activeElement);
   if(event.shiftKey&&index<=0){event.preventDefault();controls[controls.length-1].focus();}
   else if(!event.shiftKey&&index===controls.length-1){event.preventDefault();controls[0].focus();}
  }
 });
 window.PS_CASE_ACHIEVEMENTS={start:startInvestigation,status:()=>({startedAt:investigationStartedAt,activeDurationMs:currentDuration(),durationCoverage:getTimingCoverage(),victory:getSuccessfulResult(),isVisible:!overlay.hidden,defenseHistory:JSON.parse(JSON.stringify(defenseHistory))}),open:showSummary,close:hideSummary,formatDuration};
})();
/* Ostatni moduł: jedno wiązanie UI z niezmiennym interfejsem silnika. */
WitnessEngine.installUI();
/* Etap 4 — wspólne reguły źródeł, dedukcji, kontradyktoryjnej obrony i finału.
 * Zachowujemy dotychczasowe testy fabularne (żadnych automatycznych wniosków
 * o winie), a publiczne wywołania kierujemy do jednego, jawnego kontrolera.
 * Ten moduł jest ładowany PO historycznych rozszerzeniach i jest ich jedyną
 * końcową bramą oceny. Wersja zapisu nie ulega zmianie.
 */
const ReasoningEngine = (() => {
 'use strict';
 const previous=Object.freeze({reasoning:dd7Reasoning,audit:dd2Audit,case:simCaseAssessment,defense:simDefendEvaluation});
 const qualifications=Object.freeze({
  intentional:Object.freeze(['accident','contract','message','card','remote','traces']),
  planned:Object.freeze(['accident','contract','message','card','remote','traces']),
  negligence:Object.freeze(['accident','contract','traces']),
  sabotage:Object.freeze(['contract','message','card']),
  complicity:Object.freeze(['contract','message','card','remote'])
 });
 const roles=Object.freeze(['supports','refutes','limits','context']);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function relevantObjections(qualification){return [...(qualifications[qualification]||qualifications.intentional)];}
 function source(key){
  const id=String(key||'');
  const s=dedAvailable().get(id);
  if(!s)return null;
  if(s.type==='doc'&&(!s.docId||!STATE.found.has(s.docId)))return null;
  // A testimony is usable only if it still belongs to this session.
  if(s.type==='say'&&!CONTENT.characters.some(c=>c.id===s.charId))return null;
  return s;
 }
 function document(id,{requireVerified=false,adversarial=false}={}){
  if(typeof id!=='string'||!own(byId,id)||!STATE.found.has(id))return {ok:false,reason:'uncollected',id};
  if(requireVerified&&!simIsVerified(id))return {ok:false,reason:'unverified',id};
  if(adversarial){
   if(['overclaim','ignored'].includes(STATE.sim.auditJudgments?.[id]?.status))return {ok:false,reason:'disputed',id};
   if(simQuality(id)<=.8)return {ok:false,reason:'low-quality',id};
  }
  return {ok:true,id,family:byId[id]?.family||id,quality:simQuality(id)};
 }
 function independent(ids,{requireVerified=false}={}){
  const evaluations=[...new Set(Array.isArray(ids)?ids:[])].map(id=>document(id,{requireVerified}));
  return {ok:evaluations.length>=2&&evaluations.every(x=>x.ok)&&new Set(evaluations.map(x=>x.family)).size>=2,
   families:new Set(evaluations.filter(x=>x.ok).map(x=>x.family)).size,documents:evaluations};
 }
 function reasoning(card){
  const result=previous.reasoning(card);
  const issues=[...result.issues];
  const links=Array.isArray(card?.links)?card.links:[];
  const missing=links.filter(l=>!source(l?.source));
  if(missing.length)issues.push('Niektóre powiązania odnoszą się do niezebranych lub już niedostępnych źródeł.');
  const duplicate=links.some((l,i)=>links.findIndex(p=>p?.source===l?.source)!==i);
  if(duplicate)issues.push('Źródło występuje wielokrotnie na jednej karcie — nie jest niezależnym potwierdzeniem.');
  return {...result,ok:result.ok&&issues.length===0,issues:[...new Set(issues)]};
 }
 function audit(card){
  const result=previous.audit(card),ready=reasoning(card);
  const issues=[...new Set([...result.issues,...ready.issues])];
  // The numeric score must not claim a fully verified thesis if the common
  // prerequisite checker rejects it. Keep the old scoring for valid claims.
  const score=!ready.ok?Math.min(73,result.score):result.score;
  const status=!ready.ok&&result.status==='dobrze uzasadniona'?'wymaga sprawdzenia':result.status;
  let text=result.text;
  if(score!==result.score||status!==result.status){
   text=text.replace(/^Ocena uzasadnienia:.*?\n/,`Ocena uzasadnienia: ${score}/100 (${status}).\n`);
  }
  const appended=issues.filter(x=>!result.issues.includes(x));
  if(appended.length)text+='\nDodatkowa kontrola dowodów:\n'+appended.map(x=>'• '+x).join('\n');
  return {...result,score,status,issues,text};
 }
 function linkHypothesis({cardId,sourceKey,role='supports',note='',remove=false}){
  const state=STATE.deduction,card=state.cards.find(c=>c.id===cardId),s=source(sourceKey);
  if(!card)throw Error('Nieznana hipoteza.');
  if(!s)throw Error('Źródło nie jest dostępne w aktach tej sesji.');
  if(state.dirty)throw Error('Najpierw zapisz lub odrzuć zmiany w edytorze hipotezy.');
  if(!remove&&(!roles.includes(role)||typeof note!=='string'||note.trim().length<12))
   throw Error('Powiązanie wymaga roli i uzasadnienia (co najmniej 12 znaków).');
  const index=card.links.findIndex(l=>l.source===sourceKey);
  if(!remove&&index<0&&card.links.length>=24)throw Error('Limit: 24 źródła na hipotezę.');
  if(index>=0)card.links.splice(index,1);
  if(!remove)card.links.push({source:sourceKey,role,note:note.trim().slice(0,850)});
  if(state.selected===card.id){state.draft=JSON.parse(JSON.stringify(card));state.dirty=false;}
  dedRender();
  PS_EVENTS.hypothesis(cardId,reasoning(card));
  return {cardId,sourceKey,linked:!remove};
 }
 function defense(){
  // This is the sole current grading path for ALL six challenges. Any locked
  // evidence, wrong interpretation or revoked verification fails at ps54Result.
  const responses=FC_CHALLENGES.map(q=>{
   const issue=PS54_MAP.get(q.id);
   const ent=ps54Entry(q.id);
   const outcome=issue?ps54Result(issue,ent):{passed:false,score:0};
   return {id:q.id,title:q.title,nodes:SIM_OBJECTION_NODES[q.id]||[],method:ent.method,
    passed:!!outcome.passed,limited:ent.method==='limits',route:ent.route,score:outcome.score||0};
  });
  return {responses,passed:responses.filter(r=>r.passed).length,all:responses.every(r=>r.passed),weak:responses.filter(r=>!r.passed).map(r=>r.title)};
 }
 function caseAssessment(){return previous.case();} // Existing plot, timeline and procedural gates remain authoritative.
 function finalAssessment(){return window.PS_FINAL_VARIANTS?.evaluate?.()||null;}
 function inspect(){return {version:1,sourceCount:dedAvailable().size,cardCount:STATE.deduction.cards.length,
  qualifications:Object.keys(qualifications),objectionCount:FC_CHALLENGES.length,
  timelineIssues:simTimelineIssues().length,defense:defense().passed};}
 return Object.freeze({version:1,source,document,independent,reasoning,audit,linkHypothesis,
  defense,caseAssessment,finalAssessment,relevantObjections,inspect});
})();
// Stable public entrypoints: other modules call these names, never other ad-hoc evaluators.
dd7Reasoning=function(d){return ReasoningEngine.reasoning(d);};
dd2Audit=function(d){return ReasoningEngine.audit(d);};
simDefendEvaluation=function(){return ReasoningEngine.defense();};
simCaseAssessment=function(){return ReasoningEngine.caseAssessment();};
window.PS_REASONING_ENGINE=ReasoningEngine;
/* Subskrypcje UI i cyklu życia. Jedna koalescencja renderingów niezależnie
 * od liczby dokumentów powstałych w jednym zatwierdzeniu raportu. */
(()=>{
 'use strict';
 let refreshQueued=false;
 const notifyEvidence=()=>{
  if(refreshQueued)return;
  refreshQueued=true;
  requestAnimationFrame(()=>{
   refreshQueued=false;
   if(PS_EVENTS.inspect().paused)return;
   try{
    if(STATE.tab==='evidence')renderDocs();else renderCounts();
    renderAttached();
    tcmsRefresh();msgRefresh();cctvRefresh();forensicRefresh();accessRefresh();
    if(STATE.tab==='labs')window.UX5_LABS?.status?.();
    if(STATE.tab==='deduction')dedRender();
    if(typeof ui14ScheduleUpdate==='function')ui14ScheduleUpdate();
   }catch(error){console.error('[EventBus/UI] Błąd odświeżenia akt',error);}
  });
 };
 PS_EVENTS.on('evidenceCollected','ui-evidence-and-laboratory-gates',notifyEvidence);
 PS_EVENTS.on('laboratoryCompleted','ui-laboratory-hub',()=>{
  if(STATE.tab==='labs')window.UX5_LABS?.status?.();
 });
 PS_EVENTS.on('timelineVerified','ui-timeline-on-confirmation',()=>{
  if(STATE.tab==='timeline')tlRender();
 });
 PS_EVENTS.on('hypothesisEvaluated','ui-hypothesis-board',()=>{
  if(STATE.tab==='deduction')dedRender();
 });
 PS_EVENTS.on('witnessBreakthrough','ui-psychological-breakthrough',()=>{
  if(STATE.tab==='interview')renderChat();
 });
 PS_EVENTS.on('indictmentSubmitted','ui-procedural-finale',()=>{
  if(STATE.tab==='final')simRenderHearing();
 });
 PS_EVENTS.on('caseCompleted','ui-final-stats',()=>{
  // The existing Stage-4 victory screen remains the owner of the modal.
  window.PS70_ARC?.render?.();
 });
 // Restore is atomic: no phantom discoveries, breakthroughs or victory events.
 registerSaveHook({name:'stage5-event-bus-lifecycle',
  beforeApply(){PS_EVENTS.pause();PS_EVENTS.resetSession();},
  apply(){PS_EVENTS.resume();},
  onApplyError(){PS_EVENTS.resume();}
 });
})();
/* Pakiet 6.1 — uproszczenie dostępu do modułów i drugorzędnych skrótów.
   Warstwa prezentacji: nie modyfikuje STATE, zapisów, dowodów ani warunków sprawy. */
(()=>{'use strict';
 const init=()=>{
 const mobile=window.matchMedia('(max-width: 1000px)');
 const bar=document.querySelector('.sv2-mobile-nav');
 if(!bar)return;
 const buttons=Array.from(bar.querySelectorAll('[data-sv2-tab]'));
 const menu=document.createElement('div');
 menu.id='ps61Navigation';menu.className='ps61-navigation';
 menu.setAttribute('role','group');menu.setAttribute('aria-label','Bieżący moduł i nawigacja');
 const current=document.createElement('div');current.className='ps61-current';
 const eyebrow=document.createElement('span');eyebrow.textContent='AKTUALNY MODUŁ';
 const title=document.createElement('strong');title.id='ps61CurrentModule';
 current.append(eyebrow,title);
 const trigger=document.createElement('button');trigger.type='button';trigger.className='ps61-menu-button';
 trigger.id='ps61MenuButton';trigger.setAttribute('aria-controls','ps61ModuleMenu');
 trigger.setAttribute('aria-expanded','false');trigger.textContent='Moduły (10)';
 menu.append(current,trigger);bar.before(menu);
 bar.id='ps61ModuleMenu';
 const labelFor=id=>buttons.find(button=>button.dataset.sv2Tab===id)?.getAttribute('aria-label') || id;
 let opened=false;
 const selected=()=>window.STATE?.tab||document.querySelector('.section.active')?.id||'overview';
 function sync(){title.textContent=labelFor(selected());}
 function setOpen(next,{restoreFocus=false}={}){
  opened=Boolean(next)&&mobile.matches;
  menu.classList.toggle('ps61-open',opened);
  bar.classList.toggle('ps61-open',opened);
  trigger.setAttribute('aria-expanded',String(opened));
  bar.setAttribute('aria-hidden',String(mobile.matches&&!opened));
  bar.inert=mobile.matches&&!opened;
  if(restoreFocus)trigger.focus({preventScroll:true});
 }
 trigger.addEventListener('click',()=>setOpen(!opened));
 bar.addEventListener('click',event=>{
  if(!event.target.closest('[data-sv2-tab]'))return;
  setOpen(false);sync();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&opened){event.preventDefault();setOpen(false,{restoreFocus:true});}
 });
 document.addEventListener('pointerdown',event=>{
  if(opened&&!menu.contains(event.target)&&!bar.contains(event.target))setOpen(false);
 });
 function viewport(){if(!mobile.matches)setOpen(false);else setOpen(opened);sync();}
 mobile.addEventListener?.('change',viewport);
 if(typeof registerNavigationHook==='function')registerNavigationHook({name:'package61-navigation-clarity',after:()=>{sync();setOpen(false);}});
 viewport();
 // Optional in-section shortcuts: keep existing buttons, but reduce competing actions.
 // Details stays open on desktop; on mobile it starts collapsed and is never saved.
 const containers=[];
 for(const section of document.querySelectorAll('.section')){
  const shortcuts=section.querySelector(':scope .sv2-subnav');
  if(!shortcuts||shortcuts.querySelectorAll('button').length===0)continue;
  const wrap=document.createElement('details');wrap.className='ps61-secondary-shortcuts';
  const summary=document.createElement('summary');summary.textContent='Skróty do części modułu';
  shortcuts.before(wrap);wrap.append(summary,shortcuts);containers.push(wrap);
 }
 const syncDetails=()=>{for(const el of containers)if(!mobile.matches)el.open=true;};
 mobile.addEventListener?.('change',syncDetails);syncDetails();
 // Existing assistance button is the only global entry point on handheld devices.
 // Improving its accessible name does not create a second help workflow.
 const help=document.getElementById('ux6HelpButton');
 if(help){help.setAttribute('aria-label','Otwórz plan śledztwa i wskazówki');help.title='Plan śledztwa i wskazówki';}
 window.PS_UX61={inspect:()=>({current:selected(),menuOpen:opened,secondarySections:containers.length}),openMenu:()=>setOpen(true),closeMenu:()=>setOpen(false)};
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
/* Pakiet 6.4 — następstwa śledztwa.
 * Tylko ustalenia zweryfikowane przez PS69/PS85 oraz pytania naprawdę wysłane.
 * Dziennik nie przyznaje dowodów, nie zmienia emocji NPC, hipotez ani werdyktu.
 */
(function(){
 'use strict';
 if(!window.PS85_STORY||!window.PS69_STORY||!window.PS_WITNESS_ENGINE||typeof STATE==='undefined')return;
 const $=id=>document.getElementById(id);
 const persons=new Map(CONTENT.characters.map(c=>[c.id,c.name]));
 const threads=[
  {id:'work',title:'Nocna decyzja a stan wagonu',consequence:'Odpowiedzialność za ruch i dokumentację warsztatową trzeba ocenić oddzielnie. Jedna decyzja nie wyjaśnia tragedii Leny.',
   prompts:[['MAREK','Co wyjaśnia zestawienie dyspozycji kursu wagonu z dokumentacją warsztatu?'],['JANUSZ','Co wynika z różnicy między kartą warsztatu a decyzją o kursie wagonu?']]},
  {id:'warning',title:'Ostrzeżenie i formalny odbiór',consequence:'Ślad obawy nie oznacza formalnego przyjęcia zgłoszenia, a zatwierdzony odbiór nie rozstrzyga, kto znał ostrzeżenie.',
   prompts:[['ELZBIETA','Dlaczego zgłoszenie BHP i dokument odbioru pokazują różne informacje?'],['MAGDALENA','Jak wyjaśnisz rozbieżności między zgłoszeniem BHP a protokołem odbioru?']]},
  {id:'access',title:'Alibi z systemów elektronicznych',consequence:'Rejestr karty i sesja konta są śladami operacji, a nie fotografią osoby. Zgodność czasu nie potwierdza tożsamości.',
   prompts:[['KAMIL','Dlaczego karta T-17 i sesja audytu nie mogą potwierdzić alibi jednej osoby?'],['MAGDALENA','Co wynika z zestawienia karty dostępu i sesji audytu dla twojego alibi?']]},
  {id:'lastcontact',title:'Kolejność kursu i wiadomości',consequence:'Między dyspozycją a kontaktem z Leną zostaje luka, której nie wolno wypełniać domysłem o obecności.',
   prompts:[['TOMASZ','Czy powrót wagonu i późniejsza wiadomość do Leny mają wspólną chronologię?'],['MAREK','Jaki związek ma decyzja o powrocie kursu z późniejszą wiadomością Leny?']]},
  {id:'mechanism',title:'Kontakt a mechanizm obrażeń',consequence:'Rekonstrukcja urazów wymaga własnych źródeł. Ostatnia wiadomość nie identyfikuje osoby, która była przy Lenie.',
   prompts:[['ELZBIETA','Co wiadomo z ostatniej wiadomości Leny i analizy obrażeń, a czego nadal nie wiemy?'],['MAGDALENA','Czy ostatni kontakt z Leną i charakter obrażeń potwierdzają przebieg zdarzenia?']]},
  {id:'faultline',title:'Dwa obiegi, dwa zaniedbania',consequence:'Warsztat i procedury BHP wskazują możliwe odrębne zaniedbania. Ich suma nadal nie stanowi dowodu przemocy.',
   prompts:[['MAREK','Czy dyspozycja kursu i protokół warsztatu były znane mimo wcześniejszego zgłoszenia BHP?'],['ELZBIETA','Jak zgłoszenie BHP łączy się z warsztatem i zatwierdzeniem odbioru wagonu?']]},
  {id:'presence',title:'Alibi a ostatni kontakt',consequence:'Dwa zgodne zegary nie opisują automatycznie tej samej osoby. Potrzebna jest niezależna identyfikacja.',
   prompts:[['KAMIL','Czy karta T-17 i późniejsza wiadomość do Leny mogą ustalić czyjąś obecność?'],['MAGDALENA','Czy sesja audytu oraz późniejszy kontakt z Leną potwierdzają alibi?']]},
  {id:'boundary',title:'Granica rekonstrukcji',consequence:'Najbardziej spójna opowieść musi ustąpić granicom dokumentów i zeznań; kontakt nie jest dowodem sprawstwa.',
   prompts:[['MAGDALENA','Czy kolejność wiadomości do Leny i analiza obrażeń mogą ustalić odpowiedzialność za śmierć?'],['ELZBIETA','Co mówi ostatni kontakt z Leną i opinia o obrażeniach, a czego nie potwierdza?']]}
 ];
 const byId=new Map(threads.map(t=>[t.id,t]));
 const clean=s=>String(s||'').normalize('NFC').toLocaleLowerCase('pl').replace(/\s+/g,' ').trim().replace(/[?!.]+$/,'');
 function availability(){return new Set(window.PS85_STORY.available());}
 function spoken(id,question){
  const log=STATE.dialogues?.[id]||[];
  for(let i=0;i<log.length;i++){
   const msg=log[i];if(msg?.role!=='player')continue;
   const actual=String(msg.text||'').split('\n[Okazano:')[0];
   if(clean(actual)!==clean(question))continue;
   const reply=log[i+1];
   return {asked:true,answered:reply?.role==='npc'&&!!String(reply.text||'').trim()};
  }
  return {asked:false,answered:false};
 }
 const panel=document.createElement('section');
 panel.id='ps64Consequences';panel.className='surface padded ps64-panel';panel.hidden=true;
 panel.setAttribute('aria-label','Następstwa śledztwa');
 panel.innerHTML='<div class="ps64-title"><div><div class="eyebrow">PO ODKRYCIU</div><h3>Dziennik następstw</h3><p>Sprawdzaj, jak zmienia się znaczenie faktów po rozmowach z różnymi osobami. Zapis pytania nie oznacza potwierdzenia tezy.</p></div><strong id="ps64Count" aria-live="polite"></strong></div><div id="ps64Items" class="ps64-items"></div><details id="ps64More" hidden><summary>Pozostałe zweryfikowane wątki</summary><div id="ps64Rest" class="ps64-items"></div></details>';
 // Mount outside the collapsed advanced tools container; otherwise this panel stays invisible.
 const advanced=$('ux4Advanced');
 if(advanced)advanced.insertAdjacentElement('afterend',panel);else $('deduction')?.append(panel);
 const teaser=document.createElement('section');
 teaser.id='ps64Teaser';teaser.className='ps64-teaser';teaser.hidden=true;
 teaser.innerHTML='<div><strong id="ps64TeaserHeading">Następstwa śledztwa</strong><p id="ps64TeaserText"></p></div><button class="btn alt" type="button" id="ps64TeaserGo">Otwórz dziennik</button>';
 const pulse=$('ps85Pulse')||$('ps70Pulse');
 if(pulse)pulse.insertAdjacentElement('afterend',teaser);else $('overview')?.append(teaser);
 $('ps64TeaserGo').addEventListener('click',()=>{showTab('deduction');$('ps64Consequences')?.scrollIntoView({block:'start',behavior:'auto'});});
 function promptFor(id,who){const t=byId.get(id);return t?.prompts.find(([c])=>c===who)?.[1]||'';}
 function ask(id,who){
  const available=availability(),question=promptFor(id,who),field=$('chatInput');
  if(!available.has(id)||!persons.has(who)||!question||!field)return;
  if(field.value.trim()&&clean(field.value)!==clean(question)){
   showTab('interview');
   if(typeof toast==='function')toast('W polu jest już przygotowane pytanie. Wyślij je lub wyczyść przed wybraniem następnego.');
   field.focus();return;
  }
  STATE.activeChar=who;showTab('interview');
  window.PS_MOBILE_WORKSPACES?.setInterviewView('chat');
  field.value=question;renderChat();field.focus({preventScroll:true});
 }
 function makeCard(t){
  const row=document.createElement('article');row.className='ps64-item';
  const reached=t.prompts.map(([who,q])=>[who,spoken(who,q)]);
  const done=reached.filter(([,s])=>s.answered).length;
  const header=document.createElement('div');header.className='ps64-cardtop';
  const name=document.createElement('h4');name.textContent=t.title;
  const count=document.createElement('span');count.className='ps64-status';count.textContent=done===2?'Porównano dwie odpowiedzi':done===1?'Jedna rozmowa w aktach':'Dalsze pytania otwarte';
  header.append(name,count);
  const why=document.createElement('p');why.textContent=t.consequence;
  const actions=document.createElement('div');actions.className='ps64-actions';
  for(const [who,question] of t.prompts){
   const state=spoken(who,question);const button=document.createElement('button');button.className='btn alt';button.type='button';
   button.textContent=state.answered?`Ponów rozmowę: ${persons.get(who)}`:`Zapytaj: ${persons.get(who)}`;
   button.setAttribute('aria-label',button.textContent+'; pytanie zostanie przygotowane, nie wysłane');
   button.dataset.ps64Thread=t.id;button.dataset.ps64Witness=who;
   const status=document.createElement('small');status.className='ps64-route';status.textContent=state.answered?'Pytanie i odpowiedź zapisane':state.asked?'Pytanie zapisane, bez odpowiedzi':'Nie zadano proponowanego pytania';
   const wrap=document.createElement('div');wrap.append(button,status);actions.append(wrap);
  }
  const foot=document.createElement('p');foot.className='ps64-foot';
  foot.textContent=done===2?'Dwie odpowiedzi można teraz porównać w aktach. Ich zgodność nie stanowi samodzielnego dowodu.':done===1?'Po jednej rozmowie pozostaje druga perspektywa. Oceniaj zeznania w granicach dostępnych źródeł.':'Wybór jedynie przygotuje pytanie w przesłuchaniu. Każdą odpowiedź ocenisz samodzielnie.';
  row.append(header,why,actions,foot);return row;
 }
 function render(){
  const open=availability(),known=threads.filter(x=>open.has(x.id));
  panel.hidden=!known.length;teaser.hidden=!known.length;
  if(!known.length)return;
  let asked=0,total=0;
  for(const t of known)for(const [who,q] of t.prompts){total++;if(spoken(who,q).answered)asked++;}
  $('ps64Count').textContent=asked+' / '+total+' odpowiedzi';
  $('ps64TeaserHeading').textContent=known.length===1?'Pojawiło się nowe następstwo':'Następstwa zweryfikowanych odkryć';
  $('ps64TeaserText').textContent=`${known.length} ${known.length===1?'wątek jest dostępny':'wątków jest dostępnych'}, ${asked} z ${total} proponowanych rozmów zapisano. Dziennik nie zastępuje oceny dowodów.`;
  const primary=$('ps64Items'),rest=$('ps64Rest');primary.replaceChildren();rest.replaceChildren();
  // Unasked angles rise to the top. Already examined cases remain reachable without scrolling through them first.
  const sorted=known.slice().sort((a,b)=>{
   const aDone=a.prompts.filter(([who,q])=>spoken(who,q).answered).length;
   const bDone=b.prompts.filter(([who,q])=>spoken(who,q).answered).length;
   return aDone-bDone||threads.indexOf(a)-threads.indexOf(b);
  });
  for(const [index,t] of sorted.entries())(index<2?primary:rest).append(makeCard(t));
  $('ps64More').hidden=sorted.length<=2;
 }
 panel.addEventListener('click',event=>{
  const b=event.target.closest('button[data-ps64-thread][data-ps64-witness]');
  if(!b)return;ask(b.dataset.ps64Thread,b.dataset.ps64Witness);
 });
 let queued=false;
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
 registerNavigationHook({name:'package-64-consequences',after:schedule});
 for(const type of ['evidenceCollected','hypothesisEvaluated','witnessBreakthrough','caseCompleted']){
  PS_EVENTS.on(type,'package-64-'+type,schedule);
 }
 const send=WitnessEngine.snapshotSend();
 registerWitnessSendLayer('package-64-consequence-journal',function(){const result=send.apply(this,arguments);schedule();return result;});
 // Derived from already-persisted sources and chat transcripts; no extra mutable or migratable save structure.
 registerSaveHook({name:'package-64-consequences-save-cycle',apply:schedule});
 window.PS64_CONSEQUENCES=Object.freeze({available:()=>threads.filter(t=>availability().has(t.id)).map(t=>t.id),
  status:id=>{const t=byId.get(id);if(!t||!availability().has(id))return null;return t.prompts.map(([who,q])=>({witness:who,...spoken(who,q)}));},
  prompt:promptFor,render,prepare:ask});
 render();
})();
/* Pakiet 6.8 — pamięć długoterminowa KANONICZNYCH, lokalnych zeznań.
 * Nie jest źródłem prawdy o sprawie. Zapisywane pytania są wypowiedziami gracza,
 * a cytowane odpowiedzi — wcześniej wypowiedzianymi zeznaniami świadka.
 * Faktów i bramek fabularnych nigdy nie zmienia ten moduł. */
const PS68_MEMORY = (() => {
 'use strict';
 const IDS=CONTENT.characters.map(c=>c.id),TOPICS=[
  ['alibi',/\b(?:alibi|gdzie\s+(?:byl\w*|przebywal\w*)|obecnos\w*|dyzur\w*|zmian\w*|widzian\w*|kto\s+potwierdzi\w*)/],
  ['timeline',/\b(?:godzin|kiedy|ktorej|czas|kolejno|potem|wczesniej|przed|po\s+alarm)/],
  ['lena',/\b(?:lena|leny|lene|rudnick|ofiara|ostatni\s+kontakt)/],
  ['work',/\b(?:prac|obowiaz|zadani|stanowisk|kierow|sluzb)/],
  ['safety',/\b(?:bhp|zagrozen|awari|ryzyk|uster|bezpieczen|zgloszen)/],
  ['document',/\b(?:raport|rejestr|karta|dokument|protokol|audyt|akta)/],
  ['technical',/\b(?:tcms|log|wagon|diagnost|kamera|nagran|sesj)/],
  ['relation',/\b(?:relacj|rozmow|znal|spotk|przyjazn|konflikt)/],
  ['action',/\b(?:zrobil|podjal|zareagow|dlaczego|czemu|decyzj)/]
 ];
 const clean=(s,n=580)=>String(s??'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
 const fold=s=>{let v=clean(s,1100).toLocaleLowerCase('pl');try{v=v.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}return v.replace(/ł/g,'l');};
 const empty=()=>({turn:0,episodes:[],anchors:{}});
 const data=Object.fromEntries(IDS.map(id=>[id,empty()]));
 const refs=Object.fromEntries(IDS.map(id=>[id,STATE.dialogues[id]]));
 const PROTECTED=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE']);
 function checkSession(id){if(refs[id]!==STATE.dialogues[id]){data[id]=empty();refs[id]=STATE.dialogues[id];}}
 function topic(q,base=''){
  const n=fold(q);
  // 6.28: Subject and affirmative intent take precedence over incidental/negated entities.
  // 'Nie pytam o ostatnie spotkanie z Leną, tylko o TWOJE miejsce pobytu' => alibi.
  if(/\b(?:twoj\w*|pana|pani|swoj\w*|twoje|wlasn\w*)\s+(?:miejsce\s+pobyt\w*|pobyt\w*|alibi)\b/.test(n)||
     /\b(?:gdzie|dokad)\s+(?:ty\s+|pan\s+|pani\s+)?(?:byl\w*|przebywal\w*|znajdowal\w*\s+sie)\b/.test(n)||
     /\b(?:gdzie\s+(?:sie\s+)?znajdowal\w*|co\s+(?:ty|pan|pani)\s+robil\w*|potwierdzi\w*\s+(?:twoj\w*|pana|pani)\s+obecnos\w*)\b/.test(n))return 'alibi';
  const withoutRejected=n.replace(/\b(?:nie\s+(?:pytam|chodzi|mowie)\s+o|nie\s+o)\s+[^,.!?;]*(?=[,.!?;]|$)/g,' ');
  const candidates=withoutRejected.trim()||n;
  if(/\bmiejsce\s+pobyt\w*\b/.test(candidates)&&
     !/\bmiejsce\s+pobyt\w*\s+(?:len\w*|rudnick\w*|ofiary|marka|kamila|tomasza|janusza)\b/.test(candidates))return 'alibi';
  const match=TOPICS.find(([,re])=>re.test(candidates));
  if(match)return match[0];
  const known=fold(base);const same=TOPICS.find(([,re])=>re.test(known));
  return same?same[0]:'general';
 }
 function status(id){const m=NPC9_MEMORY?.[id],last=m?.semantic?.at(-1);return PROTECTED.has(last?.status)?last.status:'STATEMENT';}
 function record(id,question,canonical){
  if(!Object.prototype.hasOwnProperty.call(data,id))return;
  checkSession(id);
  const q=clean(question,260),a=clean(canonical,680);
  if(!q||!a||a.length<8||isRecall(q))return;
  const m=data[id],found=STATE.dialogues[id];
  // Zapisujemy wyłącznie zakończoną turę lokalną, nie komunikaty użytkownika bez odpowiedzi.
  if(!Array.isArray(found)||found.at(-1)?.role!=='npc'||found.at(-2)?.role!=='player')return;
  const last=m.episodes.at(-1);
  if(last&&last.q===q&&last.a===a&&last.dialogueLength===found.length)return;
  const turn=++m.turn,kind=status(id),t=topic(q,NPC9_MEMORY?.[id]?.lastFocus?.topic||'');
  const row={turn,topic:t,q,a,canonical:a,kind,dialogueLength:found.length};
  m.episodes.push(row);if(m.episodes.length>80)m.episodes.splice(0,m.episodes.length-80);
  const x=m.anchors[t]||{first:null,last:null,count:0};
  if(!x.first)x.first={turn,a,canonical:a,kind};
  x.last={turn,a,canonical:a,kind};x.count=Math.min(1000000,x.count+1);
  m.anchors[t]=x;
  // Sprostowanie dotyczy danego zagadnienia: starsze twierdzenie nadal jest
  // historią zeznania, ale nie wolno udawać, że jest aktualnym stanowiskiem.
 }
 const recallRE=/\b(?:przypomnij|przypomni|powiedzial\w*\s+(?:pan|pani|mi|wczesniej)|mowil\w*\s+(?:pan|pani|wczesniej)|wspominal\w*\s+(?:pan|pani)|wrocmy\s+do|wracajac\s+do|co\s+(?:pan|pani)\s+(?:mowil|powiedzial)|wczesniejsze\s+zeznani|poprzednie\s+zeznani)\b/;
 const sensitiveRE=/\b(?:dowod|przyznaj|przyznal|zabil|zaboj|morder|szantaz|konfront|oskarz|falszow|klam|zeznan\s+pod\s+przysiega|dokument\s+pokaz|protokol\s+konfront)\b/;
 const isRecall=q=>recallRE.test(fold(q));
 function relevant(id,query,limit=8){
  checkSession(id);
  const m=data[id], t=topic(query),seen=new Set(),result=[];
  const push=r=>{if(!r||!r.a||seen.has(r.turn)||result.length>=limit)return;seen.add(r.turn);result.push({...r});};
  const a=m.anchors[t];
  if(a){push({...a.last,topic:t});if(a.first?.turn!==a.last?.turn)push({...a.first,topic:t});}
  if(t==='general'&&isRecall(query)){
   for(const ep of m.episodes.slice(-12).reverse())push(ep);
  }else{
   for(const ep of m.episodes.slice().reverse())if(ep.topic===t)push(ep);
  }
  return result.slice(0,limit);
 }
 function context(id,question){
  const rows=relevant(id,question,8);
  return rows.map(r=>({turn:r.turn,topic:r.topic,statement:clean(r.a,520),status:r.kind==='CORRECTION_WITH_EVIDENCE'?'sprostowane':'wcześniejsze zeznanie'}));
 }
 function approvedAnchors(id,question,limit=8){
  // Tylko dosłowne lokalne wypowiedzi. Pierwotne, później sprostowane twierdzenia
  // nie stają się samodzielnie używalnymi źródłami odpowiedzi.
  return relevant(id,question,limit).filter(r=>{
   const x=data[id].anchors[r.topic];
   // Domyślnie tylko najnowsza wersja zeznania; cytat starszej wolno
   // przywołać przy wyraźnym pytaniu o historię wypowiedzi.
   if(!isRecall(question)&&x&&x.last.turn!==r.turn)return false;
   return r.kind!=='CONFESSION'&&(!x||x.last?.kind!=='CORRECTION_WITH_EVIDENCE'||x.last.turn===r.turn);
  });
 }
 function canonicalAnchors(id,question,limit=8){
  return approvedAnchors(id,question,limit).map(x=>({...x,a:x.canonical||x.a}));
 }
 function recallReply(id,q){
  if(!isRecall(q)||sensitiveRE.test(fold(q)))return '';
  const rows=relevant(id,q,3);if(!rows.length)return '';
  const first=rows[0];
  // Przy sprostowaniu pokazuj najnowsze stanowisko, a nie wcześniejsze, obalone słowa.
  const current=data[id].anchors[first.topic]?.last;
  const shown=current?.kind==='CORRECTION_WITH_EVIDENCE'?current:first;
  const name=CONTENT.characters.find(c=>c.id===id),female=name?.gender==='f';
  const intro=shown.kind==='CORRECTION_WITH_EVIDENCE'?'Później to sprostowałam: ':'Wcześniej powiedziałam: ';
  return (female?intro:intro.replace('sprostowałam','sprostowałem').replace('powiedziałam','powiedziałem'))+'„'+shown.a+'”';
 }
 const oldAnswer=WitnessEngine.snapshotAnswer();
 registerWitnessAnswerLayer('68-long-term-recall',function(c,q,attached){
  const id=c?.id;const before=id&&WitnessEngine.valid(id)?WitnessEngine.inspectWitness(id):null;
  const oldConfront=NPC9_MEMORY?.[id]?.confronted?.length||0;
  const base=oldAnswer.apply(this,arguments);
  if(!id||attached||before?.psychological?.blocked||NPC9_MEMORY?.[id]?.confronted?.length!==oldConfront||
    PROTECTED.has(NPC9_MEMORY?.[id]?.semantic?.at(-1)?.status)||sensitiveRE.test(fold(q)))return base;
  const output=recallReply(id,q);if(!output||output===base)return base;
  const mem=NPC9_MEMORY?.[id],turn=mem?.turn;
  const semantic=mem?.semantic?.slice().reverse().find(x=>x.turn===turn&&x.answer===base&&!PROTECTED.has(x.status));
  const statement=mem?.statements?.slice().reverse().find(x=>x.turn===turn&&x.text===base&&!PROTECTED.has(x.status));
  if(semantic){semantic.answer=output;semantic.topic='recall';}
  if(statement){statement.text=output;statement.topic='recall';}
  const s=NPC4_STATE?.[id];if(s?.recent?.length&&s.recent.at(-1).answer===fold(base))s.recent.at(-1).answer=fold(output).slice(0,1550);
  return output;
 });
 const oldSend=WitnessEngine.snapshotSend();
 registerWitnessSendLayer('68-canonical-memory',function(){
  const id=STATE.activeChar,log=STATE.dialogues[id],len=log?.length||0;
  const q=String(document.getElementById('chatInput')?.value||'').trim();
  const result=oldSend.apply(this,arguments);
  if(Array.isArray(log)&&log.length===len+2&&log.at(-1)?.role==='npc'&&log.at(-2)?.role==='player')
   record(id,log.at(-2).text||q,log.at(-1).text);
  return result;
 });
 function discardUnanswered(id, dialogueLength){
  checkSession(id);
  const m=data[id];if(!m)return;
  const before=m.episodes.length;
  m.episodes=m.episodes.filter(x=>x.dialogueLength!==dialogueLength);
  if(before===m.episodes.length)return;
  m.anchors={};
  for(const ep of m.episodes){
   const a=m.anchors[ep.topic]||{first:null,last:null,count:0};
   const x={turn:ep.turn,a:ep.a,canonical:ep.canonical,kind:ep.kind};
   if(!a.first)a.first={...x};a.last={...x};a.count++;m.anchors[ep.topic]=a;
  }
  m.turn=m.episodes.at(-1)?.turn||0;
 }
 // Reconcile the pending local draft after the async provider has replied.
 // Keep corrections protected and never alter the game's canonical fact ledger.
 function finalize(id,question,original,displayed,log){
  if(!Object.prototype.hasOwnProperty.call(data,id)||refs[id]!==log)return false;
  const m=data[id],last=m.episodes.at(-1);
  const q=clean(question,260),oldA=clean(original,680),newA=clean(displayed,680);
  if(!last||!newA||last.dialogueLength!==log.length||last.q!==q||last.a!==oldA)return false;
  last.canonical=last.canonical||oldA;last.a=newA;
  const anchor=m.anchors[last.topic];
  if(anchor?.first?.turn===last.turn){anchor.first.canonical=anchor.first.canonical||oldA;anchor.first.a=newA;}
  if(anchor?.last?.turn===last.turn){anchor.last.canonical=anchor.last.canonical||oldA;anchor.last.a=newA;}
  return true;
 }
 // Nie zmieniamy schematu SaveManager. Każda sesja posiada osobny, bounded rejestr.
 registerSaveHook({name:'stage68-long-term-memory',
  build(out){
   out.ps68={version:1,witnesses:Object.fromEntries(IDS.map(id=>{
    checkSession(id);const m=data[id];return [id,{turn:m.turn,
     episodes:m.episodes.map(({turn,topic,q,a,canonical,kind,dialogueLength})=>({turn,topic,q,a,canonical:canonical||a,kind,dialogueLength})),
     anchors:m.anchors}];
   }))};
  },
  apply(raw){
   const incoming=raw?.ps68?.version===1?raw.ps68.witnesses:null;
   for(const id of IDS){
    const v=incoming?.[id],m=empty();
    if(v&&typeof v==='object'){
     const valid=(r)=>r&&Number.isSafeInteger(r.turn)&&r.turn>=1&&r.turn<=1000000&&
       typeof r.a==='string'&&r.a.length<=680&&typeof r.topic==='string'&&['general',...TOPICS.map(x=>x[0])].includes(r.topic)&&
       ['STATEMENT','CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(r.kind);
     m.episodes=(Array.isArray(v.episodes)?v.episodes:[]).slice(-80).filter(r=>valid(r)&&typeof r.q==='string'&&r.q.length<=260)
       .map(r=>({turn:r.turn,topic:r.topic,q:clean(r.q,260),a:clean(r.a,680),canonical:clean(r.canonical||r.a,680),kind:r.kind,dialogueLength:Math.max(0,Math.min(1000000,Number(r.dialogueLength)||0))}));
     for(const [t,x] of Object.entries(v.anchors&&typeof v.anchors==='object'&&!Array.isArray(v.anchors)?v.anchors:{})){
      if(!['general',...TOPICS.map(y=>y[0])].includes(t)||!x||!valid({...x.first,topic:t})||!valid({...x.last,topic:t}))continue;
      m.anchors[t]={first:{turn:x.first.turn,a:clean(x.first.a,680),canonical:clean(x.first.canonical||x.first.a,680),kind:x.first.kind},
       last:{turn:x.last.turn,a:clean(x.last.a,680),canonical:clean(x.last.canonical||x.last.a,680),kind:x.last.kind},count:Math.max(1,Math.min(1000000,Number(x.count)||1))};
     }
     m.turn=Math.max(m.episodes.at(-1)?.turn||0,...Object.values(m.anchors).map(x=>x.last.turn),0);
     // 6.28: fix older episodes attributed to 'lena' because a *negated*
     // aside mentioned Lena. Rebuild only those affected anchors from original utterances.
     let corrected=false;
     for(const ep of m.episodes){
      const resolved=topic(ep.q);
      if(ep.topic==='lena'&&resolved==='alibi'){ep.topic='alibi';corrected=true;}
     }
     if(corrected){
      m.anchors={};
      for(const ep of m.episodes){
       const a=m.anchors[ep.topic]||{first:null,last:null,count:0};
       const x={turn:ep.turn,a:ep.a,canonical:ep.canonical,kind:ep.kind};
       if(!a.first)a.first={...x};a.last={...x};a.count++;m.anchors[ep.topic]=a;
      }
     }
     // Migrate v6.25 saved sessions: the dialogue already contains the displayed
     // answer while this legacy episode could still contain the local draft.
     const dialogue=STATE.dialogues[id]||[];
     for(const ep of m.episodes){
      const n=ep.dialogueLength;if(n<2||n>dialogue.length)continue;
      const played=dialogue[n-2],spoken=dialogue[n-1];
      if(played?.role!=='player'||spoken?.role!=='npc'||clean(played.text,260)!==ep.q)continue;
      ep.a=clean(spoken.text,680);
      const anchor=m.anchors[ep.topic];
      if(anchor?.first?.turn===ep.turn)anchor.first.a=ep.a;
      if(anchor?.last?.turn===ep.turn)anchor.last.a=ep.a;
     }
    }
    data[id]=m;refs[id]=STATE.dialogues[id];
   }
  }
 });
 return Object.freeze({recordApproved:record,context,approvedAnchors,canonicalAnchors,recallReply,finalize,discardUnanswered,inspect:()=>Object.fromEntries(IDS.map(id=>{checkSession(id);return [id,{episodes:data[id].episodes.length,topics:Object.keys(data[id].anchors).length,turn:data[id].turn}];}))});
})();
window.PS68_MEMORY=PS68_MEMORY;
/* Pakiet 6.5: tylko informacje już dopuszczone przez lokalny silnik mogą trafić do AI.
   Profil psychologiczny jest opisowy; dowody, bramki i reakcje emocjonalne pozostają lokalne. */
const PS65_CONTEXT = (() => {
 'use strict';
 const clean=(v,n=500)=>String(v??'').replace(/[<>\u0000-\u001f]/g,' ').trim().slice(0,n);
 const bounded=(v)=>Math.max(0,Math.min(100,Number(v)||0));
 const people=Object.fromEntries(CONTENT.characters.map(c=>[c.id,c]));

 // Pakiet 6.7: osobny dziennik KANONICZNYCH odpowiedzi lokalnego silnika.
 // Tekst przeredagowany przez chmurę NIE staje się automatycznie nowym faktem.
 const approved=Object.fromEntries(CONTENT.characters.map(c=>[c.id,[]]));
 const canonicalApproved=Object.fromEntries(CONTENT.characters.map(c=>[c.id,[]]));
 const logRefs=Object.fromEntries(CONTENT.characters.map(c=>[c.id,STATE.dialogues[c.id]]));
 const trim=(s,n=900)=>clean(s,n);
 function remember(id,answer,log){
  if(!Object.prototype.hasOwnProperty.call(approved,id))return;
  // Reset rozgrywki wymienia tablice dialogów (import ma własny hook poniżej).
  if(logRefs[id]!==log){approved[id]=[];canonicalApproved[id]=[];logRefs[id]=log;}
  const text=trim(answer,1400);
  if(!text)return;
  const items=approved[id];
  if(items.at(-1)?.dialogueLength===log.length)return;
  const turn=items.length?items.at(-1).turn+1:1;
  items.push({text,turn,dialogueLength:log.length});canonicalApproved[id].push({text,turn,dialogueLength:log.length});
  if(items.length>36)items.splice(0,items.length-36);
  if(canonicalApproved[id].length>36)canonicalApproved[id].splice(0,canonicalApproved[id].length-36);
 }
 const certainty=text=>/\b(?:nie wiem|nie jestem pew|nie pamiętam|nie potrafię|nie mogę potwierdzić|chyba|wydaje mi się|być może|możliwe|prawdopodobnie|nie widziałem|nie widziałam)\b/i.test(text)?'qualified':'statement';
 function clauses(text){
  // Segmentuj tylko na granicach zdań, nie rozcinaj wypowiedzi w środku zależności.
  const chunks=trim(text,1500).split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/u).map(x=>trim(x,380)).filter(x=>x.length>=12);
  return chunks.length?chunks.slice(0,5):[trim(text,380)].filter(x=>x.length>=12);
 }
 function facts(canonical,voice,id,question){
  const bank=[],seen=new Set();let bytes=0;
  function add(text,origin,source){
   for(const clause of clauses(text)){
    const key=clause.toLocaleLowerCase('pl').replace(/\s+/g,' ');
    const size=new TextEncoder().encode(clause).length;
    if(seen.has(key)||bank.length>=36||bytes+size>8300)continue;
    seen.add(key);bytes+=size;
    bank.push({id:'f'+bank.length,text:clause,origin,source,certainty:certainty(clause)});
   }
  }
  add(canonical,'current','turn');
  for(const key of ['opening','alibi','what_happened','last_seen','witness'])add(voice[key]||'','public','public-'+key);
  // The canonical shadow of 6.8 episodes is never replaced by AI wording.
  for(const x of window.PS68_MEMORY?.canonicalAnchors(id,question,7)||[])add(x.a,'prior-local','journal-'+x.turn);
  // Only immutable local originals may become fact-bank inputs. Displayed AI
  // testimony can be recalled, but is never elevated to a new canonical fact.
  for(const x of canonicalApproved[id].slice(-26).reverse())add(x.text,'prior-local','journal-'+x.turn);
  return window.PS611_NLU?.rankFacts(bank,question)||bank;
 }
 // Rozszerzenie formatu zapisów bez zmiany v2 SaveManager ani starej struktury.
 registerSaveHook({name:'stage67-approved-testimony',
  build(data){data.ps67={version:1,approved:Object.fromEntries(Object.entries(approved).map(([id,rows])=>[id,rows.slice(-36)])),
    canonical:Object.fromEntries(Object.entries(canonicalApproved).map(([id,rows])=>[id,rows.slice(-36)]))};},
  apply(data){
   const entries=data?.ps67?.version===1?data.ps67.approved:null;
   for(const id of Object.keys(approved)){
    approved[id]=Array.isArray(entries?.[id])?entries[id].slice(-36).filter(x=>x&&typeof x.text==='string'&&Number.isSafeInteger(x.turn)&&x.turn>0)
       .map(x=>({text:trim(x.text,1400),turn:x.turn,dialogueLength:Number(x.dialogueLength)||0})):[];
    const canonRows=data?.ps67?.canonical?.[id];
    canonicalApproved[id]=Array.isArray(canonRows)?canonRows.slice(-36).filter(x=>x&&typeof x.text==='string'&&Number.isSafeInteger(x.turn)&&x.turn>0)
     .map(x=>({text:trim(x.text,1400),turn:x.turn,dialogueLength:Number(x.dialogueLength)||0})):approved[id].map(x=>({...x}));
    // 6.25 migration: the old approved ledger contains canonical drafts. Repair
    // its displayed side from the actual transcript, retaining canonical originals.
    if(!Array.isArray(canonRows)){
     const visible=(STATE.dialogues[id]||[]).filter(x=>x.role==='npc').slice(1).slice(-approved[id].length);
     if(visible.length===approved[id].length)approved[id]=approved[id].map((x,i)=>({...x,text:trim(visible[i].text,1400)}));
    }
    logRefs[id]=STATE.dialogues[id];
   }
  }
 });

 function discardUnanswered(id, dialogueLength){
  // A provisional local draft is not an actual witness testimony when cloud AI fails.
  if(!Object.prototype.hasOwnProperty.call(approved,id))return;
  approved[id]=approved[id].filter(x=>x.dialogueLength!==dialogueLength);
  canonicalApproved[id]=canonicalApproved[id].filter(x=>x.dialogueLength!==dialogueLength);
 }
 function read(id, canonical, question, previousTurns){
  const c=people[id], p=NPC9_PROFILES[id], s=NPC4_STATE[id], m=NPC9_MEMORY[id];
  if(!c||!p||!s||!m||typeof canonical!=='string')return null;
  const dialogue=(STATE.dialogues[id]||[]);
  remember(id,canonical,dialogue);
  const publicLines=dialogue.filter(x=>x.role==='npc' && typeof x.text==='string').slice(-7)
     .map(x=>clean(x.text,550));
  const heard=dialogue.filter(x=>x.role==='player'||x.role==='npc').slice(-12)
     .map(x=>({role:x.role==='npc'?'witness':'investigator',text:clean(x.text,420)}));
  const otherNames=CONTENT.characters.filter(x=>x.id!==id);
  const corpus=(heard.map(x=>x.text).join(' ')).toLocaleLowerCase('pl');
  // Nie przesyłaj nieujawnionych opisów relacji z profilu (mogą zawierać fabularne sekrety).
  // W modelu pojawiają się tylko osoby rzeczywiście przywołane w dialogu, bez ukrytej motywacji.
  const relations=otherNames.filter(x=>corpus.includes(x.name.toLocaleLowerCase('pl')))
    .slice(0,4).map(x=>({person:x.name,role:clean(x.role,80),context:'Osoba wspomniana w dotychczasowej rozmowie; charakter relacji wymaga potwierdzenia wypowiedzią świadka.'}));
  const psych=typeof ps52Witness==='function'?ps52Witness(c):null;
  const issueRecords=psych?.issues||{};
  const contradictions=(p.confrontations||[]).filter(x=>issueRecords[x.id]?.resolved)
    .map(x=>({topic:clean(PS52_THREADS?.[x.id]?.title||x.id,100),status:'sprostowanie już dokonane'})).slice(0,8);
  const br=window.PS_BREAKTHROUGH?.state(id);
  const phase=['neutral','fractured','reconsidering','guarded','closed'].includes(br?.phase)?br.phase:'neutral';
  const explicitEvidence=(Array.isArray(m.shown)?m.shown:[]).filter(x=>{
    const identifier=typeof x==='string'?x:x?.id;
    return typeof identifier==='string'&&STATE.found.has(identifier);
  }).slice(-8).map(x=>clean(typeof x==='string'?x:x.id,100));
  // Wybór odpowiedzi poprzedza formułowanie języka przez AI.
  // Bank zawiera WYŁĄCZNIE bezpieczne wypowiedzi otwarcia/alibi/obserwacji,
  // kanoniczną odpowiedź z bieżącej tury i fakty JUŻ wypowiedziane.
  // Nigdy nie przesyłamy surowego NPC9.knowledge, sekretów relacji ani przełomów.
  const options=[{id:'turn',text:clean(canonical,1900),kind:'current'}];
  const seen=new Set([clean(canonical,1900)]);
  const voice=p.voice_examples||{};
  for(const key of ['opening','alibi','what_happened','last_seen','witness']){
   const line=clean(voice[key],750);
   if(line&& !seen.has(line)) {options.push({id:'public-'+key,text:line,kind:'public'});seen.add(line);}
  }
  // Earlier testimony is usable only because the witness has ALREADY said it.
  // The local engine continues to own all unlocks and evidence gates.
  for(const [i,line] of publicLines.entries()){
   if(line&&!seen.has(line)){options.push({id:'said-'+i,text:line,kind:'said'});seen.add(line);}
  }
  // Hidden NPC9.knowledge entries, future facts, unrevealed contradictions and notes never leave the browser.
  return {
   schema:'ps-witness-context/1',
   identity:{id:c.id,name:clean(c.name,80),role:clean(c.role,100)},
   personality:{temperament:clean(p.temperament,320),diction:(p.diction||[]).slice(0,3).map(x=>clean(x,220)),
    speakingStyle:(NPC4_TRAITS[id]?.voice||[]).slice(0,3).map(x=>clean(x,130))},
   knowledge:{currentGroundedAnswer:clean(canonical,1900),alreadySaid:publicLines,
    groundedOptions:options,
    factBank:facts(canonical,voice,id,question),
    documentsShown:explicitEvidence,limits:[
     'Nie zgaduj, kto popełnił przestępstwo, i nie opisuj scen, których świadek nie obserwował.',
     'Jeśli wiedza pochodzi z dokumentu albo relacji, oddziel ją od własnej obserwacji.',
     'Nie ujawniaj przyszłych dowodów, nieukończonych konfrontacji ani cudzych zeznań.'
    ]},
   relations,
   emotions:{stress:bounded(s.tension),trust:bounded(s.rapport),fatigue:bounded(s.fatigue),mood:clean(s.mood,70),
    stance:clean(s.stance,30),tone:clean(s.lastTone,40)},
   psychology:{blocked:!!simWitness(c).blocked,phase,
    tactic:clean(psych?.tactic||'free',30),contradictions,pressureCount:Math.max(0,Math.min(100,s.pressures||0))},
   memory:{turn:Math.max(0,Math.min(100000,m.turn||0)),focus:clean(m.lastFocus?.topic||s.lastTopic||'',65),
    conversation:heard,longTerm:(window.PS68_MEMORY?.context(id,question)||[]).slice(0,6),previousTurns:Math.max(0,Math.min(100000,previousTurns||0))},
   request:{question:clean(question,1600),semanticPlan:window.PS611_NLU?.analyze(question)||null}
  };
 }
 function finalize(id,original,displayed,log){
  if(!Object.prototype.hasOwnProperty.call(approved,id)||!Array.isArray(log))return false;
  if(logRefs[id]!==log){approved[id]=[];canonicalApproved[id]=[];logRefs[id]=log;}
  if(approved[id].at(-1)?.dialogueLength!==log.length)remember(id,original,log);
  if(!approved[id]?.length)return false;
  const row=approved[id].at(-1);
  // A different turn or reset must never rewrite earlier testimony.
  if(row.dialogueLength!==log.length||row.text!==trim(original,1400))return false;
  row.text=trim(displayed,1400);
  return true;
 }
 return Object.freeze({read,finalize,discardUnanswered,inspect:()=>Object.fromEntries(Object.entries(approved).map(([id,rows])=>[id,rows.length]))});
})();
window.PS65_CONTEXT=PS65_CONTEXT;
/* Pakiet 6.5: Z.ai formułuje język świadka, nigdy zdarzenia ani wynik śledztwa.
   Ta warstwa musi być ostatnią warstwą wysyłania w manifest.json. */
(function(){
 'use strict';
 if(typeof simSendChat!=='function'||typeof STATE==='undefined'||!STATE.dialogues)return;
 const previous=WitnessEngine.snapshotSend();
 const by=id=>document.getElementById(id);
 const URL='/api/interview';
 const online=/^https?:$/.test(location.protocol);
 const normTokens=s=>String(norm(s)).split(/[^a-z0-9]+/).filter(Boolean);
 const numeric=s=>[...String(s).matchAll(/\b\d+(?::\d+)?(?:[.,]\d+)?\b/g)].map(m=>m[0]).sort().join('|');
 const negations=new Set(['nie','nigdy','brak','bez','zaden','zadna','zadnych','tylko','jedynie','nikogo','niczego','nikt']);
 const forbiddenNew=/\b(?:zabilem|zabilam|zamordowalem|zamordowalam|przyznaje\s+sie|ukrylem\s+cialo|widzialem\s+zabojstwo|zniszczylem\s+dowody)\b/;
 const uncertain=/\b(?:nie wiem|nie pamiętam|nie jestem pew|nie mogę potwierdzić|nie potrafię|chyba|może|możliwe|wydaje mi się|prawdopodobnie|według|podobno)\b/;
 const emergency=/\b(?:odmawiam|pelnomocnik|nie bede dalej odpowiadac|nie moge potwierdzic wniosku z tego materialu)\b/;
 function safeRewrite(canonical, proposed){
  if(typeof proposed!=='string'||proposed.length<12||proposed.length>1650||/[<>\u0000-\u0008\u000e-\u001f]/.test(proposed))return false;
  if(numeric(canonical)!==numeric(proposed))return false;
  const a=normTokens(canonical),b=normTokens(proposed);
  if(!a.length||!b.length)return false;
  const negative=x=>x.filter(t=>negations.has(t)).sort().join('|');
  if(negative(a)!==negative(b))return false;
  if(forbiddenNew.test(norm(proposed))&&!forbiddenNew.test(norm(canonical)))return false;
  const distinct=new Set(a.filter(x=>x.length>=5));
  const coverage=[...distinct].filter(x=>b.includes(x)).length/Math.max(1,distinct.size);
  const extra=new Set(b.filter(x=>x.length>=5&&!distinct.has(x)));
  // Wersja 6.5 nie rozluźnia bramek semantycznych przy parafrazie.
  return coverage>=0.85&&extra.size<=Math.max(3,Math.floor(distinct.size*.20));
 }
 function semanticGuard(source,proposed){
  if(typeof proposed!=='string'||proposed.length<12||proposed.length>1650||/[<>\u0000-\u0008\u000e-\u001f]/.test(proposed))return false;
  if(numeric(source)!==numeric(proposed))return false;
  if(uncertain.test(norm(source))&&!uncertain.test(norm(proposed)))return false;
  if(/\b(?:nie|nigdy|nikt|nikogo|niczego|zaden|zadna|bez|brak)\b/.test(norm(source)) &&
   !/\b(?:nie|nigdy|nikt|nikogo|niczego|zaden|zadna|bez|brak)\b/.test(norm(proposed)))return false;
  if(forbiddenNew.test(norm(proposed))&&!forbiddenNew.test(norm(source)))return false;
  // Walidacja znaczenia po stronie serwera pozostaje wymagana; te kontrole są drugą barierą.
  return true;
 }
 // Forma autonomicznego wyrażenia emocji: model wybiera gotową, zatwierdzoną
 // przez grę frazę. Rdzeń faktograficzny pozostaje dokładnie taki, jak lokalne zeznanie.
 const prefaces=Object.freeze({
  MAREK:['','Proszę to zapisać dokładnie. ','To nie jest proste pytanie. '],
  TOMASZ:['','Spróbuję to uporządkować. ','Tak to zapamiętałem. '],
  JANUSZ:['','Powiem bez owijania. ','Zostańmy przy faktach. '],
  ELZBIETA:['','Postaram się to wyjaśnić. ','Proszę mi pozwolić dokończyć. '],
  KAMIL:['','Od strony technicznej wygląda to tak. ','Po kolei. '],
  MAGDALENA:['','Precyzyjnie rzecz ujmując. ','Zaznaczę jedną rzecz. ']
 });
 let pending=null;
 const status=document.createElement('div');status.id='ps77-response-wait';status.setAttribute('aria-live','polite');
 status.className='ps18-response-status';status.setAttribute('role','status');status.style.cssText='';status.hidden=true;
 by('chatInput')?.closest('.chatfoot')?.appendChild(status);
 let inflight=false,requestSerial=0,cloudFailure='';
 let retryTurn=null;
 const TURN_STORAGE='ps_ai_retry_turn_v636';
 const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const uuid=()=>window.crypto?.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
  const b=window.crypto?.getRandomValues?.(new Uint8Array(1))?.[0]??Math.floor(Math.random()*256);
  return (c==='x'?b%16:(b%4+8)).toString(16);
 });
 function restoreDraftObject(target,before,after){
  if(!target||!before||!after)return;
  for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
   if(equal(before[key],after[key])||!equal(target[key],after[key]))continue;
   if(Object.prototype.hasOwnProperty.call(before,key))target[key]=copy(before[key]);else delete target[key];
  }
 }
 function takeDraft(c){return {n4:copy(NPC4_STATE?.[c.id]),n9:copy(NPC9_MEMORY?.[c.id]),
  sim:copy(STATE.sim),events:copy(STATE.events),stage:copy(window.stage3?.export?.())};}
 function rollbackDraft(c,before,after){
  restoreDraftObject(NPC4_STATE?.[c.id],before.n4,after.n4);
  restoreDraftObject(NPC9_MEMORY?.[c.id],before.n9,after.n9);
  restoreDraftObject(STATE.sim,before.sim,after.sim);
  if(equal(STATE.events,after.events)&&!equal(before.events,after.events))STATE.events=copy(before.events);
  if(window.stage3?.restore&&equal(window.stage3.export?.(),after.stage)&&!equal(before.stage,after.stage))window.stage3.restore(before.stage);
  if(typeof simRenderInterrogation==='function')simRenderInterrogation();
  if(typeof simRenderTop==='function')simRenderTop();
 }
 function loadRetry(){try{const x=JSON.parse(sessionStorage.getItem(TURN_STORAGE)||'null');return x&&typeof x.question==='string'&&typeof x.id==='string'?x:null;}catch{return null;}}
 function saveRetry(x){retryTurn=x;try{if(x)sessionStorage.setItem(TURN_STORAGE,JSON.stringify(x));else sessionStorage.removeItem(TURN_STORAGE);}catch(_){}}
 retryTurn=loadRetry();
 const sync=function(c,before,after){
  const m=NPC9_MEMORY?.[c.id],st=NPC4_STATE?.[c.id];
  const semantic=m?.semantic?.slice().reverse().find(x=>x.answer===before);
  if(semantic)semantic.answer=after;
  const stmt=m?.statements?.slice().reverse().find(x=>x.text===before);
  if(stmt)stmt.text=after;
  if(st?.recent?.length&&st.recent.at(-1).answer===norm(before))st.recent.at(-1).answer=norm(after).slice(0,1550);
  if(st?.npc65?.lastAnswer===before)st.npc65.lastAnswer=after.slice(0,1300);
  if(st?.npc68?.threads?.length&&st.npc68.threads.at(-1).a===before.slice(0,850))st.npc68.threads.at(-1).a=after.slice(0,850);
 };
 // W trakcie przesłuchania nie pokazuj graczowi informacji o silniku AI.
 // Czekanie sygnalizuje wyłącznie neutralna wypowiedź w dymku rozmowy.
 // Komunikaty błędów pozostają widoczne, aby nie ukrywać problemów technicznych.
 function showBusy(value){inflight=value;window.PS_COOP_BUSY_AT=value?(window.PS_COOP_BUSY_AT||Date.now()):0;status.hidden=!value&&!cloudFailure;status.className=value?'ps18-response-status ps18-pending':cloudFailure?'ps18-response-status ps18-error':'ps18-response-status';status.textContent=value?'Świadek przygotowuje odpowiedź. Zachowujemy Twoje pytanie.':cloudFailure;
  const send=by('chatSend'),input=by('chatInput');if(send)send.disabled=value;if(input)input.disabled=value;
  if(window.PS_COOP?.active){window.PS_COOP.mark();if(!value)window.PS_COOP.flush();}
 }
 function send(){
  if(inflight)return;
  if(window.PS617_SYNC?.restoring){cloudFailure='Trwa przywracanie wcześniejszych rozmów. Spróbuj ponownie po synchronizacji.';showBusy(false);return;}
  const c=CONTENT.characters.find(x=>x.id===STATE.activeChar),input=by('chatInput');
  const question=String(input?.value||'').trim(),attached=by('attachedDoc')?.value||'';
  const log=c?STATE.dialogues[c.id]:null,oldLen=log?.length||0;
  // Lokalny silnik rozstrzyga stan gry, lecz jego odpowiedź pozostaje ukryta
  // do zakończenia analizy Z.ai. Dzięki temu gracz nie widzi dwóch różnych zeznań.
  // Cloud may interpret an already verified presented document, but never
  // an unsupported exhibit or a scripted breakthrough/correction.
  const attachmentOK=!attached||(STATE.found.has(attached)&&
   (typeof simIsVerified!=='function'||simIsVerified(attached))&&
   STATE.sim.auditJudgments?.[attached]?.status!=='overclaim');
  cloudFailure='';
  if(question.length>1600){cloudFailure='Pytanie jest za długie (maksymalnie 1600 znaków). Skróć je, nie zostanie ucięte automatycznie.';showBusy(false);return;}
  if(!online||!navigator.onLine){cloudFailure='Połącz z internetem, aby przesłuchać świadka przez AI.';showBusy(false);return;}
  if(!attachmentOK){cloudFailure='Materiał musi być pozyskany i zweryfikowany przed konfrontacją.';showBusy(false);return;}
  const wantsCloud=!!(c&&question&&attachmentOK&&online&&navigator.onLine);
  if(wantsCloud)pending={id:c.id,log,start:oldLen};
  const beforeDraft=c?takeDraft(c):null;
  let out;try{out=previous.apply(this,arguments);}catch(error){pending=null;throw error;}
  const afterDraft=c?takeDraft(c):null;
  const procedural=!!(c&&(simWitness(c).blocked||
   emergency.test(norm(log?.at(-1)?.text||''))||
   ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(NPC9_MEMORY?.[c.id]?.semantic?.at(-1)?.status)||
   window.PS_BREAKTHROUGH?.shouldKeepCanonical?.(c.id,question,attached)));
  const finishLocal=()=>{
    if(c&&question&&log?.length===oldLen+2&&log.at(-1)?.role==='npc'){
      const finalText=log.at(-1).text;
      log.at(-1).ai=psAiMeta({provider:'local',model:'witness-engine-local',fallbackReason:'local_or_scripted_turn',durationMs:0});
      PS65_CONTEXT.finalize?.(c.id,finalText,finalText,log);
      window.PS617_SYNC?.enqueue?.({type:'record_local_turn',witnessId:c.id,question,response:finalText});
    }
    if(pending&&pending.log===log){pending=null;if(STATE.activeChar===c?.id&&STATE.tab==='interview')renderChat();}
    return out;
  };
  if(!wantsCloud||!log||log.length!==oldLen+2){
   if(procedural||!question)return finishLocal();
   if(log?.length>=oldLen+2)log.splice(oldLen,log.length-oldLen);
   rollbackDraft(c,beforeDraft,afterDraft);PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);
   window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
   if(input)input.value=question;
   cloudFailure='Nie można rozpocząć tej rozmowy przez AI. Ponów pytanie.';pending=null;showBusy(false);
   if(typeof renderChat==='function')renderChat();return out;
  }
  const row=log.at(-1),answer=row?.text,mem=NPC9_MEMORY?.[c.id];
  if(procedural)return finishLocal();
  if(!row||row.role!=='npc'||typeof answer!=='string'||answer.length<12){
   log.splice(oldLen,2);rollbackDraft(c,beforeDraft,afterDraft);
   PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
   if(input)input.value=question;pending=null;
   cloudFailure='Brak bezpiecznej podstawy odpowiedzi AI. Ponów pytanie.';
   showBusy(false);renderChat();return out;
  }
  const context=PS65_CONTEXT.read(c.id,answer,question,oldLen);
  if(!context){
   log.splice(oldLen,2);rollbackDraft(c,beforeDraft,afterDraft);PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);
   window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
   if(input)input.value=question;pending=null;
   cloudFailure='Nie udało się przygotować bezpiecznego kontekstu dla AI. Ponów pytanie.';showBusy(false);renderChat();return out;
  }
  // The synchronous legacy engine runs only in a speculative sandbox. Capture
  // its facts and proposed effects, then discard ALL provisional progression
  // before the network request starts. Only an accepted cloud answer commits.
  const playerDraft=log.at(-2);
  log.splice(oldLen,2);
  rollbackDraft(c,beforeDraft,afterDraft);
  PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);
  window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
  if(typeof psSchedule==='function')psSchedule();
  const unchanged=()=>log.length===oldLen&&
   equal(NPC4_STATE?.[c.id],beforeDraft.n4)&&equal(NPC9_MEMORY?.[c.id],beforeDraft.n9)&&
   equal(STATE.sim,beforeDraft.sim)&&equal(STATE.events,beforeDraft.events)&&
   equal(window.stage3?.export?.(),beforeDraft.stage);
  const commitDraft=()=>{
   if(!unchanged())return false;
   restoreDraftObject(NPC4_STATE?.[c.id],afterDraft.n4,beforeDraft.n4);
   restoreDraftObject(NPC9_MEMORY?.[c.id],afterDraft.n9,beforeDraft.n9);
   restoreDraftObject(STATE.sim,afterDraft.sim,beforeDraft.sim);
   if(!equal(beforeDraft.events,afterDraft.events))STATE.events=copy(afterDraft.events);
   if(window.stage3?.restore&&!equal(beforeDraft.stage,afterDraft.stage))window.stage3.restore(afterDraft.stage);
   log.push(playerDraft,row);
   return true;
  };
  const prior=retryTurn&&retryTurn.witnessId===c.id&&retryTurn.question===question&&retryTurn.evidenceId===attached?retryTurn:null;
  const turnId=prior?.id||uuid();
  saveRetry({id:turnId,witnessId:c.id,question,evidenceId:attached});
  const payload={version:3,witnessId:c.id,name:c.name,role:c.role,canonical:answer.slice(0,1900),
   question,presentedEvidenceId:attached||null,context,turnId};
  // Local draft is provisional only; it must never be displayed as a free-form reply.
  const serial=++requestSerial;showBusy(true);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),290000);
  let cloudAccepted=false;
  const unavailable=(message)=>{
   if(serial!==requestSerial||STATE.dialogues[c.id]!==log)return;
   // No provisional response is in STATE or the transcript while awaiting AI.
   // On rejected responses, keep the initial state and restore the input.
   if(log.length===oldLen+2&&log.at(-1)===row){
    log.splice(oldLen,2);rollbackDraft(c,beforeDraft,afterDraft);
    PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);
    window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
   }
   if(input)input.value=question;
   cloudFailure=message||'AI nie odpowiedziało. Ponów pytanie.';
   if(typeof psSchedule==='function')psSchedule();
  };
  // Newly obtained evidence must be approved by Supabase before a cloud confrontation.
  (async()=>{
   // Establish the signed Supabase session cookie BEFORE sending a payable AI
   // request. If the POST response is lost, the next retry still uses the same
   // session and durable turnId. Do not spend AI tokens without a handshake.
   if(window.PS_COOP?.active&&!await window.PS_COOP.beforeInterview())throw Object.assign(Error('coop_control_unavailable'),{coopNotReady:true});
   const handshake=await fetch('/api/game-state',{method:'GET',credentials:'same-origin',cache:'no-store',signal:ctrl.signal});
   if(!handshake.ok)throw Object.assign(Error('session_not_ready'),{sessionNotReady:true});
   if(attached&&window.PS617_SYNC?.ensureEvidence){
    const approved=await window.PS617_SYNC.ensureEvidence(attached,3000);
    if(!approved)throw Object.assign(Error('evidence_not_yet_approved'),{localOnly:true});
   }
   return fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload),signal:ctrl.signal});
  })()
   .then(async r=>{if(!r.ok){
      let detail=null;
      try{detail=await r.json();}catch{} // No raw upstream content is ever displayed.
      const error=String(detail?.error||'');
      // Szczegóły dostawcy zostają w narzędziach deweloperskich, nie w grze.
      if(new URLSearchParams(location.search).get('debugAI')==='1')
       console.warn('[Przesłuchanie: diagnostyka]',{status:r.status,error,reason:detail?.fallbackReason||null,
          audit:detail?.qualityDiagnostics?.attempts?.slice(-2)||null});
      const retryRaw=r.headers?.get('Retry-After')||'';
      const seconds=/^\d{1,4}$/.test(retryRaw)?Math.min(1200,Number(retryRaw)):null;
      const message=r.status===409?'Dowód jest jeszcze zatwierdzany. Zachowaliśmy pytanie — spróbuj ponownie po synchronizacji.':
       r.status===429?('Zbyt wiele pytań w krótkim czasie. Pytanie zostało zachowane. '+
         (seconds?'Spróbuj ponownie za około '+seconds+' s.':'Spróbuj ponownie później.')):
       r.status===401||r.status===403?'Nie udało się potwierdzić sesji śledztwa. Odśwież stronę i sprawdź zapis.':
       r.status===503?'Przesłuchanie jest teraz niedostępne. Zachowaliśmy pytanie — spróbuj ponownie później.':
       r.status===502||r.status===504?'Odpowiedź trwała zbyt długo. Twoje pytanie zostało zachowane. Spróbuj ponownie.':
       'Nie udało się pobrać odpowiedzi świadka. Pytanie zostało zachowane; spróbuj ponownie.';
      unavailable(message);
      return null;
    }return r.json();})
   .then(data=>{
    if(!data)return;
    // RC29: the browser must accept the SAME server-approved providers as
    // /api/interview, not only the historical Gemini provider. Never trust a
    // provider name alone: require the server's canonical/verification flags,
    // the exact turn ID and the existing text-safety checks.
    const auditedProviders=new Set(['gemini','groq','mistral','zai','apinex-luna','apinex-minimax','apinex-mimo','apinex-glm','apinex-deepseek','apinex-glmx','apinex-muse','apinex-gemini','apinex-deepseekpro','apinex-glmpro','apinex-jev']);
    const isAudited=auditedProviders.has(data?.provider)&&data?.semanticVerified===true;
    // Server-authored local fallback is a separate, explicitly marked type.
    // It is not misrepresented as having passed the cloud semantic audit.
    const isLocalAuthored=data?.provider==='local'&&data?.localVerified===true&&data?.semanticVerified===false;
    if(data?.decision!=='answer'||data?.serverCanonical!==true||(!isAudited&&!isLocalAuthored)){
     unavailable('Nie otrzymano zatwierdzonej odpowiedzi AI. Ponów pytanie.');return;
    }
    const text=typeof data?.text==='string'?data.text.trim():'';
    const serverApproved=data.serverCanonical===true&&data.decision==='answer'&&
     (isAudited||isLocalAuthored)&&data.turnId===turnId&&text.length>=12&&text.length<=1650&&
     !/[<>\u0000-\u0008\u000e-\u001f]/.test(text);
    if(!serverApproved){unavailable('Odrzucono nieprawidłową odpowiedź AI. Ponów pytanie.');return;}
    if(serial!==requestSerial||STATE.dialogues[c.id]!==log||row.text!==answer||
       !commitDraft()){
     unavailable('Stan przesłuchania zmienił się podczas odpowiedzi AI. Ponów pytanie.');return;
    }
    row.text=text;
    row.ai=psAiMeta(data);
    // Gemini controls only visual expression, never approved gameplay stress/trust.
    const face=document.querySelector('#witnessStage .wp-stage');
    if(face&&STATE.activeChar===c.id&&/^(neutral|focused|uncertain|tense|guarded|surprised|sad|relieved|controlled|irritated)$/.test(data.emotion||'')){
      face.dataset.ps637AiEmotion=data.emotion;
      face.dataset.ps622Emotion=data.emotion;
      face.querySelectorAll('.wp-mouth-curve').forEach(path=>{
       const mouth={neutral:'M143 192Q159 191 176 192',focused:'M144 193Q159 191 175 193',uncertain:'M144 193Q159 197 175 193',tense:'M145 193Q159 190 174 193',guarded:'M143 193Q159 193 175 192',surprised:'M149 193Q160 200 171 193',sad:'M144 194Q159 199 176 194',relieved:'M144 192Q159 197 175 192',controlled:'M145 193Q159 192 174 193',irritated:'M146 192Q159 190 173 192'};
       path.setAttribute('d',mouth[data.emotion]);
      });
    }
    PS65_CONTEXT.read(c.id,answer,question,oldLen);
    window.PS68_MEMORY?.recordApproved?.(c.id,question,answer);
    cloudAccepted=true;
    saveRetry(null);
    // The server owns the exact wording and has already checked semantics.
    // Never silently substitute the provisional local testimony.
    // Render w finally — dopiero po zatwierdzeniu odpowiedzi lub fallbacku.
   })
   .catch(error=>{
    unavailable(error?.coopNotReady?'Wspólny pokój synchronizuje sterowanie. Spróbuj ponownie.':error?.sessionNotReady?'Sesja serwerowa nie jest gotowa. Ponów pytanie.':error?.localOnly?'Dowód oczekuje na zatwierdzenie przez serwer. Ponów pytanie.':
     'Połączenie z AI zostało przerwane. Ponów pytanie.');
   })
   .finally(()=>{
    clearTimeout(timer);
    if(serial===requestSerial){
     if(cloudAccepted&&STATE.dialogues[c.id]===log&&log.at(-1)===row){
      PS65_CONTEXT.finalize?.(c.id,answer,row.text,log);
      window.PS68_MEMORY?.finalize?.(c.id,question,answer,row.text,log);
      // A late cloud answer must also be included in local export/autosave.
      if(typeof psSchedule==='function')psSchedule();
     }
     pending=null;showBusy(false);
     if(STATE.activeChar===c.id&&STATE.tab==='interview')renderChat();
    }
   });
  return out;
 }
 // Całą turę, również przy naciśnięciu Enter, kierujemy do tego samego
 // kontrolera. Historyczna obsługa Enter w core wywoływała sendChat bez Z.ai.
 by('chatInput')?.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.shiftKey||e.isComposing)return;
  e.preventDefault();e.stopImmediatePropagation();WitnessEngine.submit();
 },true);
 // Zmieniamy wyłącznie wizualizację oczekującej odpowiedzi, bez dotykania
 // kanonicznego zeznania, zapisów, walidatorów ani EventBus.
 const originalRender=renderChat;
 renderChat=function(){
  const result=originalRender.apply(this,arguments);
  if(pending&&STATE.activeChar===pending.id&&STATE.dialogues[pending.id]===pending.log&&
     pending.log.length>=pending.start+2&&pending.log.at(-1)?.role==='npc'){
   const bubble=by('chatLog')?.querySelector('.bubble.npc:last-child');
   if(bubble){
    const label=document.createElement('span');
    label.textContent=CONTENT.characters.find(c=>c.id===pending.id)?.name||'Świadek';
    const message=document.createElement('em');message.textContent='Formułuje odpowiedź…';
    bubble.replaceChildren(label,message);bubble.setAttribute('aria-busy','true');
   }
  }
  return result;
 };
 by('chatInput')?.setAttribute('maxlength','1600');
 registerWitnessSendLayer('apinex-cloud-fallback',send);
 window.PS77_AI=Object.freeze({mode:'ai_required_gemini_rc7',get busy(){return inflight;},
  get lastDiagnostic(){const rows=STATE.dialogues[STATE.activeChar]||[];
   return rows.slice().reverse().find(x=>x.role==='npc'&&x.ai)?.ai||null;},
  safeRewrite,semanticGuard,context:PS65_CONTEXT.read});
})();

(()=>{
/* RC57.8: conservative OCR-free spelling tolerance for Polish questions.
 * Only the read-only intent interpretation is normalized. Original input, names,
 * times, evidence IDs and player transcript remain UNCHANGED.
 */
const VOCAB=Object.freeze([
 'gdzie','kiedy','dlaczego','skad','ktorej','godzinie','godzina','byles','bylas',
 'przebywales','przebywalas','polnocy','potwierdzic','potwierdzi','potwierdzisz',
 'widziales','widzialas','pamietasz','pamietam','powiedziales','powiedzialas',
 'wczesniej','zeznania','dokumenty','dokument','przesluchanie','alibi',
 'byliscie','spotkales','spotkalas','zgodnosc','obecnosc','warsztacie',
 'dyspozytorni','wychodziles','wychodzilas','zglosiles','zglosilas',
 'rozmawiales','rozmawialas','dowody','dowodu','swiadek','swiadkowie'
]);
const EXACT=new Set(VOCAB);
const BLOCKED=new Set([
 // Valid words near question vocabulary must never be silently rewritten.
 'gdzies','kiedys','godziny','godzine','godzin','dlatego','gdzieniegdzie',
 'skoro','wczoraj','ktory','ktorej','ktora','bylo','byly','bylam','bylamy',
 'byles','bylas','miales','mialas','widzialem','widzialam','powiedzialem',
 'powiedzialam','potwierdzam','pamietaja','pamietala','pamietalem',
 'obecnosci','dokumentacji','warsztatu','dyspozytor','dyspozytora'
]);
const EXPLICIT=new Map([
 ['gdze','gdzie'],['gdzue','gdzie'],['gdzuee','gdzie'],['kiedyy','kiedy'],
 ['polnoccy','polnocy'],['pamietaszz','pamietasz'],['potwirdzic','potwierdzic'],
 ['nei','nie'],['nnie','nie'],['niie','nie'],['pytm','pytam']
]);
// Damerau-Levenshtein distance <= 1, no unbounded fuzzy matching and no corrections
// for tokens shorter than 4 characters (except explicit, unambiguous negation).
const distanceOne=(a,b)=>{
 if(a===b)return true;
 if(Math.abs(a.length-b.length)>1)return false;
 if(a.length===b.length){let diffs=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])diffs.push(i);
  return diffs.length===1||(diffs.length===2&&diffs[1]===diffs[0]+1&&a[diffs[0]]===b[diffs[1]]&&a[diffs[1]]===b[diffs[0]]);
 }
 let shorter=a.length<b.length?a:b,longer=a.length<b.length?b:a,i=0,j=0,skips=0;
 while(j<longer.length){if(i<shorter.length&&shorter[i]===longer[j]){i++;j++;}else{skips++;j++;if(skips>1)return false;}}
 return true;
};
function correctIntentTypos(folded){
 const substitutions=[];
 // Compounds, IDs and numeric tokens must remain untouched.
 const text=String(folded||'').replace(/\b[a-z]{3,24}\b/g,(word,offset,source)=>{
  const before=source[offset-1]||'',after=source[offset+word.length]||'';
  if(/[a-z0-9:_-]/.test(before)||/[a-z0-9:_-]/.test(after)||EXACT.has(word)||BLOCKED.has(word))return word;
  const direct=EXPLICIT.get(word);
  if(direct){substitutions.push({from:word,to:direct});return direct;}
  if(word.length<4)return word;
  const matches=VOCAB.filter(v=>Math.abs(v.length-word.length)<=1&&distanceOne(word,v));
  if(matches.length!==1)return word; // Ambiguity -> leave intact, never guess.
  substitutions.push({from:word,to:matches[0]});return matches[0];
 });
 return {text,substitutions};
}

/** 6.33 - ONE pure, deterministic, non-authoritative question interpreter.
 * Shared source is imported on Vercel and embedded in the browser at build time.
 * No witness data, evidence, unlocks or side effects are used here.
 */
const INTENT_VERSION='6.33';
function foldQuestion(input){return correctIntentTypos(String(input??'').slice(0,1600).toLocaleLowerCase('pl').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9:?.!,; -]+/g,' ').replace(/\s+/g,' ').trim()).text;}
const interrogative=/(?:^|\b)(?:gdzie|kto|komu|co|kiedy|dlaczego|czemu|jak|czy|skad|o ktorej|w ktorym|na jakiej|ile)\b/;
const contrast=/\b(?:tylko|lecz|ale|zamiast tego|interesuje mnie|chodzi mi o)\b/;
const exclusion=/\b(?:nie\s+(?:pytam|mowie|chodz[ięei]|interesuje\s+mnie)\b|nie\s+o\s+(?:lene|lenie|leny|dokument|ostatni))\b/;
function positiveClauses(raw){
 const text=foldQuestion(raw);if(!text)return {parts:[],excluded:[],negated:false};
 const exclude=[],parts=[];
 // Sentence punctuation separates negated corrections from actual questions.
 for(const sentence of text.split(/[?.!]+/).map(s=>s.trim()).filter(Boolean)){
  if(exclusion.test(sentence)){
   const m=sentence.match(contrast);
   if(m){const before=sentence.slice(0,m.index).trim(),after=sentence.slice(m.index+m[0].length).trim();
    if(before)exclude.push(before);if(after)parts.push(after);
   }else{
    const later=sentence.search(/(?:\b(?:gdzie|kto|komu|kiedy|dlaczego|co|czy|jak|skad)\b)(?=.{4,}$)/g);
    // This recovery is only for a full stop that was omitted after a negated instruction.
    if(later>12&&/^nie\s+(?:pytam|mowie|chodzi)/.test(sentence)){exclude.push(sentence.slice(0,later));parts.push(sentence.slice(later));}
    else exclude.push(sentence);
   }
  }else parts.push(sentence);
 }
 // In "Powiedział pan X. Dokąd pan wychodził?", the preface is context,
 // not an independent question competing for the primary intent.
 const filtered=parts.length>1&&parts.some(p=>interrogative.test(p))
  ?parts.filter(p=>interrogative.test(p)):parts;
 const active=[];
 for(const sentence of filtered){
  // Separate two genuinely independent requests, but keep "kto zgłosił alarm i o której" together.
  const split=/\bdokad\b.{0,100}\bwychodz\w*\b.{0,100}\bkto\b/.test(sentence)?[sentence]:sentence.split(/\s+(?:i|oraz|a)\s+(?=(?:gdzie|kto|komu|dlaczego|czemu|czy|skad|jak|co)\b)/);
  for(const part of split)if(part.trim())active.push(part.trim());
 }
 return {parts:active.slice(0,4),excluded:exclude.slice(0,4),negated:exclude.length>0};
}
function classifyQuestionPart(input){
 const q=foldQuestion(input);if(!q)return 'clarification';
 const victims=/(?:\blen[ayie]\b|\brudnick\w*\b|\bofiar\w*\b|\bcial\w*\b)/.test(q);
 if(/\b(?:przyznaj\w*\s+sie|czy\s+(?:to\s+)?(?:ty|pan|pani)\s+\w*\s*(?:zabil|zamordow)|czy\s+(?:zabiles|zabilas|zamordowales|zamordowalas))/.test(q))return 'direct_accusation';
 if(/(?:\bodmaw\w*\b|\badwokat\w*\b|\bpelnomocnik\w*\b|\bprzerwa\s+w\s+przesluchaniu\b)/.test(q))return 'procedural_refusal';
 if(/(?:\bdokad\b|\bgdzie\b.{0,30}\bwychodz\w*|\bwychodz\w*\b.{0,25}\bbiur\w*)/.test(q)&&
    /(?:\bwychodz\w*|\bwyszed\w*|\bwyjsc\w*|\bwidziec\b|\bwidzial\w*)/.test(q))return 'self_departure';
 if(/(?:\buzycie\s+kont\w*|\bkonto\b|\blog\w*|\bsesj\w*)/.test(q)&&
    /(?:\bobecnosc\b|\bczlowiek\w*|\bosob\w*|\bfizyczn\w*)/.test(q)&&
    /(?:\brozni\w*|\bpotwierdz\w*|\bdowodz\w*|\bczy\b)/.test(q))return 'account_identity';
 if(/(?:\bbhp\b|\bzagrozen\w*|\bryzyk\w*)/.test(q)&&
    /(?:\bstanowisk\w*|\bzagrozen\w*|\bniebezpiecz\w*|\bryzyk\w*)/.test(q)&&
    !/(?:\bwysl\w*|\bnadano\b|\bdostarcz\w*)/.test(q))return 'bhp_hazard';
 if(/(?:\bostatni\w*\s+rozmow\w*|\bostatni\w*\s+kontakt\w*)/.test(q)&&
    /(?:\blen\w*|\bofiara\b)/.test(q))return 'last_contact';
 if(/(?:brakuj\w*|brak\s+(?:wpisu|podpisu)|niepeln\w*|pominiet\w*|puste\w*)/.test(q)&&
    /(?:wpis\w*|formularz\w*|zleceni\w*|dokumentacj\w*|rejestr\w*)/.test(q))return 'workshop_missing_entry';
 if(/(?:bhp|zgloszen\w*|ostrzezen\w*|raport\s+bhp)/.test(q)&&
    /(?:wysl\w*|nadano|dostarcz\w*|dotarl\w*|zlozon\w*|przekazan\w*|poszlo)/.test(q))return 'bhp_sent';
 if(/(?:autoryzac\w*|autoryzowan\w*|zgod\w*\s+na\s+test)/.test(q)&&
    /(?:potwierdz\w*|wykaz\w*|dokumentuj\w*|dowod\w*|sprawdz\w*|weryfik\w*|test\w*)/.test(q))return 'test_authorization';
 const alarm=/(?:zglosz\w*|zawiadom\w*|powiadom\w*|wezw\w*|alarm\w*|znalezien\w*|znalaz\w*|odnalaz\w*)/.test(q);
 const alarmQuestion=/(?:\bkto\b|\bkomu\b|\bczy\b|\bkiedy\b|\bo ktorej\b|\bktorej godzin)/.test(q);
 if(alarm&&alarmQuestion&&(victims||/\balarm\b|znalezien|znalaz|pomoc/.test(q)))return 'alarm_report';
 // A question about the provenance of an alibi is not a request to repeat the alibi.
 if(/(?:\bkto\s+(?:moze|mogl|potrafi)\s+(?:to\s+)?potwierdz\w*|\bczy\s+ktos\s+moze\s+(?:to\s+)?poswiadcz\w*|\bco\s+potwierdz\w*\s+twoj\w*\s+obecnosc)/.test(q))return 'corroboration';
 if(/(?:\bwczesniej\b|\bpoprzednio\b|\bpierwotn\w*\b|\bprzypomnij\b|\bprzed chwila\b)/.test(q)&&
    /(?:\bzeznan\w*|\bmowil\w*|\bpowiedzial\w*|\bwersj\w*|\bwypowiedz\w*|\balibi\b)/.test(q))return 'previous_statement';
 if(/(?:\bsprzeczn\w*|\bnie zgadzaj\w*|\bnie zgadza\w*|\brozbiezn\w*|\bzmieniasz\s+wersj\w*|\btwierdzil\w*\s+inaczej)/.test(q))return 'contradiction';
 if(/(?:\bskoro\b|\bprzeciez\b|\bjak\s+mozesz\b|\bjak\s+moze\s+pan\b)/.test(q)&&
    /(?:\bnie\s+(?:widzial\w*|obserwowal\w*|byles|bylas|patrzyl\w*)|\bnikt\s+nie\s+wszedl|\bpewnosc\b|\btwierdz\w*)/.test(q))return 'epistemic_challenge';
 if(/(?:\bna ile\b.{0,30}\bpew\w*|\bna pewno\b|\bczy\s+mozesz\s+wykluczyc|\bjak\w*\s+pewn\w*|\bpewnosc\b|\bwykluczyc\b)/.test(q))return 'certainty_limit';
 // 'Kim była dla ciebie ofiara?' pyta o relację z Leną, nie o ustalenie tożsamości ofiary.
 if(/(?:\bkim\s+(?:byl|byla)\b.{0,55}\b(?:ofiar\w*|len\w*|rudnick\w*)\b|\bkim\s+(?:dla\s+(?:ciebie|pana|pani|was)\s+)?(?:byl|byla)\b.{0,35}\b(?:ofiar\w*|len\w*)\b|\bco\s+(?:dla\s+(?:ciebie|pana|pani|was)\s+)?znaczyl\w*\b.{0,35}\b(?:ofiar\w*|len\w*)\b|\bco\s+(?:cie|was)\s+laczylo\s+z\s+(?:ofiar\w*|len\w*)\b|\bjak\s+(?:znales|znalas|znaliscie)\s+(?:ofiar\w*|len\w*)\b)/.test(q))return 'relationship';
 if(/(?:\brelacj\w*\s+z\s+len\w*|\bjakie\s+byly\s+.{0,20}\brelacj\w*|\bco\s+(?:cie|was)\s+laczylo|\bjak\w*\s+laczyla\s+.{0,20}\brelacj\w*|\bkonflikt\s+z\s+len\w*)/.test(q))return 'relationship';
 if(/(?:\bkomu\b|\bdo kogo\b|\bkogo poinformowal\w*|\bkogo zawiadomil\w*|\bodbiorc\w*|\badresat\w*)/.test(q)&&
    /(?:\bzglos\w*|\bawari\w*|\bprzekaz\w*|\bwiadomos\w*|\bpowiadom\w*|\binformow\w*)/.test(q))return 'report_recipient';
 if(/(?:\bw ktorym pomieszczeniu\b|\bgdzie dokladnie\b|\bw ktorej czesci\b|\bw ktorym miejscu\b)/.test(q))return 'place_precision';
 const personSelf=/(?:\balibi\b|\btwoj\w*\s+(?:pobyt|obecnosc|alibi)|\bswoj\w*\s+(?:pobyt|obecnosc)|\b(?:ty|pan|pani)\s+(?:byl|byla|przebywal)|\b(?:byles|bylas|przebywales|przebywalas)\b|\bgdzie\s+(?:byles|bylas|przebywales|przebywalas)|\bco\s+robil\w*\s+(?:miedzy|od|o)|\b(?:byl|byla)\s+pan\b)/.test(q);
 const aboutVictim=/(?:gdzie\s+(?:byla|przebywala)\s+(?:lena|ona)|gdzie\s+(?:byla|przebywala)\s+ofiara)/.test(q);
 if(personSelf&&!aboutVictim)return 'self_alibi';
 if(/(?:\bostatni\w*\s+(?:raz|spotkan|kontakt)|\bkiedy\s+.{0,48}\b(?:lena|lene|leny)\b|\bgdzie\s+.{0,45}\b(?:lena|lene|leny)\b)/.test(q))return 'last_contact';
 if(/(?:\bskad\b|\bzrodl\w*|\bna jakiej podstawie\b|\bskad ta pewnosc\b|\bkto powiedzial\b)/.test(q))return 'knowledge_source';
 if(/(?:\bco\s+(?:sam|sama)\s+widzial\w*|\bco\s+(?:ty|pan|pani)\s+(?:sam|sama)\s+widzial\w*|\bczy\s+(?:ty|pan|pani)\s+(?:sam|sama)\s+widzial\w*)/.test(q))return 'direct_observation';
 if(/(?:\bco\s+sie\s+stalo\s+potem|\bco\s+bylo\s+dalej|\bco\s+dalej\b|\bw jakiej kolejnosci\b|\bnastepnie\b)/.test(q))return 'event_sequence';
 if(/(?:\bco\s+z\s+tym\s+zrobil\w*|\bjak\w*\s+dzialania\w*\s+podj\w*|\bjak\s+zareagowal\w*)/.test(q))return 'action_taken';
 if(/(?:\bco\s+(?:cie|pana|pan(i|ia))\s+sklonil\w*|\bpowod\w*\s+tej\s+decyzji|\bco\s+cie\s+sklonilo)/.test(q))return 'reason';
 if(/(?:\bco\s+z\s+(?:nia|nim)|\bo\s+kim\s+mowisz|\bkogo\s+masz\s+na\s+mysli)/.test(q))return 'clarify_reference';
 if(/(?:\b(?:widziales|widzialas|widzial)\s+(?:raport|dokument)|\bco\s+wynika\s+z\s+dokument\w*|\bczy\s+masz\s+raport)/.test(q))return 'documents';
 if(/(?:\bna wlasne oczy\b|\bosobiscie\s+widzial\w*|\bco\s+(?:pan|pani|ty)\s+(?:widzial\w*|zaobserwowal\w*)|\bczy\s+(?:pan|pani|ty)\s+(?:widzial\w*|obserwowal\w*))/ .test(q))return 'direct_observation';
 if(/(?:\bco\s+powiedziala\s+lena|\brozmawial\w*\s+z\s+lena|\bkiedy\s+ostatnio\b.{0,45}\blen\w*|\bostatni\s+kontakt\b)/.test(q))return 'last_contact';
 if(/(?:\b0?\d[:.]\d\d\b|\bczas\b|\bo ktorej\b|\bkiedy\b|\bgodzin\w*|\bmiedzy\b)/.test(q))return 'chronology';
 if(/(?:\bkto\b|\bkomu\b|\bczyj\w*\b)/.test(q))return 'person';
 if(/(?:\bdlaczego\b|\bczemu\b|\bpowod\w*|\bpo co\b)/.test(q))return 'reason';
 if(/(?:\bprotokol\w*|\bdokument\w*|\bzleceni\w*)/.test(q))return 'documents';
 return 'clarification';
}
function analyzeQuestion(question){
 const raw=foldQuestion(question),{parts,excluded,negated}=positiveClauses(question);
 const classified=parts.map(text=>({text,intent:classifyQuestionPart(text)}));
 const intents=[...new Set(classified.map(c=>c.intent))].slice(0,5);
 const primary=classified[0]?.intent||'clarification';
 const q=parts.join(' '),aspects=[];
 if(/\b(?:kto|komu|kim|przez kogo)\b/.test(q))aspects.push('who');
 if(/\b(?:kiedy|godzin\w*|o ktorej|miedzy|\d\d?:\d\d)\b/.test(q))aspects.push('when');
 if(/\b(?:gdzie|miejsce|pobyt|przebyw)/.test(q))aspects.push('where');
 if(/\b(?:skad|zrodlo|potwierdz|na jakiej podstawie)\b/.test(q))aspects.push('source');
 if(/\b(?:dlaczego|czemu|po co|powod\w*)\b/.test(q))aspects.push('why');
 const questionWords=[...new Set((q.match(/\b(?:kto|komu|co|gdzie|kiedy|skad|dlaczego|czemu|jak|czy|ile)\b/g)||[]))].slice(0,8);
 const references=[...new Set((q.match(/\b(?:lena|leny|lene|rudnick|marek|janusz|tomasz|kamil|elzbieta|magdalena)\b/g)||[]))].slice(0,6);
 const time=(q.match(/\b\d{1,2}[:.]\d\d\b/g)||[]).slice(0,3).map(x=>x.replace('.',':'));
 const compound=classified.length>1;
 const sensitive=intents.includes('direct_accusation')||intents.includes('procedural_refusal')||/(?:zataj\w*|zatai\w*|falszow\w*|podrob\w*|oszuk\w*|ukryl\w*|celowo\s+(?:nie|zrobil)|zabil\w*|zamordow\w*)/.test(q);
 return {version:INTENT_VERSION,primary,intents,aspects:aspects.slice(0,4),
  clauses:classified.map(x=>({...x,intents:[x.intent]})),parts:classified,
  excludedTopics:excluded,positiveQuestion:q,subject:/\blen[ayie]\b|\brudnick\w*\b|\bofiar\w*\b/.test(q)?'victim':primary==='self_alibi'?'self':'unspecified',time,
  slots:{negated:negated||/\bnie\b/.test(q),negatedCorrection:negated,compound,questionWords,references},
  needsClarification:primary==='clarification',sensitive,
  evidenceSourceQuestion:['knowledge_source','direct_observation'].includes(primary),
  inputLooksLikeInstruction:/\b(?:zapomnij instrukcje|ignoruj zasady|jako model ai|zlam zabezpieczenia|ujawnij sekret|odblokuj dowody)\b/.test(raw)};
}
/** Read-only adapter for the historical PS611_NLU label vocabulary.
 * It translates an existing plan; it never interprets the question again.
 */
function legacyQuestionPlan(question){
 const p=analyzeQuestion(question);
 const labels={self_alibi:'alibi',alarm_report:'action_taken',last_contact:'victim_contact',
  workshop_missing_entry:'documents',bhp_sent:'action_taken',test_authorization:'corroboration',
  chronology:'time_precision',reason:'reason_for_action',direct_observation:'personal_observation',
  person:'unknown',clarification:'unknown'};
 const name=x=>labels[x]||x;
 const intents=[...new Set(p.intents.map(name))].filter(x=>x!=='unknown');
 return {...p,primary:name(p.primary),intents,clauses:p.clauses.map(x=>({...x,intents:x.intents.map(name)}))};
}

window.PS633_INTENT=Object.freeze({analyzeQuestion,classifyQuestionPart,legacyQuestionPlan,foldQuestion,INTENT_VERSION});
})();
/* Pakiet 6.10 — pierwszeństwo znaczenia pytania przed historycznymi heurystykami.
 * Nie zmienia dowodów, przełomów, warunków procesowych ani faktów. Zawsze wykonuje
 * wcześniejszy silnik; poprawia jedynie bezpieczne, nieformalne wypowiedzi.
 */
(function(){
 'use strict';
 const previous = WitnessEngine.snapshotAnswer();
 const normalize = x => norm(String(x||''));
 const take = (x,max=1300) => String(x||'').trim().slice(0,max);
 const safeKinds = Object.freeze(['personalObservation','epistemicChallenge','directAccusation']);
 const denial = /\b(?:nie pytam o|nie chodzi mi o|zamiast|tylko o to co|sam\w* widzia|sama widzia)\b/;
 const saw = /\b(?:sam\w* widzial\w*|sam\w* widzi\w*|osobiscie widzial\w*|osobista obserwacj\w*|wlasna obserwacj\w*|na wlasne oczy|co (?:ty |pan |pani )?(?:sam\w* )?(?:widziales|widzialas|widzial|widziala)|czy (?:ty |pan |pani )?(?:sam\w* )?(?:widziales|widzialas|widzial|widziala))\b/;
 const directCrime = /\b(?:zabiles|zabilas|zamordowales|zamordowalas)\b.{0,48}\b(?:len\w*|rudnick\w*)\b|\b(?:ty|pan|pani)\b.{0,30}\b(?:zabil|zabila|zamordowal|zamordowala)\b.{0,48}\b(?:len\w*|rudnick\w*)\b|\b(?:przyznajesz sie|przyznaje sie|przyznal\w* sie|przyznac sie)\b.{0,55}\b(?:zabojst\w*|morderst\w*|zamordowan\w*|zabici\w*)\b|\b(?:jestes|jest pan|jest pani)\b.{0,30}\b(?:zabojca|morderca)\b/;
 const knowledgeChallenge = /\b(?:jak|skad|dlaczego|czemu)\b.{0,75}\b(?:mozesz|moze|masz|miec|byc|wiesz|twierdz\w*)\b.{0,90}\b(?:pewnos\w*|pewny|pewna|wiedziec|wiesz|twierdz\w*)\b/;
 const noObservation = /\b(?:skoro|chociaz|jezeli|jesli|przeciez|ale)\b.{0,110}\b(?:nie obserwowal\w*|nie widzial\w*|nie byles|nie bylas|nie bylo cie|nie stal\w*|nie sledzil\w*|nie patrzyl\w*)\b/;
 const noWitnessing = /\b(?:nie obserwowal\w*|nie widzial\w*)\b.{0,80}\b(?:nikt|nikogo|wszedl|wchodzil|tam)\b/;
 const certainEntry = /\b(?:nikt|nikogo|nikt tam|nikt nie|nikt sie)\b.{0,35}\b(?:wszedl|wchodzil|wchodzil|byl|pojawil|widzial)\b/;
 function classify(question){
  const q=normalize(question); if(!q||q.length>1100)return null;
  const k=window.PS633_INTENT?.analyzeQuestion(question);
  if(k){return {direct_accusation:'directAccusation',direct_observation:'personalObservation',knowledge_source:'epistemicChallenge'}[k.primary]||null;}
  if(directCrime.test(q)&&!/^\s*(?:kto|co|dlaczego|skad)\b/.test(q))return 'directAccusation';
  if((noObservation.test(q)||noWitnessing.test(q))&&
     (knowledgeChallenge.test(q)||certainEntry.test(q)||/\b(?:skoro|sprzecznosc)\b/.test(q)))return 'epistemicChallenge';
  if((saw.test(q)||denial.test(q)&&/\b(?:widz\w*|obserwacj\w*)\b/.test(q))&&
     !/\b(?:kto zabil|zabojc\w*|sprawc\w*)\b/.test(q))return 'personalObservation';
  return null;
 }
 function protectedAnswer(c,attached,beforeConfronted,base){
  if(attached||!c||!NPC4_STATE?.[c.id]||!NPC9_MEMORY?.[c.id]||simWitness(c).blocked)return true;
  const m=NPC9_MEMORY[c.id],last=(m.semantic||[]).at(-1);
  if((m.confronted?.length||0)>beforeConfronted)return true;
  if(last&&['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(last.status))return true;
  if(last?.source_ids?.length)return true;
  const s=normalize(base);
  if(/\b(?:odmawiam|pelnomocnik|przerwa proceduralna|podtrzymuje odmowe|nie bede dalej odpowiadac|konfrontacj\w* z dowod\w*|przyznaje sie)\b/.test(s))return true;
  return false;
 }
 const starts={MAREK:'Proszę rozróżnić dwie rzeczy. ',TOMASZ:'To trzeba rozdzielić. ',JANUSZ:'Powiem wprost. ',ELZBIETA:'To istotne rozróżnienie. ',KAMIL:'Technicznie rzecz biorąc, ',MAGDALENA:'Precyzyjnie rzecz ujmując, '};
 function reply(c,kind,question){
  const data=NPC9_CUSTOM[c.id]||{},isFemale=['ELZBIETA','MAGDALENA'].includes(c.id);
  if(kind==='personalObservation'){
   const q=normalize(question),aboutLena=/\b(?:len\w*|rudnick\w*|ja wtedy|jej wtedy)\b/.test(q);
   const fact=aboutLena?(data.victim_last||data.observations):(data.observations||data.source);
   if(!fact)return '';
   const lead= isFemale?'Odpowiem o tym, co sama widziałam, a nie o tym, co zapisano w aktach. ':'Odpowiem o tym, co sam widziałem, a nie o tym, co zapisano w aktach. ';
   return take(lead+fact,1500);
  }
  if(kind==='epistemicChallenge'){
   const fact=take(data.observations||data.source,600);
   const correction=isFemale?'Nie mogę twierdzić z całą pewnością, że nikt tam nie wszedł, jeśli nie obserwowałam tego miejsca przez cały czas. ':'Nie mogę twierdzić z całą pewnością, że nikt tam nie wszedł, jeśli nie obserwowałem tego miejsca przez cały czas. ';
   return take((starts[c.id]||'')+correction+(fact?'To, co mogę powiedzieć o własnej obserwacji: '+fact:''),1500);
  }
  if(kind==='directAccusation'){
   // Odpowiedź wyraża obecne stanowisko, nie obiektywną niewinność; nie zastępuje
   // formalnego przyznania ani konfrontacji wymagającej dowodów.
   const stand={MAREK:'Nie przyznaję się do zabójstwa Leny. Proszę oddzielić moje decyzje służbowe od takiego zarzutu.',
    TOMASZ:'Nie przyznaję się do zabójstwa Leny. Jeśli mnie o to oskarżasz, pytaj wprost i przedstaw podstawy.',
    JANUSZ:'Nie przyznaję się. Kłótnia z Leną to nie jest przyznanie się do jej zabójstwa.',
    ELZBIETA:'Nie przyznaję się do zabójstwa Leny. To poważny zarzut i chcę wiedzieć, na czym go opierasz.',
    KAMIL:'Nie przyznaję się do zabójstwa Leny. Moja praca przy wagonie nie jest odpowiedzią na taki zarzut.',
    MAGDALENA:'Nie przyznaję się do zabójstwa Leny. Proszę wskazać, jakie fakty mają uzasadniać to oskarżenie.'};
   return stand[c.id]||'';
  }
  return '';
 }
 function reconcile(c,before,after,kind){
  if(before===after)return true;
  const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],turn=m?.turn;
  if(!m||!s)return false;
  const sem=[...(m.semantic||[])].reverse().find(x=>x.turn===turn&&x.answer===before);
  const stmt=[...(m.statements||[])].reverse().find(x=>x.turn===turn&&x.text===before);
  if(!sem&&!stmt)return false;
  const locked=x=>x&&(x.source_ids?.length||['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(x.status));
  if(locked(sem)||locked(stmt))return false;
  const topic={personalObservation:'observation',epistemicChallenge:'knowledge-limit',directAccusation:'accusation'}[kind];
  if(sem){sem.answer=after;sem.topic=topic;sem.focus='intent-6.10';}
  if(stmt){stmt.text=after;stmt.topic=topic;}
  if(Array.isArray(m.topics)&&m.topics.length)m.topics[m.topics.length-1]=topic;
  if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus:'intent-6.10'};
  const recent=s.recent?.at(-1);
  if(recent&&recent.answer===normalize(before).slice(0,1550)){recent.answer=normalize(after).slice(0,1550);recent.topic=topic;recent.focus='intent-6.10';}
  const npc5=s.npc5?.recent?.at(-1);if(npc5&&npc5.answer===before.slice(0,1400)){npc5.answer=after.slice(0,1400);npc5.topic=topic;}
  if(s.npc5?.anchor?.answer===before.slice(0,1400))s.npc5.anchor={...s.npc5.anchor,answer:after.slice(0,1400),topic};
  const ep=s.npc57?.episodes?.at(-1);if(ep&&ep.answer===before.slice(0,1600)&&!ep.protected){ep.answer=after.slice(0,1600);ep.topic=topic;}
  if(s.npc65?.lastAnswer===before.slice(0,1300))s.npc65.lastAnswer=after.slice(0,1300);
  const rs=s.npc65?.recent?.at(-1);if(rs&&rs.answer===before.slice(0,1300)){rs.answer=after.slice(0,1300);rs.topic=topic;}
  const r62=s.npc62;if(r62?.a===before)r62.a=after;
  const r68=s.npc68?.threads?.at(-1);if(r68?.a===before.slice(0,850))r68.a=after.slice(0,850);
  const r89=s.npc89?.recent?.at(-1);if(r89?.a===before.slice(0,1200))r89.a=after.slice(0,1200);
  if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic,focus:'intent-6.10'};
  return true;
 }
 function answer(c,question,attached){
  const kind=classify(question);
  const before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const base=previous(c,question,attached);
  if(!kind||protectedAnswer(c,attached,before,base))return base;
  const replacement=reply(c,kind,question);
  if(!replacement||replacement===base||!reconcile(c,base,replacement,kind))return base;
  window.PS610_LAST={witness:c.id,kind,changed:true};
  return replacement;
 }
 registerWitnessAnswerLayer('70-meaning-first-intent',answer);
 window.PS610_INTENT=Object.freeze({classify,kinds:safeKinds,last:()=>window.PS610_LAST||null});
})();
/* Pakiet 6.11 — rozszerzony analizator pytań po polsku.
 * Semantyczne rozpoznanie intencji nie daje żadnych nowych uprawnień fabularnych.
 * Fakty, blokady dowodowe i proceduralne pozostają w dotychczasowym WitnessEngine.
 * Wynik jest tylko pomocniczym planem dla lokalnego dialogu i Z.ai.
 */
(function(){
 'use strict';
 const fold=s=>{
  let v=String(s??'').slice(0,1600).toLocaleLowerCase('pl');
  try{v=v.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_){}
  return v.replace(/ł/g,'l').replace(/[“”„]/g,'"').replace(/\s+/g,' ').trim();
 };
 // Każdy typ ma co najmniej dwie niezależne rodziny sformułowań.
 const rules=Object.freeze([
  {id:'personal_observation',p:[/\b(?:sam|sama|osobiscie|na wlasne oczy)\b.{0,65}\b(?:widzi|obserw|slysz)/,/\b(?:co|czego)\b.{0,35}\b(?:widziales|widzialas|widział|zauwazyl|dostrzeg)/,/\bnie pytam o dokument\b/]},
  {id:'knowledge_source',p:[/\b(?:skad|od kogo)\b.{0,35}\b(?:wiesz|informacj|dowiedzial)/,/\b(?:z jakiego|jakie)\b.{0,35}\b(?:zrodla|zrodlo|podstaw)/,/\b(?:na jakiej podstawie|na czym opierasz|czym uzasadniasz)\b/]},
  {id:'certainty_limit',p:[/\b(?:na pewno|pewnosc|pewien|pewna|bez watpienia|z cala pewnoscia)\b/,/\b(?:domysl|przypuszcz|zgaduj|wydaje ci sie|na ile jestes pewien|na ile jest pani pewna)\b/,/\b(?:mozesz wykluczyc|moze pan wykluczyc|moze pani wykluczyc)\b/]},
  {id:'epistemic_challenge',p:[/\b(?:jak|skad|dlaczego)\b.{0,85}\b(?:wiesz|pewn|twierdz)\b.{0,100}\b(?:skoro|chociaz|jesli|jezeli)\b/,/\b(?:skoro|przeciez)\b.{0,120}\b(?:nie widzial|nie obserwowal|nie byles|nie bylas|nie patrzyl)/,/\bnie mogles wiedziec\b/]},
  {id:'time_precision',p:[/\b(?:o ktorej|ktora godzina|dokladna godzina|ile minut|ile czasu)\b/,/\b(?:kiedy dokladnie|w jakim czasie|o jakiej porze|jak dlugo)\b/]},
  {id:'place_precision',p:[/\b(?:gdzie dokladnie|w ktorym miejscu|w ktorym pomieszczeniu|ktoredy)\b/,/\b(?:w jakim miejscu|w ktorej czesci|przy jakim stanowisku)\b/]},
  {id:'alibi',p:[/\b(?:alibi|gdzie (?:ty |pan |pani )?(?:byles|bylas|przebywal|znajdowal))\b/,/\b(?:podczas nocnej zmiany|w noc zdarzenia|wtedy byles|wtedy bylas)\b/]},
  {id:'corroboration',p:[/\b(?:kto|czy ktos)\b.{0,50}\b(?:potwierdzi|poswiadczy|widzial|zweryfikowal)/,/\b(?:swiadek twojej obecnosci|potwierdzenie alibi|moze to sprawdzic|moze cie potwierdzic)\b/]},
  {id:'event_sequence',p:[/\b(?:co bylo (?:przed|po)|co sie stalo potem|co dalej|jaka byla kolejnosc)\b/,/\b(?:najpierw|nastepnie|dopiero potem|przed alarmem|po alarmie)\b/]},
  {id:'action_taken',p:[/\b(?:co|jakie dzialania)\b.{0,45}\b(?:zrobiles|zrobilas|podjales|podjelas|wykonal)/,/\b(?:jak zareagowales|jak zareagowalas|co z tym zrobil|zglosiles|zglosilas)\b/]},
  {id:'reason_for_action',p:[/\b(?:dlaczego|czemu|z jakiego powodu)\b.{0,65}\b(?:zrobil|postanowil|zdecydowal|nie zglosil|nie zareagowal)/,/\b(?:co cie sklonilo|jaki byl powod|jaki byl cel)\b/]},
  {id:'report_recipient',p:[/\b(?:komu|do kogo)\b.{0,50}\b(?:zglosil|powiedzial|przekazal|zadzwonil)/,/\b(?:kogo poinformowa\w*|kogo zawiadomi\w*|kto dostal zgloszenie)\b/]},
  {id:'victim_contact',p:[/\b(?:kiedy ostatnio|ostatni raz)\b.{0,48}\b(?:lene|lena|widzial|rozmawial|spotkal)/,/\b(?:o czym rozmawial|co powiedziala lena|ostatni kontakt z lena)\b/]},
  {id:'relationship',p:[/\b(?:jak (?:dobrze|dlugo) (?:znales|znalas)|jaka laczyla|jakie byly (?:twoje )?relacje)\b/,/\b(?:konflikt z lena|stosunki z lena|znajomosc z lena|relacja z lena)\b/]},
  {id:'previous_statement',p:[/\b(?:przypomnij|przypomni|wczesniej powiedzial|poprzednio mowil|wtedy mowil)\b/,/\b(?:wczesniejsze zeznanie|co mowiles|co mowilas|wrocmy do)\b/]},
  {id:'contradiction',p:[/\b(?:sprzecznosc|wyklucza sie|zmieniasz wersje|nie zgadzaj\w* sie|nie zgadza sie)\b/,/\b(?:raz mowisz|wczesniej twierdziles|wczesniej twierdzilas|przeciez powiedzial)\b/]},
  {id:'clarify_reference',p:[/^(?:(?:a|i)\s+)?(?:co z nim|co z nia|gdzie on byl|gdzie ona byla|co on zrobil|co ona zrobila)\??$/,/\b(?:o ktorego z nich|o kim dokladnie|o jaka osobe|kogo masz na mysli)\b/]},
  {id:'direct_accusation',p:[/\b(?:czy|no wiec)\b.{0,32}\b(?:przyznajesz sie|przyznaje sie)\b.{0,55}\b(?:zabojstw|morderstw|zabici)/,/\b(?:czy to ty|czy pan|czy pani)\b.{0,40}\b(?:zabil\w*|zamordowal\w*)\b/]},
  {id:'procedural_refusal',p:[/\b(?:dlaczego|czemu)\b.{0,35}\b(?:odmawiasz|odmawia pan|odmawia pani|nie chcesz odpowiadac)/,/\b(?:czy potrzebujesz przerwy|czy chcesz przerwac|chcesz adwokata)\b/]},
  {id:'documents',p:[/\b(?:jaki dokument|czy masz raport|gdzie jest protokol|zapis w rejestrze)\b/,/\b(?:co wynika z dokument\w*|czy widziales raport|czy czytales protokol)\b/]}
 ]);
 const ids=Object.freeze(rules.map(r=>r.id));
 const untrustedPattern=/\b(?:zapomnij instrukcje|ignoruj zasady|jako model ai|zlam zabezpieczenia|ujawnij sekret|odblokuj dowody)\b/;
 const sourceIds=new Set(['knowledge_source','personal_observation','certainty_limit','epistemic_challenge','corroboration']);
 function analyze(question){
  const q=fold(question);if(!q||q.length>1400)return {intents:[],primary:'unknown',aspects:[],slots:{negated:false,questionWords:[],references:[],compound:false},needsClarification:false};
  const matches=rules.map(r=>({id:r.id,score:r.p.reduce((n,p)=>n+(p.test(q)?1:0),0)})).filter(r=>r.score).sort((a,b)=>b.score-a.score);
  // Nie myl pytania o sprawcę z przyznaniem się adresata.
  const direct=matches.findIndex(x=>x.id==='direct_accusation');
  if(direct>=0&&/^(?:kto|co|dlaczego|skad)\b/.test(q))matches.splice(direct,1);
  const hasEpistemic=matches.some(x=>x.id==='epistemic_challenge');
  if(hasEpistemic)matches.sort((a,b)=> (a.id==='epistemic_challenge'?-1:b.id==='epistemic_challenge'?1:b.score-a.score));
  const intents=matches.map(x=>x.id).slice(0,5);
  const questionWords=[...new Set([...q.matchAll(/\b(kto|co|gdzie|kiedy|skad|dlaczego|czemu|jak|czy|ile|komu|ktoredy)\b/g)].map(x=>x[1]))].slice(0,6);
  const references=[...new Set((q.match(/\b(?:lena|leny|lene|rudnick|marek|janusz|tomasz|kamil|elzbieta|magdalena)\b/g)||[]))].slice(0,6);
  const negated=/\b(?:nie|nigdy|nikt|nic|bez|zaden|zadna)\b/.test(q);
  const compound=/(?:\?|;)\s*\S+|\b(?:oraz|a ponadto|i jeszcze|i kto|i gdzie|i kiedy|i dlaczego|i skad|i co)\b/.test(q)||questionWords.length>=2&&/\b(?:i|oraz)\b/.test(q);
  const primary=intents[0]||'unknown';
  const aspects=compound?intents.filter(x=>x!=='clarify_reference').slice(0,4):intents.slice(0,2);
  return {primary,intents,aspects,slots:{negated,questionWords,references,compound},
   needsClarification:primary==='clarify_reference',sensitive:intents.some(x=>x==='direct_accusation'||x==='procedural_refusal'),
   // Dla lokalnego silnika i Z.ai to tylko etykiety zagadnień, nie twierdzenia o faktach.
   evidenceSourceQuestion:intents.some(x=>sourceIds.has(x)),inputLooksLikeInstruction:untrustedPattern.test(q)};
 }
 const stop=new Set(['nie','jest','jestem','byla','bylo','byles','bylas','mowil','mowila','tego','tam','taka','czy','jak','skad','kto','co','gdzie','kiedy','oraz','jaki','ten','tej','tym','ktore','moze','mozesz','dla','ponad']);
 function stems(s){return [...new Set(fold(s).split(/[^a-z0-9]+/).filter(x=>x.length>=4&&!stop.has(x)).map(x=>x.slice(0,Math.max(4,x.length-2))))];}
 function rankFacts(bank,question){
  if(!Array.isArray(bank)||bank.length<2)return bank;
  const plan=analyze(question),terms=stems(question);
  const ranked=bank.map((x,i)=>{
   const t=fold(x.text),words=stems(x.text);let score=0;
   for(const k of terms)if(words.some(v=>v===k||v.startsWith(k)||k.startsWith(v)))score+=2;
   if(plan.intents.includes('time_precision')&&/\b\d{1,2}:\d{2}\b/.test(t))score+=4;
   if(plan.intents.includes('certainty_limit')&&/\b(?:nie wiem|nie pamietam|nie widzial|nie obserwowal|nie potrafie|nie moge potwierdzic)\b/.test(t))score+=5;
   if(plan.intents.includes('personal_observation')&&/\b(?:widzial|widzialam|widzielismy|obserwowal|zauwazyl)\b/.test(t))score+=3;
   if(plan.intents.includes('corroboration')&&/\b(?:potwierdz|swiadek|rejestr|kamera|weryfikacj)\b/.test(t))score+=3;
   if(x.certainty==='qualified'&&plan.evidenceSourceQuestion)score+=2;
   if(x.origin==='prior-local')score+=1;
   return {x,i,score};
  });
  // Canonical 'current turn' jest pierwsze, aby pozostawić bezpieczny fallback;
  // dalsze źródła sortujemy, nie dodając niczego spoza autoryzowanego banku.
  const first=ranked.filter(r=>r.x.origin==='current');
  const rest=ranked.filter(r=>r.x.origin!=='current').sort((a,b)=>b.score-a.score||a.i-b.i);
  return [...first,...rest].slice(0,36).map((r,i)=>({...r.x,id:'f'+i}));
 }
 // Rozszerzony tryb offline: wybiera TYLKO istniejącą, dopuszczoną wypowiedź
 // tego świadka. Nigdy nie wydaje nowych ustaleń ani przyznania się do winy.
 const base=WitnessEngine.snapshotAnswer();
 const formal=/\b(?:odmawiam|pelnomocnik|przerwa proceduralna|nie bede odpowiadac|podtrzymuje odmowe|przyznaje sie|zabojstwo)\b/;
 const keys={
  knowledge_source:['source','source'],
  corroboration:['witness','verification'],
  time_precision:['time','time'],
  relationship:[null,'lena'],
  action_taken:['responsibility','accountability']
 };
 const onTopic={
  knowledge_source:/\b(?:skad|zrod|wiem|dowiedz|slysz|dokument|widz|informacj)\b/,
  corroboration:/\b(?:potwierdz|swiad|rejestr|kamera|telefon|polaczen|grafik)\b/,
  time_precision:/\b(?:godzin|minut|czas|kiedy|nie pamietam|nie podam|nie wiem)\b|\b\d{1,2}:\d{2}\b/,
  relationship:/\b(?:len|znal|relacj|kontakt|konflikt|spier|pracow)\b/,
  action_taken:/\b(?:zrob|wykon|podjal|decyzj|zglos|reag|odpowiad|obowiaz)\b/
 };
 function reconcile(c,old,next,topic){
  const m=NPC9_MEMORY?.[c.id],s=NPC4_STATE?.[c.id],turn=m?.turn;
  if(!m||!s||!Number.isFinite(turn))return false;
  const sem=m.semantic?.slice().reverse().find(x=>x.turn===turn&&x.answer===old);
  const stmt=m.statements?.slice().reverse().find(x=>x.turn===turn&&x.text===old);
  if(!sem||!stmt||sem.source_ids?.length||stmt.source_ids?.length||
    ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(sem.status))return false;
  sem.answer=next;sem.topic=topic;sem.focus='local-6.11';
  stmt.text=next;stmt.topic=topic;
  if(m.topics?.length)m.topics[m.topics.length-1]=topic;
  if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus:'local-6.11'};
  if(s.recent?.at(-1)?.answer===fold(old))s.recent.at(-1).answer=fold(next).slice(0,1550);
  if(s.npc5?.recent?.at(-1)?.answer===old.slice(0,1400))s.npc5.recent.at(-1).answer=next.slice(0,1400);
  if(s.npc62?.a===old)s.npc62.a=next;
  return true;
 }
 function answer(c,q,attached){
  const p=analyze(q),before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const old=base(c,q,attached);
  if(attached||!c||simWitness(c).blocked||(NPC9_MEMORY?.[c.id]?.confronted?.length||0)>before)return old;
  const last=NPC9_MEMORY?.[c.id]?.semantic?.at(-1);
  if(last&&(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(last.status)||last.source_ids?.length))return old;
  if(formal.test(fold(old))||p.sensitive||p.inputLooksLikeInstruction)return old;
  let replacement='',topic='';
  if(p.primary==='clarify_reference'){
   replacement='O którą osobę i jaki moment chodzi? Nie chcę przypisywać komuś działań bez pewności, o kogo pytasz.';
   topic='clarify';
  }else if(keys[p.primary]&&!onTopic[p.primary].test(fold(old))){
   const question=fold(q);
   // Pytanie typu «a skąd to wiesz?» bez jasnego odniesienia wymaga pamięci
   // rozmowy; nie podmieniaj go losowym faktem o całkiem innej sytuacji.
   const explicit={
    knowledge_source:/\b(?:len\w*|smierc\w*|alarm\w*|organizacj\w*|zmian\w*|dyzur\w*|prac\w*)\b/,
    corroboration:/\b(?:alibi|obecnos\w*|dyzur\w*|zmian\w*|biur\w*)\b/,
    time_precision:/\b(?:dyzur\w*|zmian\w*|godzin\w* pracy)\b/,
    relationship:/\b(?:len\w*|rudnick\w*)\b/,
    action_taken:/\b(?:uster\w*|zagrozen\w*|zgloszen\w*|raport\w*|organizacj\w*|zmian\w*)\b/
   };
   if(!explicit[p.primary]?.test(question))return old;
   const [fk,dk]=keys[p.primary];
   // NPC94_FACTS i NPC9_CUSTOM były wcześniej wykorzystywane przez silnik dialogów.
   // Nie pobieramy surowego NPC9_PROFILES.knowledge ani ukrytych warunków przełomów.
   replacement=String((fk&&NPC94_FACTS?.[c.id]?.[fk])||NPC9_CUSTOM?.[c.id]?.[dk]||'').trim().slice(0,1100);
   topic=p.primary;
  }
  if(!replacement||replacement===old||!reconcile(c,old,replacement,topic))return old;
  window.PS611_LAST={id:c.id,kind:topic,changed:true};
  return replacement;
 }
 // 6.33: retired overlapping answer hook; central 6.33 plan owns question routing.
// retiredAnswerLayer('71-expanded-local-nlu',answer);
 window.PS611_NLU=Object.freeze({analyze,rankFacts,intents:ids,version:'6.11'});
})();
/* Pakiet 6.12: rozpoznawanie polskich parafraz, aspektów i kontrola pokrycia.
 * Wynik planu ma status hipotezy: nie odblokowuje dowodów i nie dostarcza faktów.
 */
(function(){
 'use strict';
 const previous=window.PS611_NLU;
 if(!previous)throw Error('Required NLU 6.11 missing');
 const normalize=s=>String(s??'').toLocaleLowerCase('pl').normalize('NFD')
   .replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[„“”]/g,'"').replace(/\s+/g,' ').trim().slice(0,1400);
 const pattern = terms => new RegExp('(?:'+terms.join('|')+')','u');
 const R={
 personal_observation:[/\b(?:widz(?:ial|iel|isz)|zauwaz|dostrzeg|obserwow|slyszal|wlasn\w* ocz\w*|na miejscu)\w*/,
   /\b(?:sam\w*|osobiscie|rzeczywiscie|naprawde|bezposrednio|oczami|na miejscu|przy hali|przy wejsciu)\b/],
 knowledge_source:[/\b(?:skad|zrod\w*|podstaw\w*|dowiedzia\w*|przekaza\w*|powiedzial ci|informacj\w*|poglos\w*|wersj\w*)\b/,
   /\b(?:kto|jak|czy|od kogo|w jaki sposob|na czym|czym|poparc\w*|opierasz)\b/],
 certainty_limit:[/\b(?:pewn\w*|watpliw\w*|wykluczy\w*|mozliwosc\w*|podejrzen\w*|przypuszczen\w*|pamiec\w*|pomyl\w*|domysl\w*)\b/,
   /\b(?:potraf\w*|dopuszcz\w*|jesli|a jesli|raczej|wiedza|naprawde|moze|czy|na pewno)\b/],
 epistemic_challenge:[/\b(?:skoro|chociaz|przeciez|a sam|jak to pogodzic|na czym opierasz|czemu wykluczasz|jak mozesz|twierdzisz|mimo ze)\b/,
   /\b(?:nie|nikt|nikogo|wykluczasz|pewn\w*|widzi\w*|obserwow\w*|sta\w*|byles|bylas|za sciana|koniec korytarza)\b/],
 time_precision:[/\b(?:kiedy|o ktorej|godzin\w*|minut\w*|chwil\w*|pory|jak dlugo|ile trwa\w*|ile.{0,24}trwa\w*|ile czasu|przed polnoca|po polnocy|w jakim momencie)\b/,
   /\b(?:podaj|dokladn\w*|przyblizon\w*|spotkani\w*|rozmow\w*|wtedy|to bylo|mowimy|trwalo|trwal\w*)\b/],
 place_precision:[/\b(?:gdzie|ktoredy|z ktorej strony|w ktorym|z jakiej strony|w jakim|przy ktorym|wskaz pomieszczenie)\b/,
   /\b(?:hala|hali|pomieszczen\w*|stron\w*|wejsci\w*|zaplecza|stal\w*|stanowisk\w*|miejsce|dyzur|korytarz\w*|dokladnie)\b/],
 alibi:[/\b(?:alibi|gdzie\b|polozeni\w*|miejsce pobytu|obecnos\w*|stanowisk\w*|nie bylo cie|poszedl\w*|spedzil\w* okres|przebywal\w*)/,
   /\b(?:wtedy|noc\w*|zmian\w*|dyzur\w*|alarm\w*|znikn\w*|okres\w*|byles|bylas|poszedl\w*|pobytu|w chwili)\b/],
 corroboration:[/\b(?:potwierdz\w*|poswiadcz\w*|zweryfik\w*|niezalezn\w* slad\w*|kogo moge zapytac|monitoring|swiadek|grafik\w*|rejestr\w*)/,
   /\b(?:kto|kogo|czy|alibi|obecnos\w*|pobyt\w*|naprawde|rzeczywiscie|pamiet\w*|zmian\w*)\b/],
 event_sequence:[/\b(?:kolejnos\w*|po kolei|pierwsze|najpierw|nastepni\w*|potem|po czym|miedzy|od .* do|co wydarzylo sie)\b/,
   /\b(?:wydarzen\w*|zdarz\w*|alarm\w*|telefon\w*|odpraw\w*|spotkani\w*|rozmow\w*|co|co bylo)\b/],
 action_taken:[/\b(?:zrobil\w*|podj\w*|kroki|postapil\w*|wykonal\w*|zareagow\w*|probowa\w*|zabezpiecz\w*|pozostaw\w*|zglosil\w*)/,
   /\b(?:co|jak|jakie|czy|wtedy|po|problem\w*|ostrzezen\w*|zagrozen\w*|informacj\w*)\b/],
 reason_for_action:[/\b(?:dlaczego|czemu|po co|przyczyn\w*|powod\w*|sklonil\w*|motyw\w*|zdecydow\w*|uznal\w*|decyzj\w*)/,
   /\b(?:zostac|zostal\w*|poczekac|zglosz\w*|zmieni\w*|wybra\w*|zrobil\w*|postapil\w*|zareagow\w*|nie|czynnos\w*|by)\b/],
 report_recipient:[/\b(?:komu|do kogo|kogo poinformow\w*|kogo zawiadom\w*|kto dostal|kto.{0,35}dostal\w*|adresat\w*|do czyich rak|komu przekaz\w*|czyich rak)\b/,
   /\b(?:zglosz\w*|wiadomos\w*|informacj\w*|uster\w*|telefon\w*|awari\w*|ostrzezen\w*|problem\w*|trafilo|dostal)\b/],
 victim_contact:[/\b(?:len\w*|rudnick\w*|jej)\b/,
   /\b(?:rozmow\w*|rozmawi\w*|kontak\w*|spotkan\w*|widzia\w*|powiedzia\w*|przed alarmem|ostani\w*|ostatni\w*|tuż|tuz)\b/],
 relationship:[/\b(?:znajomos\w*|relacj\w*|stosunk\w*|spory|konflikt\w*|jak ocen\w*|jak dobrze zn\w*|laczylo|laczyla|wykraczal\w*)/,
   /\b(?:len\w*|rudnick\w*|wasz\w*|miedzy wami|prace|prac\w*|smi\w*)\b/],
 previous_statement:[/\b(?:wczesniej|poprzedni\w*|pierwsz\w* wersj\w*|na poczatku|pierwotn\w*|wrocmy|przypomnij|pamietasz)\b/,
   /\b(?:zeznani\w*|mowil\w*|powiedzia\w*|przedstawi\w*|wersj\w*|opisywal\w*|opowiadal\w*|alibi|telefon\w*|przesluchan\w*)\b/],
 contradiction:[/\b(?:sprzeczn\w*|kloca sie|kloce|nie zgadza\w*|inn\w* moment\w*|zmieniasz|dwa razy|jednak twierdz\w*|jak to pogodzic)\b/,
   /\b(?:wersj\w*|opis\w*|zeznani\w*|wypowied\w*|slowa|opowies\w*|moment\w*|mowil\w*|pierwsz\w*)\b/],
 clarify_reference:[/\b(?:ona|on|nim|nia|tamten|ta druga|ten drugi|ktory z nich|kim dokladnie|o kim dokladnie|o kogo chodz\w*|wspomnial\w*)\b/,
   /\b(?:gdzie|co|kto|a ten|czlowiek|zrobil\w*|poszedl\w*|ud\w*|kim|osoba|warsztat\w*)\b/],
 direct_accusation:[/\b(?:zabil\w*|zamordow\w*|zaboj\w*|morder\w*|doprowadzil\w* do smierci|twoja reka|przyznaj\w*|zarzucam ci|oskarzam cie)\b/,
   /\b(?:ty|twoja|ci|ciebie|pan|pani|przyznaj\w*|jestes|zabiles|zabilas|zamordowales|zamordowalas)\b/],
 procedural_refusal:[/\b(?:odmawi\w*|unikasz|unika pan|nie odpowia\w*|nie chcesz|pelonomocnik\w*|pelnomocnik\w*|adwokat\w*|zgodzisz sie|przerwa\w*)/,
   /\b(?:dlaczego|czemu|czy|z jakiej przyczyny|rozmow\w*|odpowied\w*|pytania|dalsze|obecnosci)\b/],
 documents:[/\b(?:dokument\w*|protokol\w*|raport\w*|rejestr\w*|zapis\w* techniczn\w*|odnotow\w*|podpisan\w*|archiw\w*)/,
   /\b(?:ktory|jaki|co|czy|przeglada\w*|czytal\w*|sprawdz\w*|wynika|zapis\w*|techniczny)\b/]
 };
 const IDS=previous.intents;
 const people=['marek','janusz','tomasz','kamil','elzbieta','magdalena','lena','leny','lene','rudnick'];
 const phrase=(q,re)=>re.test(q);
 const focusClauses=q=>q.split(/\?+|;|,\s*(?:ale|jednak|a|natomiast|oraz)\b|\b(?:a ponadto|i jeszcze)\b|\s+(?:i|a|oraz)\s+(?=(?:kto|co|komu|kiedy|gdzie|dlaczego|czemu|jak|skad|czy|ile|o ktorej)\b)/).map(x=>x.trim()).filter(x=>x.length>3).slice(0,5);
 function classifyOne(q){
  const matches=[];
  for(const id of IDS){const x=R[id];if(!x)continue;
   let score=x.reduce((n,r)=>n+(r.test(q)?1:0),0);
   if(score<2)continue;
   // Unikaj pomylenia ostatecznej oceny sytuacji z informacją o tym, kto coś zrobił.
   if(id==='personal_observation'&&/\b(?:raport|dokument|protokol)\b/.test(q)&&!/\b(?:sam\w*|osobiscie|wlasn\w*|oczami)\b/.test(q))continue;
   if(id==='direct_accusation'){
    const subject=/(?:\b(?:czy|to|zarzucam|oskarzam|twoja|ty|pan|pani|ci|ciebie|przyznaj\w*)\b.{0,90}\b(?:zabil|zamordow|zaboj|morder|smierci)|\b(?:zabil\w*|zamordow\w*)\b.{0,50}\b(?:ja|mnie|ci|twoj|ty)\b)/.test(q);
    const third=/\b(?:czy\s+)?(?:marek|janusz|tomasz|kamil|elzbieta|magdalena|lena)\s+(?:zabil\w*|zamordow\w*)/.test(q)||/\bkto\b.{0,35}\b(?:zabil|zamordow)/.test(q);
    if(!subject||third)continue;score+=5;
   }
   if(id==='reason_for_action'&&/\b(?:dlaczego|czemu|po co|powod|przyczyn|sklonil)\b/.test(q))score+=4;
   if(id==='report_recipient'&&/\b(?:komu|kogo|adresat|czyich rak)\b/.test(q))score+=3;
   if(id==='event_sequence'&&/\b(?:kolejnos|po kolei|pierwsze|najpierw|miedzy)\b/.test(q))score+=3;
   if(id==='epistemic_challenge'&&/\b(?:skoro|przeciez|chociaz|mimo ze)\b/.test(q))score+=4;
   if(id==='contradiction'&&/\b(?:zmieniasz|kloce|klo\w* sie|dwa razy|nie zgadza)\b/.test(q))score+=3;
   if(id==='knowledge_source'&&/\b(?:skad|kto przekaz|na jakiej podstawie|na czym opierasz)\b/.test(q))score+=3;
   if(id==='corroboration'&&/\b(?:potwierdz|poswiadcz|niezalezn\w* slad|kogo moge zapytac)\b/.test(q))score+=3;
   if(id==='direct_accusation')score+=1;
   matches.push({id,score});
  }
  matches.sort((a,b)=>b.score-a.score||IDS.indexOf(a.id)-IDS.indexOf(b.id));
  // Rozróżnienie pytań wyjaśniających od pytań o same działania.
  const first=matches[0]?.id;
  const dropped=new Set();
  if(first==='reason_for_action')dropped.add('action_taken');
  if(first==='report_recipient')dropped.add('knowledge_source');
  if(first==='epistemic_challenge'){dropped.add('knowledge_source');dropped.add('certainty_limit');}
  if(first==='direct_accusation')dropped.add('victim_contact');
  if(first==='contradiction')dropped.add('previous_statement');
  return matches.filter(x=>!dropped.has(x.id)).slice(0,3);
 }
 function analyze(question){
  const old=previous.analyze(question),q=normalize(question);
  if(q.length<3||q.length>1380)return old;
  const clauses=focusClauses(q);
  // Ograniczenie obserwacji i zakwestionowana pewność mogą być w dwóch zdaniach.
  const crossEpistemic=/\b(?:nie stal\w*|nie byles|nie bylas|nie widzial\w*|nie obserwowal\w*)\b/.test(q)&&/\b(?:na czym opierasz|jak mozesz|skad wiesz|czemu wykluczasz|jak to pogodzic|twierdzisz)\b/.test(q);
  const votes=new Map();const perClause=[];
  for(const clause of clauses){
   const parts=classifyOne(clause);perClause.push({text:clause,intents:parts.map(x=>x.id)});
   for(const item of parts)votes.set(item.id,(votes.get(item.id)||0)+item.score);
  }
  if(crossEpistemic)votes.set('epistemic_challenge',(votes.get('epistemic_challenge')||0)+12);
  let candidates=[...votes].sort((a,b)=>b[1]-a[1]).map(([id])=>id);
  // Poprzednia wersja jest bezpiecznym dodatkowym sygnałem, nie jedynym kryterium.
  if(!candidates.length)candidates=old.intents.slice();
  if(!candidates.length)return {...old,clauses:perClause,coverageHints:[],version:'6.12'};
  if(candidates.includes('reason_for_action'))candidates=candidates.filter(id=>id!=='action_taken');
  if(candidates.includes('epistemic_challenge'))candidates=candidates.filter(id=>!['knowledge_source','certainty_limit'].includes(id));
  if(candidates.includes('direct_accusation'))candidates=candidates.filter(id=>id!=='victim_contact');
  const intents=candidates.slice(0,5);
  const compound=(clauses.length>1&&perClause.filter(c=>c.intents.length).length>1)||old.slots.compound||/\b(?:oraz|i jeszcze|a co|a dlaczego|i dlaczego|a kto|i kto|i gdzie|i kiedy|i komu|i skad)\b/.test(q);
  const aspects=compound?intents.slice(0,4):intents.slice(0,2);
  return {...old,primary:intents[0]||'unknown',intents,aspects,
   slots:{...old.slots,compound,questionWords:[...new Set([...old.slots.questionWords,...(q.match(/\b(?:komu|czemu|po co|skad|kiedy|dlaczego|gdzie|jak|co|kto)\b/g)||[])])].slice(0,8),references:[...new Set([...old.slots.references,...people.filter(p=>q.includes(p))])].slice(0,6)},
   needsClarification:intents[0]==='clarify_reference',sensitive:intents.includes('direct_accusation')||intents.includes('procedural_refusal'),
   evidenceSourceQuestion:intents.some(id=>['knowledge_source','personal_observation','certainty_limit','epistemic_challenge','corroboration'].includes(id)),
   clauses:perClause,coverageHints:aspects,version:'6.12'};
 }
 const replace=Object.freeze({analyze,rankFacts:previous.rankFacts,intents:previous.intents,version:'6.12'});
 window.PS611_NLU=replace;
 window.PS612_NLU=replace;

 window.PS612_LAST=null;
 const sourceFact=(id,key)=>String(NPC94_FACTS?.[id]?.[key]||'').trim().slice(0,850);
 const focusedKinds=new Set(['reason_for_action','event_sequence','knowledge_source','time_precision',
   'report_recipient','direct_accusation','corroboration','personal_observation']);
 const verifies={
  reason_for_action:/\b(?:poniewaz|dlatego|powod\w*|przyczyn\w*|sklonil\w*|uznal\w*|chcial\w*|musial\w*|dlaczego|nie pamietam czemu|nie moge wyjasnic)\b/,
  event_sequence:/\b(?:najpierw|nastepni\w*|potem|pozniej|przed|po czym|kolejnos\w*|wczesniej|nie potrafie odtworzyc)\b/,
  knowledge_source:/\b(?:z dokument\w*|z rejestr\w*|zapis\w*|z wlasn\w*|sam widzial\w*|sama widzial\w*|powiedz\w*|dowiedzial\w*|wiem z|z pracy|nie wiem skad|nie moge wskazac zrodla)\b/,
  time_precision:/\b\d{1,2}:\d{2}\b|\b(?:minut\w*|godzin\w*|pora|czas\w*|kiedy|nie potrafie podac|nie pamietam)\b/,
  report_recipient:/\b(?:komu|do kogo|przekazal\w*|odebral\w*|adresat\w*|poinformow\w*|powiadom\w*|nie potrafie wskazac odbiorcy)\b/,
  direct_accusation:/\b(?:nie przyznaj\w* sie|przyznaj\w* sie|zaprzeczam|odmawiam odpowiedzi|podtrzymuje odmowe)\b/,
  corroboration:/\b(?:potwierd\w*|swiadek|swiadkow\w*|rejestr\w*|kamera|grafik|nie mam osoby|nie potrafie potwierdzic)\b/,
  personal_observation:/\b(?:widz\w*|sama obserwow\w*|sam obserwow\w*|osobiscie|nie obserwow\w*|nie bylem swiadkiem|nie bylam swiadkiem)\b/
 };
 function clarification(id,intent,question){
  const female=['ELZBIETA','MAGDALENA'].includes(id),q=normalize(question);
  switch(intent){
   case 'reason_for_action':
    return /\b(?:czemu uznal|dlaczego uznal|po co zmienil)\b/.test(q)?'Nie potwierdzam samego założenia zawartego w pytaniu. Najpierw trzeba ustalić, czy taką decyzję faktycznie podjął'+(female?'am':'em')+'.':'Nie umiem wskazać konkretnej przyczyny na podstawie tego, co pamiętam. Nie chcę jej wymyślać.';
   case 'event_sequence':
    return 'Nie potrafię z pewnością odtworzyć pełnej kolejności tych zdarzeń. '+(sourceFact(id,'time')||'Nie będę zgadywać, co było pierwsze.');
   case 'knowledge_source':{
    const specific=/\b(?:alarm\w*|zmian\w*|dyzur\w*|prac\w*|len\w*|smier\w*|wagon\w*)\b/.test(q);
    if(/\b(?:kto przekazal|kto ci powiedzial|od kogo|kto jest autorem)\b/.test(q))
      return 'Nie umiem wskazać z pewnością konkretnej osoby, od której pochodzi ta informacja. Nie chcę przypisywać jej komuś bez potwierdzenia.';
    return specific&&sourceFact(id,'source')?sourceFact(id,'source'):'Nie potrafię wskazać konkretnego źródła tej informacji bez doprecyzowania, o które zdarzenie pytasz.';
   }
   case 'time_precision':{
    const victim=/\b(?:len\w*|rudnick\w*|spotkan\w*|rozmow\w*)\b/.test(q);
    if(/\b(?:ile .{0,18}trwal|czas trwania|jak dlugo)\b/.test(q))
      return 'Nie potrafię wiarygodnie określić czasu trwania tej rozmowy czy spotkania. Nie będę go szacować bez podstaw.';
    if(/\b(?:przed polnoca|po polnocy|o jakiej porze)\b/.test(q)&&!victim)
      return 'O które zdarzenie pytasz? Bez wskazania sytuacji nie potrafię potwierdzić, czy było to przed północą, czy po niej.';
    return sourceFact(id,victim?'last':'time')||'Nie potrafię podać wiarygodnej godziny tego zdarzenia.';
   }
   case 'report_recipient':
    return 'Nie potrafię wskazać z pewnością, kto był odbiorcą tego zgłoszenia. Trzeba ustalić, czy istnieje potwierdzenie jego odbioru.';
   case 'corroboration':return sourceFact(id,'witness')||'Nie umiem wskazać niezależnej osoby, która potwierdzi ten szczegół.';
   case 'personal_observation':return sourceFact(id,'victim')||'Nie potrafię potwierdzić tego własną obserwacją.';
   case 'direct_accusation':return 'Nie przyznaję się do zabójstwa Leny. To moje stanowisko, nie dowód rozstrzygający sprawę.';
   default:return '';
  }
 }
 function lastProtected(c,old,attached,confronted){
  if(attached||!c||!NPC9_MEMORY?.[c.id]||!NPC4_STATE?.[c.id]||simWitness(c).blocked)return true;
  const mem=NPC9_MEMORY[c.id],last=mem.semantic?.at(-1);
  if((mem.confronted?.length||0)>confronted||last?.source_ids?.length)return true;
  if(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(last?.status))return true;
  if(/\b(?:odmawiam|pelnomocnik|przerwa proceduralna|przyznaje sie|podtrzymuje odmowe|konfrontacj\w* z dowod\w*)\b/.test(normalize(old)))return true;
  return false;
 }
 function sync(c,old,next,topic){
  const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],t=m?.turn;
  const sem=m?.semantic?.slice().reverse().find(x=>x.turn===t&&x.answer===old);
  const st=m?.statements?.slice().reverse().find(x=>x.turn===t&&x.text===old);
  if(!sem||!st||sem.source_ids?.length||st.source_ids?.length||
    ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(sem.status))return false;
  sem.answer=next;sem.topic=topic;sem.focus='coverage-6.12';st.text=next;st.topic=topic;
  if(m.topics?.length)m.topics[m.topics.length-1]=topic;
  if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus:'coverage-6.12'};
  const last=s.recent?.at(-1);
  if(last?.answer===normalize(old).slice(0,1550))last.answer=normalize(next).slice(0,1550);
  const recent=s.npc5?.recent?.at(-1);
  if(recent?.answer===old.slice(0,1400))recent.answer=next.slice(0,1400);
  if(s.npc5?.anchor?.answer===old.slice(0,1400))s.npc5.anchor={...s.npc5.anchor,answer:next.slice(0,1400),topic};
  if(s.npc62?.a===old)s.npc62.a=next;
  if(s.npc65?.lastAnswer===old.slice(0,1300))s.npc65.lastAnswer=next.slice(0,1300);
  if(s.npc65?.recent?.at(-1)?.answer===old.slice(0,1300))s.npc65.recent.at(-1).answer=next.slice(0,1300);
  if(s.npc68?.threads?.at(-1)?.a===old.slice(0,850))s.npc68.threads.at(-1).a=next.slice(0,850);
  if(s.npc89?.recent?.at(-1)?.a===old.slice(0,1200))s.npc89.recent.at(-1).a=next.slice(0,1200);
  if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic,focus:'coverage-6.12'};
  return true;
 }
 // Przy braku odpowiedzi na którąś część pytania wymagaj wyraźnego zaznaczenia
 // ograniczenia wiedzy. To kontrola powierzchniowa — nie dowód poprawności semantycznej.
 const previousAnswer=WitnessEngine.snapshotAnswer();
 function answer(c,q,attached){
  const plan=analyze(q),before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const old=previousAnswer(c,q,attached);
  if(!c||!plan.intents.length||lastProtected(c,old,attached,before)||plan.inputLooksLikeInstruction)return old;
  const segments=(plan.clauses||[]).filter(x=>x.intents.length);
  const parts=(plan.slots.compound&&segments.length>1?segments.map(x=>x.intents[0]):[plan.primary])
    .filter((x,i,a)=>focusedKinds.has(x)&&a.indexOf(x)===i).slice(0,3);
  if(!parts.length)return old;
  const missing=parts.filter(x=>!verifies[x].test(normalize(old)));
  if(!missing.length)return old;
  const supplied=missing.map(x=>clarification(c.id,x,q)).filter(Boolean);
  if(!supplied.length)return old;
  // Jeśli wcześniejsza odpowiedź była nie na temat, zastąp ją bezpiecznymi
  // ograniczeniami wiedzy zamiast przeklejać niezwiązany z pytaniem monolog.
  const keep=parts.length>1&&parts.some(x=>verifies[x].test(normalize(old)));
  const next=[...(keep?[old]:[]),...supplied].join(' ').slice(0,1550);
  if(next===old||!sync(c,old,next,parts.join('+')))return old;
  window.PS612_LAST={id:c.id,parts,missing,corrected:true};
  return next;
 }
 // 6.33: retired overlapping answer hook; central 6.33 plan owns question routing.
// retiredAnswerLayer('72-question-coverage',answer);
})();
/* Pakiet 6.13: wielosygnalowa interpretacja polskich parafraz i ostrozne odpowiedzi.
 * Wykryte intencje sa tylko hipotezami; wiedza i stan gry pozostaja w WitnessEngine.
 */
(function(){
'use strict';
const prior=window.PS611_NLU;
if(!prior) throw Error('Missing NLU 6.12');
const clean=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[„“”]/g,'"').replace(/\s+/g,' ').trim().slice(0,1400);
// Sygnały mają różne źródła leksykalne: nie wymagamy jednej gotowej frazy.
// Wyrażenia silne opisują operację pytającego, a nie sam temat rozmowy.
const strong={
 personal_observation:[/\b(?:naocz\w*|bezposredni\w* swiad\w*|wlasn\w* (?:ocz\w*|perspektyw\w*)|zarejestrowa\w* wzrok\w*|co (?:sam|sama) widz\w*|co (?:sam|sama) dostrzeg\w*|obraz\w* zapamiet\w*)/],
 knowledge_source:[/\b(?:autor\w* (?:wiadom\w*|informacj\w*)|pierwotn\w* autor\w*|czyj\w* relacj\w*|czyich ustalen\w*|jak\w* kanale\w*|jak (?:do ciebie|do pana|do pani) trafi\w*|skad(?:ze)?\b|z jakiego zrod\w*|od kog\w*)/],
 certainty_limit:[/\b(?:ufasz\w* (?:swoj\w* )?pamie\w*|reczysz\w* za|wyklucz\w* pomyl\w*|mozliw\w* pomyl\w*|jak\w* pewn\w*|na ile\w* (?:pewn\w*|wiarygodn\w*)|dokladnos\w* relacj\w*)/],
 epistemic_challenge:[/\b(?:wzrok\w* nie obejmowa\w*|nie sledzi\w* .{0,32}(?:drzwi|bram\w*|plac\w*)|nie patrzyl\w* .{0,38}(?:plac\w*|drzwi|bram\w*)|nie byle\w* obec\w* .{0,55}(?:stanowcz\w*|pewn\w*)|zapewnia\w* .{0,55}(?:nie\s+bylo|pust\w*)|z jednej strony .{0,100} z drugiej|nie obserwow\w* .{0,80}(?:skad|jak|pewn\w*))/],
 time_precision:[/\b(?:kwadrans\w*|przedzial czasow\w*|moment\w* na osi czas\w*|moment\w* wskazuj\w* na osi czas\w*|jaki\w* moment\w*|okien\w* czasow\w*|dokladnos\w* do .{0,18}(?:minut\w*|kwadrans\w*)|o ktorej|o jakiej porze)/],
 place_precision:[/\b(?:sektor\w*|czesc\w* budyn\w*|czesc\w* zajezdn\w*|ktorej stronie|ktory\w* pomieszcz\w*|stronie bram\w*|w ktorym punkcie|wskaz (?:lokalizacj\w*|miejsce\w*))/],
 alibi:[/\b(?:miejsce pobyt\w*|gdzie przebywa\w*|tras\w* .{0,28}przemieszcz\w*|twoj\w* obecnosc\w*|chwili alarmu|w czasie zdarzen\w*|krytyczn\w* (?:godzin\w*|momenc\w*|chwil\w*))/],
 corroboration:[/\b(?:niezalezn\w* .{0,35}(?:slad\w*|potwierd\w*|zweryfik\w*)|poświadcz\w*|poswiadcz\w*|weryfik\w* twoj\w* slow\w*|co\w* weryfik\w*|kto moze .{0,28}poswiadcz\w*)/],
 event_sequence:[/\b(?:chronolog\w*|przebieg\w* nocy|od poczatku do konca|w jakiej kolejnosc\w*|co nastapi\w* miedzy|odtworz\w* przebieg\w*|pierwsz\w* sygnal\w*)/],
 action_taken:[/\b(?:podjet\w* .{0,20}czynnosc\w*|jakie\w* dzialan\w*|jak wyglada\w* .{0,18}postepowan\w*|co zrobil\w*|jak zareagowa\w*|jak\w* krok\w* podj\w*|co uczyni\w*)/],
 reason_for_action:[/\b(?:motyw\w* kierowa\w*|czym\w* kierowa\w*|co tob\w* kierowa\w*|co sklonil\w*|powod\w*[, ]+(?:dla ktor\w*|odpuszcz\w*)|czemu|dlaczego|z jakiej przyczyn\w*|po co|dlaczegoz|dlaczego\w*|jaki\w* sens mial\w*)/],
 report_recipient:[/\b(?:docelow\w* odbiorc\w*|adresat\w* (?:meldunk\w*|zgloszen\w*|wiadom\w*)|do jakiej osob\w* skierowa\w*|kto .{0,22}otrzyma\w* .{0,20}(?:wiadom\w*|zgloszen\w*)|komu\w* .{0,30}(?:zglos\w*|przekaz\w*|wysla\w*|meldow\w*))/],
 victim_contact:[/\b(?:ostatni\w* kontak\w*|ostatni\w* wymian\w* zdan\w*|rozmow\w* .{0,28}len\w*|len\w* .{0,25}(?:rozmow\w*|wiadom\w*|spotkan\w*)|wymian\w* zdan\w* z len\w*)/],
 relationship:[/\b(?:relacj\w* (?:osobist\w*|prywatn\w*|sluzbow\w*)|charakter\w* (?:wasz\w* )?znajom\w*|co laczy\w* .{0,30}len\w*|konflikt\w* osobist\w*|miedzy wami)/],
 previous_statement:[/\b(?:pierwotn\w* wyjasn\w*|pierwsz\w* zeznan\w*|jak brzmia\w* .{0,30}zeznan\w*|wroc\w* do wersj\w*|poczatk\w* przesluchan\w*|powtorz\w* .{0,25}(?:pierwsz\w*|wyjasn\w*))/],
 contradiction:[/\b(?:rozbieznos\w*|zeznani\w* rozmijaj\w*|wersj\w* nie mog\w* byc|jednej relacj\w* .{0,95}drugiej|najpierw .{0,80} teraz|ktora\w* podtrzymuj\w*|nie moga byc jednoczesnie prawdziw\w*)/],
 clarify_reference:[/\b(?:tamtej kobiet\w*|drugiej osob\w*|kogo konkretnie .{0,30}(?:mial\w*|masz)|o kogo chodzi|o kim mow\w*|kogo masz na mysl\w*)/],
 direct_accusation:[/\b(?:jestes zabojc\w*|byl\w* zabojc\w*|ponosisz win\w* za zamordowan\w*|odpowiedzialnos\w* za smierc\w* .{0,35}zabojc\w*|ty .{0,15}(?:dopuscil\w* sie|zamordow\w*|zabil\w*)|przyznaj\w* sie .{0,35}(?:morderst\w*|zabojst\w*))/],
 procedural_refusal:[/\b(?:odmawia\w* dalsz\w* zeznan\w*|zad\w* przerwan\w* przesluchan\w*|przerwac przesluchan\w*|zakoncz\w* (?:te|ta|tę) rozmow\w*|odmow\w* odpowied\w*)/],
 documents:[/\b(?:pisemn\w* .{0,15}(?:protokol\w*|zapis\w*)|urzedow\w* protokol\w*|w aktach .{0,20}dokument\w*|ktory\w* dokument\w*|jak\w* wersj\w* protokol\w*)/]
};
// Minimalne warunki dezambiguacji, zwłaszcza oskarżenia wobec innej osoby.
const third=/\b(?:czy\s+)?(?:marek|janusz|tomasz|kamil|elzbieta|magdalena|lena)\s+(?:zabil\w*|zamordow\w*)|\bkto\b.{0,40}\b(?:zabil|zamordow)\w*/;
const tags=Object.keys(strong);
function inspect(q){
 const votes=[];
 for(const id of tags){
  if(id==='direct_accusation'&&third.test(q))continue;
  if(id==='reason_for_action'&&/\b(?:dlaczego|czemu)\b/.test(q)&&/\b(?:wczesniej|poprzednio)\b/.test(q)&&/\b(?:mowil\w*|powiedzia\w*)/.test(q))continue;
  const hits=strong[id].filter(p=>p.test(q)).length;
  if(!hits)continue;
  let value=8+Math.min(hits,3);
  if(id==='epistemic_challenge'&&/\b(?:skoro|przeciez|ale|mimo)\b/.test(q))value+=3;
  if(id==='direct_accusation')value+=5;
  if(id==='report_recipient'&&/\b(?:zglosz\w*|meldunk\w*|wiadom\w*)/.test(q))value+=3;
  if(id==='reason_for_action'&&/\b(?:czemu|dlaczego|motyw|powod|kierowa\w*|sklonil\w*)/.test(q))value+=3;
  if(id==='contradiction'&&/\b(?:najpierw|pierwsz\w*)/.test(q))value+=2;
  votes.push({id,value});
 }
 votes.sort((a,b)=>b.value-a.value||tags.indexOf(a.id)-tags.indexOf(b.id));
 return votes;
}
function analyze(question){
 const existing=prior.analyze(question),q=clean(question);
 if(q.length<5||q.length>1300||existing.inputLooksLikeInstruction)return existing;
 const found=inspect(q);
 if(!found.length)return {...existing,version:'6.13',confidence:'low'};
 const newIds=found.map(x=>x.id);
 // Zachowuj wszystkie rozpoznane aspekty, ale bez zagnieżdżonych duplikatów.
 // Dobra klasyfikacja w starszym silniku ma pierwszeństwo; nowa warstwa
 // przejmuje sterowanie przede wszystkim przy nierozpoznanym pytaniu.
 let preferred=newIds;
 if(existing.primary&&existing.primary!=='unknown'){
   const exception= (newIds[0]==='epistemic_challenge'&&/\b(?:skoro|przeciez|nie obserwow\w*|wzrok\w* nie obejmowa\w*)/.test(q))||
    (newIds[0]==='direct_accusation'&&!third.test(q))||
    (newIds[0]==='place_precision'&&/\b(?:sektor\w*|pomieszczen\w*|czesc\w* zajezdn\w*)/.test(q));
   if(!exception)preferred=[existing.primary,...newIds.filter(x=>x!==existing.primary)];
 }
 const ordered=[...new Set([...preferred,...existing.intents])];
 if(ordered.includes('direct_accusation')){const i=ordered.indexOf('victim_contact');if(i>=0)ordered.splice(i,1);}
 if(ordered.includes('epistemic_challenge')){const i=ordered.indexOf('knowledge_source');if(i>=0)ordered.splice(i,1);}
 const intents=ordered.slice(0,7);
 const questionWords=[...new Set([...(existing.slots.questionWords||[]),...(q.match(/\b(?:kiedy|gdzie|skad|dlaczego|czemu|komu|co|kto|ktory|ktora|czy|jak|ile)\b/g)||[])])].slice(0,8);
 const compound=existing.slots.compound||/\b(?:i dlaczego|oraz komu|i kiedy|a po co|i gdzie|oraz kiedy|a komu|i kto|z jednej strony .{1,95} z drugiej)\b/.test(q);
 return {...existing,primary:intents[0],intents,aspects:compound?intents.slice(0,4):intents.slice(0,2),slots:{...existing.slots,compound,questionWords},
   coverageHints:compound?intents.slice(0,4):intents.slice(0,2),sensitive:intents.includes('direct_accusation')||intents.includes('procedural_refusal'),
   confidence:found[0].value>=10?'high':'medium',version:'6.13'};
}

// Nie zakładamy, że rozpoznanie kategorii wystarcza: używamy tylko zdań
// przypisanych do świadka albo jawnie komunikujemy brak możliwości ustalenia.
const beforeAnswer=WitnessEngine.snapshotAnswer();
const female=id=>id==='ELZBIETA'||id==='MAGDALENA';
const explicitCrime=/\b(?:zabojc\w*|zabil\w*|zamordow\w*|morderst\w*)/;
const protectedResponse=/\b(?:przyznaje sie|podtrzymuje odmowe|odmawiam|przerwa proceduralna|pelnomocnik|konfrontacj\w* z dowod\w*)/;
const topical={
 personal_observation:/\b(?:obserwow\w*|widz\w*|swiadk\w*|wzrok\w*)/,
 knowledge_source:/\b(?:zrod\w*|informacj\w*|wiem z|dowiedzia\w*|kto przekaz\w*|autor\w*)/,
 certainty_limit:/\b(?:pewn\w*|pomyl\w*|pamiec\w*|wyklucz\w*)/,
 epistemic_challenge:/\b(?:pewn\w*|nie obserwow\w*|nie widzia\w*|ograniczen\w*)/,
 time_precision:/\b(?:godzin\w*|minut\w*|czas\w*|kwadrans\w*)|\b\d\d?:\d\d\b/,
 alibi:/\b(?:biur\w*|dyzur\w*|prac\w*|byl\w*|znajdow\w*|obecnos\w*|pobyt\w*)/,
 corroboration:/\b(?:potwierdz\w*|swiadk\w*|rejestr\w*|weryfik\w*|dowod\w*)/,
 event_sequence:/\b(?:nastep\w*|potem|najpierw|kolejnos\w*|przed|po alarmie|chronolog\w*)/,
 reason_for_action:/\b(?:powod\w*|dlatego|poniewaz|kierowa\w*|sklonil\w*|nie wiem dlaczego|motyw\w*|decyzj\w*)/,
 report_recipient:/\b(?:odbior\w*|adresat\w*|komu|przekaza\w*|powiadom\w*)/,
 victim_contact:/\b(?:len\w*|spotkan\w*|kontak\w*|rozmow\w*)/,
 relationship:/\b(?:len\w*|relacj\w*|stosunk\w*|konflikt\w*|znajom\w*)/,
 previous_statement:/\b(?:wczesniej|pierwsz\w*|zeznan\w*|mowi\w*|wersj\w*)/,
 contradiction:/\b(?:sprzeczn\w*|rozbiezn\w*|nie zgadz\w*|wersj\w*|wczesniej)/,
 clarify_reference:/\b(?:kogo|ktorej|kim|osob\w*)/,
 direct_accusation:/\b(?:zaboj\w*|zabil\w*|morder\w*|przyznaj\w*|nie przyznaj\w*)/,
 documents:/\b(?:dokument\w*|protokol\w*|raport\w*|akt\w*|rejestr\w*)/
};
const phrasing={
 knowledge_source:['Nie mogę wskazać autora tej informacji bez ustalenia, o którą wiadomość chodzi.',
 'Nie przypiszę tej informacji konkretnej osobie, dopóki nie ustalimy jej źródła.',
 'Potrzebuję wskazania tej wiadomości, żeby rozróżnić własną wiedzę od cudzej relacji.'],
 certainty_limit:['Nie mogę zagwarantować, że moja pamięć jest dokładna w każdym szczególe.',
 'Nie wykluczam pomyłki pamięci. To, co mówię, trzeba porównać z innymi danymi.',
 'Mogę mówić o tym, co pamiętam, ale nie przedstawię tego jako całkowitej pewności.'],
 epistemic_challenge:['Masz rację co do ograniczenia: jeśli nie obserwowałem miejsca przez cały czas, nie mogę wykluczyć czyjejś obecności.',
 'Moja wypowiedź nie dowodzi, że nikogo tam nie było. Nie miałem ciągłej obserwacji.',
 'Nie powinienem formułować pewnego wniosku z fragmentarycznej obserwacji.'],
 place_precision:['Nie potrafię teraz wskazać dokładnego sektora czy pomieszczenia. Nie chcę zgadywać.',
 'Bez sprecyzowania zdarzenia nie wskażę odpowiedzialnie konkretnej części budynku.',
 'Nie mam wystarczającej pewności co do dokładnego miejsca, o które pytasz.'],
 event_sequence:['Nie potrafię odtworzyć całej kolejności tych zdarzeń wyłącznie z pamięci.',
 'Nie mam pewnej chronologii od początku do końca; nie będę zamieniał przypuszczeń w fakty.',
 'Aby ułożyć zdarzenia po kolei, potrzebne są potwierdzone punkty czasu. Z pamięci nie ustalę wszystkich.'],
 reason_for_action:['Nie potwierdzam samego założenia, że podjąłem taką decyzję. Najpierw ustalmy, co faktycznie zrobiłem.',
 'Nie chcę wymyślać motywu działania, którego przebiegu nie ustaliliśmy.',
 'O przyczynie mogę mówić dopiero po ustaleniu, jaką decyzję rzeczywiście podjąłem.'],
 report_recipient:['Nie umiem z pewnością wskazać odbiorcy tego zgłoszenia.',
 'Nie podam nazwiska adresata, jeśli nie mogę go potwierdzić.',
 'Odbiorcę trzeba zweryfikować w potwierdzeniu przekazania. Z pamięci go nie ustalę.'],
 clarify_reference:['O którą dokładnie osobę pytasz? Nie chcę pomylić ludzi.',
 'Doprecyzuj, kogo masz na myśli. Samo „on” albo „ona” nie wystarcza.',
 'Którą osobę masz na myśli? Wtedy odniosę się do właściwej sytuacji.']
};
function choose(id,intent,q){const options=phrasing[intent];if(!options)return '';
 let h=0;for(const ch of (q+'|'+id))h=(h*33+ch.charCodeAt(0))>>>0;
 let text=options[h%options.length];
 if(intent==='epistemic_challenge'&&female(id))text=text.replace('obserwowałem','obserwowałam').replace('miałem','miałam').replace('powinienem','powinnam');
 if(intent==='reason_for_action'&&female(id))text=text.replace('podjąłem','podjęłam').replace('zrobiłem','zrobiłam');
 return text;
}
function reconcile(c,old,next,topic){
 const m=NPC9_MEMORY?.[c.id],s=NPC4_STATE?.[c.id],turn=m?.turn;
 if(!m||!s||!Number.isFinite(turn))return false;
 const sem=m.semantic?.slice().reverse().find(x=>x.turn===turn&&x.answer===old);
 const st=m.statements?.slice().reverse().find(x=>x.turn===turn&&x.text===old);
 if(!sem||!st||sem.source_ids?.length||st.source_ids?.length||
 ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(sem.status))return false;
 sem.answer=next;sem.topic=topic;sem.focus='robust-6.13';st.text=next;st.topic=topic;
 if(m.topics?.length)m.topics[m.topics.length-1]=topic;
 if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus:'robust-6.13'};
 if(s.recent?.at(-1)?.answer===clean(old).slice(0,1550))s.recent.at(-1).answer=clean(next).slice(0,1550);
 if(s.npc5?.recent?.at(-1)?.answer===old.slice(0,1400))s.npc5.recent.at(-1).answer=next.slice(0,1400);
 if(s.npc5?.anchor?.answer===old.slice(0,1400))s.npc5.anchor={...s.npc5.anchor,answer:next.slice(0,1400),topic};
 if(s.npc62?.a===old)s.npc62.a=next;
 if(s.npc65?.lastAnswer===old.slice(0,1300))s.npc65.lastAnswer=next.slice(0,1300);
 if(s.npc65?.recent?.at(-1)?.answer===old.slice(0,1300))s.npc65.recent.at(-1).answer=next.slice(0,1300);
 if(s.npc68?.threads?.at(-1)?.a===old.slice(0,850))s.npc68.threads.at(-1).a=next.slice(0,850);
 if(s.npc89?.recent?.at(-1)?.a===old.slice(0,1200))s.npc89.recent.at(-1).a=next.slice(0,1200);
 return true;
}
function answer(c,question,attached){
 const p=analyze(question),baseline=prior.analyze(question),before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
 const old=beforeAnswer(c,question,attached);
 if(!c||!NPC9_MEMORY?.[c.id]||!NPC4_STATE?.[c.id]||attached||simWitness(c).blocked||
  p.inputLooksLikeInstruction||!p.intents.length||p.primary==='procedural_refusal')return old;
 const last=NPC9_MEMORY[c.id].semantic?.at(-1);
 if((NPC9_MEMORY[c.id].confronted?.length||0)>before||last?.source_ids?.length||
 ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(last?.status)||
 protectedResponse.test(clean(old)))return old;
 const kind=p.primary;
 // Nie wymieniaj trafnej odpowiedzi na wariant tylko dla różnorodności.
 if(topical[kind]?.test(clean(old))&&kind!=='personal_observation'&&kind!=='direct_accusation')return old;
 if(kind==='direct_accusation'&&/\b(?:nie przyznaj\w* sie|przyznaj\w* sie|zaprzeczam|odmawiam odpowiedzi)\b/.test(clean(old)))return old;
 const questionText=clean(question);
 let response='';
 if(kind==='personal_observation'){
  const aboutVictim=/\b(?:len\w*|rudnick\w*|ofiar\w*)/.test(questionText);
  const source=aboutVictim?NPC9_CUSTOM?.[c.id]?.victim_last:NPC9_CUSTOM?.[c.id]?.observations;
  response=String(source||'').slice(0,950);
 }else if(kind==='documents')response=String(NPC9_CUSTOM?.[c.id]?.documents||'').slice(0,950);
 else if(kind==='relationship')response=String(NPC9_CUSTOM?.[c.id]?.relations||'').slice(0,950);
 else if(kind==='victim_contact')response=String(NPC9_CUSTOM?.[c.id]?.conversation||'').slice(0,950);
 else if(kind==='corroboration')response=String(NPC9_CUSTOM?.[c.id]?.verification||'').slice(0,950);
 else if(kind==='time_precision'){
  const specific=/\b(?:dyzur\w*|zmian\w*|pracy|alarm\w*|len\w*|rozmow\w*)/.test(questionText);
  response=specific?String(NPC9_CUSTOM?.[c.id]?.time||'').slice(0,950):'Nie potrafię podać dokładnego czasu tego zdarzenia bez ustalenia, o którą sytuację pytasz.';
 }else if(kind==='alibi')response=String(NPC9_CUSTOM?.[c.id]?.break||'').slice(0,950);
 else if(kind==='direct_accusation')response='Nie przyznaję się do zabójstwa Leny. Ten zarzut wymaga dowodów; samo pytanie nie jest rozstrzygnięciem.';
 else if(kind==='knowledge_source'||kind==='certainty_limit'||kind==='epistemic_challenge'||kind==='place_precision'||kind==='event_sequence'||kind==='reason_for_action'||kind==='report_recipient'||kind==='clarify_reference')response=choose(c.id,kind,questionText);
 // Nie generuj nowych wersji przyznań, odmów lub konfrontacji.
 if(!response||response===old||response.length>1550)return old;
 if(baseline.intents.includes(kind)&&!/^Nie potrafię|^Nie wiem|^Tego nie wiem/i.test(old)&&kind!=='direct_accusation')return old;
 if(!reconcile(c,old,response,kind))return old;
 window.PS613_LAST={witness:c.id,topic:kind,replaced:true};
 return response;
}
// 6.33: retired overlapping answer hook; central 6.33 plan owns question routing.
// retiredAnswerLayer('73-robust-intent-grounded',answer);
window.PS611_NLU=Object.freeze({...prior,analyze,version:'6.13'});
window.PS613_NLU=window.PS611_NLU;
})();
/* 6.33: one plan for browser request construction and offline scope routing. */
(function(){'use strict';
 const old=window.PS611_NLU;
 if(!old||!window.PS633_INTENT)throw Error('Unified question interpreter missing');
 window.PS611_NLU=Object.freeze({...old,analyze:window.PS633_INTENT.legacyQuestionPlan,version:'6.33'});
 window.PS613_NLU=window.PS611_NLU;
})();
/* Pakiet 6.14: kontrolowana realizacja wypowiedzi (bez nowych faktów).
 * Znaczenie pytania, bramki fabularne i dozwolone fakty rozstrzygają warstwy 1–73.
 * Ta końcowa warstwa zmienia wyłącznie zatwierdzone, semantycznie równoważne
 * sformułowania niewiedzy lub sposób podania POWTARZAJĄCEJ SIĘ treści.
 * Nie dotyka odpowiedzi powiązanych ze źródłami, konfrontacji i odmów.
 */
(function(){
'use strict';
if(typeof WitnessEngine==='undefined'||typeof NPC9_MEMORY==='undefined')return;
const beforeAnswer=WitnessEngine.snapshotAnswer();
const beforeExport=WitnessEngine.snapshotExport();
const beforeRestore=WitnessEngine.snapshotRestore();
const LIMIT=48;
const normText=s=>String(s||'').trim().replace(/\s+/g,' ');
const lower=s=>normText(s).toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return(n>>>0).toString(36);};
const array=x=>Array.isArray(x)?x:[];
// Każdy wariant zachowuje tę samą treść logiczną, nie dodaje osób, godzin ani zdarzeń.
// Podstawą dopasowania jest CAŁA gotowa wypowiedź, a nie pojedyncze słowa pytania.
const EQUIVALENTS=new Map([
 ['Nie umiem wskazać konkretnej przyczyny na podstawie tego, co pamiętam. Nie chcę jej wymyślać.',[
   'Nie pamiętam wystarczająco dużo, by wskazać konkretną przyczynę. Nie będę jej zgadywać.',
   'Nie mam podstaw, żeby nazwać konkretny powód. Nie chcę dopowiadać czegoś, czego nie pamiętam.',
   'Z mojej pamięci nie wynika pewna przyczyna. Nie znam tego powodu.',
   'Nie potrafię rzetelnie wyjaśnić przyczyny na podstawie własnej pamięci. To byłoby zgadywanie.'
 ]],
 ['Nie potrafię wskazać z pewnością, kto był odbiorcą tego zgłoszenia. Trzeba ustalić, czy istnieje potwierdzenie jego odbioru.',[
   'Nie wiem na pewno, do kogo dotarło to zgłoszenie. Należy sprawdzić, czy ktoś potwierdził jego odbiór.',
   'Nie wskażę odbiorcy bez pewności. Najpierw trzeba zweryfikować potwierdzenie odbioru zgłoszenia.',
   'Nie potrafię potwierdzić adresata zgłoszenia. Odpowiedzi należałoby szukać w potwierdzeniu odbioru, jeśli takie jest.',
   'Nie mam pewnej informacji o tym, kto odebrał zgłoszenie. Sprawdźmy, czy został ślad potwierdzenia odbioru.'
 ]],
 ['Nie potrafię podać dokładnego czasu tego zdarzenia bez ustalenia, o którą sytuację pytasz.',[
   'Najpierw ustalmy, które zdarzenie masz na myśli. Bez tego nie podam rzetelnej godziny.',
   'Nie wiem, o którą sytuację chodzi, więc dokładnej godziny nie wskażę.',
   'Doprecyzuj zdarzenie. Nie chcę podawać dokładnego czasu na chybił trafił.',
   'O jaką sytuację pytasz? Bez tego nie potrafię podać jej dokładnego czasu.'
 ]],
 ['Nie potrafię wskazać konkretnego źródła tej informacji bez doprecyzowania, o które zdarzenie pytasz.',[
   'O którą sytuację chodzi? Bez tego nie ustalę, skąd pochodzi dana informacja.',
   'Nie nazwę źródła informacji, dopóki nie wiem, o jakie zdarzenie pytasz.',
   'Żeby wskazać źródło, muszę wiedzieć, do którego zdarzenia się odnosisz.',
   'Doprecyzuj zdarzenie, a wtedy będzie można ustalić źródło tej informacji.'
 ]],
 ['Nie mam tego ustalonego. Trzeba wrócić do zapisu albo oględzin.',[
   'Nie mam pewnego ustalenia w tej sprawie. Odpowiedź trzeba sprawdzić w zapisach albo podczas oględzin.',
   'Nie mam jeszcze takiego ustalenia. Trzeba porównać zapisy lub wyniki oględzin.',
   'Nie chcę stawiać tu pewnej tezy. Najpierw trzeba porównać zapisy albo wyniki oględzin.'
 ]],
 ['Nie dysponuję ustaleniem, które pozwalałoby mi rzetelnie odpowiedzieć.',[
   'Nie mam wystarczających ustaleń, by udzielić pewnej odpowiedzi.',
   'Na podstawie tego, czym dysponuję, nie potrafię odpowiedzieć rzetelnie.',
   'Brakuje mi potwierdzonych ustaleń potrzebnych do odpowiedzi.'
 ]],
 ['Nie mogę tego potwierdzić na podstawie własnej wiedzy.',[
   'Nie mam osobistej wiedzy, która pozwala mi to potwierdzić.',
   'Nie mogę osobiście poświadczyć tej informacji.',
   'Z własnej wiedzy nie jestem w stanie tego poświadczyć.'
 ]],
 ['O którą osobę i jaki moment chodzi? Nie chcę przypisywać komuś działań bez pewności, o kogo pytasz.',[
   'Doprecyzuj osobę i moment. Inaczej mógłbym przypisać działanie niewłaściwej osobie.',
   'Kogo masz na myśli i kiedy? Bez tego nie chcę mówić o cudzych działaniach.',
   'Najpierw ustalmy, o kim i o jakiej chwili rozmawiamy. Nie będę nikomu przypisywać zachowań na podstawie domysłu.'
 ]],
 ['O kogo dokładnie pytasz i o który moment? Nie chcę przypisać niewłaściwej osobie cudzego alibi.',[
   'Kogo masz na myśli i w jakiej chwili? Nie chcę pomylić cudzych alibi.',
   'Musisz doprecyzować osobę oraz moment. W przeciwnym razie mógłbym pomylić alibi.',
   'Najpierw wskaż osobę i czas. Nie przypiszę nie temu człowiekowi cudzego alibi.'
 ]],
 ['Nie widziałem tego. Nie będę zgadywał.',[
   'Nie byłem tego świadkiem, więc nie chcę niczego zgadywać.',
   'Tego nie widziałem. Nie mogę przedstawić domysłu jako obserwacji.',
   'Nie mogę mówić, że coś zobaczyłem, skoro tego nie obserwowałem.'
 ]],
 ['Nie mam pewności. Sprawdźmy surowe dane, zanim coś stwierdzę.',[
   'Nie jestem tego pewien. Bez surowych danych nie chcę wyciągać wniosku.',
   'Nie przesądzam sprawy. Najpierw trzeba zweryfikować surowe dane.',
   'Potrzebuję surowych danych, żeby odpowiedzieć z pewnością. Nie będę zgadywał.'
 ]]
]);
const CHRONOLOGY='Nie potrafię z pewnością odtworzyć pełnej kolejności tych zdarzeń.';
const CHRONOLOGY_ALT=[
 'Nie mam pewnej pamięci całego przebiegu tych zdarzeń.',
 'Nie jestem w stanie wiarygodnie podać pełnej chronologii.',
 'Nie odtworzę z pamięci wszystkich zdarzeń we właściwej kolejności.',
 'Nie mogę zagwarantować dokładnej kolejności wszystkich wydarzeń.'
];
const FORBIDDEN_STATUS=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL']);
const forbidden=/\b(?:okaz[aął]?\w* dowod\w*|skladam formalne zeznanie|przyznaje sie|podtrzymuje odmowe|odmawiam|konfrontacja dowodow|pelnomocnik)\b/i;
function state(id){
 const root=NPC4_STATE[id];
 if(!root.npc614||typeof root.npc614!=='object')root.npc614={hits:{},order:[],recent:[]};
 return root.npc614;
}
function optionsFor(raw){
 const source=normText(raw);
 const explicit=EQUIVALENTS.get(source);
 if(explicit)return [source,...explicit];
 if(source.startsWith(CHRONOLOGY+' '))return [source,...CHRONOLOGY_ALT.map(s=>s+source.slice(CHRONOLOGY.length))];
 return null;
}
// Named statements are already checked by all preceding interrogation layers.
// We rewrite them only if the current turn is not tied to evidence or a formal response.
function canRealize(c,question,attached,raw,oldConfronted){
 if(!c||!NPC4_STATE[c.id]||!NPC9_MEMORY[c.id]||attached||!raw||forbidden.test(raw))return false;
 const memory=NPC9_MEMORY[c.id];
 if((memory.confronted?.length||0)!==oldConfronted||simWitness(c).blocked)return false;
 const last=memory.semantic?.at(-1),statement=memory.statements?.at(-1);
 return !!(last&&statement&&last.turn===memory.turn&&statement.turn===memory.turn&&
     last.answer===raw&&statement.text===raw&&!array(last.source_ids).length&&
     !array(statement.source_ids).length&&!FORBIDDEN_STATUS.has(last.status));
}
function synchronize(c,old,text){
 const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id];
 const sem=m.semantic.at(-1),statement=m.statements.at(-1);
 sem.answer=text;statement.text=text;
 const replace=(r,key,n)=>{if(r&&r[key]===old.slice(0,n))r[key]=text.slice(0,n);};
 replace(s.recent?.at(-1),'answer',1550);
 replace(s.npc5?.recent?.at(-1),'answer',1400);
 replace(s.npc5?.anchor,'answer',1400);
 replace(s.npc57?.episodes?.at(-1),'answer',1600);
 replace(s.npc65?.recent?.at(-1),'answer',1300);
 replace(s.npc65,'lastAnswer',1300);
 replace(s.npc68?.threads?.at(-1),'a',850);
 replace(s.npc89?.recent?.at(-1),'a',1200);
 replace(s.npc62,'a',1600);
}
function answer(c,question,attached){
 const oldConfronted=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
 const original=beforeAnswer(c,question,attached);
 if(!canRealize(c,question,attached,original,oldConfronted))return original;
 const candidates=optionsFor(original);
 if(!candidates||candidates.length<2)return original;
 const st=state(c.id),key=hash(normText(original));
 const used=Number.isSafeInteger(st.hits[key])?st.hits[key]:0;
 const recent=st.recent.slice(-2);
 const origin=(hash(c.id+'|'+lower(question)).split('').reduce((s,x)=>s+x.charCodeAt(0),0))%candidates.length;
 let pick=used===0?origin:(origin+used)%candidates.length;
 // Avoid returning the same wording in consecutive turns of the same theme.
 for(let n=0;n<candidates.length;n++){
  const next=(pick+n)%candidates.length;
  if(!recent.includes(hash(candidates[next]))){pick=next;break;}
 }
 const selected=candidates[pick];
 st.hits[key]=Math.min(100000,used+1);
 if(!st.order.includes(key))st.order.push(key);
 if(st.order.length>LIMIT){const remove=st.order.shift();delete st.hits[remove];}
 st.recent.push(hash(selected));if(st.recent.length>8)st.recent.shift();
 if(selected!==original)synchronize(c,original,selected);
 return selected;
}
registerWitnessAnswerLayer('74-grounded-response-variety',answer);
registerWitnessExportLayer('74-grounded-response-variety',function(){
 const out=beforeExport();
 for(const c of CONTENT.characters){if(!out[c.id])continue;
  const x=state(c.id);
  out[c.id].npc614={hits:Object.fromEntries(x.order.slice(-LIMIT).filter(k=>/^[a-z\d]{1,12}$/i.test(k)).map(k=>[k,Math.min(100000,Math.max(0,x.hits[k]||0))])),
   order:x.order.slice(-LIMIT),recent:x.recent.slice(-8)};
 }
 return out;
});
registerWitnessRestoreLayer('74-grounded-response-variety',function(data){
 beforeRestore(data);
 for(const c of CONTENT.characters){const x=state(c.id),saved=data?.[c.id]?.npc614;
  x.hits={};x.order=[];x.recent=[];
  if(!saved||typeof saved!=='object')continue;
  x.order=array(saved.order).filter(k=>typeof k==='string'&&/^[a-z\d]{1,12}$/i.test(k)).slice(-LIMIT);
  for(const k of x.order){const count=saved.hits?.[k];x.hits[k]=Number.isSafeInteger(count)?Math.max(0,Math.min(count,100000)):0;}
  x.recent=array(saved.recent).filter(k=>typeof k==='string'&&/^[a-z\d]{1,12}$/i.test(k)).slice(-8);
 }
});
window.PS614_VARIETY=Object.freeze({version:'6.14',eligible:raw=>!!optionsFor(raw),catalogueSize:EQUIVALENTS.size,
 stats:id=>{const x=state(id);return {phrases:x.order.length,turns:Object.values(x.hits).reduce((a,b)=>a+b,0),recent:x.recent.length};}});
})();
/* Pakiet 6.17: lokalna rozgrywka jest dostępna offline, zaś serwer otrzymuje
 * jawny dziennik zdarzeń do niezależnej walidacji. Nigdy nie wysyłamy lokalnego
 * obiektu STATE jako automatycznie zatwierdzonej prawdy. */
(()=>{
 'use strict';
 const K='ps617-pending-actions';
 let queue=[];let rev=null;let busy=false;let restoring=false;let pendingRestore=null;let disabled=false;let timer=0;let retryDelay=1200;let rejectedCount=0;
 let approvedEvidence=new Set();let verifiedVerdict=null;let verifiedIndictment=null;let awaitingResume=!!document.getElementById('psResumeOffer');let resetPending=false;
 try{resetPending=localStorage.getItem('ps617-reset-pending')==='1';}catch{}
 try{queue=JSON.parse(localStorage.getItem(K)||'[]');if(!Array.isArray(queue))queue=[];}catch{queue=[];}
 queue=queue.filter(x=>x&&typeof x.id==='string'&&x.action&&typeof x.action==='object').slice(-100);
 const save=()=>{try{localStorage.setItem(K,JSON.stringify(queue.slice(-100)));}catch{}};
 const state=document.createElement('span');state.id='ps-server-state-status';
 state.setAttribute('aria-live','polite');
 state.style.cssText='font-size:11px;opacity:.7;padding:3px 6px;display:inline-block';
 state.textContent='Zapis lokalny; synchronizacja po połączeniu';
 (document.getElementById('saveBtn')?.parentElement||document.body).appendChild(state);
 const status=text=>{state.textContent=text;};
 function renderServerVerdict(){
  const panel=document.querySelector?.('#simHearingDetail .sim-trial-result');if(!panel)return;
  let node=panel.querySelector('.ps618-confirmation');
  if(!node){node=document.createElement('p');node.className='ps618-confirmation small muted';panel.appendChild(node);}
  node.textContent=verifiedVerdict?.serverApproved?
   'Wynik zatwierdzony na serwerze (rozstrzygający): '+String(verifiedVerdict.label||verifiedVerdict.kind||'sprawa oceniona')+'. Lokalna symulacja ma wyłącznie charakter pomocniczy.':
   'To tylko symulacja lokalna. Wskazanie osoby i końcowy werdykt wymagają zatwierdzenia na serwerze.';
 }

 const key=()=>String(Date.now())+'-'+Math.random().toString(16).slice(2);
 function enqueue(action){
  queue.push({id:key(),action});queue=queue.slice(-100);save();schedule();
 }
 function schedule(delay=650){clearTimeout(timer);timer=setTimeout(sync,delay);}
 async function sync(force=false){
  if(window.PS_COOP?.connecting)return;
  if((restoring&&!force)||awaitingResume||busy||disabled||!navigator.onLine||!/^https?:$/.test(location.protocol))return;
  busy=true;
  try{
   if(resetPending){
    const cleared=await fetch('/api/game-session-reset',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:'{}'});
    if(!cleared.ok)throw Error('session-reset-unavailable');
    resetPending=false;try{localStorage.removeItem('ps617-reset-pending');}catch{}
    rev=null;
   }
   let r=await fetch('/api/game-state',{credentials:'same-origin',cache:'no-store'});
   if(r.status===404||r.status===503){status('Postęp lokalny — serwer nie jest skonfigurowany');disabled=r.status===404;return;}
   if(!r.ok)throw Error('state-read');
   let data=await r.json();if(!data.ok)throw Error('state-error');rev=data.revision;approvedEvidence=new Set(data.state?.approvedEvidence||[]);verifiedVerdict=data.state?.verdict||null;verifiedIndictment=data.state?.indictment||null;renderServerVerdict();
   if(!queue.length){status(rejectedCount?'Część wcześniejszych działań pozostała lokalna (wymaga weryfikacji)':'Postęp serwerowy aktywny · zapis lokalny dostępny');retryDelay=1200;return;}
   const batch=[];let bytes=90;
   for(const item of queue.slice(0,20)){
    const size=encodeURIComponent(JSON.stringify(item)).replace(/%[0-9A-F]{2}/g,"x").length+2;
    if(batch.length&&bytes+size>56000)break;
    batch.push(item);bytes+=size;
   }
   r=await fetch('/api/game-state',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},
    body:JSON.stringify({revision:rev,actions:batch})});
   if(r.status===409){status('Synchronizacja ponawiana…');retryDelay=1500;return;}
   if(!r.ok)throw Error('state-write');
   data=await r.json();if(!data.ok)throw Error('state-error');rev=data.revision;approvedEvidence=new Set(data.state?.approvedEvidence||[]);verifiedVerdict=data.state?.verdict||null;verifiedIndictment=data.state?.indictment||null;renderServerVerdict();
   const processed=new Set(batch.map(x=>x.id));
   const retryable=new Set(['puzzle_evidence_prerequisite_missing','stage_out_of_order','indictment_not_approved','timeline_anchors_missing']);
   const retryItems=batch.filter((x,i)=>!data.decisions[i]?.ok&&retryable.has(data.decisions[i]?.reason)&&Number(x.retries||0)<100).map(x=>({...x,retries:Number(x.retries||0)+1}));
   queue=[...queue.filter(x=>!processed.has(x.id)),...retryItems].slice(-100);save();
   const rejected=data.decisions.filter((x,i)=>!x.ok&&!retryItems.some(retry=>retry.id===batch[i]?.id)).length;rejectedCount+=rejected;retryDelay=retryItems.length?Math.min(60000,retryDelay*2):1200;
   status(rejected?'Postęp lokalny — część czynności wymaga dalszej weryfikacji':
    queue.length?'Synchronizowanie postępu…':'Zatwierdzony postęp zapisany na serwerze');
  }catch{status('Pracujesz lokalnie — synchronizacja zostanie ponowiona');retryDelay=Math.min(60000,retryDelay*2);}
  finally{busy=false;if((queue.length||resetPending)&&!disabled&&navigator.onLine)schedule(retryDelay);}
 }
 PS_EVENTS.on('evidenceCollected','ps617-server-proposal',e=>{
  if(!e.id||!['area-search','scene-inspection'].includes(e.origin))return;
  const action={type:'collect_evidence',docId:e.id,origin:e.origin};
  if(e.origin==='area-search')action.area=STATE.area;
  else{
   const item=STATE.scene12?.selected,step=STATE.scene12?.steps?.[item];
   action.spotId=item;action.room=STATE.scene12?.room;action.method=step?.method;action.answer=step?.answer;
  }
  enqueue(action);
 });
 // Wersja 6.18: tylko odpowiedzi gracza trafiają na serwer jako PROPOZYCJE.
 // Sam import lokalnego zapisu nie jest dowodem wykonania czynności.
 // Resume choice is explicit. A click outside the prompt must not reset the server session.

 window.addEventListener('online',()=>{disabled=false;if(pendingRestore&&!restoring)restoreTranscript(pendingRestore.saved,{fresh:pendingRestore.fresh});else schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();});
 if(!awaitingResume&&!resetPending){
  // Gra bez wybranego zapisu zaczyna NOWĄ sesję również w Supabase.
  resetPending=true;try{localStorage.setItem('ps617-reset-pending','1');}catch{}
  queue=[];save();
 }
 setTimeout(sync,650);
 document.addEventListener('click',e=>{
  const target=e.target.closest?.('[data-sim-continue],[data-ps54-trial]');if(!target)return;
  setTimeout(()=>{
   if(STATE.sim?.trial)enqueue({type:'request_verdict'});
   renderServerVerdict();
  },0);
 });
 // Zapytania AI o NOWO zdobyty dowód czekają krótko na serwerowe
 // zatwierdzenie. Nie twórz pozornego uprawnienia na podstawie STATE.found.
 async function ensureEvidence(id,timeoutMs=3000){
  if(typeof id!=='string'||!id||awaitingResume||resetPending||!navigator.onLine||disabled)return false;
  if(approvedEvidence.has(id))return true;
  const deadline=Date.now()+Math.max(250,Math.min(4000,timeoutMs));
  // W jednym cyklu przesyłamy do Supabase wszystkie oczekujące czynności
  // z ustaloną wcześniej kolejnością, a potem sprawdzamy approvedEvidence.
  while(Date.now()<deadline){
   if(!busy)await sync();
   if(approvedEvidence.has(id))return true;
   if(!queue.some(item=>item.action?.type==='collect_evidence'&&item.action.docId===id))return false;
   await new Promise(resolve=>setTimeout(resolve,120));
  }
  return approvedEvidence.has(id);
 }
 // A local hypothesis is not a certified identification. Only a verdict
 // matching the current, server-stored indictment may state actor correctness.
 function actorStatusFor(person,local){
  if(!verifiedVerdict?.serverApproved||!verifiedIndictment||!local||!person)return 'pending';
  if(verifiedIndictment.culprit!==person||verifiedVerdict.assessedPerson!==person||
   verifiedIndictment.method!==local.method||verifiedIndictment.alibi!==local.alibi||
   verifiedIndictment.keystone!==local.keystone||
   verifiedIndictment.qualification!==(local.qualification||'intentional'))return 'pending';
  // Do not reuse an old approval after changing source links or explanations.
  const normalizeLinks=items=>JSON.stringify((Array.isArray(items)?items:[]).map(x=>[x.role,x.id]).sort((a,b)=>a.join('|').localeCompare(b.join('|'))));
  if(normalizeLinks(verifiedIndictment.links)!==normalizeLinks(local.links))return 'pending';
  if(['person','method','proof','alibi'].some(k=>String(verifiedIndictment.reasons?.[k]||'')!==String(local.reasons?.[k]||'')))return 'pending';
  return verifiedVerdict.review?.correctPerson===true?'confirmed':'rejected';
 }

 // RC34: an imported save contains *quotes*, not server-certified case facts.
 // Only server HMAC receipts elevate a quote to a server-authenticated utterance.
 const witnessIds=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
 const safeQuote=s=>typeof s==='string'&&s.length>=2&&!/[<>\u0000-\u0008\u000e-\u001f]/.test(s);
 function extractDialogue(saved){
  const groups=[];
  for(const id of witnessIds){
   const rows=saved?.dialogues?.[id];if(!Array.isArray(rows))continue;
   const pairs=[];
   for(let i=1;i<rows.length;i++){
    const q=rows[i-1],a=rows[i];
    if(q?.role!=='player'||a?.role!=='npc'||!safeQuote(q.text)||!safeQuote(a.text))continue;
    const attached=q.text.match(/\n\[Okazano: ([A-Za-z0-9_-]{2,65})\]$/);
    const question=(attached?q.text.slice(0,-attached[0].length):q.text).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,1600);
    const response=a.text.trim();
    if(!safeQuote(question)||question.length>1600||!safeQuote(response)||response.length>1450)continue;
    const ai=a.ai||{};
    pairs.push({question,text:response,provider:ai.provider||'unknown',model:ai.model||null,
     turnId:ai.turnId||null,turnProof:ai.turnProof||null,evidenceId:attached?.[1]||null});
   }
   // The server retains up to 40 question-and-answer pairs per witness.
   if(pairs.length)groups.push({witnessId:id,turns:pairs.slice(-40)});
  }
  return groups;
 }
 function restoreLabel(restored,verified,skipped,unverified){
  status('Pamięć rozmów: '+restored+' przywrócono ('+verified+' podpisanych, '+unverified+' niezweryfikowanych), '+skipped+' duplikatów');
 }
 async function restoreTranscript(saved,{fresh=false}={}){
  if(!saved||typeof saved!=='object')return {ok:false,reason:'invalid_save'};
  pendingRestore={saved,fresh};
  if(restoring)return {ok:false,reason:'restore_busy'};
  if(!navigator.onLine||!/^https?:$/.test(location.protocol)){
   status('Historia lokalna · pamięć AI czeka na połączenie');
   return {ok:false,reason:'offline'};
  }
  restoring=true;
  let resetCompleted=!fresh;
  let restored=0,verified=0,unverified=0,skipped=0;
  try{
   awaitingResume=false;disabled=false;
   // Avoid racing the queued state writer during the import/reset.
   for(let tries=0;busy&&tries<100;tries++)await new Promise(r=>setTimeout(r,100));
   if(busy)throw Error('server_sync_busy');
   if(fresh){
    // If this is the SAME server session, retain the originally verified
    // testimony and progress. A different case must not inherit its evidence.
    const groups=extractDialogue(saved);
    let keep=false;
    const current=await fetch('/api/game-state',{credentials:'same-origin',cache:'no-store'});
    if(current.ok){
     const data=await current.json();
     const serverRows=data?.state?.witnesses||{};
     keep=groups.some(group=>group.turns.some(t=>{
      const history=serverRows[group.witnessId]||[];
      return history.some((r,i)=>r?.role==='witness'&&r.text===t.text&&history[i-1]?.role==='player'&&history[i-1]?.text===t.question);
     }));
    }
    if(keep){
     resetPending=false;
     try{localStorage.removeItem('ps617-reset-pending');}catch{}
    }
    if(!keep){
     // A different case must start with new server-owned progress, rather than
     // accidentally inheriting old approvals from the previous cookie session.
     window.PS617_SYNC.resetSession();
     await sync(true);
     if(resetPending)throw Error('server_reset_unavailable');
    }
    resetCompleted=true;
   }else if(resetPending){
    await sync(true);
    if(resetPending)throw Error('server_reset_unavailable');
   }
   const groups=extractDialogue(saved);
   for(const {witnessId,turns} of groups){
    for(let i=0;i<turns.length;i+=8){
     let batch=turns.slice(i,i+8);
     // Keep the JSON body below the server's 36 KB UTF-8 limit.
     while(batch.length>1&&new TextEncoder().encode(JSON.stringify({witnessId,turns:batch})).length>29000)batch=batch.slice(0,-1);
     i+=batch.length-8;
     let done=false;
     for(let attempt=0;attempt<3;attempt++){
      const result=await fetch('/api/interview-restore',{method:'POST',credentials:'same-origin',
       headers:{'Content-Type':'application/json','X-PS-Client':'game'},
       body:JSON.stringify({witnessId,turns:batch})});
      if(result.status===409)continue;
      if(!result.ok)throw Error('history_restore_http_'+result.status);
      const data=await result.json();if(!data.ok)throw Error('history_restore_rejected');
      restored+=Number(data.restored)||0;verified+=Number(data.verified)||0;
      unverified+=Number(data.unverified)||0;skipped+=Number(data.skipped)||0;
      done=true;break;
     }
     if(!done)throw Error('history_restore_conflict');
    }
   }
   pendingRestore=null;restoreLabel(restored,verified,skipped,unverified);
   schedule();return {ok:true,restored,verified,unverified,skipped};
  }catch(err){
   // Keep the save available for an explicit retry or when connection returns.
   status('Historia lokalna · synchronizacja pamięci AI nieukończona');
   pendingRestore={saved,fresh:!resetCompleted};
   return {ok:false,reason:String(err.message||'restore_failed'),restored};
  }finally{restoring=false;}
 }
 window.PS617_SYNC=Object.freeze({
  ensureEvidence,actorStatusFor,restoreTranscript,get restoring(){return restoring;},isEvidenceApproved:id=>approvedEvidence.has(id),
  enqueue,get approvedVerdict(){return verifiedVerdict;},get pending(){return queue.length;},get enabled(){return !disabled;},get rejected(){return rejectedCount;},
  coopJoined(){
   awaitingResume=false;resetPending=false;queue=[];save();rev=null;disabled=false;
   try{localStorage.removeItem('ps617-reset-pending');}catch{}
   document.getElementById('psResumeOffer')?.remove();document.body.classList.remove('ps-resume-pending');
   status('Wspólne śledztwo — stan sprawy na serwerze');schedule();
  },
  resume(){awaitingResume=false;disabled=false;schedule();},
  resetSession(){
   awaitingResume=false;queue=[];save();resetPending=true;rev=null;approvedEvidence.clear();verifiedVerdict=null;verifiedIndictment=null;disabled=false;
   try{localStorage.setItem('ps617-reset-pending','1');}catch{}
   status('Nowa sesja lokalna — reset serwera po połączeniu');schedule();
  },retry:sync
 });
})();
/* PAKIET 6.19 — Fabuła 2.0. Jedynie dramaturgia/relacje/epilog.
   Stan serwerowy, kanon, dowody, progi, finał pozostają pod kontrolą obecnych modułów. */
(function(){
'use strict';
if(typeof STATE==='undefined'||typeof CONTENT==='undefined'||!window.PS85_STORY||typeof simRenderHearing!=='function')return;
const WITNESSES={
 MAREK:{cadence:'Krótkie, rzeczowe zdania; oddzielaj własną decyzję od procedury.',defense:'Próbuje uporządkować konsekwencje w rubrykach; przy uzasadnionych danych stopniowo rezygnuje z tej osłony.',vulnerable:'Nie utożsamiaj zaniedbań kierowniczych ze sprawstwem przemocy.',lena:'Nie zgadzał się z Leną co do sposobu prowadzenia sporu o bezpieczeństwo, ale nie kwestionuje znaczenia jej śmierci.',after:'Zestawienie czasu pracy z rejestrem wejść pozostawia kierownictwu pytanie, czy poprawiony dokument może zastąpić rzeczywistą obecność.'},
 TOMASZ:{cadence:'Zwięzłe i czasem urwane wypowiedzi; unika podawania minuty z pamięci.',defense:'Oddziela decyzję dyspozytorską od późniejszych zdarzeń; luka w radiu podważa jego pewność.',vulnerable:'Stres po odnalezieniu ciała nie jest dowodem kłamstwa.',lena:'Zapamiętał Lenę jako osobę stanowczą w sprawie bezpieczeństwa TW-217.',after:'Dyspozytornia może odtworzyć polecenia, lecz brakującego fragmentu nagrania nie należy zapełniać wspomnieniem.'},
 JANUSZ:{cadence:'Mowa warsztatowa, krótkie obrazy konkretnej pracy; bez języka raportu.',defense:'Rutyną i pośpiechem tłumaczy braki w protokole; z czasem przyjmuje odpowiedzialność za rubryki.',vulnerable:'Błąd warsztatowy nie staje się automatycznie udziałem w zabójstwie.',lena:'Doceniał nieustępliwość Leny, choć jej uwagi do stanu wagonu go drażniły.',after:'W warsztacie problemem pozostaje nie sam formularz, ale czynność, której ukończenia formularz nie potwierdza.'},
 ELZBIETA:{cadence:'Precyzyjna, formalna, lecz przy wspomnieniu ostatniej rozmowy z Leną bardziej osobista.',defense:'Waha się między usprawiedliwieniem zwłoki a poczuciem zaniedbania.',vulnerable:'Żal i poczucie winy moralnej nie są przyznaniem się do przestępstwa.',lena:'Rozmawiały o bezpieczeństwie; ostatni potwierdzony kontakt miał miejsce o 21:47.',after:'Niewysłany projekt BHP pozostaje śladem wiedzy o zagrożeniu, nie dowodem, że ostrzeżenie formalnie dotarło.'},
 KAMIL:{cadence:'Techniczny, dosadny język; poprawia niefachowe utożsamianie logów z ludźmi.',defense:'Boi się utraty wiarygodności przez nieprawidłowe przekazanie identyfikatora.',vulnerable:'Nie przypisuj mu pobytu przy drzwiach wyłącznie na podstawie zdarzenia T-17.',lena:'Pamiętał jej upór w analizowaniu niezgodności diagnostycznych.',after:'Ewidencja karty powinna rozróżniać formalny przydział od faktycznego przekazania; wnioski o obecności wymagają osobnego potwierdzenia.'},
 MAGDALENA:{cadence:'Kontrolowany, precyzyjny styl; pod presją krótsze riposty, bez nagłego melodramatycznego wyznania.',defense:'Rozdziela dokumentację odbioru od fizycznych zdarzeń i kwestionuje skróty myślowe śledczego.',vulnerable:'Konfrontacja musi wynikać z odblokowanych źródeł i istniejącego kanonu; nie dopisuj przyznania się.',lena:'Spierała się o znaczenie rozbieżności L-2/L-3 w dokumentacji.',after:'Odbiór partii ZG-41 wymaga wyjaśnienia niezależnie od dalszych czynności dotyczących śmierci Leny.'}
};
const LENACHAPTERS=[
 {id:'work',title:'Zmiana, która miała być zwykłym dyżurem',requires:['TEC-01'],text:'Karta TW-217 umieszcza Lenę w rzeczywistej pracy motorniczej. Nocny przydział nie jest symbolem: to zwyczajna służba, w której trzeba podejmować decyzje na podstawie niepełnych informacji.',question:'Kto odpowiadał za dopuszczenie wagonu do ruchu, a kto za jego badanie?',people:['TOMASZ','MAREK']},
 {id:'disagreement',title:'Upór nie jest nieomylnością',requires:['TEC-03','TEC-04'],text:'Lena kwestionowała bezpieczeństwo wagonu. Jej obawa zasługuje na zbadanie, ale ostrzeżenie diagnostyczne samo nie rozstrzyga, która interpretacja usterki była prawidłowa.',question:'Co mogła wiedzieć z ostrzeżenia, a czego nie potwierdzał jeszcze pomiar?',people:['JANUSZ','KAMIL']},
 {id:'conversation',title:'Ostatnia potwierdzona rozmowa',requires:['DIG-01'],text:'Wykaz połączeń pozwala wrócić do rozmowy Leny z Elżbietą. Godzina kontaktu to fakt z rejestru; emocje i dokładną treść rozmowy można odtworzyć tylko w granicach zeznania.',question:'Czego Lena oczekiwała od zgłoszenia zagrożenia?',people:['ELZBIETA']},
 {id:'draft',title:'Ostrzeżenie, którego nie wysłano',requires:['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION'],text:'Projekt zgłoszenia pokazuje powagę obaw, lecz jego obecność w systemie nie oznacza doręczenia ostrzeżenia. Lena i Elżbieta mogły nadawać tej samej rozmowie inną wagę.',question:'Czy Lena wiedziała, że ostrzeżenie zostało w projekcie?',people:['ELZBIETA']},
 {id:'part',title:'L-2 i L-3 — dwie wersje tego samego problemu',requires:['TEC-15','EVID_SERIAL_PHOTO','EVID_ACCEPTANCE_RECORD'],text:'Różnica między oznaczeniem części a odbiorem dokumentacyjnym pokazuje, skąd mogła brać się nieufność Leny. Jednocześnie nie pozwala bez dalszych źródeł przypisać każdej osobie świadomego oszustwa.',question:'Kto dysponował wiedzą o rzeczywistym podzespole, a kto tylko potwierdzał dokument?',people:['MAGDALENA','JANUSZ']},
 {id:'last',title:'Kontakt, którego nie wolno dopowiadać',requires:['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA'],text:'Korespondencja z końcowego odcinka nocy jest ważna dla rekonstrukcji Leny jako osoby podejmującej własne decyzje. Nie ma jednak w niej relacji z chwili powstania obrażeń.',question:'Co potwierdza korespondencja, a czego nie mówi o jej ostatnich minutach?',people:['MAGDALENA','TOMASZ']}
];
const BEATS={
 work:{premise:'Rozkład zmiany i karta warsztatu opisują osobne decyzje.',discovery:'Zestawienie dyspozycji kursu ze stanem badania.',reversal:'Podpisany dokument nie potwierdza wykonania wszystkich czynności.',reaction:'Marek odchodzi od usprawiedliwiania wszystkiego grafikiem; Janusz wyraźnie oddziela warsztat od dyspozytorni.',route:'Wróć do Marka i Janusza z konkretną różnicą między zapisem a działaniem.'},
 warning:{premise:'Lena mówiła o ryzyku, zanim zakończyła zmianę.',discovery:'Projekt BHP i obieg odbioru nie spotkały się formalnie.',reversal:'Wiedza o zagrożeniu nie jest tożsama z wysłanym ostrzeżeniem.',reaction:'Elżbieta ostrożniej opisuje własną zwłokę; Magdalena pilnuje granic dokumentu.',route:'Porównaj zapis wysyłki z samym projektem, a potem wróć do obu osób.'},
 access:{premise:'Zdarzenie karty T-17 wydaje się wskazywać obecność.',discovery:'Przekazanie identyfikatora oddziela użytkownika od pierwotnego posiadacza.',reversal:'Zgodne zegary nie wskazują automatycznie tej samej osoby.',reaction:'Kamil próbuje odzyskać wiarygodność techniczną, Magdalena kwestionuje uproszczone alibi.',route:'Porównaj rejestr karty z niezależną obserwacją, jeśli jest dostępna.'},
 lastcontact:{premise:'Zapis powrotu tramwaju tworzy łatwą, zbyt prostą chronologię.',discovery:'Ostatni kontakt następuje w innym odcinku nocy.',reversal:'Czas dyspozycji nie rozstrzyga o autorze wiadomości ani obecności.',reaction:'Tomasz wyraźnie oddziela swoją decyzję od zdarzenia, którego nie widział.',route:'Sprawdź nadawcę wiadomości niezależnie od rejestru kursu.'},
 mechanism:{premise:'Po ostatniej wiadomości można podejrzewać spotkanie.',discovery:'Opinia o obrażeniach ma inną podstawę dowodową niż korespondencja.',reversal:'Nawet spójna sekwencja nie zastępuje dowodu mechanizmu urazu.',reaction:'Elżbieta nie chce opisywać nieobserwowanego zdarzenia; Magdalena unika przypisywania sobie cudzej interpretacji.',route:'Porównaj opinię medyczną ze śladami i udokumentowaną chronologią.'},
 faultline:{premise:'Warsztat i BHP wyglądały na dwa osobne błędy.',discovery:'Połączenie obu obiegów pokazuje problem przekazywania informacji.',reversal:'Odpowiedzialność organizacyjna nie oznacza sprawstwa przemocy.',reaction:'Marek i Elżbieta nie mogą zasłonić się wyłącznie kompetencjami drugiej strony.',route:'Ustal, kto dostał jaki sygnał i kiedy.'},
 presence:{premise:'Elektroniczne alibi wydaje się pełne.',discovery:'Różne systemy zapisują działanie konta i karty, nie człowieka.',reversal:'Brak obserwacji ma znaczenie, ale nie jest dowodem winy.',reaction:'Kamil precyzuje ograniczenia rejestrów; Magdalena musi uzasadnić siłę alibi.',route:'Szukaj niezależnego źródła obecności, bez automatycznej tezy o kłamstwie.'},
 boundary:{premise:'Połączone akta tworzą przekonującą opowieść.',discovery:'Wciąż pozostają granice pewności wynikające z rodzaju źródeł.',reversal:'Rozstrzygnięcie nie może opierać się na samym podobieństwie wątków.',reaction:'Świadkowie ograniczają wypowiedzi do własnych obserwacji i dokumentów.',route:'Ułóż akt oskarżenia z osobnych, niezależnych podstaw.'}
};
const get=id=>document.getElementById(id);
const people=Object.fromEntries(CONTENT.characters.map(c=>[c.id,c]));
const norm=x=>String(x||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const stress=/\b(?:klamiesz|zabiles|zabilas|zamordowales|zamordowalas|oszukujesz|przyznaj sie|ukrywasz|wina twoja|morderc)\b/i;
const careful=/\b(?:potwierdz|zrodlo|skad wiesz|czy jestes pew|prosze wyjasn|mozesz pokazac|co sam widzial|a co wynika|jak odrozn)\b/i;
const apology=/\b(?:przepraszam|przepraszac|nie chcialem|nie chcialam)\b/i;
function tone(id){const log=STATE.dialogues?.[id]||[],msgs=log.filter(x=>x?.role==='player').slice(-24);let harsh=0,fair=0,repeat=0;const seen=new Set();for(const m of msgs){const q=norm(m.text).replace(/\s+/g,' ').trim();if(stress.test(q))harsh++;if(careful.test(q)||apology.test(q))fair++;const topic=q.split(' ').filter(x=>x.length>3).slice(0,4).join(' ');if(topic&&seen.has(topic))repeat++;seen.add(topic)}const recent=msgs.at(-1)?.text||'';return {harsh:Math.min(harsh,8),fair:Math.min(fair,8),repeat:Math.min(repeat,8),lastTopic:recent.slice(0,120),stance:harsh>fair+1?'ostrożny i defensywny':fair>harsh+1?'nieco bardziej skłonny do wyjaśnienia':'powściągliwy'};}
function aiContext(id){const p=WITNESSES[id];if(!p)return null;const t=tone(id),gates=CONTENT.gates.filter(g=>g.character===people[id]?.name);const disclosed=gates.filter(g=>g.needs.every(e=>STATE.found.has(e)));return {style:p.cadence,defense:p.defense,limit:p.vulnerable,attitude:t.stance,questionReturn:t.repeat>0?'Możesz zwięźle odnieść się do ponowionego pytania, bez zmiany faktów.':'',revealedContext:disclosed.length?p.after:'Nie odwołuj się do szczegółów konfrontacji, których jeszcze nie przedstawiono.',rule:'Opisy osobowości sterują wyłącznie stylem. Nie stanowią dowodów ani pozwolenia na nowe fakty.'};}
function paragraph(node,title,body){const h=document.createElement('h4');h.textContent=title;const p=document.createElement('p');p.textContent=body;node.append(h,p);}
const book=document.createElement('section');book.className='ps619-section surface padded';book.id='ps619Lena';book.setAttribute('aria-label','Lena poza aktami');
const head=document.createElement('div');head.className='ps619-heading';head.innerHTML='<div><div class="eyebrow">LENA RUDNICKA · PORTRET Z MATERIAŁÓW</div><h3>Człowiek, nie tylko nazwisko w aktach</h3><p>Fragmenty powstają z dokumentów, które już masz. Nie zastępują oryginalnych źródeł ani nie rozstrzygają winy.</p></div>';
const shelf=document.createElement('div');shelf.className='ps619-grid';book.append(head,shelf);
(get('ps85Stories')||get('deduction'))?.insertAdjacentElement('afterend',book);
const beats=document.createElement('section');beats.id='ps619Beats';beats.className='ps619-section surface padded';beats.hidden=true;beats.innerHTML='<div class="eyebrow">PIĘĆ WARSTW ODKRYCIA</div><h3>Co naprawdę zmieniło znaczenie?</h3><p class="muted">Przypomnienie skutków już potwierdzonych zwrotów, bez dodatkowej bramki fabularnej.</p><div class="ps619-grid" id="ps619BeatsGrid"></div>';
(get('ps619Lena')||get('deduction'))?.insertAdjacentElement('afterend',beats);
const field=id=>CONTENT.documents.find(d=>d.id===id)?.title||id;
function render(){
 shelf.replaceChildren();let count=0;
 for(const x of LENACHAPTERS){if(!x.requires.every(id=>STATE.found.has(id)))continue;count++;const article=document.createElement('article');article.className='ps619-tile';paragraph(article,x.title,x.text);const link=document.createElement('p');link.className='ps619-source';link.textContent='Źródła: '+x.requires.map(field).join(' • ');article.append(link);const prompt=document.createElement('p');prompt.className='ps619-prompt';prompt.textContent='Pytanie do rozważenia: '+x.question;article.append(prompt);shelf.append(article);}
 if(!count){const p=document.createElement('p');p.textContent='Wróć tu po zdobyciu pierwszych materiałów o pracy Leny.';shelf.append(p);}
 const available=new Set(window.PS85_STORY.available());const grid=get('ps619BeatsGrid');if(!grid)return;grid.replaceChildren();beats.hidden=!available.size;
 for(const id of available){const b=BEATS[id];if(!b)continue;const card=document.createElement('article');card.className='ps619-tile';paragraph(card,'Odkrycie: '+id,b.discovery);const ul=document.createElement('dl');for(const [name,text] of [['Przesłanka',b.premise],['Zmiana znaczenia',b.reversal],['Reakcja',b.reaction],['Dalszy krok',b.route]]){const dt=document.createElement('dt');dt.textContent=name;const dd=document.createElement('dd');dd.textContent=text;ul.append(dt,dd)}card.append(ul);grid.append(card);}
}
const prevHearing=simRenderHearing;
function renderEpilogue(){const result=STATE.sim?.trial,existing=get('ps619Epilogue');if(!result){existing?.remove();return;}
 const target=get('psFinalEpilogue')||get('simHearingDetail');if(!target)return;
 let section=existing;if(!section){section=document.createElement('section');section.id='ps619Epilogue';section.className='ps619-section';section.setAttribute('aria-label','Epilog postaci');target.append(section)}else if(section.parentElement!==target)target.append(section);section.replaceChildren();
 const eyebrow=document.createElement('div');eyebrow.className='eyebrow';eyebrow.textContent='FINAŁ 3.0 · SKUTKI, NIE WYROKI';section.append(eyebrow);
 const header=document.createElement('h3');header.textContent='Ludzie, którzy zostają po śledztwie';section.append(header);
 const intro=document.createElement('p');intro.textContent=result.kind==='miscarriage'?'W aktach pozostał ciężar niewłaściwego oskarżenia. Decyzja śledczego nie usuwa obiektywnych śladów ani nie staje się automatycznie wyrokiem sądu.':result.kind==='excluded'?'Uchybienia proceduralne osłabiły możliwość rozstrzygnięcia. Losy ludzi nadal zależą od rzetelnego ustalenia zakresu odpowiedzialności.':result.kind==='returned'?'Materiał wrócił do uzupełnienia. Zwłoka nie oznacza zamknięcia prawdy, a ostrożność nie jest porażką.':'Śledztwo odróżniło ustalenia od oceny prawnej. Samo przedstawienie aktu nie jest prawomocnym wyrokiem sądu.';section.append(intro);
 const list=document.createElement('div');list.className='ps619-grid';
 for(const [id,p] of Object.entries(WITNESSES)){const c=people[id],box=document.createElement('article');box.className='ps619-tile';const has=CONTENT.gates.filter(g=>g.character===c.name).some(g=>g.needs.every(x=>STATE.found.has(x)));paragraph(box,c.name,has?p.after:`Wobec ${c.name} pozostają pytania, których nie wolno rozstrzygać wyłącznie na podstawie cudzych domysłów.`);const log=(STATE.dialogues?.[id]||[]).filter(x=>x.role==='player');const p2=document.createElement('p');p2.className='ps619-source';p2.textContent=log.length?`Przesłuchanie: ${log.length} pytań. Ton dotychczasowej rozmowy: ${tone(id).stance}.`:'Bez zapisanej rozmowy z tą osobą.';box.append(p2);list.append(box)}section.append(list);
 const memorial=document.createElement('p');memorial.className='ps619-memorial';memorial.textContent='Lena Rudnicka nie była nieomylnym symbolem sporu o bezpieczeństwo. Jej działania należy odtwarzać z tego, co zostawiła w dokumentach i relacjach, nie z wygodnej legendy. Nadal nie wszystkie minuty jej ostatniej nocy dają się ustalić.';section.append(memorial);
 const caveat=document.createElement('p');caveat.className='muted small';caveat.textContent='Epilog opisuje następstwa dochodzenia, nie orzeka o dalszym postępowaniu sądowym. Warunki zaliczenia i werdykt pozostają w niezmienionym silniku reguł.';section.append(caveat);
}
simRenderHearing=function(){const r=prevHearing.apply(this,arguments);renderEpilogue();return r;};
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render();if(STATE.sim?.trial)renderEpilogue()})}
registerNavigationHook({name:'narrative619-nav',after:schedule});
// Stan jest w całości pochodną istniejących dowodów i zeznań; nie tworzymy nowego zapisu ani subskrypcji zdarzeń.
window.PS619_NARRATIVE=Object.freeze({lena:LENACHAPTERS.map(x=>({id:x.id,requires:[...x.requires]})),beats:BEATS,profiles:WITNESSES,aiContext,tone,render,renderEpilogue});
render();
})();
/* PAKIET 6.20: sceniczna ciaglosc przesluchan i dyskretne reakcje.
 * Wszystkie sygnaly sa pochodna JUZ ZAPISANEJ rozmowy i odkrytych dokumentow.
 * Brak nowych faktow, ukrytych licznikow zaufania, kar lub odblokowan.
 */
(function(){
'use strict';
if(!window.PS619_NARRATIVE||typeof STATE==='undefined'||typeof CONTENT==='undefined'||typeof WitnessEngine==='undefined')return;
const $=id=>document.getElementById(id);
const prose={
 MAREK:{first:'Marek odpowiada formalnie. Układa zdania tak, jakby nadal tłumaczył decyzję służbową.',source:'Marek przestaje zasłaniać się ogólną procedurą. Uważniej dobiera słowa o własnych decyzjach.',pressure:'Marek usztywnia się, ale nie przerywa wyjaśnień. Domaga się rozdzielenia oskarżenia od ustalonego faktu.',return:'Marek zauważa, że wracasz do tej samej decyzji. Jego odpowiedź pozostaje rzeczowa, choć wyraźnie ostrożniejsza.'},
 TOMASZ:{first:'Tomasz mówi krótko, z przerwami. Gdy nie pamięta szczegółu, wraca do zapisów dyspozytorni.',source:'Tomasz próbuje oddzielić własne polecenia od tego, czego tamtej nocy nie obserwował.',pressure:'Tomasz potrzebuje chwili na uporządkowanie kolejności. Sam nacisk nie przywróci brakującego wspomnienia.',return:'Tomasz rozpoznaje powracające pytanie. Znowu sprawdza, co pamięta, a co zna tylko z rejestru.'},
 JANUSZ:{first:'Janusz odpowiada wprost i bez ozdobników. Łatwiej mówi o wykonanej pracy niż o rubrykach protokołu.',source:'Janusz bierze oddech przed odpowiedzią o dokumentacji. Ustalenie czynności okazuje się ważniejsze od podpisu.',pressure:'Janusz reaguje szorstko na uogólnienie, ale pozostaje przy tym, co mógł sprawdzić w warsztacie.',return:'Janusz wraca do tej samej czynności, tym razem pilnując różnicy między pamięcią a protokołem.'},
 ELZBIETA:{first:'Elżbieta dobiera słowa precyzyjnie. Sprawy dotyczące Leny wyraźnie trudniej jej opisać urzędowym językiem.',source:'Elżbieta zatrzymuje się przy pytaniu o obieg ostrzeżenia. Oddziela intencję zgłoszenia od jego doręczenia.',pressure:'Elżbieta odpowiada ciszej, ale nie pozwala zastąpić ustaleń o procedurze zarzutem o sprawstwo.',return:'Elżbieta zauważa, że pytanie powraca. Ostrożniej rozróżnia to, co powiedziała Lenie, od tego, co zapisano.'},
 KAMIL:{first:'Kamil przechodzi od razu do konkretów technicznych. Pojęcia „karta”, „konto” i „osoba” nie są dla niego zamienne.',source:'Kamil wskazuje granicę pomiaru. Rejestr pozwala odtworzyć zdarzenie systemowe, ale nie zawsze człowieka.',pressure:'Kamil staje się bardziej dosadny. Kwestionowanie technicznego odczytu nie jest jeszcze dowodem celowej manipulacji.',return:'Kamil wraca do rozróżnienia, które już wyjaśniał. Tym razem mocniej zaznacza ograniczenie logów.'},
 MAGDALENA:{first:'Magdalena pilnuje kolejności pytań. Wypowiada się krótko, tak jakby każde zdanie mogło wrócić do protokołu.',source:'Magdalena ostrożnie odnosi się do dokumentów. Sam fakt rozbieżności nie pozwala jej pominąć pytań o odbiór.',pressure:'Magdalena ucina dygresję. Bez weryfikowalnego źródła nie podejmuje gry w domniemane przyznanie się.',return:'Magdalena pamięta wcześniejszą wersję pytania i niechętnie toleruje jego powtórzenie; nadal wymaga konkretnego źródła.'}
};
const nextQuestion={
 MAREK:{requires:['TEC-01','EVID_DISPATCH_REVISION'],text:'Kto podjął decyzję o zmianie dyspozycji TW-217 i na podstawie jakich informacji?'},
 TOMASZ:{requires:['EVID_DISPATCH_REVISION'],text:'Co osobiście pamiętasz z decyzji o zmianie kursu, a co wynika tylko z rejestru?'},
 JANUSZ:{requires:['TEC-03','TEC-04'],text:'Które czynności w warsztacie wykonano, a które jedynie odnotowano w protokole?'},
 ELZBIETA:{requires:['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION'],text:'Co potwierdza projekt zgłoszenia BHP, a czego nie potwierdza brak wysyłki?'},
 KAMIL:{requires:['EVID_RESOURCE_HANDOVER','EVID_T17_DOOR_EVENT'],text:'Co dokładnie oznacza zdarzenie karty T-17 i czego nie mówi o obecności konkretnej osoby?'},
 MAGDALENA:{requires:['TEC-15','EVID_ACCEPTANCE_RECORD'],text:'Jak wyjaśnisz rozbieżność L-2 i L-3 między podzespołem a dokumentem odbioru?'}
};
const focus={
 MAREK:[['TEC-01','TEC-03'],['EVID_DISPATCH_REVISION']],
 TOMASZ:[['EVID_DISPATCH_REVISION'],['DIG-01']],
 JANUSZ:[['TEC-03','TEC-04'],['EVID_WORK_ORDER_RAW']],
 ELZBIETA:[['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION'],['DIG-01']],
 KAMIL:[['EVID_RESOURCE_HANDOVER','EVID_T17_DOOR_EVENT'],['TEC-15']],
 MAGDALENA:[['TEC-15','EVID_ACCEPTANCE_RECORD'],['EVID_CONFERENCE_SESSION']]
};
const norm=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/\s+/g,' ').trim();
function subject(q){const s=norm(q);return [
 [/(?:t-17|kart|identyfikator|sesj|dostep|logow)/,'access'],
 [/(?:l-2|l-3|podzespol|protokol|odbior|warsztat|usterk)/,'technical'],
 [/(?:godzin|kiedy|przed|po zmian|noc|dyzur|chronologi)/,'time'],
 [/(?:lena|ostrzez|bhp|wiadom|ostatni)/,'lena'],
 [/(?:alibi|obecno|widziales|widzielas|swia(d|d)ek)/,'presence']
 ].find(([r])=>r.test(s))?.[1]||'';}
function signals(id){
 const raw=STATE.dialogues?.[id]||[];
 const turns=raw.filter(x=>x?.role==='player').slice(-40);
 const questions=turns.map(x=>norm(String(x.text||'').split('\n[Okazano:')[0]));
 const topicCounts=new Map(),last=questions.at(-1)||'';
 for(const q of questions){const t=subject(q);if(t)topicCounts.set(t,(topicCounts.get(t)||0)+1);}
 const direct=questions.filter(q=>/(?:przyznaj sie|przyznajesz sie|sklamal|zabiles|zabilas|zamordowales|zamordowalas|to twoja wina|klamiesz)/.test(q)).length;
 const source=questions.filter(q=>/(?:skad wiesz|co potwierdz|jakie zrod|co sam widz|czy masz dowod|jak sprawdz)/.test(q)).length;
 const repeated=!!subject(last)&&(topicCounts.get(subject(last))||0)>=2;
 const unlocked=(focus[id]||[]).some(req=>req.every(doc=>STATE.found?.has(doc)));
 // Dostęp do dokumentów jest sprawdzany niezależnie od sugestii zawartych w pytaniu.
 const stage=turns.length<2?'first':repeated?'return':direct>source?'pressure':unlocked&&source>0?'source':'first';
 return {stage,questions:turns.length,returns:repeated,sourceQuestions:source,accusations:direct,sourceUnlocked:unlocked};
}
const panel=document.createElement('div');panel.id='ps620WitnessBeat';panel.className='ps620-witness-beat';panel.setAttribute('aria-label','Subtelna reakcja świadka');panel.hidden=true;
const prefix=document.createElement('span');prefix.className='ps620-beat-label';prefix.textContent='Zachowanie rozmówcy';
const content=document.createElement('p');content.id='ps620WitnessText';panel.append(prefix,content);
const ask=document.createElement('button');ask.type='button';ask.className='ps620-next btn alt';ask.textContent='Przygotuj pytanie z odkryć';ask.hidden=true;panel.append(ask);
const anchor=$('interview')?.querySelector('.chathead');anchor?.insertAdjacentElement('afterend',panel);
let lastKey='';
function render(){
 const id=STATE.activeChar;
 if(!anchor||!prose[id]){panel.hidden=true;return;}
 const s=signals(id),message=prose[id][s.stage];
 panel.hidden=false;
 const suggested=nextQuestion[id];
 ask.hidden=!suggested||!suggested.requires.every(doc=>STATE.found?.has(doc));
 if(!ask.hidden)ask.dataset.ps620Witness=id;
 if(lastKey!==id+':'+s.stage+':'+s.questions){
  content.textContent=message;
  panel.dataset.stance=s.stage;
  lastKey=id+':'+s.stage+':'+s.questions;
 }
}
// Rysowanie za pośrednictwem istniejących punktów życia UI; nie przepisujemy logiki rozmowy.
const originalInterrogation=typeof simRenderInterrogation==='function'?simRenderInterrogation:null;
if(originalInterrogation){simRenderInterrogation=function(){const result=originalInterrogation.apply(this,arguments);render();return result;};}
ask.addEventListener('click',()=>{
 const id=STATE.activeChar,suggested=nextQuestion[id],field=$('chatInput');
 if(!suggested||!suggested.requires.every(doc=>STATE.found?.has(doc))||!field||window.PS77_AI?.busy)return;
 if(field.value.trim()){
  if(typeof toast==='function')toast('Najpierw wyślij lub wyczyść przygotowane już pytanie.');
  field.focus();return;
 }
 field.value=suggested.text;
 field.focus({preventScroll:true});
});
registerNavigationHook({name:'narrative620-reaction-preview',after:render});
const originalSend=WitnessEngine.snapshotSend();
registerWitnessSendLayer('narrative620-post-turn',function(){const result=originalSend.apply(this,arguments);render();return result;});
window.PS620_SCENES=Object.freeze({signals,render,profiles:prose});
render();
})();
/* Pakiet 6.21: relacje między tematami w długiej rozmowie.
 * Odnosi się tylko do pytań zapisanych w historii bieżącego świadka.
 * Nie odblokowuje informacji, nie interpretuje winy, nie zmienia zapisu.
 */
(function(){
'use strict';
if(!window.PS620_SCENES||typeof STATE==='undefined')return;
const topics=[
 ['access',/(?:t-17|kart|wejsci|dostep|sesj|log)/,'kart i logów'],
 ['technical',/(?:tw-217|l-2|l-3|protokol|podzespol|warsztat|usterk)/,'wagonu i dokumentacji technicznej'],
 ['chronology',/(?:godzin|kiedy|noc|dyzur|kolejn|po zmian|przed)/,'chronologii nocy'],
 ['lena',/(?:lena|leny|lenie|bhp|ostrzez|wiadom)/,'Leny i ostrzeżeń'],
 ['alibi',/(?:alibi|widział|widzial|obecno|spotkan)/,'obecności i alibi'],
 ['source',/(?:skad|zrod|potwierd|dowod|wiesz|sam widz)/,'źródeł wiedzy'],
 ['responsibility',/(?:zabil|zaboj|wina|klam|przyznaj|ukrywa|odpowiedzial)/,'odpowiedzialności']
];
const norm=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
function analyze(id){
 const entries=(STATE.dialogues?.[id]||[]).filter(x=>x?.role==='player').slice(-48);
 const rows=entries.map(x=>topics.filter(t=>t[1].test(norm(x.text))).map(t=>t[0]));
 const recent=rows.at(-1)||[],previous=rows.slice(0,-1),counts=new Map();
 for(const row of previous)for(const k of new Set(row))counts.set(k,(counts.get(k)||0)+1);
 const returns=recent.filter(k=>(counts.get(k)||0)>0),
  alternatives=[...new Set(rows.slice(-8,-1).flat().filter(k=>!recent.includes(k)))];
 return {count:entries.length,topics:recent,multi:recent.length>1,returns,alternatives,
  long:entries.length>=8,hasDocumentAccess:false};
}
const band=document.createElement('div');band.id='ps621ThreadCue';band.className='ps621-thread-cue';band.hidden=true;band.setAttribute('aria-label','Ciągłość rozmowy');
const tiny=document.createElement('span');tiny.className='ps621-label';tiny.textContent='CIĄGŁOŚĆ ROZMOWY';
const line=document.createElement('p');band.append(tiny,line);
const old=document.getElementById('ps620WitnessBeat');old?.insertAdjacentElement('afterend',band);
function render(){
 const id=STATE.activeChar;if(!old||!id||!STATE.dialogues?.[id]){band.hidden=true;return;}
 const a=analyze(id);
 band.hidden=!(a.long&&(a.returns.length||a.multi));if(band.hidden)return;
 const current=a.returns.slice(0,2).map(k=>topics.find(t=>t[0]===k)?.[2]).filter(Boolean);
 if(current.length)line.textContent='To kolejny powrót do tematu '+current.join(' oraz ')+'. Rozmówca pamięta kierunek rozmowy; wcześniejsze odpowiedzi nie stają się przez to nowymi dowodami.';
 else line.textContent='Pytanie łączy kilka tematów. Świadek powinien odnieść się do każdej części albo jasno określić, czego nie wie.';
}
const prior=typeof simRenderInterrogation==='function'?simRenderInterrogation:null;
if(prior)simRenderInterrogation=function(){const result=prior.apply(this,arguments);render();return result;};
registerNavigationHook({name:'long-interviews-621',after:render});
window.PS621_DIALOGUE=Object.freeze({analyze,render});
render();
})();
/* Pakiet 6.21: filmowe przedstawienie istniejących ośmiu przełomów.
 * Wyłącznie prezentacja. Żadnej zmiany etapów, faktów, wyborów ani zapisu.
 */
(function(){
'use strict';
if(!window.PS85_STORY)return;
const curtain=document.getElementById('ps85Curtain');
const title=document.getElementById('ps85FilmTitle');
const text=document.getElementById('ps85FilmText');
const kind=document.getElementById('ps85FilmKind');
const stage=curtain?.querySelector('.ps85-stage');
if(!curtain||!title||!text||!kind||!stage)return;
const titles={
 'Kurs, który wyprzedził papier':['paper','Zderzenie dyspozycji i dokumentów'],
 'Ostrzeżenie, które nie zatrzymało obiegu':['warning','Ostrzeżenie bez potwierdzenia'],
 'Przepustka nie ma twarzy':['cold','Ślad systemowy, nie obserwacja'],
 'Między powrotem a wiadomością':['night','Przerwa w nocnej chronologii'],
 'Kontakt to nie opis śmierci':['night','Granice ustaleń'],
 'Nie jeden błąd, lecz dwa łańcuchy':['warning','Dwa obiegi informacji'],
 'Alibi złożone z cudzych zegarów':['cold','Różne rodzaje zapisu'],
 'Ostatnia wiadomość nie ma sprawcy':['night','Ustalenia i niedopowiedzenia']
};
const subtitle=document.createElement('p');subtitle.id='ps621StageAtmosphere';subtitle.className='ps621-stage-atmosphere';subtitle.setAttribute('aria-hidden','true');
text.insertAdjacentElement('afterend',subtitle);
const sound=document.createElement('button');sound.type='button';sound.className='ps621-sound-toggle';sound.textContent='Dźwięk scen: wyłączony';sound.setAttribute('aria-pressed','false');sound.setAttribute('aria-label','Włącz lub wyłącz dyskretne dźwięki scen');
const close=curtain.querySelector('#ps85Close');close?.insertAdjacentElement('beforebegin',sound);
let enabled=false,ctx=null,lastCue='',lastFrame='';
function audioCue(){
 if(!enabled||curtain.hidden||document.hidden)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  if(!ctx)ctx=new C();if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(94,now);osc.frequency.exponentialRampToValueAtTime(70,now+.32);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.014,now+.025);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.39);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.42);
 }catch(_){/* Audio opcjonalne. */}
}
function render(){
 if(curtain.hidden){lastFrame='';return;}
 const t=titles[title.textContent];if(!t){stage.removeAttribute('data-ps621-mood');subtitle.textContent='';return;}
 stage.dataset.ps621Mood=t[0];subtitle.textContent=t[1];
 const identity=title.textContent+'|'+kind.textContent;
 if(identity!==lastFrame){
  lastFrame=identity;
  if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   stage.classList.remove('ps621-frame-enter');void stage.offsetWidth;stage.classList.add('ps621-frame-enter');
  }
  audioCue();
 }
}
sound.addEventListener('click',()=>{
 enabled=!enabled;sound.textContent='Dźwięk scen: '+(enabled?'włączony':'wyłączony');sound.setAttribute('aria-pressed',String(enabled));
 if(enabled)audioCue();
});
const observer=new MutationObserver(render);
observer.observe(curtain,{attributes:true,attributeFilter:['hidden']});
observer.observe(title,{childList:true,characterData:true,subtree:true});
observer.observe(kind,{childList:true,characterData:true,subtree:true});
window.PS621_CINEMA=Object.freeze({status:()=>({enabled,active:!curtain.hidden,mood:stage.dataset.ps621Mood||'',caption:subtitle.textContent}),render});
})();
/* Pakiet 6.22: wspólny silnik mimiki dla sześciu portretów SVG.
 * Reżyseria wizualna, NIE analiza prawdomówności, sprawstwa ani nowa pamięć.
 * Nie odblokowuje materiałów, nie czyta kluczy API i nie zmienia GameState.
 */
(function(){
'use strict';
if(typeof npc8PortraitSvg!=='function'||typeof STATE==='undefined'||typeof CONTENT==='undefined')return;
const IDS=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const CHARACTER=Object.fromEntries(CONTENT.characters.filter(c=>IDS.includes(c.id)).map(c=>[c.id,c]));
const PROFILES={
 MAREK:{baseline:'controlled',tension:58,emphasis:'guarded',gaze:0},
 TOMASZ:{baseline:'uncertain',tension:49,emphasis:'uncertain',gaze:-1},
 JANUSZ:{baseline:'focused',tension:61,emphasis:'guarded',gaze:1},
 ELZBIETA:{baseline:'focused',tension:59,emphasis:'sad',gaze:-1},
 KAMIL:{baseline:'focused',tension:69,emphasis:'focused',gaze:1},
 MAGDALENA:{baseline:'controlled',tension:70,emphasis:'controlled',gaze:0}
};
const LABELS={neutral:'neutralność',focused:'skupienie',uncertain:'niepewność',tense:'napięcie',guarded:'defensywność',surprised:'zaskoczenie',sad:'smutek',relieved:'ulga',controlled:'kontrolowany spokój',irritated:'irytacja'};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const blame=/(?:klamiesz|klamala|klamal|zabil[ae]|zamordowal|przyznaj sie|twoja wina|jestes winna)/;
const detail=/(?:skad wiesz|co potwierdza|jaki dowod|jakie zrodlo|czy widziales|czy widzialas|chronolog|o ktorej)/;
const lena=/(?:lena|leny|lenie|ostrzezen|smierc)/;
const apology=/(?:przepraszam|wybacz|cofam zarzut)/;
function derive(id, options={}){
 const p=PROFILES[id];if(!p)return {emotion:'neutral',gaze:0,speaking:false};
 const st=typeof NPC4_STATE!=='undefined'?NPC4_STATE?.[id]:null;
 const raw=(STATE.dialogues?.[id]||[]).slice(-3),questions=raw.filter(x=>x?.role==='player');
 const latestQuestion=options.question??questions.at(-1)?.text??'';
 const q=normalize(latestQuestion);
 const attached=options.attachedEvidence || /\[Okazano: ([A-Z0-9_.-]+)\]/.exec(latestQuestion)?.[1] || '';
 const evidencePresent=!!(attached && STATE.found?.has?.(attached));
 const tension=Math.max(0,Math.min(100,Number(st?.tension)||0));
 const fatigue=Math.max(0,Math.min(100,Number(st?.fatigue)||0));
 const reaction=typeof window.PS620_SCENES?.signals==='function'?window.PS620_SCENES.signals(id):null;
 const pressure=blame.test(q)||(reaction?.stage==='pressure');
 const evidenceShock=evidencePresent&&tension>=p.tension;
 const speaking=raw.at(-1)?.role==='npc' || raw.at(-1)?.role==='witness';
 let emotion=p.baseline;
 if(fatigue>=72)emotion='uncertain';
 if(evidenceShock)emotion='surprised';
 else if(pressure&&tension>=p.tension)emotion=id==='MAGDALENA'?'controlled':id==='KAMIL'?'irritated':'tense';
 else if(pressure)emotion=p.emphasis==='sad'?'guarded':p.emphasis;
 else if(lena.test(q)&&(id==='ELZBIETA'||id==='TOMASZ')&&tension>=40)emotion='sad';
 else if(detail.test(q))emotion='focused';
 else if(apology.test(q)&&tension<60)emotion='relieved';
 else if(tension>=p.tension+12)emotion='guarded';
 return {emotion,gaze:p.gaze, speaking:!!speaking, reason:evidenceShock?'documented-confrontation':pressure?'question-pressure':detail.test(q)?'factual-question':'baseline'};
}
const MOUTH={
 neutral:'M143 192Q159 191 176 192',focused:'M144 193Q159 191 175 193',
 uncertain:'M144 193Q159 197 175 193',tense:'M145 193Q159 190 174 193',
 guarded:'M143 193Q159 193 175 192',surprised:'M149 193Q160 200 171 193',
 sad:'M144 194Q159 199 176 194',relieved:'M144 192Q159 197 175 192',
 controlled:'M145 193Q159 192 174 193',irritated:'M146 192Q159 190 173 192'
};
function animate(root,id,opts={}){
 if(!root||!PROFILES[id])return null;
 const data=derive(id,opts);root.dataset.ps622Emotion=data.emotion;
 root.style.setProperty('--ps622-gaze',String(data.gaze)+'px');
 root.classList.toggle('ps622-speaking',Boolean(data.speaking));
 // SVG elements remain the same characters across every emotional state.
 root.querySelectorAll('.wp-mouth-curve').forEach(path=>path.setAttribute('d',MOUTH[data.emotion]||MOUTH.neutral));
 if(root.matches('.wp-stage')){
  const picture=root.querySelector('.wp-picture');
  if(picture)picture.setAttribute('aria-label','Portret: '+CHARACTER[id].name+'. Mimika: '+LABELS[data.emotion]+'. Emocja nie jest dowodem winy.');
 }
 return data;
}
function refreshCurrent(){
 const id=STATE.activeChar,stage=document.querySelector('#witnessStage .wp-stage');
 if(!stage||!IDS.includes(id))return;
 animate(stage,id);
}
// Portraits appear only for witnesses attached to an existing, already unlocked breakthrough.
const SCENES={
 'Kurs, który wyprzedził papier':['MAREK','JANUSZ'],
 'Ostrzeżenie, które nie zatrzymało obiegu':['ELZBIETA','MAGDALENA'],
 'Przepustka nie ma twarzy':['KAMIL','MAGDALENA'],
 'Między powrotem a wiadomością':['TOMASZ','MAREK'],
 'Kontakt to nie opis śmierci':['ELZBIETA','MAGDALENA'],
 'Nie jeden błąd, lecz dwa łańcuchy':['MAREK','ELZBIETA'],
 'Alibi złożone z cudzych zegarów':['KAMIL','MAGDALENA'],
 'Ostatnia wiadomość nie ma sprawcy':['MAGDALENA','ELZBIETA']
};
function card(id,emotion){
 const c=CHARACTER[id];if(!c)return null;
 const card=document.createElement('figure');card.className='ps622-face-card';card.dataset.witness=id;
 const view=document.createElement('div');view.className='ps622-face-view';view.innerHTML=npc8PortraitSvg(c,false,{cls:'is-neutral'})+npc8PortraitPhoto(id,false);
 const caption=document.createElement('figcaption');caption.textContent=c.name;
 card.append(view,caption);animate(card,id,{question:''});
 if(emotion){card.dataset.ps622Emotion=emotion;card.querySelectorAll('.wp-mouth-curve').forEach(x=>x.setAttribute('d',MOUTH[emotion]||MOUTH.neutral));}
 return card;
}
function renderStory(){
 const curtain=document.getElementById('ps85Curtain');if(!curtain||curtain.hidden)return;
 const title=document.getElementById('ps85FilmTitle')?.textContent||'';
 const people=SCENES[title]||[];const stage=curtain.querySelector('.ps85-stage');if(!stage)return;
 let area=document.getElementById('ps622SceneFaces');
 if(!area){area=document.createElement('div');area.id='ps622SceneFaces';area.className='ps622-face-row';area.setAttribute('aria-label','Reakcje postaci');
 const actions=document.getElementById('ps85FilmActions');actions?.insertAdjacentElement('beforebegin',area);}
 if(area.dataset.scene===title)return;
 area.replaceChildren();area.dataset.scene=title;
 people.forEach((id,i)=>{const x=card(id,i?'guarded':'focused');if(x)area.append(x);});
}
function renderFinale(){
 const trial=STATE.sim?.trial;const root=document.getElementById('psFinalEpilogue')||document.getElementById('simHearingDetail');
 if(!root||!trial)return;
 let area=document.getElementById('ps622FinalFaces');
 if(!area){area=document.createElement('section');area.id='ps622FinalFaces';area.className='ps622-finale-faces';
 const h=document.createElement('h4');h.textContent='Reakcje po zakończeniu śledztwa';area.append(h);
 const row=document.createElement('div');row.className='ps622-face-row';area.append(row);root.append(area);}
 const row=area.querySelector('.ps622-face-row');if(!row||row.childElementCount)return;
 // No guilty-looking facial shortcut: same neutral, restrained reaction regardless of verdict.
 for(const id of ['ELZBIETA','MAGDALENA']){const x=card(id,'controlled');if(x)row.append(x);}
}
// App's rendering function is the only place that may replace the main portrait.
// Scene listeners are intentionally passive: no state mutations or evidence events.
const curtain=document.getElementById('ps85Curtain');
if(curtain){
 const observer=new MutationObserver(renderStory);
 observer.observe(curtain,{attributes:true,attributeFilter:['hidden']});
 const heading=document.getElementById('ps85FilmTitle');
 if(heading)observer.observe(heading,{subtree:true,characterData:true,childList:true});
}
if(typeof simRenderHearing==='function'){
 const prior=simRenderHearing;
 simRenderHearing=function(){const result=prior.apply(this,arguments);renderFinale();return result;};
}
const prefers=window.matchMedia?.('(prefers-reduced-motion: reduce)');
window.PS622_FACES=Object.freeze({derive,animate,refreshCurrent,renderStory,renderFinale,
 sceneTitles:Object.freeze(Object.keys(SCENES)),profiles:Object.freeze(PROFILES),
 reducedMotion:()=>!!prefers?.matches});
refreshCurrent();
})();
/* Scoped answers to questions beyond a witness's documented competence.
 * Runs AFTER existing linguistic styling, but never overwrites a confession,
 * scripted correction, procedural refusal or answer grounded in presented evidence.
 */
(function(){
 'use strict';
 if(typeof WitnessEngine==='undefined')return;
 const previous=WitnessEngine.snapshotAnswer();
 const CARD=/(?:\bt[ -]?17\b|\bkart[ayąę]?\b|\bczytnik\b|\bidentyfikator\b|\bzapis dost[eę]pu\b)/i;
 const replies={
  MAREK:'Nie wiem, kto wtedy użył tej karty. Nie widziałem tego.',
  TOMASZ:'Nie widziałem, kto użył tej karty. Sam zapis nie pokaże mi osoby.',
  JANUSZ:'Tego z kartą nie widziałem. Nie będę zgadywał, kto ją miał.',
  ELZBIETA:'Nie wiem, kto użył T-17. Nie byłam przy tym wejściu.',
  KAMIL:'Sam zapis T-17 nie mówi mi, kto trzymał kartę w chwili użycia.',
  MAGDALENA:'Zapis użycia karty nie pokazuje człowieka przy drzwiach. Co dokładnie ma potwierdzać?'
 };
 registerWitnessAnswerLayer('out-of-scope-624',function(c,q,attached){
  const before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const answer=previous(c,q,attached);
  if(attached||!c||!replies[c.id]||!CARD.test(q)||simWitness(c).blocked)return answer;
  const mem=NPC9_MEMORY[c.id],last=mem.semantic?.at(-1),statement=mem.statements?.at(-1);
  if(!last||before!==mem.confronted.length||!['TESTIMONY','LIMITED_KNOWLEDGE','UNKNOWN','SOCIAL'].includes(last.status)||
     (last.source_ids||[]).length||last.answer!==answer||statement?.text!==answer)return answer;
  const next=replies[c.id];
  last.answer=next;statement.text=next;
  const st=NPC4_STATE[c.id],recent=st.recent?.at(-1);
  if(recent)recent.answer=norm(next).slice(0,1550);
  if(st.npc65?.lastAnswer===answer)st.npc65.lastAnswer=next.slice(0,1300);
  if(st.npc68?.threads?.at(-1)?.a===answer.slice(0,850))st.npc68.threads.at(-1).a=next.slice(0,850);
  return next;
 });
})();
/* Pakiet 6.25: ostatnia bezpieczna kontrola zgodności odpowiedzi z pytaniem.
 * Naprawia WYŁĄCZNIE błędne przekierowania lub ogólnikową reakcję na niejasną
 * sprzeczność. Nie dostarcza nowej wiedzy ani nie zmienia bramek dowodowych.
 * Własne słownictwo sześciu osób, bez jednej wspólnej formułki.
 */
(function(){
'use strict';
if(typeof WitnessEngine==='undefined'||typeof NPC9_MEMORY==='undefined')return;
const before=WitnessEngine.snapshotAnswer();
const plain=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/\s+/g,' ').trim();
const labels=Object.freeze({tech:'części L-2 / L-3',receipt:'protokół odbioru',sequence:'kolejność alarmu i zmiany kursu',routing:'zmiana dyspozycji TW-217',workorder:'powód zlecenia',contradiction:'sprzeczność wypowiedzi'});
const profiles={
 MAREK:{
  tech:['L-2 i L-3 to szczegóły techniczne. Nie będę ich oceniał zamiast diagnosty.','Co do L-2 i L-3, sam nie ustalę przyczyny awarii. Tu potrzebne są oględziny.','O L-2 i L-3 nie mam własnego ustalenia technicznego. Mogę mówić o decyzjach organizacyjnych, nie o stanie części.'],
  receipt:['W odbiorze L-3 liczy się podpis na protokole. Bez niego nie wskażę odpowiedzialnej osoby.','W sprawie odbioru L-3 ważne jest, czyje zatwierdzenie widnieje w dokumentacji. Tego nie potwierdzę bez niej.'],
  sequence:['Kolejność alarmu i zmiany kursu trzeba ustalić z obu zapisów. Sam nie odtworzę jej z pewnością.','Nie chcę łączyć alarmu i zmiany dyspozycji w jedną historię bez porównania godzin.'],
  routing:['Nie potrafię podać pewnego powodu zmiany dyspozycji TW-217. Proszę oddzielić decyzję od późniejszego zapisu.','Nie będę dopisywał motywu do zmiany kursu. Trzeba sprawdzić podstawę tamtej dyspozycji.'],
  workorder:['Nie ustalę przyczyny wystawienia zlecenia bez wskazania konkretnej decyzji.','Proszę wskazać zlecenie. Nie chcę przypisywać komuś powodu, którego nie znam.'],
  contradiction:['Co konkretnie się nie zgadza? Bez wskazania wypowiedzi nie odpowiem na zarzut.','Proszę powiedzieć, o którą moją odpowiedź chodzi. Nie chciałbym zgadywać.','Jeśli coś powiedziałem inaczej, proszę to przytoczyć. Odniosę się do konkretu.']},
 TOMASZ:{
  tech:['O L-2 i L-3 nie potrafię powiedzieć, jaka była awaria. Tym zajmowali się ludzie od techniki.','L-2 i L-3? Nie sprawdzałem tych części. Nie powiem, co się w nich zepsuło.','Nie mam własnych oględzin L-2 ani L-3. Nie chcę zgadywać usterki.'],
  receipt:['Protokół odbioru L-3 nie był moim meldunkiem z dyspozytorni. Nie wiem, kto go zatwierdził.','Nie potrafię wskazać osoby odpowiedzialnej za odbiór L-3. Moje zapisy dotyczyły dyspozycji.'],
  sequence:['Alarm i zmianę kursu pamiętam jako różne sprawy. Pełną kolejność trzeba sprawdzić w łączności.','Nie ułożę z pamięci wszystkich minut między zmianą dyspozycji a alarmem.'],
  routing:['Nie pamiętam, z jakiego powodu zmieniono dyspozycję TW-217.','Nie chcę odtwarzać powodu zmiany kursu na wyczucie. Trzeba sięgnąć do dyspozycji.'],
  workorder:['Nie wiem, co dokładnie zdecydowało o wystawieniu zlecenia warsztatowego.','Powód zlecenia? Z mojego stanowiska nie potwierdzę, dlaczego je wystawiono.'],
  contradiction:['Co powiedziałem inaczej?','Poczekaj. O którą odpowiedź chodzi?','Mogłem coś pomylić, ale powiedz najpierw, co się nie zgadza.']},
 JANUSZ:{
  tech:['L-2 i L-3 trzeba sprawdzić na warsztacie. Z samego pytania nie wyciągnę przyczyny awarii.','Co z L-2 i L-3? Musiałbym zobaczyć surowe zlecenie i wynik oględzin. Nie będę zgadywał.','O tych częściach mogę mówić tylko w zakresie wykonanej pracy. Przyczyny awarii nie ustalę bez sprawdzenia L-2 i L-3.'],
  receipt:['Kto odpowiada za protokół odbioru L-3? Najpierw zobaczmy podpis i zakres czynności.','Odbiór L-3 to nie to samo co wykonanie pracy. Bez dokumentu nie wskażę odpowiedzialnej osoby.'],
  sequence:['Nie byłem przy każdej dyspozycji. Alarm i zmianę kursu trzeba porównać z zapisami, nie z moją pamięcią.','Kolejności zmiany kursu i alarmu nie podam na słowo. Byłem przy pracy, nie przy wszystkich meldunkach.'],
  routing:['Nie wiem, dlaczego zmieniono dyspozycję TW-217. To nie była moja decyzja.','Zmiana kursu TW-217? Nie będę dopowiadał powodu za dyspozytornię.'],
  workorder:['Przy zleceniu wolę zobaczyć, co wpisano. Bez tego nie powiem, dlaczego je uruchomiono.','Powód zlecenia powinien być przy zleceniu. Nie mam pewności, jaki wpisano.'],
  contradiction:['To powiedz, w którym miejscu.','Co konkretnie miałem powiedzieć inaczej?','Daj mi tę wcześniejszą wypowiedź. Nie będę kłócił się z ogólnym zarzutem.']},
 ELZBIETA:{
  tech:['O awarii L-2 i L-3 nie mam własnej diagnozy. Zajmowałam się zgłoszeniem ryzyka, nie pomiarem tych części.','L-2 i L-3 to pytanie do dokumentacji technicznej. Mogę mówić o zgłoszeniach, które znałam.','Nie potwierdzę rodzaju usterki L-2 ani L-3. Sama tych podzespołów nie sprawdzałam.'],
  receipt:['Protokół odbioru L-3 wymaga sprawdzenia podpisów. Nie wiem z własnej wiedzy, kto go zatwierdził.','Nie potrafię wskazać odpowiedzialnego za odbiór L-3 bez protokołu. Moje obowiązki dotyczyły BHP.'],
  sequence:['Nie obserwowałam całej zmiany. Nie potrafię ustalić kolejności alarmu i zmiany kursu z pamięci.','Kolejności tych dwóch zdarzeń nie potwierdzę. Rozmawiałam o zagrożeniu, nie śledziłam wszystkich dyspozycji.'],
  routing:['Przyczyny zmiany dyspozycji TW-217 nie znam na tyle dobrze, by ją podać jako fakt.','Nie byłam osobą podejmującą decyzję o zmianie kursu. Nie będę tłumaczyć jej intencji.'],
  workorder:['Nie potrafię przypisać powodu temu zleceniu. Dotyczyło innego obiegu niż moje zgłoszenia.','Proszę wskazać konkretne zlecenie. Wolałabym nie mieszać go z korespondencją BHP.'],
  contradiction:['Które zdanie masz na myśli?','Nie jestem pewna, czego dotyczy zarzut. Możesz powiedzieć konkretnie?','Jeżeli coś zabrzmiało inaczej, chciałabym wiedzieć co.']},
 KAMIL:{
  tech:['L-2 i L-3 wymagają sprawdzenia surowych danych. Nie nazwę usterki na podstawie samej wzmianki.','O L-2 i L-3 nie da się powiedzieć uczciwie „awaria”, nie ustalając, co pokazują pomiary.','L-2, L-3... Potrzebuję wskazania konkretnego odczytu. Inaczej nie odróżnię usterki od błędu zapisu.'],
  receipt:['Nie wiem, kto podpisał odbiór L-3. Diagnostyka i zatwierdzenie protokołu to różne rzeczy.','Odbiór L-3? To trzeba sprawdzić w historii zatwierdzeń, nie wyciągać z logu diagnostycznego.'],
  sequence:['W surowych logach są czasy operacji, ale kolejności alarmu i zmiany kursu nie stwierdzę bez obu źródeł.','Alarm i dyspozycja to osobne zapisy. Nie skleję ich w chronologię bez porównania.'],
  routing:['Sam odczyt techniczny nie podaje powodu zmiany dyspozycji TW-217. Tego nie wiem.','Nie potrafię powiedzieć, dlaczego ktoś zmienił kurs. Log nie pokazuje intencji.'],
  workorder:['Nie ustalę motywu wystawienia zlecenia na podstawie samej diagnostyki.','Powód zlecenia trzeba potwierdzić w dokumentacji. Log nie jest uzasadnieniem decyzji.'],
  contradiction:['Gdzie jest rozbieżność? W odczycie czy w moich słowach?','Co dokładnie się rozjechało?','Pokaż tę różnicę. Bez tego nie wiem, do czego mam się odnieść.']},
 MAGDALENA:{
  tech:['Nie potwierdzę przyczyny awarii L-2 i L-3 bez dokumentacji technicznej.','L-2 i L-3 są objęte dokumentacją odbiorową. Sam zapis nie wystarczy, by przesądzić usterkę.','Nie ma podstaw, żebym z pamięci rozstrzygała stan L-2 i L-3.'],
  receipt:['W sprawie protokołu odbioru L-3 proszę wskazać konkretną wersję. Wtedy można ustalić zakres zatwierdzenia.','Nie wskażę odpowiedzialności za odbiór L-3 bez numeru dokumentu i jego wersji.'],
  sequence:['Z samej sesji audytowej nie wynika kolejność alarmu i zmiany kursu. Tego nie potwierdzę.','Nie ustalę chronologii alarmu i dyspozycji na podstawie jednego rejestru.'],
  routing:['Powodu zmiany dyspozycji TW-217 nie potrafię potwierdzić z dokumentacji odbiorowej.','Nie dysponuję ustaleniem, które wyjaśniałoby przyczynę zmiany kursu TW-217.'],
  workorder:['O które zlecenie pan pyta? Bez wskazania wersji nie potwierdzę jego uzasadnienia.','Nie potrafię przypisać decyzji o zleceniu konkretnego powodu bez dokumentu.'],
  contradiction:['Co konkretnie miałam powiedzieć inaczej?','Proszę wskazać, o którą wypowiedź chodzi.','Na co się pan powołuje? Nie chcę odpowiadać na niedopowiedziany zarzut.']}
};
const PROTECTED=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL']);
function detect(raw){
 const q=plain(raw);if(!q||q.length>850)return null;
 const hasParts=/\bl\s*[- ]?\s*[23]\b/.test(q),card=/(?:\bt[ -]?17\b|\bkart\w*\b)/.test(q),routeMention=/(?:dyspozycj|zmian\w* kurs)/.test(q);
 // Nie zastępuj odpowiedzi na pytania o kilka odrębnych wątków jednym zdaniem.
 if((card&&(hasParts||routeMention))||(hasParts&&/(?:gdzie byla lena|co wiedziala lena|czy lena wiedziala)/.test(q)))return null;
 const techn=/(?:awari|usterk|uszkodz|niezgodn|co sie stalo|co wiesz|co jest nie tak|co z|przyczyn|problem|diagnos)/.test(q);
 if(hasParts&&/(?:protokol|odbior|zatwierdz|podpis)/.test(q)&&/(?:kto|odpowiada|zatwierdz|podpis)/.test(q))return 'receipt';
 if(hasParts&&techn&&!/(?:lena|leny|lenie|magdalena|sprawc|sabotaz|celowo|kto zabil|zamordow|przyznaj|powiedzial|wczesniej|inaczej)/.test(q))return 'tech';
 // Nigdy nie myl zarzutu wobec zeznań z przedstawionym dowodem albo formalnym przyznaniem się.
 if(/(?:wczesniej|poprzednio|przed chwila|najpierw)/.test(q)&&/(?:inaczej|cos innego|sprzeczn|niezgodn|zmienil|zmienila|mowil|mowila|powiedzial)/.test(q)&&!/(?:zabojst|morderstw|zabil|zamordow|przyznan)/.test(q))return 'contradiction';
 if(/(?:zeznan|wypowiedzi|powiedzial)/.test(q)&&/(?:nie zgadza|sprzeczn|rozbiezn|co jest nie tak|co sie nie zgadza)/.test(q))return 'contradiction';
 const alarm=/(?:alarm|02:02)/.test(q),route=/(?:kurs|dyspozycj|zmian)/.test(q);
 if(alarm&&route&&/(?:kolejno|kiedy|chronolog|przed|po czym)/.test(q))return 'sequence';
 if(/(?:dlaczego|czemu|z jakiego powodu|jaka przyczyn)/.test(q)&&/(?:dyspozycj|zmieniono kurs|zmienil kurs|zmienila kurs)/.test(q))return 'routing';
 if(/(?:powod|dlaczego|czemu|przyczyn)/.test(q)&&/(?:zlecen|zlecil|zlecic)/.test(q))return 'workorder';
 return null;
}
function isOffTopic(kind,text){
 const a=plain(text);
 if(kind==='contradiction')return true;
 if(kind==='tech')return !/\bl\s*[- ]?\s*[23]\b/.test(a);
 if(kind==='receipt')return !/(?:odbior|protokol|zatwierdz|podpis)/.test(a)||!/\bl\s*[- ]?\s*[23]\b/.test(a);
 if(kind==='sequence')return !(/alarm/.test(a)&&/(?:kurs|dyspozycj)/.test(a));
 if(kind==='routing')return !/(?:kurs|dyspozycj|tw-?217)/.test(a);
 if(kind==='workorder')return !/(?:powod|przyczyn|dlaczego|nie wiem|nie potraf|bez dokument|bez wskazania|wystawion)/.test(a);
 return false;
}
function permitted(c,answer,attached,oldConfronted){
 const m=NPC9_MEMORY?.[c?.id];if(!m||!c||attached||simWitness(c).blocked)return false;
 const sem=m.semantic?.at(-1),st=m.statements?.at(-1);
 if((m.confronted?.length||0)!==oldConfronted||!sem||!st||sem.turn!==m.turn||st.turn!==m.turn||
    sem.answer!==answer||st.text!==answer||PROTECTED.has(sem.status)||PROTECTED.has(st.status)||
    sem.source_ids?.length||st.source_ids?.length)return false;
 const a=plain(answer);
 if(/(?:przyznaje sie|odmawiam|pelnomocnik|podtrzymuje odmowe|konfrontacj.{0,28}dowod|udowodnil).{0,70}/.test(a))return false;
 return true;
}
function rewrite(c,old,next,kind){
 const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id];
 const last=m.semantic.at(-1),st=m.statements.at(-1);
 if(last.answer!==old||st.text!==old||last.source_ids?.length||st.source_ids?.length)return false;
 last.answer=next;st.text=next;last.topic=kind;st.topic=kind;
 const replace=(obj,key,max)=>{if(obj&&obj[key]===old.slice(0,max))obj[key]=next.slice(0,max);};
 const replaceNorm=(obj,key,max)=>{if(obj&&obj[key]===plain(old).slice(0,max))obj[key]=plain(next).slice(0,max);};
 replaceNorm(s.recent?.at(-1),'answer',1550);
 replace(s.npc5?.recent?.at(-1),'answer',1400);replace(s.npc5?.anchor,'answer',1400);
 replace(s.npc57?.episodes?.at(-1),'answer',1600);
 replace(s.npc65?.recent?.at(-1),'answer',1300);replace(s.npc65,'lastAnswer',1300);
 replace(s.npc68?.threads?.at(-1),'a',850);replace(s.npc89?.recent?.at(-1),'a',1200);replace(s.npc62,'a',1600);
 if(m.topics?.length)m.topics[m.topics.length-1]=kind;
 if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic:kind,focus:'relevance-6.25'};
 return true;
}
function select(c,kind,question){
 const texts=profiles[c.id]?.[kind];if(!texts?.length)return null;
 // Rozmaitość nie jest losowa: zależy od świadka, sformułowania pytania i już
 // wypowiedzianych kwestii. Dzięki temu działa offline i po imporcie zapisu.
 const history=(NPC9_MEMORY[c.id]?.statements||[]).slice(-12).map(x=>plain(x.text));
 let seed=0;for(const letter of c.id+'|'+plain(question))seed=(Math.imul(seed,33)+letter.charCodeAt(0))|0;
 let idx=(seed>>>0)%texts.length;
 for(let i=0;i<texts.length;i++){
  const candidate=texts[(idx+i)%texts.length];
  if(!history.some(x=>x===plain(candidate)))return candidate;
 }
 return texts[(idx+(NPC9_MEMORY[c.id]?.turn||0))%texts.length];
}
registerWitnessAnswerLayer('82-relevance-and-voice-625',function(c,question,attached){
 const oldConfronted=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
 const plan=window.PS633_INTENT?.analyzeQuestion(question);
 const kind=plan && (plan.sensitive||plan.slots.compound||
  ['self_alibi','alarm_report','last_contact','workshop_missing_entry','bhp_sent','test_authorization'].includes(plan.primary))?null:detect(question);
 const answer=before(c,question,attached);
 if(!kind||!profiles[c?.id]||!permitted(c,answer,attached,oldConfronted)||!isOffTopic(kind,answer))return answer;
 const picked=select(c,kind,question);
 if(!picked||picked===answer||!rewrite(c,answer,picked,kind))return answer;
 window.PS625_LAST={id:c.id,topic:kind,changed:true};return picked;
});
window.PS625_RELEVANCE=Object.freeze({detect,labels,version:'6.25',last:()=>window.PS625_LAST||null});
})();
/* 6.33 — one deterministic local scope, shared with Vercel.
 * Uses the single shared intent plan for conservative, source-grounded OFFLINE corrections.
 * It uses previously public witness facts. Confrontations, attached exhibits,
 * procedural refusals and server AI responses remain untouched.
 */
(function(){
 'use strict';
 if(typeof WitnessEngine==='undefined'||typeof NPC94_FACTS==='undefined'||typeof NPC9_MEMORY==='undefined')return;
 const previous=WitnessEngine.snapshotAnswer();
 const fold=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9: -]+/g,' ').replace(/\s+/g,' ').trim();
 const PROTECTED=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL']);
 // Only one parser decides the active intention. No parallel scope regexes.
 function classify(id,raw){
  const p=window.PS633_INTENT.analyzeQuestion(raw);
  if(!p.positiveQuestion||p.sensitive||p.inputLooksLikeInstruction)return null;
  if(p.slots.compound&&!(p.primary==='self_departure'&&p.intents.every(x=>['self_departure','person'].includes(x))))return null;
  if(!NPC94_FACTS[id])return null;
  const allowed={JANUSZ:['workshop_missing_entry','self_alibi'],ELZBIETA:['bhp_sent','bhp_hazard','last_contact','self_alibi'],
   KAMIL:['test_authorization','account_identity','self_alibi'],TOMASZ:['self_alibi','alarm_report'],
   MAREK:['self_alibi','self_departure'],MAGDALENA:['self_alibi']};
  return (Array.isArray(allowed[id])?allowed[id].includes(p.primary):allowed[id]===p.primary)?p.primary:null;
 }
 const activeQuestion=input=>window.PS633_INTENT.analyzeQuestion(input).positiveQuestion;
 function reply(c,kind){
  const f=NPC94_FACTS[c.id];
  if(kind==='workshop_missing_entry')return 'Nie wiem, dlaczego tego wpisu brakuje. '+f.verify+' '+f.responsibility;
  if(kind==='bhp_sent')return 'Nie mogę potwierdzić, że zgłoszenie BHP zostało wysłane. '+f.verify;
  if(kind==='test_authorization')return 'Autoryzację testu trzeba sprawdzić w dokumentacji zgody na test, zestawiając numer sesji z surowymi logami. Sam wpis techniczny nie potwierdza, kto fizycznie był przy urządzeniu.';
  if(kind==='self_departure')return 'Wychodziłem z biura w sprawach służbowych. Nie wskażę z pamięci wszystkich miejsc ani osób, które mogły mnie wtedy widzieć. Trzeba porównać rejestr wejść i połączenia.';
  if(kind==='bhp_hazard')return 'Lena mówiła mi o ryzyku związanym z TW-217. Rozmawiałyśmy o tym o 21:47. Szczegóły zgłoszenia i jego obieg trzeba sprawdzić w dokumentach.';
  if(kind==='last_contact')return f.last+' '+f.time;
  if(kind==='account_identity')return 'Użycie konta lub aktywna sesja potwierdzają zapis systemowy, a nie fizyczną obecność konkretnego człowieka. To trzeba zweryfikować niezależnym źródłem.';
  if(kind==='self_alibi')return c.id==='TOMASZ'?'Pracowałem w dyspozytorni. '+f.alibi:f.location+' '+f.alibi;
  if(kind==='alarm_report')return f.victim+' '+f.time;
  return '';
 }
 function rewrite(c,old,next,kind){
  const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],sem=m?.semantic?.at(-1),st=m?.statements?.at(-1);
  if(!sem||!st||sem.turn!==m.turn||st.turn!==m.turn||sem.answer!==old||st.text!==old||
     sem.source_ids?.length||st.source_ids?.length||PROTECTED.has(sem.status)||PROTECTED.has(st.status))return false;
  sem.answer=next;sem.topic=kind;sem.focus='unified-intent-6.33';st.text=next;st.topic=kind;
  if(m.topics?.length)m.topics[m.topics.length-1]=kind;
  if(m.lastFocus)m.lastFocus={...m.lastFocus,topic:kind,focus:'unified-intent-6.33'};
  const replace=(obj,key,len)=>{if(obj?.[key]===old.slice(0,len))obj[key]=next.slice(0,len);};
  const replaceNorm=(obj,key,len)=>{if(obj?.[key]===fold(old).slice(0,len))obj[key]=fold(next).slice(0,len);};
  replaceNorm(s.recent?.at(-1),'answer',1550);replace(s.npc5?.recent?.at(-1),'answer',1400);
  replace(s.npc5?.anchor,'answer',1400);replace(s.npc57?.episodes?.at(-1),'answer',1600);
  replace(s.npc65?.recent?.at(-1),'answer',1300);replace(s.npc65,'lastAnswer',1300);
  replace(s.npc68?.threads?.at(-1),'a',850);replace(s.npc89?.recent?.at(-1),'a',1200);replace(s.npc62,'a',1600);
  return true;
 }
 registerWitnessAnswerLayer('85-unified-question-routing-633',function(c,question,attached){
  const kind=c?classify(c.id,question):null;
  const confronted=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const old=previous(c,question,attached);
  if(!kind||!c||attached||simWitness(c).blocked||
      (NPC9_MEMORY[c.id]?.confronted?.length||0)!==confronted)return old;
  const next=reply(c,kind);
  if(!next||next===old||!rewrite(c,old,next,kind))return old;
  window.PS633_LAST={id:c.id,kind,changed:true};
  return next;
 });
 window.PS633_SCOPE=Object.freeze({classify,activeQuestion,version:'6.33'});
 window.PS632_SCOPE=window.PS633_SCOPE; // read-only compatibility facade for old QA tools
 window.PS626_INTENT=Object.freeze({focus:q=>{const k=window.PS633_INTENT.analyzeQuestion(q).primary;
  return ['self_alibi','alarm_report'].includes(k)?k:null;},
  relevant:(kind,text)=>kind==='self_alibi'?/(?:alibi|dyzur|biur|prac|obecnos|przebyw|miejsce|dyspozytor)/.test(fold(text)):
   kind==='alarm_report'?/(?:alarm|zglosz|02:02|znalaz|znalezien)/.test(fold(text)):true,version:'6.33'});
})();
/* RC7 — advisory specialist AI panels. No game rule, evidence or verdict mutation. */
(()=>{'use strict';
 const labs={tcms:'TCMS / TW-217',msg:'Logi wiadomości',cctv:'Monitoring',forensic:'Ślady i próbki',access:'Dostęp i przejścia'};
 const $=id=>document.getElementById(id);
 const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const warn=(panel,msg)=>{panel.replaceChildren(make('p',msg));};
 const addLab=()=>{
  const root=$('ux5Hub')||$('labs');if(!root||root.querySelector('#psR7LabAI'))return;
  const section=make('section');section.id='psR7LabAI';section.className='notice';
  const head=make('h3','Notatka techniczna');
  const hint=make('p','Model komentuje wyłącznie zatwierdzone źródła. Nie tworzy nowych pomiarów ani nie zalicza zadań.');hint.className='small muted';
  const select=make('select');select.setAttribute('aria-label','Pracownia do analizy');
  for(const [key,value] of Object.entries(labs)){const option=make('option',value);option.value=key;select.append(option);}
  const button=make('button','Przygotuj notatkę');button.type='button';button.className='btn alt';
  const result=make('div');result.id='psR7LabResult';result.setAttribute('role','status');result.style.cssText='white-space:pre-wrap;line-height:1.6;margin-top:12px';
  section.append(head,hint,select,button,result);root.append(section);
  button.addEventListener('click',async()=>{
   button.disabled=true;warn(result,'Analizowanie zatwierdzonych materiałów…');
   try{
    const response=await fetch('/api/lab-narrative',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:JSON.stringify({lab:select.value})});
    const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data?.error==='lab_prerequisites_missing'?'Najpierw pozyskaj dokumenty potrzebne do tej pracowni.':'Notatka AI jest chwilowo niedostępna. Spróbuj ponownie.');
    const a=data.note||{};const text=[a.summary, ...(a.findings||[]).map(x=>'• '+x.text+' [źródło: '+x.sourceId+']'),a.limitations?'Ograniczenia: '+a.limitations:'',a.journalEntry?'Wpis do dziennika (propozycja): '+a.journalEntry:''].filter(Boolean).join('\n\n');
    result.textContent=text||'Brak zatwierdzonych ustaleń.';
   }catch(e){warn(result,e.message||'Nie udało się połączyć z laboratorium AI.');}
   finally{button.disabled=false;}
  });
 };
 const addDefense=()=>{
  const root=$('ps54Hearing');if(!root||root.querySelector('#psR7DefenseAI')||!STATE?.final13?.submitted)return;
  const section=make('section');section.id='psR7DefenseAI';section.className='notice';
  const head=make('h3','Argumenty obrony');
  const hint=make('p','Sześć dodatkowych zarzutów do zatwierdzonego aktu. Opinia AI nie zmienia werdyktu ani wyniku procedury.');hint.className='small muted';
  const button=make('button','Wygeneruj 6 zarzutów obrony');button.type='button';button.className='btn alt';
  const result=make('div');result.setAttribute('role','status');result.style.cssText='white-space:pre-wrap;line-height:1.6;margin-top:12px';
  section.append(head,hint,button,result);root.append(section);
  button.addEventListener('click',async()=>{
   button.disabled=true;warn(result,'Obrona analizuje akt oskarżenia…');
   try{
    const response=await fetch('/api/defense-objections',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:'{}'});
    const data=await response.json();
    if(!response.ok||data.ok!==true)throw Error(data?.error==='indictment_not_approved'?'Poczekaj na zatwierdzenie aktu oskarżenia na serwerze.':'Nie udało się przygotować argumentów obrony. Spróbuj ponownie później.');
    result.replaceChildren();
    for(const [i,item] of data.objections.entries()){
     const el=make('p',(i+1)+'. '+item.title+'\n'+item.argument+'\nŹródło: '+item.sourceId+'\nPytanie obrony: '+item.question);
     result.append(el);
    }
   }catch(e){warn(result,e.message||'Obrona AI jest niedostępna.');}
   finally{button.disabled=false;}
  });
 };
 const mount=()=>{addLab();addDefense();};
 const root=document.body;
 if(root){let pending=false;const observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;mount();});}});observer.observe(root,{childList:true,subtree:true});mount();}
})();
/* RC35: private two-player shared-screen mode. One controller, one viewer.
 * Vercel receives a locally generated UI snapshot only for mirroring.
 * All evidence and verdict authorization remains with the original server rules.
 */
(()=>{
 'use strict';
 if(!window.PS_SAVE_MANAGER||!window.PS_COOP_VIEW)return;
 const endpoint='/api/coop';
 const safe=s=>String(s||'').slice(0,180);
 let active=false,connecting=true,controller=false,owner=false,players=0,version=0,code='',busy=false,applying=false,dirty=false,lastPublish=0;
 let nextPoll=0,formOpen=false,formValue='',pendingOps=false,taking=false;
 let lastRenderKey='';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const root=el('aside','ps-coop-bar');root.setAttribute('aria-label','Wspólna gra dwóch śledczych');
 const toolbar=el('div','ps-coop-toolbar');root.appendChild(toolbar);
 // RC35.2: the existing document capture guards restrict the observer.
 // A full-screen shield would also cover the in-flow chat/room controls.
 // RC35.2: mount the controls INSIDE the normal layout, below the sticky header.
 // They now reserve their own space instead of hiding navigation and game panels.
 const main=document.querySelector('.layout > .main');
 const content=main?.querySelector('#mainContent');
 if(main&&content){main.insertBefore(root,content);}else{document.body.prepend(root);}
 
 const label=el('span','ps-coop-info');const actions=el('div','ps-coop-actions');const message=el('span','ps-coop-message');
 toolbar.append(label,actions,message);
 const button=(text,callback,secondary=false)=>{const b=el('button',secondary?'ps-coop-btn secondary':'ps-coop-btn',text);b.type='button';b.addEventListener('click',callback);return b;};
 let controlStatus;
 const notify=(text)=>{message.textContent=text;if(controlStatus)controlStatus.textContent=text;};
 const chatUuid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,x=>{const n=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (x==='x'?n:(n&3)|8).toString(16);});
 // RC35.1: private, token-free player chat, fully separate from game/AI history.
 // RC35.5: persistent bottom dock, separate from the page-top room/join controls.
 // It never becomes part of the mirrored gameplay snapshot.
 const bottomDock=el('div','ps-coop-bottom-dock');bottomDock.hidden=true;
 const controlDock=el('div','ps-coop-control-dock');
 const controlInfo=el('span','ps-coop-control-info');
 const controlActions=el('div','ps-coop-control-actions');
 controlStatus=el('span','ps-coop-control-status');controlStatus.setAttribute('role','status');
 controlDock.append(controlInfo,controlActions,controlStatus);
 const chatDock=el('div','ps-coop-chat-dock');
 const chatDockToggle=button('Czat graczy',showChat,true);chatDockToggle.classList.add('ps-coop-chat-toggle');
 chatDockToggle.setAttribute('aria-controls','ps-coop-chat-panel');
 chatDock.append(chatDockToggle);
 bottomDock.append(controlDock,chatDock);document.body.append(bottomDock);
 const chatPanel=el('section','ps-coop-chat-panel');chatPanel.hidden=true;chatPanel.id='ps-coop-chat-panel';
 const chatTitle=el('div','ps-coop-chat-title','Rozmowa graczy · tylko dla tego pokoju');
 const chatItems=el('div','ps-coop-chat-items');chatItems.setAttribute('role','log');chatItems.setAttribute('aria-live','polite');
 const chatStatus=el('div','ps-coop-chat-status');chatStatus.setAttribute('role','status');
 const chatForm=el('form','ps-coop-chat-form');
 const chatField=el('textarea','ps-coop-chat-input');chatField.setAttribute('aria-label','Wiadomość do drugiego gracza');
 chatField.placeholder='Napisz do drugiego śledczego…';chatField.maxLength=600;chatField.rows=2;
 const chatSend=el('button','ps-coop-btn','Wyślij');chatSend.type='submit';
 chatForm.append(chatField,chatSend);chatPanel.append(chatTitle,chatItems,chatStatus,chatForm);chatDock.insertBefore(chatPanel,chatDockToggle);
 let chatOpen=false,chatBusy=false,chatSending=false,lastChatId=0,chatUnread=0,chatIds=new Set();
 function resetChat(){lastChatId=0;chatUnread=0;chatIds.clear();chatItems.replaceChildren();chatStatus.textContent='';}
 function showChat(){chatOpen=!chatOpen;chatPanel.hidden=!active||!chatOpen;if(chatOpen){chatUnread=0;chatItems.scrollTop=chatItems.scrollHeight;chatField.focus();void pollChat();}lastRenderKey='';redraw();}
 function addChatRow(m){
  if(!m||!Number.isSafeInteger(m.id)||m.id<=0||chatIds.has(m.id)||typeof m.text!=='string')return;
  chatIds.add(m.id);if(chatIds.size>240){const old=chatIds.values().next().value;chatIds.delete(old);}
  lastChatId=Math.max(lastChatId,m.id);
  const nearBottom=chatItems.scrollHeight-chatItems.scrollTop-chatItems.clientHeight<65;
  const row=el('div','ps-coop-chat-row'+(m.own?' mine':''));
  const meta=el('div','ps-coop-chat-meta',(m.author==='Gospodarz'?'Gospodarz':'Gość')+' · '+new Date(m.createdAt).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}));
  const content=el('div','ps-coop-chat-text',m.text);row.append(meta,content);chatItems.append(row);
  while(chatItems.children.length>150)chatItems.firstChild.remove();
  if(nearBottom||chatItems.children.length===1)chatItems.scrollTop=chatItems.scrollHeight;
  if(!m.own&&!chatOpen)chatUnread=Math.min(99,chatUnread+1);
 }
 async function pollChat(){
  if(!active||chatBusy)return;chatBusy=true;
  try{const response=await fetch('/api/coop-chat?after='+lastChatId,{credentials:'same-origin',cache:'no-store'});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok)throw Error(data?.error||'chat_offline');
   (data.messages||[]).forEach(addChatRow);chatStatus.textContent='';
   if(!chatOpen&&data.messages?.length){lastRenderKey='';redraw();}
  }catch(err){chatStatus.textContent=err.message==='chat_storage_unavailable'?'Czat wymaga migracji SQL 005 lub połączenia z bazą.':'Nie można odświeżyć czatu.';}
  finally{chatBusy=false;}
 }
 async function sendChat(event){
  event.preventDefault();if(!active||chatSending)return;
  const text=chatField.value.trim();if(!text||text.length>600)return;
  chatSending=true;chatSend.disabled=true;chatStatus.textContent='Wysyłanie…';
  try{const response=await fetch('/api/coop-chat',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-PS-Client':'game'},
    body:JSON.stringify({clientId:chatUuid(),text})});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok)throw Error(data?.error||'chat_offline');
   chatField.value='';addChatRow(data.message);chatStatus.textContent='';
  }catch(err){chatStatus.textContent=err.message==='chat_rate_limited'?'Wiadomości wysyłane zbyt szybko. Spróbuj za chwilę.':'Nie wysłano wiadomości — ponów próbę.';}
  finally{chatSending=false;chatSend.disabled=false;chatField.focus();}
 }
 chatForm.addEventListener('submit',sendChat);
 chatField.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();chatForm.requestSubmit();}});
 function redraw(){
  document.body.classList.toggle('ps-coop-observer',active&&!controller);
  document.body.classList.toggle('ps-coop-chat-open',active&&chatOpen);
  const key=[active,connecting,controller,owner,players,code,chatOpen,chatUnread,formOpen].join('|');
  if(key===lastRenderKey)return;
  lastRenderKey=key;
  toolbar.classList.toggle('ps-coop-active',active);
  bottomDock.hidden=!active;controlDock.hidden=!active;
  controlInfo.textContent=players===1?'Pokój: oczekiwanie na drugiego gracza':controller?'Sterujesz wspólną grą':'Steruje drugi gracz';
  controlActions.replaceChildren();
  if(active)controlActions.append(button('Kopia zapisu',downloadRoomBackup,true));
  if(active)controlActions.append(button('Uzgodnienia',()=>document.getElementById('ps39Panel')?.scrollIntoView({block:'center',behavior:'smooth'}),true));
  if(!controller&&active){const takeBtn=button(taking?'Przejmowanie…':'Przejmij sterowanie',take);takeBtn.disabled=taking;takeBtn.classList.add('ps-coop-take-action');controlActions.append(takeBtn);}
  chatDockToggle.textContent='Czat graczy'+(chatUnread?' ('+chatUnread+')':'')+(chatOpen?' ▲':' ▼');
  chatDockToggle.setAttribute('aria-expanded',String(chatOpen));
  label.textContent=connecting?'Pokój: sprawdzanie…':active?`Wspólna gra · ${players}/2 · ${controller?'sterujesz':'oglądasz ekran'}`:'Wspólna gra (2 osoby)';
  actions.replaceChildren();
  if(!active){actions.append(button('Utwórz pokój',create),button('Dołącz',()=>{formOpen=!formOpen;redraw();},true));}
  else{
   // Chat and takeover live in persistent bottom controls.
   if(code&&owner)actions.append(button('Kod: '+code,()=>navigator.clipboard?.writeText(code).then(()=>notify('Kod skopiowany')).catch(()=>notify('Kod: '+code)),true));
   // The bottom dock is the single visible controller switch.
   actions.append(button(owner?'Zamknij pokój':'Opuść pokój',leave,true));
  }
  chatPanel.hidden=!active||!chatOpen;
  const old=root.querySelector('.ps-coop-join');old?.remove();
  if(!active&&formOpen){const form=el('form','ps-coop-join');const field=el('input','ps-coop-input');field.setAttribute('aria-label','Kod pokoju');field.placeholder='9-znakowy kod';field.maxLength=14;field.required=true;field.value=formValue;
   field.addEventListener('input',()=>{formValue=field.value.toUpperCase();});
   form.append(field,button('Połącz',()=>{},false));const submit=form.querySelector('button');submit.type='submit';submit.replaceWith(submit);
   form.addEventListener('submit',ev=>{ev.preventDefault();formValue=field.value;join();});root.appendChild(form);
  }
 }
 // RC35.6: Postgres jsonb reorders keys of nested objects. SaveManager's legacy
 // checksum uses JSON.stringify insertion order. Keep the *exact serialized*
 // signed save as an opaque string inside the room JSONB; do not disable checks.
 function frame(){return {saveJson:JSON.stringify(window.PS_SAVE_MANAGER.build()),view:window.PS_COOP_VIEW.capture()};}
 function snapshotFromFrame(shared){
  if(typeof shared?.saveJson==='string'&&shared.saveJson.length<1700000){
   const parsed=JSON.parse(shared.saveJson);
   window.PS_SAVE_MANAGER.verify(parsed);
   return parsed;
  }
  if(shared?.save&&typeof shared.save==='object'){
   // Legacy RC35.5 frames already stored as JSONB cannot be verified reliably.
   // Never re-sign or bypass a failed checksum on the observing client.
   window.PS_SAVE_MANAGER.verify(shared.save);
   return shared.save;
  }
  throw Error('Brak poprawnej migawki wspólnej gry.');
 }
 function applyRoomFrame(shared){
  const save=snapshotFromFrame(shared);
  window.PS_SAVE_MANAGER.apply(save);
  window.PS_COOP_VIEW.apply(shared.view);
 }
 async function call(action,fields={}){
  const res=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:JSON.stringify({action,...fields})});
  const data=await res.json().catch(()=>({ok:false,error:'invalid_response'}));
  if(!res.ok||!data.ok){const e=Error(safe(data.error||'HTTP '+res.status));e.status=res.status;throw e;}
  return data;
 }
 function accept(data){
  if(!data?.ok)return;
  const wasController=controller,wasActive=active;
  const incomingVersion=Number(data.version)||0;
  // Out-of-order polling must not revoke control that was just transferred.
  if(wasActive&&incomingVersion<version)return;
  active=true;controller=!!data.controller;owner=!!data.owner;players=data.players||1;
  const changed=incomingVersion!==version;version=incomingVersion;
  if(!controller&&changed&&(data.frame?.saveJson||data.frame?.save)&&!applying){
   applying=true;
   try{applyRoomFrame(data.frame);dirty=false;notify('');}
   catch(err){notify(data.frame?.save&&!data.frame?.saveJson?
    'Starszy format migawki pokoju: osoba sterująca powinna opublikować nową aktualizację.':
    'Nie udało się odświeżyć widoku współpracy. Spróbuj ponownie.');}
   finally{applying=false;}
  }
  if(!wasController&&controller&&(data.frame?.saveJson||data.frame?.save)){
   // Do not overwrite the last controller's progress on a control handoff.
   applying=true;
   try{applyRoomFrame(data.frame);notify('');}
   catch(error){notify('Sterowanie przekazano. Odśwież widok współpracy.');dirty=true;}
   finally{applying=false;}
  }
  // Recover an already-open room created on RC35.5: the *current controller*
  // republishes a fresh signed JSON string. Observers must never re-sign it.
  if(controller&&data.frame?.save&&!data.frame?.saveJson)dirty=true;
  if(!wasActive){resetChat();void pollChat();}
  redraw();
 }
 async function create(){
  if(busy)return;busy=true;notify('Tworzenie pokoju…');
  try{const data=await call('create',{frame:frame()});code=data.code;
   try{localStorage.setItem('ps-coop-owner-code',code);}catch{}
   window.PS617_SYNC?.coopJoined?.();accept(data);dirty=false;notify('Wyślij kod drugiej osobie.');}
  catch(err){
   const messages={
    coop_rooms_table_missing_or_cache_stale:'Nie znaleziono tabeli pokoi w Supabase. Uruchom SQL 004 i odśwież schemat bazy.',
    game_sessions_table_missing_or_cache_stale:'Nie znaleziono tabeli sesji gry. Sprawdź migrację SQL 001.',
    coop_rooms_permission_denied:'Brak uprawnień serwera do tabeli pokoi. Sprawdź klucz service_role w Vercel.',
    supabase_not_configured:'Brak konfiguracji Supabase lub sekretu sesji w Vercel.',
    coop_session_commit_failed:'Nie zatwierdzono nowej sesji gry. Sprawdź funkcję ps_commit_session w Supabase.'
   };
   notify(messages[err.message]||'Nie udało się utworzyć pokoju. Spróbuj ponownie.');
  }finally{busy=false;}
 }
 async function join(){
  if(busy)return;busy=true;notify('Dołączanie…');
  try{const data=await call('join',{code:formValue});
   formOpen=false;window.PS617_SYNC?.coopJoined?.();accept(data);notify('Dołączono do wspólnego śledztwa.');}
  catch(err){notify('Nie udało się dołączyć do pokoju. Sprawdź kod i spróbuj ponownie.');}finally{busy=false;}
 }
 async function take(){
  if(!active||controller||taking)return;
  taking=true;lastRenderKey='';redraw();notify('Przejmowanie sterowania…');
  try{
   // Manual control actions must not silently disappear while a background poll runs.
   for(let attempt=0;attempt<4;attempt++){
    try{
     const data=await call('take');accept(data);dirty=false;
     notify('Sterowanie zostało przekazane. Możesz działać.');return;
    }catch(error){
     if(error.status===423){notify('Trwa odpowiedź AI. Przejmowanie będzie dostępne po jej zakończeniu.');return;}
     if(error.status!==409||attempt===3)throw error;
     await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));
    }
   }
  }catch(error){notify('Nie udało się przejąć sterowania. Spróbuj ponownie.');}
  finally{taking=false;lastRenderKey='';redraw();}
 }
 // RC36: only a verified SERVER room snapshot is eligible for a backup.
 // A room owner closing the session must not silently lose durable progress.
 async function downloadRoomBackup(){
  if(!active)return false;
  try{
   const response=await fetch(endpoint+'?since=-1',{credentials:'same-origin',cache:'no-store'});
   const result=await response.json();
   if(!response.ok||!result?.ok||!result.frame)throw Error('Pokój nie zwrócił aktualnej migawki.');
   const save=snapshotFromFrame(result.frame);
   const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json;charset=utf-8'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.download='Prawdziwe_Sledztwo_Kopia_Pokoju_'+new Date().toISOString().slice(0,10)+'.json';
   link.href=url;document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   notify('Pobrano sprawdzoną kopię wspólnego zapisu.');return true;
  }catch(error){notify('Nie udało się pobrać kopii pokoju. Sprawdź połączenie i spróbuj ponownie.');return false;}
 }
 async function leave(){
  if(busy||!confirm(owner?'Zamknąć pokój dla obojga graczy?':'Opuścić wspólną grę?'))return;
  if(owner&&!await downloadRoomBackup()){notify('Nie zamknięto pokoju: najpierw zapisz kopię.');return;}
  busy=true;try{await call('leave');try{localStorage.removeItem('ps-coop-owner-code');}catch{}location.reload();}
  catch(err){notify('Nie udało się opuścić pokoju. Spróbuj ponownie.');busy=false;}
 }
 async function publish(){
  if(!navigator.onLine||!active||!controller||busy||applying||!dirty||Date.now()-lastPublish<850)return;
  busy=true;
  try{const data=await call('frame',{version,frame:frame()});accept(data);dirty=false;lastPublish=Date.now();}
  catch(err){
   if(err.status===409){
    // Joining changes the room revision too. Keep local changes; refresh the
    // revision and publish in the next cycle iff control is still ours.
    dirty=true;pendingOps=true;
   }else if(err.status===423){dirty=false;pendingOps=true;}
   else notify('Synchronizacja jest opóźniona. Sprawdź połączenie.');
  }finally{busy=false;}
  if(pendingOps){pendingOps=false;await refresh();}
 }
 async function refresh(){
  if(connecting||!active||busy||applying)return;
  busy=true;
  try{const response=await fetch(endpoint+'?since='+version,{credentials:'same-origin',cache:'no-store'});
   const data=await response.json().catch(()=>null);
   if(response.status===401||response.status===403||response.status===404){active=false;controller=false;dirty=false;document.body.classList.remove('ps-coop-observer');notify('Pokój zamknięty. Odśwież stronę.');redraw();return;}
   if(data?.ok)accept(data);else notify('Serwer pokoju chwilowo niedostępny.');
  }catch{notify('Trwa oczekiwanie na połączenie…');}finally{busy=false;}
 }
 async function beforeInterview(){
  if(!active)return true;
  if(!navigator.onLine||!controller)return false;
  dirty=true;
  for(let i=0;i<4&&controller;i++){
   if(busy||Date.now()-lastPublish<900){
    await new Promise(resolve=>setTimeout(resolve,Math.max(180,920-(Date.now()-lastPublish))));
   }
   await publish();
   if(!dirty)return true;
  }
  return false;
 }
 const mark=()=>{if(active&&controller&&!applying)dirty=true;};
 // In a shared session new-game resets and JSON imports require closing the
 // room first. Never silently reset the durable shared game for both players.
 document.addEventListener('click',event=>{
  if(!active||root.contains(event.target))return;
  if(event.target.closest?.('#resetBtn,#loadBtn,#loadFile')){
   event.preventDefault();event.stopImmediatePropagation();
   notify('Aby rozpocząć nową grę lub wczytać inny zapis, najpierw zamknij pokój.');
  }
 },true);
 // Prevent spectator-origin gameplay mutations, including hidden form submits.
 for(const type of ['click','pointerdown','keydown','input','change','submit']){
  document.addEventListener(type,event=>{
   if(!active||controller||root.contains(event.target)||bottomDock.contains(event.target))return;
   if(type==='keydown'&&['Tab','Escape','Shift','Control','Alt','Meta'].includes(event.key))return;
   event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
  },true);
 }
 for(const type of ['click','input','change','keyup'])document.addEventListener(type,event=>{if(root.contains(event.target)||bottomDock.contains(event.target))return;mark();},true);
 window.addEventListener('online',()=>{if(!connecting){notify('Przywracanie połączenia z pokojem…');void refresh();}});
 window.addEventListener('offline',()=>{if(active)notify('Połączenie przerwane. Gra zachowa obecny widok; nie zatwierdzaj zmian przed powrotem sieci.');});
 window.addEventListener('scroll',mark,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)refresh();});
 // Existing navigation and post-AI rendering pass through these named hooks.
 if(typeof registerNavigationHook==='function')registerNavigationHook({name:'rc35-coop-navigation',after:mark});
 const pull=async()=>{
  try{
   const response=await fetch(endpoint+'?since='+version,{credentials:'same-origin',cache:'no-store'});
   if(response.ok){const data=await response.json();
    if(data.ok){if(data.owner){try{code=localStorage.getItem('ps-coop-owner-code')||'';}catch{}}
     window.PS617_SYNC?.coopJoined?.();accept(data);notify('Połączono z pokojem.');}
   }
  }catch{notify('Pokoje niedostępne. Możesz grać samodzielnie.');}
  finally{connecting=false;redraw();window.PS617_SYNC?.retry?.();}
 };
 window.PS_COOP=Object.freeze({get active(){return active;},get controller(){return controller;},get connecting(){return connecting;},get online(){return navigator.onLine;},mountRoomPanel:node=>root.append(node),get dirty(){return dirty;},get busy(){return busy;},mark,flush:publish,refresh,beforeInterview});
 redraw();pull();
 setInterval(()=>{if(document.hidden||connecting)return;if(!busy&&active){if(controller&&dirty)publish();else refresh();}},1500);
 setInterval(()=>{if(active&&!document.hidden&&chatOpen)void pollChat();},2000);
 setInterval(()=>{if(active&&!document.hidden&&!chatOpen)void pollChat();},6500);
})();
/* RC35.3: show guidance controls inline on mobile; never use a floating helper. */
(()=>{
 'use strict';
 const tools=document.getElementById('ps76Tools');
 const sidebar=document.getElementById('ui14Sidebar');
 const main=document.querySelector('.main');
 if(!tools||!sidebar||!main)return;
 const move=()=>{
  if(window.innerWidth<=1000){
   const coop=main.querySelector('.ps-coop-bar');
   const anchor=coop||main.querySelector('.topbar');
   if(anchor&&tools.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',tools);
   tools.classList.add('ps353-mobile-tools');
  }else{
   if(tools.parentElement!==sidebar)sidebar.append(tools);
   tools.classList.remove('ps353-mobile-tools');
  }
 };
 move();
 window.addEventListener('resize',move,{passive:true});
})();
/* RC38: player-authored connections, NOT new story evidence or facts. */
(()=>{
 'use strict';
 const host=document.getElementById('notebook');if(!host||typeof registerSaveHook!=='function')return;
 const panel=document.createElement('section');panel.id='ps38Board';panel.className='ps38-board surface padded';
 const title=document.createElement('h3');title.textContent='Tablica śledcza 2.0';
 const note=document.createElement('p');note.textContent='Łącz wyłącznie odkryte dokumenty i zapisuj własne hipotezy. Sprzeczność jest oznaczeniem gracza, nie ustalonym faktem.';
 const form=document.createElement('form');form.className='ps38-form';
 const from=document.createElement('select'),to=document.createElement('select');
 from.setAttribute('aria-label','Pierwszy dokument');to.setAttribute('aria-label','Drugi dokument');
 const kind=document.createElement('select');kind.setAttribute('aria-label','Rodzaj powiązania');
 [['link','Powiązanie'],['conflict','Podejrzana sprzeczność'],['verify','Do sprawdzenia']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;kind.append(o);});
 const comment=document.createElement('textarea');comment.rows=2;comment.maxLength=450;comment.placeholder='Dlaczego łączysz te materiały? (własna hipoteza)';comment.setAttribute('aria-label','Uzasadnienie hipotezy');
 const add=document.createElement('button');add.className='btn alt';add.type='submit';add.textContent='Dodaj do tablicy';
 form.append(from,to,kind,comment,add);
 const list=document.createElement('div');list.className='ps38-connections';list.setAttribute('aria-live','polite');
 panel.append(title,note,form,list);host.append(panel);
 const allowed=new Set(['link','conflict','verify']);let entries=[];
 const plain=e=>e&&typeof e==='object'&&typeof e.a==='string'&&typeof e.b==='string'&&e.a!==e.b&&byId[e.a]&&byId[e.b]&&allowed.has(e.kind)&&typeof e.note==='string';
 const name=id=>String(byId[id]?.title||byId[id]?.name||id).slice(0,100);
 function options(){const valid=[...STATE.found].filter(id=>byId[id]).sort();
  for(const sel of [from,to]){
   const selected=sel.value;sel.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Wybierz odkryty dokument';sel.append(empty);
   for(const id of valid){const o=document.createElement('option');o.value=id;o.textContent=name(id);sel.append(o);}
   sel.value=valid.includes(selected)?selected:'';
  }
  add.disabled=valid.length<2;
 }
 function render(){options();list.replaceChildren();
  const visible=entries.filter(e=>STATE.found.has(e.a)&&STATE.found.has(e.b));
  if(!visible.length){const empty=document.createElement('p');empty.textContent='Nie dodano jeszcze powiązań. Wybierz dwa odkryte dokumenty.';list.append(empty);return;}
  for(const [i,e] of visible.entries()){
   const row=document.createElement('article');row.className='ps38-connection';
   const heading=document.createElement('strong');heading.textContent=(e.kind==='conflict'?'SPRZECZNOŚĆ DO WERYFIKACJI':e.kind==='verify'?'DO SPRAWDZENIA':'POWIĄZANIE')+' · '+name(e.a)+' / '+name(e.b);
   const p=document.createElement('p');p.textContent=e.note||'Bez opisu';
   const b=document.createElement('button');b.type='button';b.className='btn subtle';b.textContent='Usuń';b.addEventListener('click',()=>{if(window.PS_COOP?.active&&!window.PS_COOP.controller)return;entries.splice(entries.indexOf(e),1);render();window.PS_COOP?.mark?.();});
   row.append(heading,p,b);list.append(row);
  }
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();if(window.PS_COOP?.active&&!window.PS_COOP.controller)return;
  if(!STATE.found.has(from.value)||!STATE.found.has(to.value)||from.value===to.value||entries.length>=80)return;
  entries.push({a:from.value,b:to.value,kind:kind.value,note:comment.value.trim().slice(0,450)});
  comment.value='';render();window.PS_COOP?.mark?.();
 });
 registerSaveHook({name:'rc38-investigation-board',build(data){data.rc38Board=entries.map(e=>({...e}));},apply(data){entries=Array.isArray(data.rc38Board)?data.rc38Board.filter(plain).slice(-80).map(e=>({a:e.a,b:e.b,kind:e.kind,note:e.note.slice(0,450)})):[];render();}});
 registerNavigationHook({name:'rc38-board-navigation',after:()=>{if(STATE.tab==='notebook')render();}});
 window.PS_RC38_BOARD=Object.freeze({inspect:()=>entries.map(e=>({...e})),render});render();
})();
/* RC39: both room members can propose questions and cast advisory votes. */
(()=>{
 'use strict';const coop=window.PS_COOP;if(!coop?.mountRoomPanel)return;
 const node=(tag,cls,label)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=label;return e;};
 const host=node('section','ps39-panel');host.id='ps39Panel';host.hidden=true;
 host.append(node('h3','', 'Wspólne uzgodnienia 2.0'));
 host.append(node('p','', 'Obie osoby mogą proponować pytania i wskazywać materiały. Głosy są opiniami graczy, nie zatwierdzają werdyktu.'));
 const form=node('form','ps39-form'),kind=node('select'),input=node('input'),send=node('button','btn alt','Dodaj propozycję');
 kind.setAttribute('aria-label','Typ propozycji');
 [['question','Pytanie do świadka'],['evidence','Materiał do ponownego sprawdzenia']].forEach(([value,title])=>{const o=node('option','',title);o.value=value;kind.append(o);});
 input.maxLength=350;input.required=true;input.placeholder='Zaproponuj konkretne działanie…';input.setAttribute('aria-label','Propozycja dla drugiego gracza');
 send.type='submit';form.append(kind,input,send);
 const votes=node('div','ps39-votes');const ready=node('button','btn alt','Jestem gotowy do finału'),review=node('button','btn subtle','Chcę jeszcze sprawdzić');
 ready.type=review.type='button';votes.append(ready,review);
 const log=node('div','ps39-log');log.setAttribute('role','log');
 const status=node('small','ps39-status');host.append(form,votes,status,log);coop.mountRoomPanel(host);
 let seen=new Set(),lastId=0,polling=false,sending=false;const recent=[];
 const identifier=()=>crypto.randomUUID?crypto.randomUUID():[1e7,1e3,4e3,8e3,1e11].join('-').replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
 function render(){log.replaceChildren();const current=new Map();
  for(const m of recent)if(m.kind==='vote')current.set(m.author,m.text);
  const head=node('p','ps39-vote-summary','Głosowanie (opinia): '+['Gospodarz','Gość'].map(w=>w+': '+(current.has(w)?current.get(w)==='ready'?'gotowy':'chce sprawdzić':'brak głosu')).join('; '));
  log.append(head);
  for(const m of recent.filter(x=>x.kind!=='vote').slice(-30)){
   const p=node('p','ps39-entry',(m.author==='Gospodarz'?'Gospodarz':'Gość')+': '+(m.kind==='question'?'Pytanie — ':'Materiał — ')+m.text);log.append(p);
  }
 }
 function append(item){if(!item||!Number.isSafeInteger(item.id)||seen.has(item.id))return;seen.add(item.id);lastId=Math.max(lastId,item.id);recent.push(item);while(recent.length>75)recent.shift();render();}
 async function fetchNew(){if(polling||!coop.active)return;polling=true;
  try{const response=await fetch('/api/coop-collab?after='+lastId,{credentials:'same-origin',cache:'no-store'});const data=await response.json();
   if(!response.ok||!data.ok)throw Error('Brak dostępu do uzgodnień');
   (data.items||[]).forEach(append);status.textContent='';
  }catch{status.textContent='Uzgodnienia niedostępne. Sprawdź migrację SQL 006.';}finally{polling=false;}
 }
 async function post(kind,text){if(sending||!coop.active)return;sending=true;send.disabled=true;
  try{const response=await fetch('/api/coop-collab',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:JSON.stringify({clientId:identifier(),kind,text})});
   const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'invalid');
   append(result.item);if(kind!=='vote')input.value='';status.textContent='';
  }catch(err){status.textContent=err.message==='collab_rate_limited'?'Zbyt wiele propozycji — spróbuj za chwilę.':'Nie zapisano propozycji.';}
  finally{sending=false;send.disabled=false;}
 }
 form.addEventListener('submit',event=>{event.preventDefault();void post(kind.value,input.value.trim().slice(0,350));});
 ready.addEventListener('click',()=>void post('vote','ready'));
 review.addEventListener('click',()=>void post('vote','review'));
 setInterval(()=>{host.hidden=!coop.active;if(coop.active&&!document.hidden)void fetchNew();},2700);
})();
/* RC40: a retrospective report ONLY. No verdict alterations or evidence unlocks. */
(()=>{
 'use strict';const host=document.getElementById('final');if(!host)return;
 const panel=document.createElement('section');panel.id='ps40Epilogue';panel.className='ps40-epilogue';panel.hidden=true;
 const head=document.createElement('h3');head.textContent='Finał 4.0 · konsekwencje śledztwa';
 const summary=document.createElement('p'),weakness=document.createElement('p'),files=document.createElement('p');
 const witnessList=document.createElement('ul');
 const report=document.createElement('button');report.type='button';report.className='btn alt';report.textContent='Pobierz podsumowanie śledztwa (.txt)';
 const note=document.createElement('small');note.textContent='Retrospekcja nie zmienia orzeczenia, dowodów ani odpowiedzi świadków.';
 panel.append(head,summary,weakness,files,witnessList,report,note);host.append(panel);
 const verdicts={
  solid:['Oskarżenie utrzymane','Materiał przeszedł dotychczasowe próby kontroli, lecz nie usuwa konsekwencji błędów proceduralnych z akt.'],
  weak:['Niewystarczające ustalenia','Luki nie są dowodem winy. Zapisane hipotezy zachowują status niezweryfikowanych.'],
  acquittal:['Brak utrzymania oskarżenia','Niedostateczne powiązanie osoby, mechanizmu i źródeł ogranicza konkluzję.'],
  returned:['Akta wymagają uzupełnienia','Wyjaśnienie brakujących ogniw jest ważniejsze niż przyspieszenie decyzji.'],
  excluded:['Uchybienia proceduralne','Nieskutecznie zebrany materiał nie może zastępować poprawnego dowodzenia.'],
  miscarriage:['Ryzyko błędnego oskarżenia','Pomijanie rozbieżności i dowodów odciążających może prowadzić do krzywdzących decyzji.']
 };
 function compute(){const trial=STATE?.sim?.trial||null;if(!trial)return null;
  const kind=typeof trial.kind==='string'?trial.kind:'weak';
  const [title,warning]=verdicts[kind]||verdicts.weak;
  const rows=CONTENT.characters.map(c=>({name:c.name||c.id,turns:Math.max(0,(STATE.dialogues[c.id]||[]).filter(r=>r.role==='player').length)}));
  return {kind,title,warning,docs:STATE.found.size,rows};
 }
 function render(){const s=compute();panel.hidden=!s;if(!s)return;
  summary.textContent='Wynik istniejącej symulacji: '+s.title+'. Finał nie stanowi orzeczenia prawdziwego sądu.';
  weakness.textContent='Wnioski i granice: '+s.warning;
  files.textContent='W lokalnych aktach znajduje się '+s.docs+' odkrytych dokumentów. Sama liczba źródeł nie przesądza o winie.';
  witnessList.replaceChildren();for(const row of s.rows){const li=document.createElement('li');li.textContent=row.name+': '+row.turns+' zadanych pytań. Wypowiedzi należy konfrontować z niezależnymi źródłami.';witnessList.append(li);}
 }
 report.addEventListener('click',()=>{const s=compute();if(!s)return;
  const text=['PRAWDZIWE ŚLEDZTWO — RAPORT RETROSPEKTYWNY RC40','Wynik symulacji: '+s.title,'Granice wniosku: '+s.warning,'Odkryte dokumenty: '+s.docs,
   ...s.rows.map(r=>r.name+': '+r.turns+' pytań'),'Hipotezy i notatki nie stanowią nowych faktów ani dowodów.','Materiał ma charakter fikcyjny.'].join('\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Prawdziwe_Sledztwo_Podsumowanie_RC40.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 registerNavigationHook({name:'rc40-epilogue-report',after:()=>{if(STATE.tab==='final')render();}});
 window.PS_RC40_FINALE=Object.freeze({snapshot:compute,render});render();
})();
/* RC41 — an automatic, evidence-scoped reconstruction. Presentation only.
 * No writes to STATE, authority, evidence unlocks, verdict or SaveManager.
 * Coop re-renders the panel from the verified mirrored snapshot already in STATE.
 */
(()=>{
 'use strict';
 const host=document.getElementById('timeline');
 const anchor=host?.querySelector('.tl-metrics');
 if(!host||!anchor||typeof TL_EVENTS==='undefined'||typeof STATE==='undefined')return;
 const make=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;};
 const root=make('section','ps41-auto');root.id='ps41AutoTimeline';root.setAttribute('aria-label','Automatyczna oś czasu odkrytych wydarzeń');
 const head=make('div','ps41-head');
 const title=make('h3','','Automatyczna oś czasu');
 const intro=make('p','','Oś aktualizuje się na podstawie zdobytych dokumentów i zapisanych przesłuchań. Nie uzupełnia brakujących faktów, nie zmienia ręcznej rekonstrukcji ani werdyktu.');
 const stats=make('div','ps41-stats');stats.setAttribute('role','status');stats.setAttribute('aria-live','polite');
 head.append(title,intro,stats);
 const controls=make('div','ps41-controls');
 const filter=make('select','input');filter.id='ps41Filter';filter.setAttribute('aria-label','Filtr automatycznej osi czasu');
 [['all','Wszystkie źródła'],['document','Zdarzenia z dokumentów'],['witness','Wypowiedzi świadków'],['conflict','Wymagające porównania']].forEach(([v,l])=>{const o=make('option','',l);o.value=v;filter.append(o);});
 const query=make('input','input');query.type='search';query.id='ps41Query';query.maxLength=80;query.placeholder='Szukaj na osi…';query.setAttribute('aria-label','Szukaj na automatycznej osi czasu');
 const refresh=make('button','btn alt','Odśwież oś');refresh.type='button';
 controls.append(filter,query,refresh);
 const caveat=make('p','ps41-caveat','Zdarzenia z akt: godzina podana w odkrytym materiale, bez przypisywania osoby. Zeznania: jedynie dosłowna wzmianka o godzinie, niezweryfikowana i bez potwierdzonej daty. Rozbieżność wymaga oceny śledczego.');
 const output=make('div','ps41-list');output.id='ps41List';
 root.append(head,controls,caveat,output);
 anchor.before(root);
 const DATE_MIN='2026-11-17T18:00',DATE_MAX='2026-11-18T06:00';
 const format=(iso,until)=>{const part=(value)=>value.slice(8,10)+'.11 · '+value.slice(11,16);return part(iso)+(until?' – '+part(until):'');};
 const fold=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 const witnessTime=/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g;
 const eventRules=[
  ['e16',/\b(?:zgon\w*|smier\w*|zmar\w*|czasu\s+zgonu)\b/],
  ['e17',/\b(?:czujnik\w*\s+(?:stanowisk\w*\s*)?(?:nr\s*)?3|impuls\w*\s+mechaniczn\w*)\b/],
  ['e10',/\b(?:sesj\w*\s+diagnostyczn\w*|test\w*\s+diagnostyczn\w*)\b/],
  ['e18',/\b(?:alarm\w*\s+medyczn\w*|wezwani\w*\s+(?:medyczn\w*|ratunk\w*))\b/]
 ];
 const sameMinute=(a,b)=>a.slice(11,16)===b.slice(11,16);
 function dayForTime(time){ // Presentation-only placement on the night's axis, NOT a confirmed date.
  const hour=Number(time.slice(0,2));
  if(hour>=18)return '2026-11-17T'+time;
  if(hour<=6)return '2026-11-18T'+time;
  return null;
 }
 function extractWitness(c,m,index){
  if(m?.role!=='npc'||typeof m.text!=='string'||index===0)return [];
  const result=[];const text=m.text.slice(0,2500);let match;
  const seen=new Set();
  while((match=witnessTime.exec(text))!==null&&result.length<3){
   const time=match[0].padStart(5,'0');if(seen.has(time))continue;seen.add(time);
   const iso=dayForTime(time);if(!iso||iso<DATE_MIN||iso>DATE_MAX)continue;
   const left=Math.max(0,match.index-125),right=Math.min(text.length,match.index+130);
   const snippet=(left?'…':'')+text.slice(left,right).replace(/\s+/g,' ').trim()+(right<text.length?'…':'');
   const near=fold(text.slice(Math.max(0,match.index-95),Math.min(text.length,match.index+95)));
   const lead=fold(text.slice(Math.max(0,match.index-26),match.index));
   const approximate=/(?:okolo|mniej wiecej|gdzies|przed|po|najpozniej|nie wczesniej niz|chyba|miedzy)\s*$/.test(lead);
   const mentions=[];
   for(const [id,regex] of eventRules){
    if(!regex.test(near))continue;
    const event=TL_EVENTS.find(e=>e.id===id&&e.sources.some(s=>STATE.found.has(s)));
    if(!event)continue;
    const mismatch=event.until?(iso<event.from||iso>event.until):!sameMinute(iso,event.from);
    if(mismatch)mentions.push(event.title);
   }
   result.push({kind:'witness',id:'w:'+c.id+':'+index+':'+time,at:iso,time,source:c.name,char:c.id,turn:index,
    label:'Godzina wspomniana w wypowiedzi: '+time,snippet,until:'',issues:mentions,
    marker:approximate?'Przybliżona relacja świadka · niepotwierdzona data':'Twierdzenie świadka · niepotwierdzona data'});
  }
  witnessTime.lastIndex=0;
  return result;
 }
 function collect(){
  const docs=[];for(const e of TL_EVENTS){const ids=e.sources.filter(id=>STATE.found.has(id)&&byId[id]);if(!ids.length)continue;
   const manual=STATE.timeline11?.entries?.[e.id];
   const diff=!!(manual?.at&&(manual.at!==e.from||(e.until&&manual.to!==e.until)));
   docs.push({kind:'document',id:e.id,at:e.from,until:e.until,label:e.title,
    source:ids.map(id=>byId[id].title||id).join(' · '),ids,place:TL_PLACES[e.place]||'Nieustalone',
    caution:e.caution,issues:diff?['Godzina różni się od Twojej ręcznej rekonstrukcji']:[],
    marker:e.until?'Potwierdzony przedział w źródle':'Znacznik czasu z dokumentu'});
  }
  const claims=[];for(const c of CONTENT.characters){
   const messages=STATE.dialogues?.[c.id]||[];
   for(let i=1;i<messages.length;i++)claims.push(...extractWitness(c,messages[i],i));
  }
  return [...docs,...claims].sort((a,b)=>a.at.localeCompare(b.at)||Number(a.kind==='witness')-Number(b.kind==='witness')||a.id.localeCompare(b.id));
 }
 function openDoc(id){
  if(!STATE.found.has(id)||!byId[id])return;
  const input=document.getElementById('filterDocs'),category=document.getElementById('filterCategory');
  if(input)input.value='';if(category)category.value='';
  if(typeof activeEvidenceType!=='undefined')activeEvidenceType='all';
  activeDoc=id;showTab('evidence');renderDocs();
  document.getElementById('docPaper')?.scrollIntoView({block:'start',behavior:'smooth'});
 }
 function openWitness(char,index){
  const log=STATE.dialogues?.[char]||[];if(!log.length)return;
  STATE.activeChar=char;
  // Restore the requested earlier line in the same scrollable transcript.
  if(typeof CHAT_VISIBLE!=='undefined')CHAT_VISIBLE[char]=Math.max(CHAT_VISIBLE[char]||120,log.length);
  showTab('interview');renderChat();
  requestAnimationFrame(()=>document.querySelectorAll('#chatLog .bubble')[index]?.scrollIntoView({block:'center',behavior:'smooth'}));
 }
 function renderItem(item){
  const row=make('article','ps41-event ps41-'+item.kind+(item.issues.length?' ps41-flag':''));
  row.dataset.kind=item.kind;
  const mark=make('div','ps41-time',format(item.at,item.until));
  const body=make('div','ps41-body');
  const badge=make('small','ps41-status',item.marker);const name=make('strong','',item.label);
  const source=make('p','ps41-source','Źródło: '+item.source);body.append(badge,name,source);
  if(item.kind==='document'){
   body.append(make('p','ps41-note','Zakres zapisu: '+item.place+'. '+item.caution));
   const links=make('div','ps41-links');for(const id of item.ids){const b=make('button','btn subtle','Otwórz '+id);b.type='button';b.addEventListener('click',()=>openDoc(id));links.append(b);}body.append(links);
  }else{
   body.append(make('blockquote','ps41-quote',item.snippet));
   body.append(make('small','ps41-uncertain','Dzień 17/18 XI jest przypisaniem pomocniczym według godziny. Samo zeznanie nie potwierdza daty ani zdarzenia.'));
   const b=make('button','btn subtle','Otwórz wypowiedź');b.type='button';b.addEventListener('click',()=>openWitness(item.char,item.turn));body.append(b);
  }
  if(item.issues.length){const flag=make('p','ps41-warning','Do porównania: '+item.issues.join('; ')+'. Nie przesądza to o kłamstwie.');body.append(flag);}
  row.append(mark,body);return row;
 }
 let lastSignature='',current=[];
 function signature(){return [...STATE.found].sort().join('|')+'~'+CONTENT.characters.map(c=>{const log=STATE.dialogues[c.id]||[];return c.id+':'+log.length+':'+String(log.at(-1)?.text||'').slice(-90);}).join('|')+'~'+TL_EVENTS.map(e=>{const x=STATE.timeline11?.entries?.[e.id];return x?.at+':'+x?.to;}).join('|');}
 function render(force=false){if(STATE.tab!=='timeline'&&!force)return;
  const sig=signature();if(sig!==lastSignature||force){current=collect();lastSignature=sig;}
  const events=current.filter(i=>i.kind==='document').length,claims=current.length-events,flags=current.filter(i=>i.issues.length).length;
  stats.textContent=`${events} odkrytych zdarzeń z akt · ${claims} wzmianek w zeznaniach · ${flags} do porównania`;
  const mode=filter.value,term=fold(query.value.trim());const selected=current.filter(i=>(mode==='all'||mode===i.kind||(mode==='conflict'&&i.issues.length))&&(!term||fold(i.label+' '+i.source+' '+(i.snippet||'')+' '+(i.caution||'')).includes(term)));
  output.replaceChildren();if(!selected.length){output.append(make('p','ps41-empty',current.length?'Brak wyników przy tym filtrze.':'Nie odkryto jeszcze materiałów pozwalających ustalić przebieg nocy. Zdobywaj akta i przesłuchuj świadków.'));return;}
  let day='';for(const item of selected){const newDay=item.at.slice(0,10);if(day!==newDay){day=newDay;output.append(make('h4','ps41-day',newDay==='2026-11-17'?'17 listopada · wieczór':'18 listopada · noc i poranek'));}output.append(renderItem(item));}
 }
 filter.addEventListener('change',()=>render(true));query.addEventListener('input',()=>render(true));refresh.addEventListener('click',()=>render(true));
 registerNavigationHook({name:'rc41-auto-timeline',after:({id})=>{if(id==='timeline')render(true);}});
 if(typeof PS_EVENTS!=='undefined'){
  PS_EVENTS.on('evidenceCollected','rc41-auto-evidence',()=>{if(STATE.tab==='timeline')render();});
  PS_EVENTS.on('laboratoryCompleted','rc41-auto-lab',()=>{if(STATE.tab==='timeline')render();});
 }
 // Co-op snapshots and restored saves already update STATE; this view is derived,
 // not separately persisted or trusted as evidence.
 setInterval(()=>{if(STATE.tab==='timeline'&&!document.hidden&&signature()!==lastSignature)render();},2000);
 window.PS_RC41_TIMELINE=Object.freeze({inspect:()=>current.map(({kind,id,at,until,issues})=>({kind,id,at,until,issues:issues.slice()})),refresh:()=>render(true)});
 render(true);
})();
/* RC42: read-only interrogation memory, derived from transcript; never alters NPC facts. */
(()=>{
 'use strict';
 if(typeof STATE==='undefined'||!document.getElementById('interview'))return;
 const box=document.createElement('section');box.id='ps42Memory';box.className='ps-next-panel';
 box.setAttribute('aria-label','Pamięć rozmowy ze świadkiem');
 const title=document.createElement('h3');title.textContent='Przesłuchania';
 const note=document.createElement('p');note.textContent='Powracające pytania i wątki z rzeczywistej rozmowy. To przypomnienie treści, nie dowód prawdziwości zeznania.';
 const info=document.createElement('p');info.id='ps42MemorySummary';
 const list=document.createElement('div');list.id='ps42MemoryItems';
 box.append(title,note,info,list);
 document.getElementById('interview').querySelector('.chathead')?.insertAdjacentElement('afterend',box);
 const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 const stop=new Set(['kiedy','gdzie','ktory','ktora','ktore','dlaczego','prosze','pan','pani','jest','bylo','miales','wtedy','tego','przy','mnie','czy','ten','tam','oraz','sie','nie','jak','od','do','co','o','w','z','ze']);
 function view(){const log=STATE.dialogues?.[STATE.activeChar]||[];
  const turns=log.map((m,i)=>({...m,i})).filter(x=>x.role==='player');
  const tokens=turns.map(x=>[...new Set((fold(x.text).match(/[a-ząćęłńóśźż]{4,}/g)||[]).filter(y=>!stop.has(y)).slice(0,35))]);
  const counts=new Map();tokens.forEach(t=>t.forEach(y=>counts.set(y,(counts.get(y)||0)+1)));
  const repeated=[...counts].filter(([_,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,6);
  return {turns,log,repeated};
 }
 // RC57.10.64: compare the actual player questions before rebuilding an idle
 // panel. Same-length edits and save imports are detected; NPC answers alone
 // do not change this question-based summary.
 let lastRendered=null;
 function questionsChanged(){
  const id=STATE.activeChar,log=STATE.dialogues?.[id]||[];
  if(!lastRendered||lastRendered.id!==id||lastRendered.log!==log||lastRendered.length!==log.length)return true;
  let i=0;
  for(const m of log){
   if(m.role!=='player')continue;
   if(i>=lastRendered.questions.length||lastRendered.questions[i++]!==m.text)return true;
  }
  return i!==lastRendered.questions.length;
 }
 function rememberQuestions(){
  const id=STATE.activeChar,log=STATE.dialogues?.[id]||[];
  lastRendered={id,log,length:log.length,questions:log.filter(m=>m.role==='player').map(m=>m.text)};
 }
 function render(){if(STATE.tab!=='interview')return;const v=view();
  rememberQuestions();
  info.textContent=`Zadane pytania: ${v.turns.length} · powracające hasła: ${v.repeated.length}`;
  list.replaceChildren();
  if(!v.turns.length){const p=document.createElement('p');p.textContent='Rozmowa jeszcze się nie rozpoczęła.';list.append(p);return;}
  for(const turn of v.turns.slice(-5).reverse()){
   const row=document.createElement('div');row.className='ps-next-row';
   const q=document.createElement('span');q.textContent=turn.text.slice(0,220);
   const btn=document.createElement('button');btn.className='btn subtle';btn.type='button';btn.textContent='Wróć do wątku';
   btn.addEventListener('click',()=>{
    if(window.PS_COOP?.active&&!window.PS_COOP.controller)return;
    const field=document.getElementById('chatInput');if(field){field.value='Chcę doprecyzować wcześniejszą odpowiedź na pytanie: „'+turn.text.slice(0,550).replace(/\s+/g,' ')+'”. Co dokładnie miałeś na myśli?';field.focus();}
   });row.append(q,btn);list.append(row);
  }
  if(v.repeated.length){const tag=document.createElement('small');tag.textContent='Wątki powracające: '+v.repeated.map(([a])=>a).join(' · ');list.prepend(tag);}
 }
 registerNavigationHook({name:'rc42-memory',after:()=>render()});
 const previous=typeof renderChat==='function'?renderChat:null;
 // Keep display in sync with server-driven and mirrored transcripts without monkey-patching owners.
 setInterval(()=>{if(!document.hidden&&STATE.tab==='interview'&&questionsChanged())render();},3400);
 window.PS_RC42=Object.freeze({inspect:view,render});render();
})();
/* RC43: confrontation requires an actual previously recorded NPC statement.
 * A quoted testimony is NOT a new fact; server knowledge gates remain sovereign. */
(()=>{
 'use strict';if(typeof STATE==='undefined')return;
 const host=document.getElementById('interview');if(!host)return;
 const wrap=document.createElement('section');wrap.id='ps43Confrontation';wrap.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Konfrontacja zeznań';
 const hint=document.createElement('p');hint.textContent='Wybierz rzeczywiście wypowiedziane zdanie innego świadka. Cytat pozostaje niezweryfikowaną relacją; samo przytoczenie nie odblokowuje dowodów.';
 const source=document.createElement('select');source.setAttribute('aria-label','Źródłowy świadek');
 const quote=document.createElement('select');quote.setAttribute('aria-label','Fragment istniejącego zeznania');
 const preview=document.createElement('blockquote');preview.className='ps-next-quote';
 const add=document.createElement('button');add.type='button';add.className='btn alt';add.textContent='Wstaw pytanie do przesłuchania';
 wrap.append(title,hint,source,quote,preview,add);
 const layout=host.querySelector('.charactergrid');if(layout)layout.insertAdjacentElement('afterend',wrap);else host.append(wrap);
 const val=(v,n=400)=>String(v||'').replace(/[\u0000-\u001f]+/g,' ').slice(0,n);
 function options(){const existing=source.value;source.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='Wybierz innego świadka';source.append(blank);
  for(const c of CONTENT.characters){if(c.id===STATE.activeChar)continue;
   if(!(STATE.dialogues[c.id]||[]).slice(1).some(m=>m.role==='npc'))continue;
   const opt=document.createElement('option');opt.value=c.id;opt.textContent=c.name;source.append(opt);}
  if([...source.options].some(o=>o.value===existing))source.value=existing;
  updateQuotes();}
 function updateQuotes(){const id=source.value,old=quote.value;quote.replaceChildren();
  const log=STATE.dialogues?.[id]||[];
  log.slice(1).forEach((m,i)=>{if(m.role!=='npc'||typeof m.text!=='string')return;
   const o=document.createElement('option');o.value=String(i+1);o.textContent=val(m.text,105);quote.append(o);});
  if([...quote.options].some(o=>o.value===old))quote.value=old;
  else if(quote.options.length)quote.selectedIndex=0;
  refresh();}
 function refresh(){const m=STATE.dialogues?.[source.value]?.[Number(quote.value)];
  preview.textContent=m?.role==='npc'?m.text.slice(0,1100):'Nie wybrano zeznania.';
  add.disabled=!m||m.role!=='npc'||(window.PS_COOP?.active&&!window.PS_COOP.controller);}
 source.addEventListener('change',updateQuotes);quote.addEventListener('change',refresh);
 add.addEventListener('click',()=>{const witness=CONTENT.characters.find(c=>c.id===source.value),m=STATE.dialogues?.[source.value]?.[Number(quote.value)],field=document.getElementById('chatInput');
  if(!witness||m?.role!=='npc'||!field||source.value===STATE.activeChar||(window.PS_COOP?.active&&!window.PS_COOP.controller))return;
  const quoted=val(m.text.replace(/\[[^\]]*Okazano:[^\]]*\]/g,''),420);
  field.value=`W przesłuchaniu ${witness.name} padły słowa: „${quoted}”. To niezweryfikowana wypowiedź. Co możesz powiedzieć o tej rozbieżności w granicach własnej wiedzy?`;
  field.focus();field.scrollIntoView({behavior:'smooth',block:'center'});
 });
 registerNavigationHook({name:'rc43-confrontation',after:()=>{if(STATE.tab==='interview')options();}});
 window.PS_RC43=Object.freeze({refresh:options});options();
})();
/* RC44: cinematic breakthroughs index; only existing gate-verified PS85 scenes. */
(()=>{
 'use strict';if(!window.PS85_STORY)return;
 const parent=document.getElementById('deduction');if(!parent)return;
 const panel=document.createElement('section');panel.id='ps44Scenes';panel.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Przełomy śledztwa · powrót do scen';
 const desc=document.createElement('p');desc.textContent='Sceny wynikają tylko z istniejących, zweryfikowanych powiązań. Ponowne obejrzenie nie zmienia zapisu, dowodów ani werdyktu.';
 const items=document.createElement('div');panel.append(title,desc,items);parent.append(panel);
 const names={work:'Dyspozycja i dokumentacja',warning:'Ostrzeżenie i obieg zgłoszeń',access:'Przepustka i zapis sesji',lastcontact:'Luka między kontaktami',mechanism:'Granice ustaleń medycznych',faultline:'Dwa łańcuchy informacji',presence:'Zegary nie są alibi',boundary:'Granice ostatniej wiadomości'};
 function render(){if(STATE.tab!=='deduction')return;items.replaceChildren();
  const available=window.PS85_STORY.available();const read=new Set(window.PS85_STORY.read());
  for(const id of available){const b=document.createElement('button');b.type='button';b.className='btn subtle';b.textContent=(read.has(id)?'Odczytana · ':'Nowy przełom · ')+(names[id]||id);
   b.addEventListener('click',()=>window.PS85_STORY.open(id));items.append(b);}
  if(!available.length){const p=document.createElement('p');p.textContent='Nowe sceny pojawią się po zweryfikowaniu wymaganych powiązań.';items.append(p);}
 }
 registerNavigationHook({name:'rc44-scene-index',after:render});window.PS_RC44=Object.freeze({render});render();
})();
/* RC45: read-only time gap analysis; never treats repeated sources as independent proof. */
(()=>{
 'use strict';if(!window.PS_RC41_TIMELINE||typeof TL_EVENTS==='undefined')return;
 const root=document.getElementById('ps41AutoTimeline');if(!root)return;
 const panel=document.createElement('section');panel.id='ps45TimeAnalysis';panel.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Oś czasu 3.0 · luki i niezależność źródeł';
 const intro=document.createElement('p');intro.textContent='Przerwy między znacznikami czasu nie są dowodem braku zdarzeń. Powtarzane relacje i dokumenty nie są automatycznie niezależnym potwierdzeniem.';
 const list=document.createElement('div');panel.append(title,intro,list);root.querySelector('.ps41-controls')?.insertAdjacentElement('afterend',panel);
 const minutes=iso=>{const d=Date.parse(iso+':00Z');return Number.isFinite(d)?d/60000:null;};
 function analyze(){const events=TL_EVENTS.filter(e=>e.sources.some(id=>STATE.found.has(id)&&byId[id])).sort((a,b)=>a.from.localeCompare(b.from));
  const gaps=[];for(let i=1;i<events.length;i++){const before=events[i-1],after=events[i];const gap=minutes(after.from)-minutes(before.until||before.from);
   if(gap>=40)gaps.push({from:before.id,to:after.id,minutes:gap});}
  const multi=events.filter(e=>e.sources.filter(id=>STATE.found.has(id)&&byId[id]).length>1).map(e=>({id:e.id,sources:e.sources.filter(id=>STATE.found.has(id)&&byId[id])}));
  return {events:events.length,gaps,multi};}
 function render(){if(STATE.tab!=='timeline')return;const d=analyze();list.replaceChildren();
  const p=document.createElement('p');p.textContent=`Odkryte punkty: ${d.events} · odcinki bez pośredniego znacznika (≥40 min): ${d.gaps.length} · punkty z wieloma dokumentami: ${d.multi.length}`;list.append(p);
  for(const gap of d.gaps.slice(0,10)){const x=document.createElement('p');x.className='ps-next-row';
   x.textContent=`Luka ${gap.minutes} min: ${TL_EVENTS.find(e=>e.id===gap.from)?.title} → ${TL_EVENTS.find(e=>e.id===gap.to)?.title}. Nie wiadomo, co zaszło w tym czasie.`;list.append(x);}
  for(const group of d.multi.slice(0,10)){const x=document.createElement('p');x.className='ps-next-row';x.textContent=`${TL_EVENTS.find(e=>e.id===group.id)?.title}: źródła ${group.sources.join(', ')} (liczba źródeł nie potwierdza ich niezależności)`;list.append(x);}
 }
 registerNavigationHook({name:'rc45-time-analysis',after:render});window.PS_RC45=Object.freeze({analyze,render});setInterval(()=>{if(STATE.tab==='timeline'&&!document.hidden)render();},5500);render();
})();
/* RC46: controller-authored annotations of actual transcript lines, co-op synced via signed SaveManager snapshot.
 * Spectator may propose question in RC39; cannot change authoritative game save. */
(()=>{
 'use strict';if(typeof registerSaveHook!=='function')return;
 const host=document.getElementById('notebook');if(!host)return;
 let records=[];
 const panel=document.createElement('section');panel.id='ps46Annotations';panel.className='ps-next-panel';
 const heading=document.createElement('h3');heading.textContent='Kooperacja 3.0 · znaczniki przesłuchań';
 const intro=document.createElement('p');intro.textContent='Oznacz realną wypowiedź jako ważną dla wspólnych notatek. Znacznik nie potwierdza treści i nie wpływa na werdykt. W pokoju edytuje osoba sterująca.';
 const witness=document.createElement('select');witness.setAttribute('aria-label','Świadek dla adnotacji');
 const turn=document.createElement('select');turn.setAttribute('aria-label','Wypowiedź do oznaczenia');
 const comment=document.createElement('input');comment.maxLength=180;comment.placeholder='Uzasadnienie (własna notatka)';
 const add=document.createElement('button');add.type='button';add.className='btn alt';add.textContent='Oznacz wypowiedź';
 const list=document.createElement('div');panel.append(heading,intro,witness,turn,comment,add,list);host.append(panel);
 const allowed=e=>e&&typeof e==='object'&&CONTENT.characters.some(c=>c.id===e.character)&&Number.isInteger(e.index)&&e.index>=1&&e.index<1600&&typeof e.quote==='string'&&e.quote.length<=300&&typeof e.comment==='string'&&e.comment.length<=180;
 function fill(){const old=witness.value;witness.replaceChildren();
  for(const c of CONTENT.characters){const o=document.createElement('option');o.value=c.id;o.textContent=c.name;witness.append(o);}
  witness.value=[...witness.options].some(o=>o.value===old)?old:STATE.activeChar;fillTurns();}
 function fillTurns(){const old=turn.value;turn.replaceChildren();(STATE.dialogues[witness.value]||[]).forEach((m,i)=>{if(m.role!=='npc'||i===0)return;
  const o=document.createElement('option');o.value=String(i);o.textContent='Wypowiedź '+i+': '+m.text.slice(0,95);turn.append(o);});
  if([...turn.options].some(o=>o.value===old))turn.value=old;add.disabled=!turn.value;}
 function editable(){return !window.PS_COOP?.active||window.PS_COOP.controller;}
 function render(){fill();list.replaceChildren();add.disabled=!turn.value||!editable();comment.disabled=!editable();
  const valid=records.filter(e=>{const m=STATE.dialogues[e.character]?.[e.index];return m?.role==='npc'&&m.text.startsWith(e.quote);});
  if(!valid.length){const p=document.createElement('p');p.textContent='Brak oznaczonych wypowiedzi.';list.append(p);}
  for(const rec of valid){const row=document.createElement('div');row.className='ps-next-row';
   const txt=document.createElement('p');txt.textContent=`${CONTENT.characters.find(c=>c.id===rec.character)?.name} · „${rec.quote}…” — ${rec.comment||'Do sprawdzenia'}`;
   const jump=document.createElement('button');jump.type='button';jump.className='btn subtle';jump.textContent='Pokaż';jump.addEventListener('click',()=>{
    STATE.activeChar=rec.character;showTab('interview');
    if(typeof CHAT_VISIBLE!=='undefined')CHAT_VISIBLE[rec.character]=1600;renderChat();
    document.querySelectorAll('#chatLog .bubble')[rec.index]?.scrollIntoView({block:'center'});
   });
   const rm=document.createElement('button');rm.type='button';rm.className='btn subtle';rm.textContent='Usuń';rm.disabled=!editable();rm.addEventListener('click',()=>{if(!editable())return;records=records.filter(x=>x!==rec);window.PS_COOP?.mark?.();render();});
   row.append(txt,jump,rm);list.append(row);}
 }
 witness.addEventListener('change',fillTurns);
 add.addEventListener('click',()=>{if(!editable()||records.length>=80)return;const m=STATE.dialogues[witness.value]?.[Number(turn.value)];if(m?.role!=='npc')return;
  const rec={character:witness.value,index:Number(turn.value),quote:m.text.slice(0,300),comment:comment.value.trim().slice(0,180)};
  if(records.some(e=>e.character===rec.character&&e.index===rec.index))return;
  records.push(rec);comment.value='';window.PS_COOP?.mark?.();render();});
 registerSaveHook({name:'rc46-transcript-annotations',build:data=>{data.rc46Annotations=records.map(e=>({...e}));},apply:data=>{records=Array.isArray(data.rc46Annotations)?data.rc46Annotations.filter(allowed).slice(-80).map(e=>({...e})):[];render();}});
 registerNavigationHook({name:'rc46-annotations',after:()=>{if(STATE.tab==='notebook')render();}});
 window.PS_RC46=Object.freeze({inspect:()=>records.map(x=>({...x})),render});render();
})();
/* RC47: displayed heuristics are transcript-based, never privileged mental states or facts. */
(()=>{
 'use strict';const host=document.getElementById('interview');if(!host)return;
 const box=document.createElement('section');box.id='ps47Psychology';box.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Psychologia rozmowy · sygnały z pytań';
 const note=document.createElement('p');note.textContent='Szacunek tonu na podstawie Twoich pytań, a nie odczyt rzeczywistego stanu psychicznego świadka. Nie zwiększa dostępnej wiedzy postaci.';
 const status=document.createElement('p');box.append(title,note,status);
 host.querySelector('.chathead')?.insertAdjacentElement('afterend',box);
 const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 function inspect(id=STATE.activeChar){const log=STATE.dialogues?.[id]||[];const questions=log.filter(m=>m.role==='player').map(m=>fold(m.text));
  const pressure=questions.filter(q=>/(klam|ukryw|oszuk|przecz|win|przyznaj)/.test(q)).length;
  const clarifications=questions.filter(q=>/(dlaczego|sprecyz|sprost|wczesniej|dokladnie|wytlumacz)/.test(q)).length;
  const sources=questions.filter(q=>/(dowod|dokument|potwierd|zrod|log|rejestr)/.test(q)).length;
  const fatigue=questions.length>=18?'długa':questions.length>=7?'rozwinięta':'wstępna';
  return {turns:questions.length,pressure,clarifications,sources,phase:fatigue};}
 function render(){if(STATE.tab!=='interview')return;const x=inspect();status.textContent=`Rozmowa ${x.phase} (${x.turns} pytań). Zarzuty/nacisk: ${x.pressure}; doprecyzowania: ${x.clarifications}; odwołania do źródeł: ${x.sources}. To opis sposobu prowadzenia rozmowy, nie ocena prawdziwości odpowiedzi.`;}
 registerNavigationHook({name:'rc47-psychology',after:render});
 setInterval(()=>{if(!document.hidden&&STATE.tab==='interview')render();},3900);
 window.PS_RC47=Object.freeze({inspect,render});render();
})();
/* RC48: evidence-bounded final report; export only, no mutation to STATE or verdict. */
(()=>{
 'use strict';const host=document.getElementById('final');if(!host)return;
 const panel=document.createElement('section');panel.id='ps48FinalReport';panel.className='ps-next-panel';
 const head=document.createElement('h3');head.textContent='Raport śledczego 2.0';
 const note=document.createElement('p');note.textContent='Raport odróżnia zdobyte dokumenty, relacje świadków i hipotezy graczy. Nie zastępuje istniejącej oceny werdyktu.';
 const output=document.createElement('div'),download=document.createElement('button');download.type='button';download.className='btn alt';download.textContent='Pobierz szczegółowy raport (.txt)';
 panel.append(head,note,output,download);host.append(panel);
 function report(){const lines=['PRAWDZIWE ŚLEDZTWO — RAPORT ANALITYCZNY RC48','Wszystkie dane dotyczą fikcyjnej sprawy.',''];
  const verdict=STATE.sim?.trial;lines.push('WERDYKT (NIEZMIENIONY): '+(typeof verdict?.kind==='string'?verdict.kind:'jeszcze nie wydano'),'');
  const docs=[...STATE.found].filter(id=>byId[id]);lines.push('DOKUMENTY ODKRYTE: '+docs.length);
  docs.sort().slice(0,250).forEach(id=>lines.push('- ['+id+'] '+String(byId[id].title||id).slice(0,180)));lines.push('');
  lines.push('ZDARZENIA POTWIERDZONE ZAPISAMI (NIE Z DOMYSŁÓW):');
  const known=TL_EVENTS.filter(e=>e.sources.some(id=>STATE.found.has(id)&&byId[id]));
  for(const e of known){const ids=e.sources.filter(id=>STATE.found.has(id)&&byId[id]);lines.push('- '+e.from+(e.until?' – '+e.until:'')+' · '+e.title+' · źródła: '+ids.join(', ')+' · ograniczenie: '+e.caution);}
  lines.push('','PRZESŁUCHANIA (RELACJE, NIE POTWIERDZENIA):');
  for(const c of CONTENT.characters){const log=STATE.dialogues[c.id]||[];lines.push('- '+c.name+': '+log.filter(m=>m.role==='player').length+' pytań; '+log.filter(m=>m.role==='npc').length+' wypowiedzi');}
  const notes=String(STATE.notes||'').slice(0,8000);lines.push('','NOTATKI GRACZA (HIPOTEZY):',notes||'Brak');
  const board=window.PS_RC38_BOARD?.inspect?.()||[];lines.push('','POWIĄZANIA WŁASNE GRACZY:');
  for(const b of board.slice(0,80))if(STATE.found.has(b.a)&&STATE.found.has(b.b))lines.push('- '+b.kind+' · '+b.a+' / '+b.b+' · '+b.note);
  const marks=window.PS_RC46?.inspect?.()||[];lines.push('','ADNOTACJE DO ZEZNANIA:');for(const mark of marks.slice(0,80))lines.push('- '+mark.character+' #'+mark.index+' · '+mark.comment);
  lines.push('','UWAGA: relacje i notatki nie stanowią samodzielnego dowodu; raport nie odblokowuje finału.');return lines.join('\n');}
 function render(){if(STATE.tab!=='final')return;const docs=[...STATE.found].filter(id=>byId[id]).length;
  output.textContent=`Dokumenty: ${docs} · świadkowie: ${CONTENT.characters.length} · werdykt: ${STATE.sim?.trial?.kind||'jeszcze nie wydano'}.`;
 }
 download.addEventListener('click',()=>{if(window.PS_COOP?.active&&!window.PS_COOP.controller)return;
  const blob=new Blob([report()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Prawdziwe_Sledztwo_Raport_RC48.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 registerNavigationHook({name:'rc48-analytical-report',after:render});window.PS_RC48=Object.freeze({report,render});render();
})();
/* RC49: read-only on-device diagnostics; never modifies proof, session or progression. */
(()=>{
 'use strict';const host=document.getElementById('notebook');if(!host||!window.PS_SAVE_MANAGER)return;
 const section=document.createElement('section');section.id='ps49Diagnostics';section.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Audyt jakości RC49';
 const para=document.createElement('p');para.textContent='Lokalna kontrola spójności bieżącego zapisu, dowodów i rozmów. Nie łączy się z usługami AI i nie ocenia winy.';
 const button=document.createElement('button');button.type='button';button.className='btn alt';button.textContent='Sprawdź bieżący stan';
 const results=document.createElement('div');results.setAttribute('role','status');section.append(title,para,button,results);host.append(section);
 function audit(){const checks=[];
  const add=(name,pass)=>checks.push({name,pass:!!pass});
  try{const save=PS_SAVE_MANAGER.build();PS_SAVE_MANAGER.verify(save);add('SHA-256 zapisu i odczyt metadanych',true);add('Zgodność wersji zapisu',save.version===11&&save.saveMeta?.schemaVersion===2);}catch{add('SHA-256 zapisu i metadane',false);}
  add('Wyłącznie znane ID dokumentów',[...STATE.found].every(id=>byId[id]));
  add('Przesłuchania przypisane do świadków',CONTENT.characters.every(c=>Array.isArray(STATE.dialogues[c.id])));
  add('Zgodne role wypowiedzi',CONTENT.characters.every(c=>(STATE.dialogues[c.id]||[]).every(m=>['player','npc'].includes(m.role)&&typeof m.text==='string')));
  add('Przedział czasowy ręcznych notatek',STATE.events.every(e=>typeof e.at==='string'&&/^2026-11-(17|18)T\d\d:\d\d$/.test(e.at)));
  add('Moduł osi czasu',!!window.PS_RC41_TIMELINE?.inspect);
  add('Weryfikacja przełomów',!!window.PS85_STORY?.available);
  add('Niezależny silnik werdyktu',!!window.PS_RC40_FINALE?.snapshot);
  add('Uzgodnienia kooperacyjne dostępne lokalnie',!!window.PS_COOP?.refresh);
  return checks;}
 function render(){const a=audit();results.replaceChildren();for(const c of a){const p=document.createElement('p');p.textContent=(c.pass?'OK · ':'UWAGA · ')+c.name;results.append(p);}
  results.prepend(Object.assign(document.createElement('strong'),{textContent:`${a.filter(x=>x.pass).length}/${a.length} kontroli zaliczonych` }));}
 button.addEventListener('click',render);
 registerNavigationHook({name:'rc49-quality-dashboard',after:()=>{if(STATE.tab==='notebook')render();}});
 window.PS_RC49=Object.freeze({audit,render});
})();
/* RC53 — evidence provenance: read-only classification of documents and witness statements.
 * No evidence IDs are added or exposed before discovery; no causal independence is inferred. */
(()=>{
 'use strict';
 if(typeof STATE==='undefined'||typeof CONTENT==='undefined'||typeof dedAvailable!=='function')return;
 const host=document.getElementById('notebook');if(!host)return;
 const panel=document.createElement('section');panel.id='ps53Provenance';panel.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Wiarygodność źródeł 2.0 · pochodzenie';
 const intro=document.createElement('p');intro.textContent='Klasyfikacja informuje, skąd pochodzi zapis — nie rozstrzyga, czy jest prawdziwy. Dwa dokumenty z tego samego obiegu nie są niezależnymi potwierdzeniami.';
 const summary=document.createElement('p');summary.setAttribute('role','status');
 const filter=document.createElement('select');filter.setAttribute('aria-label','Typ źródła');
 [['all','Wszystkie dostępne źródła'],['doc','Odkryte dokumenty'],['say','Zeznania świadków']].forEach(([v,label])=>{const opt=document.createElement('option');opt.value=v;opt.textContent=label;filter.append(opt);});
 const search=document.createElement('input');search.type='search';search.placeholder='Znajdź źródło…';search.maxLength=75;search.setAttribute('aria-label','Szukaj źródła');
 const output=document.createElement('div');output.id='ps53ProvenanceList';panel.append(title,intro,summary,filter,search,output);
 host.append(panel);
 const fold=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 const norm=s=>String(s||'').slice(0,320);
 function inspect(){
  const sources=[...dedAvailable().values()];
  const families=new Map();
  for(const s of sources){const family=s.type==='doc'?'D:'+String(byId[s.docId]?.family||s.docId):'Z:'+String(s.charId||'');
   families.set(family,(families.get(family)||0)+1);}
  return sources.map(s=>{
   const family=s.type==='doc'?'D:'+String(byId[s.docId]?.family||s.docId):'Z:'+String(s.charId||'');
   return {key:s.key,type:s.type,label:s.label,category:s.type==='doc'?'Zapis dokumentowy':'Relacja świadka',family,
    otherFromFamily:Math.max(0,(families.get(family)||1)-1),
    caveat:s.type==='doc'?'Dokument potwierdza własną treść i zakres rejestracji; nie dowodzi automatycznie osoby, motywu ani przyczyny.':'Zapis potwierdza, że świadek to powiedział — nie potwierdza prawdziwości zdarzenia.'};
  });
 }
 function render(){if(STATE.tab!=='notebook')return;const rows=inspect();summary.textContent=`Dostępne: ${rows.filter(x=>x.type==='doc').length} dokumentów, ${rows.filter(x=>x.type==='say').length} wypowiedzi. Rodzina źródła ≠ liczba niezależnych potwierdzeń.`;
  output.replaceChildren();let displayed=0;const q=fold(search.value);
  for(const item of rows){if(filter.value!=='all'&&filter.value!==item.type)continue;if(q&&!fold(item.label).includes(q))continue;if(++displayed>24)break;
   const section=document.createElement('div');section.className='ps-next-row ps53-source';
   const desc=document.createElement('div');const top=document.createElement('strong');top.textContent=norm(item.label);const cap=document.createElement('p');cap.textContent=item.category+' · '+(item.otherFromFamily?`W tym samym obiegu / u tego świadka: ${item.otherFromFamily} innych zapisów.`:'Brak innych zapisów z tej rodziny.');const limit=document.createElement('small');limit.textContent=item.caveat;desc.append(top,cap,limit);
   const btn=document.createElement('button');btn.type='button';btn.className='btn subtle';btn.textContent='Otwórz źródło';btn.addEventListener('click',()=>{const source=dedAvailable().get(item.key);if(source)dedSourceOpen(source);});
   section.append(desc,btn);output.append(section);
  }
  if(!displayed){const p=document.createElement('p');p.textContent='Brak pasujących, odkrytych źródeł.';output.append(p);}
 }
 filter.addEventListener('change',render);search.addEventListener('input',render);
 registerNavigationHook({name:'rc53-provenance',after:render});
 window.PS_RC53=Object.freeze({inspect,render});render();
})();
/* RC54 — cinematic pace strictly from unlocked scenes and real, already saved turns.
 * Display only; never creates testimony, evidence, psychological truth or new story gates. */
(()=>{
 'use strict';if(typeof STATE==='undefined'||!window.PS85_STORY)return;
 const host=document.getElementById('interview');if(!host)return;
 const panel=document.createElement('details');panel.id='ps54Director';panel.className='ps-next-panel';
 const heading=document.createElement('summary');heading.textContent='Rytm sceny · przesłuchanie';
 const intro=document.createElement('p');intro.textContent='Dyskretna inscenizacja na podstawie już przeprowadzonej rozmowy. Komentarz nie jest zeznaniem ani dowodem.';
 const caption=document.createElement('p');caption.id='ps54DirectorCaption';caption.setAttribute('aria-live','off');
 const path=document.createElement('div');path.className='ps54-path';
 const go=document.createElement('button');go.className='btn subtle';go.type='button';go.textContent='Zobacz odkryte przełomy';
 go.addEventListener('click',()=>showTab('deduction'));
 panel.append(heading,intro,caption,path,go);
 const point=host.querySelector('#ps43Confrontation')||host.querySelector('.chathead');point?.insertAdjacentElement('afterend',panel);
 const stageText={opening:'Rozmowa dopiero się rozpoczyna. Zacznij od pytań o konkretną obserwację.',
 followup:'Wracasz do szczegółów wcześniejszych odpowiedzi. Warto oddzielić pamięć świadka od zapisu dokumentowego.',
 deep:'Rozmowa jest długa. Teraz szczególnie istotne stają się niespójności, źródła i konkretne granice wiedzy.',
 breakthrough:'W aktach jest już sprawdzony przełom. Można wrócić do niego przed kolejnym pytaniem.'};
 function inspect(id=STATE.activeChar){
  const log=STATE.dialogues?.[id]||[];
  const turns=log.filter(m=>m?.role==='player').length;
  const unlocked=window.PS85_STORY.available().slice(0,10);
  const phase=unlocked.length?'breakthrough':turns>=12?'deep':turns>=3?'followup':'opening';
  return {phase,turns,available:unlocked.length};
 }
 function render(){if(STATE.tab!=='interview')return;const s=inspect();caption.textContent=stageText[s.phase];path.replaceChildren();
  const phases=[['Początek',s.turns>=1],['Doprecyzowania',s.turns>=3],['Długie przesłuchanie',s.turns>=12],['Zweryfikowany przełom',s.available>0]];
  for(const [label,done] of phases){const mark=document.createElement('span');mark.className=done?'ps54-step done':'ps54-step';mark.textContent=(done?'● ':'○ ')+label;path.append(mark);}
  go.disabled=!s.available;go.title=s.available?'Otwórz dostępne, zweryfikowane sceny':'Brak zweryfikowanych przełomów';
 }
 registerNavigationHook({name:'rc54-director',after:render});
 window.PS_RC54=Object.freeze({inspect,render});
 // Mirror can update STATE outside the navigation lifecycle.
 let last='';setInterval(()=>{if(document.hidden||STATE.tab!=='interview')return;const s=inspect();const key=STATE.activeChar+':'+s.turns+':'+s.available;if(key!==last){last=key;render();}},3900);
 render();
})();
/* RC57.10.23: presentation only; facts and progress come from existing UI. */
(()=>{'use strict';
 const init=()=>{
  const toolbar=document.querySelector('.topbar'); if(!toolbar)return;
  const label=document.getElementById('ps23ProgressLabel');
  const fill=document.getElementById('ps23ProgressFill');
  const sync=()=>{
   const track=document.querySelector('#overview .ui14-progress-track span');
   const meter=track?.style?.width||'';
   if(fill)fill.style.width=/^\d+(?:\.\d+)?%$/.test(meter)?meter:'0%';
   const stage=document.querySelector('.sidebar');
   const stageMatch=(stage?.textContent||'').match(/Etap\s+(\d+)\s*\/\s*(\d+)/i);
   if(stageMatch){
    if(label)label.textContent='Etap '+stageMatch[1]+'/'+stageMatch[2];
    if(fill && (!/^\d+(?:\.\d+)?%$/.test(meter) || meter==='0%')) fill.style.width=(Math.min(100,Math.round(100*Number(stageMatch[1])/Number(stageMatch[2]))))+'%';
   }else if(label)label.textContent='Śledztwo w toku';
  };
  sync();
  // Cosmetic progress read from the existing UI, never from a fabricated counter.
  const src=document.querySelector('#overview .ui14-progress-track');
  if(src)new MutationObserver(sync).observe(src,{subtree:true,attributes:true,childList:true,characterData:true});
  const stage=document.querySelector('.sidebar');
  if(stage)new MutationObserver(sync).observe(stage,{subtree:true,attributes:false,characterData:true,childList:true});
  const chat=document.querySelector('#interview .chat');
  const extras=['ps47Psychology','ps42Memory','ps620WitnessBeat','ps621ThreadCue','psbPanel'];
  if(chat&&!chat.querySelector('.ps23-extras')){
   const fold=document.createElement('details');fold.className='ps23-extras';
   const sum=document.createElement('summary');sum.textContent='Szczegóły psychologii i pamięci rozmowy';fold.append(sum);
   extras.forEach(id=>{let node=document.getElementById(id);if(node&&chat.contains(node))fold.append(node);});
   if(fold.children.length>1)chat.append(fold);
  }
  const root=document.querySelector('.ps-coop-bar');
  if(root && !document.querySelector('.ps23-coop-fold')){
   const panel=document.createElement('details');panel.className='ps23-coop-fold';
   const summary=document.createElement('summary');summary.textContent='Wspólna gra';panel.append(summary,root);
   toolbar.append(panel);
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
/* RC57.10.38 — układ wizualny zaakceptowanej koncepcji, bez modyfikowania stanu gry. */
(()=>{
 'use strict';
 function init(){
  const overview=document.getElementById('overview');
  if(!overview||overview.classList.contains('ps38-premium'))return;
  overview.classList.add('ps38-premium');
  const find=sel=>overview.querySelector(sel);
  const hero=find('.hero'),welcome=find('#ps2Welcome'),pulse=find('#ps70Pulse'),threads=find('#story26Overview'),more=find('#ps88MorePaths');
  if(hero&&welcome){
   const front=document.createElement('div');front.className='ps38-front-grid';
   hero.parentElement.insertBefore(front,hero);front.append(hero,welcome);
  }
  if(pulse&&threads){
   const lower=document.createElement('div');lower.className='ps38-lower-grid';
   const left=document.createElement('div');left.className='ps38-progress-stack';
   pulse.parentElement.insertBefore(lower,pulse);lower.append(left,threads);left.append(pulse);
   if(more)left.append(more);
  }
  const banner=document.createElement('header');banner.className='ps38-case-banner';
  banner.innerHTML='<span class="ps38-banner-kicker">PULPIT ŚLEDCZY · AKTA SPRAWY</span><h2>Stan sprawy</h2><p>Przeglądaj ustalenia, śledź wątki i planuj kolejne czynności.</p>';
  const sectionIndex=find('.ps36-section-index');
  if(sectionIndex)sectionIndex.insertAdjacentElement('afterend',banner);
  else overview.insertBefore(banner,overview.firstChild);
  const tasks=document.createElement('nav');tasks.className='ps38-actions';tasks.setAttribute('aria-label','Skróty do czynności śledczych');
  tasks.innerHTML='<div class="ps38-actions-heading"><span class="ps38-motif" aria-hidden="true">✧</span><strong>NAJBLIŻSZE DZIAŁANIA</strong></div><div class="ps38-actions-list">'+[
   ['evidence','▤','Przejrzyj akta','Dostępne dokumenty'],
   ['inspection12','◉','Oględziny','Zbadaj miejsce zdarzenia'],
   ['notebook','✎','Notatnik','Zapisz swoje ustalenia'],
   ['deduction','◇','Dedukcja','Połącz fakty i hipotezy']
  ].map(([id,icon,title,desc])=>'<button type="button" data-ps38-go="'+id+'"><span aria-hidden="true">'+icon+'</span><b>'+title+'</b><small>'+desc+'</small></button>').join('')+'</div>';
  const after=find('.ps38-lower-grid')||find('.ps38-front-grid');
  if(after)after.insertAdjacentElement('afterend',tasks);
  tasks.addEventListener('click',ev=>{
   const id=ev.target.closest('[data-ps38-go]')?.getAttribute('data-ps38-go');
   if(!id||typeof showTab!=='function')return;
   showTab(id);
  });
  const sidebar=document.getElementById('ui14Sidebar');
  if(sidebar){
   const nav=sidebar.querySelector('#nav');
   const icons={overview:'⌂',evidence:'▤',search:'⌕',interview:'☷',timeline:'◷',inspection12:'◉',notebook:'✎',labs:'⚗',deduction:'◇',final:'⚑'};
   nav?.querySelectorAll('button[data-tab]').forEach(btn=>{
    if(btn.querySelector('.ps38-nav-icon'))return;
    const icon=document.createElement('span');icon.className='ps38-nav-icon';icon.setAttribute('aria-hidden','true');icon.textContent=icons[btn.dataset.tab]||'◆';
    const number=btn.querySelector('.num');
    if(number)number.after(icon);else btn.prepend(icon);
   });
   if(!sidebar.querySelector('.ps38-sidebar-art')){
    const art=document.createElement('div');art.className='ps38-sidebar-art';art.setAttribute('aria-hidden','true');
    const tools=document.getElementById('ps76Tools');
    if(tools?.parentElement===sidebar)tools.before(art);else sidebar.append(art);
   }
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
