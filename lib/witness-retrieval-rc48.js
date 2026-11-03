/** RC57.10.48 — one deterministic, provenance-aware retrieval layer.
 * This module RANKS server-authorised knowledge only. It cannot grant disclosure,
 * write testimony, infer relationships, or turn a conversation into evidence.
 * No external service, embeddings, client facts, or mutable cross-player cache.
 */
import {questionFocus} from './interrogation-brief-rc45.js';
import {resolvePeople,PERSON_ROSTER} from './witness-relations-rc46.js';

const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const words=s=>(fold(s).match(/[a-z0-9]{3,}/g)||[]);
const common=new Set('jak jakie jaki jaka było byly byla bylo byles bylas jest jesteś czego czemu kiedy ktory ktora ktore zeby tylko ten tamten jego jej nasza twoja twoje sobie pan pani panu pana prosze czy co kto komu gdzie wtedy dzisiaj teraz tych ktos kogos przed po przez ktorych ktorego ile coś tym tych wiem wiesz widziales widzialas powiedz opowiedz'.split(' '));
const stems=s=>[...new Set(words(s).filter(w=>!common.has(w)).map(w=>w.length>7?w.slice(0,-2):w))];
const sourceFocus={
 role:['public-opening','authored-'],location:['public-alibi','trusted-corroboration','public-witness'],
 corroboration:['trusted-corroboration','public-witness'],
 knowledge_source:['public-unclear','public-witness','trusted-scope'],
 chronology:['public-what_happened','public-last_seen','public-alibi'],
 relationship:['trusted-relationship','public-motive','public-compassion'],
 pressure:['public-pressure','public-false_quote'],
 correction:['public-false_quote','public-apology'],
 evidence:['public-evidence_weak'],
 recap:[],own_words:[],current:[]
};
const topicPattern={
 role:/\b(?:funkcj|rola|obowiaz|zajmow|praca|stanowisk|zawod|kierown|dyspozytor)\w*\b/,
 alibi:/\b(?:alibi|gdzie|pobyt|obecnosc|byles|bylas|przebyw|wychodz|miejsce)\w*\b/,
 witness:/\b(?:swiad|potwierdz|widzia|spotkan|rozmow|poswiadcz)\w*\b/,
 relationship:/\b(?:lena|leny|lene|ofiara|ofiary|relac|znajom|kontakt|zauf|ufal|ufa|konflikt|romans|wspolprac)\w*\b/,
 memory:/\b(?:pamie|wspomn|skad|zrodlo|dowiedzia|wiedzie|osobisc|przypuszczen)\w*\b/,
 alarm:/\b(?:alarm|znalezien|znalaz|wezw|rann|uraz|godzin)\w*\b/,
 workshop:/\b(?:warsztat|tcms|wagon|diagnost|uster|serwis|napraw|tw-217)\w*\b/,
 safety:/\b(?:bhp|bezpiecz|zglosz|zastrzez|ryzyk|zagroz)\w*\b/,
 records:/\b(?:dokument|wydruk|rejestr|log|zapis|grafik|biling|podpis|wersj)\w*\b/,
 identity:/\b(?:kart|konto|czytnik|identyf|wejsc|drzwi)\w*\b/,
 phone:/\b(?:telefon|polaczen|biling|wiadom|radio|lacznos)\w*\b/,
 report:/\b(?:zgloszen|skarg|nadani|odbiorc|projekt|raport)\w*\b/,
 finance:/\b(?:pieniadz|premi|platn|koszt|finans|faktur|umow)\w*\b/,
 authorization:/\b(?:zgod|autoryz|zatwierdz|podpis|zezwol)\w*\b/,
 responsibility:/\b(?:wina|winny|zabil|zaboj|oskarz|odpowiedzialn|przyznaj|motyw)\w*\b/,
 emotion:/\b(?:emocj|czul|czulas|uczuc|strach|obaw|zdenerw|bal|przestrasz|wstyd)\w*\b/,
 pressure:/\b(?:nacisk|presj|grozb|zastrasz|ukryw|klam)\w*\b/
};
const aliases={
 MAREK:/\b(?:marek|marka|markiem|markowi|nowick\w*)\b/,
 TOMASZ:/\b(?:tomasz\w*|tomek|tomka|tomkiem|krawczyk\w*)\b/,
 JANUSZ:/\b(?:janusz\w*|wojcik\w*)\b/,
 ELZBIETA:/\b(?:elzbiet\w*|zieb\w*)\b/,
 KAMIL:/\b(?:kamil\w*|brzozowsk\w*)\b/,
 MAGDALENA:/\b(?:magdalen\w*|magda|magdy|magdzie|kaczmar\w*)\b/,
 LENA:/\b(?:len[aeyi]|lenie|rudnick\w*|ofiar\w*)\b/
};
const personalAction=/\b(?:rozmaw\w*|spotka\w*|znal\w*|relac\w*|konflikt\w*|kloc\w*|kontakt\w*|wspolprac\w*|ufal\w*|zauf\w*)\b/;
const preMidnight=/\b(?:przed\s+polnoca|przed\s+godzina\s+00)\b/;
const postMidnight=/\b(?:po\s+polnocy|po\s+godzinie\s+00)\b/;
const foundationSources=new Set(['public-opening','public-alibi','public-what_happened','public-last_seen','public-witness','public-unclear','trusted-corroboration','trusted-relationship']);
const safeFact=f=>f&&typeof f.id==='string'&&typeof f.text==='string'&&f.text.trim()&&typeof f.source==='string';

function directPairFact(factText,targets){
 if(targets.length!==2)return false;
 return fold(factText).split(/(?<=[.!?])\s+/u).some(sentence=>targets.every(t=>aliases[t]?.test(sentence))&&personalAction.test(sentence));
}
function subjectScore(text,targets,hasPairIntent){
 if(!targets.length)return 0;
 const normalized=fold(text);
 const count=targets.filter(t=>aliases[t]?.test(normalized)).length;
 if(count===0)return -28;
 if(targets.length===2&&hasPairIntent){
  // Two names scattered across a dossier are NOT evidence of a relation.
  return directPairFact(text,targets)?34:-4;
 }
 // Mention in a six-person roster is not a witness's actual knowledge of
 // this target. Require a focused statement, not just a name in a list.
 const allPeople=Object.values(aliases).filter(re=>re.test(normalized)).length;
 if(allPeople>=4&&!personalAction.test(normalized))return -18;
 return count===targets.length?22:12;
}
function topicScore(f,q,focus){
 const topic=f.topic||'';
 let value=topic&&topicPattern[topic]?.test(q)?16:0;
 if(focus==='role'&&topic==='role')value+=11;
 if(focus==='relationship'&&topic==='relationship')value+=11;
 if(focus==='knowledge_source'&&topic==='memory')value+=8;
 if(focus==='location'&&(topic==='alibi'||topic==='witness'))value+=11;
 if(focus==='chronology'&&topic==='alarm')value+=8;
 if(focus==='evidence'&&(topic==='records'||topic==='identity'))value+=8;
 if(focus==='pressure'&&(topic==='responsibility'||topic==='pressure'))value+=8;
 return value;
}
function provenanceScore(f,focus){
 let score=0;
 const hints=sourceFocus[focus]||[];
 if(hints.some(s=>s.endsWith('-')?f.source.startsWith(s):s===f.source))score+=14;
 if(f.source.startsWith('RC19-D-'))score-=9; // adversarial negative details only when relevant
 if(f.source.startsWith('authored-COMMON-'))score-=14; // general principle, not a personal memory
 if(f.kind==='general-principle-not-case-event')score-=18;
 if(f.source==='trusted-scope')score-=8;
 if(f.kind==='authorized-personal-correction'&&!['correction','own_words'].includes(focus))score-=12;
 return score;
}
function explicitPeriodPenalty(q,f){
 const t=fold(f.text);
 if(postMidnight.test(q)&&preMidnight.test(t)&&!postMidnight.test(t))return -18;
 if(preMidnight.test(q)&&postMidnight.test(t)&&!preMidnight.test(t))return -18;
 return 0;
}
/** Pure selection over an already filtered, authorised server-side collection. */
export function rankWitnessFacts({id,question,history=[],permitted=[],detailIds=[],maxFacts=30}){
 const f=questionFocus(question,false);
 const person=resolvePeople(question,history,id);
 const targets=person.persons.filter(x=>x!==id);
 const focus=person.directed||person.mode==='anaphoric'||person.mode==='group'?'relationship':f.focus;
 const focusText=f.focusText||fold(question);
 const q=fold(focusText);
 const qStems=stems(q);
 const detailed=new Set(detailIds);
 const explicitName=person.mode==='explicit'||person.mode==='anaphoric';
 const targetRelated=explicitName&&targets.length>0;
 const pairIntent=person.thirdPartyPair===true||targets.length===2;
 const rosterValid=new Set(PERSON_ROSTER.map(x=>x.id));
 const relTargets=targets.filter(x=>rosterValid.has(x));
 const ranked=permitted.filter(safeFact).map((fact,order)=>{
  const ft=stems(fact.text),shared=qStems.filter(w=>ft.some(x=>x===w)).length;
  let score=Math.min(shared,9)*4 + topicScore(fact,q,focus)+provenanceScore(fact,focus)+
    explicitPeriodPenalty(q,fact)+(detailed.has(fact.authoredId)?26:0);
  if(targetRelated)score+=subjectScore(fact.text,relTargets,pairIntent);
  if(fact.source==='public-alibi'&&focus==='location')score+=14;
  if(fact.source==='public-opening'&&focus==='role')score+=12;
  if(fact.source==='trusted-relationship'&&focus==='relationship'&&(!targetRelated||aliases.LENA.test(q)))score+=12;
  if(fact.source.startsWith('RC19-')&&!fact.source.startsWith('RC19-D-')&&targetRelated&&subjectScore(fact.text,relTargets,pairIntent)>0)score+=8;
  if(fact.source.startsWith('RC19-D-')){
   if(shared>=3)score+=18;
   else if(shared===2)score+=9;
   if(shared===0&&!detailed.has(fact.authoredId))score-=10;
  }
  return {fact,score,order};
 }).sort((a,b)=>b.score-a.score||a.order-b.order);
 // Reserve a small stable spine for context and legitimate refusal/limits,
 // then supply the *question-relevant* evidence first. Every ID is from this
 // witness's approved registry; no expansion using another person's dossier.
 const baseline=ranked.filter(r=>foundationSources.has(r.fact.source)||r.fact.source==='trusted-scope');
 const selected=new Map();
 const push=r=>{if(r&&!selected.has(r.fact.id)&&selected.size<Math.max(0,Math.min(36,maxFacts)))selected.set(r.fact.id,r);};
 // 9–12 foundational facts maximum; prefer one of each source.
 const core=baseline.filter(r=>foundationSources.has(r.fact.source));
 const bySource=new Set();
 for(const r of core){if(!bySource.has(r.fact.source)){push(r);bySource.add(r.fact.source);}}
 for(const r of ranked){if(r.score>0)push(r);}
 for(const r of baseline){if(selected.size<Math.min(16,maxFacts))push(r);}
 for(const r of ranked){if(selected.size<Math.min(24,maxFacts)&&r.score>=-6)push(r);}
 // Return question-relevant facts FIRST so the legacy currentGroundedAnswer
 // no longer defaults to an unrelated generic refusal.
 const selection=[...selected.values()].sort((a,b)=>b.score-a.score||a.order-b.order);
 return {
  facts:selection.map(r=>r.fact),
  retrieval:{version:'rc57.10.48',authority:'server_authorised_registry_only',focus,
   personIds:relTargets,queryPeriod:postMidnight.test(q)?'after_midnight':preMidnight.test(q)?'before_midnight':'unspecified',
   considered:permitted.length,selected:selection.length,
   selectedStableIds:selection.map(r=>r.fact.id),
   rules:'Ranking does not change permission; quotations, opinions, document descriptions and hearsay are not independent facts.'}
 };
}
