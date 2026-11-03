import assert from 'node:assert/strict';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildInterrogationBrief,questionFocus} from '../lib/interrogation-brief-rc45.js';
import {PERSON_ROSTER,resolvePeople,relationFacts} from '../lib/witness-relations-rc46.js';
import {localInterviewReply} from '../lib/interview-local-rc24.js';
import {interviewWirePayload} from '../lib/interview-naturalness-rc28.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';

const ids=PERSON_ROSTER.filter(p=>p.id!=='LENA');
let checks=0;const check=(p,msg)=>{assert.ok(p,msg);checks++};
const scene=(id,question,h=[])=>{const s=trustedScene({identity:{id},question,approvedThreadHistory:h,knowledge:{documentsShown:[]}});s.interrogationBrief=buildInterrogationBrief(s);return s;};
for(const speaker of ids){
 for(const person of PERSON_ROSTER.filter(x=>x.id!==speaker.id)){
  const patterns=[`Co wiesz o ${person.name}?`,`Co sądzisz o ${person.name}?`,`Czy znasz relacje ${person.name} z innymi?`,`Czy ${person.name} znał Lenę?`];
  for(const q of patterns){
   const s=scene(speaker.id,q),b=s.interrogationBrief,r=b.relationships;
   const allowed=new Set(s.knowledge.factBank.map(x=>x.id));
   check(b.focus==='relationship',`${speaker.id}/${person.id} focus ${q}`);
   check(r.persons.some(x=>x.id===person.id),`${speaker.id}/${person.id} target ${q}`);
   check(r.authority==='current_witness_authorised_facts_only',`${speaker.id} authority`);
   check(r.preferFactIds.every(id=>allowed.has(id)),`${speaker.id} only authorised IDs`);
   check(r.pairFactIds.every(id=>allowed.has(id)),`${speaker.id} pair only authorised IDs`);
   check(r.persons.every(x=>x.factIds.every(id=>allowed.has(id))),`${speaker.id} person IDs within bank`);
   const local=localInterviewReply(s);
   check(local.ok&&local.localVerified,`${speaker.id} local answer safe`);
   check((local.factIds||[]).every(id=>allowed.has(id)),`${speaker.id} answer cites own bank`);
   if(local.factIds?.length)check(local.factIds.some(id=>s.knowledge.factBank.find(f=>f.id===id)?.text===local.text),`${speaker.id} literal fact`);
  }
 }
 for(const person of PERSON_ROSTER.filter(x=>x.id!==speaker.id)){
  const q=`Czy ${person.name} miał romans z Leną?`,s=scene(speaker.id,q),r=localInterviewReply(s);
  check(s.interrogationBrief.relationships.aspect==='romance',`${speaker.id} romance classification`);
  check(!r.text.includes('tak,')&&!r.text.startsWith('Tak,'),`${speaker.id} no invented romance`);
 }
}
// Single-person anaphora derives from prior investigator's question, NOT a
// previous witness's assertion. Multi-name references must be clarified.
for(const id of ids.map(x=>x.id)){
 const h=[{role:'player',text:'Co wiesz o Wójciku?'},{role:'witness',text:'Krawczyk rzekomo coś zrobił',narrativeStatus:'unresolved_statement'}];
 const a=scene(id,'A co o nim myślisz?',h);
 if(id!=='JANUSZ')check(a.interrogationBrief.relationships.persons[0]?.id==='JANUSZ',`${id} single previous reference`);
 check(!a.interrogationBrief.relationships.persons.some(x=>x.id==='TOMASZ'),`${id} not witness accusation`);
 const multi=scene(id,'A co o nim myślisz?',[{role:'player',text:'Co sądzisz o Lenie i Kamilu?'}]);
 check(multi.interrogationBrief.relationships.mentionMode==='ambiguous'||id==='KAMIL',`${id} multi ambiguity`);
 const noHistory=scene(id,'A co o nim myślisz?');
 check(['unresolved'].includes(noHistory.interrogationBrief.relationships.mentionMode),`${id} unresolved pronoun`);
 check(localInterviewReply(noHistory).localKind==='relationship_clarification',`${id} ask instead of guessing`);
}
const m=scene('MAREK','Gdzie był Janusz po północy?');
check(m.interrogationBrief.focus==='relationship','third party whereabouts are not own alibi');
check(localInterviewReply(m).localKind==='third_party_location_limit','do not invent third party location');
const mb=scene('MAREK','Gdzie był Janusz przed północą?');
check(localInterviewReply(mb).localKind==='authored_relationship','permitted known encounter before midnight');
const jan=scene('JANUSZ','Jakie relacje łączyły Kamila z Leną?');
check(jan.interrogationBrief.relationships.crossPersonRelationshipUnproven,'two unrelated mentions cannot imply pair relationship');
check(localInterviewReply(jan).localKind==='relationship_limit','fallback avoids fabricated pair');
const k=scene('KAMIL','Jak znałeś Lenę?');
check(localInterviewReply(k).text.startsWith('Znałem Lenę zawodowo'), 'choose actual direct relationship not an alarm timeline');
const trust=scene('TOMASZ','Czy Lena ufała Markowi?');
check(localInterviewReply(trust).localKind==='relationship_limit','no third-party trust invention');
const negative=scene('MAREK','Nie pytam o Lenę, tylko gdzie byłeś po północy?');
check(negative.interrogationBrief.focus==='location','negation respects asked focus');
check(!negative.interrogationBrief.relationships.persons.length,'exclude ignored person');
const quote=scene('TOMASZ','Wójcik twierdzi, że Marek zagroził Lenie. Co o tym wiesz?');
check(quote.interrogationBrief.relationships.loadedPremise,'player quote treated as unverified');
check(localInterviewReply(quote).factIds.length===0,'fallback cannot verify user claim');
const payload=interviewWirePayload(compactInterviewPayload(k));
check(payload.interrogationBrief.relationships.persons[0]?.id==='LENA','cloud receives grounded relationship target');
check(payload.interrogationBrief.relationships.preferFactIds.every(x=>payload.knowledge.factBank.some(f=>f.id===x)),'cloud receives only allowed IDs');
for(const id of ids.map(x=>x.id)){
 const g=scene(id,'Co sądzisz o innych świadkach?');
 check(g.interrogationBrief.relationships.mentionMode==='group',`${id} group clarification`);
 check(localInterviewReply(g).localKind==='relationship_clarification',`${id} no invented group relationships`);
}
const noOther=resolvePeople('Czy Wójcik kłócił się z Krawczykiem?',[], 'MAREK');
check(noOther.persons.join(',')==='TOMASZ,JANUSZ','surname variants recognized');
check(questionFocus('Nie pytam o Lenę, tylko gdzie byłeś?').focus==='location','existing focus unaffected');
console.log(`RC57.10.46 PASS ${checks} relationship checks (6 witness perspectives x 6 other persons, pronouns, no invented private ties, quote provenance, live payload).`);
