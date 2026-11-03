import assert from 'node:assert/strict';
import {registry,allAuthorisedKnowledge,selectRegistryKnowledge,permitsKnowledge} from '../lib/witness-engine-rc22.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {rankWitnessFacts} from '../lib/witness-retrieval-rc48.js';
import {buildInterrogationBrief} from '../lib/interrogation-brief-rc45.js';
import {interviewWirePayload} from '../lib/interview-naturalness-rc28.js';
import {compactInterviewPayload} from '../lib/interview-payload-rc15.js';
import {PERSON_ROSTER} from '../lib/witness-relations-rc46.js';
import {localInterviewReply} from '../lib/interview-local-rc24.js';

let checks=0;
const check=(condition,description)=>{assert.ok(condition,description);checks++};
const ids=PERSON_ROSTER.filter(x=>x.id!=='LENA').map(x=>x.id);
const make=(id,question,history=[])=>{
 const scene=trustedScene({identity:{id},question,approvedThreadHistory:history,knowledge:{documentsShown:[]}});
 check(!!scene,`${id} trusted scene ${question}`);
 scene.interrogationBrief=buildInterrogationBrief(scene);
 return scene;
};
const questions=[
 'Co wiesz o Januszu Wójciku?',
 'Gdzie był Janusz przed północą?',
 'Gdzie był Janusz po północy?',
 'Co powiesz o Kamilu Brzozowskim?',
 'Co sądzisz o Marku Nowickim?',
 'Czy Tomasz ufał Magdalenie?',
 'Czy Wójcik i Krawczyk się pokłócili?',
 'Czy Lena miała romans z Kamilem?',
 'Jak znałeś Lenę?',
 'Gdzie byłeś po północy?',
 'Co pamiętasz ze swojej zmiany?',
 'Jaką rolę pełniłeś?',
 'Kto może to potwierdzić?',
 'Skąd o tym wiesz?',
 'Jak wyglądał twój zwykły dzień pracy?',
 'Jak się wtedy czułeś?',
 'Co pamiętasz o zastrzeżeniach BHP?',
 'Co sądzisz o logach TCMS?',
 'Jak odróżniasz zapis systemu od własnej pamięci?',
 'Nie pytam o Lenę, tylko gdzie byłeś po północy?',
 'Czy rejestr potwierdza twoją fizyczną obecność?',
 'Chcesz sprostować wcześniejsze słowa?',
 'Dlaczego naciskałeś na Lenę?',
 'Jaka była godzina alarmu?'
];
for(const id of ids){
 const source=new Set(allAuthorisedKnowledge(id,registry.rules.initial).map(f=>f.id));
 const locked=new Set(registry.profiles[id].facts.filter(f=>!permitsKnowledge(f,registry.rules.initial)).map(f=>f.id));
 check(locked.size>0,`${id} has gated items for leakage test`);
 for(const q of questions){
  const s=make(id,q),facts=s.knowledge.factBank,brief=s.interrogationBrief;
  check(facts.length>=1&&facts.length<=36,`${id} fact cap ${q}`);
  check(s.knowledgeCoverage.retrieval.selected<=36,`${id} retrieval within payload cap`);
  check(facts.every(x=>source.has(x.stableId)),`${id} no other person's or unauthorized knowledge`);
  check(facts.every(x=>!locked.has(x.stableId)),`${id} no evidence-gated secrets`);
  check(new Set(facts.map(x=>x.stableId)).size===facts.length,`${id} no duplicate stable sources`);
  check(facts.every((x,i)=>x.id===`f${i}`),`${id} compact fact IDs sequential`);
  const idsInBank=new Set(facts.map(x=>x.id));
  check(brief.preferFactIds.every(x=>idsInBank.has(x)),`${id} preferred facts scoped`);
  check(brief.retrievalGuide.factIds.every(x=>idsInBank.has(x)),`${id} retrieval priority scoped`);
  check(brief.retrievalGuide.authority==='ranking_only',`${id} no override of gate`);
  check(brief.retrievalGuide.factIds.length<=8,`${id} bounded priority`);
  const wire=interviewWirePayload(compactInterviewPayload(s));
  check(wire.interrogationBrief.retrievalGuide?.factIds?.every(x=>wire.knowledge.factBank.some(f=>f.id===x)),`${id} same cloud IDs`);
  check(wire.knowledge.factBank.length<=36,`${id} wire cap`);
  const local=localInterviewReply(s);
  check(local.ok&&local.localVerified,`${id} local answer safe`);
  check(local.factIds.every(x=>idsInBank.has(x)),`${id} local answer cites own bank`);
 }
}
// Actual retrieval examples: direct interaction and pronouns must beat
// generic opening, not infer an unproved link between named people.
const marek=make('MAREK','Gdzie był Janusz przed północą?');
check(marek.knowledge.factBank[0].text.includes('Janusz Wójcik'), 'Marek first answer is targeted Janusz encounter');
check(marek.knowledge.factBank[0].text.includes('przed północą'), 'Marek preserves actual period');
const start=make('MAREK','Co wiesz o Wójciku?');
check(start.knowledge.factBank[0].source==='RC19-MAREK-S02', 'Marek prioritises authored coworker statement');
check(start.knowledgeCoverage.questionMatch===null,'unrelated approximate FAQ is never called exact');
const follow=make('MAREK','A co o nim sądzisz?',[{role:'player',text:'Co wiesz o Januszu Wójciku?'},{role:'witness',text:'Nie mam nic do dodania.',narrativeStatus:'unresolved_statement'}]);
check(follow.knowledgeCoverage.retrieval.personIds.includes('JANUSZ'),'pronoun from APPROVED player question');
check(follow.knowledge.factBank.slice(0,5).some(x=>x.text.includes('Janusz Wójcik')),'pronoun retrieves Janusz facts');
const sep=make('MAREK','Nie pytam o Lenę, tylko gdzie byłeś po północy?');
check(sep.knowledge.factBank[0].source==='public-alibi','excluded topic does not override own location');
check(sep.knowledgeCoverage.retrieval.personIds.length===0,'excluded Lena not retrieved as subject');
const kamil=make('KAMIL','Jak znałeś Lenę?');
check(kamil.knowledge.factBank.slice(0,4).some(x=>x.source==='authored-KAMIL-10'),'Kamil relationship first');
check(!kamil.knowledge.factBank.slice(0,4).some(x=>x.source==='RC19-D-afteralarm'),'no false match: znałeś vs znalezienie');
check(localInterviewReply(kamil).text.startsWith('Znałem Lenę zawodowo'),'safe local reply unchanged');
const mag=make('TOMASZ','Gdzie była Magdalena?');
check(!mag.knowledge.factBank.slice(0,4).some(x=>x.source==='RC19-D-shift'),'mere roster is not alibi for Magdalena');
check(localInterviewReply(mag).localKind==='third_party_location_limit','unknown third-person location remains unknown');
const b=make('ELZBIETA','Co możesz powiedzieć o zaleceniach BHP?');
check(!b.knowledge.factBank.slice(0,3).some(x=>x.source==='RC19-D-emotions'),'generic question words do not redirect to emotions');
const madeUp=make('JANUSZ','Czy Kamil i Lena mieli sekretny romans?');
check(localInterviewReply(madeUp).localKind==='relationship_limit','no private relationship from loose co-occurrence');
for(const id of ids){
 const result=selectRegistryKnowledge(id,'Co sądzisz o dokumentach?',{approvedEvidence:registry.rules.initial},{maxFacts:9});
 check(result.facts.length<=9,`${id} context budget honoured`);
 check(result.facts.every(f=>allAuthorisedKnowledge(id,registry.rules.initial).some(x=>x.id===f.id)),`${id} budget does not bypass permission`);
}
// A document exhibited by the investigator remains server-owned and consumes
// real context slots; retrieval must not cause a >36-fact payload rejection.
const shownId='MED-01';
check(Boolean(registry.documents[shownId]),'approved test document exists');
for(const id of ids){
 const state={approvedEvidence:[...new Set([...registry.rules.initial,shownId])],witnesses:{}};
 const s=trustedScene({identity:{id},question:'Co mówi okazany protokół i skąd możesz to wiedzieć?',
  presentedEvidenceId:shownId,approvedThreadHistory:[],knowledge:{documentsShown:[shownId]}},state);
 check(Boolean(s.presentedEvidence),`${id} server-verified document`);
 check(s.knowledge.factBank.some(f=>f.origin==='document'),`${id} document provenance`);
 check(s.knowledge.factBank.length<=36,`${id} document + retrieval budget`);
 check(s.knowledge.factBank.every((f,i)=>f.id===`f${i}`),`${id} document fact IDs stable in current scene`);
}
// Pure synthetic test: two names in a general shift roster must not outrank
// a supported direct relationship sentence, and a correction stays gated.
const fixtures=[
 {id:'P0',source:'public-opening',text:'Pracowałem podczas nocnej zmiany.'},
 {id:'P1',source:'RC19-D-shift',text:'Na zmianie byli Marek, Tomasz, Janusz, Kamil, Magdalena i Elżbieta.'},
 {id:'P2',source:'RC19-MAREK-S05',text:'Janusz rozmawiał z Kamilem o karcie pracy przed północą.'},
 {id:'P3',source:'trusted-scope',text:'Nie znam prywatnych szczegółów.'}
];
const synthetic=rankWitnessFacts({id:'MAREK',question:'Czy Janusz rozmawiał z Kamilem?',permitted:fixtures,maxFacts:4});
check(synthetic.facts[0].id==='P2','direct pair statement beats generic group roster');
check(synthetic.retrieval.authority==='server_authorised_registry_only','selection is ranking not factual authority');
console.log(`RC57.10.48 PASS ${checks} retrieval checks — six witnesses, topics, provenance, person resolution, query negation, source gates, budgets, wire + local parity.`);
