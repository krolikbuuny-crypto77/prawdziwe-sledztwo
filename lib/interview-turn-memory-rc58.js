/** RC58. Exact, ordered dialogue is NOT a canon fact source.
 * Build solely from server CAS ledgers + receipts; never from browser memory.
 * Legacy receipts without order cannot be used to assert which answer was first.
 */
import {migrateWitnessLedger} from './witness-ledger-rc22.js';
import {foldQuestion} from './question-intent-633.js';
const folded=s=>foldQuestion(String(s||'')).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const compact=s=>String(s||'').replace(/[\u0000-\u001f<>]/g,' ').trim();
export function recallReference(question){
 const q=folded(question);
 const speech=/(?:powiedzial|powiedzialem|mowi\w*|odpowiedzial|odpowiedz|zeznal|wypowied|slowa|przypomnij|powtorz|pamietasz|zacytuj)/.test(q);
 const conversation=/(?:rozmow|pytani|turze|wczesniej|przed chwil|poprzednio|poczatku|pierwsz\w*|ostatni\w*|poprzedni\w*)/.test(q);
 if(!speech||!conversation)return null;
 if(/\b(?:pierwsz\w*|poczatku|na samym poczatku)\b/.test(q))return {kind:'first'};
 const numeric=q.match(/(?:w|z|na|podczas) (?:turze|tur\w*|pytaniu|odpowiedzi)\s*(\d{1,5})\b/);
 if(numeric)return {kind:'sequence',sequence:Number(numeric[1])};
 if(/\b(?:poprzedni\w*|przed chwil\w*|ostatni\w*)\b/.test(q))return {kind:'previous'};
 if(/\b(?:wczesniej|dotychczas|tej rozmowie)\b/.test(q))return {kind:'earlier'};
 return null;
}
export function serverTurnMemory(state,witnessId,question='',factBank=[]){
 const ledger=migrateWitnessLedger(state||{},witnessId);
 const receipts=state?.interviewReceipts||{};
 const legacyWithoutLedger=!state?.witnessLedgers?.[witnessId] && (state?.witnesses?.[witnessId]||[]).length>=80;
 const unknownOrder=legacyWithoutLedger||ledger.events.some(e=>e.sequence===null);
 const turns=ledger.events.filter(e=>Number.isSafeInteger(e.sequence)&&e.sequence>0).map(e=>{
  const receipt=e.receiptId?receipts[e.receiptId]:null;
  const questionText=receipt?.question??e.question;
  const answerText=receipt?.text??e.reply;
  if(typeof questionText!=='string'||typeof answerText!=='string')return null;
  return {turnId:e.id,sequence:e.sequence,question:compact(questionText),answer:compact(answerText),
   status:e.status,source:'server_accepted_testimony_not_canon',questionTurnId:e.questionTurnId||e.id+':q'};
 }).filter(Boolean).sort((a,b)=>a.sequence-b.sequence);
 const seen=new Set(ledger.events.flatMap(e=>Array.isArray(e.knowledgeIds)?e.knowledgeIds:[]));
 const corrections=ledger.events.filter(e=>e.verbatimCorrection===true||e.supersededBy).map(e=>({turnId:e.id,sequence:e.sequence||null,status:'server_reported_correction_not_case_truth'})).slice(-8);
 const suspectedConflicts=turns.filter(t=>/(?:kłamiesz|kłamstwo|sprzeczn\w*|to nieprawda|nie wierzę|prostuj)/i.test(t.question))
  .map(t=>({turnId:t.turnId,sequence:t.sequence,status:'player_challenge_unverified'})).slice(-8);
 const ref=recallReference(question);
 let selected=null;
 if(ref){
  if(ref.kind==='first'&&!unknownOrder)selected=turns[0]||null;
  if(ref.kind==='previous')selected=turns.at(-1)||null;
  if(ref.kind==='sequence')selected=turns.find(t=>t.sequence===ref.sequence)||null;
  if(ref.kind==='earlier'){
   // Generic earlier references without a unique topic are ambiguous. Never
   // silently substitute the latest answer or a loose summary as an exact quote.
   const omit=new Set(['powiedziales','mowiles','wczesniej','poczatku','poprzednia','pierwsza','rozmowy','przypomnij','odpowiedz','wypowiedz','ktory','ktore','jakie','co','jak','twoje','twoja','pan','pani','temat','dokladnie','powtorz','bylo','byles','wczesniejsze']);
   const words=folded(question).split(' ').filter(t=>t.length>3&&!omit.has(t));
   const rated=turns.map(t=>({t,score:words.filter(w=>folded(t.question+' '+t.answer).split(' ').some(x=>x.startsWith(w)||w.startsWith(x))).length})).sort((a,b)=>b.score-a.score);
   if(rated[0]?.score>0&&(!rated[1]||rated[0].score>rated[1].score))selected=rated[0].t;
  }
 }
 return {authority:'server_accepted_turns_only_not_case_facts',witnessId,count:ledger.events.length,
  ordered:!unknownOrder,reference:ref,selected,
  first:!unknownOrder?turns[0]||null:null,
  recent:turns.slice(-5).map(t=>({sequence:t.sequence,turnId:t.turnId,question:t.question.slice(0,220),answer:t.answer.slice(0,700)})),
  timelineSummary:turns.slice(-12).map(t=>({sequence:t.sequence,questionTurnId:t.questionTurnId,answerTurnId:t.turnId,
    questionExcerpt:t.question.slice(0,100),answerExcerpt:t.answer.slice(0,140)})),
  confirmedCanonicalContradictions:[], // only the rule engine may establish case truth
  recordedCorrections:corrections,suspectedContradictions:suspectedConflicts,
  revealedKnowledgeIds:[...seen].slice(-40),
  unrevealedKnowledgeCount:Array.isArray(factBank)?factBank.filter(f=>f.stableId&&!seen.has(f.stableId)).length:0,
  knownButNotDisclosedIds:Array.isArray(factBank)?factBank.filter(f=>f.stableId&&!seen.has(f.stableId)).map(f=>f.stableId).slice(0,36):[],
  uncertainLegacyOrder:unknownOrder,
  note:'Zeznania są dosłowną historią pytań i odpowiedzi, NIE rozszerzają faktów postaci. Nie rekonstruuj pierwszej tury z późniejszego streszczenia.'};
}
export function exactRecallReply(memory){
 if(!memory?.reference)return null;
 if(!memory.selected)return {ok:false,reason:memory.uncertainLegacyOrder?'legacy_chronology_unverified':'prior_turn_not_available'};
 const t=memory.selected;
 // The spoken words are reused exactly. No extrapolation about the incident.
 const exact=t.answer;
 if(!exact)return {ok:false,reason:'prior_turn_not_available'};
 const feminine=['ELZBIETA','MAGDALENA'].includes(memory.witnessId);
 const head=t.sequence===1?`Na początku ${feminine?'odpowiedziałam':'odpowiedziałem'}: `:`W odpowiedzi numer ${t.sequence} ${feminine?'powiedziałam':'powiedziałem'}: `;
 // If unusually long, disclose that this is an excerpt, never pretend it is the entire quote.
 if(head.length+exact.length+2>1450)return {ok:true,text:`${head}„${exact.slice(0,1330)}…” (początek cytatu)`,quotedTurnId:t.turnId,sequence:t.sequence,excerpt:true};
 return {ok:true,text:`${head}„${exact}”`,quotedTurnId:t.turnId,sequence:t.sequence,excerpt:false};
}
/** Narrow, literal chronology guard. It never treats a recalled statement as case truth. */
export function chronologyAttributionIssue(memory,answer){
 if(!memory||typeof answer!=='string')return null;
 const first=/(?:na pocz[aą]tku (?:tej )?rozmowy|w pierwszej (?:odpowiedzi|wypowiedzi)|powiedzia[lł][ae]m na pocz[aą]tku)/i.test(answer);
 const previous=/(?:w poprzedniej odpowiedzi|w poprzedniej wypowiedzi|przed chwil[aą] (?:powiedzia[lł][ae]m|m[oó]wi[lł][ae]m)|ostatnio (?:powiedzia[lł][ae]m|m[oó]wi[lł][ae]m))/i.test(answer);
 const numbered=answer.match(/\bw odpowiedzi (?:numer|nr)\s*(\d{1,5})\b/i);
 if(!first&&!previous&&!numbered)return null;
 let turn=null;
 let issue='invented_prior_quote';
 if(first)turn=memory.first;
 else if(previous){
  turn=memory.reference?.kind==='previous'&&memory.selected?memory.selected:null;
  if(!turn){const recent=memory.recent||[];turn=recent.at(-1)||null;}
 }else if(numbered){
  const seq=Number(numbered[1]);
  turn=memory.selected?.sequence===seq?memory.selected:
   (memory.recent||[]).find(t=>t.sequence===seq)||null;
 }
 // Unknown chronology cannot authorize a quote, but rejection is handled by
 // exactRecallReply for an explicit recall request. The guard itself abstains.
 if(!turn)return null;
 const baseline=folded(turn.answer);
 const quotes=[...answer.matchAll(/[„"]([^”"]{12,})[”"]/g)].map(m=>m[1]);
 for(const quote of quotes)if(!baseline.includes(folded(quote)))return issue;
 const referenceTimes=new Set((turn.answer.match(/\b\d{1,2}:\d{2}\b/g)||[]));
 const claimedTimes=(answer.match(/\b\d{1,2}:\d{2}\b/g)||[]);
 if(claimedTimes.some(n=>!referenceTimes.has(n)))return first?'invented_prior_time':'invented_prior_time';
 return null;
}
