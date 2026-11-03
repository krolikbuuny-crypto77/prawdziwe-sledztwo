/** RC57.10.46 — named-person and relationship focus.
 * This module contains only a roster and query interpretation. It does NOT
 * create witness biographies, interpersonal events, sentiments or new facts.
 * All factual snippets/IDs originate from the current witness's server-owned
 * authorised factBank. Other witnesses' histories are never consulted.
 */
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const roster=Object.freeze([
 {id:'MAREK',name:'Marek Nowicki',match:/\b(?:marek|marka|markiem|markowi|nowick[a-z]*)\b/g},
 {id:'TOMASZ',name:'Tomasz Krawczyk',match:/\b(?:tomasz[a-z]*|tomek|tomka|tomkiem|krawczyk[a-z]*)\b/g},
 {id:'JANUSZ',name:'Janusz Wójcik',match:/\b(?:janusz[a-z]*|wojcik[a-z]*)\b/g},
 {id:'ELZBIETA',name:'Elżbieta Zięba',match:/\b(?:elzbiet[a-z]*|zieb[a-z]*)\b/g},
 {id:'KAMIL',name:'Kamil Brzozowski',match:/\b(?:kamil[a-z]*|brzozowsk[a-z]*)\b/g},
 {id:'MAGDALENA',name:'Magdalena Kaczmarek',match:/\b(?:magdalen[a-z]*|magda|magdy|magdzie|kaczmar[a-z]*)\b/g},
 {id:'LENA',name:'Lena Rudnicka',match:/\b(?:len[aeyi]|lenie|lena|rudnick[a-z]*|ofiar[a-z]*)\b/g}
]);
const subjectCue=/\b(?:co\s+sadz\w*|co\s+mysl\w*|co\s+wiesz|co\s+powie\w*|powiedz|opini\w*|ocen\w*|znasz|znal\w*|relac\w*|wspolprac\w*|kontakt\w*|przyjazn\w*|lubil\w*|lubi\w*|ufal\w*|ufa\w*|konflikt\w*|kloc\w*|spor\w*|groz\w*|spotka\w*|rozmaw\w*|widz\w*|zauwaz\w*|mowil\w*|twierdz\w*|zeznan\w*|co\s+lac\w*|co\s+dziel\w*|byl\s+blisko|polub\w*|zwiazek|romans\w*|zazdros\w*|alibi|gdzie\s+byl\w*|co\s+robil\w*|z\s+nim|z\s+nia|o\s+nim|o\s+niej)\b/;
const pronoun=/\b(?:nim|nia|niej|jego|jej|on|ona|nimi|ich|tamtym|tamtej|tego\s+czlowieka|tej\s+osobie|tym\s+swiadku)\b/;
const relationDirect=/\b(?:relac\w*|znajom\w*|wspolprac\w*|konflikt\w*|kloc\w*|spor\w*|lubi\w*|ufal\w*|ufa\w*|przyjazn\w*|opini\w*|co\s+sadz\w*|co\s+mysl\w*|blisko|zazdros\w*|romans\w*|zwiazek|kontakt\w*|kto\s+z\s+kim)\b/;
const premise=/\b(?:podobno|rzekomo)\b|\b(?:grozil|romans|zdradz|zabil|ukrywal|przekupil|zmusil|oskarzyl)\b|\b(?:twierdzi|powiedzial|zeznal)\s*,?\s*ze\b/;
const namesIn=s=>roster.filter(p=>{p.match.lastIndex=0;return p.match.test(fold(s))}).map(p=>p.id);
const dedupe=arr=>[...new Set(arr)];
function focusSentence(q){
 const t=fold(q).replace(/\s+/g,' ').trim();
 const m=t.match(/\b(?:nie\s+pytam|nie\s+chodzi\s+mi|nie\s+interesuje\s+mnie)\b.{0,180}?\b(?:tylko|lecz|ale)\b(.+)$/);
 return m?m[1].trim():t;
}
/** Resolve one or two persons in the question. Anaphora comes ONLY from the
 * current witness's approved PLAYER questions; quoted assertions are NOT facts.
 */
export function resolvePeople(question,approvedHistory=[],ownId=''){
 const focus=focusSentence(question),mentioned=namesIn(focus);
 const persons=dedupe(mentioned.filter(x=>x!==ownId));
 let mode=persons.length?'explicit':'none';
 if(!persons.length&&/\b(?:inni\s+swiadkowie|innych\s+swiadk\w*|pozostalymi|pozostalych|cala\s+reszta|wszyscy\s+swiadkowie|wzajemne\s+relacje|miedzy\s+swiadkami)\b/.test(focus))mode='group';
 if(!persons.length&&mode!=='group'&&pronoun.test(focus)){
  const previous=(Array.isArray(approvedHistory)?approvedHistory:[]).filter(x=>['player','śledczy'].includes(x?.role)&&typeof x.text==='string').slice(-8).reverse();
  for(const turn of previous){
   const refs=dedupe(namesIn(focusSentence(turn.text)).filter(x=>x!==ownId));
   if(refs.length===1){persons.push(refs[0]);mode='anaphoric';break;}
   if(refs.length>1){mode='ambiguous';break;}
  }
  if(mode==='none')mode='unresolved';
 }
 const directed=persons.length>0&&(subjectCue.test(focus)||relationDirect.test(focus)||
  /\b(?:kto|czy|jak|gdzie|kiedy|dlaczego|czemu)\b/.test(focus)||/\bo\s+[a-z]+/.test(focus));
 return {persons:persons.slice(0,3),mode,directed,loadedPremise:premise.test(focus),
  thirdPartyPair:persons.filter(id=>id!==ownId).length>1,
  text:focus};
}
const genericSource=/^RC19-D-|^document-|^authored-COMMON-|^trusted-scope$/;
const selfSource=/^RC19-[A-Z]+-S\d+$/;
/** Literal excerpt selector, never guesses a link from a roster entry. */
export function relationFacts(ownId,question,bank,approvedHistory=[]){
 const ref=resolvePeople(question,approvedHistory,ownId);
 const permitted=(Array.isArray(bank)?bank:[]).filter(f=>
  typeof f?.text==='string'&&f.id&&f.origin!=='document'&&!genericSource.test(f.source||'')&&
  f.knowledgeKind!=='general-principle-not-case-event'&&f.knowledgeKind!=='authorized-personal-correction');
 const aspect=/\b(?:gdzie|alibi|miejsce|pobyt|przebywal|byl\s+[a-z]+\s+po\s+polnocy)\b/.test(ref.text)?'third_party_location':
  /\b(?:ufa\w*|zauf\w*)\b/.test(ref.text)?'trust':
  /\b(?:romans\w*|kocha\w*|zazdros\w*|partner\w*)\b/.test(ref.text)?'romance':
  /\b(?:groz\w*|konflikt\w*|kloc\w*|spor\w*|spier\w*)\b/.test(ref.text)?'conflict':
  /\b(?:prywatn\w*|przyjaci\w*|blisko)\b/.test(ref.text)?'private':
  /\b(?:opini\w*|co\s+sadz\w*|co\s+mysl\w*)\b/.test(ref.text)?'opinion':'professional_or_general';
 const wantsSafety=/\b(?:uwag\w*|zastrzez\w*|zglosz\w*|bezpieczen\w*|ryzyk\w*)\b/.test(ref.text);
 const wantsPostMidnight=/\bpo\s+polnocy\b/.test(ref.text);
 const wantsBeforeMidnight=/\bprzed\s+polnoca\b/.test(ref.text);
 const rows=ref.persons.map(id=>{
  const person=roster.find(p=>p.id===id);
  const exact=permitted.filter(f=>{person.match.lastIndex=0;return person.match.test(fold(f.text));})
   .map(f=>({f,score:(f.source==='trusted-relationship'?50:0)+(selfSource.test(f.source)?16:0)+
    (/^RC19-[A-Z]+-S05$/.test(f.source)?20:0)+
    (f.source==='public-compassion'||f.source==='public-motive'?9:0)+
    (f.source==='public-witness'?5:0)+
    (wantsSafety&&/\b(?:uwag\w*|zastrzez\w*|zglosz\w*|bezpieczen\w*|ryzyk\w*)\b/.test(fold(f.text))?21:0)+
    (aspect==='third_party_location'&&/\b(?:przejsc|biurz|warsztat|dyspozytorni|stanowisk|hali|rejon|zajezdni)\w*\b/.test(fold(f.text))?12:0)+
    (fold(f.text).split(/(?<=[.!?])\s+/u).some(sentence=>{
      person.match.lastIndex=0;
      return person.match.test(sentence)&&/\b(?:znalem|znalam|znam|znalismy|rozmaw\w*|wspolprac\w*|spier\w*|prywatn\w*|przyjaci\w*|laczyc\w*|laczyla|relacj\w*|kontakt\w*)\b/.test(sentence);
    })?18:0)+
    (f.text.length<320?3:0)-Math.floor(f.text.length/350)}))
   .sort((a,b)=>b.score-a.score||a.f.text.length-b.f.text.length)
   .slice(0,3).map(x=>x.f);
  return {id,name:person.name,factIds:exact.map(f=>f.id)};
 });
 const pairCandidates=rows.length>1?permitted.filter(f=>{
  const sentences=fold(f.text).split(/(?<=[.!?])\s+/u);
  return sentences.some(sentence=>/\b(?:rozmaw\w*|spotka\w*|widz\w*|znal\w*|relac\w*|konflikt\w*|kloc\w*|kontakt\w*|wspolprac\w*)\b/.test(sentence)&&
   rows.every(row=>{const p=roster.find(x=>x.id===row.id);p.match.lastIndex=0;return p.match.test(sentence);}));
 }):[];
 const pairFactIds=pairCandidates.slice(0,3).map(f=>f.id);
 const firstIds=dedupe([...pairFactIds,...rows.flatMap(x=>x.factIds)]).slice(0,6);
 const aspectRegex={trust:/\b(?:ufa\w*|zauf\w*)\b/,romance:/\b(?:romans\w*|kocha\w*|zazdros\w*|partner\w*)\b/,
  conflict:/\b(?:groz\w*|konflikt\w*|kloc\w*|spor\w*|spier\w*)\b/,
  private:/\b(?:prywatn\w*|przyjaci\w*|blisko)\b/};
 const aspectSupported=!aspectRegex[aspect]||firstIds.some(id=>{const f=permitted.find(x=>x.id===id);return f&&aspectRegex[aspect].test(fold(f.text));});
 const thirdPartyLocationFactIds=aspect==='third_party_location'&&rows.length===1?
  rows[0].factIds.filter(id=>{
   const f=permitted.find(x=>x.id===id);if(!f)return false;
   const t=fold(f.text);
   return /\b(?:przejsc\w*|biurz\w*|warsztat\w*|dyspozytorni|stanowisk\w*|hali|rejon\w*|zajezdni)\b/.test(t)&&
    (!wantsPostMidnight||/\bpo\s+polnocy\b/.test(t))&&
    (!wantsBeforeMidnight||/\bprzed\s+polnoca\b/.test(t));
  }):[];
 return {version:'rc57.10.46',authority:'current_witness_authorised_facts_only',
  persons:rows,mentionMode:ref.mode,questionAboutOthers:ref.directed,loadedPremise:ref.loadedPremise,
  crossPersonRelationshipUnproven:ref.thirdPartyPair&&!pairFactIds.length,pairFactIds,aspect,aspectSupported,thirdPartyLocationFactIds,
  preferFactIds:firstIds,
  rule:'Odpowiadaj tylko z faktów obecnego świadka i ich źródeł. Kontakt służbowy nie dowodzi przyjaźni, nienawiści, romansu ani udziału w przestępstwie. Nie potwierdzaj założeń gracza. Cudzych zeznań nie traktuj jak własnych obserwacji. Jeżeli brak bezpośredniego faktu o relacji dwóch osób, uczciwie powiedz, że nie możesz jej potwierdzić. Historia pytań służy jedynie do rozpoznania zaimków.'};
}
export const PERSON_ROSTER=Object.freeze(roster.map(({id,name})=>({id,name})));
