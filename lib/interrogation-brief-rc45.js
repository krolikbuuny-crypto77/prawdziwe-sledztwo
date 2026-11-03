/** RC57.10.45 — one server-side conversational plan for the six witnesses.
 * This is a presentation/selection guide, NOT an authority on case facts.
 * The complete server-owned factBank, disclosure gates, independent semantic
 * audit, and witness state remain unchanged. Never trust client-supplied plans.
 */
import {isExplicitRecallQuestion,isTestimonyRecapQuestion} from './dialogue-memory-636.js';
import {relationFacts} from './witness-relations-rc46.js';
import {buildWitnessHumanity} from './witness-humanity-rc47.js';

const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const clean=s=>String(s||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();
const stop=new Set(['jakie','jest','sa','bylo','byles','bylas','teraz','tylko','ktory','ktora','prosze','pani','pana','jego','jej','tego','swoje','twoje','mozesz','mozna','pamietasz','dokladnie','wtedy','przed','potem']);
const terms=s=>new Set((fold(s).match(/[a-z0-9]{4,}/g)||[]).filter(t=>!stop.has(t)).map(t=>t.length>7?t.slice(0,-2):t));
const idSet=new Set(['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']);
const focusNotes=Object.freeze({
 own_words:'Przypomnij tylko wcześniejszą zatwierdzoną wypowiedź tego świadka. Cytat zeznania nie jest potwierdzeniem zdarzenia.',
 recap:'Krótko podsumuj, co powiedziałeś/aś i czego nie potrafisz potwierdzić. Nie odczytuj mechanicznie całego alibi.',
 correction:'Porównaj własne wcześniejsze słowa z dostępnymi faktami. Jeśli nie ma rzeczywistej sprzeczności, nie przyznawaj się do zmyślonego kłamstwa.',
 location:'Odpowiedz o pytanym okresie i miejscu, o ile to dopuszczone. Nie zamieniaj wczesnej lokalizacji w alibi na późniejszy czas.',
 corroboration:'Nazwij osobę faktycznie wymienioną w dozwolonych faktach albo wyraźnie ogranicz możliwość potwierdzenia. Połączenie i rejestr nie są całonocnym świadkiem.',
 knowledge_source:'Oddziel własną pamięć, cudzą relację, dokument i wniosek. Odpowiedz, skąd wiesz, a nie gdzie pracowałeś/aś.',
 evidence:'Odnieś się do wyłącznie rzeczywiście okazanego materiału. Nie utożsamiaj zapisu systemowego z osobistą obserwacją.',
 role:'Nazwij własną funkcję i zakres obowiązków w jednym lub dwóch zdaniach, bez recytowania całego przebiegu nocy.',
 chronology:'Ustal wyłącznie znaną kolejność; nie porządkuj godzin ani wyjść, których autor nie potwierdził.',
 relationship:'Odpowiedz o wskazanej osobie lub osobach, także innych świadkach. Podaj tylko to, co TA postać rzeczywiście wie z dozwolonych faktów. Oddziel własną relację, współpracę, cudze słowa i domysły. Nie twórz nieznanych więzi, konfliktów ani motywów.',
 pressure:'Odpowiedz konkretnie na treść zarzutu. Ton może się zaostrzyć, ale presja nie odblokowuje tajemnic ani nie stanowi dowodu.',
 current:'Najpierw odpowiedz na bieżące pytanie. Jeśli brak faktu, wskaż konkretną granicę wiedzy zamiast odtwarzać poprzednią odpowiedź.'
});
const sourceHints=Object.freeze({
 role:['public-opening'],location:['public-alibi','public-witness'],corroboration:['trusted-corroboration','public-witness','public-alibi'],
 knowledge_source:['public-witness','public-unclear','public-alibi'],
 chronology:['public-what_happened','public-last_seen','public-alibi'],
 relationship:['trusted-relationship','public-motive','public-compassion','public-witness'],
 correction:['public-false_quote','public-apology'],
 own_words:[],recap:[],evidence:[],pressure:['public-pressure','public-false_quote'],current:[]
});
// Existing server-owned witness dossiers remain the sole source for character
// temperament and boundaries. Do not maintain a second character Bible here.
const dossierTopicByFocus=Object.freeze({
 role:'role',location:'presence',corroboration:'testimony_sources',
 knowledge_source:'testimony_sources',chronology:'events',relationship:'victim_relationship',
 pressure:'pressure',correction:'pressure',evidence:'events'
});

function questionFocus(question,hasExhibit){
 const raw=fold(question).replace(/\s+/g,' ').trim();
 const exclusion=raw.match(/\b(?:nie\s+pytam|nie\s+chodzi\s+mi|nie\s+interesuje\s+mnie)\b.{0,165}?\b(?:tylko|lecz|ale)\b(.+)$/);
 const q=exclusion?exclusion[1].trim():raw;
 if(isExplicitRecallQuestion(question))return {focus:'own_words',focusText:q,excluded:!!exclusion};
 if(isTestimonyRecapQuestion(question))return {focus:'recap',focusText:q,excluded:!!exclusion};
 if(/sprostow|sprostuj|popraw\w*\s+(?:zeznan|wypowiedz)|wycofa\w*\s+slowa|przed\s+chwila\s+powiedzial/.test(q))return {focus:'correction',focusText:q,excluded:!!exclusion};
 if(/\bkto\b.{0,75}\b(?:potwierdz|widzial|poswiadcz|swiadk)|\bczy\s+ktos\b.{0,70}\b(?:potwierdz|widzial)/.test(q))return {focus:'corroboration',focusText:q,excluded:!!exclusion};
 if(/\b(?:gdzie|dokad|miejsce|pobyt|obecnosc|alibi|przebywal|przebywalas|byles|bylas)\b/.test(q))return {focus:'location',focusText:q,excluded:!!exclusion};
 if(/skad\s+(?:o\s+tym\s+)?wiesz|skad\s+(?:to|ta\s+pewnosc)|zrodl|przypuszcz|domysl|na\s+podstawie\s+czego|co\s+pamietasz|(?:z|na\s+podstawie)\s+wlasnej\s+pamieci|wspomnien/.test(q))return {focus:'knowledge_source',focusText:q,excluded:!!exclusion};
 if(hasExhibit||/\b(?:okazany|okazana|okazanego|dowod|dokument|rejestr|wydruk|biling|log|zapis|fotograf)\b/.test(q))return {focus:'evidence',focusText:q,excluded:!!exclusion};
 if(/\b(?:jaka\s+role|jakie\s+obowiazki|czym\s+sie\s+zajmowal|funkcja|stanowisko|za\s+co\s+odpowiadal)\b/.test(q))return {focus:'role',focusText:q,excluded:!!exclusion};
 if(/\b(?:kiedy|o\s+ktorej|godzina|chronologi|kolejnosc|przed\s+polnoca|po\s+polnocy|pozniej|najpierw)\b/.test(q))return {focus:'chronology',focusText:q,excluded:!!exclusion};
 if(/\b(?:lena|leny|lene|ofiara|ofiary)\b.{0,60}\b(?:znal|relac|kontakt|rozmaw)|\b(?:relac|znal|kontakt|rozmaw)\b.{0,60}\b(?:lena|leny|lene|ofiara)/.test(q))return {focus:'relationship',focusText:q,excluded:!!exclusion};
 if(/\b(?:klam|oklam|oszuk|ukryw|zabil|zamord|przyznaj|zatail|grozil)/.test(q)&&!/nie\s+(?:twierdze|mowie|uwazam|oskarzam)\b.{0,50}\b(?:klam|ukryw|zabil)/.test(q))return {focus:'pressure',focusText:q,excluded:!!exclusion};
 return {focus:'current',focusText:q,excluded:!!exclusion};
}

function topAllowedFacts(facts,focus,focusText,dossier){
 const tokens=terms(focusText);
 const preferred=sourceHints[focus]||[];
 const topic=dossierTopicByFocus[focus];
 const topicFactIds=new Set((dossier?.topics||[]).find(t=>t.topic===topic)?.factIds||[]);
 return facts.filter(f=>f?.id&&f?.text&&f.knowledgeKind!=='general-principle-not-case-event')
  .map(f=>({f,score:(topicFactIds.has(f.id)?10:0)+(preferred.includes(f.source)?12-preferred.indexOf(f.source):0)+
   [...tokens].filter(t=>terms(f.text).has(t)).length*2+
   (f.source==='trusted-scope'?-10:0)+(f.origin==='document'&&focus==='evidence'?5:0)}))
  .filter(x=>x.score>=3).sort((a,b)=>b.score-a.score||a.f.id.localeCompare(b.f.id))
  .slice(0,6).map(x=>x.f.id);
}

export function buildInterrogationBrief(scene){
 const id=scene?.identity?.id;
 if(!idSet.has(id))return null;
 const facts=Array.isArray(scene?.knowledge?.factBank)?scene.knowledge.factBank:[];
 const source=questionFocus(scene.question,!!scene.presentedEvidence);
 const related=relationFacts(id,scene.question,facts,scene.approvedThreadHistory||[]);
 // A question about Janusz's whereabouts must not be answered with the
 // speaking witness's own alibi. Explicit second-person focus wins, however.
 const qf=fold(source.focusText);
 const asksOwnLocation=/\b(?:gdzie\s+(?:ty|pan|pani|byles|bylas)|twoj\w*\s+(?:pobyt|alibi)|twoja\s+obecnosc)\b/.test(qf);
 if((related.questionAboutOthers&&related.persons.length||['ambiguous','unresolved','group'].includes(related.mentionMode))&&!asksOwnLocation&&
  !['own_words','recap','correction'].includes(source.focus))source.focus='relationship';
 const full=Array.isArray(scene.approvedThreadHistory)?scene.approvedThreadHistory:[];
 const questions=full.filter(x=>x?.role==='player'&&typeof x.text==='string').slice(-10);
 const answers=full.filter(x=>x?.role==='witness'&&x.narrativeStatus!=='offline_unverified'&&typeof x.text==='string').slice(-5);
 const pressureCount=questions.filter(x=>/klam|oklam|oszuk|ukryw|zabil|przyznaj|oskarzam/.test(fold(x.text))&&!/nie\s+(?:twierdze|uwazam|oskarzam)/.test(fold(x.text))).length;
 const stage=pressureCount>=2?'ostrożna odpowiedź na nacisk':full.length>=20?'długa rozmowa':full.length>=6?'pogłębiona rozmowa':'początek rozmowy';
 const dossier=scene.witnessDossier||{};
 const voice={tone:clean(dossier.temperament||scene.personality?.temperament).slice(0,300),
  boundary:clean((dossier.boundaries||[])[0]||scene.knowledge?.limits?.[0]).slice(0,240)};
 const priorOpeners=answers.slice(-3).map(x=>clean(x.text).split(/\s+/u).slice(0,7).join(' ')).filter(x=>x.length>=18);
 const topical=topAllowedFacts(facts,source.focus,source.focusText,dossier);
 return {
  version:'rc57.10.48',authority:'style_and_relevance_only;not_facts_or_unlocks',
  focus:source.focus,focusInstruction:focusNotes[source.focus],
  explicitExcludedTopic:source.excluded,
  periodConstraint:/\bpo\s+polnocy\b/.test(source.focusText)?'pytany okres: po północy':/\bprzed\s+polnoca\b/.test(source.focusText)?'pytany okres: przed północą':null,
  preferFactIds:source.focus==='relationship'&&related.preferFactIds.length?related.preferFactIds:
   topical.length?topical:
    (related.questionAboutOthers?[]:facts.filter(f=>f.source!=='trusted-scope'&&
     f.knowledgeKind!=='general-principle-not-case-event'&&!f.source.startsWith('RC19-D-')).slice(0,4).map(f=>f.id)),
  retrievalGuide:{version:'rc57.10.48',authority:'ranking_only',
   focus:scene.knowledgeCoverage?.retrieval?.focus||source.focus,
   targets:scene.knowledgeCoverage?.retrieval?.personIds||[],
   period:scene.knowledgeCoverage?.retrieval?.queryPeriod||'unspecified',
   factIds:facts.filter(f=>f.source!=='trusted-scope'&&f.knowledgeKind!=='general-principle-not-case-event').slice(0,8).map(f=>f.id),
   rule:'Najpierw sprawdź zgodność osoby, okresu i źródła z pytaniem; pozostałe dozwolone fakty stanowią kontekst. Ranking nie jest zezwoleniem na nową informację.'},
  relationships:related,
  humanity:buildWitnessHumanity(scene),
  knowledgeRule:'PreferFactIds tylko sugerują trafność w JUŻ AUTORYZOWANYM factBank; nie ograniczają ani nie rozszerzają zezwoleń. Żadna wypowiedź nie dowodzi sama siebie.',
  sourceRule:'Przy osobistej pamięci mów tylko o własnych działaniach, przy dokumencie wyraźnie nazywaj zapis. Jeśli fakt nie jest znany, powiedz konkretnie czego nie pamiętasz; nie wymyślaj.',
  psychology:{stage,tone:voice.tone,boundary:voice.boundary,approvedTurns:answers.length,
   pressureResponse:source.focus==='pressure'||pressureCount>=2?'odpowiadaj konkretniej i krócej, bez nowych faktów lub automatycznych przyznań':'zwykły kontakt',
   noInferredMentalEvents:true},
  recentOpenersToAvoid:priorOpeners,
  responseLength:'Zwykle 1–3 zwięzłe zdania; gdy złożone pytanie potrzebuje więcej, odpowiedz na każdą część.',
  notes:'Nie odtwarzaj całej zmiany przy każdej odpowiedzi. Wspomnienie, zgłoszenie, zapis i wniosek mają różną moc dowodową. Pytanie o inną osobę nie jest pytaniem o własne alibi.'
 };
}
export {questionFocus};
