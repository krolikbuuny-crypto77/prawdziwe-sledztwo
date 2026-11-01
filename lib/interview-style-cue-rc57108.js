/** RC57.10.8: style-only reminder based on approved witness replies.
 * Never uses player allegations, retrieved docs or model drafts as instructions/facts.
 * Does not change facts, fact IDs, evidence, generation count or audit path.
 */
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
 return {
  authority:'style_only_not_fact',
  priorWitnessReplies:previous.length,
  avoidRecentlyUsedPhrases:used,
  note:'Odpowiadaj przede wszystkim na aktualne pytanie. Nie wyliczaj od nowa całej zmiany, jeśli pytanie wymaga tylko miejsca, czasu, źródła wiedzy lub potwierdzenia. Gdy fakt był już powiedziany, wolno krótko do niego nawiązać, lecz bez powtarzania tej samej frazy. Zachowaj wszystkie niepewności i negacje. Ta wskazówka nie upoważnia do nowych faktów.'
 };
}
