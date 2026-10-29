
/* Prawdziwe Śledztwo 5.4.1 — naprawa pytań naturalnych.
   Krótkie, potoczne pytania kierowane są do istniejących, przypisanych
   konkretnemu świadkowi faktów. Nie przyznają dowodów, nie potwierdzają alibi,
   nie uruchamiają ani nie omijają formalnych konfrontacji. */
(function(){
 'use strict';
 const previous=WitnessEngine.snapshotAnswer();
 const reactions={
  MAREK:'To tragedia. Lena zginęła podczas zmiany, za którą odpowiadałem. Wracam myślami do tego, co się stało, ale samego zdarzenia nie widziałem — dowiedziałem się o nim po alarmie.',
  TOMASZ:'To straszne. Znalazłem Lenę przy stanowisku trzecim i wezwałem pomoc. Nie widziałem, jak doznała obrażeń, ale ten obraz trudno mi wyrzucić z głowy.',
  JANUSZ:'To tragedia. Sprzeczaliśmy się czasem o stan wagonu. Teraz, kiedy Lena nie żyje, tamte kłótnie wyglądają inaczej. O jej śmierci dowiedziałem się dopiero po alarmie.',
  ELZBIETA:'To tragedia. Pamiętam rozmowę z Leną o ryzyku i wracam do myśli, czy zrobiłam wszystko, by jej zgłoszenie nie utknęło. O jej śmierci dowiedziałam się po alarmie.',
  KAMIL:'Trudno mi o tym mówić. Rozmawiałem z Leną o odczytach wagonu i wiem, że już nie wróci. Nie widziałem tego, co wydarzyło się później przy stanowisku.',
  MAGDALENA:'Śmierć Leny była tragedią. Nie chcę udawać, że wiem, jak do niej doszło. Mogę mówić o dokumentach, które sprawdzałam, ale nie byłam świadkiem samego zdarzenia.'
 };
 const reactionsFollowup={
  MAREK:'Tak, jest mi przykro. Lena zginęła podczas mojej zmiany. Nie chcę jednak zastępować faktów tym, co teraz czuję.',
  TOMASZ:'Tak. To ja ją znalazłem. Ten obraz ze mną został, choć nie widziałem samego zdarzenia.',
  JANUSZ:'Tak. Zostają we mnie te dawne kłótnie o wagon. Nie mogę udawać, że nic dla mnie nie znaczą.',
  ELZBIETA:'Tak, bardzo. Wciąż myślę o naszej rozmowie o zagrożeniu. Nie mam jednak podstaw, by z samego poczucia winy wyciągać wnioski o czyjejś odpowiedzialności.',
  KAMIL:'Tak. Wiem, że już nie porozmawiam z Leną o tamtych odczytach. To trudne, ale o samej śmierci wiem tylko tyle, co ustalono później.',
  MAGDALENA:'To trudna sprawa. Wiem, że Lena nie żyje, ale wolę uczciwie oddzielić emocje od ustaleń, które potrafię potwierdzić.'
 };
 const directAlibi={
  MAREK:'Nadzorowałem nocną zmianę, głównie z biura, ale wychodziłem służbowo. Nie mam człowieka, który potwierdziłby każdą minutę — można porównać rejestr wejść i połączenia.',
  TOMASZ:'Byłem na służbie w dyspozytorni, a o 02:02 zgłosiłem znalezienie Leny. Nie mam jednak świadka każdej wcześniejszej minuty.',
  JANUSZ:'Pracowałem w warsztacie przy zleceniach, które można sprawdzić w kartach napraw. Nie rejestrują jednak każdego mojego kroku.',
  ELZBIETA:'Wykonywałam obowiązki BHP. Potrafię potwierdzić rozmowę z Leną o 21:47, ale nie całą późniejszą noc.',
  KAMIL:'Tej nocy prowadziłem diagnostykę TW-217. Istnieją zapisy sesji, lecz nie potwierdzają mojego położenia w każdej chwili.',
  MAGDALENA:'Rejestr pokazuje aktywną sesję audytową od 01:30 do 02:00. Nie jest to jednak dowód, że przez cały ten czas fizycznie siedziałam przy komputerze.'
 };
 const companions={
  MAREK:'Nie miałem osoby, która byłaby przy mnie przez całą noc. Pracowałem głównie w biurze, ale wychodziłem też służbowo. Można sprawdzić połączenia i rejestr wejść, nie całą moją obecność.',
  TOMASZ:'Nie mam osoby, która obserwowałaby mnie przez całą noc. Pracowałem w dyspozytorni, a później byłem przy stanowisku trzecim. Meldunki nie potwierdzają każdej minuty mojej obecności.',
  JANUSZ:'Nie cały czas. W warsztacie pracowali inni ludzie, ale chodziłem też do narzędzi i wagonów. Nie wskażę kogoś, kto byłby przy mnie przez cały dyżur.',
  ELZBIETA:'Nie mam świadka, który przez całą noc byłby przy mnie. Zajmowałam się zgłoszeniami BHP; zapis rozmowy z Leną potwierdza tylko określony moment.',
  KAMIL:'Nie miałem jednej osoby przy sobie przez cały czas. Zajmowałem się diagnostyką, czasem odchodziłem od stanowiska. Surowy log nie potwierdza, gdzie stałem.',
  MAGDALENA:'Nie wskażę osoby, która mogłaby poświadczyć całą moją obecność. Pracowałam przy audycie, ale aktywna sesja komputerowa nie jest świadkiem tego, gdzie stałam.'
 };
 const sceneCompanions={
  TOMASZ:'Znalazłem Lenę przy stanowisku numer trzy i zgłosiłem alarm o 02:02. Nie chcę twierdzić, że przez cały czas nikt inny tam nie był, jeśli nie mogę tego niezależnie potwierdzić.'
 };
 function intent(c,raw,attached){
  if(attached)return null;
  const q=norm(String(raw||'')).replace(/\s+/g,' ').trim();
  if(!q||q.length>360)return null;
  // Zawsze pierwszeństwo mają zarzuty, materiały procesowe, bezpośrednie
  // dociekania o sprawcę, groźby i przypominanie wcześniejszych zeznań.
  // Dotyczy to również pytań mieszanych, np. "tragedia czy zabójstwo?".
  const protectedTerms=/\b(?:zabil\w*|zaboj\w*|zamord\w*|morder\w*|sprawc\w*|oskarz\w*|klam\w*|oklam\w*|sklam\w*|falsz\w*|przyzn\w*|areszt\w*|przestep\w*|groz\w*|pobij\w*|wina|winny|winna|winnego|przypom\w*|zeznal\w*|wycof\w*|udowodn\w*|dowod\w*|nagran\w*|kamer\w*|rejestr\w*|protokol\w*|raport\w*|dokument\w*|logow\w*|logi|tcms|bhp|kart\w*|t\s*17|podejrzan\w*|grozi\w*|zataj\w*|matacz\w*|przemoc\w*|stwierdz\w*|sprzeczn\w*)\b/;
  if(npc9Tone(raw)==='pressure'||protectedTerms.test(q))return null;
  // Nie wolno przekierować pytania o działania/obecność Leny na alibi rozmówcy.
  const aboutVictim=/\b(?:lena|lene|leny|lenie|rudnick\w*|ofiara|ofiary)\b/.test(q);
  const aboutVictimPresence=aboutVictim&&/\b(?:byla|sam\w*|gdzie|widz\w*|obok|z kim|towarzysz)\b/.test(q)
    &&!/(?:\b(?:ciebie|tobie|toba|pana|pani|twoj\w*|ci|pan|ty|byles|bylas|znalazles|znalazlas|widziales|widzialas)\b)/.test(q);
  const event=/\b(?:traged\w*|tragedn\w*|dram\w*|smier\w*|zgin\w*|zmar\w*|strat\w*|len\w*|nie\s+zyje|nie\s+zyla|nie\s+wroci\w*|jej\s+smier\w*)\b/.test(q);
  const emotion=/\b(?:mysl\w*|sadz\w*|uwaz\w*|czuj\w*|przezyw\w*|reag\w*|zareag\w*|odebral\w*|przyjal\w*|wplyn\w*|znacz\w*|przykro|smutn\w*|zal|wstrzas\w*|szok|straszn\w*|okropn\w*|porusz\w*|bol\w*|teskni\w*|dojsc\s+do\s+siebie|trudn\w*)\b/.test(q);
  const factRequest=/\b(?:kto|kiedy|gdzie|dokad|skad|o\s+ktorej|co\s+zrobil|co\s+stalo|co\s+zaszlo|co\s+sie\s+wydarzylo|dlaczego|czemu|jak\s+zgin|jak\s+umarl|widziales|widzialas|znalazl\w*|kto\s+odpowiada)\b/.test(q);
  if(!aboutVictimPresence && /\b(?:gdzie\s+(?:ja|lene|lena)\s+znaleziono|gdzie\s+znaleziono\s+(?:lene|lena)|w\s+jakim\s+miejscu\s+znaleziono\s+(?:lene|lena))\b/.test(q))
   return {type:'victim_location',topic:'what_happened',focus:'discovery_location'};
  if(aboutVictimPresence&&/\b(?:sama|samotnie|z\s+kim)\b/.test(q))
   return {type:'victim_alone',topic:'victim_last',focus:'unverified_alone'};
  const emotionalFraming=/\b(?:straszn\w*|okropn\w*)\b.*\b(?:len\w*|traged\w*|smier\w*|wydarzylo)\b/.test(q) || /\b(?:co\s+czujesz\s+kiedy|co\s+pomysl\w*\s+gdy)\b/.test(q);
  if(event&&(emotion||emotionalFraming)&&(!factRequest||emotionalFraming)&&!aboutVictimPresence){
   return {type:'reaction',topic:'feeling',focus:'grief'};
  }
  // "Jak się z tym czujesz?" ma sens jako ciąg dalszy emocjonalnego
  // wątku, nie jako bezwarunkowe pytanie o śmierć Leny.
  if(/\b(?:jak\s+sie\s+z\s+tym\s+czujesz|jak\s+to\s+przezywasz|jest\s+ci\s+przykro)\b/.test(q)){
   const anchor=NPC4_STATE[c.id]?.npc5?.anchor;
   if(anchor?.topic==='feeling'||NPC9_MEMORY[c.id]?.lastFocus?.topic==='feeling')
    return {type:'reaction',topic:'feeling',focus:'grief'};
  }
  const personalAlibi=/\balibi\b/.test(q)&&!aboutVictimPresence;
  const nightLocation=/\b(?:gdzie\s+(?:byles|bylas|pan\s+byl|pani\s+byla)|co\s+(?:robiles|robilas))\b.*\b(?:tej|tamtej|w\s+czasie)\b.*\b(?:nocy|zmiany|tragedii|zdarzenia)\b/.test(q);
  if((personalAlibi||nightLocation)&&!/(?:\balibi\s+(?:leny|lenie|ofiary)\b)/.test(q))
   return {type:'alibi',topic:'alibi',focus:'alibi_limits'};
  const self=/\b(?:byles|bylas|byl\s+pan|byla\s+pani|pracowales|pracowalas|siedzial\w*|stal\w*|zostawales|zostawalas|przebywales|przebywalas|miales|mialas|jestes|jest\s+pan|jest\s+pani)\b/.test(q);
  const alone=/\b(?:sam|sama|samemu|samotnie|pojedynke|w\s+pojedynke|bez\s+nikogo)\b/.test(q);
  const otherPerson=/\b(?:ktos|kto|nikogo|kogos|swiadek|swiadkowie)\b/.test(q);
  const withYou=/\b(?:z\s+toba|przy\s+tobie|obok\s+ciebie|obok\s+twojego|z\s+panem|z\s+pania|przy\s+panu|przy\s+pani|przy\s+sobie|razem\s+z\s+toba|przy\s+nim|towarzyszyl\s+ci|cie\s+widzial|ciebie\s+widzial|ci\s+towarzyszyl|w\s+twoim\s+biurze)\b/.test(q);
  const otherCompanion=/\b(?:kto\s+ci\s+towarzyszyl|kto\s+siedzial\s+(?:wtedy\s+)?obok|kto\s+stal\s+przy\s+(?:tobie|panu|pani)|nie\s+bylo\s+nikogo\s+obok\s+ciebie|byl\s+ktos\s+w\s+poblizu|kto\s+byl\s+wtedy\s+razem)\b/.test(q);
  const around=/\b(?:obok|przy|w\s+poblizu|w\s+biurze|pomieszczeniu|w\s+warsztacie|na\s+zmianie|przez\s+caly)\b/.test(q);
  const physicalQuestion=(!aboutVictimPresence)&&((alone&&(self||/\b(?:ty|pan|pani)\b/.test(q)))||(otherPerson&&withYou)||(self&&otherPerson&&around)||otherCompanion);
  if(physicalQuestion){
   const scene=/\b(?:znalaz\w*|odnalaz\w*|przy\s+znalezieniu|gdy\s+znalaz\w*|przy\s+lenie|stanowisku\s+(?:trzecim|3))\b/.test(q);
   return {type:scene&&c.id==='TOMASZ'?'scene':'companions',topic:'witness',focus:'physical_presence'};
  }
  return null;
 }
 const victimAlone={TOMASZ:'Gdy znalazłem Lenę przy stanowisku numer trzy, nie widziałem samego ataku. Nie mogę potwierdzić, czy wcześniej była tam sama.'};
 const victimFound={TOMASZ:'Znalazłem Lenę przy stanowisku numer trzy. Zgłosiłem alarm o 02:02, ale nie widziałem samego zdarzenia.'};
 function reconcile(c,base,answer,item){
  const mem=NPC9_MEMORY[c.id];
  const st=NPC4_STATE[c.id];
  const records=mem.semantic||[];
  const rec=[...records].reverse().find(x=>x.turn===mem.turn&&x.answer===base);
  if(rec&& !['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(rec.status)){
   rec.answer=answer;rec.topic=item.topic;rec.focus=item.focus;
   rec.source_ids=[];
  }
  const recent=(mem.statements||[]).slice(-4).reverse().find(x=>x.turn===mem.turn&&x.text===base);
  if(recent&&!['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(recent.status)){
   recent.text=answer;recent.topic=item.topic;
  }
  if(mem.topics?.length)mem.topics[mem.topics.length-1]=item.topic;
  if(mem.lastFocus)mem.lastFocus={...mem.lastFocus,topic:item.topic,focus:item.focus};
  if(st?.recent?.length){const r=st.recent[st.recent.length-1];r.topic=item.topic;r.focus=item.focus;r.answer=norm(answer).slice(0,1550);r.variant='natural-5.4.1';}
  const h=st?.npc5;
  if(h){
   if(Array.isArray(h.recent)&&h.recent.length){const r=h.recent[h.recent.length-1];r.topic=item.topic;r.answer=answer.slice(0,1400);r.mode='natural-5.4.1';}
   h.anchor={topic:item.topic,question:norm(mem.userClaims?.at(-1)?.text||'').slice(0,180),answer,focus:item.focus};
  }
  if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic:item.topic,focus:item.focus,variant:'natural-5.4.1'};
  window.NPC541_LAST={person:c.id,type:item.type,question:mem.userClaims?.at(-1)?.text||'',answer};
 }
 const ps3_15_natural_language_questions_npc4Answer = function(c,raw,attached){
  const match=intent(c,raw,attached);
  const base=previous(c,raw,attached);
  if(!match)return base;
  const hadGrief=(NPC9_MEMORY[c.id].semantic||[]).some(x=>x.focus==='grief'&&x.turn<NPC9_MEMORY[c.id].turn);
  const chosen=match.type==='reaction'?(hadGrief?reactionsFollowup[c.id]:reactions[c.id]):match.type==='alibi'?directAlibi[c.id]:match.type==='victim_alone'?(victimAlone[c.id]||'Nie wiem, czy Lena była wtedy sama. Nie obserwowałem jej drogi nieprzerwanie.'):match.type==='victim_location'?(victimFound[c.id]||'Z informacji po alarmie wiem, że Lenę znaleziono przy stanowisku numer trzy. Nie byłem świadkiem samego odnalezienia.'):(match.type==='scene'?sceneCompanions[c.id]:companions[c.id]);
  if(!chosen)return base;
  // The conversational variant cannot alter evidence flags or expose unpublished proof.
  reconcile(c,base,chosen,match);
  return chosen;
 };
registerWitnessAnswerLayer("15-natural-language-questions",ps3_15_natural_language_questions_npc4Answer);
 window.PS55_QA={version:'5.5 · ocena swobodnych pytań',analyze:(id,question,doc)=>{const c=CONTENT.characters.find(x=>x.id===id);return c?intent(c,question,doc):null;},protected:true,covered:()=>Object.keys(reactions)};
 window.PS541_QA={version:'5.5',intent:(id,question,doc)=>{const c=CONTENT.characters.find(x=>x.id===id);return c?intent(c,question,doc):null;},last:()=>window.NPC541_LAST||null,covered:()=>Object.keys(reactions)};
})();

