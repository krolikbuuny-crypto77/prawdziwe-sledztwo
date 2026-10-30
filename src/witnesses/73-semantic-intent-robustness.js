/* Pakiet 6.13: wielosygnalowa interpretacja polskich parafraz i ostrozne odpowiedzi.
 * Wykryte intencje sa tylko hipotezami; wiedza i stan gry pozostaja w WitnessEngine.
 */
(function(){
'use strict';
const prior=window.PS611_NLU;
if(!prior) throw Error('Missing NLU 6.12');
const clean=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[„“”]/g,'"').replace(/\s+/g,' ').trim().slice(0,1400);
// Sygnały mają różne źródła leksykalne: nie wymagamy jednej gotowej frazy.
// Wyrażenia silne opisują operację pytającego, a nie sam temat rozmowy.
const strong={
 personal_observation:[/\b(?:naocz\w*|bezposredni\w* swiad\w*|wlasn\w* (?:ocz\w*|perspektyw\w*)|zarejestrowa\w* wzrok\w*|co (?:sam|sama) widz\w*|co (?:sam|sama) dostrzeg\w*|obraz\w* zapamiet\w*)/],
 knowledge_source:[/\b(?:autor\w* (?:wiadom\w*|informacj\w*)|pierwotn\w* autor\w*|czyj\w* relacj\w*|czyich ustalen\w*|jak\w* kanale\w*|jak (?:do ciebie|do pana|do pani) trafi\w*|skad(?:ze)?\b|z jakiego zrod\w*|od kog\w*)/],
 certainty_limit:[/\b(?:ufasz\w* (?:swoj\w* )?pamie\w*|reczysz\w* za|wyklucz\w* pomyl\w*|mozliw\w* pomyl\w*|jak\w* pewn\w*|na ile\w* (?:pewn\w*|wiarygodn\w*)|dokladnos\w* relacj\w*)/],
 epistemic_challenge:[/\b(?:wzrok\w* nie obejmowa\w*|nie sledzi\w* .{0,32}(?:drzwi|bram\w*|plac\w*)|nie patrzyl\w* .{0,38}(?:plac\w*|drzwi|bram\w*)|nie byle\w* obec\w* .{0,55}(?:stanowcz\w*|pewn\w*)|zapewnia\w* .{0,55}(?:nie\s+bylo|pust\w*)|z jednej strony .{0,100} z drugiej|nie obserwow\w* .{0,80}(?:skad|jak|pewn\w*))/],
 time_precision:[/\b(?:kwadrans\w*|przedzial czasow\w*|moment\w* na osi czas\w*|moment\w* wskazuj\w* na osi czas\w*|jaki\w* moment\w*|okien\w* czasow\w*|dokladnos\w* do .{0,18}(?:minut\w*|kwadrans\w*)|o ktorej|o jakiej porze)/],
 place_precision:[/\b(?:sektor\w*|czesc\w* budyn\w*|czesc\w* zajezdn\w*|ktorej stronie|ktory\w* pomieszcz\w*|stronie bram\w*|w ktorym punkcie|wskaz (?:lokalizacj\w*|miejsce\w*))/],
 alibi:[/\b(?:miejsce pobyt\w*|gdzie przebywa\w*|tras\w* .{0,28}przemieszcz\w*|twoj\w* obecnosc\w*|chwili alarmu|w czasie zdarzen\w*|krytyczn\w* (?:godzin\w*|momenc\w*|chwil\w*))/],
 corroboration:[/\b(?:niezalezn\w* .{0,35}(?:slad\w*|potwierd\w*|zweryfik\w*)|poświadcz\w*|poswiadcz\w*|weryfik\w* twoj\w* slow\w*|co\w* weryfik\w*|kto moze .{0,28}poswiadcz\w*)/],
 event_sequence:[/\b(?:chronolog\w*|przebieg\w* nocy|od poczatku do konca|w jakiej kolejnosc\w*|co nastapi\w* miedzy|odtworz\w* przebieg\w*|pierwsz\w* sygnal\w*)/],
 action_taken:[/\b(?:podjet\w* .{0,20}czynnosc\w*|jakie\w* dzialan\w*|jak wyglada\w* .{0,18}postepowan\w*|co zrobil\w*|jak zareagowa\w*|jak\w* krok\w* podj\w*|co uczyni\w*)/],
 reason_for_action:[/\b(?:motyw\w* kierowa\w*|czym\w* kierowa\w*|co tob\w* kierowa\w*|co sklonil\w*|powod\w*[, ]+(?:dla ktor\w*|odpuszcz\w*)|czemu|dlaczego|z jakiej przyczyn\w*|po co|dlaczegoz|dlaczego\w*|jaki\w* sens mial\w*)/],
 report_recipient:[/\b(?:docelow\w* odbiorc\w*|adresat\w* (?:meldunk\w*|zgloszen\w*|wiadom\w*)|do jakiej osob\w* skierowa\w*|kto .{0,22}otrzyma\w* .{0,20}(?:wiadom\w*|zgloszen\w*)|komu\w* .{0,30}(?:zglos\w*|przekaz\w*|wysla\w*|meldow\w*))/],
 victim_contact:[/\b(?:ostatni\w* kontak\w*|ostatni\w* wymian\w* zdan\w*|rozmow\w* .{0,28}len\w*|len\w* .{0,25}(?:rozmow\w*|wiadom\w*|spotkan\w*)|wymian\w* zdan\w* z len\w*)/],
 relationship:[/\b(?:relacj\w* (?:osobist\w*|prywatn\w*|sluzbow\w*)|charakter\w* (?:wasz\w* )?znajom\w*|co laczy\w* .{0,30}len\w*|konflikt\w* osobist\w*|miedzy wami)/],
 previous_statement:[/\b(?:pierwotn\w* wyjasn\w*|pierwsz\w* zeznan\w*|jak brzmia\w* .{0,30}zeznan\w*|wroc\w* do wersj\w*|poczatk\w* przesluchan\w*|powtorz\w* .{0,25}(?:pierwsz\w*|wyjasn\w*))/],
 contradiction:[/\b(?:rozbieznos\w*|zeznani\w* rozmijaj\w*|wersj\w* nie mog\w* byc|jednej relacj\w* .{0,95}drugiej|najpierw .{0,80} teraz|ktora\w* podtrzymuj\w*|nie moga byc jednoczesnie prawdziw\w*)/],
 clarify_reference:[/\b(?:tamtej kobiet\w*|drugiej osob\w*|kogo konkretnie .{0,30}(?:mial\w*|masz)|o kogo chodzi|o kim mow\w*|kogo masz na mysl\w*)/],
 direct_accusation:[/\b(?:jestes zabojc\w*|byl\w* zabojc\w*|ponosisz win\w* za zamordowan\w*|odpowiedzialnos\w* za smierc\w* .{0,35}zabojc\w*|ty .{0,15}(?:dopuscil\w* sie|zamordow\w*|zabil\w*)|przyznaj\w* sie .{0,35}(?:morderst\w*|zabojst\w*))/],
 procedural_refusal:[/\b(?:odmawia\w* dalsz\w* zeznan\w*|zad\w* przerwan\w* przesluchan\w*|przerwac przesluchan\w*|zakoncz\w* (?:te|ta|tę) rozmow\w*|odmow\w* odpowied\w*)/],
 documents:[/\b(?:pisemn\w* .{0,15}(?:protokol\w*|zapis\w*)|urzedow\w* protokol\w*|w aktach .{0,20}dokument\w*|ktory\w* dokument\w*|jak\w* wersj\w* protokol\w*)/]
};
// Minimalne warunki dezambiguacji, zwłaszcza oskarżenia wobec innej osoby.
const third=/\b(?:czy\s+)?(?:marek|janusz|tomasz|kamil|elzbieta|magdalena|lena)\s+(?:zabil\w*|zamordow\w*)|\bkto\b.{0,40}\b(?:zabil|zamordow)\w*/;
const tags=Object.keys(strong);
function inspect(q){
 const votes=[];
 for(const id of tags){
  if(id==='direct_accusation'&&third.test(q))continue;
  if(id==='reason_for_action'&&/\b(?:dlaczego|czemu)\b/.test(q)&&/\b(?:wczesniej|poprzednio)\b/.test(q)&&/\b(?:mowil\w*|powiedzia\w*)/.test(q))continue;
  const hits=strong[id].filter(p=>p.test(q)).length;
  if(!hits)continue;
  let value=8+Math.min(hits,3);
  if(id==='epistemic_challenge'&&/\b(?:skoro|przeciez|ale|mimo)\b/.test(q))value+=3;
  if(id==='direct_accusation')value+=5;
  if(id==='report_recipient'&&/\b(?:zglosz\w*|meldunk\w*|wiadom\w*)/.test(q))value+=3;
  if(id==='reason_for_action'&&/\b(?:czemu|dlaczego|motyw|powod|kierowa\w*|sklonil\w*)/.test(q))value+=3;
  if(id==='contradiction'&&/\b(?:najpierw|pierwsz\w*)/.test(q))value+=2;
  votes.push({id,value});
 }
 votes.sort((a,b)=>b.value-a.value||tags.indexOf(a.id)-tags.indexOf(b.id));
 return votes;
}
function analyze(question){
 const existing=prior.analyze(question),q=clean(question);
 if(q.length<5||q.length>1300||existing.inputLooksLikeInstruction)return existing;
 const found=inspect(q);
 if(!found.length)return {...existing,version:'6.13',confidence:'low'};
 const newIds=found.map(x=>x.id);
 // Zachowuj wszystkie rozpoznane aspekty, ale bez zagnieżdżonych duplikatów.
 // Dobra klasyfikacja w starszym silniku ma pierwszeństwo; nowa warstwa
 // przejmuje sterowanie przede wszystkim przy nierozpoznanym pytaniu.
 let preferred=newIds;
 if(existing.primary&&existing.primary!=='unknown'){
   const exception= (newIds[0]==='epistemic_challenge'&&/\b(?:skoro|przeciez|nie obserwow\w*|wzrok\w* nie obejmowa\w*)/.test(q))||
    (newIds[0]==='direct_accusation'&&!third.test(q))||
    (newIds[0]==='place_precision'&&/\b(?:sektor\w*|pomieszczen\w*|czesc\w* zajezdn\w*)/.test(q));
   if(!exception)preferred=[existing.primary,...newIds.filter(x=>x!==existing.primary)];
 }
 const ordered=[...new Set([...preferred,...existing.intents])];
 if(ordered.includes('direct_accusation')){const i=ordered.indexOf('victim_contact');if(i>=0)ordered.splice(i,1);}
 if(ordered.includes('epistemic_challenge')){const i=ordered.indexOf('knowledge_source');if(i>=0)ordered.splice(i,1);}
 const intents=ordered.slice(0,7);
 const questionWords=[...new Set([...(existing.slots.questionWords||[]),...(q.match(/\b(?:kiedy|gdzie|skad|dlaczego|czemu|komu|co|kto|ktory|ktora|czy|jak|ile)\b/g)||[])])].slice(0,8);
 const compound=existing.slots.compound||/\b(?:i dlaczego|oraz komu|i kiedy|a po co|i gdzie|oraz kiedy|a komu|i kto|z jednej strony .{1,95} z drugiej)\b/.test(q);
 return {...existing,primary:intents[0],intents,aspects:compound?intents.slice(0,4):intents.slice(0,2),slots:{...existing.slots,compound,questionWords},
   coverageHints:compound?intents.slice(0,4):intents.slice(0,2),sensitive:intents.includes('direct_accusation')||intents.includes('procedural_refusal'),
   confidence:found[0].value>=10?'high':'medium',version:'6.13'};
}

// Nie zakładamy, że rozpoznanie kategorii wystarcza: używamy tylko zdań
// przypisanych do świadka albo jawnie komunikujemy brak możliwości ustalenia.
const beforeAnswer=WitnessEngine.snapshotAnswer();
const female=id=>id==='ELZBIETA'||id==='MAGDALENA';
const explicitCrime=/\b(?:zabojc\w*|zabil\w*|zamordow\w*|morderst\w*)/;
const protectedResponse=/\b(?:przyznaje sie|podtrzymuje odmowe|odmawiam|przerwa proceduralna|pelnomocnik|konfrontacj\w* z dowod\w*)/;
const topical={
 personal_observation:/\b(?:obserwow\w*|widz\w*|swiadk\w*|wzrok\w*)/,
 knowledge_source:/\b(?:zrod\w*|informacj\w*|wiem z|dowiedzia\w*|kto przekaz\w*|autor\w*)/,
 certainty_limit:/\b(?:pewn\w*|pomyl\w*|pamiec\w*|wyklucz\w*)/,
 epistemic_challenge:/\b(?:pewn\w*|nie obserwow\w*|nie widzia\w*|ograniczen\w*)/,
 time_precision:/\b(?:godzin\w*|minut\w*|czas\w*|kwadrans\w*)|\b\d\d?:\d\d\b/,
 alibi:/\b(?:biur\w*|dyzur\w*|prac\w*|byl\w*|znajdow\w*|obecnos\w*|pobyt\w*)/,
 corroboration:/\b(?:potwierdz\w*|swiadk\w*|rejestr\w*|weryfik\w*|dowod\w*)/,
 event_sequence:/\b(?:nastep\w*|potem|najpierw|kolejnos\w*|przed|po alarmie|chronolog\w*)/,
 reason_for_action:/\b(?:powod\w*|dlatego|poniewaz|kierowa\w*|sklonil\w*|nie wiem dlaczego|motyw\w*|decyzj\w*)/,
 report_recipient:/\b(?:odbior\w*|adresat\w*|komu|przekaza\w*|powiadom\w*)/,
 victim_contact:/\b(?:len\w*|spotkan\w*|kontak\w*|rozmow\w*)/,
 relationship:/\b(?:len\w*|relacj\w*|stosunk\w*|konflikt\w*|znajom\w*)/,
 previous_statement:/\b(?:wczesniej|pierwsz\w*|zeznan\w*|mowi\w*|wersj\w*)/,
 contradiction:/\b(?:sprzeczn\w*|rozbiezn\w*|nie zgadz\w*|wersj\w*|wczesniej)/,
 clarify_reference:/\b(?:kogo|ktorej|kim|osob\w*)/,
 direct_accusation:/\b(?:zaboj\w*|zabil\w*|morder\w*|przyznaj\w*|nie przyznaj\w*)/,
 documents:/\b(?:dokument\w*|protokol\w*|raport\w*|akt\w*|rejestr\w*)/
};
const phrasing={
 knowledge_source:['Nie mogę wskazać autora tej informacji bez ustalenia, o którą wiadomość chodzi.',
 'Nie przypiszę tej informacji konkretnej osobie, dopóki nie ustalimy jej źródła.',
 'Potrzebuję wskazania tej wiadomości, żeby rozróżnić własną wiedzę od cudzej relacji.'],
 certainty_limit:['Nie mogę zagwarantować, że moja pamięć jest dokładna w każdym szczególe.',
 'Nie wykluczam pomyłki pamięci. To, co mówię, trzeba porównać z innymi danymi.',
 'Mogę mówić o tym, co pamiętam, ale nie przedstawię tego jako całkowitej pewności.'],
 epistemic_challenge:['Masz rację co do ograniczenia: jeśli nie obserwowałem miejsca przez cały czas, nie mogę wykluczyć czyjejś obecności.',
 'Moja wypowiedź nie dowodzi, że nikogo tam nie było. Nie miałem ciągłej obserwacji.',
 'Nie powinienem formułować pewnego wniosku z fragmentarycznej obserwacji.'],
 place_precision:['Nie potrafię teraz wskazać dokładnego sektora czy pomieszczenia. Nie chcę zgadywać.',
 'Bez sprecyzowania zdarzenia nie wskażę odpowiedzialnie konkretnej części budynku.',
 'Nie mam wystarczającej pewności co do dokładnego miejsca, o które pytasz.'],
 event_sequence:['Nie potrafię odtworzyć całej kolejności tych zdarzeń wyłącznie z pamięci.',
 'Nie mam pewnej chronologii od początku do końca; nie będę zamieniał przypuszczeń w fakty.',
 'Aby ułożyć zdarzenia po kolei, potrzebne są potwierdzone punkty czasu. Z pamięci nie ustalę wszystkich.'],
 reason_for_action:['Nie potwierdzam samego założenia, że podjąłem taką decyzję. Najpierw ustalmy, co faktycznie zrobiłem.',
 'Nie chcę wymyślać motywu działania, którego przebiegu nie ustaliliśmy.',
 'O przyczynie mogę mówić dopiero po ustaleniu, jaką decyzję rzeczywiście podjąłem.'],
 report_recipient:['Nie umiem z pewnością wskazać odbiorcy tego zgłoszenia.',
 'Nie podam nazwiska adresata, jeśli nie mogę go potwierdzić.',
 'Odbiorcę trzeba zweryfikować w potwierdzeniu przekazania. Z pamięci go nie ustalę.'],
 clarify_reference:['O którą dokładnie osobę pytasz? Nie chcę pomylić ludzi.',
 'Doprecyzuj, kogo masz na myśli. Samo „on” albo „ona” nie wystarcza.',
 'Którą osobę masz na myśli? Wtedy odniosę się do właściwej sytuacji.']
};
function choose(id,intent,q){const options=phrasing[intent];if(!options)return '';
 let h=0;for(const ch of (q+'|'+id))h=(h*33+ch.charCodeAt(0))>>>0;
 let text=options[h%options.length];
 if(intent==='epistemic_challenge'&&female(id))text=text.replace('obserwowałem','obserwowałam').replace('miałem','miałam').replace('powinienem','powinnam');
 if(intent==='reason_for_action'&&female(id))text=text.replace('podjąłem','podjęłam').replace('zrobiłem','zrobiłam');
 return text;
}
function reconcile(c,old,next,topic){
 const m=NPC9_MEMORY?.[c.id],s=NPC4_STATE?.[c.id],turn=m?.turn;
 if(!m||!s||!Number.isFinite(turn))return false;
 const sem=m.semantic?.slice().reverse().find(x=>x.turn===turn&&x.answer===old);
 const st=m.statements?.slice().reverse().find(x=>x.turn===turn&&x.text===old);
 if(!sem||!st||sem.source_ids?.length||st.source_ids?.length||
 ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(sem.status))return false;
 sem.answer=next;sem.topic=topic;sem.focus='robust-6.13';st.text=next;st.topic=topic;
 if(m.topics?.length)m.topics[m.topics.length-1]=topic;
 if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus:'robust-6.13'};
 if(s.recent?.at(-1)?.answer===clean(old).slice(0,1550))s.recent.at(-1).answer=clean(next).slice(0,1550);
 if(s.npc5?.recent?.at(-1)?.answer===old.slice(0,1400))s.npc5.recent.at(-1).answer=next.slice(0,1400);
 if(s.npc5?.anchor?.answer===old.slice(0,1400))s.npc5.anchor={...s.npc5.anchor,answer:next.slice(0,1400),topic};
 if(s.npc62?.a===old)s.npc62.a=next;
 if(s.npc65?.lastAnswer===old.slice(0,1300))s.npc65.lastAnswer=next.slice(0,1300);
 if(s.npc65?.recent?.at(-1)?.answer===old.slice(0,1300))s.npc65.recent.at(-1).answer=next.slice(0,1300);
 if(s.npc68?.threads?.at(-1)?.a===old.slice(0,850))s.npc68.threads.at(-1).a=next.slice(0,850);
 if(s.npc89?.recent?.at(-1)?.a===old.slice(0,1200))s.npc89.recent.at(-1).a=next.slice(0,1200);
 return true;
}
function answer(c,question,attached){
 const p=analyze(question),baseline=prior.analyze(question),before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
 const old=beforeAnswer(c,question,attached);
 if(!c||!NPC9_MEMORY?.[c.id]||!NPC4_STATE?.[c.id]||attached||simWitness(c).blocked||
  p.inputLooksLikeInstruction||!p.intents.length||p.primary==='procedural_refusal')return old;
 const last=NPC9_MEMORY[c.id].semantic?.at(-1);
 if((NPC9_MEMORY[c.id].confronted?.length||0)>before||last?.source_ids?.length||
 ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(last?.status)||
 protectedResponse.test(clean(old)))return old;
 const kind=p.primary;
 // Nie wymieniaj trafnej odpowiedzi na wariant tylko dla różnorodności.
 if(topical[kind]?.test(clean(old))&&kind!=='personal_observation'&&kind!=='direct_accusation')return old;
 if(kind==='direct_accusation'&&/\b(?:nie przyznaj\w* sie|przyznaj\w* sie|zaprzeczam|odmawiam odpowiedzi)\b/.test(clean(old)))return old;
 const questionText=clean(question);
 let response='';
 if(kind==='personal_observation'){
  const aboutVictim=/\b(?:len\w*|rudnick\w*|ofiar\w*)/.test(questionText);
  const source=aboutVictim?NPC9_CUSTOM?.[c.id]?.victim_last:NPC9_CUSTOM?.[c.id]?.observations;
  response=String(source||'').slice(0,950);
 }else if(kind==='documents')response=String(NPC9_CUSTOM?.[c.id]?.documents||'').slice(0,950);
 else if(kind==='relationship')response=String(NPC9_CUSTOM?.[c.id]?.relations||'').slice(0,950);
 else if(kind==='victim_contact')response=String(NPC9_CUSTOM?.[c.id]?.conversation||'').slice(0,950);
 else if(kind==='corroboration')response=String(NPC9_CUSTOM?.[c.id]?.verification||'').slice(0,950);
 else if(kind==='time_precision'){
  const specific=/\b(?:dyzur\w*|zmian\w*|pracy|alarm\w*|len\w*|rozmow\w*)/.test(questionText);
  response=specific?String(NPC9_CUSTOM?.[c.id]?.time||'').slice(0,950):'Nie potrafię podać dokładnego czasu tego zdarzenia bez ustalenia, o którą sytuację pytasz.';
 }else if(kind==='alibi')response=String(NPC9_CUSTOM?.[c.id]?.break||'').slice(0,950);
 else if(kind==='direct_accusation')response='Nie przyznaję się do zabójstwa Leny. Ten zarzut wymaga dowodów; samo pytanie nie jest rozstrzygnięciem.';
 else if(kind==='knowledge_source'||kind==='certainty_limit'||kind==='epistemic_challenge'||kind==='place_precision'||kind==='event_sequence'||kind==='reason_for_action'||kind==='report_recipient'||kind==='clarify_reference')response=choose(c.id,kind,questionText);
 // Nie generuj nowych wersji przyznań, odmów lub konfrontacji.
 if(!response||response===old||response.length>1550)return old;
 if(baseline.intents.includes(kind)&&!/^Nie potrafię|^Nie wiem|^Tego nie wiem/i.test(old)&&kind!=='direct_accusation')return old;
 if(!reconcile(c,old,response,kind))return old;
 window.PS613_LAST={witness:c.id,topic:kind,replaced:true};
 return response;
}
// 6.33: retired overlapping answer hook; central 6.33 plan owns question routing.
// retiredAnswerLayer('73-robust-intent-grounded',answer);
window.PS611_NLU=Object.freeze({...prior,analyze,version:'6.13'});
window.PS613_NLU=window.PS611_NLU;
})();
