/** Durable declarations, not facts. Included in the same approved-state CAS as each reply. */
import {createHash} from 'node:crypto';
import {registry,allAuthorisedKnowledge} from './witness-engine-rc22.js';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,24);
const normal=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const clean=s=>String(s||'').slice(0,1600);
const expanded=(state,event)=>event.receiptId&&state.interviewReceipts?.[event.receiptId]?{...event,question:state.interviewReceipts[event.receiptId].question,reply:state.interviewReceipts[event.receiptId].text}:event;
const stored=(state,event)=>state.interviewReceipts?.[event.id]?(({question,reply,...rest})=>({...rest,receiptId:event.id}))(event):event;
export function migrateWitnessLedger(state,id){
 const existing=state?.witnessLedgers?.[id];if(existing?.schema===2)return existing;
 const events=[],seen=new Set();let sequence=0;
 const history=state?.witnesses?.[id]||[];
 const recent=[];
 for(let i=1;i<history.length;i++){
  const q=history[i-1],a=history[i];
  if(q?.role!=='player'||a?.role!=='witness'||a.narrativeStatus==='offline_unverified')continue;
  const eventId=a.turnId||'legacy-'+hash(id+'|'+i+'|'+q.text+'|'+a.text);
  recent.push({id:eventId,sequence:++sequence,question:clean(q.text),reply:clean(a.text),status:'legacy-reported-statement',knowledgeIds:[],provenance:'legacy-transcript; transient fact IDs cannot be resolved safely'});seen.add(eventId);
 }
 // Old receipts have no reliable timestamps. Preserve them without inventing their order.
 for(const [key,receipt] of Object.entries(state?.interviewReceipts||{}))if(receipt.witnessId===id&&!seen.has(key)){
  events.push({id:key,sequence:null,question:clean(receipt.question),reply:clean(receipt.text),status:'legacy-reported-statement',knowledgeIds:[],provenance:'legacy-receipt-order-unknown'});
 }
 events.push(...recent);
 const references=events.map(e=>stored(state,e));
 return {schema:2,nextSequence:sequence+1,events:references};
}
export function appendLedgerTurn(state,id,question,reply,narrativeStatus,meta={}){
 const current=migrateWitnessLedger(state,id);
 const eventId=meta.turnId||'local-'+hash(id+'|'+current.nextSequence+'|'+question+'|'+reply);
 if(current.events.some(e=>e.id===eventId))return current;
 const allowed=new Map(allAuthorisedKnowledge(id,state.approvedEvidence||registry.rules.initial).map(f=>[f.id,f]));
 const ids=[...new Set(Array.isArray(meta.knowledgeIds)?meta.knowledgeIds:[])].filter(key=>allowed.has(key)).slice(0,4);
 const sources=ids.map(key=>allowed.get(key));
 const documentRefs=(Array.isArray(meta.documentRefs)?meta.documentRefs:[]).filter(d=>d&&d.id===meta.evidenceId&&(state.approvedEvidence||[]).includes(d.id)&&registry.documentRevisions[d.id]===d.revision).slice(0,4);
 const correction=sources.some(f=>f.source==='trusted-correction'||f.kind==='authorized-personal-correction');
 const verbatimCorrection=correction&&sources.some(f=>(f.source==='trusted-correction'||f.kind==='authorized-personal-correction')&&normal(f.text)===normal(reply));
 const text=normal(reply);
 const status=correction?'authorized-correction-source-used':
  /czy chodzi|kogo masz na myśli|co masz na myśli|proszę doprecyzować/.test(text)&&String(reply).includes('?')?'clarification-request':
  /nie wiem|nie pamiętam|nie potrafię|nie mogę potwierdzić/.test(text)?'reported-knowledge-limit':'reported-statement';
 const event={id:eventId,sequence:current.nextSequence,question:clean(question),reply:clean(reply),status,
  verbatimCorrection,knowledgeIds:ids,documentRefs,evidenceId:meta.evidenceId||null,provenance:'server-accepted-reply-not-new-case-fact'};
 const events=current.events.map(e=>verbatimCorrection&&normal(expanded(state,e).question)===normal(question)&&!e.supersededBy?{...e,supersededBy:eventId}:e);
 events.push(meta.turnId?(({question,reply,...rest})=>({...rest,receiptId:meta.turnId}))(event):event);
 return {schema:2,nextSequence:current.nextSequence+1,events};
}
export function ledgerContext(state,id,question){
 const journal=migrateWitnessLedger(state,id);
 const ledger={...journal,events:journal.events.map(e=>expanded(state,e))},q=normal(question);
 const tokens=new Set(q.match(/[\p{L}\d]{4,}/gu)||[]);
 const ordered=ledger.events.filter(e=>e.sequence!==null);
 const recentIds=new Set(ordered.slice(-3).map(e=>e.id));
 const related=ledger.events.filter(e=>!recentIds.has(e.id)).map(e=>({e,score:[...tokens].filter(w=>normal(e.question+' '+e.reply).includes(w)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.e);
 const corrections=ledger.events.filter(e=>e.status==='authorized-correction-source-used').slice(-2);
 return {authority:'durable-reported-declarations-not-facts',totalDeclarations:ledger.events.length,
  recent:ordered.slice(-3),earlierRelated:related,corrections,
  note:'Odtwórz wcześniejszą deklarację po identyfikatorze. Jej treść nie rozszerza factBank. Nieznana kolejność starych pokwitowań pozostaje nieznana.'};
}
// A stale generated reply must not be rebased onto a changed conversation.
export function witnessRevisionSignature(state,id){
 const rows=(state?.witnesses?.[id]||[]).map(r=>[r.role,r.text,r.narrativeStatus||'',r.turnId||'']);
 const ledger=state?.witnessLedgers?.[id];
 const events=(ledger?.events||[]).map(e=>[e.id,e.sequence,e.status,e.supersededBy||'',e.knowledgeIds||[]]);
 return hash(JSON.stringify([rows,ledger?.nextSequence||0,events]));
}
