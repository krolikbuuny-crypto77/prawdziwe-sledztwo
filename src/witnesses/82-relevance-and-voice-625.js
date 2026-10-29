/* Pakiet 6.25: ostatnia bezpieczna kontrola zgodności odpowiedzi z pytaniem.
 * Naprawia WYŁĄCZNIE błędne przekierowania lub ogólnikową reakcję na niejasną
 * sprzeczność. Nie dostarcza nowej wiedzy ani nie zmienia bramek dowodowych.
 * Własne słownictwo sześciu osób, bez jednej wspólnej formułki.
 */
(function(){
'use strict';
if(typeof WitnessEngine==='undefined'||typeof NPC9_MEMORY==='undefined')return;
const before=WitnessEngine.snapshotAnswer();
const plain=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/\s+/g,' ').trim();
const labels=Object.freeze({tech:'części L-2 / L-3',receipt:'protokół odbioru',sequence:'kolejność alarmu i zmiany kursu',routing:'zmiana dyspozycji TW-217',workorder:'powód zlecenia',contradiction:'sprzeczność wypowiedzi'});
const profiles={
 MAREK:{
  tech:['L-2 i L-3 to szczegóły techniczne. Nie będę ich oceniał zamiast diagnosty.','Co do L-2 i L-3, sam nie ustalę przyczyny awarii. Tu potrzebne są oględziny.','O L-2 i L-3 nie mam własnego ustalenia technicznego. Mogę mówić o decyzjach organizacyjnych, nie o stanie części.'],
  receipt:['W odbiorze L-3 liczy się podpis na protokole. Bez niego nie wskażę odpowiedzialnej osoby.','W sprawie odbioru L-3 ważne jest, czyje zatwierdzenie widnieje w dokumentacji. Tego nie potwierdzę bez niej.'],
  sequence:['Kolejność alarmu i zmiany kursu trzeba ustalić z obu zapisów. Sam nie odtworzę jej z pewnością.','Nie chcę łączyć alarmu i zmiany dyspozycji w jedną historię bez porównania godzin.'],
  routing:['Nie potrafię podać pewnego powodu zmiany dyspozycji TW-217. Proszę oddzielić decyzję od późniejszego zapisu.','Nie będę dopisywał motywu do zmiany kursu. Trzeba sprawdzić podstawę tamtej dyspozycji.'],
  workorder:['Nie ustalę przyczyny wystawienia zlecenia bez wskazania konkretnej decyzji.','Proszę wskazać zlecenie. Nie chcę przypisywać komuś powodu, którego nie znam.'],
  contradiction:['Co konkretnie się nie zgadza? Bez wskazania wypowiedzi nie odpowiem na zarzut.','Proszę powiedzieć, o którą moją odpowiedź chodzi. Nie chciałbym zgadywać.','Jeśli coś powiedziałem inaczej, proszę to przytoczyć. Odniosę się do konkretu.']},
 TOMASZ:{
  tech:['O L-2 i L-3 nie potrafię powiedzieć, jaka była awaria. Tym zajmowali się ludzie od techniki.','L-2 i L-3? Nie sprawdzałem tych części. Nie powiem, co się w nich zepsuło.','Nie mam własnych oględzin L-2 ani L-3. Nie chcę zgadywać usterki.'],
  receipt:['Protokół odbioru L-3 nie był moim meldunkiem z dyspozytorni. Nie wiem, kto go zatwierdził.','Nie potrafię wskazać osoby odpowiedzialnej za odbiór L-3. Moje zapisy dotyczyły dyspozycji.'],
  sequence:['Alarm i zmianę kursu pamiętam jako różne sprawy. Pełną kolejność trzeba sprawdzić w łączności.','Nie ułożę z pamięci wszystkich minut między zmianą dyspozycji a alarmem.'],
  routing:['Nie pamiętam, z jakiego powodu zmieniono dyspozycję TW-217.','Nie chcę odtwarzać powodu zmiany kursu na wyczucie. Trzeba sięgnąć do dyspozycji.'],
  workorder:['Nie wiem, co dokładnie zdecydowało o wystawieniu zlecenia warsztatowego.','Powód zlecenia? Z mojego stanowiska nie potwierdzę, dlaczego je wystawiono.'],
  contradiction:['Co powiedziałem inaczej?','Poczekaj. O którą odpowiedź chodzi?','Mogłem coś pomylić, ale powiedz najpierw, co się nie zgadza.']},
 JANUSZ:{
  tech:['L-2 i L-3 trzeba sprawdzić na warsztacie. Z samego pytania nie wyciągnę przyczyny awarii.','Co z L-2 i L-3? Musiałbym zobaczyć surowe zlecenie i wynik oględzin. Nie będę zgadywał.','O tych częściach mogę mówić tylko w zakresie wykonanej pracy. Przyczyny awarii nie ustalę bez sprawdzenia L-2 i L-3.'],
  receipt:['Kto odpowiada za protokół odbioru L-3? Najpierw zobaczmy podpis i zakres czynności.','Odbiór L-3 to nie to samo co wykonanie pracy. Bez dokumentu nie wskażę odpowiedzialnej osoby.'],
  sequence:['Nie byłem przy każdej dyspozycji. Alarm i zmianę kursu trzeba porównać z zapisami, nie z moją pamięcią.','Kolejności zmiany kursu i alarmu nie podam na słowo. Byłem przy pracy, nie przy wszystkich meldunkach.'],
  routing:['Nie wiem, dlaczego zmieniono dyspozycję TW-217. To nie była moja decyzja.','Zmiana kursu TW-217? Nie będę dopowiadał powodu za dyspozytornię.'],
  workorder:['Przy zleceniu wolę zobaczyć, co wpisano. Bez tego nie powiem, dlaczego je uruchomiono.','Powód zlecenia powinien być przy zleceniu. Nie mam pewności, jaki wpisano.'],
  contradiction:['To powiedz, w którym miejscu.','Co konkretnie miałem powiedzieć inaczej?','Daj mi tę wcześniejszą wypowiedź. Nie będę kłócił się z ogólnym zarzutem.']},
 ELZBIETA:{
  tech:['O awarii L-2 i L-3 nie mam własnej diagnozy. Zajmowałam się zgłoszeniem ryzyka, nie pomiarem tych części.','L-2 i L-3 to pytanie do dokumentacji technicznej. Mogę mówić o zgłoszeniach, które znałam.','Nie potwierdzę rodzaju usterki L-2 ani L-3. Sama tych podzespołów nie sprawdzałam.'],
  receipt:['Protokół odbioru L-3 wymaga sprawdzenia podpisów. Nie wiem z własnej wiedzy, kto go zatwierdził.','Nie potrafię wskazać odpowiedzialnego za odbiór L-3 bez protokołu. Moje obowiązki dotyczyły BHP.'],
  sequence:['Nie obserwowałam całej zmiany. Nie potrafię ustalić kolejności alarmu i zmiany kursu z pamięci.','Kolejności tych dwóch zdarzeń nie potwierdzę. Rozmawiałam o zagrożeniu, nie śledziłam wszystkich dyspozycji.'],
  routing:['Przyczyny zmiany dyspozycji TW-217 nie znam na tyle dobrze, by ją podać jako fakt.','Nie byłam osobą podejmującą decyzję o zmianie kursu. Nie będę tłumaczyć jej intencji.'],
  workorder:['Nie potrafię przypisać powodu temu zleceniu. Dotyczyło innego obiegu niż moje zgłoszenia.','Proszę wskazać konkretne zlecenie. Wolałabym nie mieszać go z korespondencją BHP.'],
  contradiction:['Które zdanie masz na myśli?','Nie jestem pewna, czego dotyczy zarzut. Możesz powiedzieć konkretnie?','Jeżeli coś zabrzmiało inaczej, chciałabym wiedzieć co.']},
 KAMIL:{
  tech:['L-2 i L-3 wymagają sprawdzenia surowych danych. Nie nazwę usterki na podstawie samej wzmianki.','O L-2 i L-3 nie da się powiedzieć uczciwie „awaria”, nie ustalając, co pokazują pomiary.','L-2, L-3... Potrzebuję wskazania konkretnego odczytu. Inaczej nie odróżnię usterki od błędu zapisu.'],
  receipt:['Nie wiem, kto podpisał odbiór L-3. Diagnostyka i zatwierdzenie protokołu to różne rzeczy.','Odbiór L-3? To trzeba sprawdzić w historii zatwierdzeń, nie wyciągać z logu diagnostycznego.'],
  sequence:['W surowych logach są czasy operacji, ale kolejności alarmu i zmiany kursu nie stwierdzę bez obu źródeł.','Alarm i dyspozycja to osobne zapisy. Nie skleję ich w chronologię bez porównania.'],
  routing:['Sam odczyt techniczny nie podaje powodu zmiany dyspozycji TW-217. Tego nie wiem.','Nie potrafię powiedzieć, dlaczego ktoś zmienił kurs. Log nie pokazuje intencji.'],
  workorder:['Nie ustalę motywu wystawienia zlecenia na podstawie samej diagnostyki.','Powód zlecenia trzeba potwierdzić w dokumentacji. Log nie jest uzasadnieniem decyzji.'],
  contradiction:['Gdzie jest rozbieżność? W odczycie czy w moich słowach?','Co dokładnie się rozjechało?','Pokaż tę różnicę. Bez tego nie wiem, do czego mam się odnieść.']},
 MAGDALENA:{
  tech:['Nie potwierdzę przyczyny awarii L-2 i L-3 bez dokumentacji technicznej.','L-2 i L-3 są objęte dokumentacją odbiorową. Sam zapis nie wystarczy, by przesądzić usterkę.','Nie ma podstaw, żebym z pamięci rozstrzygała stan L-2 i L-3.'],
  receipt:['W sprawie protokołu odbioru L-3 proszę wskazać konkretną wersję. Wtedy można ustalić zakres zatwierdzenia.','Nie wskażę odpowiedzialności za odbiór L-3 bez numeru dokumentu i jego wersji.'],
  sequence:['Z samej sesji audytowej nie wynika kolejność alarmu i zmiany kursu. Tego nie potwierdzę.','Nie ustalę chronologii alarmu i dyspozycji na podstawie jednego rejestru.'],
  routing:['Powodu zmiany dyspozycji TW-217 nie potrafię potwierdzić z dokumentacji odbiorowej.','Nie dysponuję ustaleniem, które wyjaśniałoby przyczynę zmiany kursu TW-217.'],
  workorder:['O które zlecenie pan pyta? Bez wskazania wersji nie potwierdzę jego uzasadnienia.','Nie potrafię przypisać decyzji o zleceniu konkretnego powodu bez dokumentu.'],
  contradiction:['Co konkretnie miałam powiedzieć inaczej?','Proszę wskazać, o którą wypowiedź chodzi.','Na co się pan powołuje? Nie chcę odpowiadać na niedopowiedziany zarzut.']}
};
const PROTECTED=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL']);
function detect(raw){
 const q=plain(raw);if(!q||q.length>850)return null;
 const hasParts=/\bl\s*[- ]?\s*[23]\b/.test(q),card=/(?:\bt[ -]?17\b|\bkart\w*\b)/.test(q),routeMention=/(?:dyspozycj|zmian\w* kurs)/.test(q);
 // Nie zastępuj odpowiedzi na pytania o kilka odrębnych wątków jednym zdaniem.
 if((card&&(hasParts||routeMention))||(hasParts&&/(?:gdzie byla lena|co wiedziala lena|czy lena wiedziala)/.test(q)))return null;
 const techn=/(?:awari|usterk|uszkodz|niezgodn|co sie stalo|co wiesz|co jest nie tak|co z|przyczyn|problem|diagnos)/.test(q);
 if(hasParts&&/(?:protokol|odbior|zatwierdz|podpis)/.test(q)&&/(?:kto|odpowiada|zatwierdz|podpis)/.test(q))return 'receipt';
 if(hasParts&&techn&&!/(?:lena|leny|lenie|magdalena|sprawc|sabotaz|celowo|kto zabil|zamordow|przyznaj|powiedzial|wczesniej|inaczej)/.test(q))return 'tech';
 // Nigdy nie myl zarzutu wobec zeznań z przedstawionym dowodem albo formalnym przyznaniem się.
 if(/(?:wczesniej|poprzednio|przed chwila|najpierw)/.test(q)&&/(?:inaczej|cos innego|sprzeczn|niezgodn|zmienil|zmienila|mowil|mowila|powiedzial)/.test(q)&&!/(?:zabojst|morderstw|zabil|zamordow|przyznan)/.test(q))return 'contradiction';
 if(/(?:zeznan|wypowiedzi|powiedzial)/.test(q)&&/(?:nie zgadza|sprzeczn|rozbiezn|co jest nie tak|co sie nie zgadza)/.test(q))return 'contradiction';
 const alarm=/(?:alarm|02:02)/.test(q),route=/(?:kurs|dyspozycj|zmian)/.test(q);
 if(alarm&&route&&/(?:kolejno|kiedy|chronolog|przed|po czym)/.test(q))return 'sequence';
 if(/(?:dlaczego|czemu|z jakiego powodu|jaka przyczyn)/.test(q)&&/(?:dyspozycj|zmieniono kurs|zmienil kurs|zmienila kurs)/.test(q))return 'routing';
 if(/(?:powod|dlaczego|czemu|przyczyn)/.test(q)&&/(?:zlecen|zlecil|zlecic)/.test(q))return 'workorder';
 return null;
}
function isOffTopic(kind,text){
 const a=plain(text);
 if(kind==='contradiction')return true;
 if(kind==='tech')return !/\bl\s*[- ]?\s*[23]\b/.test(a);
 if(kind==='receipt')return !/(?:odbior|protokol|zatwierdz|podpis)/.test(a)||!/\bl\s*[- ]?\s*[23]\b/.test(a);
 if(kind==='sequence')return !(/alarm/.test(a)&&/(?:kurs|dyspozycj)/.test(a));
 if(kind==='routing')return !/(?:kurs|dyspozycj|tw-?217)/.test(a);
 if(kind==='workorder')return !/(?:powod|przyczyn|dlaczego|nie wiem|nie potraf|bez dokument|bez wskazania|wystawion)/.test(a);
 return false;
}
function permitted(c,answer,attached,oldConfronted){
 const m=NPC9_MEMORY?.[c?.id];if(!m||!c||attached||simWitness(c).blocked)return false;
 const sem=m.semantic?.at(-1),st=m.statements?.at(-1);
 if((m.confronted?.length||0)!==oldConfronted||!sem||!st||sem.turn!==m.turn||st.turn!==m.turn||
    sem.answer!==answer||st.text!==answer||PROTECTED.has(sem.status)||PROTECTED.has(st.status)||
    sem.source_ids?.length||st.source_ids?.length)return false;
 const a=plain(answer);
 if(/(?:przyznaje sie|odmawiam|pelnomocnik|podtrzymuje odmowe|konfrontacj.{0,28}dowod|udowodnil).{0,70}/.test(a))return false;
 return true;
}
function rewrite(c,old,next,kind){
 const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id];
 const last=m.semantic.at(-1),st=m.statements.at(-1);
 if(last.answer!==old||st.text!==old||last.source_ids?.length||st.source_ids?.length)return false;
 last.answer=next;st.text=next;last.topic=kind;st.topic=kind;
 const replace=(obj,key,max)=>{if(obj&&obj[key]===old.slice(0,max))obj[key]=next.slice(0,max);};
 const replaceNorm=(obj,key,max)=>{if(obj&&obj[key]===plain(old).slice(0,max))obj[key]=plain(next).slice(0,max);};
 replaceNorm(s.recent?.at(-1),'answer',1550);
 replace(s.npc5?.recent?.at(-1),'answer',1400);replace(s.npc5?.anchor,'answer',1400);
 replace(s.npc57?.episodes?.at(-1),'answer',1600);
 replace(s.npc65?.recent?.at(-1),'answer',1300);replace(s.npc65,'lastAnswer',1300);
 replace(s.npc68?.threads?.at(-1),'a',850);replace(s.npc89?.recent?.at(-1),'a',1200);replace(s.npc62,'a',1600);
 if(m.topics?.length)m.topics[m.topics.length-1]=kind;
 if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic:kind,focus:'relevance-6.25'};
 return true;
}
function select(c,kind,question){
 const texts=profiles[c.id]?.[kind];if(!texts?.length)return null;
 // Rozmaitość nie jest losowa: zależy od świadka, sformułowania pytania i już
 // wypowiedzianych kwestii. Dzięki temu działa offline i po imporcie zapisu.
 const history=(NPC9_MEMORY[c.id]?.statements||[]).slice(-12).map(x=>plain(x.text));
 let seed=0;for(const letter of c.id+'|'+plain(question))seed=(Math.imul(seed,33)+letter.charCodeAt(0))|0;
 let idx=(seed>>>0)%texts.length;
 for(let i=0;i<texts.length;i++){
  const candidate=texts[(idx+i)%texts.length];
  if(!history.some(x=>x===plain(candidate)))return candidate;
 }
 return texts[(idx+(NPC9_MEMORY[c.id]?.turn||0))%texts.length];
}
registerWitnessAnswerLayer('82-relevance-and-voice-625',function(c,question,attached){
 const oldConfronted=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
 const kind=detect(question),answer=before(c,question,attached);
 if(!kind||!profiles[c?.id]||!permitted(c,answer,attached,oldConfronted)||!isOffTopic(kind,answer))return answer;
 const picked=select(c,kind,question);
 if(!picked||picked===answer||!rewrite(c,answer,picked,kind))return answer;
 window.PS625_LAST={id:c.id,topic:kind,changed:true};return picked;
});
window.PS625_RELEVANCE=Object.freeze({detect,labels,version:'6.25',last:()=>window.PS625_LAST||null});
})();
