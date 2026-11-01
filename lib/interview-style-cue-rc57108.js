/** RC57.10.9: style-only reminder based on approved witness replies.
 * Never uses player allegations, retrieved docs or model drafts as instructions/facts.
 * Does not change facts, fact IDs, evidence, generation count or audit path.
 */
import {isExplicitRecallQuestion} from './dialogue-memory-636.js';
const stock=Object.freeze([
 ['nie odtwarzam kolejności','nie odtwarzam kolejności'],
 ['nie odtwarzam ich kolejności','nie odtwarzam ich kolejności'],
 ['co do minuty','co do minuty'],
 ['od tego jest rejestr wejść','od tego jest rejestr wejść'],
 ['na podstawie własnej pamięci','na podstawie własnej pamięci'],
 ['z własnej pamięci potwierdzam','z własnej pamięci potwierdzam'],
 ['dokładnych minut nie pamiętam','dokładnych minut nie pamiętam'],
 ['nie potrafię ustalić z własnej pamięci','nie potrafię ustalić z własnej pamięci']
]);
const normal=s=>String(s||'').normalize('NFC').toLocaleLowerCase('pl').replace(/\s+/g,' ').trim();
export function interviewStyleCue(scene){
 // The production generator receives compactInterviewPayload(scene), which omits
 // approvedThreadHistory but preserves the approved conversation window.
 const history=Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory:
  Array.isArray(scene?.memory?.conversation)?scene.memory.conversation:
  Array.isArray(scene?.conversation)?scene.conversation:[];
 const previous=history.filter(x=>['witness','świadek'].includes(x?.role)&&typeof x.text==='string').slice(-8);
 const spoken=previous.map(x=>normal(x.text));
 const used=stock.filter(([needle])=>spoken.some(s=>s.includes(needle))).map(([,phrase])=>phrase).slice(0,5);
 const openingRecall=isExplicitRecallQuestion(scene?.question)&&previous.length>0;
 const question=normal(scene?.question);
 // Only a conversational instruction. The actual earlier reply stays labelled
 // as prior testimony, never a newly verified fact or a document.
 const focus=openingRecall?'recount_previous_words':
  /sprostow|poprawi|wycof|zmieniasz zeznan/.test(question)?'correction':
  /skad|zrodlo|przypuszcz/.test(question)?'source_of_knowledge':
  /kto.{0,60}potwierdz/.test(question)?'corroboration':
  /gdzie|obecnosc|pobyt/.test(question)?'whereabouts':'current_question';
 const instruction={
  recount_previous_words:'To prośba o przypomnienie Twoich zatwierdzonych słów w tej rozmowie: krótko przywołaj ich sens (najpierw odpowiedź „Tak” lub równoważna). Nie powtarzaj chronologii całej nocy, nie zgaduj i nie zastępuj pamięci rozmowy niewiedzą o dokładnych godzinach. Wypowiedź z historii nie jest nowym dowodem — wybierz tylko zgodne fakty z factBank.',
  correction:'Powiedz jasno, czy zmieniasz wcześniejszą wypowiedź. Nie recytuj na nowo całej swojej zmiany, jeśli niczego nie prostujesz.',
  source_of_knowledge:'Krótko odróżnij to, co pamiętasz, od tego, co wnioskujesz lub znasz z dokumentu. Nie wymyślaj źródeł.',
  corroboration:'Wskaż tylko rzeczywistych świadków konkretnych czynności z faktów; nie przepisuj całego alibi.',
  whereabouts:'Nazwij znane miejsce i granicę dokładności bez odtwarzania wszystkich wcześniejszych odpowiedzi.',
  current_question:'Odpowiedz na aktualną intencję, nie streszczaj od nowa zmiany.'
 }[focus];
 return {
  responseFocus:focus,focusInstruction:instruction,
  authority:'style_only_not_fact',
  priorWitnessReplies:previous.length,
  avoidRecentlyUsedPhrases:used,
  note:'Nie recytuj tego samego akapitu w każdej odpowiedzi. Gdy gracz prosi o przypomnienie wcześniejszych słów, ich sens można powtórzyć, bo o to właśnie pyta; przy innych pytaniach bez potrzeby nie powtarzaj całego alibi. Nie zmieniaj pewności ani źródeł. Ta wskazówka nie upoważnia do nowych faktów.'
 };
}
