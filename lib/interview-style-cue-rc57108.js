import {FOCUS_GUIDANCE} from './interview-prompt-rc57106.js';
/** RC57.10.9: style-only reminder based on approved witness replies.
 * Never uses player allegations, retrieved docs or model drafts as instructions/facts.
 * Does not change facts, fact IDs, evidence, generation count or audit path.
 */
import {isExplicitRecallQuestion,isTestimonyRecapQuestion} from './dialogue-memory-636.js';
import {foldQuestion} from './question-intent-633.js';
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
 const testimonyRecap=isTestimonyRecapQuestion(scene?.question)&&previous.length>0;
 const question=foldQuestion(scene?.question); // normalizacja: skąd -> skad, kłamiesz -> klamiesz, obecność -> obecnosc
 // Only a conversational instruction. The actual earlier reply stays labelled
 // as prior testimony, never a newly verified fact or a document.
 const focus=openingRecall?'recount_previous_words':
  testimonyRecap?'testimony_recap':
  /sprostow|sprostuj|poprawi|wycof|zmieniasz zeznan/.test(question)?'correction':
  /skad|zrodl|przypuszcz|skad o tym wiesz/.test(question)?'source_of_knowledge':
  /kto.{0,60}potwierdz/.test(question)?'corroboration':
  /gdzie|obecnosc|pobyt|po polnocy|dokad/.test(question)?'whereabouts':
  /ukryw|klam|oszuk|przyznaj|zataj/.test(question)&&!/nie (?:twierdze|mowie|uwazam|oskarzam).{0,40}(?:klam|ukryw)/.test(question)?'pressure':'current_question';
 const instruction=FOCUS_GUIDANCE[focus];
 return {
  responseFocus:focus,focusInstruction:instruction,
  authority:'style_only_not_fact',
  priorWitnessReplies:previous.length,
  avoidRecentlyUsedPhrases:used,
  antiRepetition:{authority:'style_only_not_fact',usedOpeners:previous.slice(-4).map(x=>String(x.text).split(/\s+/).slice(0,6).join(' ')),avoidPhrases:used},
  note:'Jedyny kontrakt: interview-prompt-rc57106.js; klasyfikacja wyłącznie pomocnicza, bez nowych faktów.'
 };
}
