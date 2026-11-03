import assert from 'node:assert/strict';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildInterrogationBrief} from '../lib/interrogation-brief-rc45.js';
import {WITNESS_HUMANITY_AREAS} from '../lib/witness-humanity-rc47.js';
import {PERSON_ROSTER} from '../lib/witness-relations-rc46.js';
import {interviewWirePayload} from '../lib/interview-naturalness-rc28.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {localInterviewReply} from '../lib/interview-local-rc24.js';
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++};
const make=(id,question,h=[])=>{
 const s=trustedScene({identity:{id},question,approvedThreadHistory:h,knowledge:{documentsShown:[]}});
 s.interrogationBrief=buildInterrogationBrief(s);return s;
};
const cases=[
 ['biography','Opowiedz o swoim życiorysie.'],['biography','Ile masz lat i jakie masz wykształcenie?'],
 ['daily','Jak wyglądał twój typowy dzień w pracy?'],['daily','Czy zawsze pracujesz w ten sam sposób?'],
 ['memories','Co pamiętasz ze swojej zmiany?'],['memories','Jakie wspomnienia masz z tamtej nocy?'],
 ['character','Jaki masz charakter?'],['character','Jaki z ciebie człowiek?'],
 ['victim','Jak znałeś Lenę?'],['victim','Jakie relacje łączyły cię z Leną?'],
 ['others','Jakie masz relacje z Wójcikiem?'],['others','Czy ufałeś Markowi?'],
 ['beliefs','Co uważasz o tej sprawie?'],['beliefs','Co sądzisz o swojej decyzji?'],
 ['limits','Skąd to wiesz?'],['limits','Czego nie potrafisz potwierdzić?'],
 ['emotion','Jak się wtedy czułeś?'],['emotion','Czy przestraszyłeś się?'],
 ['voice','Mów po ludzku, bez formalności.'],['voice','Powiedz krótko.'],
 ['memory','Pamiętasz co powiedziałeś na początku?'],['memory','Chcesz sprostować wcześniejsze słowa?'],
 ['reactions','Ukrywasz coś?'],['reactions','Rozumiem, że to trudne.']
];
const ids=PERSON_ROSTER.filter(x=>x.id!=='LENA').map(x=>x.id);
check(WITNESS_HUMANITY_AREAS.length===12,'twelve facets registered');
check(new Set(WITNESS_HUMANITY_AREAS.map(x=>x.key)).size===12,'facet names unique');
for(const witness of ids){
 for(const [expected,question] of cases){
  const s=make(witness,question),h=s.interrogationBrief.humanity;
  const allowed=new Set(s.knowledge.factBank.map(f=>f.id));
  check(!!h,`${witness} humanity`);
  check(h.version==='rc57.10.47',`${witness} version`);
  check(h.authority==='source_IDs_only_not_new_case_facts',`${witness} authority`);
  check(h.focus===expected||(['victim','others','voice','limits'].includes(expected)&&[null,'beliefs',expected].includes(h.focus)),`${witness} focus ${question} actual:${h.focus}`);
  check(Object.keys(h.areas).length===12,`${witness} areas`);
  for(const [key,a] of Object.entries(h.areas)){
   check(typeof a.rule==='string'&&a.rule.length>20,`${witness}/${key} rule`);
   check(Array.isArray(a.factIds)&&a.factIds.length<=4,`${witness}/${key} compact`);
   check(a.factIds.every(id=>allowed.has(id)),`${witness}/${key} own permitted facts`);
   check(['source-backed','related-work-facts-only','unconfirmed-do-not-invent'].includes(a.status),`${witness}/${key} source status`);
  }
  const wire=interviewWirePayload(compactInterviewPayload(s));
  check(wire.interrogationBrief.humanity.authority===h.authority,`${witness} live wire`);
  check(!JSON.stringify(wire.interrogationBrief.humanity).includes('PRIVATE_KEY'),`${witness} no secret`);
  const local=localInterviewReply(s);
  check(local.localVerified&&local.factIds.every(id=>allowed.has(id)),`${witness} local safe ${question}`);
  check(local.factIds.every(id=>s.knowledge.factBank.some(f=>f.id===id&&f.text===local.text)),`${witness} literal fallback`);
 }
 const gap=make(witness,'Jak się nazywają twoje dzieci?');
 const response=localInterviewReply(gap);
 check(response.localKind==='biography_limit',`${witness} no invented household`);
 check(response.factIds.length===0,`${witness} family not grounded`);
 const routine=localInterviewReply(make(witness,'Jak wyglądał twój codzienny rozkład dnia?'));
 check(routine.localKind==='daily_limit',`${witness} shift not habitual schedule`);
 const first=make(witness,'Jak się wtedy czułeś?');
 const feel=localInterviewReply(first);
 check(['emotion_limit','authored_emotion'].includes(feel.localKind),`${witness} no invented feelings`);
 if(feel.factIds.length)check(first.knowledge.factBank.some(f=>f.id===feel.factIds[0]&&f.text===feel.text),`${witness} feeling source literal`);
 const h=[{role:'player',text:'Nie twierdzę, że kłamiesz. Jak się czujesz?'},
  {role:'witness',text:'Odpowiedziałem na to, co pamiętam.',narrativeStatus:'approved'}];
 const emotional=make(witness,'Nie twierdzę, że kłamiesz.',h).interrogationBrief.humanity;
 check(emotional.psychologicalState.tone!=='defensive',`${witness} negated allegation should not escalate`);
 const press=make(witness,'Kłamiesz, przyznaj się!').interrogationBrief.humanity;
 check(press.psychologicalState.tone==='defensive',`${witness} pressure from current question only`);
 const quoteHistory=[{role:'player',text:'Jaką rolę pełnisz?'},{role:'witness',text:'Byłem odpowiedzialny za swoją część zmiany.',narrativeStatus:'approved'},
  {role:'player',text:'Co pamiętasz?'},{role:'witness',text:'Nie potrafię potwierdzić tej godziny.',narrativeStatus:'approved'}];
 const recall=localInterviewReply(make(witness,'Czy pamiętasz co powiedziałeś na początku?',quoteHistory));
 check(recall.localKind==='approved_self_recall',`${witness} own transcript recall`);
 check(recall.text.includes('Byłem odpowiedzialny za swoją część zmiany.'),`${witness} opening words`);
 check(!recall.text.includes('Nie potrafię potwierdzić tej godziny.'),`${witness} not later answer`);
 check(recall.factIds.length===0&&recall.text.includes('nie dodatkowy dowód'),`${witness} quote not evidence`);
 const voice=localInterviewReply(make(witness,'Mów po ludzku, bez formalności.'));
 check(voice.localKind==='voice_acknowledgement',`${witness} spoken register`);
 const pressure=localInterviewReply(make(witness,'Ukrywasz coś?'));
 check(pressure.localKind==='pressure_boundary',`${witness} reacts to pressure`);
 const after=make(witness,'Jak się wtedy czułeś?');
 const sentiment=after.interrogationBrief.humanity.areas.emotion;
 check(sentiment.eventEmotionFactIds.every(x=>sentiment.factIds.includes(x)),`${witness} event emotion subset`);
 if(sentiment.factIds.length&&!sentiment.eventEmotionFactIds.length)
  check(localInterviewReply(after).localKind==='emotion_limit',`${witness} present feeling not past feeling`);
 const previous=make(witness,'A dlaczego?', [{role:'player',text:'Co sądzisz o Wójciku?'},
  {role:'witness',text:'Nie pamiętam takich rozmów.',narrativeStatus:'offline_unverified'}]);
 check(previous.interrogationBrief.humanity.conversation.approvedWitnessReplyCount===0,`${witness} exclude offline unverified`);
}
// Hard invariants: a document is not a memory, and unauthorized information
// can never become evidence via a biography or a psychological cue.
for(const witness of ids){
 const s=make(witness,'Co pamiętasz?');
 const a=s.interrogationBrief.humanity.areas;
 for(const [key,v] of Object.entries(a))for(const id of v.factIds){
  const f=s.knowledge.factBank.find(f=>f.id===id);
  check(f.origin!=='document'&&f.knowledgeKind!=='authorized-personal-correction',`${witness}/${key} no document/secret in personal facets`);
 }
 check(!s.interrogationBrief.humanity.areas.daily.rule.includes('każdego dnia pracowałem'),`${witness} no imagined typical routine`);
}
console.log(`RC57.10.47 PASS ${checks} checks (six witnesses, twelve facets, source/provenance, conversation, pressure and local fallback).`);
