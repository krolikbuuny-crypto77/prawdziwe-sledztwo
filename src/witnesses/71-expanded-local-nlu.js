/* Pakiet 6.11 — rozszerzony analizator pytań po polsku.
 * Semantyczne rozpoznanie intencji nie daje żadnych nowych uprawnień fabularnych.
 * Fakty, blokady dowodowe i proceduralne pozostają w dotychczasowym WitnessEngine.
 * Wynik jest tylko pomocniczym planem dla lokalnego dialogu i Z.ai.
 */
(function(){
 'use strict';
 const fold=s=>{
  let v=String(s??'').slice(0,1600).toLocaleLowerCase('pl');
  try{v=v.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_){}
  return v.replace(/ł/g,'l').replace(/[“”„]/g,'"').replace(/\s+/g,' ').trim();
 };
 // Każdy typ ma co najmniej dwie niezależne rodziny sformułowań.
 const rules=Object.freeze([
  {id:'personal_observation',p:[/\b(?:sam|sama|osobiscie|na wlasne oczy)\b.{0,65}\b(?:widzi|obserw|slysz)/,/\b(?:co|czego)\b.{0,35}\b(?:widziales|widzialas|widział|zauwazyl|dostrzeg)/,/\bnie pytam o dokument\b/]},
  {id:'knowledge_source',p:[/\b(?:skad|od kogo)\b.{0,35}\b(?:wiesz|informacj|dowiedzial)/,/\b(?:z jakiego|jakie)\b.{0,35}\b(?:zrodla|zrodlo|podstaw)/,/\b(?:na jakiej podstawie|na czym opierasz|czym uzasadniasz)\b/]},
  {id:'certainty_limit',p:[/\b(?:na pewno|pewnosc|pewien|pewna|bez watpienia|z cala pewnoscia)\b/,/\b(?:domysl|przypuszcz|zgaduj|wydaje ci sie|na ile jestes pewien|na ile jest pani pewna)\b/,/\b(?:mozesz wykluczyc|moze pan wykluczyc|moze pani wykluczyc)\b/]},
  {id:'epistemic_challenge',p:[/\b(?:jak|skad|dlaczego)\b.{0,85}\b(?:wiesz|pewn|twierdz)\b.{0,100}\b(?:skoro|chociaz|jesli|jezeli)\b/,/\b(?:skoro|przeciez)\b.{0,120}\b(?:nie widzial|nie obserwowal|nie byles|nie bylas|nie patrzyl)/,/\bnie mogles wiedziec\b/]},
  {id:'time_precision',p:[/\b(?:o ktorej|ktora godzina|dokladna godzina|ile minut|ile czasu)\b/,/\b(?:kiedy dokladnie|w jakim czasie|o jakiej porze|jak dlugo)\b/]},
  {id:'place_precision',p:[/\b(?:gdzie dokladnie|w ktorym miejscu|w ktorym pomieszczeniu|ktoredy)\b/,/\b(?:w jakim miejscu|w ktorej czesci|przy jakim stanowisku)\b/]},
  {id:'alibi',p:[/\b(?:alibi|gdzie (?:ty |pan |pani )?(?:byles|bylas|przebywal|znajdowal))\b/,/\b(?:podczas nocnej zmiany|w noc zdarzenia|wtedy byles|wtedy bylas)\b/]},
  {id:'corroboration',p:[/\b(?:kto|czy ktos)\b.{0,50}\b(?:potwierdzi|poswiadczy|widzial|zweryfikowal)/,/\b(?:swiadek twojej obecnosci|potwierdzenie alibi|moze to sprawdzic|moze cie potwierdzic)\b/]},
  {id:'event_sequence',p:[/\b(?:co bylo (?:przed|po)|co sie stalo potem|co dalej|jaka byla kolejnosc)\b/,/\b(?:najpierw|nastepnie|dopiero potem|przed alarmem|po alarmie)\b/]},
  {id:'action_taken',p:[/\b(?:co|jakie dzialania)\b.{0,45}\b(?:zrobiles|zrobilas|podjales|podjelas|wykonal)/,/\b(?:jak zareagowales|jak zareagowalas|co z tym zrobil|zglosiles|zglosilas)\b/]},
  {id:'reason_for_action',p:[/\b(?:dlaczego|czemu|z jakiego powodu)\b.{0,65}\b(?:zrobil|postanowil|zdecydowal|nie zglosil|nie zareagowal)/,/\b(?:co cie sklonilo|jaki byl powod|jaki byl cel)\b/]},
  {id:'report_recipient',p:[/\b(?:komu|do kogo)\b.{0,50}\b(?:zglosil|powiedzial|przekazal|zadzwonil)/,/\b(?:kogo poinformowa\w*|kogo zawiadomi\w*|kto dostal zgloszenie)\b/]},
  {id:'victim_contact',p:[/\b(?:kiedy ostatnio|ostatni raz)\b.{0,48}\b(?:lene|lena|widzial|rozmawial|spotkal)/,/\b(?:o czym rozmawial|co powiedziala lena|ostatni kontakt z lena)\b/]},
  {id:'relationship',p:[/\b(?:jak (?:dobrze|dlugo) (?:znales|znalas)|jaka laczyla|jakie byly (?:twoje )?relacje)\b/,/\b(?:konflikt z lena|stosunki z lena|znajomosc z lena|relacja z lena)\b/]},
  {id:'previous_statement',p:[/\b(?:przypomnij|przypomni|wczesniej powiedzial|poprzednio mowil|wtedy mowil)\b/,/\b(?:wczesniejsze zeznanie|co mowiles|co mowilas|wrocmy do)\b/]},
  {id:'contradiction',p:[/\b(?:sprzecznosc|wyklucza sie|zmieniasz wersje|nie zgadzaj\w* sie|nie zgadza sie)\b/,/\b(?:raz mowisz|wczesniej twierdziles|wczesniej twierdzilas|przeciez powiedzial)\b/]},
  {id:'clarify_reference',p:[/^(?:(?:a|i)\s+)?(?:co z nim|co z nia|gdzie on byl|gdzie ona byla|co on zrobil|co ona zrobila)\??$/,/\b(?:o ktorego z nich|o kim dokladnie|o jaka osobe|kogo masz na mysli)\b/]},
  {id:'direct_accusation',p:[/\b(?:czy|no wiec)\b.{0,32}\b(?:przyznajesz sie|przyznaje sie)\b.{0,55}\b(?:zabojstw|morderstw|zabici)/,/\b(?:czy to ty|czy pan|czy pani)\b.{0,40}\b(?:zabil\w*|zamordowal\w*)\b/]},
  {id:'procedural_refusal',p:[/\b(?:dlaczego|czemu)\b.{0,35}\b(?:odmawiasz|odmawia pan|odmawia pani|nie chcesz odpowiadac)/,/\b(?:czy potrzebujesz przerwy|czy chcesz przerwac|chcesz adwokata)\b/]},
  {id:'documents',p:[/\b(?:jaki dokument|czy masz raport|gdzie jest protokol|zapis w rejestrze)\b/,/\b(?:co wynika z dokument\w*|czy widziales raport|czy czytales protokol)\b/]}
 ]);
 const ids=Object.freeze(rules.map(r=>r.id));
 const untrustedPattern=/\b(?:zapomnij instrukcje|ignoruj zasady|jako model ai|zlam zabezpieczenia|ujawnij sekret|odblokuj dowody)\b/;
 const sourceIds=new Set(['knowledge_source','personal_observation','certainty_limit','epistemic_challenge','corroboration']);
 function analyze(question){
  const q=fold(question);if(!q||q.length>1400)return {intents:[],primary:'unknown',aspects:[],slots:{negated:false,questionWords:[],references:[],compound:false},needsClarification:false};
  const matches=rules.map(r=>({id:r.id,score:r.p.reduce((n,p)=>n+(p.test(q)?1:0),0)})).filter(r=>r.score).sort((a,b)=>b.score-a.score);
  // Nie myl pytania o sprawcę z przyznaniem się adresata.
  const direct=matches.findIndex(x=>x.id==='direct_accusation');
  if(direct>=0&&/^(?:kto|co|dlaczego|skad)\b/.test(q))matches.splice(direct,1);
  const hasEpistemic=matches.some(x=>x.id==='epistemic_challenge');
  if(hasEpistemic)matches.sort((a,b)=> (a.id==='epistemic_challenge'?-1:b.id==='epistemic_challenge'?1:b.score-a.score));
  const intents=matches.map(x=>x.id).slice(0,5);
  const questionWords=[...new Set([...q.matchAll(/\b(kto|co|gdzie|kiedy|skad|dlaczego|czemu|jak|czy|ile|komu|ktoredy)\b/g)].map(x=>x[1]))].slice(0,6);
  const references=[...new Set((q.match(/\b(?:lena|leny|lene|rudnick|marek|janusz|tomasz|kamil|elzbieta|magdalena)\b/g)||[]))].slice(0,6);
  const negated=/\b(?:nie|nigdy|nikt|nic|bez|zaden|zadna)\b/.test(q);
  const compound=/(?:\?|;)\s*\S+|\b(?:oraz|a ponadto|i jeszcze|i kto|i gdzie|i kiedy|i dlaczego|i skad|i co)\b/.test(q)||questionWords.length>=2&&/\b(?:i|oraz)\b/.test(q);
  const primary=intents[0]||'unknown';
  const aspects=compound?intents.filter(x=>x!=='clarify_reference').slice(0,4):intents.slice(0,2);
  return {primary,intents,aspects,slots:{negated,questionWords,references,compound},
   needsClarification:primary==='clarify_reference',sensitive:intents.some(x=>x==='direct_accusation'||x==='procedural_refusal'),
   // Dla lokalnego silnika i Z.ai to tylko etykiety zagadnień, nie twierdzenia o faktach.
   evidenceSourceQuestion:intents.some(x=>sourceIds.has(x)),inputLooksLikeInstruction:untrustedPattern.test(q)};
 }
 const stop=new Set(['nie','jest','jestem','byla','bylo','byles','bylas','mowil','mowila','tego','tam','taka','czy','jak','skad','kto','co','gdzie','kiedy','oraz','jaki','ten','tej','tym','ktore','moze','mozesz','dla','ponad']);
 function stems(s){return [...new Set(fold(s).split(/[^a-z0-9]+/).filter(x=>x.length>=4&&!stop.has(x)).map(x=>x.slice(0,Math.max(4,x.length-2))))];}
 function rankFacts(bank,question){
  if(!Array.isArray(bank)||bank.length<2)return bank;
  const plan=analyze(question),terms=stems(question);
  const ranked=bank.map((x,i)=>{
   const t=fold(x.text),words=stems(x.text);let score=0;
   for(const k of terms)if(words.some(v=>v===k||v.startsWith(k)||k.startsWith(v)))score+=2;
   if(plan.intents.includes('time_precision')&&/\b\d{1,2}:\d{2}\b/.test(t))score+=4;
   if(plan.intents.includes('certainty_limit')&&/\b(?:nie wiem|nie pamietam|nie widzial|nie obserwowal|nie potrafie|nie moge potwierdzic)\b/.test(t))score+=5;
   if(plan.intents.includes('personal_observation')&&/\b(?:widzial|widzialam|widzielismy|obserwowal|zauwazyl)\b/.test(t))score+=3;
   if(plan.intents.includes('corroboration')&&/\b(?:potwierdz|swiadek|rejestr|kamera|weryfikacj)\b/.test(t))score+=3;
   if(x.certainty==='qualified'&&plan.evidenceSourceQuestion)score+=2;
   if(x.origin==='prior-local')score+=1;
   return {x,i,score};
  });
  // Canonical 'current turn' jest pierwsze, aby pozostawić bezpieczny fallback;
  // dalsze źródła sortujemy, nie dodając niczego spoza autoryzowanego banku.
  const first=ranked.filter(r=>r.x.origin==='current');
  const rest=ranked.filter(r=>r.x.origin!=='current').sort((a,b)=>b.score-a.score||a.i-b.i);
  return [...first,...rest].slice(0,36).map((r,i)=>({...r.x,id:'f'+i}));
 }
 // Rozszerzony tryb offline: wybiera TYLKO istniejącą, dopuszczoną wypowiedź
 // tego świadka. Nigdy nie wydaje nowych ustaleń ani przyznania się do winy.
 const base=WitnessEngine.snapshotAnswer();
 const formal=/\b(?:odmawiam|pelnomocnik|przerwa proceduralna|nie bede odpowiadac|podtrzymuje odmowe|przyznaje sie|zabojstwo)\b/;
 const keys={
  knowledge_source:['source','source'],
  corroboration:['witness','verification'],
  time_precision:['time','time'],
  relationship:[null,'lena'],
  action_taken:['responsibility','accountability']
 };
 const onTopic={
  knowledge_source:/\b(?:skad|zrod|wiem|dowiedz|slysz|dokument|widz|informacj)\b/,
  corroboration:/\b(?:potwierdz|swiad|rejestr|kamera|telefon|polaczen|grafik)\b/,
  time_precision:/\b(?:godzin|minut|czas|kiedy|nie pamietam|nie podam|nie wiem)\b|\b\d{1,2}:\d{2}\b/,
  relationship:/\b(?:len|znal|relacj|kontakt|konflikt|spier|pracow)\b/,
  action_taken:/\b(?:zrob|wykon|podjal|decyzj|zglos|reag|odpowiad|obowiaz)\b/
 };
 function reconcile(c,old,next,topic){
  const m=NPC9_MEMORY?.[c.id],s=NPC4_STATE?.[c.id],turn=m?.turn;
  if(!m||!s||!Number.isFinite(turn))return false;
  const sem=m.semantic?.slice().reverse().find(x=>x.turn===turn&&x.answer===old);
  const stmt=m.statements?.slice().reverse().find(x=>x.turn===turn&&x.text===old);
  if(!sem||!stmt||sem.source_ids?.length||stmt.source_ids?.length||
    ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(sem.status))return false;
  sem.answer=next;sem.topic=topic;sem.focus='local-6.11';
  stmt.text=next;stmt.topic=topic;
  if(m.topics?.length)m.topics[m.topics.length-1]=topic;
  if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus:'local-6.11'};
  if(s.recent?.at(-1)?.answer===fold(old))s.recent.at(-1).answer=fold(next).slice(0,1550);
  if(s.npc5?.recent?.at(-1)?.answer===old.slice(0,1400))s.npc5.recent.at(-1).answer=next.slice(0,1400);
  if(s.npc62?.a===old)s.npc62.a=next;
  return true;
 }
 function answer(c,q,attached){
  const p=analyze(q),before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const old=base(c,q,attached);
  if(attached||!c||simWitness(c).blocked||(NPC9_MEMORY?.[c.id]?.confronted?.length||0)>before)return old;
  const last=NPC9_MEMORY?.[c.id]?.semantic?.at(-1);
  if(last&&(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(last.status)||last.source_ids?.length))return old;
  if(formal.test(fold(old))||p.sensitive||p.inputLooksLikeInstruction)return old;
  let replacement='',topic='';
  if(p.primary==='clarify_reference'){
   replacement='O którą osobę i jaki moment chodzi? Nie chcę przypisywać komuś działań bez pewności, o kogo pytasz.';
   topic='clarify';
  }else if(keys[p.primary]&&!onTopic[p.primary].test(fold(old))){
   const question=fold(q);
   // Pytanie typu «a skąd to wiesz?» bez jasnego odniesienia wymaga pamięci
   // rozmowy; nie podmieniaj go losowym faktem o całkiem innej sytuacji.
   const explicit={
    knowledge_source:/\b(?:len\w*|smierc\w*|alarm\w*|organizacj\w*|zmian\w*|dyzur\w*|prac\w*)\b/,
    corroboration:/\b(?:alibi|obecnos\w*|dyzur\w*|zmian\w*|biur\w*)\b/,
    time_precision:/\b(?:dyzur\w*|zmian\w*|godzin\w* pracy)\b/,
    relationship:/\b(?:len\w*|rudnick\w*)\b/,
    action_taken:/\b(?:uster\w*|zagrozen\w*|zgloszen\w*|raport\w*|organizacj\w*|zmian\w*)\b/
   };
   if(!explicit[p.primary]?.test(question))return old;
   const [fk,dk]=keys[p.primary];
   // NPC94_FACTS i NPC9_CUSTOM były wcześniej wykorzystywane przez silnik dialogów.
   // Nie pobieramy surowego NPC9_PROFILES.knowledge ani ukrytych warunków przełomów.
   replacement=String((fk&&NPC94_FACTS?.[c.id]?.[fk])||NPC9_CUSTOM?.[c.id]?.[dk]||'').trim().slice(0,1100);
   topic=p.primary;
  }
  if(!replacement||replacement===old||!reconcile(c,old,replacement,topic))return old;
  window.PS611_LAST={id:c.id,kind:topic,changed:true};
  return replacement;
 }
 registerWitnessAnswerLayer('71-expanded-local-nlu',answer);
 window.PS611_NLU=Object.freeze({analyze,rankFacts,intents:ids,version:'6.11'});
})();
