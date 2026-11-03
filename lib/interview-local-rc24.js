/** Deterministic server fallback: only literal text from trusted factBank / signed registry.
 * It does not infer plot facts, unlock exhibits, or treat old witness statements as proof.
 * RC57.10.44: answer the current question before resorting to a generic refusal.
 */
import {witnessRefusal} from './trusted-interview-624.js';
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const words=s=>new Set((fold(s).match(/[a-z]{4,}/g)||[]).filter(x=>!['jest','tego','ktory','ktora','pana','pani','mnie','moze','bylo','teraz','prosze'].includes(x)).map(x=>x.slice(0,Math.min(x.length,6))));
const scope={
 location:/\b(?:gdzie|pobyt|obecnosc|alibi|przebywal|byles|bylas|miejsce)\b/,
 role:/\b(?:rol[ae]|funkcj\w*|stanowisk\w*|odpowiadal|zajmowal|obowiazk\w*|pracowal|zmianie)\b/,
 witness:/\b(?:kto|ktos|osoba)\b.{0,70}\b(?:potwierdz|poswiadcz|widzial|swiadk)\b/,
 knowledge:/\b(?:skad wiesz|skad to wiesz|zrodlo|przypuszczen|domysl|dokument|pamiec)\b/
};
const strictText=f=>typeof f?.text==='string'&&f.text.trim().length>=16&&f.text.length<=1450&&
 ['current','public','prior-local'].includes(f.origin)&&f.knowledgeKind!=='general-principle-not-case-event'&&
 f.knowledgeKind!=='authorized-personal-correction'&&f.origin!=='document';
// Short witness-specific conversational limits. These are dialogue style, not
// assertions about childhood, family, events, or undisclosed case secrets.
const limitsRC47=Object.freeze({
 MAREK:{biography:'O prywatnych sprawach nie chcę tu mówić. O decyzjach na zmianie odpowiem konkretnie.',daily:'Mogę opisać obowiązki na tej zmianie. Nie chcę przedstawiać jednej nocy jako całego mojego zwykłego dnia.',emotion:'Nie podam ci pewnej relacji o tym, co wtedy czułem. Mogę opisać to, co pamiętam.'},
 TOMASZ:{biography:'To moje życie prywatne. Jeśli pytasz o nocną zmianę, odpowiem.',daily:'Mogę powiedzieć, co robiłem tej nocy. Inne zmiany nie musiały wyglądać tak samo.',emotion:'Nie umiem dokładnie powiedzieć, co wtedy czułem. Wolę opowiedzieć, co widziałem.'},
 JANUSZ:{biography:'Nie chcę opowiadać o rodzinie. O robocie przy wagonie możemy pogadać.',daily:'O tej zmianie opowiem. Nie będę mówił, że każda moja zmiana wygląda identycznie.',emotion:'Nie będę sobie przypominał uczuć na siłę. Mogę powiedzieć, co robiłem.'},
 ELZBIETA:{biography:'Wolałabym zostawić życie prywatne poza tą rozmową. O pracy i zgłoszeniach mogę mówić.',daily:'Mogę opisać obowiązki z tej zmiany, ale nie potwierdzę, że każdy dzień wyglądał tak samo.',emotion:'Nie chcę przypisywać sobie uczuć z tamtej chwili bez pewnego wspomnienia. Mogę powiedzieć, co pamiętam.'},
 KAMIL:{biography:'Wolałbym mówić o tym, co ma związek z moją pracą i tą nocą.',daily:'Mogę opowiedzieć o zadaniach na tej zmianie. Z logów nie wyciągnę opisu codziennych nawyków.',emotion:'Nie mam pewnego wspomnienia swoich uczuć z tej chwili. Mogę opisać znane mi fakty.'},
 MAGDALENA:{biography:'Nie chcę wchodzić w sprawy rodzinne. Proszę pytać o moją pracę.',daily:'Potwierdzę zadania z tej zmiany, ale nie będę z nich wyprowadzać stałego planu dnia.',emotion:'Nie potrafię wiarygodnie odtworzyć swoich uczuć z tamtej chwili. Mogę mówić o tym, co pamiętam.'}
});
const styleRC47=Object.freeze({
 MAREK:{character:'Nie chcę oceniać siebie. Pytaj o konkretne decyzje.',voice:'Dobrze. Zapytaj o konkret, odpowiem bez formalności.',pressure:'Proszę o konkretny zarzut. Ogólne oskarżenie niczego nie wyjaśni.'},
 TOMASZ:{character:'Trudno mi to ocenić. Pytaj, co robiłem.',voice:'Dobrze. Krótko i na temat.',pressure:'Co konkretnie mam wyjaśnić? Nie chcę zgadywać.'},
 JANUSZ:{character:'Nie będę sobie wystawiał opinii. Pytaj o robotę.',voice:'No dobrze. O co chodzi?',pressure:'Powiedz konkretnie, co mi zarzucasz. Wróżenie nic nie da.'},
 ELZBIETA:{character:'Nie sądzę, żebym była najlepszą osobą do oceniania siebie. Proszę o konkretny przykład.',voice:'Oczywiście. Co dokładnie chciałbyś wiedzieć?',pressure:'Rozumiem pytanie, ale nie chcę wyciągać wniosków bez podstaw.'},
 KAMIL:{character:'To raczej ocena dla innych. Mogę wyjaśnić, co zrobiłem.',voice:'Jasne. Pytaj konkretnie.',pressure:'Wskaż, o jaki fakt albo zapis pytasz. Sam zarzut nie wystarczy.'},
 MAGDALENA:{character:'Nie zamierzam sama się oceniać. Mogę omówić swoje działania.',voice:'Dobrze. Proszę o pytanie.',pressure:'Proszę wskazać konkretne okoliczności, zamiast formułować ogólny zarzut.'}
});
const placePattern=/\b(?:w|we|przy|na|do)\s+(?:biurze|dyspozytorni|warsztacie|warsztatu|stanowisku|hali|korytarzu|przejsciu|zajezdni|rejonie|pomieszczeniu|administracji|konsoli)\b/g;
function hasPlace(text){
 const t=fold(text);
 for(const match of t.matchAll(placePattern)){
  const before=t.slice(Math.max(0,match.index-130),match.index);
  const clause=before.slice(Math.max(0,before.lastIndexOf('.')+1,before.lastIndexOf(';')+1));
  // A document or an incident *at* a location is not the speaker's whereabouts.
  // The same applies to third-person statements and explicit denials.
  if(!/\b(?:byl[ae]m|przebywal[ae]m|pracowal[ae]m|znajdowal[ae]m|wychodzil[ae]m|poszedl[ae]m|odszedl[ae]m|wrocil[ae]m|siedzial[ae]m)\b/.test(clause))continue;
  if(/\b(?:nie|nigdy)\s+(?:byl[ae]m|przebywal[ae]m|pracowal[ae]m|siedzial[ae]m|poszedl[ae]m|znajdowal[ae]m)\s*$/.test(clause))continue;
  if(/\bnie\s+(?:dowodzi|potwierdza|oznacza)\b[^.!?]{0,50}$/.test(clause))continue;
  return true;
 }
 return false;
}
function chooseFocusedFact(bank,category){
 const accepted=bank.filter(strictText);
 if(category==='location'){
  const sorted=accepted.filter(f=>hasPlace(f.text)).sort((a,b)=>
   Number(b.source==='public-alibi')-Number(a.source==='public-alibi')||
   Number(b.origin==='current')-Number(a.origin==='current')||a.text.length-b.text.length);
  return sorted[0]||null;
 }
 if(category==='role')return accepted.find(f=>f.source==='public-opening')||
  accepted.find(f=>/\b(?:kierownik|dyspozytor|warsztat|audytor|specjalist|mechanik)\b/.test(fold(f.text)))||null;
 if(category==='witness')return accepted.find(f=>/potwierdz|poswiadcz|swiadk/i.test(f.text)&&
   /\b[A-ZŁŚŻŹĆŃÓ][a-ząćęłńóśźż]+\s+[A-ZŁŚŻŹĆŃÓ][a-ząćęłńóśźż]+\b/u.test(f.text))||null;
 return null;
}
export function localInterviewReply(scene){
 const q=fold(scene.question),bank=scene.knowledge.factBank||[],parts=scene.questionParts||[];
 // RC57.10.45: the same server-verified conversational focus as the cloud
 // generator. A focus is only a lookup hint, never an additional fact source.
 const focusHint=scene.interrogationBrief?.focus||'';
 const answer=(text,facts=[],kind='scope')=>({ok:true,decision:'answer',primaryMode:true,text,factIds:facts.map(f=>f.id),sourceIds:[],sourceId:'turn',prefaceKey:0,
  semanticVerified:false,localVerified:true,localKind:kind});
 if(scene.presentedEvidence)return answer('Proszę wskazać konkretny fragment okazanego materiału i zapytać o jedną rzecz. Oddzielę jego treść od tego, co samodzielnie pamiętam.',[],'clarification');
 if(parts.length>1||scene.questionPlan?.slots?.compound)return answer('Proszę zadawać te pytania pojedynczo. Chcę odpowiedzieć dokładnie na każdą część.',[],'clarification');
 const prior=scene.dialogueFocus?.previousQuestion||scene.dialogueMemory?.lastQuestion||[...(scene.approvedThreadHistory||[])].reverse().find(x=>x.role==='player')?.text||'';
 const alibiContext=/alibi|biur|pobyt|gdzie|obecn|zmian/.test(fold(prior));
 // Negative focus: "Nie pytam o Lenę, tylko gdzie byłeś po północy".
 // A safe fallback must first try a permitted answer about one's own location,
 // rather than repeatedly refusing because the excluded name occurs in the prompt.
 const exclusion=/\bnie pytam\b.{0,100}\btylko\b/.test(q);
 const focus=exclusion?q.split(/\btylko\b/).slice(1).join(' '):q;
 // RC57.10.46: a question about another person is not an invitation to
 // replay this witness's alibi. Return only a literal current-witness fact
 // about the resolved target, or an explicit uncertainty.
 const rel=scene.interrogationBrief?.relationships;
 if(scene.interrogationBrief?.focus==='relationship'&&rel?.mentionMode==='ambiguous')
  return answer('O którą osobę chodzi? W poprzednim pytaniu wymieniono kilka osób.',[],'relationship_clarification');
 if(scene.interrogationBrief?.focus==='relationship'&&rel?.mentionMode==='group')
  return answer('O kogo konkretnie pytasz? Mogę powiedzieć, co sam wiem o wskazanej osobie.',[],'relationship_clarification');
 if(scene.interrogationBrief?.focus==='relationship'&&rel?.mentionMode==='unresolved')
  return answer('Kogo masz na myśli? Podaj imię lub nazwisko tej osoby.',[],'relationship_clarification');
 if(scene.interrogationBrief?.focus==='relationship'&&rel?.persons?.length){
  const candidates=new Set(bank.filter(strictText).map(f=>f.id));
  if(rel.crossPersonRelationshipUnproven)return answer('Nie mogę potwierdzić, jaka relacja łączyła te osoby. Mogę mówić tylko o kontaktach, które samodzielnie znam.',[],'relationship_limit');
  if(!rel.aspectSupported)return answer('Nie mam podstaw, żeby potwierdzić taki charakter relacji. Sama współpraca lub rozmowa nie dowodzi prywatnego zaufania, konfliktu ani związku.',[],'relationship_limit');
  if(rel.aspect==='third_party_location'&&!rel.thirdPartyLocationFactIds?.length)return answer('Nie potrafię potwierdzić miejsca pobytu tej osoby w pytanym czasie na podstawie własnej wiedzy.',[],'third_party_location_limit');
  if(rel.loadedPremise)return answer('Nie mam podstaw, żeby potwierdzić takie założenie. Proszę zapytać o konkretny znany mi kontakt lub zdarzenie.',[],'relationship_premise');
  const preferred=rel.aspect==='third_party_location'?rel.thirdPartyLocationFactIds:rel.pairFactIds?.length?rel.pairFactIds:rel.preferFactIds;
  const f=(preferred||[]).map(id=>bank.find(b=>b.id===id&&candidates.has(id))).find(Boolean);
  if(f)return answer(f.text,[f],'authored_relationship');
  return answer('Nie znam potwierdzonych szczegółów relacji tej osoby. Nie chcę dopowiadać jej prywatnych kontaktów ani motywów.',[],'relationship_limit');
 }
 // RC57.10.47 — source-backed personal context; never turn a role on this
 // one shift into an invented everyday habit, or a psychological style into
 // a purported memory of the incident.
 const human=scene.interrogationBrief?.humanity;
 if(human){
  const hf=human.focus;
  const chosen=key=>(human.areas?.[key]?.factIds||[])
   .map(id=>bank.find(f=>f.id===id&&strictText(f)))
   .find(Boolean);
  if(hf==='biography'){
   if(/\b(?:ile\s+lat|wiek|urodz\w*|dziecin\w*|rodzin\w*|zon\w*|maz|dziec\w*|skad\s+pochodz\w*|wyksztalc\w*|od\s+kiedy|jak\s+dlugo)\b/.test(focus))
    return answer(limitsRC47[scene.identity.id]?.biography||'Wolę nie omawiać spraw prywatnych.',[],'biography_limit');
   const f=chosen('biography');if(f)return answer(f.text,[f],'authored_biography');
  }
  if(hf==='daily'){
   // Facts about a single shift cannot establish a typical repeated routine.
   return answer(limitsRC47[scene.identity.id]?.daily||'Mogę opowiedzieć o tej konkretnej zmianie.',[],'daily_limit');
  }
  if(hf==='memories'&&!/\b(?:czy|kto|gdzie|skad)\b.{0,70}\b(?:zapis\w*|log\w*|dokument\w*)\b/.test(focus)){
   const f=chosen('memories');if(f&&/\b(?:pamiet\w*|byl[ae]m|widzial[ae]m|rozmawial[ae]m|uslyszal[ae]m|spotkal[ae]m|znal[ae]m|znalem|znalam|zajmowal[ae]m)\b/.test(fold(f.text)))
    return answer(f.text,[f],'authored_memory');
  }
  if(hf==='emotion'){
   const asksPast=/\b(?:wtedy|tamtej|wczesniej|w\s+tej\s+chwili|podczas\s+zdarzenia|po\s+znalezieniu|kiedy|gdy)\b/.test(focus);
   const ids=asksPast?(human.areas?.emotion?.eventEmotionFactIds||[]):(human.areas?.emotion?.factIds||[]);
   const f=ids.map(id=>bank.find(x=>x.id===id&&strictText(x))).find(Boolean);
   if(f)return answer(f.text,[f],'authored_emotion');
   return answer(limitsRC47[scene.identity.id]?.emotion||'Nie jestem pewien, co wtedy czułem.',[],'emotion_limit');
  }
  if(hf==='character')return answer(styleRC47[scene.identity.id]?.character||'Proszę pytać o konkrety.',[],'character_limit');
  if(hf==='voice')return answer(styleRC47[scene.identity.id]?.voice||'Dobrze, o co chodzi?',[],'voice_acknowledgement');
  if(hf==='memory'){
   if(/\b(?:sprost\w*|wycofa\w*|cofn\w*|popraw\w*)\b/.test(focus))
    return answer('Które konkretne słowa mam sprostować? Odniosę się do rzeczywistej wcześniejszej wypowiedzi.',[],'memory_clarification');
   const prior=(Array.isArray(scene.approvedThreadHistory)?scene.approvedThreadHistory:[])
    .filter(x=>x?.role==='witness'&&x.narrativeStatus!=='offline_unverified'&&typeof x.text==='string');
   const askOpening=/\b(?:poczatku|pierwsz\w*)\b/.test(focus);
   const record=askOpening?prior[0]:prior.at(-1);
   if(record){
    const quote=String(record.text).replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,320);
    const verb=['ELZBIETA','MAGDALENA'].includes(scene.identity.id)?'Powiedziałam':'Powiedziałem';
    if(quote.length>=12)return answer(`${verb} wcześniej: „${quote}${record.text.length>320?'…':''}”. To przypomnienie moich słów, nie dodatkowy dowód.`,[],'approved_self_recall');
   }
   return answer('Nie mam tu wcześniejszej własnej wypowiedzi do przytoczenia.',[],'memory_limit');
  }
  if(hf==='reactions'&&human.psychologicalState.pressureSignal)
   return answer(styleRC47[scene.identity.id]?.pressure||'Proszę o konkretne pytanie.',[],'pressure_boundary');
  if(hf==='beliefs'&&!(scene.interrogationBrief?.relationships?.persons?.length)){
   const f=chosen('beliefs');if(f&&/\b(?:uwazam|sadze|mysle|wydaje|obawiam|podejrzewam|wedlug\s+mnie)\b/.test(fold(f.text)))
    return answer(f.text,[f],'authored_opinion');
   return answer('Nie mogę uczciwie ocenić tego bez wiedzy o konkretnym zdarzeniu. Co dokładnie chcesz sprawdzić?',[],'opinion_limit');
  }
 }
 const asksWhere=scope.location.test(focus);
 if(asksWhere||focusHint==='location'){
  // Answer with the witness's literal authorised wording; however, an
  // undated place in the dossier is not automatically a post-midnight alibi.
  const askingAfterMidnight=/po\s+polnocy|po\s+godzinie\s*(?:00|0)\b/.test(focus);
  const f=chooseFocusedFact(bank,'location');
  if(f&&(!askingAfterMidnight||/po\s+polnocy|po\s+godzinie\s*(?:00|0)\b/i.test(fold(f.text))||/\bnie\s+byl[ae]m\s+(?:w|na|przy)\s+[^.!?]{2,65}?,\s*tylko\s+(?:w|na|przy)\b/.test(fold(f.text))))
   return answer(f.text,[f],'authored_location');
  // No authored location: never infer whereabouts from unrelated documents.
  return answer('Nie umiem wskazać dokładnego miejsca na podstawie tego, co pamiętam. Proszę zapytać o konkretną część zmiany.',[],'clarification');
 }
 if(scope.role.test(focus)&&/\b(?:rol[ae]|funkcj\w*|stanowisk\w*|obowiazk\w*)\b/.test(focus)){
  const f=chooseFocusedFact(bank,'role');if(f)return answer(f.text,[f],'authored_role');
 }
 if(scope.witness.test(focus)||/kto.*potwierdz|kto.*poswiadcz/.test(focus)||focusHint==='corroboration'){
  const f=chooseFocusedFact(bank,'witness')||bank.find(f=>strictText(f)&&f.source==='trusted-corroboration')||
   bank.find(f=>strictText(f)&&f.source==='public-witness');
  if(f)return answer(f.text,[f],'authored_corroboration');
  if(alibiContext){const priorFact=bank.find(f=>f.source?.endsWith('-S02')&&f.knowledgeKind==='authored-personal-background');
   if(priorFact&&priorFact.text.length<=1450)return answer(priorFact.text,[priorFact],'authored');}
  return answer('Nie mam teraz podstaw, żeby wskazać osobę potwierdzającą ten przedział czasu. Zapytaj o konkretne spotkanie lub zapis.',[],'scope');
 }
 // For 'skąd wiesz?' the fallback needs a source distinction, not a
 // verbatim reprint of the entire chronology. Both candidates are signed-off
 // statements from THIS witness and still carry their uncertainty qualifiers.
 if(focusHint==='knowledge_source'||scope.knowledge.test(focus)){
  const remembering=/pamiec|pamietasz|pamietasz|wspomnien|co\s+pamietasz/.test(focus);
  const priorities=remembering?['public-what_happened','public-last_seen','public-alibi']:
   ['trusted-corroboration','public-witness','public-unclear'];
  const f=priorities.map(key=>bank.find(f=>strictText(f)&&f.source===key)).find(Boolean);
  if(f)return answer(f.text,[f],'authored_source');
 }
 const follow=/^(?:a )?(?:kto|co|jak|kiedy|gdzie|dlaczego)?\s*(?:to|on|ona|oni|tam|wtedy)\b/.test(q);
 if(follow)return answer('Proszę doprecyzować, o którą osobę, wypowiedź lub sytuację chodzi.',[],'clarification');
 // Do not confirm presuppositions, quoted accusations or ironic formulations through keyword matching.
 if(/dlaczego|czemu|skoro|przeciez|podobno|rzekomo|czyli|zabil|morder|zamord|przyzn|klam|ukryl|usun|grozil|"|„|”/.test(q))return answer(witnessRefusal(scene.identity.id));
 let source=null;
 if(/(?:znal|znasz|relac|laczyl).*(?:ofiar|len)|(?:ofiar|len).*(?:znal|relac|laczyl)/.test(q))source='trusted-relationship';
 else if(/ostatni.*wid|kiedy.*wid/.test(q))source='public-last_seen';
 else if(/co sie (?:stalo|wydarzylo)|co wiesz.*zdarzen/.test(q))source='public-what_happened';
 if(source){const f=bank.find(f=>f.source===source&&strictText(f));if(f)return answer(f.text,[f],'authored');}
 const qw=words(q);
 const ranked=bank.filter(f=>strictText(f))
  .map(f=>({f,hits:[...qw].filter(w=>words(f.text).has(w)).length})).sort((a,b)=>b.hits-a.hits);
 // Conservative lexical retrieval: require multiple anchors and an unambiguous lead.
 const top=ranked[0];
 if(qw.size>=3&&top?.hits>=3&&top.hits/qw.size>=0.65&&top.hits>(ranked[1]?.hits||0))return answer(top.f.text,[top.f],'authored');
 return answer(witnessRefusal(scene.identity.id));
}
