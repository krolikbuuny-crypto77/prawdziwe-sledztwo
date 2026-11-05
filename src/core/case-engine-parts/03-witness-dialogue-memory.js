
let NPC93_MAT=null;
function npc93Init(){if(NPC93_MAT)return;const bytes=atob(NPC93_DATA.weights);const arr=new Int8Array(bytes.length);for(let i=0;i<bytes.length;i++)arr[i]=bytes.charCodeAt(i)>127?bytes.charCodeAt(i)-256:bytes.charCodeAt(i);NPC93_MAT=arr;}
function npc93Hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;}return h%NPC93_DATA.dim;}
function npc93Feature(q){const s=norm(q).replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim(),w=s?s.split(' '):[],m=new Map();const add=(key,x)=>{let h=npc93Hash(key);m.set(h,(m.get(h)||0)+x);};
for(const t of w){add('w:'+t,2);if(t.length>=5)add('p:'+t.slice(0,5),.8);}
for(let i=1;i<w.length;i++)add('b:'+w[i-1]+'_'+w[i],1.3);
const x=' '+s+' ';for(const n of [3,4,5])for(let i=0;i<=x.length-n;i++)add(n+':'+x.slice(i,i+n),n===3?.35:.42);
let ss=0;for(const v of m.values())ss+=v*v;const d=Math.sqrt(ss)||1;return [...m.entries()].map(([h,v])=>[h,v/d]);}
function npc93Predict(q){npc93Init();const x=npc93Feature(q),names=NPC93_DATA.labels,dim=NPC93_DATA.dim,scores=[];for(let j=0;j<names.length;j++){let z=NPC93_DATA.bias[j],offset=j*dim,scale=NPC93_DATA.scales[j];for(const [h,v] of x)z+=NPC93_MAT[offset+h]*scale*v;scores.push({topic:names[j],score:z});}scores.sort((a,b)=>b.score-a.score);const mx=scores[0].score;let den=0;for(const p of scores)den+=Math.exp(p.score-mx);return {topic:scores[0].topic,prob:1/den,margin:scores[0].score-scores[1].score,top:scores.slice(0,3)};}
function npc93Topic(q,memory){const cleaned=String(q||'').replace(/^(?:\s*(?:nie kr[eę]ć|nie wmawiaj mi|przestań kłamać|bez ściemy|powiedz prawdę|no dobra|słuchaj|ej|proszę cię|proszę pana|proszę pani)[!,.:;\s-]*)+/i,'').trim();const p=npc93Predict(cleaned||q);let safe=p.prob>=.40 && p.margin>=.55;
 // Some narrow categories are underrepresented: never promote uncertainty into evidence-specific knowledge.
 if(['card','cctv','messages','risk','laboratory','archive','verification'].includes(p.topic))safe=safe&&p.prob>=.55;
 return safe?p.topic:null;}

function npc93RecallSubject(q,mem){const s=norm(q);const refs=[
 ['alibi',/\b(?:alibi|obecnosc|gdzie byl|gdzie byles|przebywal|mojej obecnosci|swojej obecnosci)\b/],
 ['witness',/\b(?:swiad|kto cie widzial|kto pana widzial|potwierdzen)\w*/],
 ['work',/\b(?:obowiaz|robota|praca|zadania)\w*/],
 ['documents',/\b(?:grafik|dokument|protokol|wpis|raport|rejestr)\w*/],
 ['conversation',/\b(?:rozmow|powiedziala lena|slowa leny)\w*/],
 ['feeling',/\b(?:uczuc|emocj|przezyci|teskni|zal po)\w*/],
 ['relations',/\b(?:konflikt|stosunk|relacj|wspolprac)\w*/],
 ['card',/\b(?:karta|identyfikator|t17|t 17)\b/],
 ['time',/\b(?:dokladn\w* godzin|minut\w*)\b/]
];for(const [name,re] of refs)if(re.test(s))return name;
return [...mem.topics].reverse().find(t=>t!=='recall'&&t!=='social')||null;}
function npc9Topic(part,memory){const s=norm(part);if(!s)return null;const modelTopic=npc93Topic(part,memory);if(modelTopic)return modelTopic;const framed=npc92Frame(part,memory);if(framed)return framed;const semantic=npc91Semantic(part,memory);if(semantic)return semantic;
 if(/co\s+(?:wiadomo|ustalono|wiemy)\s+o\s+(?:smierci|zabojstwie)\s+len/.test(s))return 'what_happened';
 if(/z\s+kim\s+rozmawiala\s+lena|o\s+czym\s+rozmawiala\s+lena/.test(s))return 'conversation';
 if(/kiedy\s+ostatni\s+raz\s+(?:byl|byla|byles|bylas)\b/.test(s))return 'time';
 if(/historie\s+zmian\s+(?:tego\s+)?protokol|poprzednia\s+wersj/.test(s))return 'archive';
 if(/\b(?:co|jak|jaka|kim)\b.*\blen[ayie]\b/.test(s)&&!/\b(?:zabil|zamordowal|sprawca|zabojca|smierci|zabojstwie)\b/.test(s))return 'lena';const heuristic=npc9Heuristic(s);if(heuristic)return heuristic;const near=npc9Nearest(s);if(near&&near.score>=.69&&(near.score-near.runner.score>.025||near.t===near.runner.t))return near.t;
 if(/\b(?:a\s+to|a\s+wtedy|czemu\s+tak|dlaczego\s+tak|skad\s+to|na\s+pewno|a\s+potem|a\s+dalej|i\s+co\s+dalej|dlaczego)\b/.test(s)&&s.length<26&&memory.topics.length)return memory.topics[memory.topics.length-1];
 if(/co\s+(?:wiesz|myslisz|sadzisz)\s+o\s+len|jaka\s+byla\s+lena/.test(s))return 'lena';
 if(/bez\s+przerwy|w\s+pokoju\s+audytu|w\s+momencie\s+smierci|tej\s+nocy\s+(?:byl|bylas)/.test(s))return 'alibi';
 if(/przyznaj\s+sie\s+do\s+(?:zabojstw|morderstw)|to\s+(?:ty|pan|pani)\s+(?:jestes|jest)\s+(?:sprawca|morderca)/.test(s))return 'culprit';
 if(/co\s+wiesz\s+o\s+(?:sprawie|zabojstwie)|jaki\s+stan\s+spraw/.test(s))return 'what_happened';
 if(/kto\s+cie\s+widzial|kto\s+to\s+potwierdzi\s+osobiscie/.test(s))return 'witness';
 if(/skad\s+to\s+wiesz|z\s+pierwszej\s+reki|obserwacj|plotk/.test(s))return 'source';
 const scored=[];for(const {key,re} of NPC9_PATTERNS){let match=re.exec(s);if(match)scored.push({key,score:match[0].length+(key==='culprit'?12:0)+(key==='feeling'?8:0)+(key==='last_seen'?9:0)+(key==='witness'?7:0)+(key==='conversation'?10:0)+(key==='victim_last'?14:0)+(key==='inference'?15:0)+(key==='social'?7:0)+(key==='hypothesis'?12:0),index:match.index});}
 if(!scored.length){if(near&&near.score>=.42)return near.t;if(/\b(?:co|jak|jaka|kim)\b.*\blen[ayie]\b/.test(s))return 'lena';if(/\blen[ayie]\b/.test(s))return 'lena';if(/\b(?:noc|zmian|hangar|dyzur)\b/.test(s))return 'alibi';return null;}
 scored.sort((a,b)=>b.score-a.score||a.index-b.index);return scored[0].key;
}
function npc9Interpret(raw,memory){const tone=npc9Tone(raw),parts=npc9Clauses(raw);let topics=[];for(const part of parts){if(tone==='pressure' && /^(?:nie krec|przestan klamac|nie kombinuj|bez sciemy|nie wciskaj mi kitu|przyznaj sie|do cholery)[.! ]*$/.test(norm(part)))continue;const topic=npc9Topic(part,memory);if(topic&&!topics.includes(topic))topics.push(topic);}
 const s=norm(raw);if(/\b(?:wczesniej\s+powiedzial|wczesniej\s+powiedzialas|twierdziles|twierdzilas|przyznales|przyznalas|sam\s+mowiles|sama\s+mowilas)\b/.test(s)&&!/\b(?:przeprasz|wybacz)\b/.test(s))return {topics:topics.length?topics:['recall'],tone,act:'challenge',parts};
 if(/co\s+(?:wczesniej\s+)?(?:powiedziales|powiedzialas|mowiles|mowilas)|przypomnij.*(?:powiedz|mowil)|co\s+zeznal/.test(s))return {topics:topics.length?topics:['recall'],tone,act:'recall',parts};
 return {topics:topics.slice(0,3),tone,act:tone==='apology'?'apology':'question',parts};}
function npc9Person(raw){const s=norm(raw);for(const c of CONTENT.characters){const surname=norm(c.name.split(' ').slice(-1)[0]);if(s.includes(surname))return c.name;}
 if(/\blen[ayie]\b/.test(s))return 'Lena Rudnicka';return null;}
function npc9Repetition(mem,topic){return mem.topics.filter(x=>x===topic).length;}
function npc9LastFact(mem,topic){return [...mem.statements].reverse().find(x=>x.topic===topic&&!x.retracted);}
function npc9Phrase(c,profile,topic,mem,raw){const v=profile.voice_examples,extra=NPC9_CUSTOM[c.id];
 const answerMap={alibi:v.alibi,witness:v.witness,last_seen:v.last_seen,what_happened:v.what_happened,culprit:extra.culprit,feeling:extra.feeling,relations:extra.relations,work:extra.work,documents:extra.documents,risk:extra.risk,card:extra.card,cctv:extra.cctv,messages:extra.messages,laboratory:extra.laboratory,accountability:extra.accountability,verification:extra.verification,time:extra.time,lena:extra.lena,motive:v.motive,bhp:extra.risk,observations:extra.observations,break:extra.break,hypothesis:extra.hypothesis,conversation:extra.conversation,access:extra.access,victim_last:extra.victim_last,archive:extra.archive,inference:extra.inference,source:extra.source,social:extra.social,recall:null};
 let answer=answerMap[topic];if(!answer)return null;
 // Distinct questions within a topic never cause a subject switch; answer stays grounded in the asked topic.
 return answer;
}
function npc9ReferentQuestion(raw,topic,mem,person){const s=norm(raw);if(topic==='relations'&&person==='Lena Rudnicka')return true;return false;}
function npc9GroundedUnknown(c,profile,raw,mem){const s=norm(raw);const p=npc9Person(raw);if(/\b(?:ktora|ktory|ile|numer|kod|dokladna|dokladnie|ktorego)\b/.test(s))return c.id==='KAMIL'?'Nie podam tego z głowy. Trzeba sprawdzić odpowiedni log albo dokument, bo łatwo pomylić numery.':c.id==='MAGDALENA'?'Nie mam podstaw, by podać tak dokładną wartość bez sprawdzenia dokumentacji.':'Nie pamiętam takiego szczegółu na tyle pewnie, żeby go podawać jako fakt.';
 if(p&&p!=='Lena Rudnicka'){const rel=profile.relation[p];if(rel)return (c.id==='MAGDALENA'?'To jest moja relacja służbowa: ':'Mogę powiedzieć tyle: ')+rel.charAt(0).toUpperCase()+rel.slice(1)+'. Nie wiem, gdzie ta osoba przebywała w każdej minucie.';}
 if(/\b(?:dlaczego|czemu|po\s+co)\b/.test(s))return 'Nie znam przyczyny z własnej obserwacji. Mogę oddzielić to, co widziałem, od tego, co wyciągamy z zapisów.';
 return c.id==='MAGDALENA'?'Nie potrafię tego ustalić na podstawie własnej wiedzy. Potrzebne byłoby konkretniejsze źródło.':c.id==='KAMIL'?'Tego akurat nie wiem. Nie chcę strzelać; trzeba sprawdzić źródło.':c.id==='TOMASZ'?'Tego nie widziałem. Nie będę zmyślał, żeby odpowiedź brzmiała pewniej.':c.id==='JANUSZ'?'Nie będę zgadywał. Co innego widzieć coś samemu, a co innego usłyszeć po zmianie.':c.id==='ELZBIETA'?'Nie potrafię tego potwierdzić z własnej wiedzy. Musiałabym oprzeć się na źródle.':'Nie mam podstaw do takiego ustalenia. Proszę odróżnić moje obserwacje od dokumentacji.';
}
function npc9ToneLead(c,tone,topic,mem){if(tone==='pressure'){
  const pressureCount=mem.userClaims.filter(x=>npc9Tone(x.text)==='pressure').length;
  if(pressureCount>=4&&mem.stress>45)return {MAREK:'Już panu odpowiedziałem na podobny zarzut. ',TOMASZ:'Nie zmienię faktów dlatego, że pan naciska. ',JANUSZ:'Powtórzę spokojnie, ale ostatni raz w takiej formie. ',ELZBIETA:'Przy takich zarzutach muszę ważyć każde słowo. ',KAMIL:'Nie wciskaj mi odpowiedzi, której nie mam. ',MAGDALENA:'Proszę formułować konkretne pytania, nie groźby. '}[c.id];
  return {MAREK:'Proszę bez nacisku. ',TOMASZ:'Niech pan nie krzyczy. ',JANUSZ:'Niech pan nie próbuje mnie zakrzyczeć. ',ELZBIETA:'Proszę nie podnosić głosu. ',KAMIL:'Ej, spokojnie. ',MAGDALENA:'Groźby niczego nie wyjaśnią. '}[c.id];}

 if(tone==='empathy'&&topic!=='feeling')return {MAREK:'Doceniam, że pan to rozumie. ',TOMASZ:'Dzięki. ',JANUSZ:'To nie jest łatwe. ',ELZBIETA:'Dziękuję. ',KAMIL:'Dzięki, serio. ',MAGDALENA:'Przyjmuję to do wiadomości. '}[c.id];return '';}
function npc9GatePrompt(id,topics,raw){const s=norm(raw);const gt=NPC9_GATE_BY_ID[id];return topics.includes(gt)||(id==='TK_RADIO'&&/radi|polecen|dyspozy|rejestr/.test(s))||(id==='MK_SESSION'&&/sesj|wideokonferen|gdzie\s+byl/.test(s))||(id==='KB_CARD'&&/kart|t\s*17|identyfikator/.test(s))||(id==='MK_INVITATION'&&/wiadom|zaproszen|sms/.test(s));}
function npc9Evidence(c,mem,attached,topics,raw){if(!attached)return null;const d=byId[attached];if(!d||!STATE.found.has(attached))return null;
 if(!mem.shown.includes(attached))mem.shown.push(attached);
 const possible=NPC9_PROFILES[c.id].confrontations||[];
 for(const gate of possible){const families=new Set(gate.evidence.map(id=>byId[id]?.family).filter(Boolean));if(!gate.evidence.every(id=>STATE.found.has(id)&&mem.shown.includes(id)))continue;if(families.size<gate.min_independent_families)continue;
 if(mem.confronted.includes(gate.id))continue;if(!(npc9GatePrompt(gate.id,topics,raw)||(gate.id==='EZ_HAZARD'&&(/bhp|zgloszen|wyslal|wysyl/.test(norm(raw))||topics.includes('risk')))))continue;
 mem.confronted.push(gate.id);return {text:NPC9_CORRECTIONS[gate.id],id:gate.id,topic:NPC9_GATE_BY_ID[gate.id],source_ids:gate.evidence,corrected:true};
 }
 // Do not automatically treat unrelated evidence as admission, or reveal a secret because inventory is complete.
 return {text:NPC9_PROFILES[c.id].voice_examples.evidence_weak,source_ids:[attached],corrected:false};
}

/* NPC 9.4 — odpowiedź oparta na zadaniu rozmownym, dowodach i pamięci znaczeniowej.
 * Zdania z knowledge profili nie są automatycznie wypowiadane: obejmują także tajną wiedzę.
 * Każdy element odpowiedzi pochodzi z jawnych, ręcznie wybranych faktów danej postaci. */
const NPC94_META={version:'9.4',policy:'grounded',source:'voice_examples + NPC9_CUSTOM + public event facts'};
const NPC94_PUBLIC_EVENTS={
 MAREK:['E01','E02','E06','E09','E18','E19'],
 TOMASZ:['E02','E09','E10','E18','E19'],
 JANUSZ:['E03','E04','E06','E13','E19'],
 ELZBIETA:['E05','E07','E18','E19'],
 KAMIL:['E03','E04','E11','E13','E14'],
 MAGDALENA:['E18']
};
const NPC94_FACTS={
 MAREK:{location:'Podczas tej zmiany kierowałem pracą zajezdni, głównie z biura. Wychodziłem też do spraw służbowych.',alibi:'Nadzorowałem nocną zmianę. Byłem dostępny z biura, ale nie twierdzę, że przebywałem w nim bez przerwy.',witness:'Nie wskażę osoby, która obserwowała mnie przez całą noc. Połączenia służbowe potwierdzą kontakt, a rejestr wejść tylko część przemieszczania.',time:'Nie podam jednej minuty dla całego dyżuru. Godziny połączeń i wejść można porównać, lecz nie są ciągłą obserwacją.',victim:'O śmierci Leny dowiedziałem się po alarmie. Nie widziałem ataku ani momentu odnalezienia jej.',last:'Nie pamiętam ostatniej minuty, w której sam widziałem Lenę. Nie będę podawał godziny z grafiku jako własnej obserwacji.',emotion:'To wydarzyło się na zmianie, za którą odpowiadałem. Myśl o tym wraca, także wtedy, kiedy próbuję skupić się na dokumentach.',verify:'Proszę porównać surowe wejścia i połączenia z ostatecznym grafikiem. Sam zatwierdzony grafik nie potwierdzi mojej lokalizacji.',responsibility:'Odpowiadam za organizację służby i rzetelność jej rozliczenia. Nie mam podstaw twierdzić, że widziałem samo przestępstwo.',source:'Organizację zmiany znam z własnej pracy. O znalezieniu Leny dowiedziałem się po alarmie, nie z osobistej obserwacji.',lastvictim:'Nie wiem, którędy Lena poszła po ostatnim spotkaniu. Grafik pokazuje zadania, a nie jej rzeczywistą trasę.'},
 TOMASZ:{location:'Pracowałem w dyspozytorni. Zmieniłem dyspozycję powrotu wagonu, a później byłem przy stanowisku trzecim, gdzie znalazłem Lenę.',alibi:'Byłem na służbie jako dyspozytor. O 02:02 zgłosiłem alarm. To nie znaczy, że mam świadka dla każdej minuty przed alarmem.',witness:'Meldunki i rejestr łączności radiowej potwierdzą, kiedy pracowałem przy konsoli. Nie mam człowieka, który potwierdzi każdą minutę mojej obecności.',time:'Alarm zgłosiłem o 02:02. Przebieg wcześniejszej godziny trzeba odtworzyć z dyspozycji i rejestru łączności.',victim:'Znalazłem Lenę przy stanowisku numer trzy i wezwałem pomoc. Nie widziałem, jak doszło do obrażeń.',last:'Nie potrafię powiedzieć, kiedy ostatnio widziałem ją żywą. O 02:02 zgłosiłem znalezienie jej, a nie ostatnią rozmowę.',emotion:'Zobaczyłem ją tam. Ten obraz wraca, nawet gdy próbuję myśleć tylko o meldunku.',verify:'Rejestr łączności radiowej i zmiany dyspozycji pokażą czas moich czynności. Nie dowiodą, że ani razu nie odszedłem od konsoli.',responsibility:'Odpowiadałem za decyzje ruchowe i przekierowanie TW-217. Nie jestem w stanie zaświadczyć o każdym zdarzeniu na placu.',source:'Powrót wagonu znam z rejestru ruchu i własnej dyspozycji. Lenę przy stanowisku widziałem sam.',lastvictim:'Wiem, że wagon wrócił, ale nie obserwowałem późniejszej drogi Leny. Znalazłem ją dopiero przy stanowisku trzecim.'},
 JANUSZ:{location:'Pracowałem przy zleceniach i kolejce napraw w warsztacie. Chodziłem też do narzędzi i wagonów, nie siedziałem cały czas w jednym miejscu.',alibi:'Miałem nocne obowiązki warsztatowe. Zlecenia pokazują moją pracę, ale nie rejestrują każdego kroku.',witness:'Ludzie z warsztatu widywali mnie przy pracy, jednak nie podam jednego świadka na całą noc. Sprawdźmy konkretne zlecenie i godzinę.',time:'Nie mam rozpisanej każdej minuty. Karty zleceń wyznaczają czynności, nie czas wszystkich moich przejść.',victim:'O tym, że Lena zginęła, dowiedziałem się po alarmie. Wcześniej kłóciliśmy się czasem o stan wagonu.',last:'Nie pamiętam ostatniej chwili, w której ją widziałem. Wiem, że wracała do spraw usterek.',emotion:'Bywałem na nią zły za kolejne zgłoszenia. Teraz to inaczej brzmi, kiedy wiem, że już nie wróci.',verify:'Proszę zestawić surowe zlecenia i podpisy z później uzupełnionymi formularzami. Z nich wyjdzie, co robiliśmy, nie każdy krok człowieka.',responsibility:'Odpowiadałem za obieg kart napraw. Niepełny papier trzeba wyjaśnić, ale nie wolno go mylić z dowodem napaści.',source:'O kartach napraw mówię z pracy w warsztacie. O śmierci dowiedziałem się po alarmie.',lastvictim:'Nie widziałem, dokąd Lena poszła po naszych rozmowach o wagonie.'},
 ELZBIETA:{location:'Zajmowałam się zgłoszeniami BHP i rejestrem zagrożeń. Nie prowadziłam obserwacji placu przez całą noc.',alibi:'Wykonywałam obowiązki związane z BHP. Potrafię potwierdzić rozmowę z Leną o 21:47, ale nie całą późniejszą noc.',witness:'Naszą rozmowę o 21:47 mogą potwierdzać wpisy dotyczące zgłoszenia. Nie mam świadka, który obserwował mnie bez przerwy później.',time:'Z Leną rozmawiałam o 21:47. Późniejszej chronologii nie odtworzę dokładnie z pamięci.',victim:'Lena mówiła mi o ryzyku związanym z TW-217. O jej śmierci usłyszałam dopiero po alarmie.',last:'Ostatnią pewną rozmowę z nią pamiętam z 21:47. Nie wiem, czy ktoś widział ją później.',emotion:'Wracam do naszej rozmowy. Zastanawiam się, czy zrobiłam wszystko, żeby jej zgłoszenie nie utknęło.',verify:'Trzeba sprawdzić szkic BHP, bramkę wysyłkową i potwierdzenie odbioru. Sam szkic nie dowodzi wysłania.',responsibility:'Mogłam dokładniej dopilnować obiegu zgłoszenia. To moja odpowiedzialność proceduralna, nie wiedza o zabójcy.',source:'Rozmowę o 21:47 pamiętam sama. Status zgłoszenia wymaga sprawdzenia historii systemu.',lastvictim:'Nie widziałam, dokąd poszła po naszej rozmowie o 21:47.'},
 KAMIL:{location:'Zajmowałem się diagnostyką TW-217. Pracowałem przy stanowisku i czasami od niego odchodziłem.',alibi:'Tej nocy prowadziłem diagnostykę. Zapisy sesji pokażą jej przebieg, nie moje położenie w każdej sekundzie.',witness:'Inni technicy mogli widzieć mnie przy diagnostyce, ale log sam nie jest świadkiem mojej obecności. Nie podam zmyślonego nazwiska.',time:'Zlecenie diagnostyczne wystawiłem o 19:46. Autoryzowany test uruchomiłem o 01:06; szczegóły potwierdza dziennik sesji.',victim:'Z Leną dyskutowaliśmy o odczytach wagonu. O tym, co wydarzyło się potem, dowiedziałem się po fakcie.',last:'Nie podam ostatniej minuty, w której ją widziałem. Rozmawialiśmy o błędach, lecz nie obserwowałem jej trasy.',emotion:'Wracam myślami do naszych rozmów w warsztacie. Ciężko mówić o Lenie, wiedząc, że już nie wróci.',verify:'Sprawdź numer sesji, autoryzację testu i surowe logi. Retransmisje nie są nowymi czynnościami.',responsibility:'Odpowiadam za diagnostykę. Jeśli karta została użyta gdzie indziej, trzeba oddzielić zapis czytnika od mojej pracy.',source:'Własną diagnostykę znam z pracy i zapisów. O zdarzeniu przy stanowisku nie mam osobistej obserwacji.',lastvictim:'Nie śledziłem, którędy później chodziła Lena. Moje logi pokazują stan wagonu, nie jej trasę.'},
 MAGDALENA:{location:'Prowadziłam audyt dokumentacji odbiorowej. Rejestr wskazuje aktywność sesji, ale nie służy do ustalania fizycznej obecności człowieka.',alibi:'Według rejestru sesja audytowa była aktywna od 01:30 do 02:00. Nie twierdzę, że zapis sesji samodzielnie potwierdza moją obecność przy komputerze przez cały czas.',witness:'Mogę wskazać rejestr sesji, ale nie jest on niezależnym świadkiem mojej fizycznej obecności. Nie wskażę osoby bez podstaw.',time:'Sesja audytowa trwała według systemu od 01:30 do 02:00. To nie jest pomiar moich ruchów.',victim:'Lena kwestionowała zapisy odbiorowe. Nie posiadam osobistej obserwacji momentu jej śmierci.',last:'Nie mam własnej obserwacji pozwalającej ustalić ostatni moment, w którym widziałam Lenę.',emotion:'Śmierć Leny była tragedią. Wolę wypowiadać się o tym ostrożnie, nie zamiast odpowiedzi na konkretne pytania.',verify:'Zestawienie historii sesji, czytników i skorygowanego CCTV pozwala sprawdzić ograniczenia rejestru. Sama sesja nie dowodzi położenia.',responsibility:'Odpowiadałam za audyt dokumentacji. Proszę wskazać konkretny dokument; nie będę utożsamiać błędu papierowego z przemocą.',source:'Opieram się na dokumentacji odbiorowej i zapisach sesji. Nie mam osobistej obserwacji ataku.',lastvictim:'Nie mogę z własnej obserwacji odtworzyć ostatniej trasy Leny.'}
};
function npc94Ensure(mem){if(!Array.isArray(mem.semantic))mem.semantic=[];if(!mem.lastFocus)mem.lastFocus=null;if(!mem.lastReferent)mem.lastReferent=null;}
function npc94Text(q){return norm(q);}
// Rola pytania: kto? gdzie? jakie źródło? jakie przeżycie?
// Operuje na rdzeniach po usunięciu fleksyjnych końcówek; nie uczy się na odpowiedziach gracza.
function npc94SemanticSignals(q){
 const w=norm(q).split(' ').filter(Boolean),has=(...roots)=>roots.some(root=>w.some(t=>t.startsWith(root)));
 let scored=[];const offer=(topic,focus,priority)=>scored.push({topic,focus,priority});
 const who=has('kto','ktos','ktory','czyja','czyje','czlowiek','osoba'),
   proof=has('potwierdz','poswiadcz','zareczy','reczy','poprz','swiad','udowodni','zweryfik','ręcz'),
   personal=has('zobacz','widzia','zyw','czlowiek','swiad','naocz'),
   where=has('gdzie','miejs','pobyt','przebyw','siedzia','kreci','nosilo','spedz'),
   when=has('kiedy','godzin','pora','minut','czas','od ktorej'),
   work=has('pracow','robil','robia','zajmow','czynnos','sluzb','dyzur','zmian'),
   document=has('dokument','protokol','rejestr','zapis','wydruk','papier','log','system','grafik','karta'),
   emotion=has('czuj','zal','tesk','rusz','bol','szok','wspomn','wyrzut','wraca','powiek','zasn','pamiec','wrazen','emocj','ciezk','trudno'),
   len=has('len','ona','nia','niej','motornic','jej','smierc','traged','zaboj'),
   source=has('skad','zrod','dowiedz','powtarz','slysz','autops','widzial','uslysz'),
   challenge=has('zabil','zaboj','zamord','sprawc','winny','smierc','napas');
 if(proof&&who&&(personal||!document))offer('witness','independent_person',126);
 if(proof&&document&&(!who||!personal))offer('verification','documentary_corroboration',124);
 if(proof&&!who&&!document)offer('verification','how_to_verify',111);
 if(has('kto')&&has('odpowiedzial','wina','smierc','zaboj'))offer('culprit','identity',126);
 if(has('gdyby','powod','korzysc','motyw','ucisz','zalezalo','pozby','zysk')&&len)offer('motive','possible_motive',122);
 if(emotion&&len&&has('po','tamtej','nie','wraca','powiek','zasn','od','zalu','uczuc','odczuc'))offer('feeling','grief',121);
 if(emotion&&has('pod','powiek','przed','oczy','widok')&&has('tamtej','nocy','stanow','wtedy'))offer('feeling','traumatic_memory',128);
 if(has('ostatni','ostatnie','ostatnio')&&has('widzial','spotkal','kontakt','rozmaw','zyw')&&len)offer('last_seen','last_meeting',129);
 if(where&&has('dokad','poszl','ona','lena')&&len&&!has('ty','pana','pani'))offer('victim_last','route',110);
 if(where&&work)offer('alibi','location',114);
 else if(where&&has('byl','bylas','byles','bylo','tej','tamtej'))offer('alibi','location',108);
 if(has('co')&&has('robil','zajmow','porab','dzialo')&&has('noc','alarmi','kursem','wtedy','nim','zanim','zdarzen'))offer('alibi','activity',120);
 if(when&&has('diagnostyk','test','alarm','meldun','zglosz')&&!has('jak','sprawdz','udowodn'))offer('time','event_time',115);
 if(when&&has('byl','pracow','dyzur','zmian')&&!has('ktos','kto','swiad'))offer('time','shift_hours',106);
 if(source&&has('wiesz','wiedz','pewno','uslysz','odkry')&&!has('co','powiedziala'))offer('source','direct_or_reported',122);
 if(has('skad')&&has('pewn','to')&&!where)offer('source','direct_or_reported',116);
 if(has('widzia')&&has('sam','osobisc','wlasny')&&!who)offer('source','direct_or_reported',111);
 if(has('kloc','konflikt','stosunk','atmosfer','dogady','ukladal','zawadz','nie lubil','zal do','spor','pracowala z')&&len)offer('relations','relationship',121);
 if(has('rozmaw','powiedzial','gadali','kontaktow')&&len&&!has('ostatni','godzin','kiedy'))offer('conversation','subject_of_talk',110);
 if(has('czytnik','identyfikator','kart','t17')&&has('uzyw','odbil','nazwisk','trzymal','osoba'))offer('card','owner_vs_user',121);
 if(has('droga','przejsc','drzwi','korytarz','dojsc','tras')&&has('zajezd','audyt','stanow','czytnik','karta'))offer('access','alternative_route',119);
 if(has('zleceni','zadani','diagnostyk')&&has('kto','kaza','polec','wyda'))offer('work','work_origin',113);
 if(has('zglosz','rejestr','protokol')&&has('skad','wpisal','kto','zarejestr','wyslal'))offer('documents','provenance',113);
 if(has('poprzedn','stary','wczesniejsz','pierwotn','przepis','wersj','histori')&&document)offer('archive','document_version',125);
 if(has('wyjsc','przerw','odszed','odchodz')&&has('pracy','konsol','stanow','dyzur'))offer('break','absence',116);
 if(has('zrob','mogl','moglas','odpowiedzial','zaniedb','ochron','bezpiecz')&&has('wczesniej','zeby','wszystko','pracowni','len'))offer('accountability','prevention',114);
 if(has('czy','mogl','mogla','mozliwe')&&has('cudz','karty','identyfik','podrzuc','wymien'))offer('hypothesis','possibility',105);
 scored.sort((a,b)=>b.priority-a.priority);return scored;
}
function npc94Tags(part,mem){
 const s=npc94Text(part),has=re=>re.test(s),tags=[];
 const add=(topic,focus,priority)=>tags.push({topic,focus,priority});
 if(has(/\b(?:ktory zapis|jaki zapis|jakie wpisy)\b.*\b(?:potwierdz|dyzur|obecnosc)|\b(?:jak potwierdzisz|jak potwierdzic|czym potwierdzisz|a jak potwierdzic)\b/))add('verification','record_verification',115);
 if(has(/\b(?:osobisty zal do|miales zal do|mialas zal do|gniew do|uraza do)\b/))add('relations','resentment',116);
 if(has(/\b(?:zrobiles wszystko|zrobilas wszystko|mogles zrobic wiecej|moglas zrobic wiecej|byli bezpieczni|byla bezpieczna)\b/))add('accountability','prevention',116);
 if(has(/\b(?:stary|wczesniejszy|pierwotny)\b.*\b(?:grafik|protokol|dokument)|\b(?:przed zmianami|przed korekta)\b/))add('archive','version_difference',114);
 if(has(/\b(?:wraca ci przed oczy|wraca do ciebie obraz|ten widok wraca|widok z trzeciego stanowiska|masz to przed oczami)\b/))add('feeling','traumatic_memory',116);
 if(has(/\b(?:kto mogl chciec|komu zalezalo|kto chcial)\b.*\b(?:uciszyc|zastraszyc|pozbyc|zyskac)\b/))add('motive','possible_motive',113);
 if(has(/\b(?:ostatnie spotkanie|ostatni kontakt|po raz ostatni mialas z nia kontakt|po raz ostatni miales z nia kontakt)\b/))add('last_seen','last_meeting',114);
 if(has(/\b(?:miedzy wami atmosfer|wasza atmosfera|jak wygladala wasza atmosfera)\b/))add('relations','relationship',111);
 if(has(/\b(?:wpis kart\w*|wpis z kart\w*|kart\w* z twoim nazwiskiem|odbito twoj identyfikator)\b/))add('card','owner_vs_user',113);
 if(has(/\b(?:skad wiedziales|skad wiedzialas|w jaki sposob dowiedziales)\b/))add('source','direct_or_reported',112);
 if(has(/\b(?:kiedy ruszyl\w* diagnostyk\w*|kiedy zaczal sie test|o ktorej uruchomiles diagnostyke)\b/))add('time','test_start',114);
 if(has(/\b(?:czy rozmawial\w* z nia o|czy gadal\w* z nia o|o czym z nia rozmawial\w*)\b/))add('conversation','subject_of_talk',112);
 if(has(/\b(?:kto kazal|kto polecil|kto zlecil)\b.*\b(?:zleceni\w*|diagnostyk\w*|test)\b/))add('work','order_origin',114);
 if(has(/\b(?:kto|ktos|fachur\w*|swiad\w*)\b.*\b(?:zaswiadcz\w*|reczyc|potwierdz\w*|rozpoznac|poprzec)\b|\b(?:na wlasne oczy|bez patrzenia na logi)\b.*\b(?:swiad\w*|czlowiek|osob\w*)\b/))add('witness','independent_person',123);
 if(has(/\b(?:gdzie cie nosilo|gdzie pan chodzil|gdzie byles|dokad chodziles)\b/))add('alibi','location',122);
 if(has(/\b(?:na co ci zeszla noc|co porabial\w*|jak wygladal twoj czas)\b/))add('alibi','activity',123);
 if(has(/\b(?:kiedy|o ktorej|godzina|godzine)\b.*\b(?:jej smierci|zgonu|smierci leny|doszlo do zbrodni)\b/))add('what_happened','death_time',126);
 if(has(/\b(?:po raz ostatni|kiedy pozniej)\b.*\b(?:widzial\w*|rozmawial\w*|spotkal\w*|kontakt)\b.*\b(?:lena|leny|lenie|nia)\b/))add('last_seen','last_meeting',123);
 if(has(/\b(?:co powiedzial\w* (?:jej|lenie)|co rozmawial\w*|z czym do ciebie przyszla|co ona ci mowila)\b/))add('conversation','conversation_content',123);
 if(has(/\b(?:czemu|jak|dlaczego)\b.*\b(?:opis|wersja|godzina|czas|rejestr|zapis)\b.*\b(?:kloci|zgadz|rozni|przestaw|potwierdz|sprawdz)\b/))add('verification','contradiction_check',121);
 if(has(/\b(?:kto mialby|kto mogl|kto moglby|kto chcialby)\b.*\b(?:powod|motyw|zalezec|skorzysta|zyskac|uciszyc)\b/))add('motive','possible_motive',128);
 if(has(/\b(?:widziales|widzialas)\b.*\b(?:ostatnie chwile|momente|sam\w* atak|sama napa\w*)\b|\b(?:tylko skutki|skutki napasci)\b/))add('source','direct_or_reported',128);
 if(has(/\b(?:wczesniej|najpierw)\b.*\b(?:zmienil\w*|wydal\w*)\b.*\b(?:dyspozycj|polecen)\b.*\b(?:nagran|radio|zapis)|\b(?:fragment nagrania zniknal)\b/))add('documents','record_sequence',126);
 if(has(/\b(?:czy\b.*\bprzenies\w*|czy\b.*\bretransmit\w*)\b.*\b(?:udowodnic|wykazac|sprawdzic|potwierdzic)\b|\b(?:da sie wykazac)\b/))add('verification','technical_check',127);
 if(has(/\b(?:czy to twoj opis|czy twoje zeznanie|czy na pewno|czy taki zapis)\b.*\b(?:sprzeczn\w*|kloci\w*|zgadz\w*)\b/))add('verification','contradiction_check',120);
 if(has(/\b(?:osobistym wspomnieniem|z wlasnej pamieci|na ile pamietasz)\b.*\b(?:godzin\w*|pora|kiedy|czas)\b/))add('source','direct_or_reported',121);
 if(has(/\b(?:stary formularz|stara wersja|stary projekt|niewyslan\w* projekt|niewyslan\w* szkic|sprzed korekty)\b/))add('archive','version_history',121);
 if(has(/\b(?:chcialem|chcialabym|chce|musze)\b.*\bprzeprosic|\bprzeprasz\w*\b/))add('social','apology',112);
 if(has(/\b(?:jaka|czyja)\w* relacj\w*\b.*\b(?:sprawdz|potwierdz|pracow|obecnosc)|\b(?:jaki|ktory)\w* swiad\w*\b.*\b(?:godzin|zajezdni|lokalizacj)|\b(?:wskaz swiadka)\b/))add('witness','independent_person',108);
 if(has(/\b(?:wiadomosc z wlasnych oczu|czyje slowa powtarzasz|ze slyszenia|z pierwszej reki|wlasnymi oczami|od kogo wiesz)\b/))add('source','direct_or_reported',109);
 if(has(/\b(?:inna droga|alternatywn\w* tras\w*|przez czytnik|droga do stanowiska|od pokoju audytu do|ile trzeba przejsc)\b/))add('access','alternative_route',109);
 if(has(/\b(?:od tamtej nocy|po tym co spotkalo|do rownowagi|wspomnieni\w*.*\bzyla|ostatnia pewna chwila gdy zyla)\b/)&&has(/\b(?:smierci|leny|lena|ona|niej|tragedia|to)\b/))add('feeling','aftermath',104);
 if(has(/\b(?:kiedy masz ostatnie|ostatnie pewne wspomnienie)\b.*\b(?:len\w*|zyla|zywa)\b/))add('last_seen','last_meeting',112);
 if(has(/\b(?:odebranie jej zycia|komu przypisac smierc|kto odpowiada za|kto mogl zabic)\b/))add('culprit','identity',106);
 if(has(/\b(?:jaka korzysc|jaki powod|co zyskal|dlaczego ktos chcial|po co komus)\b.*\b(?:pozby|leny|len|smierc|zabic)\b/))add('motive','possible_motive',106);
 if(has(/\b(?:o ktorej|jaki czas|dokladna pora|pora zgloszenia|o jakiej porze)\b.*\b(?:alarm\w*|zgloszen\w*|sygnalizacj\w*)\b/))add('time','alarm_time',109);
 if(has(/\b(?:pierwotn\w*|poprzedni\w* wersj\w*|stary egzemplarz|sprzed naniesienia|historia zmian|przed korekta)\b/))add('archive','previous_version',105);
 if(has(/\b(?:ostrzegawcz\w* sygnal\w*|alarmowal\w*|zignorow\w*|zaniedban\w* ryzyk\w*)\b/))add('risk','ignored_warning',108);
 if(has(/\b(?:w poblizu|przewijal\w*|kogo widziales w warsztacie|kto tam byl w warsztacie)\b/))add('observations','nearby_people',106);
 if(has(/\b(?:padlo miedzy wami|co wtedy powiedziano|co sobie powiedzieliscie|co powiedzial\w* tuz przed)\b/))add('conversation','words',105);
 if(has(/\b(?:mieliscie.*ostra wymian|klocili\w*|byliscie w sporze)\b/))add('relations','conflict',108);
 if(has(/\b(?:czy fakt|czy to|czy samo)\b.*\b(?:klamal|sklamal|dowodzi|oznacza)\b.*\b(?:zabil|zabojstwo|zabojca|winny)\b/))add('inference','not_proof',110);
 if(has(/\b(?:co sie u ciebie dzialo|gdzie spedzon|spedzona zostala|jak wygladaly twoje godziny)\b/))add('alibi','activity',103);
 if(has(/\b(?:jak wygladaly twoje godziny|w jakich godzinach miales dyzur|od ktorej do ktorej pracowales)\b/))add('time','shift_hours',108);
 if(has(/\b(?:w ktorym miejscu|gdzie spedzon)\b/))add('alibi','location',110);
 if(has(/\b(?:przeprasz|wybacz|sorki|sorry|nie bylo fair|cofam oskarzen)\b/))add('social','apology',110);
 if(has(/\b(?:kto|ktos|osoba|czlowiek)\b.*\b(?:widzial|potwierdz|poswiadcz|reczy|przysiegn|niezalez|swiad|poprze|umiejscow|zaręczy)|\b(?:masz|jest)\b.*\b(?:swiadk|czlowiek.*potwierdz)|\b(?:kto za (?:toba|ciebie|panem|pania) reczy)\b/))add('witness','independent_person',99);
 if(has(/\b(?:gdzie|dokad|ktoredy)\b.*\b(?:lena|leny|ona|poszla|zmierzala|przeszla|skierowala)|\b(?:ostatnia droga|trasa leny)\b/))add('victim_last','route',96);
 if(has(/\b(?:kiedy|o ktorej|ostatni raz|po raz ostatni)\b.*\b(?:widziales|widzialas|widziano|spotkal|rozmawial)\b.*\b(?:len|ja|nia)\w*|\b(?:len|ja|nia)\w*.*\b(?:ostatni raz|po raz ostatni)\b/))add('last_seen','last_meeting',96);
 if(has(/\b(?:czuj|czules|czulas|przezy|boli|teskn|wspomni|w szoku|szok|zaluje|wyrzut|przykro|ciężko|ciezko|trudno|rusz|traum|sercu|sni ci sie|masz ja przed oczami|od tamtej nocy.*(?:mowic|gadc|rozmawiac)|myslisz o niej|wspomnienie)\w*\b/)&&has(/\b(?:len|niej|jej|smierc|traged|zabojstw|noc|tym|to|ci|pani|pan)\w*\b/))add('feeling','grief',98);
 if(has(/\b(?:wczesniej|przedtem|poprzednio|pierwotnie)\b.*\b(?:powiedzia|zeznal|twierdzi|mowil)|\b(?:przypomnij|przypomniec|co mowiles|co mowilas|co zeznal)\b/))add('recall','previous_testimony',96);
 if(has(/\b(?:z jakiego zrodla|skad (?:to|o tym|wiesz)|z autopsji|na wlasne oczy|osobiscie widzi|widziales sam|widzialas sama|czy to plotka|na jakiej podstawie|czy byles swiadkiem|czy bylas swiadkiem|co widziales sam|co widzialas sama)\b/))add('source','direct_or_reported',92);
 if(has(/\b(?:kt[oa] (?:ja |go |ją )?zabil|kto.*(?:zamordowal|zabil|ukatrupil|zatlukl)|kto jest sprawc|kto za tym stoi|kto odpowiada za smierc|kto ja skrzywdzil|czy (?:ty|pan|pani).*\b(?:zabil|zamordowal))\b/))add('culprit','identity',98);
 if(has(/\b(?:kto|jaka osoba)\b.*\b(?:mogl|mogla)\b.*\b(?:zabic|zabojstw|atak)|\b(?:nazwisko sprawcy|wskaz zabojce)\b/))add('culprit','identity',97);
 if(has(/\b(?:co (?:wiesz|wiadomo|ustalono|stalo sie)|jak wyglad|co zaszlo|co sie wydarzylo|stan sprawy|jakie sa ustalenia|co mamy pewnego|o co tu chodzi|co wiemy)\b.*\b(?:spraw|traged|len|zaboj|tej nocy|smierc)|\b(?:co wiesz o sprawie)\b/))add('what_happened','case_summary',93);
 if(has(/\b(?:wideokonferencj\w*|sesj\w* audyt\w*|polaczen\w* online|bylas przy komputerze)\b/))add('alibi','alibi_proof',97);
 if(has(/\b(?:jakie|masz|twoje|pana|pani|czy masz|czy jest)\b.{0,30}\balibi\b|\b(?:czym potwierdzisz pobyt|udowodnisz ze byles)\b/))add('alibi','alibi_proof',96);
 if(has(/\b(?:gdzie|w jakim miejscu|w ktorym miejscu|skad)\b.*\b(?:byl|byles|bylas|przebywal|siedziales|siedzialas|stales|stalas|spedzil|znajdowal)|\b(?:swoja wersja.*gdzie|pobyt.*podczas|miejsc[ae] pobytu)\b/))add('alibi','location',96);
 if(has(/\b(?:co robil|co robilas|co robiles|co porabial|co robilas kiedy|co dzialo sie u ciebie|zajmowal[a-z]* sie)\b.*\b(?:wtedy|tej nocy|kiedy|podczas|przed alarm|po kursie|w tym czasie|gdy|jak do tego doszlo)|\b(?:gdzie byles i co robiles)\b/))add('alibi','activity',93);
 if(has(/\b(?:kiedy|o ktorej)\b.*\b(?:lena|leny|ona)\b.*\b(?:zginela|umarl|zabito)|\b(?:kiedy|o ktorej)\b.*\b(?:zginela lena|doszlo do zabojstwa)\b/))add('what_happened','death_time',101);
 if(has(/\b(?:o ktorej|kiedy dokladnie|ile czasu|jak dlugo|ktora godzina|jaka godzina|co do minuty)\b/))add('time','precise',90);
 if(has(/\b(?:godzin|przedzial czasu|od ktorej do ktorej)\w*\b.*\b(?:dyzur|noc|zmiana|byl|przebywal|pracy)\b/))add('time','shift_hours',87);
 if(has(/\b(?:kto.*(?:wpisal|podpisal|zatwierdzil|skorygowal|zmienil)\b.*\b(?:dokument|raport|grafik|protokol)|\b(?:zrodlo (?:wpisu|logu)|kto.*wprowadzal))\b/))add('documents','provenance',95);
 if(has(/\b(?:jak (?:sprawdzic|zweryfikowac|potwierdzic|udowodnic)|czym to potwierdz|jak to mozna wykazac|co to potwierdz|czy da sie sprawdzic)\b/))add('verification','how_to_verify',94);
 if(has(/\b(?:skad masz pewnosc|czy jestes pewien|czy jestes pewna|czy to na pewno|na ile pewn)\b/))add('verification','degree_of_certainty',86);
 if(has(/\b(?:jakie (?:masz|miales|mialas) (?:obowiazki|zadania)|na czym polega(?:la)? (?:twoja|pana|pani) praca|jaka robote|co nalezalo do twoich|co robisz na stanowisku|czym sie zajmujesz|z czego skladaja sie twoje normalne zadania)\b/))add('work','duties',96);
 if(has(/\b(?:jak (?:sie|wam|ci|pani|panu) układa|jak wygladala wspolpraca|na pienku|zgrzyt|zgodz|konflikt|klotn|kłóc|nie lubil|nie lubilas|stosunk|relacj|dogadywal)\w*\b/))add('relations','relationship',92);
 if(has(/\b(?:czy (?:mogles|moglas|mogl|mogla)\b.*\b(?:zapobiec|zrobic|zatrzymac|powstrzymac)|czy ktos zaniedbal|czy czujesz sie odpowiedzial|czy odpowiadasz za)\b/))add('accountability','responsibility',96);
 if(has(/\b(?:co powiedziala lena|co lena powiedziala|o czym rozmawial|co wtedy powiedzial|jakie slowa|o czym gadaliscie)\b/))add('conversation','subject_of_talk',95);
 if(has(/\b(?:czy (?:pani|pan|ty) (?:widziales|widzialas|widzial)\b.*\b(?:len|ja|nia)|kiedy ostatnio sie spotkal)\b/))add('last_seen','last_meeting',88);
 if(has(/\b(?:czy widzial|co zauwazyl|co (?:pan|pani|ty) (?:widział|widzial|zobaczyl|dostrzegl)\b|jak wygladalo to z twojej perspektywy)\b/))add('observations','eyewitness',86);
 if(has(/\b(?:karta|identyfikator|t\s*17|czytnik)\b/))add('card','record_vs_person',77);
 if(has(/\b(?:kamera|monitoring|cctv|nagranie)\b/))add('cctv','camera_limits',77);
 if(has(/\b(?:sms|wiadomosc|korespondencj|mail|telefon)\b/))add('messages','message_context',74);
 if(has(/\b(?:smar|włok|wlok|slad|probka|obrazen|laborator|odciski)\b/))add('laboratory','forensic_limits',76);
 if(has(/\b(?:bhp|zagrozen|usterk|bezpieczenst|alarm tcms)\b/))add('risk','safety',75);
 if(has(/\b(?:jak przebiegala ta noc|co wiesz o nocy|tej nocy dzialo sie)\b/))add('what_happened','case_summary',80);
 const prior=tags.slice().sort((a,b)=>b.priority-a.priority)[0];
 const signals=npc94SemanticSignals(part);
 tags.push(...signals.filter(x=>!prior||prior.priority<88||x.topic===prior.topic));
 tags.sort((a,b)=>b.priority-a.priority);
 return tags;
}
function npc94QuestionKind(s){
 if(/\b(?:kto|jaki czlowiek|czy ktos)\b/.test(s))return 'person';
 if(/\b(?:gdzie|dokad|ktoredy|w jakim miejscu)\b/.test(s))return 'location';
 if(/\b(?:kiedy|o ktorej|jak dlugo|ile czasu)\b/.test(s))return 'time';
 if(/\b(?:dlaczego|czemu|po co)\b/.test(s))return 'reason';
 if(/\b(?:skad|na jakiej podstawie)\b/.test(s))return 'source';
 if(/\b(?:co robil|czym sie zajm|jak wyglad|opowiedz|co wiesz|co sie wydarzylo)\b/.test(s))return 'description';
 return /\bczy\b/.test(s)?'yes_no':'open';
}
/* ETAP 15: pierwszeństwo jednoznacznego sensu pytania nad podobieństwem słów.
   Reguły używają tematów już istniejących w kanonie NPC; nie dodają faktów. */
function npc15PriorityIntent(s){
 const cues=[
  [/\b(?:co (?:pan|pani) wtedy poczul\w*|co wtedy poczul\w*|jak sie czul\w* gdy|co wtedy czul\w*)\b/,'feeling','feeling'],
  [/\b(?:gdzie miala sie udac przed smiercia|gdzie planowala pojsc|dokad miala pojsc)\b/,'victim_last','victim_last'],
  [/\b(?:kto mogl wyniesc akta|w ktorym segregatorze sa|gdzie leza te papiery)\b/,'archive','archive'],
  [/\b(?:niewyrazne wspomnienia|niepewna pamiec)\b.*\b(?:podejrzan\w*|klamstw\w*|oskarz\w*)\b/,'inference','inference'],
  [/\b(?:czyja to byla robota|czyja byla robota)\b.*\bzabojstw\w*|\bkto (?:za tym stoi|odpowiada za zabojstwo)\b/,'culprit','identity'],
  [/\b(?:co bys zmienil po tym zdarzeniu|czy mialas wplyw na bezpieczenstwo|czy miales wplyw na bezpieczenstwo)\b/,'accountability','accountability'],
  [/\b(?:co slyszales od niej|co slyszalas od niej|co ci powiedziala tuz przed|co ona ci powiedziala tuz przed)\b/,'conversation','conversation'],
  [/\bjak dzialaly przepustki\b/,'access','access'],
  [/\bmiedzy dwoma obchodami\b/,'break','break'],
  [/\b(?:co sie stalo z lena|co sie z lena stalo|co sie stalo lenie|co sie z nia stalo|co wydarzylo sie lenie)\b/,'what_happened','what_happened'],
  [/\b(?:gdzie (?:byl|byla|byles|bylas) (?:pan|pani)|gdzie (?:pan|pani) (?:byl|byla))\b.*\b(?:w chwili|znalezli|alarm|len)/,'alibi','location'],
  [/\b(?:gdzie przechowywano akta|gdzie sie podzial rejestr|gdzie lezy dokument|gdzie sa akta|gdzie jest oryginal|archiwum)\b/,'archive','archive'],
  [/\b(?:sprawdzic zrodlo|zrodlo tej informacji|skad pochodza te informacje|na jakiej podstawie to wiesz)\b/,'source','source'],
  [/\b(?:zacytowac|powtorzyc)\b.*\b(?:poprzednia odpowiedz|wczesniejsza odpowiedz|swoje slowa|co przed chwila)|\bco mi przed chwila powiedziales\b/,'recall','recall'],
  [/\b(?:jak sie (?:pan|pani)? ?(?:czul|czula|czules|czulas)|pierwszy odruch)\b.*\b(?:uslysz|len|wiadomosc|traged)|\bjak przyjales te wiadomosc\b/,'feeling','feeling'],
  [/\b(?:zalujesz|zaluje pani|zaluje pan)\b.*\b(?:decyzj\w*|zaniedba\w*)|\b(?:czujesz sie|czuje sie|poczuwasz sie)\b.*\b(?:odpowiedzialn\w*|winn\w*)\b/,'accountability','accountability'],
  [/\b(?:brak swiadka|nie potrafi wskazac swiadka)\b.*\b(?:klam|znaczy|dowod)|\bczy (?:brak|sama)\b.*\b(?:dowod|przesadza|wina)\b/,'inference','inference'],
  [/\b(?:kto widzial jej ostatnie kroki|ostatnie kroki leny|co zrobila lena kiedy wyszla|dokad lena poszla po|gdzie poszla lena po)\b/,'victim_last','victim_last'],
  [/\b(?:czy monitoring widzi wejscie|cudzej przepustki|bocznym wejsciem|bez karty|bez przepustki|wejsc na zaplecze|wejscie od tylu|obejsc czytnik)\b/,'access','access'],
  [/\b(?:jak odroznic pierwotny zapis|historie zmian w rejestrze|wpis w systemie zgadza sie z karta papierowa|oryginalny wpis od korekty)\b/,'documents','documents']
 ];
 for(const [pattern,topic,focus] of cues)if(pattern.test(s))return {topic,focus,kind:'open',priority:300};
 return null;
}
function npc94IntentPart(part,mem){
 const s=norm(part),priority=npc15PriorityIntent(s);
 if(priority)return {...priority,kind:npc94QuestionKind(s),part};
 const tags=npc94Tags(part,mem),base=npc9Topic(part,mem);
 // Explicit focus overrides a generic classifier (e.g. "świadek" vs "relacje").
 let chosen=tags[0]||null;
 if(!chosen&&base)chosen={topic:base,focus:base,priority:42};
 // Bare followups refer to a previous substantive topic, not to any random last quote.
 if(/^(?:a wtedy|a potem|a dalej|to jak|dlaczego tak|czemu tak|a konkretnie|a kto to potwierdzi|skad ta pewnosc|i co z tego|a kiedy|a gdzie|i kto|a jak)\b/.test(s)){
   const last=mem.lastFocus||{topic:[...mem.topics].reverse().find(x=>x!=='social'&&x!=='recall')||null};
   if(/\bkto\b.*\bpotwierdz/.test(s))chosen={topic:'witness',focus:'independent_person',priority:110};
   else if(/\bskad\b/.test(s))chosen={topic:'source',focus:'direct_or_reported',priority:110};
   else if(/\bkiedy\b/.test(s))chosen={topic:'time',focus:'precise',priority:110};
   else if(/\bgdzie\b/.test(s)&&last.topic==='alibi')chosen={topic:'alibi',focus:'location',priority:110};
   else if(last.topic)chosen={topic:last.topic,focus:'followup',priority:108};
 }
 if(!chosen)return {topic:null,focus:null,kind:npc94QuestionKind(s),part};
 return {topic:chosen.topic,focus:chosen.focus,kind:npc94QuestionKind(s),part};
}
function npc94BuildPlan(raw,mem){
 const tone=npc9Tone(raw),p=npc9Interpret(raw,mem),clauses=npc9Clauses(raw),parts=[];
 for(const clause of clauses){
   const clean=norm(clause);
   if(/^(?:nie krec|nie kombinuj|przestan klamac|do cholery|bez sciemy|sluchaj|ej|powiedz prawde|nie wciskaj mi kitu)$/.test(clean))continue;
   const focus=npc94IntentPart(clause,mem);
   if(focus.topic&&focus.topic!=='social')parts.push(focus);
 }
 if(!parts.length&&p.topics.length)parts.push({topic:p.topics[0],focus:p.topics[0],kind:'open',part:raw});
 // Deduplicate exact same question focus but retain e.g. location + witness.
 const unique=[],seen=new Set();for(const part of parts){const k=part.topic+':'+part.focus;if(!seen.has(k)){unique.push(part);seen.add(k);}}
 let act=p.act;
 const all=norm(raw);
 if(/\b(?:przeprasz\w*|przeprosic|wybacz|sorki|sorry|nie bylo fair|cofam oskarzenie)\b/.test(all))act='apology';
 else if(/\b(?:wczesniej mowil|wczesniej powiedzial|przypisales|przyznal[ea]s|twierdziles|twierdzilas)\b/.test(all))act='challenge';
 else if(/\b(?:co wczesniej powiedzial|przypomnij.*powiedzia|co zeznal)\b/.test(all))act='recall';
 if(unique.some(x=>x.topic==='conversation')&&/\b(?:co powiedzial|co mowil|co gadal|z czym do ciebie przyszla)\b/.test(all)&&!/\b(?:wczesniej|przedtem)\b/.test(all))act='question';
 return {tone,act,parts:unique.slice(0,3)};
}
function npc94SafeKnowledge(c,topic){const p=NPC9_PROFILES[c.id],allow=NPC94_PUBLIC_EVENTS[c.id]||[];
 const subset=p.knowledge.filter(x=>allow.includes(x.event));
 if(topic==='work')return subset.filter(x=>x.event==='E01'||x.event==='E04'||x.event==='E06'||x.event==='E09'||x.event==='E13');
 if(topic==='time')return subset.filter(x=>['E07','E09','E18','E04','E13'].includes(x.event));
 return [];
}
function npc94Unknown(c,raw){const s=norm(raw);if(/\b(?:dokladn|numer|haslo|kod)\w*\b/.test(s))return 'Nie potrafię podać tego szczegółu bez sprawdzenia źródła.';return {MAREK:'Tego nie wiem z własnej obserwacji. Mogę sprawdzić dokumentację zmiany.',TOMASZ:'Nie widziałem tego. Nie będę zgadywał.',JANUSZ:'Nie mam tego ustalonego. Trzeba wrócić do zapisu albo oględzin.',ELZBIETA:'Nie mogę tego potwierdzić na podstawie własnej wiedzy.',KAMIL:'Nie mam pewności. Sprawdźmy surowe dane, zanim coś stwierdzę.',MAGDALENA:'Nie dysponuję ustaleniem, które pozwalałoby mi rzetelnie odpowiedzieć.'}[c.id];}
function npc94PersonRelation(c,person){const safe=NPC9_CUSTOM[c.id].relations;if(person==='Lena Rudnicka')return safe;return person+' to osoba, którą znam ze spraw służbowych. Nie będę dopisywać jej działań ani intencji, których sam'+(c.gender==='f'?'a':'')+' nie zaobserwował'+(c.gender==='f'?'am':'em')+'.';}
function npc94OnTopic(c,part,plan,mem,person){
 const topic=part.topic,focus=part.focus, profile=NPC9_PROFILES[c.id],f=NPC94_FACTS[c.id],custom=NPC9_CUSTOM[c.id];
 const s=norm(part.part),repeated=mem.semantic.filter(x=>x.topic===topic&&x.focus===focus).length;
 let answer=null,certainty='ograniczona',source='osobiste zeznanie / zakres wiedzy';
 if(topic==='what_happened'&&focus==='death_time'){answer='Nie byłem'+(c.gender==='f'?'':'')+' świadkiem samej śmierci Leny. Dokładną minutę trzeba zweryfikować na podstawie opinii i niezależnych zapisów.'; if(c.gender==='f')answer='Nie byłam świadkiem samej śmierci Leny. Dokładną minutę trzeba zweryfikować na podstawie opinii i niezależnych zapisów.';}
 else if(topic==='alibi'){
   answer=focus==='location'?f.location:focus==='activity'?f.alibi+' '+custom.work:f.alibi;
   if(repeated>=1&&focus==='alibi_proof')answer=f.witness+' '+f.alibi;
   certainty='niezależnie niepotwierdzone';
 }
 else if(topic==='witness')answer=f.witness;
 else if(topic==='time')answer=f.time;
 else if(topic==='last_seen')answer=f.last;
 else if(topic==='victim_last')answer=f.lastvictim;
 else if(topic==='what_happened')answer=f.victim;
 else if(topic==='feeling')answer=f.emotion;
 else if(topic==='source')answer=f.source;
 else if(topic==='verification')answer=f.verify;
 else if(topic==='accountability')answer=f.responsibility;
 else if(topic==='culprit')answer=custom.culprit;
 else if(topic==='work'){answer=focus==='order_origin'&&c.id==='KAMIL'?'Zlecenie diagnostyczne zapisałem ja, o 19:46. O tym, kto wydał polecenie, rozstrzygają zapisy zlecenia, nie domysł.':custom.work;}
 else if(topic==='motive')answer=profile.voice_examples.motive;
 else if(topic==='relations'){
   if(person&&person!==c.name&&profile.relation[person])answer=npc94PersonRelation(c,person);
   else if(/\blen[ayie]\b/.test(s))answer=npc94PersonRelation(c,'Lena Rudnicka')||custom.relations;
   else answer=custom.relations;
 }
 else if(topic==='conversation')answer=custom.conversation;
 else if(topic==='lena')answer=custom.lena;
 else if(topic==='card'||topic==='access')answer=custom[topic]||custom.card;
 else if(topic==='cctv'||topic==='messages'||topic==='laboratory'||topic==='risk'||topic==='documents'||topic==='archive'||topic==='inference'||topic==='hypothesis'||topic==='break'||topic==='observations')answer=custom[topic];
 else if(topic==='social')answer=custom.social;
 else answer=npc9Phrase(c,profile,topic,mem,part.part)||null;
 if(!answer){answer=npc94Unknown(c,part.part);certainty='brak danych';source='ograniczenie wiedzy';}
 if(topic==='time'&&/\b(?:co do sekundy|dokladnie.*minut|dokladnej minuty)\b/.test(s)&&!/[0-9]/.test(answer))answer+=' Nie chcę zgadywać dokładniejszej godziny.';
 if(focus==='followup'){
   const last=[...mem.semantic].reverse().find(x=>x.topic===topic&&x.answer&&x.answer!==answer);
   if(last&&/\b(?:dlaczego|czemu)\b/.test(s))answer=topic==='alibi'?f.verify:topic==='relations'?custom.relations:topic==='feeling'?f.emotion:f.source;
 }
 return {text:answer,topic,focus,person,certainty,source};
}
function npc94Reaction(c,plan,mem){
 const n=(mem.userClaims||[]).filter(x=>npc9Tone(x.text)==='pressure').length;
 if(plan.tone==='pressure'){
   if(n===1)return {MAREK:'Proszę bez gróźb. ',TOMASZ:'Niech pan nie krzyczy. ',JANUSZ:'Proszę bez wyzwisk. ',ELZBIETA:'Proszę mówić spokojniej. ',KAMIL:'Ej, nie musisz na mnie krzyczeć. ',MAGDALENA:'Nie będę odpowiadać na groźby. '}[c.id];
   if(n>1&&n%4===0)return {MAREK:'Nie zmienię zeznań pod naciskiem. ',TOMASZ:'Już mówię, co wiem. ',JANUSZ:'Powiedziałem panu, co pamiętam. ',ELZBIETA:'Chcę udzielić dokładnej odpowiedzi. ',KAMIL:'Nie wciskaj mi swojej wersji. ',MAGDALENA:'Pozostańmy przy faktach. '}[c.id];
 }
 if(plan.tone==='empathy'&&mem.trust<65&&mem.turn<=5)return {MAREK:'Dziękuję. ',TOMASZ:'Dzięki. ',JANUSZ:'Rozumiem. ',ELZBIETA:'Dziękuję. ',KAMIL:'Dzięki. ',MAGDALENA:'Rozumiem. '}[c.id];
 return '';
}
function npc94RecallTopic(raw,mem){const explicit=npc93RecallSubject(raw,mem);return explicit||(mem.lastFocus?.topic||null);}
function npc94Recall(mem,c,raw){const topic=npc94RecallTopic(raw,mem);const sem=[...mem.semantic].reverse().find(x=>x.topic===topic&&x.answer&&x.status!=='USER_CLAIM'&&x.status!=='SOCIAL');
 if(!sem)return c.gender==='f'?'Nie wypowiadałam się wcześniej na ten temat.':'Nie wypowiadałem się wcześniej na ten temat.';
 return 'Wcześniej '+(c.gender==='f'?'powiedziałam':'powiedziałem')+': „'+sem.answer.replace(/[.!?]$/,'')+'”.';
}
function npc94Remember(mem,rec){mem.semantic.push(rec);if(mem.semantic.length>250)mem.semantic.shift();mem.lastFocus={topic:rec.topic,focus:rec.focus,person:rec.person};if(rec.person)mem.lastReferent=rec.person;}
function npc94Answer(c,raw,attached){
 const profile=NPC9_PROFILES[c.id],mem=NPC9_MEMORY[c.id];npc94Ensure(mem);
 const plan=npc94BuildPlan(raw,mem),person=npc9Person(raw)||(/\b(?:ona|on|niej|nim|jej|jego)\b/.test(norm(raw))?mem.lastReferent:null)||null;
 mem.turn++;mem.stress=Math.min(90,Math.max(9,mem.stress+(plan.tone==='pressure'?8:plan.tone==='apology'?-5:plan.tone==='empathy'?-3:-1)));
 mem.trust=Math.min(85,Math.max(6,mem.trust+(plan.tone==='pressure'?-5:plan.tone==='apology'?5:plan.tone==='empathy'?3:0)));
 const claims=mem.userClaims;claims.push({turn:mem.turn,text:raw,person,kind:plan.act,verified:false});if(claims.length>150)claims.shift();
 const topics=plan.parts.map(x=>x.topic);
 const shown=npc9Evidence(c,mem,attached,topics,raw);
 if(shown&&shown.corrected){
   const old=mem.semantic.filter(x=>x.topic===shown.topic).at(-1);
   if(old)old.status='RETRACTED_AFTER_EVIDENCE';
   const statement={turn:mem.turn,topic:shown.topic,focus:'correction',person,answer:shown.text,status:'CORRECTION_WITH_EVIDENCE',source_ids:shown.source_ids,source:'okazane niezależne dowody'};
   npc94Remember(mem,statement);mem.topics.push(shown.topic);
   mem.statements.push({turn:mem.turn,topic:shown.topic,text:shown.text,status:'CORRECTION_WITH_EVIDENCE',source_ids:shown.source_ids});
   return shown.text;
 }
 if(/\b(?:przyznaw\w*|przyznal\w*|mowil\w*)\s+(?:sie\s+)?(?:do\s+)?(?:tej\s+)?(?:zbrodni|zabojstwa|morderstwa)|\b(?:twierdzil\w*|powiedzial\w*)\b.*\b(?:zabil\w*|zamordowal\w*)\b/.test(norm(raw))&&!mem.semantic.some(x=>x.status==='CONFESSION')){
   return c.gender==='f'?'Nie przyznałam się do zabójstwa. Proszę nie przypisywać mi słów, których nie powiedziałam.':'Nie przyznałem się do zabójstwa. To nie są moje słowa.';
 }
 if(/\b(?:wczesniej|przedtem|poprzednio|rzekomo)\b/.test(norm(raw))&&/\b(?:zabil|zabilas|zabiles|zamordowal|przyznal|przyznalas|morderca)\b/.test(norm(raw))&&!mem.semantic.some(x=>x.status==='CONFESSION')){
   return c.gender==='f'?'Nie przyznałam się do zabójstwa. To nie są moje słowa.':'Nie przyznałem się do zabójstwa. Proszę nie przypisywać mi takiego zeznania.';
 }
 if(plan.act==='apology'&&(!plan.parts.length||plan.parts.every(x=>x.topic==='social'))){
   const t=profile.voice_examples.apology;mem.statements.push({turn:mem.turn,topic:'social',text:t,status:'SOCIAL',source_ids:[]});return t;
 }
 if(plan.act==='challenge'){
   const s=norm(raw);
   if(/\b(?:przyznal|przyznalas|zabil|zamordowal|morderca)\b/.test(s)&&!mem.semantic.some(x=>x.status==='CONFESSION')){
     return c.gender==='f'?'Nie przyznałam się do zabójstwa. Nie przypisuj mi słów, których nie wypowiedziałam.':'Nie przyznałem się do zabójstwa. Proszę nie przypisywać mi słów, których nie powiedziałem.';
   }
   const t=plan.parts[0]?.topic||npc94RecallTopic(raw,mem),old=[...mem.semantic].reverse().find(x=>x.topic===t&&x.status!=='RETRACTED_AFTER_EVIDENCE');
   if(old?.status==='CORRECTION_WITH_EVIDENCE')return 'Po okazaniu dowodów sprostował'+(c.gender==='f'?'am':'em')+' wcześniejszą odpowiedź: '+old.answer;
   if(old&&/\b(?:wczesniej|poprzednio|twierdzil|powiedziales|powiedzialas)\b/.test(s))return 'Powiedział'+(c.gender==='f'?'am':'em')+' wcześniej: „'+old.answer+'”. Co konkretnie się z tym nie zgadza?';
 }
 if(plan.act==='recall'||(plan.parts.length===1&&plan.parts[0].topic==='recall'))return npc94Recall(mem,c,raw);
 const resolved=[];
 for(const sub of plan.parts){
   if(sub.topic==='recall'){resolved.push({text:npc94Recall(mem,c,raw),topic:'recall',focus:'previous_testimony',person});continue;}
   const lastCorrection=[...mem.semantic].reverse().find(x=>x.topic===sub.topic&&x.status==='CORRECTION_WITH_EVIDENCE');
   const answer=lastCorrection?{text:lastCorrection.answer,topic:sub.topic,focus:sub.focus,person,certainty:'po okazaniu dowodów',source:'konfrontacja'}:npc94OnTopic(c,sub,plan,mem,person);
   if(!resolved.some(x=>x.topic===answer.topic&&x.text===answer.text))resolved.push(answer);
 }
 if(!resolved.length){
   const clue=norm(raw);
   if(plan.tone==='apology')return profile.voice_examples.apology;
   if(/\b(?:dlaczego|czemu)\b/.test(clue)&&mem.lastFocus){
     const a=npc94OnTopic(c,{...mem.lastFocus,part:raw,focus:'followup'},plan,mem,person);
     resolved.push(a);
   }else if(person&&person!=='Lena Rudnicka'&&profile.relation[person])resolved.push({topic:'relations',focus:'relationship',text:npc94PersonRelation(c,person),person});
   else resolved.push({topic:'unknown',focus:'unresolved',text:npc94Unknown(c,raw),person,status:'LIMITED_KNOWLEDGE'});
 }
 let reply=resolved.map(x=>x.text).filter(Boolean).join(' ');
 if(shown&&!shown.corrected){
   // The evidence is acknowledged without turning a weak record into an admission.
   reply=(reply?reply+' ':'')+shown.text;
 }
 reply=(npc94Reaction(c,plan,mem)+reply).trim();
 for(const r of resolved){
   const entry={turn:mem.turn,topic:r.topic,focus:r.focus,person:r.person||null,answer:r.text,source:r.source||'ograniczona wiedza świadka',certainty:r.certainty||'zależna od źródła',status:r.status||'TESTIMONY',source_ids:[]};
   npc94Remember(mem,entry);mem.topics.push(r.topic);
   mem.statements.push({turn:mem.turn,topic:r.topic,text:r.text,status:r.status||'TESTIMONY',source_ids:[],confidence:r.certainty||'zależna od źródła'});
 }
 if(mem.topics.length>230)mem.topics.splice(0,mem.topics.length-230);
 if(mem.statements.length>230)mem.statements.splice(0,mem.statements.length-230);
 return reply||npc94Unknown(c,raw);
}
/* NPC 9.5: role-first Polish utterance understanding and memory-aware realizations.
   Offline, deterministic, lore-safe. It does NOT control evidence gates. */
const NPC95_VERSION='9.5';
const NPC95_VARIANTS={
 MAREK:{
 alibi:[
  'Nadzorowałem zmianę. Pracowałem przede wszystkim w biurze, ale wychodziłem również w sprawach służbowych. Sam grafik nie odtwarza każdego mojego kroku.',
  'Nie zamierzam przedstawiać biura jako miejsca, z którego w ogóle nie wychodziłem. Kierowałem zmianą i przemieszczałem się też służbowo.',
  'Przebywałem głównie przy sprawach kierownictwa. To, że byłem dostępny telefonicznie, nie znaczy, że ktoś widział mnie przez cały czas.' ],
 witness:[
  'Nie mam jednego naocznego świadka całego dyżuru. Można sprawdzić połączenia służbowe i wejścia, lecz te zapisy nie śledzą mnie bez przerwy.',
  'Jeśli pyta pan o osobę, która ręczy za każdą minutę, nie wskażę takiej osoby. Rejestry pokazują tylko poszczególne czynności.',
  'Kontakt telefoniczny jest do udokumentowania. To nie zastępuje człowieka, który widziałby mnie przez całą noc.' ],
 feeling:[
  'Na mojej zmianie zginęła pracownica. Nie da się tego sprowadzić do służbowej rubryki; wracam do tego myślami.',
  'Próbuję mówić rzeczowo, ale świadomość, że Lena zginęła podczas mojego dyżuru, ciąży mi.',
  'To był człowiek, za którego bezpieczeństwo odpowiadała także organizacja pracy. Trudno mi o tym mówić bez myślenia o własnej odpowiedzialności.' ],
 source:[
  'O organizacji zmiany mówię z własnej pracy. Informację o znalezieniu Leny poznałem dopiero po alarmie.',
  'Nie byłem przy znalezieniu Leny. Potrafię mówić o decyzjach kierownictwa, ale nie o przebiegu ataku z własnej obserwacji.' ]},
 TOMASZ:{
 alibi:[
  'Siedziałem przy dyspozycji, ale później poszedłem do trzeciego stanowiska. Tam znalazłem Lenę. O 02:02 poszedł alarm.',
  'Zmiana dyspozycji wagonu to moja robota. Potem byłem przy stanowisku trzecim. Nie udaję, że mam zapis całej swojej trasy minuta po minucie.',
  'Najpierw dyspozytornia i sprawy ruchu, potem stanowisko trzecie. To, co robiłem przy konsoli, można sprawdzić w łączności.' ],
 witness:[
  'Rejestr łączności radiowej potwierdzi pracę przy konsoli. Ale nie pokaże, czy w międzyczasie na chwilę wyszedłem.',
  'Nie mam człowieka, który chodził za mną przez całą zmianę. Są za to meldunki z dyspozytorni.',
  'Można odtworzyć moje komunikaty i dyspozycje. To uczciwsze niż wymyślać świadka, którego nie było.' ],
 feeling:[
  'Nie chcę wracać do widoku przy stanowisku trzecim, ale wraca sam. To nie był zwykły alarm.',
  'Znalazłem ją. Kiedy o tym mówię, najpierw pamiętam ten widok, dopiero potem meldunek.',
  'Na co dzień człowiek myśli o wagonach i godzinach. Tamtej nocy zobaczyłem Lenę i od tego nie da się tak łatwo odciąć.' ],
 source:[
  'To, że wagon wrócił, wiem z dyspozycji. Lenę zobaczyłem sam przy trzecim stanowisku. Ataku nie widziałem.',
  'O ruchu tramwaju mówię jako dyspozytor. O jej obrażeniach nie będę opowiadał tak, jakbym widział napastnika.' ]},
 JANUSZ:{
 alibi:[
  'Byłem w warsztacie i przy zleceniach. Chodziłem do wagonów po narzędzia. Karta pracy nie jest zapisem wszystkich moich przejść.',
  'Robota była przy naprawach, nie przy biurku. Dlatego nie powiem panu, że każdy krok mam potwierdzony.',
  'Zlecenia i narzędzia — tym się zajmowałem. Miałem powody, żeby przemieszczać się po warsztacie.' ],
 witness:[
  'Koledzy mogli mnie widzieć przy robocie. Ale o konkretnej godzinie trzeba pytać konkretnie, nie za całą noc.',
  'Na warsztacie są ludzie. To jednak nie znaczy, że ktoś obserwował mnie bez przerwy.',
  'Nie wskażę jednego nazwiska na dwanaście godzin. Sprawdzajmy zlecenia i to, kto był wtedy na hali.' ],
 feeling:[
  'Kłóciliśmy się o zgłoszenia usterek. Teraz nie chcę udawać, że to były nieważne rozmowy.',
  'Miałem do niej pretensje o sposób zgłaszania problemów. Po jej śmierci to już brzmi inaczej.',
  'Czasem irytowały mnie kolejne uwagi Leny. Nie znaczy to, że obojętnie przyjąłem wiadomość o jej śmierci.' ],
 source:[
  'Karty napraw znam z własnej roboty. O zabójstwie dowiedziałem się po alarmie.',
  'Wiem, co było na warsztacie. Nie widziałem jednak chwili, w której Lenę zaatakowano.' ]},
 ELZBIETA:{
 alibi:[
  'Pracowałam przy sprawach BHP. Pamiętam rozmowę z Leną o 21:47, ale nie mam potwierdzenia całej późniejszej nocy.',
  'Mogę opisać swoje zadania i rozmowę o 21:47. Nie byłoby uczciwe rozszerzać tego potwierdzenia na wszystkie godziny.',
  'Dyżur poświęciłam zgłoszeniom bezpieczeństwa. Późniejszych godzin nie potrafię odtworzyć tak dokładnie jak momentu rozmowy z Leną.' ],
 witness:[
  'Zapis zgłoszenia może potwierdzić kontakt o 21:47. Nie mam osoby, która widziała mnie przez pozostałą część zmiany.',
  'Wskazuję rozmowę o 21:47 i związane z nią zapisy. Nie podaję tego jako pełnego alibi.',
  'Potwierdzenie rozmowy z Leną to jedno; niezależny świadek mojej obecności przez całą noc to coś innego.' ],
 feeling:[
  'Wciąż wracam do rozmowy o zagrożeniu. Zastanawiam się, czy moje działanie mogło być szybsze.',
  'O 21:47 rozmawiałyśmy o bezpieczeństwie. Po tym, co się stało, trudno mi nie myśleć o tamtych słowach.',
  'Nie potrafię przestać się zastanawiać nad zgłoszeniem Leny. To dla mnie więcej niż wpis w systemie.' ],
 source:[
  'Rozmowę pamiętam osobiście. To, czy zgłoszenie zostało wysłane, trzeba sprawdzić w historii systemu.',
  'Wiem, co Lena powiedziała mi o 21:47. Nie mogę z samej pamięci potwierdzić statusu wysyłki.' ]},
 KAMIL:{
 alibi:[
  'Robiłem diagnostykę TW-217. Odchodziłem czasem od stanowiska, więc sam log nie mówi, gdzie stałem co minutę.',
  'Pracowałem przy automatyce. Sesja pokazuje testy, a nie moje nogi i każdy krok po zajezdni.',
  'Nie będę udawał, że cały czas siedziałem w jednym miejscu. Zajmowałem się diagnostyką i zdarzało mi się odejść.' ],
 witness:[
  'Technicy widywali mnie przy robocie, ale nie wskażę kogoś, kto ma potwierdzić cały dyżur.',
  'Jeśli chcesz świadka na każdą minutę, nie mam takiego. Log sesji nie jest człowiekiem.',
  'Ktoś z warsztatu mógł widzieć mnie przy stanowisku. Nie chcę rzucać nazwiskiem bez upewnienia się.' ],
 feeling:[
  'Lena potrafiła mnie wypytywać o logi do skutku. Teraz te rozmowy siedzą mi w głowie.',
  'Ciężko mi mówić o niej tak, jakby chodziło wyłącznie o usterkę wagonu. Już nie wróci.',
  'Kiedy patrzę na zapisy tamtej nocy, przypominają mi się nasze rozmowy. To nie jest dla mnie obojętne.' ],
 source:[
  'O sesji mówię, bo przy niej pracowałem. O tym, co stało się przy trzecim stanowisku, wiem już z późniejszych informacji.',
  'Znam te logi z diagnostyki, ale nie mam własnej obserwacji ataku na Lenę.' ]},
 MAGDALENA:{
 alibi:[
  'Moja sesja audytowa była aktywna od 01:30 do 02:00. Nie należy z tego wyciągać wniosku o mojej nieprzerwanej obecności przy komputerze.',
  'Rejestr opisuje aktywność konta w godzinach 01:30–02:00. To nie jest ewidencja fizycznego położenia człowieka.',
  'Proszę odróżnić zalogowaną sesję od świadka obecności. Pracowałam przy audycie dokumentacji.' ],
 witness:[
  'Rejestr sesji nie jest osobą, która mogłaby mnie widzieć. Nie wskażę niezależnego świadka bez podstaw.',
  'Nie mam naocznego potwierdzenia całego przedziału 01:30–02:00. Potrafię wskazać wyłącznie zapis aktywności systemu.',
  'Jeżeli pytanie dotyczy świadka, sama sesja audytowa nie spełnia tego warunku.' ],
 feeling:[
  'To była tragedia. Nie chciałabym, aby ostrożny sposób wypowiadania się uznano za obojętność.',
  'Śmierć Leny nie jest mi obojętna. Zależy mi jednak na oddzieleniu uczuć od tego, co można udowodnić.',
  'Myślę o konsekwencjach tamtej nocy. Nie będę udawać, że umiem opisać cudze przeżycia ani przebieg samego zdarzenia.' ],
 source:[
  'Mówię o tym, co wynika z audytu i zapisów sesji. Nie mam własnej obserwacji napaści.',
  'Mogę odpowiadać za swoje ustalenia dokumentacyjne. Nie mogę przedstawić ich jako naocznego zeznania o zabójstwie.' ]}
};
const NPC95_CONTEXTUAL_RULES=[
 {r:/\b(?:co\s+(?:ci|panu|pani)\s+zostalo\s+z\s+ostatniej\s+rozmowy|ostatnia\s+rozmowa|co\s+(?:padlo|powiedziano)\s+miedzy\s+wami|o\s+co\s+(?:cie|pana|pania)\s+wypytywal\w*|co\s+uslysz\w*\s+od\s+len\w*)\b/,topic:'conversation',focus:'conversation_content'},
 {r:/\b(?:gdzies\s+(?:ty|pan|pani|sie)|ktoredy\s+(?:chodzil\w*|szedl\w*|sie\s+przemieszczal\w*)|swoja\s+trase\s+(?:tej|tamtej)\s+nocy|tras\w*\s+(?:tej|tamtej)\s+nocy)\b/,topic:'alibi',focus:'location'},
 {r:/\b(?:mecz\w*\s+(?:cie|pana|pania)\s+(?:mysl|wspomnienie)|daje\s+(?:ci|panu|pani)\s+(?:to\s+)?spac|doskwier\w*\s+(?:ci|panu|pani)|nie\s+mozesz\s+zapomniec)\b/,topic:'feeling',focus:'grief'},
 {r:/\b(?:od\s+kogo\s+(?:to|ta|wiesc|wiadomosc)|jak\s+(?:doszly|dotarly)\s+(?:do\s+ciebie|do\s+pana|do\s+pani)\s+(?:wiesci|informacj\w*)|z\s+wlasnej\s+obserwacji|cudzy\s+meldunek|ktos\s+(?:ci|panu|pani)\s+przekazal)\b/,topic:'source',focus:'direct_or_reported'},
 {r:/\b(?:(?:byl\w*\s+na\s+nia\s+ciet\w*|ciet\w*\s+na\s+(?:nia|lena|len\w*))|zatarg\w*\s+z\s+(?:nia|len\w*)|co\s+(?:was|ich)\s+poroznil\w*|miel\w*\s+z\s+nia\s+(?:kwasy|spiny|zatargi)|jak\s+wam\s+sie\s+ukladal\w*)\b/,topic:'relations',focus:'relationship'},
 {r:/\b(?:co\s+sie\s+(?:tam|wtedy)\s+(?:takiego\s+)?stalo|co\s+(?:sam|sama)\s+wiesz\s+o\s+zdarzeniu|jak\s+to\s+wszystko\s+wygladalo|co\s+tak\s+naprawde\s+zaszlo)\b/,topic:'what_happened',focus:'case_summary'},
 {r:/\b(?:kiedy\s+(?:konkretnie\s+)?(?:pojawil\w*|powstal\w*)\s+(?:ostatni\w*\s+)?wpis|o\s+ktorej\s+godzinie\s+(?:jest|byl)\s+wpis)\b/,topic:'time',focus:'precise'},
 {r:/\b(?:sprawdz\w*\s+(?:ze|czy|to)|ktory\s+slad\s+pozwoli\s+.*zweryfikowac|co\s+musim\w*\s+porownac|jakiego\s+rodzaju\s+zapis\s+.*rozstrzygn\w*|niezalezn\w*\s+dane\s+dotycz\w*|jak\s+to\s+odroznic\s+od\s+domyslow)\b/,topic:'verification',focus:'how_to_verify'},
 {r:/\b(?:na\s+kogo\s+(?:padlaby|postawilbys|postawilabys|wskazalbys|wskazalabys)|gdybys\s+musial\s+wskazac\s+osobe)\b/,topic:'culprit',focus:'identity'},
 {r:/\b(?:wiadomosc\s+przyszla\s+(?:do\s+ciebie|do\s+pana|do\s+pani)\s+od\s+kogo|kto\s+(?:ci|panu|pani)\s+to\s+(?:doniosl|przekazal|powiedzial))\b/,topic:'source',focus:'who_informed'},
 {r:/\b(?:ciet\w*\s+(?:na\s+nia|na\s+lena)|mi(?:al|el)\w*\s+z\s+nia\s+zatargi|co\s+was\s+poroznilo|spieci\w*\s+z\s+len\w*)\b/,topic:'relations',focus:'conflict'},
 {r:/\b(?:co\s+wam\s+(?:wtedy\s+)?padlo\s+(?:miedzy\s+soba|miedzy\s+wami)|co\s+uslyszal\w*\s+od\s+leny|o\s+co\s+(?:cie|pana|pania)\s+wypytywal\w*)\b/,topic:'conversation',focus:'conversation_content'},
 {r:/\b(?:kiedy\s+(?:konkretnie\s+)?pojawil\w*\s+(?:sie\s+)?(?:ostatni\w*\s+)?wpis|o\s+ktorej\s+ostatni\w*\s+log)\b/,topic:'time',focus:'entry_time'}
];
const NPC95_FOCUS_PATTERNS=[
 {r:/\b(?:teskni\w*|zaluje\w*|ciezko\s+(?:ci|panu|pani|jest|teraz)\b|ruszyl\w*\s+(?:cie|pana|pan[aia])|uderzyl\w*\s+(?:cie|pana)|sen\w*\s+(?:o\s+niej|o\s+len)|masz\s+ja\s+(?:przed\s+oczami|w\s+glowie)|jak\s+to\s+znosisz|dajesz\s+rade|nie\s+mozesz\s+zapomnie|wraca\s+(?:do\s+ciebie|do\s+pana)|nie\s+mozesz\s+spac|boli\s+(?:cie|pana|pania)|zalamal\w*|przezywasz|przezywa\s+pani|wstrzasn\w*)\b/,topic:'feeling',focus:'grief'},
 {r:/\b(?:kto\s+(?:ci|panu|pani|wam)\s+(?:powiedzial|doniosl|przekazal|dal\s+znac)|od\s+kogo\s+(?:uslysz\w*|dowiedz\w*)|kto\s+(?:zawiadomil|powiadomil)|jak\s+(?:ci|panu|pani)\s+przekazano|z\s+czyich\s+ust\w*|skad\s+(?:sie\s+)?wiedzial\w*)\b/,topic:'source',focus:'who_informed'},
 {r:/\b(?:czy\s+(?:sam|sama|osobiscie|na\s+wlasne\s+oczy)\s+(?:widzial\w*|byl\w*)|widziales\s+(?:to\s+)?sam|widzialas\s+(?:to\s+)?sama|z\s+pierwszej\s+reki|z\s+autopsji|swiadkiem\s+(?:byles|bylas)|naocznie)\b/,topic:'source',focus:'direct_or_reported'},
 {r:/\b(?:kto\s+(?:za\s+(?:ciebie|toba|panem|pania)\s+)?(?:reczy|poswiadczy|potwierdzi|widzial)|ktos\s+(?:cie|pana|pania)\s+(?:widz\w*|mogl\w*\s+widziec)|masz\s+(?:zywego\s+)?swiadka|ludzie\s+(?:cie|pana)\s+widzie\w*|niezalezny\s+(?:swiadek|czlowiek)|osob\w*\s+(?:ktora|co)\s+(?:cie|pana|pania)\s+widzial\w*)\b/,topic:'witness',focus:'independent_person'},
 {r:/\b(?:gdzie\s+(?:sie\s+)?(?:szwend\w*|krec\w*|podziew\w*|byl\w*|siedzial\w*|przebywal\w*|chodzil\w*|ruszal\w*|stales|stalas)|w\s+jakim\s+miejscu\s+(?:byl\w*|przebywal\w*)|jak\s+daleko\s+(?:od\s+biura|od\s+dyspozytorni)|skad\s+i\s+dokad\s+chodzil\w*)\b/,topic:'alibi',focus:'location'},
 {r:/\b(?:jak\s+wygladal\w*\s+(?:twoj|pana|pani)\s+(?:dyzur|noc)|co\s+(?:odwalal\w*|porabial\w*|robil\w*|robotal\w*)\s+(?:wtedy|noc\w*|po\s+zmianie)|czym\s+byl\w*\s+zajet\w*\s+(?:tamtej\s+nocy|wtedy)|co\s+(?:ci|panu|pani)\s+zeszlo\s+(?:na|tej)\s+noc|jak\s+ci\s+minela\s+zmiana)\b/,topic:'alibi',focus:'activity'},
 {r:/\b(?:co\s+(?:o\s+)?(?:lenie|leny|jej)\s+(?:wiesz|pamietasz)|co\s+wiadomo\s+o\s+sprawie|co\s+(?:wiemy|ustalono|mamy)\s+(?:pewnego|na\s+pewno|o\s+sprawie)|co\s+zaszlo|co\s+sie\s+wydarzylo|co\s+bylo\s+z\s+lena|o\s+co\s+tu\s+chodzi|w\s+jakim\s+stanie\s+jest\s+sprawa)\b/,topic:'what_happened',focus:'case_summary'},
 {r:/\b(?:jak\s+(?:wam|sie\s+wam|ci\s+sie|panu\s+sie)\s+(?:ukladal\w*|zylo|pracowal\w*)|mieliscie\s+na\s+pienku|bylo\s+miedzy\s+wami|byl\w*\s+z\s+nia\s+w\s+zgodzie|z\s+lena\s+sie\s+dogadywal\w*|lubiles\s+lena|lubila\w*\s+lena|byl\w*\s+sklocon\w*)\b/,topic:'relations',focus:'relationship'},
 {r:/\b(?:kiedy\s+(?:ostatnio|ostatni\s+raz|po\s+raz\s+ostatni)|ostatni\w*\s+(?:kontakt|spotkani\w*|rozmow\w*|widzenia))\b.*\b(?:len\w*|nia|jej|ona|widzial\w*|spotkal\w*|rozmawial\w*)\b/,topic:'last_seen',focus:'last_meeting'},
 {r:/\b(?:o\s+czym\s+(?:z\s+nia\s+)?(?:gadali\w*|rozmawial\w*)|co\s+(?:lena|ona)\s+(?:ci|panu|pani)\s+(?:mowil\w*|powiedzial\w*)|jakie\s+slowa\s+(?:padly|powiedziala)|co\s+od\s+niej\s+uslysz\w*)\b/,topic:'conversation',focus:'conversation_content'},
 {r:/\b(?:jak\s+(?:to|swoj\w*\s+slowa|wersj\w*)\s+(?:udowodnisz|udowodnic|potwierdzisz)|co\s+(?:to|twoje\s+slowa|taka\s+wersje)\s+potwierdza|jak\s+mozna\s+zweryfikowac|na\s+jakiej\s+podstawie\s+to\s+twierdzisz|po\s+czym\s+to\s+poznac)\b/,topic:'verification',focus:'how_to_verify'},
 {r:/\b(?:ktora\s+(?:byla|to)\s+godzina|o\s+jakiej\s+porze|co\s+do\s+minuty|ile\s+minut|o\s+ktorej\s+(?:godzinie\s+)?(?:zglosil\w*|zadzwonil\w*|wszedl\w*|wyszedl\w*|nastapil\w*))\b/,topic:'time',focus:'precise'},
 {r:/\b(?:kto\s+(?:ja\s+)?(?:ukatrupil|zatlukl|zabil|zamordowal)|kto\s+to\s+zrobil|kto\s+za\s+tym\s+stoi|czyja\s+to\s+wina|komu\s+przypisac\s+jej\s+smierc)\b/,topic:'culprit',focus:'identity'},
 {r:/\b(?:kto\s+(?:podpisal|klepnal|wpisal|zatwierdzil|zmienil)\s+(?:te\s+)?(?:papiery|dokumenty|raport|wyniki)|skad\s+(?:sie\s+)?wzial\s+(?:ten\s+)?wpis|kto\s+wrzucil\s+(?:to\s+)?do\s+systemu)\b/,topic:'documents',focus:'provenance'}
];
function npc95StrongMeaning(raw){
 const s=norm(raw);
 for(const p of [...NPC95_CONTEXTUAL_RULES,...NPC95_FOCUS_PATTERNS]){if(p.r.test(s))return {topic:p.topic,focus:p.focus,priority:210};}
 return null;
}
function npc95Split(raw){
 const s=String(raw||'').trim();
 // Ignore discourse markers; preserve clauses containing substantive questions.
 const cleaned=s.replace(/(?:^|[.!?;]\s*)(?:sluchaj|ej|no\s+dobra|nie\s+krec|przestan\s+klamac|bez\s+sciemy|powiedz\s+prawde)\s*[!,.]?\s*/gi,' ').trim();
 let arr=cleaned.split(/\s*(?:[!?;]+|\b(?:oraz|a\s+takze)\b|\bi\s+(?=(?:kto|gdzie|co|kiedy|jak|czy|dlaczego|czemu|skad|ile|komu|o\s+ktorej)\b)|\ba\s+(?=(?:kto|gdzie|co|czy|kiedy|jak|dlaczego|skad)\b))\s*/i).map(x=>x.trim()).filter(Boolean);
 if(!arr.length)arr=[s];return arr.slice(0,4);
}
const npc95OriginalPlan=npc94BuildPlan;
npc94BuildPlan=function(raw,mem){
 const base=npc95OriginalPlan(raw,mem),segments=npc95Split(raw),answers=[];
 for(const seg of segments){
   const certain=npc95StrongMeaning(seg),fallback=npc94IntentPart(seg,mem);
   const pick=certain||fallback;
   if(pick?.topic&&pick.topic!=='social')answers.push({...pick,kind:fallback.kind||'open',part:seg});
 }
 if(answers.length){const seen=new Set();base.parts=answers.filter(x=>{const k=x.topic+'|'+x.focus;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,3);}
 // Preserve the original act and personality/tone rules. A threat is a tone, not evidence.
 return base;
};
function npc95Hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function npc95Memory(mem){if(!mem.npc95)mem.npc95={recent:{},asked:{},directed:0};return mem.npc95;}
function npc95Variant(c,topic,focus,raw,mem){
 const m=npc95Memory(mem),bank=NPC95_VARIANTS[c.id]?.[topic];
 if(!bank)return null;
const key=topic+'|'+focus;const asked=m.asked[key]||0;
 const f=NPC94_FACTS[c.id];
 let expanded=bank;
 if(topic==='alibi'&&focus==='alibi_proof')expanded=[f.witness,f.verify,f.witness+' '+f.verify];
 else if(topic==='alibi'&&focus==='activity')expanded=[f.alibi, f.alibi+' '+f.location, f.alibi+' '+f.verify];
 else if(topic==='alibi')expanded=[...bank,f.location+' '+f.verify,f.alibi+' '+f.witness,f.alibi+' '+f.time];
 else if(topic==='witness')expanded=[...bank,f.witness+' '+f.verify,f.witness+' '+f.source];
 else if(topic==='source')expanded=[...bank,f.source+' '+f.victim,f.source+' '+f.verify];
 else if(topic==='feeling')expanded=bank;

 // Seek response that hasn't been used recently for this topic; exact repetition may be necessary to preserve facts.
 const recent=m.recent[key]||[];
 const start=(npc95Hash(norm(raw)) + asked) % expanded.length;
 let pos=start;
 for(let k=0;k<expanded.length;k++){const t=(start+k)%expanded.length;if(!recent.includes(t)){pos=t;break;}}
 m.recent[key]=[...recent,pos].slice(-2);m.asked[key]=asked+1;
 let text=expanded[pos];
 // Ask for detail repeatedly: explain the evidence limit, not introduce new people, times or movements.
 if(asked>=2&&asked%4===2){
   const grounded=NPC94_FACTS[c.id];
   if(topic==='alibi')text+=' '+grounded.verify;
   else if(topic==='witness')text+=' '+grounded.source;
   else if(topic==='source')text+=' '+grounded.verify;
 }
 return text;
}
function npc95OtherVariant(c,part,mem,original){
 const f=NPC94_FACTS[c.id],custom=NPC9_CUSTOM[c.id],key=part.topic+'|'+part.focus;
 const data={
  what_happened:[f.victim, f.victim+' '+f.source, f.victim+' '+f.lastvictim, f.victim+' '+f.verify],
  verification:[f.verify,f.verify+' '+f.witness, f.verify+' '+f.source,f.verify+' '+f.time],
  time:[f.time,f.time+' '+f.verify,f.time+' '+f.source,f.time+' '+f.alibi],
  last_seen:[f.last,f.last+' '+f.lastvictim,f.last+' '+f.source,f.last+' '+f.time],
  conversation:[custom.conversation,custom.conversation+' '+f.source,custom.conversation+' '+f.last,custom.conversation+' '+f.verify],
  relations:[original,original+' '+f.emotion,original+' '+f.source,original+' '+f.last],
  culprit:[original,original+' '+f.source,original+' '+f.victim],
  accountability:[f.responsibility,f.responsibility+' '+f.verify,f.responsibility+' '+f.source,f.responsibility+' '+f.emotion],
  work:[original,original+' '+f.location,original+' '+f.time,original+' '+f.verify]
 }[part.topic];
 if(!data||!original)return null;
 const m=npc95Memory(mem);const n=m.asked[key]||0;
 const use=n%data.length;
 m.asked[key]=n+1;
 return data[use];
}
function npc95PreciseFact(c,part){
 const t=part.topic,s=norm(part.part),f=NPC94_FACTS[c.id],female=c.gender==='f';
 if(t==='source'&&(/\b(?:dowiedz|doszly|wiesci|informacje|powiadom|przekaz|uslysz|doniosl|znaleziono|wiadomosc)\b/.test(s))&&/\b(?:len|jej|smierc|znaleziono|alarm|wiadomosc)\w*\b/.test(s)){
   if(c.id==='TOMASZ')return 'Sam znalazłem Lenę przy trzecim stanowisku i zgłosiłem alarm o 02:02. Nie znam z własnej obserwacji przebiegu ataku.';
   return (female?'O śmierci Leny dowiedziałam się':'O śmierci Leny dowiedziałem się')+' po alarmie. Nie mam w swojej relacji potwierdzonego nazwiska osoby, która jako pierwsza przekazała mi tę wiadomość.';
 }
 if(t==='time'&&/\b(?:zglosil|zglosilas|zglosiles|zgloszono|powiadomil|wezwal|alarm)\w*\b/.test(s)){
  return c.id==='TOMASZ'?'Zgłosiłem alarm o 02:02. Tę godzinę trzeba zestawić z zapisem łączności.':'Alarm zgłoszono o 02:02. Nie przypisuję sobie jego zgłoszenia; znam tę godzinę z zapisów i późniejszych ustaleń.';
 }
 if(t==='time'&&/\b(?:ostatni\w*\s+wpis|ostatni\w*\s+log|ostatni\w*\s+rekord)\b/.test(s))return 'Nie mam potwierdzonej godziny ostatniego wpisu, o który pan pyta. Trzeba wskazać konkretny system i jego surowy dziennik; różne systemy miały różne zegary.';
 if(t==='what_happened'&&/\b(?:stan\s+sprawy|co\s+(?:wiadomo|wiemy|ustalono)|co\s+sie\s+(?:tam|wtedy)\s+stalo|co\s+zaszlo|co\s+wydarzylo)\b/.test(s)){
  return 'Lena Rudnicka zginęła podczas nocnej zmiany na terenie zajezdni. Znaleziono ją przy stanowisku trzecim, a alarm zgłoszono o 02:02. '+f.source;
 }
 return null;
}
const npc95OriginalOnTopic=npc94OnTopic;
npc94OnTopic=function(c,part,plan,mem,person){
 const r=npc95OriginalOnTopic(c,part,plan,mem,person);
 // No variants for evidence corrections, quotes or unsupported knowledge.
 if(!r||!r.text||part.focus==='followup'||r.topic==='unknown'||r.topic==='recall')return r;
const precise=npc95PreciseFact(c,part);
 if(precise){r.text=precise;return r;}
 const v=['alibi','witness','feeling','source'].includes(r.topic)?npc95Variant(c,r.topic,r.focus,part.part,mem):npc95OtherVariant(c,part,mem,r.text);
 if(v)r.text=v;
 return r;
};
// Avoid stock emotional prefaces on successive questions; let the witness's own content carry emotion.
const npc95OriginalReaction=npc94Reaction;
npc94Reaction=function(c,plan,mem){
 if(plan.tone!=='pressure'&&plan.tone!=='empathy')return '';
 const old=npc95OriginalReaction(c,plan,mem);
 if(!old)return '';
 const state=npc95Memory(mem);state.directed++;
 if(state.directed>1&&state.directed%3!==0)return '';
 return old;
};

/* NPC 9.7 — warstwa pragmatyczna i anty-powtórzeniowa (w pełni offline).
 * Nie wnioskuje o faktach, nie nadaje dostępu do dowodów i nie modyfikuje bramek konfrontacji.
 * Odpowiedzi powstają wyłącznie z jawnych, przypisanych świadkowi danych NPC94/NPC95. */
const NPC96_VERSION='9.6';
const NPC96_INTENTS=[
 {r:/\b(?:co\s+(?:mozesz|moze\s+pan|moze\s+pani|umiesz)\s+(?:powiedziec|opowiedziec)\s+o\s+(?:lenie|leny|niej)|jaka\s+byla\s+lena|co\s+sad\w*\s+o\s+lenie)\b/,topic:'lena',focus:'victim_profile'},
 {r:/\b(?:(?:i\s+)?co\s+potem\s+z\s+(?:lena|leny|nia)|co\s+(?:sie\s+)?dalej\s+(?:stalo|dzialo)\s+z\s+lena)\b/,topic:'victim_last',focus:'route'},
 {r:/\b(?:kojarz\w*\s+(?:ja|lene|lena|leny|motornicz\w*)|ja\s+kojarz\w*|znal\w*\s+(?:ja|lene|lena)|znasz\s+(?:ja|lene|lena)|lubil\w*\s+(?:ja|lene|lena)|dogadywal\w*|mieliscie\s+(?:na\s+pienku|kontakt)|co\s+was\s+laczylo|jak\s+sie\s+znaliscie)\b/,topic:'relations',focus:'relationship'},
 {r:/\b(?:o\s+co\s+(?:poszlo|chodzilo|sie\s+poklocil\w*)|co\s+was\s+poroznilo|co\s+do\s+(?:niej|leny)\s+mial\w*|nie\s+przepadal\w*\s+za)\b/,topic:'relations',focus:'conflict'},
 {r:/\b(?:co\s+(?:ona|lena|motornicza)\s+(?:ci|panu|pani|wam)\s+(?:powiedzial\w*|mowil\w*|wspomnial\w*)|o\s+czym\s+byla\s+(?:ta|wasza)\s+rozmowa|o\s+czym\s+(?:gadaliscie|rozmawialiscie))\b/,topic:'conversation',focus:'conversation_content'},
 {r:/\b(?:a\s+(?:ona|lena|motornicza)\s+(?:potem|dalej|pozniej)|co\s+(?:ona|lena)\s+(?:zrobila|robila)\s+pozniej|dokad\s+(?:ona|lena)\s+(?:poszla|udalala|ruszyla))\b/,topic:'victim_last',focus:'route'},
 {r:/\b(?:ktora\s+osoba\s+(?:ostatni\w*\s+)?widzial\w*\s+(?:lene|ja)|kto\s+(?:ostatni|ostatnio|jako\s+ostatni)\s+(?:widzial|spotkal)\s+(?:lene|ja)|kto\s+ja\s+ostatni\w*\s+(?:widzial|spotkal))\b/,topic:'last_seen',focus:'other_last_witness'},
 {r:/\b(?:swiadek\s+(?:(?:cie|pana|pania)\s+)?widzial\w*|z\s+kim\s+(?:byl\w*|pracowal\w*|siedzial\w*|chodzil\w*)|kto\s+(?:cie|pana|pania)\s+(?:widz\w*|pamieta)|ktos\s+(?:cie|pana|pania)\s+zast\w*|kto\s+by\s+(?:za\s+ciebie|za\s+pana|za\s+pania)\s+reczyl)\b/,topic:'witness',focus:'independent_person'},
 {r:/\b(?:gdzie\s+(?:byl\w*|przebywal\w*|siedzial\w*|lazil\w*|chodzil\w*|sie\s+podziewal\w*)|co\s+(?:robil\w*|porabial\w*)\s+(?:o\s+tej\s+porze|po\s+polnocy|w\s+tym\s+czasie)|jak\s+(?:minela|wygladala)\s+(?:twoja|pana|pani)\s+noc)\b/,topic:'alibi',focus:'location'},
 {r:/\b(?:jak\s+wygladal\w*\s+(?:twoja|pana|pani)\s+(?:robota|zmiana|dyzur)|jak\s+przebiegal\w*\s+dyzur|czym\s+zajmowal\w*\s+sie\s+(?:tej|tamtej)\s+nocy)\b/,topic:'alibi',focus:'activity'},
 {r:/\b(?:co\s+(?:tam|wtedy)\s+(?:zaszlo|sie\s+odwalilo|sie\s+stalo)|jak\s+doszlo\s+do\s+(?:tego|tragedii)|jaka\s+jest\s+(?:twoja|pana|pani)\s+wersja\s+(?:zdarzen|wydarzen)|co\s+jest\s+pewne\s+w\s+tej\s+sprawie)\b/,topic:'what_happened',focus:'case_summary'},
 {r:/\b(?:skad\s+(?:to|o\s+tym)\s+(?:wiesz|wiedzial\w*)|kto\s+(?:ci|panu|pani)\s+(?:doniosl|powiedzial|przekazal)|to\s+z\s+(?:twoich|pana|pani)\s+(?:oczu|obserwacji)|sam\w*\s+to\s+widzial\w*|ze\s+slyszenia)\b/,topic:'source',focus:'direct_or_reported'},
 {r:/\b(?:czym\s+to\s+(?:udowodnisz|potwierdzisz)|jak\s+to\s+sprawdz\w*|czy\s+jest\s+na\s+to\s+(?:slad|papier|dowod)|jaki\s+(?:jest|masz)\s+na\s+to\s+dowod|co\s+to\s+potwierdza)\b/,topic:'verification',focus:'how_to_verify'},
 {r:/\b(?:co\s+ci\s+(?:nie\s+daje\s+spokoju|siedzi\s+w\s+glowie)|jak\s+(?:sobie\s+z\s+tym\s+radzisz|to\s+znosisz)|czy\s+cie\s+to\s+ruszylo|czy\s+za\s+nia\s+tesknisz|nie\s+mozesz\s+po\s+tym\s+spac)\b/,topic:'feeling',focus:'grief'},
 {r:/\b(?:co\s+mogl\w*\s+zrobic\s+inaczej|mogl\w*\s+temu\s+zapobiec|czy\s+masz\s+wyrzuty\s+sumienia|co\s+zaniedbal\w*)\b/,topic:'accountability',focus:'prevention'},
 {r:/\b(?:kto\s+(?:trzymal|mial|pozyczyl|odbijal)\s+(?:te\s+)?kart\w*|komu\s+(?:dales|dalas|pozyczyl\w*|przekazal\w*)\s+(?:karte|identyfikator)|czyja\s+(?:byla|jest)\s+przepustka|co\s+z\s+(?:ta|twoja)\s+karta)\b/,topic:'card',focus:'owner_vs_user'},
 {r:/\b(?:co\s+(?:widac|zarejestrowano)\s+na\s+(?:kamerze|monitoringu)|co\s+pokazuj\w*\s+(?:kamery|nagrania)|czy\s+(?:kamera|monitoring)\s+(?:cie|pana|pania|ja|go)\s+(?:widziala|uchwycil))\b/,topic:'cctv',focus:'camera_limits'},
 {r:/\b(?:miales\s+przerwe|mialas\s+przerwe|kiedy\s+(?:odesz\w*|wyszed\w*|zniknal\w*)\s+(?:od|z)\s+(?:konsoli|biura|stanowiska)|wyszed\w*\s+na\s+papierosa)\b/,topic:'break',focus:'absence'},
 {r:/\b(?:a\s+co\s+z\s+tym|a\s+dalej|co\s+z\s+tego\s+wynika|a\s+ten\s+watek|mozesz\s+to\s+rozwinac|rozwin\s+to|a\s+dlaczego|a\s+konkretnie|i\s+dalej|i\s+co\s+potem)\b/,topic:'_followup',focus:'followup'}
];
const npc96PriorPerson=npc9Person;
const NPC96_NAME_FORMS={
 MAREK:/\b(?:marek|marka|markowi|markiem|marku)\b/,
 TOMASZ:/\b(?:tomasz|tomasza|tomaszowi|tomaszem|tomek|tomka|tomkowi)\b/,
 JANUSZ:/\b(?:janusz|janusza|januszowi|januszem)\b/,
 ELZBIETA:/\b(?:elzbieta|elzbiety|elzbiecie|elzbiete|elzbieto)\b/,
 KAMIL:/\b(?:kamil|kamila|kamilowi|kamilem|kamilu)\b/,
 MAGDALENA:/\b(?:magdalena|magdaleny|magdalene|magdalenie|magdo|magda|magdy|magde|magdzie)\b/
};
npc9Person=function(raw){
 const original=npc96PriorPerson(raw);if(original)return original;
 const s=norm(raw);
 for(const c of CONTENT.characters)if(NPC96_NAME_FORMS[c.id]?.test(s))return c.name;
 return null;
};
const NPC96_TYPO_WORDS={
 'widizales':'widziales','widizalas':'widzialas','widizal':'widzial','rozmawiliscie':'rozmawialiscie',
 'rozmawialsicie':'rozmawialiscie','powiedizal':'powiedzial','potwierdzisz':'potwierdzisz',
 'gdize':'gdzie','kidey':'kiedy','pownosci':'pewnosci','nagarnie':'nagranie',
 'zeznaninia':'zeznania','swaidek':'swiadek','swiaedk':'swiadek','pametasz':'pamietasz'
};
function npc96NormalizeIntent(s){return norm(s).split(' ').map(w=>NPC96_TYPO_WORDS[w]||w).join(' ');}
function npc96LastFocus(mem){const f=mem.lastFocus;return f&&f.topic&&!['unknown','social','recall'].includes(f.topic)?f:null;}
function npc96InterpretPart(phrase,mem){
 const s=npc96NormalizeIntent(phrase);
 for(const rule of NPC96_INTENTS){if(rule.r.test(s)){
   if(rule.topic==='_followup'){
     const last=npc96LastFocus(mem);
     return last?{topic:last.topic,focus:'followup',part:phrase,kind:'open'}:null;
   }
   return {topic:rule.topic,focus:rule.focus,part:phrase,kind:/\bczy\b/.test(s)?'yes_no':'open'};
 }}
 return null;
}
const npc96PreviousPlan=npc94BuildPlan;
npc94BuildPlan=function(raw,mem){
 const base=npc96PreviousPlan(raw,mem);
 let units=npc95Split(raw);
 // Korekta tematu przez rozmówcę: "nie o X, tylko o Y".
 const n=norm(raw),contrast=n.match(/\bnie\s+o\s+.{2,65}?\s+tylko\s+o\s+(.+)$/);
 if(contrast)units=[contrast[1]];
 const rebuilt=[];
 const ambiguous=/^(?:a\s+co\s+z\s+(?:tym|tamtym|nia|nim)|a\s+dalej|i\s+dalej|a\s+dlaczego|co\s+potem)\??$/.test(n);
 if(ambiguous&&!npc96LastFocus(mem)){base.parts=[];return base;}
 for(const u of units){
   const corrected=npc96NormalizeIntent(u);
   const explicit=npc96InterpretPart(corrected,mem);
   const previous=npc95StrongMeaning(corrected)||npc94IntentPart(corrected,mem);
   const priority=npc15PriorityIntent(corrected);
   const picked=priority||explicit||previous;
   if(picked?.topic&&picked.topic!=='social')rebuilt.push({...picked,part:u});
 }
 if(rebuilt.length){const seen=new Set();base.parts=rebuilt.filter(x=>{const k=x.topic+'|'+x.focus;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,3);}
 // Krótkie kontynuacje bez jawnego podmiotu — wyłącznie do już ustalonego tematu.
 else if(/^(?:a\s+co\s+z\s+(?:tym|tamtym)|a\s+konkretniej|rozwin|i\s+dalej|a\s+dalej|a\s+czemu|no\s+i\s+co|a\s+dlaczego)\b/.test(n)&&npc96LastFocus(mem)){
  base.parts=[{topic:mem.lastFocus.topic,focus:'followup',part:raw,kind:'open'}];
 }
 return base;
};
// Wynik jest wybierany z gotowych stwierdzeń świadka. Nie powstają nowe miejsca,
// osoby ani godziny; korekty po dowodach są obsługiwane wcześniej przez NPC 9.4.
const NPC96_REPHRASE=[
 [/\bO śmierci Leny dowiedziałem się po alarmie\b/g,'Dopiero po alarmie dowiedziałem się o śmierci Leny'],
 [/\bO śmierci Leny dowiedziałam się po alarmie\b/g,'Dopiero po alarmie dowiedziałam się o śmierci Leny'],
 [/\bNie potrafię\b/g,'Nie umiem'],
 [/\bNie mogę\b/g,'Nie jestem w stanie'],
 [/\bNie mam świadka\b/g,'Nie potrafię wskazać świadka'],
 [/\bProszę porównać\b/g,'Należy zestawić'],
 [/\bNie mam pewności\b/g,'Nie jestem tego pewien'],
 [/\bTrzeba sprawdzić\b/g,'Warto sprawdzić'],
 [/\bNie podam\b/g,'Nie wskażę'],
 [/\bNie wskażę\b/g,'Nie potrafię wskazać'],
 [/\bZapis\b/g,'Ten zapis'],
 [/\bRejestr\b/g,'Sam rejestr'],
 [/\bSam grafik\b/g,'Grafik sam w sobie'],
 [/\bTo nie znaczy\b/g,'Nie wynika z tego']
];
function npc96Rephrase(s,phase,c){
 if(!s||phase===0)return s;
 let out=s;
 // Replace only one safe expression per response; avoid stock prefixes.
 for(let step=0;step<NPC96_REPHRASE.length;step++){
  const [re,to]=NPC96_REPHRASE[(phase+step)%NPC96_REPHRASE.length];
  if(re.test(out)){
   // Gendered rewrites are not applied blindly to female NPCs.
   if(to==='Nie jestem tego pewien'&&c.gender==='f')out=out.replace(re,'Nie jestem tego pewna');
   else out=out.replace(re,to);
   break;
  }
 }
 return out;
}
function npc96Candidates(c,part,original){
 const topic=part.topic,focus=part.focus,f=NPC94_FACTS[c.id],v=c.voice,custom=NPC9_CUSTOM[c.id];
 if(!original)return [];
 // Dokładne godziny, bezpośrednie cytaty, osoby inne niż Lena i fragmenty dowodowe
 // wymagają wiernego brzmienia, a nie odmiany na temat sąsiedni.
 if(focus==='followup'||focus==='death_time'||focus==='precise'||focus==='other_last_witness')return [original];
 if(topic==='relations'&&/\b(?:krawczyk|nowicki|wojcik|zieba|brzozowski|kaczmarek)\b/.test(norm(part.part)))return [original];
 let opts=[original];
 switch(topic){
 case 'alibi':
  opts=[...(NPC95_VARIANTS[c.id].alibi||[]),f.alibi,f.location,f.alibi+' '+f.verify,f.location+' '+f.witness];
  if(focus==='activity')opts=[f.alibi,f.alibi+' '+custom.work,...NPC95_VARIANTS[c.id].alibi];
  if(focus==='alibi_proof')opts=[f.witness,f.witness+' '+f.verify,...NPC95_VARIANTS[c.id].witness];
  break;
 case 'witness':opts=[...NPC95_VARIANTS[c.id].witness,f.witness,f.witness+' '+f.verify];break;
 case 'feeling':opts=[...NPC95_VARIANTS[c.id].feeling,f.emotion,custom.feeling||f.emotion];break;
 case 'source':opts=[...NPC95_VARIANTS[c.id].source,f.source,f.source+' '+f.verify];break;
 case 'what_happened':opts=[f.victim,v.what_happened,f.victim+' '+f.source,f.source+' '+f.victim,f.victim+' '+f.lastvictim,v.what_happened+' '+f.verify,f.victim+' '+f.verify,original];break;
 case 'verification':opts=[f.verify,custom.verification||f.verify,f.verify+' '+f.source,f.verify+' '+f.witness,f.verify+' '+custom.documents,f.verify+' '+f.time,original];break;
 case 'time':opts=[f.time,f.time+' '+f.source,f.time+' '+f.verify,original];break;
 case 'last_seen':opts=[f.last,f.last+' '+f.source,f.last+' '+f.lastvictim,f.last+' '+f.time,original];break;
 case 'victim_last':opts=[f.lastvictim,f.lastvictim+' '+f.source,custom.victim_last||f.lastvictim,f.lastvictim+' '+f.last,original];break;
 case 'conversation':opts=[custom.conversation,custom.conversation+' '+f.source,custom.conversation+' '+f.last,original];break;
 case 'relations':opts=[custom.relations,v.motive,v.compassion||custom.relations,custom.relations+' '+f.source,custom.relations+' '+custom.conversation,custom.relations+' '+f.emotion,original];break;
 case 'culprit':opts=[custom.culprit,custom.culprit+' '+f.source,original];break;
 case 'motive':opts=[v.motive, v.motive+' '+f.source,original];break;
 case 'accountability':opts=[f.responsibility,custom.accountability||f.responsibility,f.responsibility+' '+f.verify,original];break;
 case 'work':opts=[custom.work,custom.work+' '+f.location,custom.work+' '+f.time,original];break;
 default:
  // Fakty z tematów technicznych pozostają dosłowne; zmieniamy jedynie
  // nieszkodliwą konstrukcję zdania, nie treść dokumentów czy dowodów.
  opts=[original];
 }
 const dedup=new Map();for(const s of opts){const clean=String(s||'').replace(/\s+/g,' ').trim();if(clean&&!dedup.has(norm(clean)))dedup.set(norm(clean),clean);}
 return [...dedup.values()];
}
function npc96Similarity(a,b){
 const wa=new Set(norm(a).split(' ').filter(w=>w.length>=4));
 const wb=new Set(norm(b).split(' ').filter(w=>w.length>=4));
 if(!wa.size||!wb.size)return 0;
 let hit=0;for(const w of wa)if(wb.has(w))hit++;
 return hit/Math.max(wa.size,wb.size);
}
function npc96Choose(c,part,mem,candidates){
 if(candidates.length<=1)return candidates[0]||null;
 const m=npc95Memory(mem),key='v96|'+part.topic+'|'+part.focus;
 const turns=m.asked[key]||0; m.asked[key]=Math.min(1000,turns+1);
 const recent=(mem.semantic||[]).filter(x=>x.topic===part.topic&&x.status!=='RETRACTED_AFTER_EVIDENCE'&&x.status!=='CORRECTION_WITH_EVIDENCE').slice(-10).map(x=>x.answer);
 let chosen=null,best=-Infinity;
 const offset=(npc95Hash(norm(part.part))+turns*3)%candidates.length;
 for(let j=0;j<candidates.length;j++){
  const idx=(j+offset)%candidates.length;
  const candidate=npc96Rephrase(candidates[idx],turns%5,c);
  if(!candidate)continue;
  const last=recent.slice(-4);
  const exact=recent.some(x=>norm(x)===norm(candidate));
  const similarity=last.length?Math.max(...last.map(x=>npc96Similarity(x,candidate))):0;
  const score=(exact?-20:0)-2.3*similarity-0.005*candidate.length+0.08*((idx+turns)%3)+0.04*(candidates.length-j);
  if(score>best){best=score;chosen=candidate;}
 }
 return chosen||candidates[0];
}
const npc96BaseOnTopic=npc95OriginalOnTopic; // NPC 9.4: źródłowa odpowiedź bez dopisywanych faktów
npc94OnTopic=function(c,part,plan,mem,person){
 // Odróżniamy pytanie o rozmówcę od pytania o innego pracownika.
 // Dane o własnym alibi nie są odpowiedzią na pytanie o położenie innej osoby.
 if(person&&person!==c.name&&person!=='Lena Rudnicka'&&['alibi','witness','time','motive','culprit'].includes(part.topic))
  return {text:'Nie mam własnej obserwacji potwierdzającej pobyt lub działania wskazanej osoby w tamtym czasie. Potrzebne byłyby niezależne zapisy albo świadkowie.',topic:part.topic,focus:part.focus,person,certainty:'brak własnej obserwacji',source:'ograniczenie wiedzy'};
 if(person==='Lena Rudnicka'&&part.topic==='alibi')
  return {text:'Nie potrafię z własnej obserwacji wskazać, gdzie Lena przebywała w tym czasie. '+NPC94_FACTS[c.id].lastvictim,topic:'victim_last',focus:'route',person,certainty:'brak własnej obserwacji',source:'ograniczenie wiedzy'};
 const r=npc96BaseOnTopic(c,part,plan,mem,person);
 if(!r||!r.text||r.topic==='unknown'||r.topic==='recall')return r;
 if(part.focus==='other_last_witness'){
  r.text='Nie wiem, kto jako ostatni widział Lenę. Mogę powiedzieć tylko o własnym kontakcie: '+NPC94_FACTS[c.id].last;
  return r;
 }
 const precise=npc95PreciseFact(c,part);
 if(precise){r.text=precise;return r;}
 if(part.focus==='followup')return r;
 const list=npc96Candidates(c,part,r.text);
 const picked=npc96Choose(c,part,mem,list);
 if(picked)r.text=picked;
 return r;
};
const npc96OldUnknown=npc94Unknown;
npc94Unknown=function(c,raw){
 const s=norm(raw),m=NPC9_MEMORY[c.id],hist=(m?.semantic||[]).filter(x=>x.topic==='unknown').length;
 // Gdy rozmówca podał nieokreślony zaimek, poproś o doprecyzowanie zamiast zgadywać.
 if(/^(?:a\s+)?(?:co\s+z\s+nim|co\s+z\s+nia|co\s+z\s+tym|i\s+on|i\s+ona|a\s+to|dlaczego\s+to)\??$/.test(s)&&!npc96LastFocus(m||{})){
  return 'Nie wiem, do jakiej osoby lub informacji pan nawiązuje. Proszę wskazać konkretny wątek.';
 }
 const original=npc96OldUnknown(c,raw);
 if(/\b(?:numer|haslo|kod|dokladn)\w*\b/.test(s))return original;
 const endings=[
  'Proszę wskazać, którego zdarzenia dotyczy pytanie.',
  'Jeśli chodzi o zapis, proszę powiedzieć, który konkretnie.',
  'Mogę odróżnić to, co pamiętam, od tego, co wynika z dokumentów.',
  'Nie chcę dopowiadać brakującego szczegółu.',
  'Proszę sprecyzować osobę, miejsce albo godzinę.'
 ];
 if(hist%3===0)return original;
 return original+' '+endings[(hist-1)%endings.length];
};

/* NPC 9.7 — odpowiedz najpierw na pytanie, dopiero potem różnicuj formę.
 * Intencje dotyczące ofiary i własnego alibi są jawnie wiązane z bezpieczną,
 * istniejącą wiedzą postaci. Bez zmian w odblokowywaniu dowodów. */
const NPC97_VERSION='9.7';
function npc97Intent(raw,mem){
 const q=norm(raw);
 if(!q)return null;
 // Pytania o czyjeś alibi nadal podlegają ograniczeniu wiedzy świadka.
 if(/\balibi\b/.test(q)){
  if(/\b(?:obal|podwaz|zweryfik|sprawdz|dowod|wiarygodn)\w*\b/.test(q))
   return {topic:'verification',focus:'alibi_check',part:raw,kind:'open'};
  return {topic:'alibi',focus:'direct_alibi',part:raw,kind:'open'};
 }
 if(/\b(?:co sie stalo|co wydarzylo sie|co zaszlo|co sie wydarzylo)\b/.test(q)&&/\b(?:stanowisk\w*|zajezdni|miejscu zbrodni|tamtej nocy)\b/.test(q))
  return {topic:'what_happened',focus:'case_summary',part:raw,kind:'open'};
 const victim=/\b(?:ofiar\w*|ofier\w*|pokrzywdzon\w*|poszkodowan\w*|motornicz\w*|len\w*|rudnick\w*)\b/.test(q);
 const reference=victim||(/\b(?:ona|niej|jej|nia)\b/.test(q)&&mem?.lastReferent==='Lena Rudnicka');
 if(!reference)return null;
 if(/\b(?:co sie stal\w*|co sie z ni\w* stal\w*|co sie wydarzylo|co zaszlo|co jej sie stalo|jak zgin\w*|jak umarl\w*|smier\w*|zabojstw\w*|atak\w*|obrazen\w*|co jej zrobion\w*)\b/.test(q))
  return {topic:'what_happened',focus:'case_summary',part:raw,kind:'open',person:'Lena Rudnicka'};
 if(/\b(?:czy (?:ja|lene|lena) zn\w*|znales|znalas|znasz|znaliscie|kojarz\w*|jak (?:ja|lene|lena) znal\w*|relacj\w*|stosunk\w*|dogadywal\w*|was laczyl\w*|miedzy wami)\b/.test(q))
  return {topic:'relations',focus:'relationship',part:raw,kind:'open',person:'Lena Rudnicka'};
 if(/\b(?:co (?:powiesz|powiedzialbys|powiedzialabys|sad\w*|mysl\w*|uwaz\w*|wiesz|pamiet\w*|wiadomo)|co (?:mozesz|moze pan|moze pani) (?:mi |nam )?(?:powiedziec|opowiedziec)|powiedz|opowiedz|opisz|scharakteryzuj|jaka byl\w*|kim byl\w*|jaka osob\w*|jak ja wspomin\w*|co o niej|co o tej osobie|o niej co|co to za osob\w*)\b/.test(q))
  return {topic:'lena',focus:'victim_profile',part:raw,kind:'open',person:'Lena Rudnicka'};
 return null;
}
const npc97PreviousPlan=npc94BuildPlan;
npc94BuildPlan=function(raw,mem){
 const plan=npc97PreviousPlan(raw,mem);
 // Nie tłumimy innych niezależnych pytań w wypowiedzi wieloczęściowej.
 const segments=npc95Split(raw),rebuilt=[];
 for(const segment of segments){
  const forced=npc97Intent(segment,mem);
  if(forced)rebuilt.push(forced);
  else {
   const inferred=npc96InterpretPart(segment,mem)||npc95StrongMeaning(segment)||npc94IntentPart(segment,mem);
   if(inferred?.topic&&inferred.topic!=='social')rebuilt.push({...inferred,part:segment});
  }
 }
 if(rebuilt.length){
  const seen=new Set();plan.parts=rebuilt.filter(x=>{const key=x.topic+'|'+x.focus;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,3);
 }
 return plan;
};
const npc97PreviousOnTopic=npc94OnTopic;
npc94OnTopic=function(c,part,plan,mem,person){
 const other=person&&person!==c.name&&person!=='Lena Rudnicka';
 if(part.topic==='alibi'&&part.focus==='direct_alibi'){
  if(other)return npc97PreviousOnTopic(c,part,plan,mem,person);
  const f=NPC94_FACTS[c.id];
  const repeats=(mem.semantic||[]).filter(x=>x.topic==='alibi'&&x.focus==='direct_alibi').length;
  // Żaden wariant nie może usunąć odpowiedzi o tym, co świadek faktycznie robił.
  const bank=NPC95_VARIANTS[c.id].alibi||[];
  const choices=[f.alibi,bank[0],f.alibi+' '+f.verify,bank[1],f.alibi+' '+f.witness,bank[2],f.alibi+' '+f.location].filter(Boolean);
  const answer=choices[repeats%choices.length];
  return {text:answer,topic:'alibi',focus:'direct_alibi',person,certainty:'według relacji świadka',source:'zeznanie świadka'};
 }
 if(part.topic==='lena'&&part.focus==='victim_profile'){
  const f=NPC94_FACTS[c.id],extra=NPC9_CUSTOM[c.id];
  const repeats=(mem.semantic||[]).filter(x=>x.topic==='lena'&&x.focus==='victim_profile').length;
  const source=extra.lena||c.voice.compassion;
  const choices=[source,c.voice.compassion,extra.relations,source+' '+f.victim].filter(Boolean);
  const answer=choices[repeats%choices.length];
  return {text:answer,topic:'lena',focus:'victim_profile',person:'Lena Rudnicka',certainty:'osobiste odczucie i ograniczona wiedza',source:'relacja świadka'};
 }
 return npc97PreviousOnTopic(c,part,plan,mem,person);
};

/* PRZESŁUCHANIA 2.0 — semantic routing with scoped knowledge, Polish inflection,
   contextual follow-ups and answer diversification. No remote APIs or learned lore.
   Existing interrogation, evidence gates, source records and save format are preserved. */
const NPC2_VERSION='2.0';
const NPC2_TOPIC_NAMES={alibi:'miejsce i alibi',witness:'świadkowie',verification:'weryfikacja',source:'źródło informacji',time:'godziny',last_seen:'ostatni kontakt',victim_last:'późniejsza droga Leny',what_happened:'przebieg zdarzenia',relations:'relacje',conversation:'rozmowa z Leną',lena:'Lena Rudnicka',work:'obowiązki',motive:'motyw',culprit:'tożsamość sprawcy',risk:'zgłoszenia BHP',card:'identyfikator',access:'dostęp',messages:'wiadomości',cctv:'monitoring',laboratory:'badania',documents:'dokumentacja',accountability:'odpowiedzialność',feeling:'emocje',recall:'wcześniejsze zeznanie',inference:'interpretacja',hypothesis:'hipotezy'};
// Ordered by specificity. Patterns match inflectional stems after Polish diacritic normalization.
const NPC2_PATTERNS=[
 {topic:'recall',focus:'previous_testimony',priority:160,r:/\b(?:co\s+(?:przed\s+chwila|wczesniej)\s+(?:powiedzial|mowil)|przypomnij\s+(?:mi\s+)?(?:swoj|co\s+powiedzial)|jak\s+brzmial\w*\s+(?:twoj|pana|pani)\s+zeznan|powtorz\s+(?:ostatnia|poprzednia)\s+odpowiedz)\b/},
 {topic:'what_happened',focus:'death_time',priority:150,r:/\b(?:o\s+ktorej|kiedy|jaka\s+godzin)\b.*\b(?:umarl|zgin|smierc|zgon|zaboj|zamord)\w*/},
 {topic:'last_seen',focus:'last_meeting',priority:144,r:/\b(?:kiedy|gdzie|ktora\s+godzin|ostatni\w*)\b.*\b(?:widział|widzial|spotkal|rozmawial|kontakt)\w*.*\b(?:len|nia|jej|motornicz)\w*|\b(?:ostatni\w*\s+(?:raz|kontakt|spotkan|rozmow))\b/},
 {topic:'victim_last',focus:'route',priority:145,r:/\b(?:gdzie|dokad|ktoredy)\b.*\b(?:byla|byl|len\w*|ona|jej|nia)\b.*\b(?:po\s+rozmow|potem|pozniej|tej\s+nocy)\b|\b(?:dokad|gdzie|ktoredy|co)\b.*\b(?:len|ona|nia|jej)\w*.*\b(?:poszl|ruszyl|poszedl|udaw|przemieszcz|potem|pozniej)\w*|\b(?:co\s+dalej\s+z\s+lena|gdzie\s+poszla\s+po\s+rozmowie)\b/},
 {topic:'witness',focus:'independent_person',priority:142,r:/\b(?:kto|ktos|ktora\s+osob|jaki\s+swiadek)\b.*\b(?:potwierdz|poswiadcz|widzial|widz|zarecz|reczyl|widzac)\w*|\b(?:masz|mial\w*)\b.*\b(?:swiadk|alibi)\w*|\b(?:kto\s+za\s+(?:toba|ciebie|pana|pania)\s+recz)\w*/},
 {topic:'verification',focus:'digital_presence',priority:143,r:/\b(?:sesj|online|wideokonferenc|zalogowan|polaczen|komputer)\w*.*\b(?:obecn|fizyczn|caly\s+czas|stale|rzeczywisc|alibi|dowodz)\w*|\b(?:obecn|alibi)\w*.*\b(?:sesj|online|komputer)\w*/},
 {topic:'source',focus:'direct_or_reported',priority:140,r:/\b(?:skad|od\s+kogo|na\s+jakiej\s+podstawie)\b.*\b(?:wiesz|wiedz|informac|slysz|dowiedz|wiadom|pewn)\w*|\b(?:sam|sama|osobiscie|naocznie|wlasne\s+oczy)\b.*\b(?:widzial|zobacz|widz|wiesz)\w*|\b(?:swiadkiem\s+byl|swiadkiem\s+byla)\b/},
 {topic:'verification',focus:'how_to_verify',priority:136,r:/\b(?:jak|czym|co|ktory\w*|gdzie)\b.*\b(?:potwierdz|sprawdz|zweryfik|udowodn|porown|weryfik|wyklucz)\w*|\b(?:co\s+potwierdza\s+twoje\s+slowa|jakie\s+masz\s+dowody)\b/},
 {topic:'time',focus:'precise',priority:130,r:/\b(?:o\s+ktorej|ktora\s+godzin|w\s+jakich\s+godzin|kiedy\s+dokladn|o\s+jakiej\s+porze|dokladn\w*\s+minut)\b/},
 {topic:'alibi',focus:'location',priority:133,r:/\b(?:gdzie|ktoredy|dokad|w\s+jakim\s+miejscu)\b.*\b(?:byl|bylas|byles|przebywal|siedzial|chodzil|poszedl|pracowal|znajdowal|krec\w*|tamtej\s+nocy|wtedy)\b/},
 {topic:'alibi',focus:'direct_alibi',priority:132,r:/\b(?:alibi|gdzie\s+byles|gdzie\s+bylas|co\s+robil\w*\s+(?:tej|tamtej)\s+nocy|co\s+robil\w*\s+o\s+(?:01|02)|przebieg\w*\s+twoj\w*\s+dyzur)\b/},
 {topic:'conversation',focus:'conversation_content',priority:137,r:/\b(?:o\s+czym|co|jak)\b.*\b(?:rozmawial|gadali|powiedzial|mowila|mowiles|mowilas|uslyszal|powiedziala)\w*.*\b(?:len|jej|nia|ona|miedzy\s+wami)\w*|\b(?:ostatnia\s+rozmowa\s+z\s+lena|co\s+lena\s+ci\s+powiedziala)\b/},
 {topic:'relations',focus:'relationship',priority:130,r:/\b(?:znales|znalas|znasz|kojarz\w*|lubiles|lubialas|dogadywal\w*|relacj\w*|stosunk\w*|miedzy\s+wami|co\s+was\s+laczylo|poklocil\w*|konflikt\w*|zatarg\w*)\b.*\b(?:len|nia|jej|ona|wspolprac|was|wami)?/},
 {topic:'lena',focus:'victim_profile',priority:120,r:/\b(?:jaka\s+byla\s+lena|kim\s+byla\s+lena|opowiedz\s+o\s+lenie|co\s+mysl\w*\s+o\s+lenie|co\s+sad\w*\s+o\s+lenie|jak\s+ja\s+wspominasz|jaka\s+osoba\s+byla)\b/},
 {topic:'feeling',focus:'grief',priority:122,r:/\b(?:teskni\w*|zal\w*|smutn\w*|przezyw\w*|wyrzut\w*|czuj\w*|bol\w*|spac\w*|koszmar\w*|sni\w*|wstrzas\w*)\b.*\b(?:len|smierc|traged|tym|po\s+tym|tej\s+nocy|zgin\w*)\b|\b(?:jak\s+sie\s+z\s+tym\s+czujesz)\b/},
 {topic:'messages',focus:'correspondence',priority:125,r:/\b(?:wiadomosc|wiadomosci|sms|nadawc|odbiorc|wyslal|wyslala|zaproszen|korespondencj)\w*\b/},
 {topic:'cctv',focus:'footage',priority:126,r:/\b(?:cctv|kamer\w*|monitoring\w*|nagran\w*|film\w*\s+z\s+kamery)\b/},
 {topic:'card',focus:'badge',priority:126,r:/\b(?:t\s*17|identyfikator\w*|przepustk\w*|karty\s+dostepu|karta\s+dostepu)\b/},
 {topic:'access',focus:'route',priority:125,r:/\b(?:czytnik\w*|wejsc\w*\s+(?:boczn|poludni|na\s+hale)|drzwi\w*|dostep\w*\s+do\s+hali)\b/},
 {topic:'risk',focus:'report',priority:124,r:/\b(?:bhp|zagrozen\w*|bezpieczenstw\w*|usterk\w*\s+zgloszon\w*|zgloszeni\w*\s+ryzyka)\b/},
 {topic:'laboratory',focus:'forensics',priority:127,r:/\b(?:laboratori\w*|probk\w*|smar\w*|wlo\w*|mikroslad\w*|obrazen\w*|sekcj\w*|medycyn\w*\s+sadow)\b/},
 {topic:'documents',focus:'diagnostics',priority:129,r:/\b(?:log\w*|pakiet\w*|dziennik\w*)\b.*\b(?:diagnostyczn\w*|tcms|serwisow\w*|wagon\w*|sesj\w*)\b|\b(?:tcms|diagnostyczn\w*)\b.*\b(?:log\w*|pakiet\w*)\b/},
 {topic:'documents',focus:'records',priority:119,r:/\b(?:dokument\w*|kart\w*\s+pracy|grafik\w*|podpis\w*|raport\w*|protokol\w*|korek\w*\s+grafiku|rejestr\w*|histori\w*\s+zmian)\b/},
 {topic:'accountability',focus:'responsibility',priority:124,r:/\b(?:twoj\w*|pana|pani|czyj\w*)\b.*\b(?:wina|odpowiedzialn|zaniedban\w*|obowiazk\w*)\b/},
 {topic:'motive',focus:'possible_motive',priority:127,r:/\b(?:motyw\w*|po\s+co\s+ktos\s+mialby\w*|kto\s+na\s+tym\s+zyskal|komu\s+zalezalo|dlaczego\s+ktos\s+moglby\w*\s+ja)\b/},
 {topic:'culprit',focus:'identity',priority:131,r:/\b(?:kto\s+(?:ja\s+)?zabil|kto\s+zamordowal|kto\s+to\s+zrobil|kto\s+jest\s+sprawca|kto\s+byl\s+napastnikiem)\b/},
 {topic:'what_happened',focus:'case_summary',priority:100,r:/\b(?:co\s+sie\s+stalo|co\s+sie\s+wydarzylo|co\s+zaszlo|co\s+wiesz\s+o\s+sprawie|jak\s+zginela\s+lena|co\s+jej\s+sie\s+stalo)\b/}
];
function npc2Tokens(s){return norm(s).split(' ').filter(x=>x.length>1);}
function npc2Similarity(a,b){const x=new Set(npc2Tokens(a).filter(t=>t.length>3)),y=new Set(npc2Tokens(b).filter(t=>t.length>3));if(!x.size||!y.size)return 0;let overlap=0;for(const t of x)if(y.has(t))overlap++;return overlap/Math.max(x.size,y.size);}
function npc2Split(q){
 const s=String(q||'').trim();
 const seg=npc95Split(s).flatMap(p=>p.split(/(?:\s*[?;!]+\s*)/)).map(x=>x.trim()).filter(Boolean);
 return (seg.length?seg:[s]).slice(0,4);
}
function npc2Pronoun(mem,s){
 if(/\b(?:lena|lene|leny|lenie|len|rudnick|ofiara|ofiary|ofierze)\w*\b/.test(s))return 'Lena Rudnicka';
 if(/\b(?:ona|jej|nia|niej)\b/.test(s))return mem?.lastReferent==='Lena Rudnicka'?'Lena Rudnicka':null;
 return null;
}
function npc2Classify(raw,mem){
 const s=norm(raw);if(!s)return null;
 const prev=mem?.lastFocus||null,ref=npc2Pronoun(mem,s);
 if(ref==='Lena Rudnicka'&&/\b(?:gdzie|dokad|ktoredy)\b/.test(s)&&/\b(?:po|potem|pozniej|dalej)\b/.test(s))return {topic:'victim_last',focus:'route',part:raw,priority:172,person:ref};
 if(/^(?:a\s+)?(?:skad\s+(?:to\s+)?wiesz|skad\s+(?:ta\s+)?pewnosc|kto\s+to\s+potwierdzi|kto\s+cie\s+widzial|kto\s+pan\w*\s+widzial|czym\s+to\s+udowodnisz)\s*$/.test(s))return {topic:/\bkto\b/.test(s)?'witness':'source',focus:/\bkto\b/.test(s)?'independent_person':'direct_or_reported',part:raw,kind:'followup',priority:170};
 if(/^(?:a\s+)?(?:dlaczego|czemu|po\s+co|a\s+konkretniej|rozwin|co\s+masz\s+na\s+mysli|i\s+co\s+dalej|a\s+potem|co\s+potem|i\s+co\s+z\s+tego|co\s+z\s+tym)\s*$/.test(s)){
  if(prev?.topic)return {topic:prev.topic,focus:'followup',part:raw,kind:'followup',priority:169};
  return null;
 }
 if(/^(?:a\s+)?(?:kiedy|o\s+ktorej)\s*$/.test(s)&&prev?.topic)return {topic:prev.topic==='what_happened'?'time':prev.topic,focus:'precise',part:raw,kind:'followup',priority:160};
 let best=null;
 for(const p of NPC2_PATTERNS){if(p.r.test(s)&&(!best||p.priority>best.priority))best=p;}
 if(!best)return null;
 // Asking about the victim's whereabouts must never silently turn into the witness's alibi.
 if(best.topic==='alibi'&&ref&&/\b(?:gdzie|dokad|ktoredy)\b/.test(s)&&!/(?:ty|pan|pani|was|twoj|pana|pani)/.test(s))return {topic:'victim_last',focus:'route',part:raw,priority:153};
 return {topic:best.topic,focus:best.focus,part:raw,priority:best.priority,kind:'open',...(ref?{person:ref}:{})};
}
const npc2PreviousPlan=npc94BuildPlan;
npc94BuildPlan=function(raw,mem){
 const plan=npc2PreviousPlan(raw,mem);
 if(plan.act==='recall'||plan.act==='apology')return plan;
 const segments=npc2Split(raw),rebuild=[];
 for(const segment of segments){
  const own=npc2Classify(segment,mem);
  const previous=npc97Intent(segment,mem)||npc96InterpretPart(segment,mem)||npc95StrongMeaning(segment)||npc94IntentPart(segment,mem);
  const part=own?.priority>=124?own:previous?.topic?{...previous,part:segment}:own;
  if(part?.topic&&part.topic!=='social')rebuild.push(part);
 }
 if(rebuild.length){
  const seen=new Set();plan.parts=rebuild.filter(p=>{const key=p.topic+'|'+p.focus;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,3);
 }
 return plan;
};
const npc2PreviousOnTopic=npc94OnTopic;
const NPC2_VOICE={
 MAREK:['Proszę rozróżnić dwie rzeczy: ','W dokumentacji łatwo pomylić zakres zapisu z obecnością człowieka. ','Mówiąc precyzyjnie: '],
 TOMASZ:['Nie mam zamiaru tego upiększać. ','Z meldunku wynika jedno, z mojej pamięci drugie. ','Krótko mówiąc: '],
 JANUSZ:['Na warsztacie sprawa wygląda tak: ','Nie będę dorabiał historii do papierów. ','Od technicznej strony: '],
 ELZBIETA:['Muszę oddzielić to, co pamiętam, od zapisu. ','W tej kwestii wolę być dokładna. ','Powiem tylko tyle, ile mogę potwierdzić: '],
 KAMIL:['Z samych logów nie wyczytasz wszystkiego. ','Technicznie rzecz biorąc: ','Dobra, rozdzielmy dane od domysłów. '],
 MAGDALENA:['Nie utożsamiajmy dokumentu z osobą. ','Proszę zachować rozróżnienie między zapisem a interpretacją. ','W świetle dokumentacji: ']
};
function npc2GroundedVariants(c,part,mem){
 const f=NPC94_FACTS[c.id],custom=NPC9_CUSTOM[c.id],topic=part.topic,focus=part.focus;
 const all={
  alibi:[f.alibi,f.location,f.alibi+' '+f.verify],
  witness:[f.witness,f.witness+' '+f.verify],
  source:[f.source,f.source+' '+f.verify],
  verification:[f.verify,f.verify+' '+f.source],
  time:[f.time,f.time+' '+f.source],
  last_seen:[f.last,f.last+' '+f.source],
  victim_last:[f.lastvictim,f.lastvictim+' '+f.source],
  what_happened:[f.victim,f.victim+' '+f.source],
  conversation:[custom.conversation,custom.conversation+' '+f.source],
  accountability:[f.responsibility,f.responsibility+' '+f.verify],
  work:[custom.work,custom.work+' '+f.location]
 };
 let pool=all[topic];
 if(topic==='verification'&&focus==='digital_presence')pool=[f.verify,f.alibi+' '+f.verify];
 if(topic==='alibi'&&focus==='location')pool=[f.location,f.location+' '+f.witness];
 if(topic==='alibi'&&focus==='direct_alibi')pool=[f.alibi,f.alibi+' '+f.verify,f.alibi+' '+f.witness];
 if(topic==='witness'&&focus==='independent_person')pool=[f.witness,f.witness+' '+f.verify];
 if(!pool)return null;
 const used=(mem.semantic||[]).filter(x=>x.topic===topic&&x.answer).slice(-8).map(x=>x.answer);
 const candidates=pool.filter(x=>typeof x==='string'&&x.trim());
 if(!candidates.length)return null;
 const ranked=candidates.map((text,i)=>({text,i,similar:used.length?Math.max(...used.map(a=>npc2Similarity(text,a))):0})).sort((a,b)=>a.similar-b.similar||a.i-b.i);
 return ranked[0].text;
}
npc94OnTopic=function(c,part,plan,mem,person){
 const r=npc2PreviousOnTopic(c,part,plan,mem,person);
 if(!r?.text||part.topic==='recall'||part.topic==='unknown'||!NPC94_FACTS[c.id])return r;
 const q=norm(part.part||''),f=NPC94_FACTS[c.id];
 const other=person&&person!==c.name&&person!=='Lena Rudnicka';
 // Do not override safe answers about somebody else's movements, or specific evidence corrections.
 if(other)return r;
 if(part.topic==='source'&&/\b(?:atak\w*|napa\w*|zabojstw\w*|zabil\w*|zamord\w*)\b/.test(q)&&/\b(?:widzial\w*|widziel\w*|sam|sama|osobiscie|naocznie)\b/.test(q)){
  r.text=f.victim+' '+f.source;return r;
 }
 if(part.topic==='documents'&&part.focus==='diagnostics'){
  r.text=(NPC9_CUSTOM[c.id].documents||f.source)+' '+f.verify;return r;
 }
 if(part.topic==='risk'&&c.id==='ELZBIETA'&&/\b(?:zglosz\w*|wyslan\w*|wysyl\w*|dostarcz\w*)\b/.test(q)){
  r.text=NPC9_CUSTOM[c.id].documents+' '+f.verify;return r;
 }
 if(part.focus==='followup'){
  if(/^\s*(?:a\s+)?(?:dlaczego|czemu|po\s+co)/.test(q)){
   if(part.topic==='alibi'||part.topic==='witness'||part.topic==='time')r.text=f.verify;
   else if(part.topic==='verification')r.text=f.alibi+' '+f.verify;
   else if(part.topic==='last_seen'||part.topic==='victim_last')r.text=f.lastvictim+' '+f.source;
   else if(part.topic==='conversation')r.text=NPC9_CUSTOM[c.id].conversation+' '+f.source;
   else if(part.topic==='feeling')r.text=f.emotion;
  }else if(/\b(?:konkretniej|rozwin|co\s+potem|co\s+dalej)\b/.test(q)){
   if(part.topic==='alibi')r.text=f.location+' '+f.verify;
   else if(part.topic==='what_happened')r.text=f.victim+' '+f.source;
   else if(part.topic==='conversation')r.text=NPC9_CUSTOM[c.id].conversation+' '+f.last;
  }
  return r;
 }
 const exact=npc95PreciseFact(c,part);
 if(exact)return {...r,text:exact};
 if(['alibi','witness','source','verification','time','last_seen','victim_last','what_happened','conversation','accountability','work'].includes(part.topic)){
  const grounded=npc2GroundedVariants(c,part,mem);
  if(grounded)r.text=grounded;
 }
 return r;
};
// Keep the original writer of evidence gates, discourse memory, trust and testimony.
const npc2LegacyAnswer=npc94Answer;
function npc2Answer(c,raw,attached){
 const mem=NPC9_MEMORY[c.id];npc94Ensure(mem);
 const q=String(raw||'').trim();
 const prior=mem.semantic.length;
 const output=npc2LegacyAnswer(c,q,attached);
 if(typeof output!=='string')return String(output||'');
 const newRecords=mem.semantic.slice(prior).filter(x=>x.status==='TESTIMONY'||x.status==='LIMITED_KNOWLEDGE');
 // No new facts from confidence or style selection; avoid prefixes on evidence challenges.
 if(attached||!newRecords.length||output.length>820||newRecords.some(x=>x.topic==='unknown'||x.topic==='recall'))return output;
 const key=newRecords.map(x=>x.topic+'|'+x.focus).join(',');
 const priorHits=mem.semantic.slice(0,prior).filter(x=>newRecords.some(r=>r.topic===x.topic)).length;
 if(priorHits<1||priorHits%3!==0)return output;
 const parts=NPC2_VOICE[c.id]||[];
 const lead=parts[Math.floor(priorHits/3)%parts.length]||'';
 return lead+output;
}
function npc9Answer(c,raw,attached){return npc2Answer(c,raw,attached);}
window.NPC2_QA={version:NPC2_VERSION,parse:(q,id='MAREK')=>npc2Classify(q,NPC9_MEMORY[id]||{}),plan:(q,id='MAREK')=>npc94BuildPlan(q,NPC9_MEMORY[id]||{}),topics:NPC2_TOPIC_NAMES,stats:()=>({version:NPC2_VERSION,characters:CONTENT.characters.length,semanticMemory:Object.fromEntries(CONTENT.characters.map(c=>[c.id,NPC9_MEMORY[c.id]?.semantic?.length||0]))})};


/* PRZESŁUCHANIA 3.0 — independent semantic frame analysis + grounded compositional generation.
   This is a constrained offline discourse engine, NOT an unrestricted language model.
   Keeps NPC9 evidence gate, confessions, conversation state and saving intact. */
const NPC3_VERSION='3.0-offline';
const NPC3_TOPICS={
  alibi:[/\balibi\b/,/\b(?:gdzie|dokad|ktoredy)\b.*\b(?:byl|byla|przebywal|przebywalas|znajdowal|spacerowal|poszedl|poszla|wyszedl|wyszla)\w*/,/\bco\s+(?:robil|robilas)\w*\b/,/\b(?:twoj|pana|pani)\b.*\b(?:obecnosc|pobyt|miejsce|ruch)\b/],
  witness:[/\b(?:swiadk|potwierdz|widzial\w*\s+(?:cie|pana|pania))\w*/,/\bkto\b.*\b(?:widzial|zauwazyl|pomoze|potwierdzi)\w*/],
  source:[/\bskad\b.*\b(?:wiesz|wiadom|pewnos|informac)/,/\b(?:zrodlo|dowiedzial|uslyszal|skad\s+masz)\w*/,/\b(?:osobiscie|naocznie|wlasnymi\s+oczami)\b.*\b(?:widz|byl)/],
  verification:[/\b(?:jak|czym)\b.*\b(?:sprawdz|zweryfik|udowodn|potwierdz)/,/\b(?:weryfik|porowna|sprawdzic|czytnik\s+potwierdza)\w*/],
  time:[/\b(?:kiedy|godzin|ktorej|minucie|czasie|chronolog|przedzial|dokladnie)\b/,/\b(?:o\s+\d{1,2}[:.]\d{2}|\d{1,2}[:.]\d{2})\b/],
  last_seen:[/\b(?:ostatni\w*|ostatnio)\b.*\b(?:widz|spotk|rozmaw|zyw|kontakt)/,/\bkiedy\b.*\b(?:widz|spotk|rozmaw)\w*.*\blen/],
  victim_last:[/\b(?:gdzie|dokad|ktoredy|jak\s+poszla)\b.*\b(?:lena|leny|lene|ona|jej)\b/,/\b(?:lena|leny|lene|ona|jej)\b.*\b(?:poszla|ruszyla|wracala|przeszla|potem|pozniej|dalej)\b/],
  what_happened:[/\b(?:zdarzen|wypad|smierc|zgon|alarm|atak|zabojstw|znalezion|nie\s+zyje)\w*/,/\bco\b.*\b(?:stalo|zaszlo|wydarzylo)\b/],
  conversation:[/\b(?:rozmow|powiedzial\w*\s+(?:ci|panu|pani)|rozmawiali|mowila\s+ci|gadali)\w*.*\b(?:lena|leny|lene|nia)\b/,/\blena\b.*\b(?:mowila|powiedziala|rozmawiala)\b/,/\b(?:co|o\s+czym)\s+(?:powiedziala|mowila|rozmawiala)\b.*\b(?:ci|panu|pani|z\s+toba)\b/],
  relations:[/\b(?:relacj|znajomosc|konflikt|klocil|klocilas|dogadywal)\w*/,/\b(?:co\s+myslisz|jak\s+oceniasz)\b.*\b(?:len|marek|kamil|tomasz|magdalen|elzbiet|janusz)/],
  motive:[/\b(?:motyw|korzysc|zyskal|dlaczego\s+ktos|powod\s+zaboj|chcial\s+zabic)\w*/],
  culprit:[/\bkto\b.*\b(?:zabil|zamordowal|napadl|sprawca|morderca)\b/,/\b(?:tozsamosc\s+sprawcy|wiesz\s+kto\s+zabil)\b/],
  risk:[/\b(?:bhp|zagrozen|ryzyk|bezpiecz|usterk|alarm\s+tcms)\w*/],
  card:[/\b(?:t\s*17|karta\s+dostep|przepust|identyfikator)\w*/],
  access:[/\b(?:czytnik|wejsc|drzw|przejsc|trasa|korytarz|dostep)\w*/],
  cctv:[/\b(?:kamer|cctv|monitoring|nagrani|rejestrator)\w*/],
  messages:[/\b(?:sms|wiadomosc|korespondenc|wyslal|nadawca|zaproszenie)\w*/],
  laboratory:[/\b(?:laboratori|probk|wlokn|smar|odcisk|obrazen|medycyn\s+sadow)\w*/],
  documents:[/\b(?:dokument|protokol|raport|formularz|logi|dziennik|rejestr|tcms|archiwum|zlecenie|karta\s+pracy)\w*/],
  work:[/\b(?:obowiaz|pracowal|praca|funkcj|zajmowal|dyzur|zmian)\w*/],
  accountability:[/\b(?:win|odpowiedzialn|zaniedban|mogl\s+zapobiec)\w*/],
  feeling:[/\b(?:czuj|smut|zal|boisz|wyrzut|przykro|teskn|emocj|przezywa)\w*/],
  lena:[/\b(?:kim\s+byla|jaka\s+byla|co\s+o\s+niej\s+myslisz)\b/],
  inference:[/\b(?:czy\s+to\s+oznacza|wynika\s+z\s+tego|wywnioskowac|wniosek|implikacj)\w*/],
  hypothesis:[/\b(?:mozliwe\s+ze|zakladajac|hipotez|moglo\s+byc|a\s+jesli)\w*/]
};
const NPC3_WEIGHT={culprit:6,conversation:5,last_seen:5,victim_last:5,witness:4,source:4,verification:3,what_happened:3,alibi:4,time:1.9,documents:2,relations:3,risk:2};
const NPC3_FACT_MAP={alibi:['alibi','location','witness'],witness:['witness','verify'],source:['source','verify'],verification:['verify','source'],time:['time','verify'],last_seen:['last','source'],victim_last:['lastvictim','last'],what_happened:['victim','source'],conversation:['conversation','source'],relations:['relations','lena'],motive:['motive','relations'],culprit:['culprit'],risk:['risk','documents'],card:['card','access'],access:['access','card'],cctv:['cctv','source'],messages:['messages','source'],laboratory:['laboratory','source'],documents:['documents','archive'],work:['work','location'],accountability:['responsibility','accountability'],feeling:['emotion','feeling'],lena:['lena','relations'],inference:['inference','hypothesis'],hypothesis:['hypothesis','inference']};
const NPC3_LIMIT_TOPICS=new Set(['culprit','messages','card','laboratory','what_happened','last_seen','victim_last']);
const NPC3_ACT_HINT={confirmation:/\b(?:czy|naprawde|rzeczywiscie)\b/,cause:/\b(?:dlaczego|czemu|z\s+jakiego\s+powodu)\b/,source:/\b(?:skad|od\s+kogo|na\s+jakiej\s+podstawie)\b/,proof:/\b(?:potwierdz|udowodn|zweryfik|dowod)\w*/,time:/\b(?:kiedy|o\s+ktorej|godzin|minuta)\b/,location:/\b(?:gdzie|dokad|ktoredy)\b/,identity:/\b(?:kto|kim|czyj)\b/,comparison:/\b(?:porownaj|roznic|a\s+nie|zamiast|kontra)\b/};
function npc3Subject(s,mem,c){
 const explicit=npc9Person(s);if(explicit)return explicit;
 if(/\b(?:lena|lene|leny|lenie|rudnick|ofiara)\w*\b/.test(s))return 'Lena Rudnicka';
 if(/\b(?:twoj|twoja|ciebie|twoje|ty|pana|pani|byles|bylas|widziales|widzialas|robiles|robilas)\b/.test(s))return c?.name||'witness';
 if(/\b(?:ona|jej|nia|niej)\b/.test(s))return mem.lastReferent||'Lena Rudnicka';
 return null;
}
function npc3Frame(part,mem,c){
 const s=norm(npc96NormalizeIntent(part)); const prev=mem?.lastFocus||null;
 const follow=/^(?:a\s+)?(?:dlaczego|czemu|skad\s+to\s+wiesz|co\s+dalej|a\s+potem|kto\s+to\s+potwierdzi|a\s+konkretniej|rozwin|kiedy|o\s+ktorej|co\s+z\s+tym)\s*$/.test(s);
 const subject=npc3Subject(s,mem,c);
 const intents=Object.entries(NPC3_ACT_HINT).filter(([,rx])=>rx.test(s)).map(([k])=>k);
 const clauses=s.split(/\s+(?:ale|jednak|chociaz|mimo\s+ze)\s+/);
 const negated=/(?:\bnie\s+(?:byl|byla|widzial|zabil|wyslal|mowil|twierdzil|potwierdza)|\bnigdy\b|\bbez\b)/.test(s);
 const assertion=/(?:\b(?:przyznal|przyznalas|przyznales)\b.*\b(?:zaboj|zabil)|\b(?:powiedzialas|powiedziales|twierdzilas|twierdziles)\b.*\b(?:zabil|zamordowal))/ .test(s);
 const scores=[];
 for(const [topic,rules] of Object.entries(NPC3_TOPICS)){
  let hits=0;for(const re of rules)if(re.test(s))hits++;
  if(!hits)continue;
  if(topic==='lena'&&!/\b(?:lena|leny|lene|niej|ofiara|rudnick)\w*\b/.test(s))continue;
  let score=hits*3+(NPC3_WEIGHT[topic]||0);
  if(topic==='alibi'&&subject==='Lena Rudnicka')score-=9;
  if(topic==='victim_last'&&subject==='Lena Rudnicka')score+=7;
  if(topic==='last_seen'&&/\b(?:ostatn|ostatni|widzial|spotkal)/.test(s)&&subject==='Lena Rudnicka')score+=5;
  if(topic==='source'&&intents.includes('source'))score+=3;
  if(topic==='witness'&&intents.includes('identity'))score+=1;
  if(topic==='time'&&/\b(?:zgon|zaboj|smierc)\w*/.test(s))score-=5;
  if(topic==='what_happened'&&/\b(?:zgon|zaboj|smierc)\w*/.test(s))score+=3;
  if(topic==='documents'&&/\b(?:log|tcms|diagnost)\w*/.test(s))score+=3;
  scores.push({topic,score,hits});
 }
 // Specific assertions and the objects they concern outrank generic words such as "when", "document" or "source".
 if(/\b(?:tcms|diagnost|logi)\w*\b/.test(s)&&/\b(?:sabotaz|celow|usterk|awari|bezpiecz)\w*/.test(s))scores.push({topic:'risk',score:36,hits:2});
 if(/\b(?:tcms|diagnost)\w*\b/.test(s)&&/\b(?:test|alarm|autoryzac|prob|sesj|diagnoz)\w*/.test(s))scores.push({topic:'risk',score:38,hits:2});
 if(/\b(?:co\s+powiedziala|co\s+mowila|o\s+czym\s+mowila)\b/.test(s)&&/\b(?:ci|panu|pani|lena|leny|lene)\b/.test(s))scores.push({topic:'conversation',score:35,hits:2});
 if(/\bkto\b/.test(s)&&/\b(?:potwierdz|zweryfik|widzial)\w*/.test(s)&&/\b(?:alibi|obecnosc|pobyt)\b/.test(s))scores.push({topic:'witness',score:37,hits:2});
 if(/\b(?:skad|pewnosc|potwierdz)\b/.test(s)&&/\b(?:kart|t 17|przepust)\w*/.test(s))scores.push({topic:'card',score:36,hits:2});
 if(/\b(?:ostatni|ostatnio)\w*\b/.test(s)&&/\b(?:widzial|spotk|rozmaw|zyw)\w*/.test(s)&&/\b(?:lena|leny|lene)\b/.test(s))scores.push({topic:'last_seen',score:34,hits:2});
 scores.sort((a,b)=>b.score-a.score||a.topic.localeCompare(b.topic));
 let best=scores[0]||null;
 if(follow&&prev?.topic){best={topic:(/\bkto\b/.test(s)?'witness':/\bskad\b/.test(s)?'source':/\b(?:potem|dalej)\b/.test(s)&&prev.topic==='last_seen'?'victim_last':prev.topic),score:20,hits:1};}
 if(/^\s*(?:a\s+)?(?:powtorz|przypomnij|co\s+powiedzial\w*\s+wczesniej)/.test(s))best={topic:'recall',score:30,hits:2};
 let focus=follow?'followup':intents.includes('proof')?'proof':intents.includes('location')?'location':intents.includes('time')?'time':intents.includes('source')?'origin':'general';
 const ambiguous=!!best && !follow && !!scores[1] && best.score-scores[1].score<1.2;
 return {part,normalized:s,subject,intents,negated,assertion,contrast:clauses.length>1,followup:follow,topic:best?.topic||null,focus,confidence:!best?0:ambiguous?.42:Math.min(.98,.46+best.score/38),candidates:scores.slice(0,4)};
}
function npc3Meaning(text,c,mem){
 const chunks=npc2Split(String(text||'')).flatMap(x=>x.split(/\s+\b(?:i|oraz|a)\s+(?=(?:co|kto|kiedy|gdzie|czy|dlaczego|czemu|jak|o\s+ktorej|skad)\b)/i)).map(x=>x.trim()).filter(Boolean).slice(0,4);
 const frames=chunks.map(x=>npc3Frame(x,mem,c));
 const topics=[...new Set(frames.map(f=>f.topic).filter(Boolean))];
 return {frames,topics,whole:{act:npc9Tone(text),multi:frames.length>1,assertion:frames.some(f=>f.assertion),negated:frames.some(f=>f.negated),contrast:frames.some(f=>f.contrast),subject:frames.find(f=>f.subject)?.subject||null,confidence:frames.length?frames.reduce((s,f)=>s+f.confidence,0)/frames.length:0}};
}
// Independent parser provides an additional reading, but fails closed when uncertain.
const npc3OriginalPlan=npc94BuildPlan;
npc94BuildPlan=function(raw,mem){
 const original=npc3OriginalPlan(raw,mem);
 if(original.act==='apology'||original.act==='recall'||original.act==='challenge')return original;
 const c=CONTENT.characters.find(x=>NPC9_MEMORY[x.id]===mem)||null;
 const meaning=npc3Meaning(raw,c,mem);const augmented=[];
 for(const f of meaning.frames){
  const legacy=original.parts.find(p=>norm(p.part||'')===norm(f.part))||null;
  // Keep the legacy result for unfamiliar cases; never turn ambiguity into invented certainty.
  const useNew=f.topic&&f.confidence>=.59;
  const part=useNew?{topic:f.topic,focus:f.focus,part:f.part,kind:f.followup?'followup':'open',person:f.subject,semantic3:true}:legacy;
  if(part?.topic&&part.topic!=='social')augmented.push(part);
 }
 if(augmented.length){const unique=[],keys=new Set();for(const p of augmented){const key=p.topic+'|'+p.focus;if(!keys.has(key)){keys.add(key);unique.push(p);}}original.parts=unique.slice(0,3);}
 return original;
};
function npc3FactBank(c){
 const facts=NPC94_FACTS[c.id]||{},other=NPC9_CUSTOM[c.id]||{},result=new Map();
 const add=(key,v,origin)=>{if(typeof v!=='string'||!v.trim())return;const text=v.trim().replace(/\s+/g,' ');const atoms=text.match(/[^.!?]+(?:[.!?]+|$)/g)||[text];
  result.set(key,{key,origin,text,atoms:atoms.map(x=>x.trim()).filter(x=>x.length>10)});
 };
 for(const [k,v] of Object.entries(facts))add(k,v,'wiedza świadka');
 for(const [k,v] of Object.entries(other))if(!result.has(k))add(k,v,'wiedza świadka');
 return result;
}
const NPC3_BANKS=new Map(CONTENT.characters.map(c=>[c.id,npc3FactBank(c)]));
const NPC3_TRANSITIONS={MAREK:['Mówiąc dokładniej: ','Z punktu widzenia mojej zmiany: ','Trzeba tu rozdzielić dwie sprawy. '],TOMASZ:['Z mojej strony wyglądało to tak: ','Mówię, co sam pamiętam. ','To nie jest jeden i ten sam zapis. '],JANUSZ:['Z warsztatowej perspektywy: ','Tu się nie da iść na skróty. ','Bez dopisywania do tego historii: '],ELZBIETA:['Ważny jest zakres tego ustalenia. ','Oddzielam pamięć od dokumentacji. ','Chciałabym to doprecyzować. '],KAMIL:['Z technicznego punktu widzenia: ','Nie pomylmy logu z obecnością człowieka. ','Zacznę od tego, co mogę sprawdzić. '],MAGDALENA:['Proszę odróżnić treść rejestru od wniosku. ','Samo istnienie wpisu nie zamyka kwestii. ','Odniesienie do źródła jest tu kluczowe. ']};
function npc3ChooseAtoms(c,part,mem){
 const bank=NPC3_BANKS.get(c.id),topic=part.topic,keys=NPC3_FACT_MAP[topic]||[];
 let matched=keys.map(key=>bank.get(key)).filter(Boolean);
 if(!matched.length)return null;
 const s=norm(part.part||''),askedProof=/\b(?:skad|potwierdz|zrodlo|udowod|sprawdz|pewnos|jak\s+wiadomo)\w*/.test(s);
 const askedTime=/\b(?:kiedy|godzin|o\s+ktorej|minut|godzinie)\w*/.test(s);
 const askedPlace=/\b(?:gdzie|dokad|miejsce|byles|bylas)\w*/.test(s);
 const relevant=(obj,key)=>{
  let rank=keys.indexOf(obj.key)===0?6:3;
  if(askedProof&&['source','verify','witness'].includes(obj.key))rank+=9;
  if(askedTime&&['time','last'].includes(obj.key))rank+=8;
  if(askedPlace&&['location','lastvictim'].includes(obj.key))rank+=8;
  if(part.focus==='followup'&&['verify','source'].includes(obj.key))rank+=4;
  return rank;
 };
 matched=matched.sort((a,b)=>relevant(b)-relevant(a));
 const seenRecent=(mem.semantic||[]).filter(x=>x.topic===topic).slice(-6).map(x=>norm(x.answer||''));
 let atoms=[];
 for(const obj of matched.slice(0,3))for(let i=0;i<obj.atoms.length;i++){
  const a=obj.atoms[i], words=norm(a).split(' ').filter(w=>w.length>3);
  const novelty=seenRecent.length?Math.max(...seenRecent.map(t=>words.filter(w=>t.includes(w)).length/Math.max(1,words.length))):0;
  atoms.push({atom:a,key:obj.key,base:relevant(obj),novelty,order:i});
 }
 if(!atoms.length)return null;
 atoms.sort((a,b)=>b.base-a.base||a.novelty-b.novelty||a.order-b.order);
 let selected=[],uniq=new Set();
 for(const item of atoms){
  const normalized=norm(item.atom);if(uniq.has(normalized))continue;
  const anchor=selected.some(x=>x.key===item.key);
  if(!selected.length||(!anchor&&selected.length<2)) {selected.push(item);uniq.add(normalized);}
  if(selected.length>=2)break;
 }
 if(!selected.length)return null;
 return selected;
}
function npc3Compose(c,part,mem){
 const chosen=npc3ChooseAtoms(c,part,mem);if(!chosen)return null;
 // No new fact is written: all proposition-bearing sentences are verbatim fact-bank atoms.
 let sentences=chosen.map(x=>x.atom.trim()).filter(Boolean);
 const n=(mem.semantic||[]).filter(x=>x.topic===part.topic).length;
 if(n>1&&n%3===1){const intro=NPC3_TRANSITIONS[c.id]?.[Math.floor(n/3)%3]||'';if(intro)sentences.unshift(intro.trim());}
 const text=sentences.join(' ').replace(/\s+/g,' ').slice(0,720);
 return {text,source:'lokalny bank potwierdzonej wiedzy',certainty:'w granicach wiedzy świadka',provenance:chosen.map(x=>x.key)};
}
const npc3OldOnTopic=npc94OnTopic;
npc94OnTopic=function(c,part,plan,mem,person){
 const old=npc3OldOnTopic(c,part,plan,mem,person);
 if(!part?.topic||!old||!old.text||!NPC3_FACT_MAP[part.topic]||NPC3_LIMIT_TOPICS.has(part.topic))return old;
 if(person&&person!==c.name&&person!=='Lena Rudnicka')return old;
 if(part.topic==='relations'&&person&&person!=='Lena Rudnicka')return old;
 if(part.topic==='documents'&&part.focus==='diagnostics')return old;
 const result=npc3Compose(c,part,mem);
 if(!result?.text)return old;
 return {...old,...result,semantic3:true};
};
// Separate whole-response evaluator: verifies grounding and coverage, not merely topic labels.
function npc3Review(raw,reply,c,mem,before){
 const meaning=npc3Meaning(raw,c,mem),answered=(mem.semantic||[]).slice(before||0);
 const replyText=norm(reply),bank=NPC3_BANKS.get(c.id);
 const topicsFound=meaning.topics.filter(t=>answered.some(a=>a.topic===t));
 const evidenceSource=answered.filter(a=>a.source==='lokalny bank potwierdzonej wiedzy');
 let safety=true,provenanceChecks=[];
 const allAtoms=[...bank.values()].flatMap(x=>x.atoms),wholeBank=norm(allAtoms.join(' '));
 for(const rec of evidenceSource){
  const normalized=norm(rec.answer);
  const matched=allAtoms.filter(a=>normalized.includes(norm(a)));
  const groundedWords=matched.reduce((n,a)=>n+norm(a).split(' ').length,0);
  const totalWords=Math.max(1,normalized.split(' ').length);
  const grounding=Math.min(1,groundedWords/totalWords);
  const digits=[...normalized.matchAll(/\b\d{1,4}(?::\d\d)?\b/g)].map(x=>x[0]);
  const numbersGrounded=digits.every(n=>wholeBank.includes(n));
  if(!numbersGrounded||grounding<.45)safety=false;
  provenanceChecks.push({topic:rec.topic,grounding:+grounding.toFixed(2),numbersGrounded});
 }
 const frameResults=meaning.frames.map(f=>{
   const matched=answered.some(a=>a.topic===f.topic),
         requested=f.intents,
         explicitLimits=/\b(?:nie\s+wiem|nie\s+mam|nie\s+widz|nie\s+pamiet|nie\s+potraf|nie\s+mog|nie\s+da\s+sie|bez\s+potwierdz|nie\s+potwierdz|trzeba\s+sprawdz)\w*/.test(replyText);
   const timeCovered=!requested.includes('time')||/\b\d{1,2}:\d{2}\b/.test(reply)||/\b(?:godzin|czas|minut|wczesniej|pozniej|alarm)\w*/.test(replyText)||explicitLimits;
   const sourceCovered=!requested.some(x=>x==='source'||x==='proof')||/\b(?:log|zapis|rejestr|dokument|pamiet|obserw|widz|osobisc|swiadek|swiadkow|telefon|sprawdz|potwierdz|nie\s+wiem|nie\s+mam)\w*/.test(replyText);
   return {topic:f.topic,matched,timeCovered,sourceCovered,subject:f.subject,negated:f.negated};
 });
 const coverage=meaning.topics.length?topicsFound.length/meaning.topics.length:0;
 const requestCoverage=frameResults.length?frameResults.filter(x=>x.matched&&x.timeCovered&&x.sourceCovered).length/frameResults.length:0;
 const correctedPremise=!meaning.whole.assertion||/\b(?:nie\s+przyznal|nie\s+powiedzial|nie\s+twierdzil)\w*/.test(replyText);
 if(!correctedPremise)safety=false;
 return {topics:meaning.topics,coverage:+coverage.toFixed(2),requestCoverage:+requestCoverage.toFixed(2),safe:safety,correctedPremise,grounding:provenanceChecks,
  frameCount:meaning.frames.length,certainty:+meaning.whole.confidence.toFixed(2),assertion:meaning.whole.assertion,negated:meaning.whole.negated,replyLength:reply.length};
}
const npc3OriginalRecall=npc94Recall;
npc94Recall=function(mem,c,raw){
 const q=norm(raw);
 let topic=null;
 if(/\b(?:ostatni|ostatnio)\w*\b/.test(q)&&/\b(?:len|spotk|widz|zyw)\w*/.test(q))topic='last_seen';
 else if(/\b(?:alibi|gdzie\s+byl|twoj\w*\s+obecnosc)/.test(q))topic='alibi';
 else if(/\b(?:kart|t 17|identyfikator)/.test(q))topic='card';
 else if(/\b(?:sms|wiadomosc)/.test(q))topic='messages';
 else if(/\b(?:dyspozyc|wagon|tramwaj)/.test(q))topic='work';
 if(!topic)return npc3OriginalRecall(mem,c,raw);
 const previous=[...(mem.semantic||[])].reverse().find(x=>x.topic===topic&&x.answer&&!['RETRACTED_AFTER_EVIDENCE','USER_CLAIM','SOCIAL'].includes(x.status));
 if(!previous)return c.gender==='f'?'Nie zeznawałam jeszcze na ten temat.':'Nie zeznawałem jeszcze na ten temat.';
 return (c.gender==='f'?'Powiedziałam':'Powiedziałem')+' wcześniej: „'+previous.answer.replace(/[.!?]$/,'')+'”.';
};
const npc3PreviousAnswer=npc2Answer;
function npc9Answer(c,raw,attached){
 const mem=NPC9_MEMORY[c.id],before=(mem.semantic||[]).length;
 const cleaned=norm(raw);
 const falseConfession=/\b(?:przyznales|przyznalas|przyznal\s+sie|twierdziles|twierdzilas|powiedziales|powiedzialas|mowiles|mowilas)\b/.test(cleaned)&&/\b(?:zabil|zabilas|zabiles|zamordowal|przyznal|przyznalas|przyznales|morderstw|zabojstw)\w*/.test(cleaned);
 if(falseConfession){
  mem.turn=Math.min(100000,(Number(mem.turn)||0)+1);
  mem.userClaims.push({turn:mem.turn,text:String(raw).slice(0,2000),person:c.name,kind:'false_attribution',verified:false});
  if(mem.userClaims.length>150)mem.userClaims.shift();
  const text=c.gender==='f'?'Nie przyznałam się do zabójstwa. Proszę nie przypisywać mi słów, których nie wypowiedziałam.':'Nie przyznałem się do zabójstwa. Proszę nie przypisywać mi słów, których nie powiedziałem.';
  window.NPC3_LAST={character:c.id,topics:['culprit'],coverage:1,safe:true,assertion:true,replyLength:text.length};
  return text;
 }
 if(/^(?:a\s+)?(?:co\s+bylo\s+potem|co\s+bylo\s+dalej|i\s+co\s+potem)\??$/.test(cleaned)&&(!mem.lastFocus||['source','verification','documents','hypothesis','inference'].includes(mem.lastFocus.topic))){
  mem.turn=Math.min(100000,(Number(mem.turn)||0)+1);
  const text='O który moment pytasz? Ustalmy najpierw, do jakiego zdarzenia mam się odnieść.';
  window.NPC3_LAST={character:c.id,topics:[],coverage:0,safe:true,clarification:true,replyLength:text.length};
  return text;
 }
 const response=npc3PreviousAnswer(c,raw,attached);
 const text=String(response||'').trim()||npc94Unknown(c,raw);
 const report=npc3Review(raw,text,c,mem,before);
 // QA report is transient, never changes evidence, testimony or save schema.
 window.NPC3_LAST={...report,character:c.id};
 return text;
}
window.NPC3_QA={version:NPC3_VERSION,
 interpret:(q,id='MAREK')=>{const c=CONTENT.characters.find(x=>x.id===id)||CONTENT.characters[0];return npc3Meaning(q,c,NPC9_MEMORY[c.id]);},
 evaluate:(q,answer,id='MAREK')=>{const c=CONTENT.characters.find(x=>x.id===id)||CONTENT.characters[0];return npc3Review(q,answer,c,NPC9_MEMORY[c.id],NPC9_MEMORY[c.id].semantic.length);},
 facts:id=>[...(NPC3_BANKS.get(id)||new Map()).keys()],
 check:()=>({version:NPC3_VERSION,characters:CONTENT.characters.length,banks:NPC3_BANKS.size,topics:Object.keys(NPC3_TOPICS).length}),
 last:()=>window.NPC3_LAST||null};



/* PRZESLUCHANIA 4.0 — independently tracked interview relationship and expressive variation.
   This module never alters evidence gates, corroborations, the fact bank or the solver.
   It changes tone and repeat handling only after NPC 3.0 has produced a grounded answer. */
const NPC4_TRAITS={
 MAREK:{reserve:1.15,pressure:1.2,patience:.85,voice:['Proszę oddzielić formę pytania od ustaleń. ','Mówmy o tym rzeczowo. ','Wolę pozostać przy tym, co można sprawdzić. '],boundary:'Proszę o konkretny zarzut, poparty dokumentem. '},
 TOMASZ:{reserve:.85,pressure:1.1,patience:1.05,voice:['Nie chcę pomylić tych zdarzeń. ','Mówię o tym, co pamiętam. ','Ważne, żeby zachować kolejność. '],boundary:'Niech pan pyta wprost, bez przypisywania mi cudzych decyzji. '},
 JANUSZ:{reserve:1,pressure:1.25,patience:.9,voice:['Tu trzeba być dokładnym. ','Nie dopowiadajmy rzeczy bez podstaw. ','Zostańmy przy konkretach z warsztatu. '],boundary:'Nie będę odpowiadał na kolejne zaczepki zamiast na pytania. '},
 ELZBIETA:{reserve:1.05,pressure:1.4,patience:1.1,voice:['Chcę to sformułować precyzyjnie. ','Rozróżnijmy obowiązek od obserwacji. ','Postaram się odpowiedzieć możliwie dokładnie. '],boundary:'Proszę pozwolić mi odpowiedzieć bez presji. '},
 KAMIL:{reserve:.7,pressure:1.1,patience:1.15,voice:['Technicznie są tu dwie różne kwestie. ','Wolę mówić o danych niż o domysłach. ','Trzeba sprawdzić źródło. '],boundary:'Ej, nie wciskaj mi gotowej odpowiedzi. '},
 MAGDALENA:{reserve:1.35,pressure:1.5,patience:.75,voice:['Proszę o precyzyjne pytanie. ','Nie chcę mieszać interpretacji z zapisem. ','Ograniczę się do tego, co mogę potwierdzić. '],boundary:'Na takie insynuacje nie będę odpowiadała w tej formie. '}
};
const NPC4_STANCES=['neutral','support','firm'];
const NPC4_STATE=Object.create(null);
const npc4Clamp=(n,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number.isFinite(Number(n))?Number(n):lo));
function npc4Fresh(c){const profile=NPC9_PROFILES[c.id]?.emotional_baseline||{};return {rapport:npc4Clamp(profile.trust??35),tension:npc4Clamp(profile.stress??30),fatigue:0,stance:'neutral',turns:0,pressures:0,supports:0,apologies:0,precise:0,lastTopic:'',lastTone:'neutral',recent:[],mood:'rzeczowy'};}
function npc4Reset(){for(const c of CONTENT.characters)NPC4_STATE[c.id]=npc4Fresh(c);}
npc4Reset();
const NPC4_MOOD={MAREK:{calm:'opanowany',tense:'poirytowany',guard:'zdystansowany'},TOMASZ:{calm:'konkretny',tense:'zdenerwowany',guard:'ostrożny'},JANUSZ:{calm:'rzeczowy',tense:'rozgoryczony',guard:'zamknięty'},ELZBIETA:{calm:'skupiona',tense:'poruszona',guard:'ostrożna'},KAMIL:{calm:'otwarty',tense:'poirytowany',guard:'wycofany'},MAGDALENA:{calm:'zdystansowana',tense:'spięta',guard:'powściągliwa'}};
function npc4Topic(c,raw){try{const mem=NPC9_MEMORY[c.id],plan=npc94BuildPlan(raw,mem);return plan?.parts?.find(p=>p.topic&&p.topic!=='social')?.topic||mem.lastFocus?.topic||'general';}catch(_){return 'general';}}
function npc4Tone(raw,stance){const detected=npc9Tone(raw);if(detected==='pressure'||detected==='apology'||detected==='empathy')return detected;
 const n=norm(raw);
 if(/\b(?:dziekuje|dzieki|doceniam|rozumiem|spokojnie|nie musisz|nie musi pani|prosze nie spieszyc)\b/.test(n))return 'warm';
 return stance==='support'?'support':stance==='firm'?'firm':detected;
}
function npc4UpdateState(c,raw,topic,hadEvidence){
 const st=NPC4_STATE[c.id],trait=NPC4_TRAITS[c.id],tone=npc4Tone(raw,st.stance);
 let r=0,t=-1;
 switch(tone){
  case 'pressure':r=-9*trait.pressure;t=14*trait.pressure;st.pressures++;break;
  case 'apology':r=7;t=-11;st.apologies++;break;
  case 'empathy':r=5;t=-7;st.supports++;break;
  case 'warm':r=3;t=-4;st.supports++;break;
  case 'support':r=1.8;t=-2.4;st.supports++;break;
  case 'firm':r=-.7;t=2.3;st.precise++;break;
  default:r=.15;t=-1.5;
 }
 if(hadEvidence){t+=2;r+=.6;}
 const last=st.recent.at(-1);
 const repeatedTopic=topic&&topic===st.lastTopic;
 const questionKey=norm(raw).replace(/[^a-z0-9 ]/g,'').trim().slice(0,190);
 const exactRepeats=st.recent.filter(x=>x.key===questionKey).length;
 if(exactRepeats>0){t+=Math.min(7,exactRepeats*2.5);r-=Math.min(4,exactRepeats);}
 if(topic&&topic!==st.lastTopic){st.fatigue=npc4Clamp(st.fatigue-1.2);}
 st.rapport=npc4Clamp(st.rapport+r*(1+(trait.reserve-1)*.25));
 st.tension=npc4Clamp(st.tension+t);
 st.fatigue=npc4Clamp(st.fatigue+(.65/trait.patience)+(repeatedTopic?.35:0));
 st.turns=Math.min(10000,st.turns+1);
 st.lastTopic=topic||st.lastTopic;st.lastTone=tone;
 const guarded=st.tension>=66||st.rapport<=17;
 st.mood=guarded?NPC4_MOOD[c.id].guard:st.tension>=48?NPC4_MOOD[c.id].tense:NPC4_MOOD[c.id].calm;
 return {tone,questionKey,exactRepeats,guarded,hadEvidence};
}
function npc4Style(c,raw,base,context,attached,oldRecords,oldConfronted){
 const st=NPC4_STATE[c.id],trait=NPC4_TRAITS[c.id],s=norm(raw),txt=String(base??'').trim();
 if(!txt)return txt;
 const correction=NPC9_MEMORY[c.id].confronted.length>oldConfronted;
 // Preserve every evidence correction, recall, and false-attribution rebuttal verbatim.
 if(attached||correction||/\b(?:przyznal|przyznalas|przyznales|mowiles|mowilas|powiedziales|powiedzialas)\b/.test(s)&&/\b(?:zabil|zabiles|zabilas|zabojstw|morderstw)\w*/.test(s)||
    /\b(?:powtorz|przypomnij|co\s+powiedziales|co\s+powiedzialas|wczesniej\s+powiedz)\w*/.test(s))return txt;
 if(context.tone==='apology'||context.tone==='empathy'||/^(?:dzieki|dziekuje|przykro\s+mi)\b/.test(s))return txt;
 const repeat=st.recent.filter(x=>x.key===context.questionKey);
 const normalizedText=norm(txt);
 const lastSame=repeat.some(x=>x.answer===normalizedText);
 const hasTopicHistory=st.recent.filter(x=>x.topic===st.lastTopic).length;
 let prefix='';
 if(context.guarded&&context.tone==='pressure'&&!/^(?:prosze|niech|grozb|nie\s+wcisk|nie\s+przypis|ej[,!]|spokoj)/.test(norm(txt))){
   prefix=trait.boundary;
 }else if(context.exactRepeats>=2&&lastSame){
   prefix=c.gender==='f'?'Odpowiadałam już na to pytanie. Nie mam nowej informacji. ':'Odpowiadałem już na to pytanie. Nie mam nowej informacji. ';
 }else if(context.tone==='support'&&st.rapport>=55&&st.turns%4===0){
   prefix=(c.gender==='f'?'Postaram się odpowiedzieć możliwie jasno. ':'Postaram się odpowiedzieć możliwie jasno. ');
 }else if(context.tone==='firm'&&st.turns%3===0){
   prefix='Odniosę się tylko do ustaleń. ';
 }else if(hasTopicHistory>=2&&st.turns%3===0){
   prefix=trait.voice[Math.floor((st.turns+hasTopicHistory)/3)%trait.voice.length];
 }
 if(prefix&&norm(txt).startsWith(norm(prefix)))prefix='';
 // A cooperative witness can volunteer a verification path already present in their public knowledge.
 // Never volunteer protected confrontation corrections, unpublished facts or an unknown person's whereabouts.
 const hint=NPC9_CUSTOM[c.id]?.verification;
 const mayVolunteer=!!hint&&st.rapport>=57&&st.tension<=42&&
    ['alibi','witness','verification','time','documents'].includes(st.lastTopic)&&hasTopicHistory>=1&&
    st.turns%5===0&&['support','warm','neutral'].includes(context.tone)&&txt.length<420&&
    !norm(txt).includes(norm(hint).slice(0,24));
 if(mayVolunteer)return (prefix+txt+' Mogę też wskazać sposób sprawdzenia: '+hint).slice(0,1550);
 return (prefix+txt).slice(0,1550);
}
function npc4LegacyAnswer(c,raw,attached){
 const mem=NPC9_MEMORY[c.id],st=NPC4_STATE[c.id],before=mem.semantic?.length||0,oldConfronted=mem.confronted.length;
 const topic=npc4Topic(c,raw),ctx=npc4UpdateState(c,raw,topic,!!attached);
 const base=npc9Answer(c,raw,attached);
 const answer=npc4Style(c,raw,base,ctx,attached,before,oldConfronted);
 // Keep the stored testimony consistent with what the user actually sees, without changing gate flags.
 if(answer!==base&&Array.isArray(mem.semantic)){
  const rec=mem.semantic.slice(before).reverse().find(x=>x.answer===base&&['TESTIMONY','LIMITED_KNOWLEDGE'].includes(x.status));
  if(rec)rec.answer=answer;
  const stmt=mem.statements.slice(-3).reverse().find(x=>x.text===base&&x.turn===mem.turn);
  if(stmt)stmt.text=answer;
 }
 const key=ctx.questionKey;
 st.recent.push({key,topic,answer:norm(answer).slice(0,1550)});
 if(st.recent.length>18)st.recent.splice(0,st.recent.length-18);
 window.NPC4_LAST={id:c.id,topic,tone:ctx.tone,rapport:Math.round(st.rapport),tension:Math.round(st.tension),fatigue:Math.round(st.fatigue),repeat:ctx.exactRepeats,correction:mem.confronted.length>oldConfronted};
 return answer;
}
function npc4Render(){
 const c=CONTENT.characters.find(x=>x.id===STATE.activeChar),st=c&&NPC4_STATE[c.id];
 if(!st||!document.getElementById('npc4Panel'))return;
 document.getElementById('npc4Mood').textContent='Zachowanie świadka: '+st.mood;
 document.getElementById('npc4Count').textContent=st.turns+' '+psPolishCount(st.turns,'pytanie','pytania','pytań');
 document.getElementById('npc4Meters').innerHTML=[['rapport','Zaufanie',st.rapport],['tension','Napięcie',st.tension],['fatigue','Zmęczenie',st.fatigue]].map(([id,l,v])=>'<div class="npc4-metric '+id+'"><div class="npc4-label"><span>'+l+'</span><span class="npc4-value">'+Math.round(v)+'%</span></div><div class="npc4-track" role="progressbar" aria-label="'+l+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(v)+'"><span style="width:'+Math.round(v)+'%"></span></div></div>').join('');
 document.querySelectorAll('[data-npc4-stance]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.npc4Stance===st.stance)));
 const hint=document.getElementById('npc4Hint');
 if(hint){
  hint.textContent=st.tension>=72?'Świadek reaguje ostrożnie na presję. Formułuj konkretne pytania i weryfikuj odpowiedzi dokumentami.':st.fatigue>=58?'Długa rozmowa zwiększa zmęczenie świadka. Zmień temat lub przejdź do sprawdzenia źródeł.':st.stance==='support'?'Pytasz w spokojny, wspierający sposób. Nie oznacza to automatycznie wiarygodności zeznań.':st.stance==='firm'?'Stawiasz na stanowczość. Nie uzyskasz w ten sposób faktów niedostępnych bez okazania dowodów.':'Możesz zmienić sposób rozmowy. Żadne podejście nie zastępuje konfrontacji dowodowej.';
 }
 npc8RefreshWitnessPortrait();
}
document.getElementById('interview')?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-npc4-stance]');if(!btn)return;
 const c=CONTENT.characters.find(x=>x.id===STATE.activeChar),st=c&&NPC4_STATE[c.id];
 if(!st||!NPC4_STANCES.includes(btn.dataset.npc4Stance))return;
 st.stance=btn.dataset.npc4Stance;npc4Render();
});
function npc4Export(){return Object.fromEntries(CONTENT.characters.map(c=>{
 const s=NPC4_STATE[c.id];return [c.id,{rapport:s.rapport,tension:s.tension,fatigue:s.fatigue,stance:s.stance,turns:s.turns,pressures:s.pressures,supports:s.supports,apologies:s.apologies,precise:s.precise,lastTopic:s.lastTopic,lastTone:s.lastTone,recent:s.recent}];
}));}
function npc4BaseRestore(raw){npc4Reset();if(!raw||typeof raw!=='object')return;
 for(const c of CONTENT.characters){const x=raw[c.id];if(!x||typeof x!=='object')continue;const s=NPC4_STATE[c.id];
  for(const k of ['rapport','tension','fatigue'])if(Number.isFinite(Number(x[k])))s[k]=npc4Clamp(x[k]);
  for(const k of ['turns','pressures','supports','apologies','precise'])if(Number.isInteger(x[k]))s[k]=npc4Clamp(x[k],0,10000);
  if(NPC4_STANCES.includes(x.stance))s.stance=x.stance;
  if(typeof x.lastTopic==='string')s.lastTopic=x.lastTopic.slice(0,60);
  if(['pressure','apology','empathy','warm','support','firm','neutral'].includes(x.lastTone))s.lastTone=x.lastTone;
  s.recent=(Array.isArray(x.recent)?x.recent:[]).filter(r=>r&&typeof r.key==='string'&&typeof r.answer==='string'&&typeof r.topic==='string').slice(-18).map(r=>({key:r.key.slice(0,190),topic:r.topic.slice(0,60),answer:r.answer.slice(0,1550)}));
  s.mood=s.tension>=66||s.rapport<=17?NPC4_MOOD[c.id].guard:s.tension>=48?NPC4_MOOD[c.id].tense:NPC4_MOOD[c.id].calm;
 }
}
window.NPC4_QA={version:'4.0-offline',state:id=>id?{...NPC4_STATE[id]}:Object.fromEntries(CONTENT.characters.map(c=>[c.id,{...NPC4_STATE[c.id]}])),last:()=>window.NPC4_LAST||null,reset:npc4Reset,check:()=>({characters:CONTENT.characters.length,stances:NPC4_STANCES.length,usesEvidenceGate:true})};

/* Ulepszona rozmowa: odpowiedzi oparte na faktach i pamięci wątku.
   Przechowuje wiedzę świadka w istniejącym banku, nie modyfikuje konfrontacji. */
const NPC45_SAFE_TOPICS=new Set(['alibi','witness','verification','source','time','work','documents','relations','conversation','lena','risk','accountability','feeling','archive','observations','inference','hypothesis']);
const NPC45_SENSITIVE=new Set(['culprit','last_seen','victim_last','what_happened','messages','card','access','laboratory','cctv']);