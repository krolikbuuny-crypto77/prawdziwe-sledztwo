
/* Prawdziwe Śledztwo 5.6 — sens pytania i kontynuacja wątku.
 * Reguły wysokiej pewności; gdy brakuje referenta lub danych, nie zgadują.
 * Nie zmieniają dokumentów, bramek dowodowych, prawdziwości zeznań ani ocen sprawy.
 */
(function(){
'use strict';
const previous=WitnessEngine.snapshotAnswer();
const formerQA=window.PS55_QA;
const limited=(str)=>norm(String(str||'')).replace(/\s+/g,' ').trim()
 .replace(/\btragednia\b/g,'tragedia').replace(/\btragiedia\b/g,'tragedia')
 .replace(/\balibii\b/g,'alibi').replace(/\baldibi\b/g,'alibi')
 .replace(/\bgdze\b/g,'gdzie').replace(/\bgdzi\b/g,'gdzie')
 .replace(/\bwidzales\b/g,'widziales').replace(/\bbyls\b/g,'byles')
 .replace(/\bznalazl[e]?s\b/g,'znalazles').replace(/\bpotwierdzic\b/g,'potwierdzic');
const has=(q,r)=>r.test(q);
const risk=/\b(?:zabil\w*|zabij\w*|zaboj\w*|zamord\w*|morder\w*|zbrodn\w*|winien|winn\w*|oskarz\w*|podejrz\w*|przyzn\w*|areszt\w*|klam\w*|oklam\w*|sklam\w*|zataj\w*|matacz\w*|falsz\w*|sprzeczn\w*|przestep\w*|szantaz\w*|groz\w*|zastrasz\w*|udowodn\w*|dowod\w*|nagran\w*|kamer\w*|rejestr\w*|protokol\w*|raport\w*|dokument\w*|logi|logow\w*|tcms|bhp|t\s*17|identyfikator\w*|kart\w*|slad\w*|zezn\w*|wczesniej\s+(?:mowil\w*|powiedzial\w*)|pamietasz\s+co\s+mowil\w*)\b/;
const victim=/\b(?:lena|leny|lene|lenie|rudnick\w*|ofiara|ofiary|ofiare)\b/;
const pronoun=/\b(?:ona|jej|nia|niej|ja|przy\s+niej|u\s+niej)\b/;
const self=/\b(?:ty|twoj\w*|ciebie|tobie|toba|ci|cie|pan|pani|pana|pania|panem|byles|bylas|byl\s+pan|byla\s+pani|miales|mialas|pracowales|pracowalas|bywal\w*|siedzial\w*|stales|stalas|znalazles|znalazlas)\b/;
const scene=/\b(?:znalaz\w*|odnalaz\w*|znalezion\w*|odkry\w*|odkryci\w*|przy\s+lenie)\b/;
const emotional=/\b(?:czy\s+(?:ci|panu|pani)\s+przykro|co\s+mysl\w*|co\s+sadz\w*|jak\s+to\s+odbier\w*|co\s+na\s+to|co\s+o\s+tym\s+mysl\w*|jak\s+sie\s+z\s+tym\s+czuj\w*|jak\s+sie\s+czuj\w*|co\s+czuj\w*|jest\s+ci\s+przykro|jest\s+panu\s+przykro|jest\s+pani\s+przykro|zal\s+ci|zal\s+panu|zal\s+pani|przezyw\w*|smutn\w*|szok|wstrzas\w*)\b/;
const grief=/\b(?:traged\w*|dram\w*|smier\w*|zgon\w*|nie\s+zyj\w*|zgin\w*|zmar\w*|strat\w*|okropn\w*)\b/;
const factual=/\b(?:gdzie|kiedy|o\s+ktorej|kto|co\s+sie\s+stalo|co\s+sie\s+wydarzylo|czemu|dlaczego|skad|po\s+co|jak\s+doszlo|czy\s+widz\w*|jak\s+zgin\w*|jak\s+umarl\w*)\b/;
const aboutOthers=/\b(?:marek|tomasz|janusz|elzbieta|kamil|magdalena|nowicki|krawczyk|wojcik|zieba|brzozowski|kaczmarek)\b/;
const a=(type,topic,focus,priority=80)=>({type,topic,focus,priority});
function anchorOf(c){
 const st=NPC4_STATE[c.id];const mem=NPC9_MEMORY[c.id];
 const from=st?.npc5?.anchor;
 if(from?.topic&&from.topic!=='general'&&from.topic!=='social')return from;
 if(mem?.lastFocus?.topic)return mem.lastFocus;
 return null;
}
function classify(c,text,attached){
 if(attached)return null;
 const q=limited(text);
 if(!q||q.length>460||npc9Tone(text)==='pressure'||risk.test(q))return null;
 // Independent subquestions: preserve both meanings without choosing one keyword.
 const chunks=String(text||'').split(/(?:[?!;]+\s*(?=[\p{L}]))|(?:\s+i\s+(?=(?:czy|masz|miales|gdzie|kto|kiedy|skad|co\s|dlaczego|czemu|byles|bylas)\b))/iu)
  .map(x=>x.trim()).filter(Boolean);
 if(chunks.length>1&&chunks.length<=3){
  const parts=chunks.map(x=>classify(c,x,attached)).filter(Boolean);
  if(parts.length===chunks.length){
   const flat=parts.flatMap(x=>x.parts).slice(0,3);
   if(flat.length>1)return {type:'compound',topic:flat[0].topic,focus:flat[0].focus,parts:flat,anchor:anchorOf(c)?.topic||'',confidence:'compound',question:q};
  }
 }
 const old=anchorOf(c),oldTopic=old?.topic||'',oldFocus=old?.focus||'';
 const hasVictim=victim.test(q),refsVictim=pronoun.test(q),refSelf=self.test(q);
 const anchoredVictim=['victim_last','last_seen','what_happened','conversation','lena','feeling'].includes(oldTopic)
   || ['victim_alone','victim_location','victim_eyewitness','victim_last_seen','reaction'].includes(window.PS56_LAST?.person===c.id?window.PS56_LAST.type:'');
 // Without a named person or clear conversation anchor, "ona" cannot identify a witness.
 const her=hasVictim||(refsVictim&&anchoredVictim&&!aboutOthers.test(q));
 const candidates=[];const add=(cond,val)=>{if(cond)candidates.push(val);};
 const victimScene=her&&scene.test(q);
 const selfAtScene=refSelf&&/\b(?:sam\w*|nikogo|ktos|z\s+kims|byl\s+ktos)\b/.test(q)&&scene.test(q);
 if(selfAtScene&&c.id==='TOMASZ')add(true,a('discovery_company','witness','finding_company',110));
 else if(selfAtScene)add(true,a('discovery_other','what_happened','not_finder',110));
 const foundQuestion= /\b(?:gdzie|w\s+jakim\s+miejscu|przy\s+ktorym)\b/.test(q) && (victimScene||/\b(?:ja|lene|lena)\s+znalezion\w*\b/.test(q));
 add(foundQuestion,a('victim_location','what_happened','discovery_location',108));
 const whoFound=/\b(?:kto\s+(?:ja|lene|lena|ofiare)\s+znalaz\w*|kto\s+znalaz\w*\s+(?:ja|lene|lena|ofiare))\b/.test(q);
 add(whoFound,a('victim_finder','what_happened','who_found',106));
 const eyewitness=her && /\b(?:widz\w*|byl\w*\s+tam)\b/.test(q)&&/\b(?:umier\w*|umarl\w*|zgin\w*|upadl\w*|ataku|atakuja|obrazen\w*|w\s+chwili\s+smierci)\b/.test(q);
 add(eyewitness,a('victim_eyewitness','what_happened','eyewitness_limit',107));
 const victimAlone=(her&&/\b(?:sam\w*|nikogo|z\s+kim|ktos\s+z\s+nia|towarzysz\w*)\b/.test(q)&&!selfAtScene&&!(/\b(?:twoj\w*|ty|ciebie|toba)\b/.test(q)));
 add(victimAlone,a('victim_alone','victim_last','unverified_alone',106));
 const foundTime=scene.test(q)&&/\b(?:kiedy|ktorej|o\s+ktorej|ktora\s+godzin\w*|jaki\s+czas)\b/.test(q)&&(!aboutOthers.test(q));
 add(foundTime,a('discovery_time','time','alarm_not_discovery',102));
 const visit=/\b(?:ostatni\w*\s+raz|ostatnio|kiedy|o\s+ktorej)\b.*\b(?:widz\w*|spotk\w*|rozmaw\w*)\b|\b(?:widz\w*|spotk\w*|rozmaw\w*)\b.*\b(?:ostatni\w*\s+raz|przed\s+smiercia)\b/;
 add((hasVictim||her)&&visit.test(q),a('victim_last_seen','last_seen','last_direct_contact',102));
 add(her&&/\b(?:widziales|widzialas|spotkales|spotkalas)\s+(?:ja|lene|lena)\b/.test(q),a('victim_last_seen','last_seen','last_direct_contact',100));
 const personalAlibi=/\b(?:alibi|gdzie\s+(?:byles|bylas|byl\s+pan|byla\s+pani)|co\s+(?:robiles|robilas)\s+(?:wtedy|w\s+nocy|tej\s+nocy|tamtej\s+nocy))\b/.test(q);
 add(personalAlibi&&!hasVictim&&!aboutOthers.test(q)&&!/(?:\b(?:jej|jego|ofiary)\s+alibi\b|\balibi\s+(?:jej|jego|leny|ofiary)\b)/.test(q),a('alibi','alibi','alibi_limits',91));
 const companionship=/\b(?:sam|sama|samemu|samotnie|bez\s+nikogo|z\s+kim\s+byl\w*|z\s+kim\s+pracowal\w*|kto\s+(?:ci|panu|pani)\s+towarzysz\w*|kto\s+(?:byl\s+z\s+toba|z\s+panem\s+byl|z\s+pania\s+byla|z\s+toba\s+byl|byl\s+z\s+panem|byl\s+z\s+pania)|ktos\s+(?:z\s+toba|z\s+panem|z\s+pania|przy\s+tobie|przy\s+panu|przy\s+pani)|czy\s+byl\s+ktos\s+obok\s+ciebie|sam\s+tam\s+byl\w*)\b/;
 add((refSelf||/\b(?:z\s+toba|z\s+panem|z\s+pania|przy\s+tobie|kto\s+ci)\b/.test(q))&&companionship.test(q)&&!selfAtScene&&!her,
     a('companions','witness','physical_presence',97));
 // "Miałeś świadka?" has the same referent as the speaker's physical alibi.
 add(/\b(?:masz|miales|mialas|ma\s+pan|ma\s+pani)\b.*\b(?:swiadka|kogos\s+kto\s+potwierdzi)\b/.test(q),a('companions','witness','physical_presence',98));
 add(/\b(?:gdzie\s+(?:(?:dokladnie|wtedy|tej\s+nocy)\s+)?byles|gdzie\s+(?:(?:dokladnie|wtedy|tej\s+nocy)\s+)?bylas|gdzie\s+pan\s+byl|gdzie\s+pani\s+byla)\b/.test(q)&&!hasVictim,a('self_location','alibi','own_location',91));
 add(/\bgdzie\s+(?:siedziales|siedzialas|pracowales|pracowalas|stales|stalas)\b/.test(q)&&!hasVictim,a('self_location','alibi','own_location',94));
 add(/\b(?:ktos\s+(?:cie|ciebie|pana|pania)\s+widzial|kto\s+(?:cie|ciebie|pana|pania)\s+widzial)\b/.test(q)&&!hasVictim,a('companions','witness','physical_presence',96));
 add(/\b(?:ty\s+(?:ja|lene)\s+znales|znales\s+(?:ja|lene|lena)|znalas\s+(?:ja|lene|lena))\b/.test(q)&& (hasVictim||her),a('victim_relation','relations','known_victim',94));
 add(her&&/\b(?:gadal\w*|pogadal\w*|rozmawial\w*)\s+z\s+(?:nia|lena|lena)\b/.test(q),a('victim_conversation','conversation','words_spoken',92));
 add(her&&/\b(?:kiedy\s+(?:ja|lene|lena)\s+widz\w*|kiedy\s+widz\w*\s+(?:ja|lene|lena)|kiedy\s+ja\s+spotk\w*)\b/.test(q),a('victim_last_seen','last_seen','last_direct_contact',99));
 add(her&&/\b(?:kto\s+(?:byl|stal)\s+(?:obok|przy)\s+(?:niej|leny|lenie)|ktos\s+byl\s+przy\s+niej)\b/.test(q),a('victim_alone','victim_last','unverified_alone',97));
 add((grief.test(q)||hasVictim)&&emotional.test(q)&&!factual.test(q),a('reaction','feeling','grief',92));
 if(grief.test(q)&&emotional.test(q)&&!/(?:\b(?:gdzie|kiedy|kto|jak\s+zgin\w*|widziales|widzialas)\b)/.test(q))
   add(true,a('reaction','feeling','grief',91));
 add(her&&/\b(?:co\s+(?:ci|panu|pani)\s+powiedzial\w*|co\s+mowil\w*|o\s+czym\s+rozmawial\w*|(?:lena|ona)\s+(?:ci|panu|pani)\s+powiedzial\w*)\b/.test(q),a('victim_conversation','conversation','words_spoken',93));
 // Follow-up and deictic references need a preceding specific topic.
 const isShort=q.split(' ').length<=9;
 if(isShort){
  const loc=/^(?:(?:a|no|i|to)\s+)?(?:gdzie\s+(?:to|dokladnie)?|a\s+gdzie|w\s+jakim\s+miejscu)\??$/;
  const when=/^(?:(?:a|no|i|to)\s+)?(?:kiedy(?:\s+(?:to|dokladnie))?|o\s+ktorej(?:\s+dokladnie)?|jaka\s+godzina)\??$/;
  const who=/^(?:(?:a|no|i|to)\s+)?(?:kto\s+(?:to\s+)?potwierdzi|a\s+kto\s+to\s+widzial|masz\s+na\s+to\s+swiadka|kto\s+moze\s+potwierdzic)\??$/;
  const source=/^(?:(?:a|no|i|to)\s+)?(?:skad\s+(?:to\s+)?wiesz|skad\s+ta\s+pewnosc|widziales\s+to\s+sam|widzialas\s+to\s+sama|czy\s+sam\s+to\s+widzial\w*|czy\s+sama\s+to\s+widzial\w*)\??$/;
  const certainty=/^(?:(?:a|no|i|to)\s+)?(?:na\s+pewno|jestes\s+pewien|jestes\s+pewna|jest\s+pan\s+pewien|jest\s+pani\s+pewna|masz\s+pewnosc|to\s+pewne)\??$/;
  const then=/^(?:(?:a|no|i)\s+)?(?:co\s+(?:bylo\s+)?(?:potem|dalej|pozniej)|i\s+co\s+dalej|a\s+potem|a\s+dalej|co\s+bylo\s+nastepnie)\??$/;
  const why=/^(?:(?:a|no|i|to)\s+)?(?:dlaczego|czemu|a\s+czemu|no\s+ale\s+dlaczego|po\s+co)\??$/;
  const clarity=/^(?:(?:a|no|i|to)\s+)?(?:co\s+masz\s+na\s+mysli|jak\s+to\s+rozumiec|co\s+to\s+znaczy|mozesz\s+jasniej|sprecyzuj|rozwin\s+to)\??$/;
  const feeling=/^(?:(?:a|no|i|to)\s+)?(?:jak\s+sie\s+z\s+tym\s+czujesz|jak\s+to\s+przezywasz|jest\s+ci\s+przykro|a\s+co\s+ty\s+na\s+to)\??$/;
  if(loc.test(q))add(true,a('follow_location',oldTopic||'general','follow_location',85));
  if(when.test(q))add(true,a('follow_time',oldTopic||'general','follow_time',85));
  if(who.test(q))add(true,a('follow_witness',oldTopic||'general','follow_witness',85));
  if(source.test(q))add(true,a('follow_source',oldTopic||'general','follow_source',85));
  if(certainty.test(q))add(true,a('follow_certainty',oldTopic||'general','follow_certainty',85));
  if(then.test(q))add(true,a('follow_then',oldTopic||'general','follow_then',85));
  if(why.test(q))add(true,a('follow_why',oldTopic||'general','follow_why',85));
  if(clarity.test(q))add(true,a('follow_clarity',oldTopic||'general','follow_clarity',85));
  if((feeling.test(q)||/^(?:a\s+)?co\s+o\s+tym\s+myslisz$/.test(q)&&oldTopic==='feeling'))add(true,a('follow_feeling',oldTopic||'general','follow_feeling',85));
  if(/^(?:a\s+)?(?:ona|jej|ja)\s+(?:byla|bylo)\s+sama\??$/.test(q))add(true,a('victim_alone',oldTopic||'general','unverified_alone',100));
  if(/^(?:a\s+)?(?:a\s+)?(?:wtedy|w\s+tamtej\s+chwili|a\s+ona|a\s+ty|byl\s+ktos\s+jeszcze|byly\s+tam\s+jeszcze\s+jakies\s+osoby|kto\s+tam\s+byl|to\s+kto\s+tam\s+byl)\??$/.test(q))add(true,a('follow_ambiguous',oldTopic||'general','ambiguous_reference',87));
  if(/^(?:a\s+)?(?:kto\s+byl\s+obok\s+niej|kto\s+przy\s+niej\s+stal|kto\s+byl\s+z\s+nia)\??$/.test(q))add(true,anchoredVictim?a('victim_alone','victim_last','unverified_alone',98):a('clarify_person','general','missing_referent',98));
  if(/^(?:(?:a|no|i|to)\s+)?(?:a\s+jej\s+alibi|jej\s+alibi|alibi\s+jej)\??$/.test(q))add(true,a('clarify_person','general','missing_referent',99));
 }
 if(!candidates.length)return null;
 // High-confidence ambiguity handling: do not treat an unknown pronoun as Lena.
 const needsReferent=refsVictim&&!her&&!hasVictim && /\b(?:ona|jej|ja|nia)\b/.test(q);
 if(needsReferent){
   const thirdSubject=candidates.filter(x=>['victim_alone','victim_last_seen','victim_conversation','victim_eyewitness'].includes(x.type));
   if(thirdSubject.length)return {...a('clarify_person','general','missing_referent',112),anchor:oldTopic};
 }
 const unique=[];for(const item of candidates.sort((x,y)=>y.priority-x.priority))if(!unique.some(u=>u.type===item.type))unique.push(item);
 const strong=unique.filter(x=>x.priority>=90);
 let selected=strong.length?strong.slice(0,2):unique.slice(0,1);
 // Never combine a question about the finding with a second, weaker "where" inference.
 if(selected.some(x=>x.type==='discovery_company'||x.type==='discovery_other'))selected=selected.filter(x=>!['companions','victim_alone'].includes(x.type));
 if(selected.some(x=>x.type==='self_location')&&selected.some(x=>x.type==='alibi'))selected=selected.filter(x=>x.type!=='alibi');
 if(selected.length>1&&selected.some(x=>x.type==='victim_eyewitness'))selected=selected.filter(x=>x.type!=='victim_last_seen');
 return {type:selected.length===1?selected[0].type:'compound',topic:selected[0].topic,focus:selected[0].focus,
  parts:selected.map(({priority,...v})=>v),anchor:oldTopic,anchorFocus:oldFocus,confidence:selected[0].priority>=90?'high':'context',question:q};
}
const says=(id,key)=>String(NPC94_FACTS[id]?.[key]||'').trim();
const response=(c,item,old)=>{
 const id=c.id,topic=old?.topic||'',focus=old?.focus||'';
 switch(item.type){
 case 'alibi':return says(id,'alibi');
 case 'companions':return says(id,'witness');
 case 'self_location':return says(id,'location');
 case 'reaction':return says(id,'emotion');
 case 'victim_location':return id==='TOMASZ'?'Znalazłem Lenę przy stanowisku numer trzy. Alarm zgłosiłem o 02:02. Nie widziałem samego zdarzenia.':'Z informacji otrzymanych po alarmie wiem, że Lenę znaleziono przy stanowisku numer trzy. Nie widziałem momentu odnalezienia.';
 case 'victim_finder':return id==='TOMASZ'?'To ja znalazłem Lenę przy stanowisku numer trzy i zgłosiłem alarm o 02:02. Nie byłem świadkiem samego zdarzenia.':'Według informacji po alarmie Lenę znalazł Tomasz Krawczyk przy stanowisku numer trzy. Nie widziałem tego osobiście.';
 case 'discovery_company':return 'Gdy znalazłem Lenę przy stanowisku numer trzy, nie miałem nieprzerwanej obserwacji tego miejsca przed odkryciem. Nie potwierdzę, że przez cały ten czas nikogo innego tam nie było.';
 case 'discovery_other':return 'To nie ja znalazłem Lenę. O odkryciu dowiedziałem się później; nie potrafię powiedzieć z własnej obserwacji, kto był wówczas przy stanowisku.';
 case 'victim_alone':return 'Nie mogę potwierdzić, czy Lena była tam sama. Nie obserwowałem jej nieprzerwanie i nie będę tego zgadywać.';
 case 'victim_eyewitness':return id==='TOMASZ'?'Znalazłem Lenę, ale nie widziałem, jak doznała obrażeń ani kto był przy niej wcześniej.':'Nie widziałem chwili śmierci Leny ani tego, jak doszło do obrażeń.';
 case 'victim_last_seen':return says(id,'last');
 case 'victim_conversation':return String(NPC9_CUSTOM[id]?.conversation||says(id,'last')||'Nie pamiętam dokładnych słów tej rozmowy.');
 case 'victim_relation':return String(NPC9_CUSTOM[id]?.lena||'Znałem Lenę z pracy, ale nie będę zgadywać, czego ode mnie oczekiwała.');
 case 'discovery_time':return id==='TOMASZ'?'Alarm zgłosiłem o 02:02. To jest godzina zgłoszenia, nie dokładny czas obrażeń Leny.':'Zgłoszenie alarmowe nastąpiło o 02:02. Nie znam z osobistej obserwacji dokładnej chwili odnalezienia Leny.';
 case 'follow_location':
   if(focus==='unverified_alone')return 'Nie wiem, w którym konkretnie momencie Lena mogła być sama. Znam miejsce odnalezienia, ale nie całą jej trasę.';
   if(focus==='eyewitness_limit')return 'Nie potrafię wskazać miejsca powstania obrażeń. Lenę znaleziono przy stanowisku numer trzy, ale to nie dowodzi, że tam doszło do zdarzenia.';
   if(['what_happened','victim_last','last_seen'].includes(topic))return topic==='victim_last'?says(id,'lastvictim'):response(c,{type:'victim_location'},old);
   if(['alibi','witness','location','work'].includes(topic))return says(id,'location');
   return 'O które miejsce pytasz: moje stanowisko pracy czy miejsce odnalezienia Leny?';
 case 'follow_time':
   if(focus==='unverified_alone')return 'Nie mam potwierdzonej godziny, w której Lena pozostawała sama. Nie obserwowałem jej nieprzerwanie.';
   if(['what_happened','victim_last'].includes(topic))return response(c,{type:'discovery_time'},old);
   if(topic==='last_seen')return says(id,'last');
   if(['alibi','witness','location','work','time'].includes(topic))return says(id,'time');
   return 'O którą chwilę pytasz — mój dyżur, kontakt z Leną czy alarm?';
 case 'follow_witness':if(focus==='unverified_alone')return 'Nie mam świadka, który potwierdzałby, że Lena była w tamtej chwili sama. Nie wolno mi tego zakładać.';
   if(focus==='finding_company')return 'Nie wskażę naocznego świadka całego zdarzenia. Meldunek potwierdza godzinę alarmu, nie to, kto przebywał wcześniej przy Lenie.';
   return ['alibi','witness','location','work'].includes(topic)?says(id,'witness'):
   ['what_happened','victim_last','last_seen'].includes(topic)?'Mogę powiedzieć tylko, co sam zaobserwowałem. Nie znam osoby, która widziała cały przebieg zdarzenia.':'Co dokładnie mam potwierdzić: moją obecność, rozmowę z Leną czy informacje o jej znalezieniu?';
 case 'follow_source':if(focus==='unverified_alone')return 'Nie mam źródła potwierdzającego, że Lena była wtedy sama. Zwracam właśnie uwagę na tę niewiadomą.';
   if(focus==='eyewitness_limit')return 'Nie widziałem chwili powstania obrażeń. Wiem o odnalezieniu Leny z alarmu, a nie z obserwacji samego zdarzenia.';
   if(focus==='finding_company')return 'O znalezieniu Leny mówię z własnej obserwacji. Godzinę zgłoszenia potwierdza meldunek alarmowy; nie mam obserwacji wcześniejszego zdarzenia.';
   return ['alibi','witness','location','work','time'].includes(topic)?says(id,'verify'):
   ['what_happened','victim_last','last_seen'].includes(topic)?says(id,'source'):
   topic==='feeling'?'To moje własne odczucia. Nie traktuję ich jako dowodu przebiegu zdarzeń.':
   'Którą informację mam uzasadnić? Wolę oddzielić własną obserwację od wiedzy z dokumentów.';
 case 'follow_certainty':if(focus==='unverified_alone')return 'Nie. Nie mogę potwierdzić, czy Lena była sama. To wymaga niezależnych świadków lub śladów.';
   return ['alibi','witness','location','work','time'].includes(topic)?'Co do całego przedziału czasu nie mam pewności. '+says(id,'witness'):
   ['what_happened','victim_last','last_seen'].includes(topic)?'Nie mam pełnej, osobistej obserwacji tego zdarzenia. '+says(id,'source'):
   'Nie potwierdzę czegoś tylko dlatego, że brzmi prawdopodobnie. O który konkretny fakt pytasz?';
 case 'follow_then':if(focus==='unverified_alone')return 'Nie potrafię ustalić, co Lena robiła w kolejnych minutach, jeśli nie mam nieprzerwanej obserwacji jej drogi.';
   if(focus==='eyewitness_limit')return 'Nie obserwowałem przebiegu zdarzenia ani dalszych ruchów osób przy Lenie.';
   if(focus==='finding_company'&&id==='TOMASZ')return 'Po odnalezieniu Leny zgłosiłem alarm o 02:02. Nie byłem świadkiem zdarzenia, które doprowadziło do jej obrażeń.';
   return ['victim_last','last_seen','what_happened'].includes(topic)?says(id,'lastvictim')||says(id,'victim'):
   ['alibi','witness','location','time','work'].includes(topic)?'Nie potrafię odtworzyć każdej kolejnej minuty tylko z pamięci. '+says(id,'time'):
   'Po którym zdarzeniu? Podaj moment, do którego mam nawiązać.';
 case 'follow_why':return ['alibi','witness','location','time'].includes(topic)?'Nie prowadzono nieprzerwanej obserwacji mojej obecności. '+says(id,'witness'):
   ['victim_last','last_seen','what_happened'].includes(topic)?'Nie widziałem całego przebiegu zdarzeń, dlatego nie mogę podać pewnego wyjaśnienia.':
   'Pytasz o powód której decyzji lub sytuacji?';
 case 'follow_clarity':if(focus==='unverified_alone')return 'Nie twierdzę, że Lena była sama. Mówię, że nie mam wystarczających informacji, aby to potwierdzić lub wykluczyć.';
   return ['alibi','witness','location'].includes(topic)?says(id,'alibi'):
   ['what_happened','victim_last','last_seen'].includes(topic)?says(id,'victim'):
   topic==='feeling'?says(id,'emotion'):'Doprecyzuj, którą część mojej wypowiedzi mam wyjaśnić.';
 case 'follow_feeling':return ['feeling','what_happened','victim_last','last_seen'].includes(topic)?says(id,'emotion'):'Pytasz, jak odbieram śmierć Leny, czy jak się czuję podczas tej rozmowy?';
 case 'follow_ambiguous':return focus==='finding_company'?'Nie potrafię potwierdzić, kto jeszcze był tam wcześniej. Widziałem Lenę dopiero przy odnalezieniu.':topic==='witness'?'Nie mam świadka całego dyżuru. '+says(id,'witness'):'Doprecyzuj, o którą osobę i który moment pytasz. Nie chcę zgadywać.';
 case 'clarify_person':return 'O kogo pytasz? Nie chcę przypisywać informacji o jednej osobie komuś innemu.';
 default:return '';
 }
};
function merge(parts){const kept=[];for(const p of parts){const t=String(p||'').trim();if(t&&!kept.some(x=>x===t))kept.push(t);}return kept.join('\n\n');}
function reconcile(c,base,answer,item){
 const mem=NPC9_MEMORY[c.id],st=NPC4_STATE[c.id];if(!mem)return;
 const contextFocus=item.type.startsWith('follow_')?(item.anchorFocus||item.focus):item.focus;
 const semantics=Array.isArray(mem.semantic)?mem.semantic:[];
 const rec=[...semantics].reverse().find(r=>r.turn===mem.turn && r.answer===base && !['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(r.status));
 if(rec){rec.answer=answer;rec.topic=item.type==='compound'?'mixed':item.topic;rec.focus=contextFocus;rec.source_ids=[];}
 const statement=[...(mem.statements||[])].reverse().find(r=>r.turn===mem.turn&&r.text===base&&!['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(r.status));
 if(statement){statement.text=answer;statement.topic=item.topic;}
 if(mem.topics?.length)mem.topics[mem.topics.length-1]=item.topic;
 mem.lastFocus={...(mem.lastFocus||{}),topic:item.type==='compound'?'mixed':item.topic,focus:contextFocus};
 if(st?.recent?.length){let r=st.recent[st.recent.length-1];r.topic=item.topic;r.focus=contextFocus;r.answer=limited(answer).slice(0,1550);r.variant='natural-5.6';}
 const h=st?.npc5;
 if(h){if(h.recent?.length){const r=h.recent[h.recent.length-1];r.topic=item.topic;r.answer=answer.slice(0,1400);r.mode='natural-5.6';}
  h.anchor={topic:item.type==='compound'?'mixed':item.topic,focus:contextFocus,question:String(mem.userClaims?.at(-1)?.text||'').slice(0,180),answer};}
 if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic:item.topic,focus:contextFocus,variant:'natural-5.6'};
 window.PS56_LAST={person:c.id,type:item.type,topic:item.topic,question:String(mem.userClaims?.at(-1)?.text||''),answer};
}
const ps3_16_contextual_question_understanding_npc4Answer = function(c,raw,attached){
 const parsed=classify(c,raw,attached);
 // Never bypass previous interrogation engine: it updates state, handles
 // witness stress, audit gates, deceptions and formal confrontation first.
 const beforeConfronted=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const base=previous(c,raw,attached);
 if(!parsed)return base;
 const old={topic:parsed.anchor,focus:parsed.anchorFocus};
 const replies=[];
 for(const part of parsed.parts){replies.push(response(c,part,old));if(!part.type.startsWith('follow_')){old.topic=part.topic;old.focus=part.focus;}}
 const chosen=merge(replies.map(r=>c.gender==='f'?r.replace(/widziałem/g,'widziałam').replace(/Widziałem/g,'Widziałam').replace(/obserwowałem/g,'obserwowałam').replace(/zaobserwowałem/g,'zaobserwowałam').replace(/dowiedziałem/g,'dowiedziałam').replace(/znalazłem/g,'znalazłam').replace(/byłem/g,'byłam').replace(/co sam zaobserwowałam/g,'co sama zaobserwowałam'):r));
 if(!chosen||chosen===base)return base;
 // If older engines made a formal correction, never alter it.
 if((NPC9_MEMORY[c.id]?.confronted?.length||0)>beforeConfronted)return base;
 reconcile(c,base,chosen,parsed);
 return chosen;
};
registerWitnessAnswerLayer("16-contextual-question-understanding",ps3_16_contextual_question_understanding_npc4Answer);
window.PS56_QA={version:'5.6',analyze:(id,q,attached)=>{const c=CONTENT.characters.find(c=>c.id===id);return c?classify(c,q,attached):null;},last:()=>window.PS56_LAST||null,previous:formerQA,groups:['kontekst','referent','pytanie skrótowe','literówki','wielointencyjność','ochrona dowodów']};
})();

