/* Scoped answers to questions beyond a witness's documented competence.
 * Runs AFTER existing linguistic styling, but never overwrites a confession,
 * scripted correction, procedural refusal or answer grounded in presented evidence.
 */
(function(){
 'use strict';
 if(typeof WitnessEngine==='undefined')return;
 const previous=WitnessEngine.snapshotAnswer();
 const CARD=/(?:\bt[ -]?17\b|\bkart[ayąę]?\b|\bczytnik\b|\bidentyfikator\b|\bzapis dost[eę]pu\b)/i;
 const replies={
  MAREK:'Nie wiem, kto wtedy użył tej karty. Nie widziałem tego.',
  TOMASZ:'Nie widziałem, kto użył tej karty. Sam zapis nie pokaże mi osoby.',
  JANUSZ:'Tego z kartą nie widziałem. Nie będę zgadywał, kto ją miał.',
  ELZBIETA:'Nie wiem, kto użył T-17. Nie byłam przy tym wejściu.',
  KAMIL:'Sam zapis T-17 nie mówi mi, kto trzymał kartę w chwili użycia.',
  MAGDALENA:'Zapis użycia karty nie pokazuje człowieka przy drzwiach. Co dokładnie ma potwierdzać?'
 };
 registerWitnessAnswerLayer('out-of-scope-624',function(c,q,attached){
  const before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const answer=previous(c,q,attached);
  if(attached||!c||!replies[c.id]||!CARD.test(q)||simWitness(c).blocked)return answer;
  const mem=NPC9_MEMORY[c.id],last=mem.semantic?.at(-1),statement=mem.statements?.at(-1);
  if(!last||before!==mem.confronted.length||!['TESTIMONY','LIMITED_KNOWLEDGE','UNKNOWN','SOCIAL'].includes(last.status)||
     (last.source_ids||[]).length||last.answer!==answer||statement?.text!==answer)return answer;
  const next=replies[c.id];
  last.answer=next;statement.text=next;
  const st=NPC4_STATE[c.id],recent=st.recent?.at(-1);
  if(recent)recent.answer=norm(next).slice(0,1550);
  if(st.npc65?.lastAnswer===answer)st.npc65.lastAnswer=next.slice(0,1300);
  if(st.npc68?.threads?.at(-1)?.a===answer.slice(0,850))st.npc68.threads.at(-1).a=next.slice(0,850);
  return next;
 });
})();
