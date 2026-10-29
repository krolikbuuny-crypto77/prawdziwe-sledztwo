
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
