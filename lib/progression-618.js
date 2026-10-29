/** Pakiet 6.18 — autorytatywne sprawdzanie przesłanych rozwiązań.
 * Nie ufamy flagom solved, success, verdict, found ani klientowym punktom jakości.
 */
import canon from './server-canon-618.json' with {type:'json'};
import rules from './approved-rules.js';
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
const fail=reason=>({ok:false,why:reason});
const has=(state,id)=>(state.approvedEvidence||[]).includes(id);
const fields=(a,entries)=>entries.every(([key,value])=>a[key]===value);
const validString=(x,max=120)=>typeof x==='string'&&x.length<=max;
const names=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const branches=['intentional','planned','negligence','sabotage','complicity'];
const relevant={intentional:['accident','contract','message','card','remote','traces'],planned:['accident','contract','message','card','remote','traces'],negligence:['accident','contract','traces'],sabotage:['contract','message','card'],complicity:['contract','message','card','remote']};
const roles=['person','method','motive','alibi'];
function stageCorrect(k,s,seq,form){
 const a=canon.puzzles[k];if(!a)return false;
 if(s===2&&form.Uzasadnienie!=='best')return false;
 if(k==='tcms'){
  if(s===0)return same(seq,a.sequence);
  if(s===1)return fields(form,[['Pakiet pierwotny',a.packet],['Retransmisja',a.retry],['Ocena duplikatu','repeat']]);
  return fields(form,[['Związek rejestrów','separate'],['Granica wniosku','limited']]);
 }
 if(k==='msg'){
  if(s===0)return same(seq,a.sequence);
  if(s===1)return fields(form,[['Co potwierdzają wskaźniki prev/next?','chain'],['Co daje kontrola integralności?','unchanged']]);
  return fields(form,[['Identyfikator konta','account'],['Dane urządzenia','device']]);
 }
 if(k==='cctv'){
  if(s===0)return fields(form,Object.entries(a.offsets).map(([cam,n])=>['Kamera '+cam+': przesunięcie [s]',String(n)]));
  if(s===1)return same(seq,a.sequence);
  return fields(form,[['Znaczenie synchronizacji','order'],['Nieostry obraz','limited']]);
 }
 if(k==='forensic'){
  if(s===0)return a.classes.every((v,i)=>form['Ocena pary '+(i+1)]===v);
  if(s===1)return fields(form,[['Znaczenie kontroli','transfer'],['Wniosek przy podobnych wektorach','class']]);
  return fields(form,[['Ocena profilu urazów','multiple'],['Granica identyfikacji','limits']]);
 }
 if(k==='access'){
  if(s===0)return fields(form,[['Źródło obrazu','EVID_CCTV_SYNC'],['Źródło użycia karty','EVID_T17_DOOR_EVENT'],['Weryfikacja źródeł','independent']]);
  if(s===1){if(!same(seq,a.sequence))return false;return seq.slice(0,-1).every((point,i)=>{
   const n=Number(form['Odcinek '+(i+1)+' [s]']);const lim=a.legs[point+'|'+seq[i+1]]??a.legs[seq[i+1]+'|'+point];
   return Number.isFinite(n)&&lim!=null&&n>=lim&&n<=600;
  });}
  return fields(form,[['Wniosek z trasy','possible'],['Wideokonferencja bez kamery','session']]);
 }
 return false;
}
export function verifyPuzzle(state,action){
 const key=String(action.puzzle||'');const rule=canon.puzzles[key];if(!rule)return fail('unknown_puzzle');
 const s=action.stage;if(!Number.isInteger(s)||s<0||s>2)return fail('unknown_stage');
 const completed=state.puzzles?.[key]||0;
 if(s<completed)return {ok:true,state};
 if(s!==completed)return fail('stage_out_of_order');
 if(!Array.isArray(action.sequence)||action.sequence.length>12||!action.sequence.every(x=>validString(x,24))||!action.form||typeof action.form!=='object'||Array.isArray(action.form)||Object.keys(action.form).length>12||Object.entries(action.form).some(([k,v])=>!validString(k,100)||!validString(v,80)))return fail('invalid_puzzle_submission');
 if(!stageCorrect(key,s,action.sequence,action.form))return fail('puzzle_answer_not_verified');
 const puzzles={...(state.puzzles||{}),[key]:s+1};
 if(s!==2)return {ok:true,state:{...state,puzzles}};
 if(rule.inputs.some(id=>!has(state,id)))return fail('puzzle_evidence_prerequisite_missing');
 const approvedEvidence=[...new Set([...(state.approvedEvidence||[]),...rule.outputs])];
 return {ok:true,state:{...state,puzzles,approvedEvidence}};
}
export function verifyTimeline(state,action){
 const e=canon.timeline.find(x=>x.id===action.eventId);if(!e)return fail('unknown_timeline_event');
 const v=action.entry;
 if(!v||typeof v!=='object'||Array.isArray(v))return fail('invalid_timeline_entry');
 if(v.at!==e.at||String(v.to||'')!==e.to||v.place!==e.place)return fail('timeline_mismatch');
 if(!Array.isArray(v.sourceIds)||v.sourceIds.length<1||v.sourceIds.length>8||!v.sourceIds.some(id=>e.sources.includes(id)&&has(state,id))||v.sourceIds.some(id=>!e.sources.includes(id)||!has(state,id)))return fail('timeline_source_not_approved');
 // Nie zatwierdzamy zmyślonej identyfikacji osoby na podstawie samego rejestru.
 if(v.actor)return fail('timeline_person_not_verified');
 const reason=String(v.reason||'');if(reason.length<18||reason.length>1500)return fail('timeline_explanation_missing');
 const entry={at:e.at,to:e.to,place:e.place,sourceIds:[...new Set(v.sourceIds)]};
 return {ok:true,state:{...state,verifiedTimeline:{...(state.verifiedTimeline||{}),[e.id]:entry}}};
}
const groups={
 person:[['EVID_MESSAGE_THREAD_RECOVERED'],['EVID_MESSAGE_DEVICE_METADATA'],['EVID_CCTV_SYNC','ADM-04','VIS-08']],
 method:[['MED-04','MED-09','MED-10'],['LAB-08','LAB-09']],
 motive:[['EVID_ACCEPTANCE_RECORD','TEC-09'],['EVID_SERIAL_PHOTO','TEC-07','TEC-15']],
 alibi:[['EVID_CONFERENCE_SESSION'],['DIG-09'],['ADM-04','EVID_CCTV_SYNC']]
};
function safeLinks(state,links){
 if(!Array.isArray(links)||links.length>80||links.some(x=>!x||!roles.includes(x.role)||!rules.documents[x.id]||!has(state,x.id)))return null;
 return [...new Map(links.map(x=>[x.role+'|'+x.id,{role:x.role,id:x.id}])).values()];
}
function hasGroups(links,role){const ids=new Set(links.filter(x=>x.role===role).map(x=>x.id));return groups[role].every(g=>g.some(id=>ids.has(id)));}
const canonicalReason=r=>['person','method','proof','alibi'].every(k=>r?.[k]==='best');
const explainedReason=r=>['person','method','proof','alibi'].every(k=>{const t=String(r?.[k]||'').trim();if(t==='best')return true;const words=t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z]+/).filter(w=>w.length>2);return t.length>=85&&words.length>=12&&new Set(words).size>=8;});
function auditIndictment(state,ind){
 const ls=ind.links||[],docs=[...new Set(ls.map(x=>x.id))],families=new Set(docs.map(x=>rules.documents[x]?.family||x));
 return {timeline:!!state.verifiedTimeline?.e16&&!!state.verifiedTimeline?.e17,
  scene:['MED-02','VIS-02','ADM-13'].some(id=>has(state,id)),
  roles:roles.every(role=>hasGroups(ls,role)),sources:docs.length>=9&&families.size>=7,
  explanation:explainedReason(ind.reasons),correctPerson:ind.culprit==='MAGDALENA',
  mechanism:ind.method==='two_stage',alibi:ind.alibi==='remote_not_presence',
  keystone:['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA'].includes(ind.keystone)};
}
export function fileIndictment(state,action){
 const f=action.indictment;if(!f||typeof f!=='object'||!names.includes(f.culprit)||!branches.includes(f.qualification)||!validString(f.method,35)||!validString(f.alibi,50)||!validString(f.keystone,70))return fail('invalid_indictment');
 const links=safeLinks(state,f.links);if(!links)return fail('unapproved_evidence_link');
 if(!has(state,f.keystone)||!links.some(x=>x.role==='person'&&x.id===f.keystone))return fail('key_evidence_not_linked');
 // Akt można złożyć także ze słabszym materiałem — nie zwiększamy poziomu trudności.
 // Brakujące warunki wpływają na wynik, a nie na możliwość przedstawienia tezy.
 if(!f.reasons||Object.values(f.reasons).some(x=>!validString(x,4000)))return fail('invalid_indictment_reasons');
 const indictment={culprit:f.culprit,qualification:f.qualification,method:f.method,alibi:f.alibi,keystone:f.keystone,links,reasons:Object.fromEntries(['person','method','proof','alibi'].map(k=>[k,String(f.reasons[k]||'').slice(0,4000)]))};
 if(JSON.stringify(state.indictment)===JSON.stringify(indictment))return {ok:true,state};
 return {ok:true,state:{...state,indictment,defense:{},verdict:null}};
}
// Odpowiedzi na zarzuty są oceniane z dozwolonych źródeł i strategii na serwerze.
// Uproszczony, jawny model kategorii nie może wystawić skazania na podstawie tekstu klienta.
const defenseGroups={
 accident:[['MED-04','MED-09','MED-10'],['LAB-08']],
 contract:[['EVID_ACCEPTANCE_RECORD','TEC-09'],['EVID_SERIAL_PHOTO','TEC-07','TEC-15'],['EVID_MESSAGE_THREAD_RECOVERED']],
 message:[['EVID_MESSAGE_THREAD_RECOVERED'],['EVID_MESSAGE_DEVICE_METADATA'],['EVID_CCTV_SYNC','ADM-04','VIS-08']],
 card:[['EVID_T17_DOOR_EVENT'],['EVID_RESOURCE_HANDOVER','ADM-07'],['VIS-08','EVID_CCTV_SYNC','ADM-04','VIS-09']],
 remote:[['EVID_CONFERENCE_SESSION'],['DIG-09'],['ADM-04','EVID_CCTV_SYNC']],
 traces:[['LAB-07','LAB-09'],['LAB-10','LAB-08'],['EVID_MESSAGE_THREAD_RECOVERED','ADM-04','EVID_CCTV_SYNC']]
};
const defenseStrategy={accident:1,contract:2,message:1,card:3,remote:0,traces:1};
const alternateDefense={
 accident:{routes:[['MED-04','LAB-08'],['MED-10','LAB-05']],correct:[0,2]},
 contract:{routes:[['EVID_ACCEPTANCE_RECORD','EVID_MESSAGE_THREAD_RECOVERED','TEC-15'],['TEC-09','EVID_SERIAL_PHOTO','EVID_MESSAGE_DEVICE_METADATA']],correct:[0,3]},
 message:{routes:[['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','EVID_CCTV_SYNC'],['DIG-04','DIG-05','ADM-04']],correct:[1,4]},
 card:{routes:[['EVID_T17_DOOR_EVENT','EVID_RESOURCE_HANDOVER','VIS-09'],['ADM-12','ADM-07','EVID_CCTV_SYNC']],correct:[1,3]},
 remote:{routes:[['EVID_CONFERENCE_SESSION','DIG-09','ADM-04'],['DIG-10','VIS-10','EVID_CCTV_SYNC']],correct:[2,4]},
 traces:{routes:[['LAB-07','LAB-10','EVID_MESSAGE_THREAD_RECOVERED'],['LAB-09','LAB-08','ADM-04']],correct:[1,3]}
};
export function recordDefense(state,action){
 if(!state.indictment)return fail('indictment_not_approved');
 const id=String(action.objection||'');if(!defenseGroups[id]||!relevant[state.indictment.qualification].includes(id))return fail('objection_not_applicable');
 if(action.mode==='ps54'){
  const route=alternateDefense[id]?.routes[action.route];
  if(!route||!alternateDefense[id].correct.includes(action.answer)||!['compare','limits'].includes(action.method)||route.some(x=>!has(state,x)))return fail('defense_route_not_verified');
  const families=new Set(route.map(x=>rules.documents[x]?.family||x));if(families.size<2)return fail('defense_sources_not_independent');
  return {ok:true,state:{...state,defense:{...(state.defense||{}),[id]:{sources:route,mode:'ps54'}}}};
 }
 const ids=action.sourceIds;
 if(!Array.isArray(ids)||ids.length>12||ids.some(x=>typeof x!=='string'||!has(state,x)))return fail('unapproved_defense_source');
 const source=new Set(ids);
 if(!defenseGroups[id].every(g=>g.some(x=>source.has(x))))return fail('defense_sources_incomplete');
 if(action.reason!=='best'||action.strategy!==defenseStrategy[id])return fail('defense_reason_not_verified');
 return {ok:true,state:{...state,defense:{...(state.defense||{}),[id]:{sources:[...source]}}}};
}
export function decideVerdict(state,action){
 if(!state.indictment)return fail('indictment_not_approved');
 if(action.verdict||action.kind||action.outcome)return fail('client_verdict_not_accepted');
 if(state.verdict?.serverApproved)return {ok:true,state};
 const ind=state.indictment,need=relevant[ind.qualification];
 const defended=need.filter(x=>!!state.defense?.[x]).length,review=auditIndictment(state,ind);
 const strong=review.timeline&&review.scene&&review.roles&&review.sources&&review.explanation&&review.correctPerson&&review.mechanism&&review.alibi&&review.keystone;
 // Typ jest wyliczony tylko z zatwierdzonego na serwerze materiału.
 let kind='returned',label='Zwrot do uzupełnienia';
 if(ind.qualification==='planned'){kind='returned';label='Wcześniejszy zamiar nieudowodniony';}
 else if(ind.qualification==='intentional'){
  if(strong&&defended>=5){kind='solid';label='Oskarżenie utrzymane po kontroli';}
  else if(defended>=2){kind='returned';label='Dalsze wyjaśnienia wymagane';}
  else{kind='acquittal';label='Nie wykazano dostatecznych podstaw';}
 } else if(defended<2){kind='weak';label='Materiał niepełny';}
 const verdict={kind,label,qualification:ind.qualification,assessedPerson:ind.culprit,defensePassed:defended,defenseTotal:need.length,review,serverApproved:true};
 return {ok:true,state:{...state,verdict}};
}
export function validateProgress618(state,action){
 if(action.type==='verify_puzzle_stage')return verifyPuzzle(state,action);
 if(action.type==='verify_timeline')return verifyTimeline(state,action);
 if(action.type==='file_indictment')return fileIndictment(state,action);
 if(action.type==='defend_objection')return recordDefense(state,action);
 if(action.type==='request_verdict')return decideVerdict(state,action);
 return null;
}
