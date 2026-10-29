
/* Ciągłość rozstrzygnięć — ochrona przed nieaktualnym wynikiem po dalszych czynnościach.
   Odwołuje się wyłącznie do istniejącego mechanizmu oceny, nie przyznaje dowodów. */
(function(){
 'use strict';
 if(typeof STATE==='undefined'||!window.PS602_VERDICT||typeof simRenderHearing!=='function'||typeof buildSave!=='function'||typeof applySave!=='function')return;
 const previousHearing=simRenderHearing;
 
 
 const previousReset=simReset;
 let isRestoring=false;
 let isReconciling=false;
 let pendingNotice=false;
 function reconcile(){
  if(isRestoring||isReconciling||!STATE.sim?.trial?.kind)return false;
  isReconciling=true;
  try{
   // Recalculate from actual evidence, defense, statements, and procedural choices.
   if(STATE.sim.trial.qualification&&window.PS_FINAL_VARIANTS?.signature){
     if(STATE.sim.trial.signature===window.PS_FINAL_VARIANTS.signature())return false;
     STATE.sim.trial=null;
     pendingNotice=true;
     return true;
   }
   const expected=window.PS602_VERDICT.expected();
   if(expected===STATE.sim.trial.kind)return false;
   STATE.sim.trial=null;
   pendingNotice=true;
   return true;
  }finally{isReconciling=false;}
 }
 function notice(){
  if(!pendingNotice||STATE.tab!=='final')return;
  pendingNotice=false;
  toast('Zmiana ustaleń wymaga ponownej oceny rozstrzygnięcia. Akta i dotychczasowe czynności zostały zachowane.');
 }
 simRenderHearing=function(){
  const changed=reconcile();
  const result=previousHearing.apply(this,arguments);
  if(changed)notice();
  return result;
 };
 registerNavigationHook({name:'verdict-integrity',
  before:context=>{context.verdictChanged=reconcile();},
  after:context=>{if(context.verdictChanged)previousHearing();notice();}
 });
 /* SaveManager: buildSave hook. */
registerSaveHook({name:"33-verdict-integrity-save1", beforeBuild(){if(reconcile())previousHearing();},build(__save){
  
  return __save;
 }});
 /* SaveManager: applySave hook. */
registerSaveHook({name:"33-verdict-integrity-load1", beforeApply(){isRestoring=true;},onApplyError(){isRestoring=false;pendingNotice=false;},apply(data){isRestoring=false;pendingNotice=false;if(reconcile()){previousHearing();pendingNotice=false;}}});
 simReset=function(){
  pendingNotice=false;
  return previousReset.apply(this,arguments);
 };
})();
