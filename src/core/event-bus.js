/* Etap 5: jeden właściciel zdarzeń domenowych. Nie przechowuje stanu gry ani
 * nie zastępuje walidatorów; jedynie informuje moduły o zatwierdzonych zmianach.
 * Ładowany przed CaseEngine, SaveManager i modułami historycznymi.
 */
const PS_EVENTS = (()=>{
 'use strict';
 const types=Object.freeze([
  'evidenceCollected','witnessBreakthrough','timelineVerified','hypothesisEvaluated',
  'laboratoryCompleted','indictmentSubmitted','caseCompleted'
 ]);
 const listeners=new Map(types.map(type=>[type, new Map()]));
 const counts=Object.fromEntries(types.map(type=>[type,0]));
 const errors=[];
 const queue=[];
 let dispatching=false,paused=0,sequence=0;
 const own=Object.prototype.hasOwnProperty;
 function on(type,name,callback){
  if(!listeners.has(type)||typeof name!=='string'||!name.trim()||typeof callback!=='function')
   throw Error('EventBus: nieprawidłowy typ lub subskrybent');
  const subscribers=listeners.get(type);
  if(subscribers.has(name))throw Error('EventBus: powtórzony subskrybent '+type+'/'+name);
  subscribers.set(name,callback);
  return ()=>{if(subscribers.get(name)===callback)subscribers.delete(name);};
 }
 function emit(type,detail={}){
  if(!listeners.has(type)||!detail||typeof detail!=='object'||Array.isArray(detail))
   throw Error('EventBus: nieobsługiwane zdarzenie');
  if(paused)return false;
  const payload=Object.freeze({type,...detail,sequence:++sequence});
  queue.push(payload);
  if(dispatching)return true;
  dispatching=true;
  try{
   while(queue.length){
    const current=queue.shift();counts[current.type]++;
    for(const [name,handler] of [...listeners.get(current.type)]){
     if(listeners.get(current.type).get(name)!==handler)continue;
     try{handler(current);}catch(e){
      errors.push({type:current.type,name,error:String(e?.message||e)});
      if(errors.length>20)errors.shift();
      console.error('[EventBus] '+current.type+'/'+name,e);
     }
    }
   }
  }finally{dispatching=false;}
  return true;
 }
 function pause(){paused++;}
 function resume(){paused=Math.max(0,paused-1);}
 function suspend(callback){pause();try{return callback();}finally{resume();}}
 function evidence(id,origin){
  if(typeof id!=='string'||!id||!STATE?.found?.has(id))return false;
  return emit('evidenceCollected',{id,origin:String(origin||'unknown')});
 }
 function laboratory(key,ids){
  if(!Array.isArray(ids)||!ids.length||!ids.every(id=>STATE?.found?.has(id)))return false;
  for(const id of new Set(ids))evidence(id,'laboratory:'+key);
  return emit('laboratoryCompleted',{key:String(key),ids:Object.freeze([...new Set(ids)])});
 }
 function timeline(id,assessment){
  if(!id||assessment?.state!=='ok')return false;
  return emit('timelineVerified',{id:String(id),status:assessment.state});
 }
 function hypothesis(id,reason){
  if(!id||!STATE?.deduction?.cards?.some(c=>c.id===id))return false;
  return emit('hypothesisEvaluated',{id:String(id),ok:!!reason?.ok,issues:reason?.issues?.length||0});
 }
 function breakthrough(witnessId,issue){
  if(!witnessId||!issue||!STATE?.sim?.breakthrough?.witnesses?.[witnessId]?.unlocked?.includes(issue))return false;
  return emit('witnessBreakthrough',{witnessId:String(witnessId),issue:String(issue)});
 }
 function indictment(){
  if(!STATE?.final13?.submitted)return false;
  return emit('indictmentSubmitted',{qualification:String(STATE.final13.qualification||'intentional'),attempts:STATE.final13.attempts});
 }
 let lastCompleted='';
 function resetSession(){lastCompleted='';}
 function finale(){
  const result=STATE?.sim?.trial;
  if(!STATE?.final13?.submitted||!result)return false;
  if(result.kind!=='solid'){lastCompleted='';return false;}
  const key=JSON.stringify([STATE.final13.qualification,STATE.final13.attempts,result.kind]);
  if(key===lastCompleted)return false;
  lastCompleted=key;
  return emit('caseCompleted',{kind:result.kind,qualification:String(STATE.final13.qualification||'intentional')});
 }
 function inspect(){return {version:1,types:[...types],counts:{...counts},
  listeners:Object.fromEntries(types.map(type=>[type,[...listeners.get(type).keys()]])),
  paused,sequence,pending:queue.length,errors:[...errors]};}
 return Object.freeze({types,on,emit,pause,resume,suspend,evidence,laboratory,
  timeline,hypothesis,breakthrough,indictment,finale,resetSession,inspect});
})();
window.PS_EVENT_BUS=PS_EVENTS;
