import assert from 'node:assert/strict';
import { auditLiveDialogue } from '../lib/admin-rc57-claim-audit.js';
import { interviewAnswerSystem } from '../lib/interview-naturalness-rc28.js';
import { spokenStyleGuide } from '../lib/spoken-dialogue-623.js';

const qMemory='Co możesz potwierdzić na podstawie własnej pamięci?';
const qMale='Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?';
const qFemale='Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłaś?';
const cases=[
 {id:'AI-002',witnessId:'MAREK',question:qMemory,
  answer:'Potwierdzam, że nadzorowałem nocną zmianę od 18:00 do alarmu o 02:02 i odpowiadałem za organizację zadań oraz rozliczenia. Z własnej pamięci wiem, że na początku byłem w biurze, a później wychodziłem służbowo do dyspozytorni i w rejon warsztatu — ale nie odtwarzam ich kolejności co do minuty.',
  expected:[],excluded:['self_order_contradiction']},
 {id:'AI-009',witnessId:'JANUSZ',question:qMale,
  answer:'Byłem w warsztacie, organizowałem prace przy TW-217 i zajmowałem się kartą W-217, ale wychodziłem do przejścia przy administracji w sprawach dokumentacji. Nie przebywałem nieprzerwanie przy jednym stanowisku, a konkretnego miejsca po północy nie podam z pamięci.',
  history:[{role:'witness',text:'Organizowałem prace przy TW-217 i zajmowałem się kartą W-217. Wychodziłem też do przejścia przy administracji w sprawach dokumentacji, więc nie stałem nieprzerwanie przy jednym stanowisku.'}],
  expected:[],excluded:['near_repetition']},
 {id:'AI-012',witnessId:'ELZBIETA',question:qFemale,
  answer:'Nie byłam przy stanowisku i nie widziałam samego zdarzenia. Nie mam dokumentu, który potwierdzałby każdą minutę mojej nocy, więc nie podam miejsca, którego nie umiem wskazać.',
  expected:['location_evasion']},
 {id:'AI-015',witnessId:'KAMIL',question:qMale,
  answer:'Byłem przy stanowisku diagnostycznym TW-217, ale log sesji nie pokazuje, gdzie dokładnie byłem w każdej minucie po północy. Nie mogę podać miejsca, bo nie mam takiej pewności.',
  expected:['place_self_contradiction']},
 {id:'AI-017',witnessId:'MAGDALENA',question:qMemory,
  answer:'Z własnej obserwacji nie mogę tego potwierdzić. Moja rola dotyczyła zgodności dokumentacji odbiorowej, a od 01:30 do 02:00 trwała prowadzona przeze mnie sesja audytowa, co potwierdza rejestr połączenia.',
  expected:['memory_answer_without_referent','overformal_answer']},
 {id:'AI-018',witnessId:'MAGDALENA',question:qFemale,
  answer:'Byłam przy stanowisku, gdzie prowadziłam sesję audytową od 01:30 do 02:00, ale nie potrafię tego potwierdzić z własnej obserwacji. Rejestr połączenia potwierdza ciągłość połączenia, a nie każde moje przemieszczenie w budynku.',
  expected:['session_as_location','self_location_observation','overformal_answer']}
];
for (const item of cases){
 const audit=auditLiveDialogue(item);
 for(const code of item.expected)assert(audit.findings.some(x=>x.code===code),`${item.id} missing ${code}`);
 for(const code of item.excluded||[])assert(!audit.findings.some(x=>x.code===code),`${item.id} false positive ${code}`);
 console.log(item.id,audit.findings.map(f=>f.code).join(',')||'bez ostrzeżeń');
}
const contradictions=[
  ['Gdzie byłeś?','Najpierw byłem w biurze, następnie w dyspozytorni, ale nie pamiętam, w jakiej kolejności odwiedziłem biuro i dyspozytornię.','self_order_contradiction'],
  ['Gdzie byłaś?','Byłam w biurze, ale nie wiem, gdzie byłam.','place_self_contradiction']
];
for(const [question,answer,code] of contradictions)assert(auditLiveDialogue({question,answer}).findings.some(x=>x.code===code));
for(const [question,answer] of [
  ['Gdzie byłeś?', 'Na początku byłem w biurze, później wychodziłem do dyspozytorni i warsztatu, ale nie odtwarzam ich kolejności co do minuty.'],
  ['Gdzie byłeś?', 'W biurze, ale dokładnej godziny nie pamiętam.'],
  ['Gdzie byłaś?', 'Nie pamiętam dokładnej godziny, ale byłam w biurze.']
]){
 const result=auditLiveDialogue({question,answer});
 assert(!result.findings.some(x=>['self_order_contradiction','place_self_contradiction','location_evasion'].includes(x.code)),answer);
}
assert(interviewAnswerSystem.includes('RC57.10.2'));
assert(spokenStyleGuide('MAGDALENA',qFemale).includes('RC57.10.2'));
console.log('RC57.10.2 PASS: 6 real examples, 2 true contradictions, 3 non-contradictions, guarded model instructions.');
