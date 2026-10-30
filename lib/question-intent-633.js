/** 6.33 - ONE pure, deterministic, non-authoritative question interpreter.
 * Shared source is imported on Vercel and embedded in the browser at build time.
 * No witness data, evidence, unlocks or side effects are used here.
 */
export const INTENT_VERSION='6.33';
export function foldQuestion(input){return String(input??'').slice(0,1600).toLocaleLowerCase('pl').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9:?.!,; -]+/g,' ').replace(/\s+/g,' ').trim();}
const interrogative=/(?:^|\b)(?:gdzie|kto|komu|co|kiedy|dlaczego|czemu|jak|czy|skad|o ktorej|w ktorym|na jakiej|ile)\b/;
const contrast=/\b(?:tylko|lecz|ale|zamiast tego|interesuje mnie|chodzi mi o)\b/;
const exclusion=/\b(?:nie\s+(?:pytam|mowie|chodz[ięei]|interesuje\s+mnie)\b|nie\s+o\s+(?:lene|lenie|leny|dokument|ostatni))\b/;
function positiveClauses(raw){
 const text=foldQuestion(raw);if(!text)return {parts:[],excluded:[],negated:false};
 const exclude=[],parts=[];
 // Sentence punctuation separates negated corrections from actual questions.
 for(const sentence of text.split(/[?.!]+/).map(s=>s.trim()).filter(Boolean)){
  if(exclusion.test(sentence)){
   const m=sentence.match(contrast);
   if(m){const before=sentence.slice(0,m.index).trim(),after=sentence.slice(m.index+m[0].length).trim();
    if(before)exclude.push(before);if(after)parts.push(after);
   }else{
    const later=sentence.search(/(?:\b(?:gdzie|kto|komu|kiedy|dlaczego|co|czy|jak|skad)\b)(?=.{4,}$)/g);
    // This recovery is only for a full stop that was omitted after a negated instruction.
    if(later>12&&/^nie\s+(?:pytam|mowie|chodzi)/.test(sentence)){exclude.push(sentence.slice(0,later));parts.push(sentence.slice(later));}
    else exclude.push(sentence);
   }
  }else parts.push(sentence);
 }
 // In "Powiedział pan X. Dokąd pan wychodził?", the preface is context,
 // not an independent question competing for the primary intent.
 const filtered=parts.length>1&&parts.some(p=>interrogative.test(p))
  ?parts.filter(p=>interrogative.test(p)):parts;
 const active=[];
 for(const sentence of filtered){
  // Separate two genuinely independent requests, but keep "kto zgłosił alarm i o której" together.
  const split=/\bdokad\b.{0,100}\bwychodz\w*\b.{0,100}\bkto\b/.test(sentence)?[sentence]:sentence.split(/\s+(?:i|oraz|a)\s+(?=(?:gdzie|kto|komu|dlaczego|czemu|czy|skad|jak|co)\b)/);
  for(const part of split)if(part.trim())active.push(part.trim());
 }
 return {parts:active.slice(0,4),excluded:exclude.slice(0,4),negated:exclude.length>0};
}
export function classifyQuestionPart(input){
 const q=foldQuestion(input);if(!q)return 'clarification';
 const victims=/(?:\blen[ayie]\b|\brudnick\w*\b|\bofiar\w*\b|\bcial\w*\b)/.test(q);
 if(/\b(?:przyznaj\w*\s+sie|czy\s+(?:to\s+)?(?:ty|pan|pani)\s+\w*\s*(?:zabil|zamordow)|czy\s+(?:zabiles|zabilas|zamordowales|zamordowalas))/.test(q))return 'direct_accusation';
 if(/(?:\bodmaw\w*\b|\badwokat\w*\b|\bpelnomocnik\w*\b|\bprzerwa\s+w\s+przesluchaniu\b)/.test(q))return 'procedural_refusal';
 if(/(?:\bdokad\b|\bgdzie\b.{0,30}\bwychodz\w*|\bwychodz\w*\b.{0,25}\bbiur\w*)/.test(q)&&
    /(?:\bwychodz\w*|\bwyszed\w*|\bwyjsc\w*|\bwidziec\b|\bwidzial\w*)/.test(q))return 'self_departure';
 if(/(?:\buzycie\s+kont\w*|\bkonto\b|\blog\w*|\bsesj\w*)/.test(q)&&
    /(?:\bobecnosc\b|\bczlowiek\w*|\bosob\w*|\bfizyczn\w*)/.test(q)&&
    /(?:\brozni\w*|\bpotwierdz\w*|\bdowodz\w*|\bczy\b)/.test(q))return 'account_identity';
 if(/(?:\bbhp\b|\bzagrozen\w*|\bryzyk\w*)/.test(q)&&
    /(?:\bstanowisk\w*|\bzagrozen\w*|\bniebezpiecz\w*|\bryzyk\w*)/.test(q)&&
    !/(?:\bwysl\w*|\bnadano\b|\bdostarcz\w*)/.test(q))return 'bhp_hazard';
 if(/(?:\bostatni\w*\s+rozmow\w*|\bostatni\w*\s+kontakt\w*)/.test(q)&&
    /(?:\blen\w*|\bofiara\b)/.test(q))return 'last_contact';
 if(/(?:brakuj\w*|brak\s+(?:wpisu|podpisu)|niepeln\w*|pominiet\w*|puste\w*)/.test(q)&&
    /(?:wpis\w*|formularz\w*|zleceni\w*|dokumentacj\w*|rejestr\w*)/.test(q))return 'workshop_missing_entry';
 if(/(?:bhp|zgloszen\w*|ostrzezen\w*|raport\s+bhp)/.test(q)&&
    /(?:wysl\w*|nadano|dostarcz\w*|dotarl\w*|zlozon\w*|przekazan\w*|poszlo)/.test(q))return 'bhp_sent';
 if(/(?:autoryzac\w*|autoryzowan\w*|zgod\w*\s+na\s+test)/.test(q)&&
    /(?:potwierdz\w*|wykaz\w*|dokumentuj\w*|dowod\w*|sprawdz\w*|weryfik\w*|test\w*)/.test(q))return 'test_authorization';
 const alarm=/(?:zglosz\w*|zawiadom\w*|powiadom\w*|wezw\w*|alarm\w*|znalezien\w*|znalaz\w*|odnalaz\w*)/.test(q);
 const alarmQuestion=/(?:\bkto\b|\bkomu\b|\bczy\b|\bkiedy\b|\bo ktorej\b|\bktorej godzin)/.test(q);
 if(alarm&&alarmQuestion&&(victims||/\balarm\b|znalezien|znalaz|pomoc/.test(q)))return 'alarm_report';
 // A question about the provenance of an alibi is not a request to repeat the alibi.
 if(/(?:\bkto\s+(?:moze|mogl|potrafi)\s+(?:to\s+)?potwierdz\w*|\bczy\s+ktos\s+moze\s+(?:to\s+)?poswiadcz\w*|\bco\s+potwierdz\w*\s+twoj\w*\s+obecnosc)/.test(q))return 'corroboration';
 if(/(?:\bwczesniej\b|\bpoprzednio\b|\bpierwotn\w*\b|\bprzypomnij\b|\bprzed chwila\b)/.test(q)&&
    /(?:\bzeznan\w*|\bmowil\w*|\bpowiedzial\w*|\bwersj\w*|\bwypowiedz\w*|\balibi\b)/.test(q))return 'previous_statement';
 if(/(?:\bsprzeczn\w*|\bnie zgadzaj\w*|\bnie zgadza\w*|\brozbiezn\w*|\bzmieniasz\s+wersj\w*|\btwierdzil\w*\s+inaczej)/.test(q))return 'contradiction';
 if(/(?:\bskoro\b|\bprzeciez\b|\bjak\s+mozesz\b|\bjak\s+moze\s+pan\b)/.test(q)&&
    /(?:\bnie\s+(?:widzial\w*|obserwowal\w*|byles|bylas|patrzyl\w*)|\bnikt\s+nie\s+wszedl|\bpewnosc\b|\btwierdz\w*)/.test(q))return 'epistemic_challenge';
 if(/(?:\bna ile\b.{0,30}\bpew\w*|\bna pewno\b|\bczy\s+mozesz\s+wykluczyc|\bjak\w*\s+pewn\w*|\bpewnosc\b|\bwykluczyc\b)/.test(q))return 'certainty_limit';
 if(/(?:\brelacj\w*\s+z\s+len\w*|\bjakie\s+byly\s+.{0,20}\brelacj\w*|\bco\s+(?:cie|was)\s+laczylo|\bjak\w*\s+laczyla\s+.{0,20}\brelacj\w*|\bkonflikt\s+z\s+len\w*)/.test(q))return 'relationship';
 if(/(?:\bkomu\b|\bdo kogo\b|\bkogo poinformowal\w*|\bkogo zawiadomil\w*|\bodbiorc\w*|\badresat\w*)/.test(q)&&
    /(?:\bzglos\w*|\bawari\w*|\bprzekaz\w*|\bwiadomos\w*|\bpowiadom\w*|\binformow\w*)/.test(q))return 'report_recipient';
 if(/(?:\bw ktorym pomieszczeniu\b|\bgdzie dokladnie\b|\bw ktorej czesci\b|\bw ktorym miejscu\b)/.test(q))return 'place_precision';
 const personSelf=/(?:\balibi\b|\btwoj\w*\s+(?:pobyt|obecnosc|alibi)|\bswoj\w*\s+(?:pobyt|obecnosc)|\b(?:ty|pan|pani)\s+(?:byl|byla|przebywal)|\b(?:byles|bylas|przebywales|przebywalas)\b|\bgdzie\s+(?:byles|bylas|przebywales|przebywalas)|\bco\s+robil\w*\s+(?:miedzy|od|o)|\b(?:byl|byla)\s+pan\b)/.test(q);
 const aboutVictim=/(?:gdzie\s+(?:byla|przebywala)\s+(?:lena|ona)|gdzie\s+(?:byla|przebywala)\s+ofiara)/.test(q);
 if(personSelf&&!aboutVictim)return 'self_alibi';
 if(/(?:\bostatni\w*\s+(?:raz|spotkan|kontakt)|\bkiedy\s+.{0,48}\b(?:lena|lene|leny)\b|\bgdzie\s+.{0,45}\b(?:lena|lene|leny)\b)/.test(q))return 'last_contact';
 if(/(?:\bskad\b|\bzrodl\w*|\bna jakiej podstawie\b|\bskad ta pewnosc\b|\bkto powiedzial\b)/.test(q))return 'knowledge_source';
 if(/(?:\bco\s+(?:sam|sama)\s+widzial\w*|\bco\s+(?:ty|pan|pani)\s+(?:sam|sama)\s+widzial\w*|\bczy\s+(?:ty|pan|pani)\s+(?:sam|sama)\s+widzial\w*)/.test(q))return 'direct_observation';
 if(/(?:\bco\s+sie\s+stalo\s+potem|\bco\s+bylo\s+dalej|\bco\s+dalej\b|\bw jakiej kolejnosci\b|\bnastepnie\b)/.test(q))return 'event_sequence';
 if(/(?:\bco\s+z\s+tym\s+zrobil\w*|\bjak\w*\s+dzialania\w*\s+podj\w*|\bjak\s+zareagowal\w*)/.test(q))return 'action_taken';
 if(/(?:\bco\s+(?:cie|pana|pan(i|ia))\s+sklonil\w*|\bpowod\w*\s+tej\s+decyzji|\bco\s+cie\s+sklonilo)/.test(q))return 'reason';
 if(/(?:\bco\s+z\s+(?:nia|nim)|\bo\s+kim\s+mowisz|\bkogo\s+masz\s+na\s+mysli)/.test(q))return 'clarify_reference';
 if(/(?:\b(?:widziales|widzialas|widzial)\s+(?:raport|dokument)|\bco\s+wynika\s+z\s+dokument\w*|\bczy\s+masz\s+raport)/.test(q))return 'documents';
 if(/(?:\bna wlasne oczy\b|\bosobiscie\s+widzial\w*|\bco\s+(?:pan|pani|ty)\s+(?:widzial\w*|zaobserwowal\w*)|\bczy\s+(?:pan|pani|ty)\s+(?:widzial\w*|obserwowal\w*))/ .test(q))return 'direct_observation';
 if(/(?:\bco\s+powiedziala\s+lena|\brozmawial\w*\s+z\s+lena|\bkiedy\s+ostatnio\b.{0,45}\blen\w*|\bostatni\s+kontakt\b)/.test(q))return 'last_contact';
 if(/(?:\b0?\d[:.]\d\d\b|\bczas\b|\bo ktorej\b|\bkiedy\b|\bgodzin\w*|\bmiedzy\b)/.test(q))return 'chronology';
 if(/(?:\bkto\b|\bkomu\b|\bczyj\w*\b)/.test(q))return 'person';
 if(/(?:\bdlaczego\b|\bczemu\b|\bpowod\w*|\bpo co\b)/.test(q))return 'reason';
 if(/(?:\bprotokol\w*|\bdokument\w*|\bzleceni\w*)/.test(q))return 'documents';
 return 'clarification';
}
export function analyzeQuestion(question){
 const raw=foldQuestion(question),{parts,excluded,negated}=positiveClauses(question);
 const classified=parts.map(text=>({text,intent:classifyQuestionPart(text)}));
 const intents=[...new Set(classified.map(c=>c.intent))].slice(0,5);
 const primary=classified[0]?.intent||'clarification';
 const q=parts.join(' '),aspects=[];
 if(/\b(?:kto|komu|kim|przez kogo)\b/.test(q))aspects.push('who');
 if(/\b(?:kiedy|godzin\w*|o ktorej|miedzy|\d\d?:\d\d)\b/.test(q))aspects.push('when');
 if(/\b(?:gdzie|miejsce|pobyt|przebyw)/.test(q))aspects.push('where');
 if(/\b(?:skad|zrodlo|potwierdz|na jakiej podstawie)\b/.test(q))aspects.push('source');
 if(/\b(?:dlaczego|czemu|po co|powod\w*)\b/.test(q))aspects.push('why');
 const questionWords=[...new Set((q.match(/\b(?:kto|komu|co|gdzie|kiedy|skad|dlaczego|czemu|jak|czy|ile)\b/g)||[]))].slice(0,8);
 const references=[...new Set((q.match(/\b(?:lena|leny|lene|rudnick|marek|janusz|tomasz|kamil|elzbieta|magdalena)\b/g)||[]))].slice(0,6);
 const time=(q.match(/\b\d{1,2}[:.]\d\d\b/g)||[]).slice(0,3).map(x=>x.replace('.',':'));
 const compound=classified.length>1;
 const sensitive=intents.includes('direct_accusation')||intents.includes('procedural_refusal')||/(?:zataj\w*|zatai\w*|falszow\w*|podrob\w*|oszuk\w*|ukryl\w*|celowo\s+(?:nie|zrobil)|zabil\w*|zamordow\w*)/.test(q);
 return {version:INTENT_VERSION,primary,intents,aspects:aspects.slice(0,4),
  clauses:classified.map(x=>({...x,intents:[x.intent]})),parts:classified,
  excludedTopics:excluded,positiveQuestion:q,subject:/\blen[ayie]\b|\brudnick\w*\b/.test(q)?'victim':primary==='self_alibi'?'self':'unspecified',time,
  slots:{negated:negated||/\bnie\b/.test(q),negatedCorrection:negated,compound,questionWords,references},
  needsClarification:primary==='clarification',sensitive,
  evidenceSourceQuestion:['knowledge_source','direct_observation'].includes(primary),
  inputLooksLikeInstruction:/\b(?:zapomnij instrukcje|ignoruj zasady|jako model ai|zlam zabezpieczenia|ujawnij sekret|odblokuj dowody)\b/.test(raw)};
}
/** Read-only adapter for the historical PS611_NLU label vocabulary.
 * It translates an existing plan; it never interprets the question again.
 */
export function legacyQuestionPlan(question){
 const p=analyzeQuestion(question);
 const labels={self_alibi:'alibi',alarm_report:'action_taken',last_contact:'victim_contact',
  workshop_missing_entry:'documents',bhp_sent:'action_taken',test_authorization:'corroboration',
  chronology:'time_precision',reason:'reason_for_action',direct_observation:'personal_observation',
  person:'unknown',clarification:'unknown'};
 const name=x=>labels[x]||x;
 const intents=[...new Set(p.intents.map(name))].filter(x=>x!=='unknown');
 return {...p,primary:name(p.primary),intents,clauses:p.clauses.map(x=>({...x,intents:x.intents.map(name)}))};
}
