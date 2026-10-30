/** 6.35: independent answer quality gate, not a second intent classifier.
 * No evidence unlocks or story decisions are made here.
 */
import {foldQuestion} from './question-intent-633.js';
const compact=s=>foldQuestion(String(s||'')).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const words=s=>new Set(compact(s).split(' ').filter(x=>x.length>3));
function overlap(a,b){const x=words(a),y=words(b);if(!x.size||!y.size)return 0;
 let shared=0;for(const w of x)if(y.has(w))shared++;return shared/Math.max(x.size,y.size);}
export function reviewInterviewReply(scene,text,selected=[]){
 const a=compact(text),q=compact(scene.question),history=scene.memory?.conversation||[];
 const witnesses=history.filter(x=>['świadek','witness'].includes(x.role)&&x.text).slice(-4);
 const players=history.filter(x=>['śledczy','player','investigator'].includes(x.role)&&x.text);
 const previousQuestion=compact(players.at(-1)?.text);
 // Exact repetition to a genuinely different question is never a useful new answer.
 if(previousQuestion&&previousQuestion!==q&&witnesses.some(x=>{const b=compact(x.text);return b.length>32&&(b===a||overlap(b,a)>0.94);})){
  return {ok:false,reason:'repeated_previous_reply'};
 }
 // Pusta tautologia nie odpowiada na pytanie o relację świadka z ofiarą.
 // Nadal dopuszczamy świadomą, uzasadnioną niewiedzę, jeśli wynika z dostępnych faktów.
 if(scene.questionPlan?.primary==='relationship'&&
   /\b(?:nie wiem|nie pamietam|nie potrafie (?:powiedziec|okreslic)|nie umiem (?:powiedziec|okreslic))\b.{0,55}\bkim\s+(?:byla|byl)\b/.test(a)&&
   /\b(?:ofiara|ofiary|ofiare|dla mnie|dla nas|lena)\b/.test(a))
  return {ok:false,reason:'relationship_nonanswer'};
 const evidence=scene.presentedEvidence;
 if(evidence){
  // The evidence ID is signed off by the server, not inferred from phrasing.
  const docSources=selected.filter(f=>f.source==='document-'+evidence.id);
  if(!docSources.length)return {ok:false,reason:'presented_evidence_ignored'};
  const title=compact(evidence.title);
  const photographic=/fotografi|zdjecie/.test(title);
  const print=/rejestr|wydruk|wykaz|dziennik|ksi[eę]g|log/.test(title);
  if(photographic&&/to jest wydruk godzin|to jest rejestr wejs|ten wydruk|ten rejestr/.test(a))return {ok:false,reason:'wrong_document_type'};
  if(print&&/to jest zdjecie|ta fotografia/.test(a))return {ok:false,reason:'wrong_document_type'};
  if(photographic&&!/fotografi|zdjec|kadr|oslon|nisz|ten material|tego materialu/.test(a))return {ok:false,reason:'photograph_not_addressed'};
 }
 return {ok:true,reason:'grounded'};
}
export function repairCue(scene,prior,reason="quality_rejected"){return {
  reason:reason==='relationship_nonanswer'?'Odpowiedź nie określa relacji z Leną, mimo zatwierdzonych faktów o niej.':(['semantic_repetition','repeated_previous_reply'].includes(reason)?'Wypowiedź powiela sens poprzedniej odpowiedzi na inne pytanie.':'Poprzednia propozycja pomija okazany dowód lub jest nietrafna.'),
  previousDraft:String(prior||'').slice(0,350),
  instruction:'Odpowiedz na NOWY szczegół pytania, nie tylko innymi słowami na wcześniejszy temat. Zaznacz konkretnie granicę wiedzy, jeśli brak faktu; nie dopisuj zdarzeń, nie zmieniaj wcześniejszych sprostowań.',
  presentedEvidenceId:scene.presentedEvidence?.id||null
};}
