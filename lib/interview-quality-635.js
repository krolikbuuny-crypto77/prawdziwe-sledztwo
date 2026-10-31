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
 // Narrow output checks supplement semantic AI review; they do not select facts or write replies.
 const corroboration=/\bkto\b.{0,65}\b(?:potwierdz|poswiadcz|widzial)/.test(q)||/\bczy ktos\b.{0,40}\bwidzial/.test(q);
 const observationLimit=/\b(?:nie mam|nie znam|nie potrafie wskazac|nie moge wskazac|nie wskaze|nikt|nikogo|zadn\w*)\b.{0,65}\b(?:swiadk|osob|czlowiek|widzial)/.test(a)||/\b(?:nikt|nikogo)\b/.test(a)||/\b(?:telefon|polaczeni|rejestr)\w*\b.{0,75}\bnie potwierdza/.test(a);
 const namedPerson=(scene.knowledge?.factBank||selected).some(f=>{
  const names=String(f.text||'').match(/\b[A-ZŁŚŻŹĆŃÓ][a-ząćęłńóśźż]+\s+[A-ZŁŚŻŹĆŃÓ][a-ząćęłńóśźż]+\b/g)||[];
  return names.some(name=>!/^Lena Rudnicka$/.test(name)&&String(text).includes(name));
 });
 if(corroboration&&/rejestr|polaczen|sluzby biurowe/.test(a)&&!observationLimit&&!namedPerson)
  return {ok:false,reason:'corroboration_nonanswer'};
 if(/\b(?:znany mi byl pracownik|znalem pracownika)\b.{0,35}\blena/.test(a))
  return {ok:false,reason:'victim_gender_mismatch'};
 const relationship=selected.find(f=>f.source==='trusted-relationship'||/lena (?:miala|zglaszala) zastrzezenia/.test(compact(f.text)));
 const reportingVerb='(?:zglaszalem|zglaszalam|zglosilem|zglosilam)';
 const positiveReporting=a.replace(new RegExp('\\bnie\\s+'+reportingVerb+'\\b','g'),'zaprzeczenie');
 if(relationship&&/lena|zglaszala/.test(compact(relationship.text))&&/(?:zglaszala|miala) zastrzezenia/.test(compact(relationship.text))&&
   new RegExp('\\b'+reportingVerb+'\\b.{0,40}\\bzastrzez').test(positiveReporting))
  return {ok:false,reason:'relationship_actor_reversed'};
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
  reason:reason==='corroboration_nonanswer'?'Pytanie dotyczy OSOBY potwierdzającej obecność. Wskaż osobę tylko jeśli wynika z faktów; inaczej powiedz konkretnie, że nie możesz wskazać takiego świadka. Rejestry i telefon nie zastępują osobistej obserwacji.':
   reason==='relationship_actor_reversed'?'Odwrócono wykonawcę czynności. Wskazane źródło mówi, że Lena zgłaszała zastrzeżenia. Nie przypisuj tej czynności rozmówcy.':
   reason==='victim_gender_mismatch'?'Lena Rudnicka jest kobietą: użyj poprawnego rodzaju i naturalnego zdania.':
   reason==='relationship_nonanswer'?'Odpowiedź nie określa relacji z Leną, mimo zatwierdzonych faktów o niej.':(['semantic_repetition','repeated_previous_reply'].includes(reason)?'Wypowiedź powiela sens poprzedniej odpowiedzi na inne pytanie.':
   ['bad_fact_ids','invalid_decision','missing_fact_ids','fact_ids_count','fact_ids_type','duplicate_fact_ids','unknown_fact_ids'].includes(reason)?'Wybierz od jednego do czterech ISTNIEJĄCYCH identyfikatorów faktów z dostępnego factBank. Bez dopisywania wiedzy.':
   reason==='poor_style'?'Zapisz poprawne, krótkie zdanie w pierwszej osobie, bez didaskaliów i niepotrzebnych znaków.':
   reason==='missing_question_part'?'Udziel odpowiedzi na każdą część pytania. Jeżeli nie znasz szczegółu, powiedz to bez wymyślania faktów.':
   reason==='hard_guard'?'Nie dodawaj żadnych liczb, godzin ani przyznania się, których nie ma w wskazanych źródłach.':
   ['not_entailed','not_relevant','not_complete'].includes(reason)?'Zaproponowana wypowiedź nie wynika w pełni z wybranych faktów albo nie odpowiada na oryginalne pytanie. Spróbuj ponownie, na podstawie autoryzowanych factIds.':
   'Poprzednia propozycja pomija okazany dowód lub jest nietrafna.'),
  previousDraft:String(prior||'').slice(0,350),
  instruction:'Odpowiedz na NOWY szczegół pytania, nie tylko innymi słowami na wcześniejszy temat. Zaznacz konkretnie granicę wiedzy, jeśli brak faktu; nie dopisuj zdarzeń, nie zmieniaj wcześniejszych sprostowań.',
  presentedEvidenceId:scene.presentedEvidence?.id||null
};}
