
/* -- NOWY MODUL PSYCHOLOGICZNY -- */
/* Psychologia przesłuchań: przełom na podstawie skorygowanych zeznań, reakcje na błędy
   i dwa nowe, udokumentowane pytania następcze. Bez automatycznego dodawania dowodów. */
(function(){
'use strict';
if(typeof STATE==='undefined'||typeof ps52Witness!=='function'||typeof simSendChat!=='function'||typeof ps52Threads!=='function')return;
// Nazwa zjawiska «zagrożenie» nie jest groźbą przesłuchującego.
const baseTone=npc9Tone;
npc9Tone=function(raw){const text=String(raw||'').replace(/\bzagro(?:ż|z)en(?:ie|ia|iu|iem)?\b/gi,'ryzyko');return baseTone(text);};
const by=id=>document.getElementById(id);
const people=Object.fromEntries(CONTENT.characters.map(c=>[c.id,c]));
const witnessReaction={
 MAREK:{break:'Marek milknie, opiera ręce o stół i sprawdza wzrokiem oba dokumenty.',wrong:'To nie jest dokument, o który pan pyta. Nie będę łączył niepowiązanych zapisów.',firm:'Może pan mówić stanowczo, ale nie zmieni to treści rozliczeń.',post:'Marek ostrożniej dobiera słowa; zamiast ogólnych zapewnień wraca do zakresu własnej odpowiedzialności.'},
 TOMASZ:{break:'Tomasz urywa wypowiedź. Odwraca wzrok ku drzwiom, zanim podejmuje odpowiedź.',wrong:'Ta karta nie wyjaśnia mojej dyspozycji. Proszę nie mieszać tych zdarzeń.',firm:'Nie potrzebuję podniesionego tonu, żeby przypomnieć sobie tamtą noc.',post:'Tomasz przestaje odpowiadać odruchowo. Wyraźnie rozdziela to, co pamięta, od informacji z rejestru.'},
 JANUSZ:{break:'Janusz zaciska dłonie na krawędzi stołu, po czym powoli prostuje wcześniej złożone wyjaśnienie.',wrong:'Pan miesza dokumentację warsztatu z inną sprawą. Proszę o konkretny zapis.',firm:'Nie ustala się przebiegu naprawy przez nacisk na pracownika.',post:'Janusz przestaje zasłaniać się skrótem procedury i wyjaśnia dokumentację punkt po punkcie.'},
 ELZBIETA:{break:'Elżbieta zamiera, spuszcza wzrok na notatki i po dłuższej chwili prostuje swoje słowa.',wrong:'Nie wiem, jak ten dokument miałby potwierdzać to, o co pan pyta.',firm:'Proszę nie wymuszać na mnie wspomnień. Potrzebuję spokojnego, dokładnego pytania.',post:'Elżbieta mówi ciszej, ale konkretniej. Zaznacza granicę między obawą a wiedzą o zdarzeniu.'},
 KAMIL:{break:'Kamil odsuwa się od stołu. Po chwili wraca do wykresów i precyzuje wcześniejsze zapewnienia.',wrong:'To są dwa różne zestawy danych. Samo ich pokazanie nie tworzy związku.',firm:'Proszę nie przedstawiać mi technicznego logu jak gotowego oskarżenia.',post:'Kamil rezygnuje z szybkich odpowiedzi, dokładnie rozdzielając zdarzenie systemowe i działanie osoby.'},
 MAGDALENA:{break:'Magdalena zawiesza głos. Przez chwilę patrzy na dokument, następnie rzeczowo koryguje stanowisko.',wrong:'Nie widzę związku między tym materiałem a pańskim pytaniem.',firm:'Nacisk nie zastąpi wykazania związku między źródłem a twierdzeniem.',post:'Magdalena nadal zachowuje formalny ton, ale przestaje kategorycznie wykluczać ustalone rozbieżności.'}
};
// Każda nowa odpowiedź ogranicza się do tego, co wynika z dotychczasowych sprostowań.
const routes={
 MN_PAYROLL:{explain:['Co dokładnie wycofuje pan ze swojej wcześniejszej wypowiedzi o ewidencji?', 'Wycofuję stwierdzenie, że sam grafik pozwalał odtworzyć obecność osób. Wpisy korygowano ręcznie; nie wolno z nich bezpośrednio wyprowadzać czyjejś lokalizacji.'],verify:['Jak można niezależnie sprawdzić te korekty?', 'Trzeba zestawić pierwotną ewidencję, historię poprawek i rejestr wejść. Te źródła opisują inne etapy, a każde ma własne ograniczenia.']},
 TK_RADIO:{explain:['Którą część wcześniejszej relacji o powrocie wagonu musi pan sprostować?', 'Zmieniałem dyspozycję powrotu TW-217. Nie powinienem był przedstawiać przebiegu jako standardowego. Luka w radiu pozostaje osobnym pytaniem.'],verify:['Co potwierdzi i co może podważyć pańską wersję dyspozycji?', 'Proszę zestawić polecenie powrotu z dostępną korespondencją radiową i zarejestrowaną chronologią wagonu. Brak fragmentu nagrania nie dowodzi sam z siebie czyjegoś zamiaru.']},
 JW_SERVICE:{explain:['Co było niepełne w opisywanym przeglądzie?', 'Karta nie była kompletna; nie powinienem był tak jej nazywać. Trzeba osobno sprawdzić wykonane czynności i ich autoryzację.'],verify:['Z którymi dokumentami porównać kartę warsztatu?', 'Z pierwotnym zleceniem, dokumentacją testu i potwierdzeniem autoryzacji. Sam brak wpisu nie wyjaśnia, co stało się później z Leną.']},
 EZ_HAZARD:{explain:['Co pani koryguje w zeznaniu o zgłoszeniu bezpieczeństwa?', 'Nie powinnam była mówić, że wszystkie sygnały zostały przekazane formalnie. Zgłoszenie pozostało projektem, nie potwierdzonym doręczeniem.'],verify:['Jak sprawdzić, czy ostrzeżenie rzeczywiście dotarło do właściwej osoby?', 'Należy odróżnić treść projektu od rejestru wysyłki i potwierdzenia odbioru. Bez nich nie powiem, kto zapoznał się z ostrzeżeniem.']},
 KB_CARD:{explain:['Co pan teraz potwierdza w sprawie karty T-17?', 'Przekazałem kartę T-17 Magdalenie o 00:39. Nie powinienem był twierdzić, że cały czas pozostawała pod moją kontrolą.'],verify:['Jak zweryfikować dalsze użycie przekazanej karty?', 'Proszę porównać zapis przekazania z odczytami czytników i niezależnymi źródłami obecności. Czytnik nie identyfikuje twarzy osoby, która użyła karty.']},
 KB_TEST:{explain:['Co zmienia okazana autoryzacja diagnostyki?', 'Pozwala precyzyjniej wyjaśnić zakres autoryzowanego testu. Nie można traktować alarmu diagnostycznego jako bezpośredniego obrazu urazów Leny.'],verify:['Jak potwierdzić, w jakim trybie pracował system?', 'Trzeba zestawić autoryzację testu z przebiegiem sesji TCMS. Nie wystarcza sam odczyt jednego zdarzenia z logu.']},
 MK_SESSION:{explain:['Które twierdzenie o alibi musi pani ograniczyć?', 'Aktywna transmisja nie dowodzi, że przez cały ten czas fizycznie przebywałam w pokoju. Tego nie mogę już kategorycznie utrzymywać na podstawie samego połączenia.'],verify:['Jak sprawdzić faktyczną obecność podczas transmisji?', 'Trzeba porównać log sesji, zapis przejść i materiał kamer. Każde z tych źródeł ma inny zakres i żadne samo nie przesądza tożsamości.']},
 MK_INVITATION:{explain:['Co pani przyjmuje do wiadomości w sprawie kontaktu z Leną?', 'Nie mogę już kategorycznie wykluczać kontaktu wskazanego w odzyskanej korespondencji. Nie oznacza to jednak przyznania zamiaru wyrządzenia krzywdy.'],verify:['Co może potwierdzić pochodzenie tej wiadomości?', 'Należy zestawić treść z metadanymi urządzenia i rzeczywistą chronologią. Sam tekst nie jest dowodem, kto spotkał się z Leną.']},
 MK_ACCEPTANCE:{explain:['Co się nie zgadza w odbiorze podzespołu?', 'Istnieje rozbieżność między oznaczeniem fizycznej części a dokumentacją odbioru. Wcześniej mówiłam o tej zgodności zbyt kategorycznie.'],verify:['Jak zweryfikować rozbieżność w oznaczeniach?', 'Proszę zestawić oryginalne oznaczenie części z protokołem odbioru i historią autoryzacji. Nie można z tego automatycznie wnioskować o sprawcy śmierci Leny.']}
};
const clone=v=>JSON.parse(JSON.stringify(v));
function fresh(){return {version:1,witnesses:{}};}
function state(){return STATE.sim.breakthrough ||=fresh();}
function one(id){const s=state();return s.witnesses[id] ||= {phase:'neutral',unlocked:[],last:'',lastIssue:'',missteps:0,misstepKeys:[],followed:[],revision:0};}
function normQ(s){return norm(String(s||'')).replace(/\s+/g,' ').trim();}
function recognized(c,issue){return !!ps52Witness(c).issues?.[issue]?.resolved&&!!ps52Witness(c).issues?.[issue]?.conflict;}
function getCandidate(c,q){const input=normQ(q);for(const issue of one(c.id).unlocked){if(!recognized(c,issue))continue;for(const key of ['explain','verify']){const route=routes[issue]?.[key];if(route&&normQ(route[0])===input)return {issue,key,answer:route[1]};}}return null;}
const emotional=/smier|zgin|tragic|lek|obaw|zal|uczuc|emocj|strach|win|plak|wstrza/;
function irrelevant(c,question,doc){if(!doc||!STATE.found.has(doc)||!ps52EvidenceValid(doc))return false;
 const topics=ps52Threads(c).filter(t=>PS52_THREADS[t.id]?.tokens.test(normQ(question)));
 if(!topics.length)return false;return !topics.some(t=>t.evidence.includes(doc));}
function bindReaction(c,kind,issue){const p=one(c.id);p.last=kind;p.lastIssue=issue||p.lastIssue;p.revision++;
 const stage=by('witnessStage');if(stage){stage.dataset.psbSignal=kind;}
}
function appendLine(c,line){const log=STATE.dialogues[c.id],last=log?.at(-1);if(last?.role!=='npc')return false;
 if(!String(last.text).includes(line))last.text+='\n\n'+line;return true;}
function afterReply(c){if(STATE.tab==='interview')renderChat();}
const previous=WitnessEngine.snapshotSend();
function send(){
 const c=people[STATE.activeChar],q=by('chatInput')?.value?.trim()||'',doc=by('attachedDoc')?.value||'';
 if(!c||!q)return previous.apply(this,arguments);
 const p=one(c.id),found=STATE.found.size,log=STATE.dialogues[c.id],start=log?.length||0;
 const snapshot=Object.fromEntries(ps52Threads(c).map(t=>[t.id,recognized(c,t.id)]));
 const candidate=!doc?getCandidate(c,q):null;
 const badDoc=irrelevant(c,q,doc);
 const stance=NPC4_STATE[c.id]?.stance||'neutral',tactic=ps52Witness(c)?.tactic||'free';
 const insensitive=!!(!doc&&stance==='firm'&&['ELZBIETA','TOMASZ','MAGDALENA'].includes(c.id)&&emotional.test(normQ(q)));
 const wasBlocked=!!simWitness(c).blocked;
 const coercive=npc9Tone(q)==='pressure';
 const out=previous.apply(this,arguments);
 // Nie ingerujemy w oryginalne bramki, odmowy, liczniki zdobytych dowodów ani diagnozę AI.
 const newReply=log?.length>start&&log.at(-1)?.role==='npc';
 if(newReply&&!wasBlocked){
  let changed=false;
  for(const t of ps52Threads(c)){
   if(!snapshot[t.id]&&recognized(c,t.id)&&!p.unlocked.includes(t.id)){
    p.unlocked.push(t.id);p.phase='fractured';bindReaction(c,'break',t.id);PS_EVENTS.breakthrough(c.id,t.id);
    changed=true;
   }
  }
  if(!changed&&candidate&&!simWitness(c).blocked&&p.unlocked.includes(candidate.issue)){
   // Swobodna wypowiedź w odblokowanym wątku, bez dopisywania nowych faktów sprawy.
   const last=log.at(-1),old=last.text;last.text=candidate.answer;
   const m=NPC9_MEMORY[c.id];const sem=m?.semantic?.slice().reverse().find(x=>x.answer===old&&x.turn===m.turn&& !['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(x.status));
   if(sem)sem.answer=candidate.answer;
   const stmt=m?.statements?.slice().reverse().find(x=>x.text===old&&x.turn===m.turn&& !['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(x.status));
   if(stmt)stmt.text=candidate.answer;
   const key=candidate.issue+'/'+candidate.key;if(!p.followed.includes(key))p.followed.push(key);
   p.phase='reconsidering';bindReaction(c,'reflection',candidate.issue);
  }else if(!changed&&badDoc&&!simWitness(c).blocked){
   const key=doc+':'+normQ(q).slice(0,55);if(!p.misstepKeys.includes(key)){
    p.misstepKeys.push(key);p.misstepKeys=p.misstepKeys.slice(-35);p.missteps=Math.min(30,p.missteps+1);
    NPC4_STATE[c.id].tension=npc4Clamp(NPC4_STATE[c.id].tension+7);
    NPC4_STATE[c.id].rapport=npc4Clamp(NPC4_STATE[c.id].rapport-5);
   }
   appendLine(c,witnessReaction[c.id].wrong);
   p.phase='guarded';bindReaction(c,'unrelated',doc);
   // Dopiero powtarzana błędna konfrontacja przy wysokim napięciu prowadzi do przerwy.
   if(p.missteps>=3&&NPC4_STATE[c.id].tension>=80&&NPC4_STATE[c.id].rapport<=22){
    simWitness(c).blocked=true;appendLine(c,'Na tym zakończę rozmowę. Proszę zarządzić przerwę i wrócić do pytań opartych na faktach.');p.phase='closed';bindReaction(c,'closed',doc);
   }
  }else if(!changed&&insensitive&&!simWitness(c).blocked){
   appendLine(c,witnessReaction[c.id].firm);
   NPC4_STATE[c.id].tension=npc4Clamp(NPC4_STATE[c.id].tension+5);
   NPC4_STATE[c.id].rapport=npc4Clamp(NPC4_STATE[c.id].rapport-3);
   p.phase='guarded';bindReaction(c,'pressure');
  }else if(!changed&&simWitness(c).blocked){p.phase='closed';bindReaction(c,'closed');}
  else if(!changed&&coercive){appendLine(c,witnessReaction[c.id].firm);p.phase='guarded';bindReaction(c,'pressure');}
  else if(!changed&&p.phase==='fractured'){p.phase='reconsidering';bindReaction(c,'reflection');}
 }
 // Liczba dowodów nie może wzrosnąć wskutek samej rozmowy z lokalną warstwą reakcji.
 if(STATE.found.size!==found)console.warn('[psych] Niezależny mechanizm zmienił liczbę dowodów podczas przesłuchania');
 if(newReply&&wasBlocked){p.phase='closed';bindReaction(c,'closed');}
 if(newReply)afterReply(c);
 return out;
}
registerWitnessSendLayer("witness-breakthrough-reactions",send);

// Stan zachowania jest również widoczny dla opóźnionego renderowania portretów.
function install(){const root=by('interview');if(!root||by('psbPanel'))return;
 const panel=document.createElement('section');panel.id='psbPanel';panel.className='psb-panel';panel.setAttribute('aria-live','polite');panel.hidden=true;
 const chat=root.querySelector('.chathead');chat?.insertAdjacentElement('afterend',panel);
 root.addEventListener('click',ev=>{const button=ev.target.closest('[data-psb-route]');if(!button)return;
  const c=people[STATE.activeChar];if(!c)return;
  const [issue,kind]=(button.dataset.psbRoute||'').split('/');if(!one(c.id).unlocked.includes(issue)||!recognized(c,issue)||!routes[issue]?.[kind])return;
  by('attachedDoc').value='';by('chatInput').value=routes[issue][kind][0];by('chatInput').focus();
  by('chatInput').scrollIntoView({block:'nearest',behavior:'smooth'});
 });
}
function ui(){install();const c=people[STATE.activeChar],panel=by('psbPanel');if(!c||!panel)return;
 const p=one(c.id),rec=witnessReaction[c.id],last=[...p.unlocked].reverse().find(id=>recognized(c,id));
 const relevant=!!last,active=!!p.last;
 panel.hidden=!relevant&&!active;
 if(panel.hidden)return;
 const title=p.phase==='fractured'?'PRZEŁOM W ZEZNANIACH':p.phase==='reconsidering'?'ZMIANA STANOWISKA':p.phase==='closed'?'ROZMOWA PRZERWANA':p.phase==='guarded'?'UTRATA ZAUFANIA':'PRZESŁUCHANIE';
 const summary=p.phase==='fractured'?rec.break:p.phase==='reconsidering'?rec.post:p.phase==='closed'?'Świadek odmawia dalszych odpowiedzi. Zarządź przerwę, aby wrócić do rozmowy.':p.phase==='guarded'?'Okazany materiał lub forma pytania wzbudziły opór. Wróć do pytań rzeczowych.':rec.post;
 panel.replaceChildren();
 const top=document.createElement('div');top.className='psb-heading';top.innerHTML='<span class="psb-mark" aria-hidden="true">◈</span><div><strong></strong><p></p></div>';
 top.querySelector('strong').textContent=title;top.querySelector('p').textContent=summary;panel.append(top);
 if(relevant){const routesBox=document.createElement('div');routesBox.className='psb-routes';const label=document.createElement('p');label.className='psb-label';label.textContent='NOWE PYTANIA — NA PODSTAWIE ZWERYFIKOWANYCH ZEZNAŃ';routesBox.append(label);
  for(const key of ['explain','verify']){const item=routes[last]?.[key];if(!item)continue;const b=document.createElement('button');b.type='button';b.className='psb-btn';b.dataset.psbRoute=last+'/'+key;b.textContent=(key==='explain'?'Doprecyzuj zmianę stanowiska':'Sprawdź nowe wyjaśnienie')+' ↗';b.title=item[0];routesBox.append(b);}
  panel.append(routesBox);
 }
 const stage=by('witnessStage')?.querySelector('.wp-stage');if(stage){stage.dataset.psbPerson=c.id;stage.classList.remove('psb-fractured','psb-reconsidering','psb-guarded','psb-closed');stage.classList.add('psb-'+(p.phase==='fractured'?'fractured':p.phase==='reconsidering'?'reconsidering':p.phase==='closed'?'closed':p.phase==='guarded'?'guarded':'reconsidering'));
  const badge=document.createElement('div');badge.className='psb-portrait-caption';badge.textContent=title;stage.append(badge);
  stage.querySelector('.wp-picture')?.setAttribute('aria-label','Portret: '+c.name+'. '+title.toLowerCase());
 }
 const quick=by('witnessQuickState');if(quick){quick.querySelector('b')&&(quick.querySelector('b').textContent='REAKCJA ŚWIADKA');const text=quick.querySelector('span');if(text)text.textContent=title.toLowerCase()+'. Reakcja nie przesądza o winie.';}
}
const prevChat=renderChat;
renderChat=function(){const out=prevChat.apply(this,arguments);ui();return out;};
const prevBreak=simBreak;
 simBreak=function(){const out=prevBreak.apply(this,arguments);const c=people[STATE.activeChar];if(c&&!simWitness(c).blocked&&one(c.id).phase==='closed'){one(c.id).phase='guarded';bindReaction(c,'recess');if(STATE.tab==='interview')renderChat();}return out;};
 
/* SaveManager: buildSave hook. */
registerSaveHook({name:"35-witness-breakthroughs-save1", build(__save){const out=__save;if(out.investigationSim)out.investigationSim.breakthrough=clone(state());return out;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"35-witness-breakthroughs-load1", apply(d){const out=undefined,raw=d?.investigationSim?.breakthrough;STATE.sim.breakthrough=fresh();
 if(raw&&typeof raw==='object'&&raw.witnesses&&typeof raw.witnesses==='object'){
  for(const c of CONTENT.characters){const x=raw.witnesses[c.id];if(!x)continue;const p=one(c.id);
   p.unlocked=[...new Set((Array.isArray(x.unlocked)?x.unlocked:[]).filter(id=>routes[id]&&recognized(c,id)))];
   p.phase=['neutral','fractured','reconsidering','guarded','closed'].includes(x.phase)?x.phase:'neutral';
   if(p.phase==='fractured'&&!p.unlocked.length)p.phase='neutral';
   p.last=typeof x.last==='string'?x.last.slice(0,28):'';
   p.lastIssue=typeof x.lastIssue==='string'?x.lastIssue.slice(0,40):'';
   p.missteps=Number.isInteger(x.missteps)?Math.max(0,Math.min(30,x.missteps)):0;
   p.misstepKeys=(Array.isArray(x.misstepKeys)?x.misstepKeys:[]).filter(v=>typeof v==='string').slice(-35);
   p.followed=(Array.isArray(x.followed)?x.followed:[]).filter(v=>typeof v==='string'&&v.length<65).slice(-30);
  }
 }
 for(const c of CONTENT.characters){const p=one(c.id);if(p.unlocked.length===0&&(!raw||!raw.witnesses?.[c.id])){const legacy=ps52Threads(c).filter(t=>recognized(c,t.id)).map(t=>t.id);if(legacy.length){p.unlocked=legacy;p.phase='reconsidering';p.last='reflection';p.lastIssue=legacy.at(-1);}}}
 if(STATE.tab==='interview')renderChat();return out;}});
const prevReset=simReset;
simReset=function(){const result=prevReset.apply(this,arguments);STATE.sim.breakthrough=fresh();if(STATE.tab==='interview')renderChat();return result;};
window.PS_BREAKTHROUGH={version:1,state:id=>id?clone(one(id)):clone(state()),shouldKeepCanonical:(id,q,attached)=>!attached&&!!people[id]&&!!getCandidate(people[id],q)};
install();if(STATE.tab==='interview')ui();
})();
