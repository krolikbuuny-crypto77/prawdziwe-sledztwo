/** Stage I 6.36: dialogue-only, bounded memory derived exclusively from server testimony.
 * A witness's old answer (including a scripted correction) is NOT evidence or a factBank entry.
 * This module never classifies new question intent or changes story/progression state.
 */
import {foldQuestion} from './question-intent-633.js';
const safe=s=>String(s||'').replace(/[<>\u0000-\u001f]/g,' ').trim();
const normalize=s=>foldQuestion(safe(s)).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const repeatRequest=/(?:powtorz|przypomnij|jeszcze raz|to samo|potwierdz.*ponownie|czy dobrze rozumiem)/;
const unanswered=/(?:nie wiem|nie pamietam|nie moge potwierdz|nie potrafie|nie widzial|nie bylam|nie bylem|nie jestem pew|nie znam)/;
export function permitsRestatement(question,previousQuestion=''){
 const q=normalize(question);
 return q===normalize(previousQuestion)||repeatRequest.test(q);
}
function pairHistory(rows){
 const pairs=[];
 for(let i=1;i<rows.length;i++){
  const a=rows[i-1],b=rows[i];
  if(a?.role!=='player'||b?.role!=='witness'||typeof a.text!=='string')continue;
  const unverified=b.narrativeStatus==='offline_unverified';
  pairs.push({question:safe(a.text).slice(0,450),
   answer:unverified?'[Odpowiedź lokalna niezweryfikowana]':safe(b.text).slice(0,420),
   status:unverified?'offline_unverified':b.narrativeStatus==='scripted_correction'?'scripted_correction':'reported_statement'});
 }
 return pairs;
}
export function buildDialogueMemory(approvedTranscript=[],question=''){
 const rows=Array.isArray(approvedTranscript)?approvedTranscript.slice(-48):[];
 const pairs=pairHistory(rows);
 const recent=pairs.slice(-5);
 const recentQuestions=pairs.slice(-9).map(p=>p.question.slice(0,180));
 const last=pairs.at(-1);
 const normalCurrent=normalize(question);
 const earlier=pairs.slice(0,-5).reverse().find(p=>{
  const past=normalize(p.question),tokens=new Set(past.split(' ').filter(x=>x.length>4));
  return !p.status.includes('offline')&&tokens.size&&[...tokens].some(t=>normalCurrent.includes(t));
 });
 const corrections=pairs.filter(p=>p.status==='scripted_correction').slice(-2).map(p=>({question:p.question.slice(0,180),answer:p.answer.slice(0,260),status:'previous_scripted_correction'}));
 const missing=recent.filter(p=>p.status!=='offline_unverified'&&unanswered.test(normalize(p.answer))).slice(-3).map(p=>p.question.slice(0,180));
 return {
  type:'reported-dialogue-not-facts',
  totalPairs:pairs.length,
  repeatRequested:permitsRestatement(question,last?.question||''),
  lastQuestion:last?.question||'',
  previousPairs:recent,
  earlierRelated:earlier?{question:earlier.question.slice(0,180),answer:earlier.answer.slice(0,260),status:earlier.status}:null,
  openQuestions:missing,
  corrections,
  // All previous utterances are reported statements, never additional approved facts.
  note:'To pamięć tego, co powiedziano, NIE źródło faktów. Każdy nowy fakt musi pochodzić z factBank.'
 };
}
export function priorDistinctAnswers(dialogueMemory,question){
 if(!dialogueMemory||dialogueMemory.repeatRequested)return [];
 return (dialogueMemory.previousPairs||[]).filter(p=>p.status!=='offline_unverified'&&!permitsRestatement(question,p.question))
  .slice(-4).map(p=>({question:p.question,answer:p.answer}));
}
