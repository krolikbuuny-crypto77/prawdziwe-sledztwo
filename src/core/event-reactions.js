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
