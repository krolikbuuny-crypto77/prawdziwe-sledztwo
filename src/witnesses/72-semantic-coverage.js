/* Pakiet 6.12: rozpoznawanie polskich parafraz, aspektów i kontrola pokrycia.
 * Wynik planu ma status hipotezy: nie odblokowuje dowodów i nie dostarcza faktów.
 */
(function(){
 'use strict';
 const previous=window.PS611_NLU;
 if(!previous)throw Error('Required NLU 6.11 missing');
 const normalize=s=>String(s??'').toLocaleLowerCase('pl').normalize('NFD')
   .replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[„“”]/g,'"').replace(/\s+/g,' ').trim().slice(0,1400);
 const pattern = terms => new RegExp('(?:'+terms.join('|')+')','u');
 const R={
 personal_observation:[/\b(?:widz(?:ial|iel|isz)|zauwaz|dostrzeg|obserwow|slyszal|wlasn\w* ocz\w*|na miejscu)\w*/,
   /\b(?:sam\w*|osobiscie|rzeczywiscie|naprawde|bezposrednio|oczami|na miejscu|przy hali|przy wejsciu)\b/],
 knowledge_source:[/\b(?:skad|zrod\w*|podstaw\w*|dowiedzia\w*|przekaza\w*|powiedzial ci|informacj\w*|poglos\w*|wersj\w*)\b/,
   /\b(?:kto|jak|czy|od kogo|w jaki sposob|na czym|czym|poparc\w*|opierasz)\b/],
 certainty_limit:[/\b(?:pewn\w*|watpliw\w*|wykluczy\w*|mozliwosc\w*|podejrzen\w*|przypuszczen\w*|pamiec\w*|pomyl\w*|domysl\w*)\b/,
   /\b(?:potraf\w*|dopuszcz\w*|jesli|a jesli|raczej|wiedza|naprawde|moze|czy|na pewno)\b/],
 epistemic_challenge:[/\b(?:skoro|chociaz|przeciez|a sam|jak to pogodzic|na czym opierasz|czemu wykluczasz|jak mozesz|twierdzisz|mimo ze)\b/,
   /\b(?:nie|nikt|nikogo|wykluczasz|pewn\w*|widzi\w*|obserwow\w*|sta\w*|byles|bylas|za sciana|koniec korytarza)\b/],
 time_precision:[/\b(?:kiedy|o ktorej|godzin\w*|minut\w*|chwil\w*|pory|jak dlugo|ile trwa\w*|ile.{0,24}trwa\w*|ile czasu|przed polnoca|po polnocy|w jakim momencie)\b/,
   /\b(?:podaj|dokladn\w*|przyblizon\w*|spotkani\w*|rozmow\w*|wtedy|to bylo|mowimy|trwalo|trwal\w*)\b/],
 place_precision:[/\b(?:gdzie|ktoredy|z ktorej strony|w ktorym|z jakiej strony|w jakim|przy ktorym|wskaz pomieszczenie)\b/,
   /\b(?:hala|hali|pomieszczen\w*|stron\w*|wejsci\w*|zaplecza|stal\w*|stanowisk\w*|miejsce|dyzur|korytarz\w*|dokladnie)\b/],
 alibi:[/\b(?:alibi|gdzie\b|polozeni\w*|miejsce pobytu|obecnos\w*|stanowisk\w*|nie bylo cie|poszedl\w*|spedzil\w* okres|przebywal\w*)/,
   /\b(?:wtedy|noc\w*|zmian\w*|dyzur\w*|alarm\w*|znikn\w*|okres\w*|byles|bylas|poszedl\w*|pobytu|w chwili)\b/],
 corroboration:[/\b(?:potwierdz\w*|poswiadcz\w*|zweryfik\w*|niezalezn\w* slad\w*|kogo moge zapytac|monitoring|swiadek|grafik\w*|rejestr\w*)/,
   /\b(?:kto|kogo|czy|alibi|obecnos\w*|pobyt\w*|naprawde|rzeczywiscie|pamiet\w*|zmian\w*)\b/],
 event_sequence:[/\b(?:kolejnos\w*|po kolei|pierwsze|najpierw|nastepni\w*|potem|po czym|miedzy|od .* do|co wydarzylo sie)\b/,
   /\b(?:wydarzen\w*|zdarz\w*|alarm\w*|telefon\w*|odpraw\w*|spotkani\w*|rozmow\w*|co|co bylo)\b/],
 action_taken:[/\b(?:zrobil\w*|podj\w*|kroki|postapil\w*|wykonal\w*|zareagow\w*|probowa\w*|zabezpiecz\w*|pozostaw\w*|zglosil\w*)/,
   /\b(?:co|jak|jakie|czy|wtedy|po|problem\w*|ostrzezen\w*|zagrozen\w*|informacj\w*)\b/],
 reason_for_action:[/\b(?:dlaczego|czemu|po co|przyczyn\w*|powod\w*|sklonil\w*|motyw\w*|zdecydow\w*|uznal\w*|decyzj\w*)/,
   /\b(?:zostac|zostal\w*|poczekac|zglosz\w*|zmieni\w*|wybra\w*|zrobil\w*|postapil\w*|zareagow\w*|nie|czynnos\w*|by)\b/],
 report_recipient:[/\b(?:komu|do kogo|kogo poinformow\w*|kogo zawiadom\w*|kto dostal|kto.{0,35}dostal\w*|adresat\w*|do czyich rak|komu przekaz\w*|czyich rak)\b/,
   /\b(?:zglosz\w*|wiadomos\w*|informacj\w*|uster\w*|telefon\w*|awari\w*|ostrzezen\w*|problem\w*|trafilo|dostal)\b/],
 victim_contact:[/\b(?:len\w*|rudnick\w*|jej)\b/,
   /\b(?:rozmow\w*|rozmawi\w*|kontak\w*|spotkan\w*|widzia\w*|powiedzia\w*|przed alarmem|ostani\w*|ostatni\w*|tuż|tuz)\b/],
 relationship:[/\b(?:znajomos\w*|relacj\w*|stosunk\w*|spory|konflikt\w*|jak ocen\w*|jak dobrze zn\w*|laczylo|laczyla|wykraczal\w*)/,
   /\b(?:len\w*|rudnick\w*|wasz\w*|miedzy wami|prace|prac\w*|smi\w*)\b/],
 previous_statement:[/\b(?:wczesniej|poprzedni\w*|pierwsz\w* wersj\w*|na poczatku|pierwotn\w*|wrocmy|przypomnij|pamietasz)\b/,
   /\b(?:zeznani\w*|mowil\w*|powiedzia\w*|przedstawi\w*|wersj\w*|opisywal\w*|opowiadal\w*|alibi|telefon\w*|przesluchan\w*)\b/],
 contradiction:[/\b(?:sprzeczn\w*|kloca sie|kloce|nie zgadza\w*|inn\w* moment\w*|zmieniasz|dwa razy|jednak twierdz\w*|jak to pogodzic)\b/,
   /\b(?:wersj\w*|opis\w*|zeznani\w*|wypowied\w*|slowa|opowies\w*|moment\w*|mowil\w*|pierwsz\w*)\b/],
 clarify_reference:[/\b(?:ona|on|nim|nia|tamten|ta druga|ten drugi|ktory z nich|kim dokladnie|o kim dokladnie|o kogo chodz\w*|wspomnial\w*)\b/,
   /\b(?:gdzie|co|kto|a ten|czlowiek|zrobil\w*|poszedl\w*|ud\w*|kim|osoba|warsztat\w*)\b/],
 direct_accusation:[/\b(?:zabil\w*|zamordow\w*|zaboj\w*|morder\w*|doprowadzil\w* do smierci|twoja reka|przyznaj\w*|zarzucam ci|oskarzam cie)\b/,
   /\b(?:ty|twoja|ci|ciebie|pan|pani|przyznaj\w*|jestes|zabiles|zabilas|zamordowales|zamordowalas)\b/],
 procedural_refusal:[/\b(?:odmawi\w*|unikasz|unika pan|nie odpowia\w*|nie chcesz|pelonomocnik\w*|pelnomocnik\w*|adwokat\w*|zgodzisz sie|przerwa\w*)/,
   /\b(?:dlaczego|czemu|czy|z jakiej przyczyny|rozmow\w*|odpowied\w*|pytania|dalsze|obecnosci)\b/],
 documents:[/\b(?:dokument\w*|protokol\w*|raport\w*|rejestr\w*|zapis\w* techniczn\w*|odnotow\w*|podpisan\w*|archiw\w*)/,
   /\b(?:ktory|jaki|co|czy|przeglada\w*|czytal\w*|sprawdz\w*|wynika|zapis\w*|techniczny)\b/]
 };
 const IDS=previous.intents;
 const people=['marek','janusz','tomasz','kamil','elzbieta','magdalena','lena','leny','lene','rudnick'];
 const phrase=(q,re)=>re.test(q);
 const focusClauses=q=>q.split(/\?+|;|,\s*(?:ale|jednak|a|natomiast|oraz)\b|\b(?:a ponadto|i jeszcze)\b|\s+(?:i|a|oraz)\s+(?=(?:kto|co|komu|kiedy|gdzie|dlaczego|czemu|jak|skad|czy|ile|o ktorej)\b)/).map(x=>x.trim()).filter(x=>x.length>3).slice(0,5);
 function classifyOne(q){
  const matches=[];
  for(const id of IDS){const x=R[id];if(!x)continue;
   let score=x.reduce((n,r)=>n+(r.test(q)?1:0),0);
   if(score<2)continue;
   // Unikaj pomylenia ostatecznej oceny sytuacji z informacją o tym, kto coś zrobił.
   if(id==='personal_observation'&&/\b(?:raport|dokument|protokol)\b/.test(q)&&!/\b(?:sam\w*|osobiscie|wlasn\w*|oczami)\b/.test(q))continue;
   if(id==='direct_accusation'){
    const subject=/(?:\b(?:czy|to|zarzucam|oskarzam|twoja|ty|pan|pani|ci|ciebie|przyznaj\w*)\b.{0,90}\b(?:zabil|zamordow|zaboj|morder|smierci)|\b(?:zabil\w*|zamordow\w*)\b.{0,50}\b(?:ja|mnie|ci|twoj|ty)\b)/.test(q);
    const third=/\b(?:czy\s+)?(?:marek|janusz|tomasz|kamil|elzbieta|magdalena|lena)\s+(?:zabil\w*|zamordow\w*)/.test(q)||/\bkto\b.{0,35}\b(?:zabil|zamordow)/.test(q);
    if(!subject||third)continue;score+=5;
   }
   if(id==='reason_for_action'&&/\b(?:dlaczego|czemu|po co|powod|przyczyn|sklonil)\b/.test(q))score+=4;
   if(id==='report_recipient'&&/\b(?:komu|kogo|adresat|czyich rak)\b/.test(q))score+=3;
   if(id==='event_sequence'&&/\b(?:kolejnos|po kolei|pierwsze|najpierw|miedzy)\b/.test(q))score+=3;
   if(id==='epistemic_challenge'&&/\b(?:skoro|przeciez|chociaz|mimo ze)\b/.test(q))score+=4;
   if(id==='contradiction'&&/\b(?:zmieniasz|kloce|klo\w* sie|dwa razy|nie zgadza)\b/.test(q))score+=3;
   if(id==='knowledge_source'&&/\b(?:skad|kto przekaz|na jakiej podstawie|na czym opierasz)\b/.test(q))score+=3;
   if(id==='corroboration'&&/\b(?:potwierdz|poswiadcz|niezalezn\w* slad|kogo moge zapytac)\b/.test(q))score+=3;
   if(id==='direct_accusation')score+=1;
   matches.push({id,score});
  }
  matches.sort((a,b)=>b.score-a.score||IDS.indexOf(a.id)-IDS.indexOf(b.id));
  // Rozróżnienie pytań wyjaśniających od pytań o same działania.
  const first=matches[0]?.id;
  const dropped=new Set();
  if(first==='reason_for_action')dropped.add('action_taken');
  if(first==='report_recipient')dropped.add('knowledge_source');
  if(first==='epistemic_challenge'){dropped.add('knowledge_source');dropped.add('certainty_limit');}
  if(first==='direct_accusation')dropped.add('victim_contact');
  if(first==='contradiction')dropped.add('previous_statement');
  return matches.filter(x=>!dropped.has(x.id)).slice(0,3);
 }
 function analyze(question){
  const old=previous.analyze(question),q=normalize(question);
  if(q.length<3||q.length>1380)return old;
  const clauses=focusClauses(q);
  // Ograniczenie obserwacji i zakwestionowana pewność mogą być w dwóch zdaniach.
  const crossEpistemic=/\b(?:nie stal\w*|nie byles|nie bylas|nie widzial\w*|nie obserwowal\w*)\b/.test(q)&&/\b(?:na czym opierasz|jak mozesz|skad wiesz|czemu wykluczasz|jak to pogodzic|twierdzisz)\b/.test(q);
  const votes=new Map();const perClause=[];
  for(const clause of clauses){
   const parts=classifyOne(clause);perClause.push({text:clause,intents:parts.map(x=>x.id)});
   for(const item of parts)votes.set(item.id,(votes.get(item.id)||0)+item.score);
  }
  if(crossEpistemic)votes.set('epistemic_challenge',(votes.get('epistemic_challenge')||0)+12);
  let candidates=[...votes].sort((a,b)=>b[1]-a[1]).map(([id])=>id);
  // Poprzednia wersja jest bezpiecznym dodatkowym sygnałem, nie jedynym kryterium.
  if(!candidates.length)candidates=old.intents.slice();
  if(!candidates.length)return {...old,clauses:perClause,coverageHints:[],version:'6.12'};
  if(candidates.includes('reason_for_action'))candidates=candidates.filter(id=>id!=='action_taken');
  if(candidates.includes('epistemic_challenge'))candidates=candidates.filter(id=>!['knowledge_source','certainty_limit'].includes(id));
  if(candidates.includes('direct_accusation'))candidates=candidates.filter(id=>id!=='victim_contact');
  const intents=candidates.slice(0,5);
  const compound=(clauses.length>1&&perClause.filter(c=>c.intents.length).length>1)||old.slots.compound||/\b(?:oraz|i jeszcze|a co|a dlaczego|i dlaczego|a kto|i kto|i gdzie|i kiedy|i komu|i skad)\b/.test(q);
  const aspects=compound?intents.slice(0,4):intents.slice(0,2);
  return {...old,primary:intents[0]||'unknown',intents,aspects,
   slots:{...old.slots,compound,questionWords:[...new Set([...old.slots.questionWords,...(q.match(/\b(?:komu|czemu|po co|skad|kiedy|dlaczego|gdzie|jak|co|kto)\b/g)||[])])].slice(0,8),references:[...new Set([...old.slots.references,...people.filter(p=>q.includes(p))])].slice(0,6)},
   needsClarification:intents[0]==='clarify_reference',sensitive:intents.includes('direct_accusation')||intents.includes('procedural_refusal'),
   evidenceSourceQuestion:intents.some(id=>['knowledge_source','personal_observation','certainty_limit','epistemic_challenge','corroboration'].includes(id)),
   clauses:perClause,coverageHints:aspects,version:'6.12'};
 }
 const replace=Object.freeze({analyze,rankFacts:previous.rankFacts,intents:previous.intents,version:'6.12'});
 window.PS611_NLU=replace;
 window.PS612_NLU=replace;

 window.PS612_LAST=null;
 const sourceFact=(id,key)=>String(NPC94_FACTS?.[id]?.[key]||'').trim().slice(0,850);
 const focusedKinds=new Set(['reason_for_action','event_sequence','knowledge_source','time_precision',
   'report_recipient','direct_accusation','corroboration','personal_observation']);
 const verifies={
  reason_for_action:/\b(?:poniewaz|dlatego|powod\w*|przyczyn\w*|sklonil\w*|uznal\w*|chcial\w*|musial\w*|dlaczego|nie pamietam czemu|nie moge wyjasnic)\b/,
  event_sequence:/\b(?:najpierw|nastepni\w*|potem|pozniej|przed|po czym|kolejnos\w*|wczesniej|nie potrafie odtworzyc)\b/,
  knowledge_source:/\b(?:z dokument\w*|z rejestr\w*|zapis\w*|z wlasn\w*|sam widzial\w*|sama widzial\w*|powiedz\w*|dowiedzial\w*|wiem z|z pracy|nie wiem skad|nie moge wskazac zrodla)\b/,
  time_precision:/\b\d{1,2}:\d{2}\b|\b(?:minut\w*|godzin\w*|pora|czas\w*|kiedy|nie potrafie podac|nie pamietam)\b/,
  report_recipient:/\b(?:komu|do kogo|przekazal\w*|odebral\w*|adresat\w*|poinformow\w*|powiadom\w*|nie potrafie wskazac odbiorcy)\b/,
  direct_accusation:/\b(?:nie przyznaj\w* sie|przyznaj\w* sie|zaprzeczam|odmawiam odpowiedzi|podtrzymuje odmowe)\b/,
  corroboration:/\b(?:potwierd\w*|swiadek|swiadkow\w*|rejestr\w*|kamera|grafik|nie mam osoby|nie potrafie potwierdzic)\b/,
  personal_observation:/\b(?:widz\w*|sama obserwow\w*|sam obserwow\w*|osobiscie|nie obserwow\w*|nie bylem swiadkiem|nie bylam swiadkiem)\b/
 };
 function clarification(id,intent,question){
  const female=['ELZBIETA','MAGDALENA'].includes(id),q=normalize(question);
  switch(intent){
   case 'reason_for_action':
    return /\b(?:czemu uznal|dlaczego uznal|po co zmienil)\b/.test(q)?'Nie potwierdzam samego założenia zawartego w pytaniu. Najpierw trzeba ustalić, czy taką decyzję faktycznie podjął'+(female?'am':'em')+'.':'Nie umiem wskazać konkretnej przyczyny na podstawie tego, co pamiętam. Nie chcę jej wymyślać.';
   case 'event_sequence':
    return 'Nie potrafię z pewnością odtworzyć pełnej kolejności tych zdarzeń. '+(sourceFact(id,'time')||'Nie będę zgadywać, co było pierwsze.');
   case 'knowledge_source':{
    const specific=/\b(?:alarm\w*|zmian\w*|dyzur\w*|prac\w*|len\w*|smier\w*|wagon\w*)\b/.test(q);
    if(/\b(?:kto przekazal|kto ci powiedzial|od kogo|kto jest autorem)\b/.test(q))
      return 'Nie umiem wskazać z pewnością konkretnej osoby, od której pochodzi ta informacja. Nie chcę przypisywać jej komuś bez potwierdzenia.';
    return specific&&sourceFact(id,'source')?sourceFact(id,'source'):'Nie potrafię wskazać konkretnego źródła tej informacji bez doprecyzowania, o które zdarzenie pytasz.';
   }
   case 'time_precision':{
    const victim=/\b(?:len\w*|rudnick\w*|spotkan\w*|rozmow\w*)\b/.test(q);
    if(/\b(?:ile .{0,18}trwal|czas trwania|jak dlugo)\b/.test(q))
      return 'Nie potrafię wiarygodnie określić czasu trwania tej rozmowy czy spotkania. Nie będę go szacować bez podstaw.';
    if(/\b(?:przed polnoca|po polnocy|o jakiej porze)\b/.test(q)&&!victim)
      return 'O które zdarzenie pytasz? Bez wskazania sytuacji nie potrafię potwierdzić, czy było to przed północą, czy po niej.';
    return sourceFact(id,victim?'last':'time')||'Nie potrafię podać wiarygodnej godziny tego zdarzenia.';
   }
   case 'report_recipient':
    return 'Nie potrafię wskazać z pewnością, kto był odbiorcą tego zgłoszenia. Trzeba ustalić, czy istnieje potwierdzenie jego odbioru.';
   case 'corroboration':return sourceFact(id,'witness')||'Nie umiem wskazać niezależnej osoby, która potwierdzi ten szczegół.';
   case 'personal_observation':return sourceFact(id,'victim')||'Nie potrafię potwierdzić tego własną obserwacją.';
   case 'direct_accusation':return 'Nie przyznaję się do zabójstwa Leny. To moje stanowisko, nie dowód rozstrzygający sprawę.';
   default:return '';
  }
 }
 function lastProtected(c,old,attached,confronted){
  if(attached||!c||!NPC9_MEMORY?.[c.id]||!NPC4_STATE?.[c.id]||simWitness(c).blocked)return true;
  const mem=NPC9_MEMORY[c.id],last=mem.semantic?.at(-1);
  if((mem.confronted?.length||0)>confronted||last?.source_ids?.length)return true;
  if(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(last?.status))return true;
  if(/\b(?:odmawiam|pelnomocnik|przerwa proceduralna|przyznaje sie|podtrzymuje odmowe|konfrontacj\w* z dowod\w*)\b/.test(normalize(old)))return true;
  return false;
 }
 function sync(c,old,next,topic){
  const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],t=m?.turn;
  const sem=m?.semantic?.slice().reverse().find(x=>x.turn===t&&x.answer===old);
  const st=m?.statements?.slice().reverse().find(x=>x.turn===t&&x.text===old);
  if(!sem||!st||sem.source_ids?.length||st.source_ids?.length||
    ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(sem.status))return false;
  sem.answer=next;sem.topic=topic;sem.focus='coverage-6.12';st.text=next;st.topic=topic;
  if(m.topics?.length)m.topics[m.topics.length-1]=topic;
  if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus:'coverage-6.12'};
  const last=s.recent?.at(-1);
  if(last?.answer===normalize(old).slice(0,1550))last.answer=normalize(next).slice(0,1550);
  const recent=s.npc5?.recent?.at(-1);
  if(recent?.answer===old.slice(0,1400))recent.answer=next.slice(0,1400);
  if(s.npc5?.anchor?.answer===old.slice(0,1400))s.npc5.anchor={...s.npc5.anchor,answer:next.slice(0,1400),topic};
  if(s.npc62?.a===old)s.npc62.a=next;
  if(s.npc65?.lastAnswer===old.slice(0,1300))s.npc65.lastAnswer=next.slice(0,1300);
  if(s.npc65?.recent?.at(-1)?.answer===old.slice(0,1300))s.npc65.recent.at(-1).answer=next.slice(0,1300);
  if(s.npc68?.threads?.at(-1)?.a===old.slice(0,850))s.npc68.threads.at(-1).a=next.slice(0,850);
  if(s.npc89?.recent?.at(-1)?.a===old.slice(0,1200))s.npc89.recent.at(-1).a=next.slice(0,1200);
  if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic,focus:'coverage-6.12'};
  return true;
 }
 // Przy braku odpowiedzi na którąś część pytania wymagaj wyraźnego zaznaczenia
 // ograniczenia wiedzy. To kontrola powierzchniowa — nie dowód poprawności semantycznej.
 const previousAnswer=WitnessEngine.snapshotAnswer();
 function answer(c,q,attached){
  const plan=analyze(q),before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const old=previousAnswer(c,q,attached);
  if(!c||!plan.intents.length||lastProtected(c,old,attached,before)||plan.inputLooksLikeInstruction)return old;
  const segments=(plan.clauses||[]).filter(x=>x.intents.length);
  const parts=(plan.slots.compound&&segments.length>1?segments.map(x=>x.intents[0]):[plan.primary])
    .filter((x,i,a)=>focusedKinds.has(x)&&a.indexOf(x)===i).slice(0,3);
  if(!parts.length)return old;
  const missing=parts.filter(x=>!verifies[x].test(normalize(old)));
  if(!missing.length)return old;
  const supplied=missing.map(x=>clarification(c.id,x,q)).filter(Boolean);
  if(!supplied.length)return old;
  // Jeśli wcześniejsza odpowiedź była nie na temat, zastąp ją bezpiecznymi
  // ograniczeniami wiedzy zamiast przeklejać niezwiązany z pytaniem monolog.
  const keep=parts.length>1&&parts.some(x=>verifies[x].test(normalize(old)));
  const next=[...(keep?[old]:[]),...supplied].join(' ').slice(0,1550);
  if(next===old||!sync(c,old,next,parts.join('+')))return old;
  window.PS612_LAST={id:c.id,parts,missing,corrected:true};
  return next;
 }
 // 6.33: retired overlapping answer hook; central 6.33 plan owns question routing.
// retiredAnswerLayer('72-question-coverage',answer);
})();
