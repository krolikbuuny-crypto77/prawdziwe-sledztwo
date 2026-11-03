import assert from 'node:assert/strict';
import {registry} from '../lib/witness-engine-rc22.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildInterrogationBrief,questionFocus} from '../lib/interrogation-brief-rc45.js';
import {localInterviewReply} from '../lib/interview-local-rc24.js';
import {interviewWirePayload} from '../lib/interview-naturalness-rc28.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';

const ids=['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'];
const questions=[
 ['Jaką rolę pełnisz na tej zmianie?', 'role'],
 ['Nie pytam o Lenę, tylko gdzie byłeś po północy?', 'location'],
 ['Kto może potwierdzić twoją obecność?', 'corroboration'],
 ['Skąd o tym wiesz i co jest przypuszczeniem?', 'knowledge_source'],
 ['Co możesz potwierdzić na podstawie własnej pamięci?', 'knowledge_source'],
 ['Pamiętasz, co powiedziałeś na początku tej rozmowy?', 'own_words'],
 ['Sprostujesz swoją wcześniejszą odpowiedź?', 'correction'],
 ['O której wyszedłeś?', 'chronology'],
 ['Co potwierdza zapis w rejestrze?', 'evidence'],
 ['Czy mnie okłamujesz?', 'pressure'],
 ['Powiedz, co wiesz o Lenie.', 'relationship']
];
let checks=0;const check=(expr,message)=>{assert.ok(expr,message);checks++;};
const setFor=a=>new Set(a);
for(const id of ids){
 const voices=new Set();
 for(const [question,expectedFocus] of questions){
  const s=trustedScene({identity:{id},question,knowledge:{documentsShown:[]}});
  check(s&&s.identity.id===id,`${id}: server-owned identity`);
  check(s.knowledge.factBank.length>0,`${id}: authorized knowledge`);
  const plan=buildInterrogationBrief(s);s.interrogationBrief=plan;
  check(plan?.focus===expectedFocus,`${id}: ${question}: got ${plan?.focus}, expected ${expectedFocus}`);
  check(plan.authority.includes('not_facts_or_unlocks'),`${id}: brief cannot unlock`);
  check(typeof plan.psychology.tone==='string'&&plan.psychology.tone.length>32,`${id}: distinct voice`);
  voices.add(plan.psychology.tone);
  const allowed=setFor(s.knowledge.factBank.map(f=>f.id));
  check(plan.preferFactIds.every(fid=>allowed.has(fid)),`${id}: suggestions must be authorized IDs`);
  check(new Set(plan.preferFactIds).size===plan.preferFactIds.length,`${id}: no duplicate preferences`);
  const wire=interviewWirePayload(compactInterviewPayload(s));
  check(wire.interrogationBrief?.focus===expectedFocus,`${id}: generator receives focus`);
  check((wire.knowledge?.factBank||[]).length===s.knowledge.factBank.length,`${id}: no facts lost`);
  const r=localInterviewReply(s);
  check(r.ok&&r.localVerified===true,`${id}: safe local fallback`);
  check((r.factIds||[]).every(fid=>allowed.has(fid)),`${id}: fallback fact IDs`);
  if(r.factIds?.length)check(r.factIds.some(fid=>s.knowledge.factBank.find(f=>f.id===fid)?.text===r.text),`${id}: literal authorized response`);
 }
 check(voices.size===1,`${id}: consistent personal voice`);
}
// Negative focus must not accidentally make the excluded topic authoritative.
check(questionFocus('Nie pytam o Lenę, tylko o twoją obecność po północy. Gdzie byłeś?').excluded, 'negation excluded topic');
check(questionFocus('Czy masz alibi?').focus==='location','alibi question');
check(questionFocus('Proszę podsumować granice swojej wiedzy w trakcie tej rozmowy.').focus==='recap','testimony recap');
check(questionFocus('Skąd to wiesz?').focus==='knowledge_source','knowledge source');
check(buildInterrogationBrief({identity:{id:'UNKNOWN'},question:'Pytanie',knowledge:{factBank:[]}})===null,'unknown witness cannot get guide');

// Stress and repetition derive only from a verified transcript. Accusations do not grant new facts.
const stateQuestion='Dlaczego to powiedziałeś?';
const transcript=[
 {role:'player',text:'Kłamiesz? Odpowiedz!'},{role:'witness',text:'Odpowiadam o tym, co wiem ze zmiany.',narrativeStatus:'unresolved_statement'},
 {role:'player',text:'Ukrywasz coś?'},{role:'witness',text:'Nie mam podstaw, by to potwierdzić.',narrativeStatus:'unresolved_statement'}
];
for(const id of ids){
 const s=trustedScene({identity:{id},question:stateQuestion,knowledge:{documentsShown:[]}});
 s.approvedThreadHistory=transcript;
 const b=buildInterrogationBrief(s);
 check(b.psychology.stage==='ostrożna odpowiedź na nacisk',`${id}: pressure stage`);
 check(b.recentOpenersToAvoid.length===2,`${id}: recent witness openers from own dialogue`);
 check(b.preferFactIds.every(fid=>s.knowledge.factBank.some(f=>f.id===fid)),`${id}: stress does not unlock facts`);
}
// The same source is not the same witness's lived observation.
for(const id of ids){
 const s=trustedScene({identity:{id},question:'Gdzie byłeś po północy?',knowledge:{documentsShown:[]}});
 s.interrogationBrief=buildInterrogationBrief(s);
 const r=localInterviewReply(s);
 check(!/Były nietypowe zdarzenia w teście/.test(r.text),`${id}: an incident location is not witness presence`);
}
console.log(`RC57.10.45 PASS ${checks} focused checks (6 witnesses, 11 topics, local responses, psychology, provenance, negation).`);
