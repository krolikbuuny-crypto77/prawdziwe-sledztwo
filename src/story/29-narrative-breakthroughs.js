
/* Rozdział przełomów: wyłącznie po połączeniu dwóch sprawdzonych wątków.
   Nie wprowadza nowych dowodów, nie identyfikuje sprawcy i nie omija procedur. */
(function(){
'use strict';
if(typeof STATE==='undefined'||typeof PS53_LINKS==='undefined'||typeof ps53Entry!=='function'||typeof ps53PathReady!=='function')return;
const CHAPTERS=[
 {id:'work',a:'pressure',b:'service',title:'Dwie wersje tej samej zmiany',
  prose:'Zestawienie planu ruchu z dokumentacją warsztatu pokazuje, jak decyzja organizacyjna mogła wyprzedzać pełny opis stanu wagonu. Nie wynika z niego, kto odpowiada za śmierć Leny.',
  people:['MAREK','JANUSZ','TOMASZ'],subject:/(?:wagon|kurs|dyspozycj|harmonogram|zmiana|presj|nacisk).{0,110}(?:warsztat|serwis|protok|zlecen)|(?:warsztat|serwis|protok|zlecen).{0,110}(?:wagon|kurs|dyspozycj|harmonogram|zmiana|presj|nacisk)/i,
  lines:{MAREK:'Jeśli zestawił pan rozkład zmiany z kartą warsztatu, rozumiem, dlaczego wraca pan do moich decyzji. Odpowiadałem za organizację pracy, ale nie potwierdzę, że znałem wszystkie luki w zapisie.',JANUSZ:'Widzę, że porównał pan harmonogram z naszym zleceniem. Wolałbym, aby nikt nie robił z tego wymówki dla niekompletnego protokołu. Nie mówi to jednak, kto był przy Lenie.',TOMASZ:'Zestawienie dyspozycji i serwisu zmienia ocenę presji na zmianie. Nie będę bronił decyzji warsztatowych, których sam nie podejmowałem.'},
  emotion:{MAREK:[7,-3],JANUSZ:[5,0],TOMASZ:[3,1]}},
 {id:'warning',a:'bhp',b:'acceptance',title:'Ostrzeżenie, które minęło się z odbiorem',
  prose:'Projekt zgłoszenia i dokumentacja odbioru wskazują dwa różne obiegi informacji. Można badać zaniedbania proceduralne, nie przypisując im automatycznie związku z przemocą.',
  people:['ELZBIETA','MAGDALENA','JANUSZ'],subject:/(?:bhp|zglosz|ostrzeg|bezpiecz).{0,110}(?:odbior|podzesp|warsztat|protok|l.?2|l.?3)|(?:odbior|podzesp|protok|l.?2|l.?3).{0,110}(?:bhp|zglosz|ostrzeg|bezpiecz)/i,
  lines:{ELZBIETA:'Dopiero gdy porówna pan projekt BHP z dokumentami odbioru, widać, jak rozeszły się informacje. Chciałam, żeby zagrożenie zostało potraktowane poważnie. Nie potwierdzę jednak, że wiem, co wydarzyło się przy stanowisku.',MAGDALENA:'Wiem, że różnica między oznaczeniem części a obiegiem zgłoszenia nie wygląda dobrze. Proszę oceniać konkretne etapy zatwierdzenia; nie mam podstaw, by z samego tego zestawienia wnioskować o zamiarze przemocy.',JANUSZ:'Dla mnie to trudne zestawienie: ostrzeżenie było jednym obiegiem, odbiór drugim. Mogę mówić o warsztacie, nie o tym, co kto postanowił poza nim.'},
  emotion:{ELZBIETA:[3,3],MAGDALENA:[8,-3],JANUSZ:[5,0]}},
 {id:'access',a:'card',b:'alibi',title:'Uprawnienie nie jest człowiekiem',
  prose:'Historia karty T-17 i aktywność konta audytowego opisują inne rodzaje obecności. Ich połączenie otwiera pytania o chronologię, lecz żaden z zapisów sam nie wskazuje osoby.',
  people:['KAMIL','MAGDALENA'],subject:/(?:t.?17|kart|czytnik|drzwi|dostep).{0,110}(?:sesj|audyt|alibi|transmis|log)|(?:sesj|audyt|alibi|transmis|log).{0,110}(?:t.?17|kart|czytnik|drzwi|dostep)/i,
  lines:{KAMIL:'Zestawił pan przekazanie karty z sesją audytową. To właśnie dlatego nie chciałem, aby przypisywano mi każdy odczyt czytnika. Teraz trzeba odróżnić posiadacza uprawnienia od człowieka przy drzwiach.',MAGDALENA:'Nie będę utrzymywać, że sesja konta sama wyjaśnia wszystkie przejścia. Z drugiej strony nie pozwolę, by numer karty stał się bez sprawdzenia dowodem mojej obecności.'},
  emotion:{KAMIL:[5,2],MAGDALENA:[10,-4]}},
 {id:'lastcontact',a:'radio',b:'invitation',title:'Przed spotkaniem',
  prose:'Zmiana dyspozycji kursu i późniejsza korespondencja dotyczą różnych odcinków nocy. Ich połączenie porządkuje pytania o kolejność zdarzeń, ale nie przesądza autorstwa wiadomości.',
  people:['TOMASZ','MAREK','MAGDALENA','ELZBIETA'],subject:/(?:powrot|radio|dyspozycj|kurs).{0,100}(?:sms|wiadom|zaprosz|spotkan|kontakt)|(?:sms|wiadom|zaprosz|spotkan|kontakt).{0,100}(?:powrot|radio|dyspozycj|kurs)|(?:chronologi|kolejnosc).{0,80}(?:kontakt|wiadom|spotkan)/i,
  lines:{TOMASZ:'Widzi pan teraz dwa odrębne etapy: powrót tramwaju i późniejszy kontakt z Leną. Potwierdzę swoją dyspozycję, ale nie dopowiem, kto pisał wiadomość.',MAREK:'Zmiana kursu nie tłumaczy późniejszych rozmów z Leną. Nie powinienem mieszać tych dwóch spraw.',MAGDALENA:'Chronologia kontaktu jest ważna, lecz zapis korespondencji nie mówi jeszcze, kto faktycznie pojawił się na miejscu.',ELZBIETA:'Znam wcześniejsze obawy Leny. Nie widziałam jej późniejszego spotkania; trudno mi mówić o nim inaczej niż w granicach dokumentów.'},
  emotion:{TOMASZ:[6,0],MAREK:[3,-1],MAGDALENA:[7,-2],ELZBIETA:[4,2]}},
 {id:'mechanism',a:'invitation',b:'injury',title:'Ostatni kontakt a przyczyna obrażeń',
  prose:'Kontakt z Leną i specjalistyczna analiza obrażeń stanowią oddzielne ogniwa rekonstrukcji. Ich łączne rozpatrzenie zwiększa znaczenie pytań o zdarzenie, lecz nie zastępuje identyfikacji osoby.',
  people:['MAGDALENA','ELZBIETA','JANUSZ'],subject:/(?:uraz|obrazen|upad|uderzen|sekcj|przyczyn).{0,90}(?:spotkan|kontakt|len|wiadom|ostatn)|(?:spotkan|kontakt|wiadom|ostatn).{0,90}(?:uraz|obrazen|upad|uderzen|sekcj|smier)/i,
  lines:{MAGDALENA:'Proszę nie zamieniać samego kontaktu z Leną w odpowiedź na pytanie o obrażenia. Rozumiem, dlaczego zestawia pan te ustalenia; nie mogę jednak potwierdzić przebiegu zdarzenia.',ELZBIETA:'Trudno mi o tym mówić, kiedy zestawia pan ostatni kontakt Leny z opinią o obrażeniach. To ważne rozróżnienie, ale sama nie widziałam, co jej zrobiono.',JANUSZ:'Wiem, jak wygląda stanowisko, ale nie jestem biegłym od obrażeń. Proszę opierać mechanizm zdarzenia na opinii, nie na moich domysłach.'},
  emotion:{MAGDALENA:[10,-3],ELZBIETA:[5,2],JANUSZ:[5,0]}}
];
const byId=id=>document.getElementById(id);
const normText=q=>norm(String(q||''));
function unlocked(b){
 const a=ps53Entry(b.a),c=ps53Entry(b.b);
 return a.choice==='careful'&&c.choice==='careful'&&ps53PathReady(PS53_MAP.get(b.a),a.path)&&ps53PathReady(PS53_MAP.get(b.b),c.path);
}
function fresh(){return {heard:[],focus:{}};}
function state(){const s=(STATE.sim.drama69 ||=fresh());if(!Array.isArray(s.heard))s.heard=[];if(!s.focus||typeof s.focus!=='object')s.focus={};return s;}
function views(){return CHAPTERS.filter(unlocked);}
const host=document.createElement('section');host.id='ps69Breakthroughs';host.className='surface padded ps69-section';host.setAttribute('aria-label','Przełomy śledztwa');
host.innerHTML='<div class="eyebrow">ODKRYCIA I KONSEKWENCJE</div><h3>Przełomy śledztwa</h3><p class="ps69-intro">Niektóre ustalenia nabierają znaczenia dopiero po porównaniu niezależnych wątków. To nowe spojrzenie na zebrane fakty, a nie dodatkowe dowody.</p><div id="ps69Entries" aria-live="polite"></div>';
const neighbour=byId('ps53Narrative');
if(neighbour)neighbour.insertAdjacentElement('afterend',host);
else byId('deduction')?.append(host);
function render(){const root=byId('ps69Entries');if(!root)return;
 const unlockedBeats=views();root.replaceChildren();
 if(!unlockedBeats.length){const p=document.createElement('p');p.className='ps69-empty';p.textContent='Na razie brak potwierdzonych połączeń. Porównuj w sieci intryg dwie niezależnie zbadane kwestie.';root.append(p);return;}
 for(const b of unlockedBeats){const card=document.createElement('article');card.className='ps69-entry';const h=document.createElement('h4');h.textContent=b.title;const p=document.createElement('p');p.textContent=b.prose;
  const foot=document.createElement('small');foot.textContent='Powiązane osoby: '+b.people.map(id=>CONTENT.characters.find(c=>c.id===id)?.name||id).join(' · ');
  card.append(h,p,foot);root.append(card);}
}
state();render();
const prevStoryRender=ps53Render;
ps53Render=function(){const result=prevStoryRender.apply(this,arguments);render();return result;};
registerNavigationHook({name:'narrative-breakthroughs',after:()=>{if(STATE.tab==='deduction')render();}});
function updateStatement(c,before,after){
 const m=NPC9_MEMORY[c.id],st=NPC4_STATE[c.id];const turn=m?.turn;
 if(!m||!st)return;
 // These are non-evidentiary reactions: do not rewrite a documented admission.
 const sem=m.semantic?.slice().reverse().find(x=>x.turn===turn&&typeof x.answer==='string'&&before.startsWith(x.answer)&&!['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(x.status));
 const stmt=m.statements?.slice().reverse().find(x=>x.turn===turn&&typeof x.text==='string'&&before.startsWith(x.text)&&!['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(x.status));
 if(sem)sem.answer=after;
 if(stmt)stmt.text=after;
 if(st.recent?.length){const last=st.recent.at(-1);last.answer=normText(after).slice(0,1550);}
 if(st.npc5?.recent?.length)st.npc5.recent.at(-1).answer=after.slice(0,1400);
 if(st.npc5?.anchor&&st.npc5.anchor.answer===before)st.npc5.anchor.answer=after.slice(0,1400);
 if(st.npc65?.lastAnswer===before)st.npc65.lastAnswer=after.slice(0,1300);
 if(st.npc68?.threads?.length&&st.npc68.threads.at(-1).a===before.slice(0,850))st.npc68.threads.at(-1).a=after.slice(0,850);
 if(st.npc57?.episodes?.length&&st.npc57.episodes.at(-1).answer===before)st.npc57.episodes.at(-1).answer=after.slice(0,1600);
}
const previousSend=WitnessEngine.snapshotSend();
function dramaturgySend(){
 const c=CONTENT.characters.find(x=>x.id===STATE.activeChar);
 const userQuestion=byId('chatInput')?.value?.trim()||'';
 const attached=byId('attachedDoc')?.value||'';
 const log=c?STATE.dialogues[c.id]:null;
 const oldLen=log?.length||0;
 const s=state(),q=normText(userQuestion);
 const opportunities=c?views().filter(b=>b.people.includes(c.id)):[];
 const direct=opportunities.filter(b=>b.subject.test(q)).sort((a,b)=>{
  const weights={mechanism:5,lastcontact:4,access:3,warning:2,work:1};return (weights[b.id]||0)-(weights[a.id]||0);
 });
 const priorFocus=s.focus[c?.id]||'';
 const follow=(!direct.length&&/^(?:a\s+)?(?:co\s+to\s+zmienia|jak\s+to\s+widzisz|jak\s+na\s+to\s+patrzysz|co\s+o\s+tym\s+myslisz|i\s+co\s+dalej)\??$/.test(q))
  ?opportunities.filter(b=>b.id===priorFocus):[];
 const selected=[...direct,...follow].find(b=>!s.heard.includes(b.id+'/'+c.id));
 const result=previousSend.apply(this,arguments);
 if(!c||!log||log.length<=oldLen||!userQuestion||attached)return result;
 const last=log.at(-1),invalid=!last||last.role!=='npc'||!last.text||simWitness(c).blocked||/odmow|pelnomocnik|nie bede dalej odpowiadac|nie moge potwierdzic wniosku z tego materialu/i.test(normText(last?.text));
 if(direct.length)s.focus[c.id]=direct[0].id;
 if(invalid||!selected)return result;
 const tag=selected.id+'/'+c.id;
 if(s.heard.includes(tag)||!unlocked(selected))return result;
 const before=last.text,extra=selected.lines[c.id];if(!extra)return result;
 // If the previous chapter has just appended its one-off reaction, replace that
 // reaction with the combined breakthrough instead of repeating the same point.
 const oldReaction=[selected.a,selected.b].map(id=>PS53_MAP.get(id)?.reactions?.[c.id]).find(t=>t&&last.text.endsWith('\n\n'+t));
 if(oldReaction)last.text=last.text.slice(0,-(oldReaction.length+2));
 last.text+='\n\n'+extra;
 s.heard.push(tag);if(s.heard.length>90)s.heard.splice(0,s.heard.length-90);
 s.focus[c.id]=selected.id;
 const [tension,rapport]=selected.emotion[c.id]||[0,0];
 const npc=NPC4_STATE[c.id];
 npc.tension=npc4Clamp(npc.tension+tension);npc.rapport=npc4Clamp(npc.rapport+rapport);
 updateStatement(c,before,last.text);
 renderChat();simRenderInterrogation();
 return result;
}
registerWitnessSendLayer("narrative-breakthroughs",dramaturgySend);
// The existing handler belongs to the prior chapter. Replace it to avoid double sends.


/* SaveManager: buildSave hook. */
registerSaveHook({name:"29-narrative-breakthroughs-save1", build(__save){const data=__save;if(data.investigationSim){const s=state();data.investigationSim.drama69={heard:s.heard.slice(-90),focus:{...s.focus}};}return data;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"29-narrative-breakthroughs-load1", apply(d){const res=undefined;const raw=d?.investigationSim?.drama69;STATE.sim.drama69=fresh();
 if(raw&&typeof raw==='object'){
  const s=state();const possible=new Set(views().flatMap(b=>b.people.map(id=>b.id+'/'+id)));
  s.heard=[...new Set((Array.isArray(raw.heard)?raw.heard:[]).filter(x=>typeof x==='string'&&possible.has(x)))].slice(-90);
  for(const c of CONTENT.characters){const focus=raw.focus?.[c.id];if(typeof focus==='string'&&views().some(b=>b.id===focus&&b.people.includes(c.id)))s.focus[c.id]=focus;}
 }
 render();return res;}});
const oldReset=simReset;
simReset=function(){const res=oldReset.apply(this,arguments);STATE.sim.drama69=fresh();render();return res;};
window.PS69_STORY={chapters:CHAPTERS.map(({id,a,b,title,people})=>({id,a,b,title,people})),available:()=>views().map(b=>b.id),state:()=>state(),render};
})();

