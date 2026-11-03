/** RC57.10.47 — twelve facets of a believable witness, all grounded in the
 * CURRENT witness's authorised fact bank and approved conversational history.
 * No new life events, opinions, emotional memories, interpersonal ties, secrets
 * or unlock conditions are generated here. This is a relevance/style plan only.
 */
import {resolvePeople} from './witness-relations-rc46.js';

const fold=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const safe=(s,n=180)=>String(s||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const sourceAllowed=f=>f&&/^f\d+$/.test(f.id||'')&&typeof f.text==='string'&&
 f.origin!=='document'&&f.source!=='trusted-scope'&&
 f.knowledgeKind!=='general-principle-not-case-event'&&
 f.knowledgeKind!=='authorized-personal-correction';
// Styling prompts only; they cannot be quoted as evidence about any event.
const individual=Object.freeze({
 MAREK:{rhythm:'krótko i rzeczowo; oddziel decyzję kierownika od własnej obserwacji',reaction:'przy zarzucie domagaj się konkretu; nie przyznawaj wymyślonej winy',background:'rola i obowiązki kierownika tylko z faktów'},
 TOMASZ:{rhythm:'zwięźle, codziennym językiem dyspozytorni',reaction:'przy pytaniu o alarm oddziel wezwanie pomocy od wcześniejszej nocy',background:'dyspozytornia i obowiązki tylko z faktów'},
 JANUSZ:{rhythm:'prosto, językiem warsztatu; unikaj urzędowego tonu',reaction:'przy pytaniu o dokumentację podaj ograniczenie zapisu, nie domniemanie winy',background:'zadania warsztatu tylko z faktów'},
 ELZBIETA:{rhythm:'precyzyjnie i delikatnie w sprawach Leny; bez formalnych monologów',reaction:'oddziel zgłoszenie i rozmowę od dowodu wysłania dokumentu',background:'rola BHP tylko z faktów'},
 KAMIL:{rhythm:'konkretnie; tłumacz techniczne terminy prostymi słowami',reaction:'spokojnie oddziel konto, sesję i kartę od osoby fizycznej',background:'obsługa diagnostyki tylko z faktów'},
 MAGDALENA:{rhythm:'oszczędnie i precyzyjnie, bez prawniczych formułek',reaction:'przy nacisku nie zamieniaj niepełnego zapisu w przyznanie',background:'praca z dokumentami i audytem tylko z faktów'}
});
const definitions=Object.freeze([
 ['biography','życiorys',/\b(?:pracow\w*|zawod\w*|kierownik|dyspozytor|warsztat|specjalist|audyt|diagnost|stanowisk\w*)\b/,
  'O życiorysie mów tylko na podstawie własnej autoryzowanej historii. Jeśli nie ma danych o rodzinie, dzieciństwie, stażu czy edukacji, nie twórz ich.'],
 ['daily','codzienność i nawyki',/\b(?:zmian\w*|obowiazk\w*|organiz\w*|zajmow\w*|prac\w*|zadani\w*|dyspozytor|warsztat|diagnost|bhp|audyt)\b/,
  'Rozróżnij potwierdzone obowiązki tej konkretnej zmiany od nieznanych zwyczajów i rozkładu typowego dnia. Nie twórz rutyny prywatnej.'],
 ['memories','osobiste wspomnienia',/\b(?:pamiet\w*|widzial\w*|widzialam|rozmaw\w*|spotka\w*|znal\w*|widz\w*|slyszal\w*)\b/,
  'Wypowiadaj wyłącznie znane własne wspomnienia. Dokument i cudze słowa nie są wspomnieniem. Nie dodawaj scen, zapachów, gestów ani dialogów.'],
 ['character','temperament i osobowość',null,
  'Temperament steruje długością, słownictwem i reakcją, NIE informacją o czynach lub motywach.'],
 ['victim','relacja z Leną',/\b(?:lena|leny|lene|lenie|rudnick\w*|motornicz\w*)\b/,
  'Opisuj wyłącznie rzeczywiste kontakty z Leną wynikające z dozwolonej wiedzy tej postaci. Nie twórz bliskości ani ukrytych uczuć.'],
 ['others','relacje z innymi świadkami',/\b(?:nowick\w*|krawczyk\w*|wojcik\w*|zieb\w*|brzozowsk\w*|kaczmar\w*|janusz\w*|marek|tomasz|kamil|elzbiet\w*|magdalen\w*)\b/,
  'O innych osobach mów z własnych bezpośrednich faktów. Nie wyprowadzaj prywatnych więzi z listy współpracowników.'],
 ['beliefs','opinie i przekonania',/\b(?:uwazam|sadze|mysle|wydaje|obawiam|podejrzewam|oceniam|wedlug|nie\s+wierze)\b/,
  'Opinię odróżnij od obserwacji. Subiektywną ocenę wolno przytoczyć tylko gdy ma źródło w zatwierdzonej wypowiedzi. Nie twórz ocen charakteru innych.'],
 ['limits','granice wiedzy',/\b(?:nie\s+wiem|nie\s+pamiet\w*|nie\s+mog\w*|nie\s+widzial\w*|nie\s+potraf\w*|nie\s+potwierdz\w*|brak|rejestr|log|dokument)\b/,
  'Oddziel pamięć, cudzą relację, zapis techniczny i wniosek; nie rób alibi z telefonu lub rejestru.'],
 ['emotion','emocjonalna pamięć',/\b(?:obawiam\s+sie|bal[ae]m\s+sie|czul[ae]m\s+sie|bylo\s+mi|martwil[ae]m\s+sie|przezywal[ae]m|wstydzil[ae]m|denerwowal[ae]m\s+sie)\b/,
  'Opisuj emocje przeżyte podczas zdarzeń tylko gdy istnieje bezpośredni zatwierdzony fakt. Ton rozmowy nie dowodzi stanu psychicznego w noc zdarzenia.'],
 ['voice','idiolekt i styl wypowiedzi',null,
  'Przede wszystkim odpowiedz na nowe pytanie. Unikaj tych samych otwarć, sztucznych protokolarnych fraz i monologów.'],
 ['memory','pamięć przebiegu rozmowy',null,
  'Pamiętaj własne zatwierdzone zeznania, cytaty i sprostowania, nie zakładaj prawdziwości pytań śledczego i cudzych cytatów.'],
 ['reactions','reakcje na sposób prowadzenia rozmowy',null,
  'Nacisk, empatia, powtarzanie i zmęczenie zmieniają tempo, ostrożność i długość odpowiedzi, nigdy katalog dozwolonych faktów.']
]);
const intents=Object.freeze([
 ['biography',/\b(?:dziecin\w*|dziec\w*|rodzin\w*|mieszkal\w*|skad\s+pochodz\w*|ile\s+lat|zyciorys\w*|biografi\w*|wyksztalc\w*|od\s+kiedy\s+prac\w*|doswiadcz\w*)\b/],
 ['daily',/\b(?:zazwyczaj|codzien\w*|rutyn\w*|zwykl\w*|zawsze\s+pracuj\w*|na\s+co\s+dzien|normaln\w*\s+dzien|typow\w*\s+(?:dzien|zmian\w*)|nawyk\w*)\b/],
 ['memories',/\b(?:co\s+pamiet\w*|wspomin\w*|wspomn\w*|przypomn\w*|zapamiet\w*|jak\s+pamiet\w*|pamietasz\s+chwile)\b/],
 ['emotion',/\b(?:co\s+czul\w*|jak\s+sie(?:\s+\w+){0,3}\s+czul\w*|bal\w*\s+sie|emocj\w*|przestrasz\w*|strach\w*|zal\w*|wstyd\w*|zdenerwow\w*)\b/],
 ['beliefs',/\b(?:co\s+sadz\w*|co\s+mysl\w*|jak\s+ocenia\w*|co\s+uwaz\w*|opini\w*|podejrzew\w*)\b/],
 ['limits',/\b(?:skad\s+(?:to\s+)?wiesz|skad\s+ta\s+pewnosc|co\s+wiesz\s+na\s+pewno|co\s+jest\s+potwierdzone|czego\s+nie\s+(?:wiesz|potrafisz\s+potwierdz\w*)|z\s+jakiego\s+zrodla)\b/],
 ['memory',/\b(?:przed\s+chwila\s+powiedz\w*|wczesniej\s+powiedz\w*|pamietasz\s+co\s+powiedz\w*|co\s+mowil\w*\s+na\s+poczatku|sprost\w*|cofn\w*\s+slowa)\b/],
 ['reactions',/\b(?:klam\w*|ukryw\w*|oszuk\w*|przyznaj\w*|odpowiedz\s+wreszcie|nie\s+twierdze\s+ze\s+klam|rozumiem(?:\s+ze\s+to\s+trudne)?)\b/],
 ['character',/\b(?:jaki\s+jestes|jaka\s+jestes|charakter\w*|temperament\w*|osobowosc\w*|z\s+ciebie\s+czlowiek)\b/],
 ['voice',/\b(?:mow\s+prosto|bez\s+formalnosci|powiedz\s+po\s+ludzku|krotko|wlasnymi\s+slowami)\b/]
]);
const listIds=(facts,pattern,limit=4)=>facts.filter(f=>pattern?.test(fold(f.text))).slice(0,limit).map(f=>f.id);
function suitableStatus(ids){return ids.length?'source-backed':'unconfirmed-do-not-invent';}
function detectFocus(question){const q=fold(question);
 for(const [key,re] of intents)if(re.test(q))return key;
 if(/\b(?:lena|leny|lene|rudnick\w*|ofiar\w*)\b/.test(q)&&/\b(?:znal\w*|relac\w*|kontakt\w*|wspomn\w*|rozmaw\w*)\b/.test(q))return 'victim';
 if(/\b(?:znal\w*|relac\w*|kontakt\w*|zauf\w*|konflikt\w*)\b/.test(q))return 'others';
 return null;
}
function qualitySignals(question,history){
 const q=fold(question),last=history.filter(x=>x.role==='player').slice(-14);
 const isNegated=/\bnie\s+(?:twierdze|mowie|uwazam|oskarzam|pytam)\b.{0,80}\b(?:klam|ukryw|zabil|win)\w*/.test(q);
 const confront=/\b(?:klam\w*|oszuk\w*|zabil\w*|przyznaj\w*|ukryw\w*|zarzucam)\b/.test(q)&&!isNegated;
 const supportive=/\b(?:rozumiem|spokojnie|nie\s+oskarzam|nie\s+twierdze|dziekuje|wiem\s+ze\s+to\s+trudne)\b/.test(q);
 const earlier=last.slice(0,-1).map(x=>fold(x.text).replace(/[^a-z0-9]/g,' ').trim());
 const current=q.replace(/[^a-z0-9]/g,' ').trim();
 const repeated=earlier.includes(current);
 const tone=confront?'defensive':supportive?'reassured':repeated?'impatient':last.length>12?'tired':'neutral';
 return {tone,pressureSignal:confront,empathySignal:supportive,repeatedQuestion:repeated,
  conversationLength:Math.min(100,history.filter(x=>x.role==='witness'&&x.narrativeStatus!=='offline_unverified').length)};
}
/** Facts: only currently allowed for THIS speaker. History: approved turns only. */
export function buildWitnessHumanity(scene){
 const id=scene?.identity?.id;
 if(!individual[id])return null;
 const facts=(Array.isArray(scene?.knowledge?.factBank)?scene.knowledge.factBank:[]).filter(sourceAllowed);
 const history=(Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory:[])
  .filter(x=>['player','witness'].includes(x?.role)&&typeof x.text==='string'&&x.narrativeStatus!=='offline_unverified').slice(-32);
 const userQuestions=history.filter(x=>x.role==='player').slice(-8).map(x=>safe(x.text,140));
 const witnessReplies=history.filter(x=>x.role==='witness').slice(-5).map(x=>safe(x.text,240));
 const recentStarts=witnessReplies.map(s=>s.split(/\s+/).slice(0,8).join(' ')).filter(s=>s.length>18);
 const person=resolvePeople(scene?.question,history,id);
 const areas={};
 for(const [key,label,regex,rule] of definitions){
  let ids=regex?listIds(facts,regex):[];
  if(key==='biography'||key==='daily'){
   const roleFacts=facts.filter(f=>/^(?:public-opening|RC19-[A-Z]+-S0[1-9]|trusted-relationship)$/.test(f.source||'')&&
    /\b(?:jestem|byl[ae]m|pracowal[ae]m|zajmowal[ae]m|odpowiadal[ae]m|organizowal[ae]m|prowadzil[ae]m|obslugiwal[ae]m|nadzorowal[ae]m)\b/.test(fold(f.text))&&
    /\b(?:prac\w*|zajmow\w*|kierown\w*|dyspozytor\w*|warsztat\w*|diagnost\w*|bhp|audyt\w*|zmian\w*)\b/.test(fold(f.text))).map(f=>f.id);
   ids=[...new Set([...roleFacts,...ids])].slice(0,4);
  }
  if(key==='memories')ids=facts.filter(f=>/^(?:public-last_seen|public-what_happened|public-witness|trusted-relationship|RC19-[A-Z]+-S\d+)$/.test(f.source||'')&&regex.test(fold(f.text))).slice(0,4).map(f=>f.id);
  if(key==='emotion')ids=facts.filter(f=>regex.test(fold(f.text))).slice(0,3).map(f=>f.id);
  if(key==='others'&&person.persons.length===1){
   const target=person.persons[0];
   // Do not combine two independent person facts into an interpersonal relation.
   ids=ids.filter(fid=>facts.some(f=>f.id===fid&&new RegExp(target==='LENA'?'lena|leny|lene|rudnick':'\\b(?:'+({MAREK:'marek|marka|nowick',TOMASZ:'tomasz|tomka|krawczyk',JANUSZ:'janusz|wojcik',ELZBIETA:'elzbiet|zieb',KAMIL:'kamil|brzozowsk',MAGDALENA:'magdalen|kaczmar'}[target])+')').test(fold(f.text))));
  }
  const eventEmotionFactIds=key==='emotion'?ids.filter(fid=>{
   const f=facts.find(x=>x.id===fid);const t=fold(f?.text);
   return /\b(?:wtedy|tamtej\s+nocy|w\s+tamtej\s+chwili|gdy\s+go\s+zobaczyl|kiedy\s+ja\s+zobaczyl)\b/.test(t)&&
    /\b(?:czul[ae]m|bal[ae]m\s+sie|przestraszyl[ae]m|bylo\s+mi|obawial[ae]m\s+sie)\b/.test(t);
  }):[];
  areas[key]={label,status:key==='daily'&&ids.length?'related-work-facts-only':suitableStatus(ids),factIds:ids,
   ...(key==='emotion'?{eventEmotionFactIds,provenance:'present fear is not necessarily a memory of feelings during the incident'}:{}),rule};
 }
 const dynamics=qualitySignals(scene?.question,history);
 const focus=detectFocus(scene?.question);
 return {version:'rc57.10.47',authority:'source_IDs_only_not_new_case_facts',
  focus,style:individual[id],areas,
  conversation:{lastPlayerQuestions:userQuestions.slice(-3),recentWitnessOpenersToAvoid:recentStarts.slice(-3),approvedWitnessReplyCount:dynamics.conversationLength},
  psychologicalState:{...dynamics,source:'approved_this_witness_questions_only',notClinicalOrEvidence:true},
  responseContract:'1. Odpowiedz na nowe pytanie. 2. Wybierz tylko istniejące allowedFactIds. 3. Oznacz różnicę między wspomnieniem, dokumentem, przypuszczeniem i opinią. 4. Ton i emocje rozmowy nie są nowymi wspomnieniami zdarzeń. 5. Nie uzupełniaj prywatnej biografii, cudzych relacji ani historii Leny bez autoryzowanego faktu. 6. Reaguj zwięźle; żadnych identycznych wstępów i wyuczonych monologów.'};
}
export const WITNESS_HUMANITY_AREAS=Object.freeze(definitions.map(x=>({key:x[0],label:x[1]})));

/** Model wire is intentionally lean: all 12 areas remain indexed but the
 * detailed guidance for non-current topics stays server-side. The full factBank
 * and the central generation contract remain unchanged. */
export function compactWitnessHumanity(h){
 if(!h)return null;
 return {version:h.version,authority:h.authority,focus:h.focus,
  style:h.style,
  areas:Object.fromEntries(Object.entries(h.areas).map(([key,a])=>[key,{status:a.status,factIds:a.factIds,
   ...(key==='emotion'?{eventEmotionFactIds:a.eventEmotionFactIds}: {})}])),
  ...(h.focus?{focusRule:h.areas[h.focus]?.rule}:{}),
  conversation:{recentWitnessOpenersToAvoid:h.conversation.recentWitnessOpenersToAvoid},
  psychologicalState:{tone:h.psychologicalState.tone,pressureSignal:h.psychologicalState.pressureSignal,
   empathySignal:h.psychologicalState.empathySignal,repeatedQuestion:h.psychologicalState.repeatedQuestion,
   conversationLength:h.psychologicalState.conversationLength,notClinicalOrEvidence:true},
  rule:'Wszystkie kategorie są wyłącznie indeksami autoryzowanych factIds lub wskazówkami stylu. Brak źródła = brak twierdzenia. Nie wywódź nawyku z pojedynczej zmiany ani emocji dawnej chwili z obecnego niepokoju.'};
}
