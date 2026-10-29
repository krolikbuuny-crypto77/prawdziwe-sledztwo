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
