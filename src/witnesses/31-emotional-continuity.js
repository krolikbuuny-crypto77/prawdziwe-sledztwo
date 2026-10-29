
/* Ciągłość emocjonalna: świadek pamięta rozmowę o zweryfikowanym przełomie.
   Bez nowych dowodów, przyznań, zmian werdyktu lub automatycznych zmian relacji. */
(function(){
'use strict';
if(!window.PS69_STORY||!window.PS70_ARC||typeof simSendChat!=='function')return;
const by=id=>document.getElementById(id);
const witnesses=Object.fromEntries(CONTENT.characters.map(c=>[c.id,c]));
const voices={
 work:{
  MAREK:'Kiedy patrzy pan na oba dokumenty razem, wiem, że nie chodzi już tylko o grafik. Mogę wyjaśnić swoje decyzje, ale nie zastąpię własną pamięcią wpisów warsztatu.',
  JANUSZ:'Proszę nie sprowadzać tego do jednego brakującego podpisu. W warsztacie liczą się wykonane czynności; o dyspozycji kursu nie decydowałem.',
  TOMASZ:'W dyspozytorni widziałem decyzję o kursie. Zlecenie warsztatowe to drugi ślad i nie chcę udawać, że sam jeden wyjaśnia drugi.'},
 warning:{
  ELZBIETA:'Wolałabym, żeby ktoś potraktował tę różnicę poważnie wcześniej. Mogę opisać zgłoszenie, ale nie znam przebiegu każdego późniejszego zatwierdzenia.',
  MAGDALENA:'To niewygodne zestawienie, lecz właśnie dlatego trzeba ustalić etapy obiegu. Nie przypiszę intencji człowiekowi na podstawie samej rozbieżności dokumentów.',
  JANUSZ:'Nie zacieram różnicy między ostrzeżeniem a odbiorem. Trzeba jeszcze ustalić, kiedy i do kogo każda informacja faktycznie dotarła.'},
 access:{
  KAMIL:'W takim zestawieniu log przestaje być prostą odpowiedzią. Konto, karta i człowiek to nie są zamienne pojęcia; niczego więcej nie potwierdzę bez dalszego sprawdzenia.',
  MAGDALENA:'Rozumiem, że te zapisy obok siebie budzą pytania. Nie będę nazywać połączenia dowodem czyjejś obecności, nawet jeśli komplikuje to wyjaśnienia.'},
 lastcontact:{
  TOMASZ:'Mój udział dotyczył powrotu wagonu. Gdy przechodzi pan do późniejszej wiadomości, wchodzi pan w zdarzenie, którego nie obserwowałem.',
  MAREK:'Mogę odpowiadać za decyzje organizacyjne tej zmiany. Nie umiem na ich podstawie powiedzieć, kto później kontaktował się z Leną.',
  MAGDALENA:'Z samej kolejności nie wyciągnę wniosku o nadawcy ani o spotkaniu. Te pytania wymagają osobnych źródeł.',
  ELZBIETA:'Trudno wracać do tamtej nocy. O obawach Leny mogę mówić, lecz nie chcę zamieniać ich w opowieść o jej ostatnim spotkaniu.'},
 mechanism:{
  MAGDALENA:'To bardzo poważny wątek. Proszę jednak nie traktować zapisu kontaktu jak relacji z chwili odniesienia obrażeń.',
  ELZBIETA:'Nie jest mi łatwo słuchać o szczegółach obrażeń Leny. Właśnie dlatego nie powiem, że wiem, co się stało, skoro tego nie widziałam.',
  JANUSZ:'Znam warunki pracy przy stanowisku, nie przebieg zdarzenia. O obrażeniach powinna mówić opinia specjalisty.'}
};
const follow=/^(?:a\s+|i\s+|no\s+i\s+)?(?:co\s+to\s+zmienia|co\s+to\s+znaczy|co\s+teraz|i\s+co\s+dalej|jak\s+to\s+widzisz|jak\s+na\s+to\s+patrzysz|co\s+o\s+tym\s+myslisz|jak\s+to\s+oceniasz|dlaczego\s+to\s+wazne|czy\s+cos\s+sie\s+zmienilo|jak\s+sie\s+z\s+tym\s+czujesz)\??$/;
function clean(q){return norm(String(q||'')).replace(/\s+/g,' ').trim();}
const recap={
 work:'Dyspozycja kursu i dokumentacja warsztatu nie odpowiadają na te same pytania.',
 warning:'Wysłanie ostrzeżenia i zatwierdzenie odbioru wymagają osobnych potwierdzeń.',
 access:'Numer karty lub sesji nie pozwala sam wskazać osoby przy drzwiach.',
 lastcontact:'Dyspozycja powrotu nie ustala, kto później kontaktował się z Leną.',
 mechanism:'Zapis kontaktu nie zastąpi opinii o mechanizmie obrażeń ani identyfikacji osoby.'
};
const openings={MAREK:'Powiedziałem, jaki był zakres mojej odpowiedzialności.',TOMASZ:'Nie potrafię odtworzyć tego ponad zapisy dyspozytorni.',JANUSZ:'Nie będę zgadywał ponad to, co zrobiono w warsztacie.',ELZBIETA:'Nie mam innej relacji naocznej.',KAMIL:'To granica tego, co pokazują odczyty.',MAGDALENA:'Pozostańmy przy tym, co rzeczywiście można zweryfikować.'};
function fresh(){return {reflected:[],repeats:{}};}
function state(){const s=STATE.sim.emotional71 ||=fresh();if(!Array.isArray(s.reflected))s.reflected=[];if(!s.repeats||typeof s.repeats!=='object')s.repeats={};return s;}
function validTags(){const a=new Set(window.PS69_STORY.available());return new Set((window.PS69_STORY.state().heard||[]).filter(k=>typeof k==='string'&&a.has(k.split('/')[0])));}
function sync(c,before,after){
 const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id];if(!m||!s)return;
 const sem=m.semantic?.slice().reverse().find(x=>x.turn===m.turn&&x.answer===before&& !['CONFESSION','CORRECTION_WITH_EVIDENCE'].includes(x.status));
 const stmt=m.statements?.slice().reverse().find(x=>x.turn===m.turn&&x.text===before&& !['CONFESSION','CORRECTION_WITH_EVIDENCE'].includes(x.status));
 if(sem)sem.answer=after;if(stmt)stmt.text=after;
 if(s.recent?.length)s.recent.at(-1).answer=clean(after).slice(0,1550);
 if(s.npc5?.recent?.length&&s.npc5.recent.at(-1).answer===before)s.npc5.recent.at(-1).answer=after.slice(0,1400);
 if(s.npc65?.lastAnswer===before)s.npc65.lastAnswer=after.slice(0,1300);
 if(s.npc68?.threads?.length&&s.npc68.threads.at(-1).a===before.slice(0,850))s.npc68.threads.at(-1).a=after.slice(0,850);
}
const previous=WitnessEngine.snapshotSend();
function coherentSend(){
 const c=witnesses[STATE.activeChar],raw=by('chatInput')?.value||'',attached=by('attachedDoc')?.value||'';
 const log=c?STATE.dialogues[c.id]:null,oldLen=log?.length||0,previousHeard=new Set(window.PS69_STORY.state().heard||[]);
 const focus=c?window.PS69_STORY.state().focus?.[c.id]:null;
 const tag=focus+'/'+c?.id,eligible=!!c&&!attached&&follow.test(clean(raw))&&previousHeard.has(tag)&&validTags().has(tag)&&!!voices[focus]?.[c.id];
 const out=previous.apply(this,arguments);
 if(!eligible||!log||log.length!==oldLen+2||!window.PS69_STORY.available().includes(focus)||simWitness(c).blocked)return out;
 const last=log.at(-1);
 if(!last||last.role!=='npc'||!last.text||/odmow|pelnomocnik|nie bede dalej odpowiadac|material niezweryfikowany|przerwac przesluchanie/i.test(clean(last.text)))return out;
 const before=last.text;
 const answered=state().reflected.includes(tag);
 let reflection;
 if(!answered){
  reflection=voices[focus][c.id];state().reflected.push(tag);
 }else{
  const n=state().repeats[tag]||0;
  reflection=n%2===0?openings[c.id]+' '+recap[focus]:'Nie mam do tej części nowych informacji. '+recap[focus];
  state().repeats[tag]=Math.min(99,n+1);
 }
 // A direct, subject-specific follow-up is clearer than a generic, unrelated answer.
 last.text=reflection;
 sync(c,before,reflection);
 renderChat();simRenderInterrogation();
 return out;
}
registerWitnessSendLayer("emotional-continuity",coherentSend);

// Complete the existing epilogue with a trace of what was actually discussed.
const epilogue=by('ps70Afterword');
const closing=document.createElement('p');closing.id='ps71Closing';closing.className='ps71-continuity';closing.hidden=true;
epilogue?.append(closing);
function render(){
 if(!closing||!epilogue||epilogue.hidden){if(closing)closing.hidden=true;return;}
 const available=new Set(window.PS69_STORY.available());
 const witnessed=(window.PS69_STORY.state().heard||[]).filter(tag=>{const [beat,who]=tag.split('/');return available.has(beat)&&!!witnesses[who];});
 const last=witnessed.at(-1);
 if(!last){closing.hidden=true;closing.textContent='';return;}
 const [beat,who]=last.split('/');
 const title=window.PS69_STORY.chapters.find(x=>x.id===beat)?.title||'połączonych ustaleń';
 closing.textContent='Do wątku „'+title+'” powrócono w rozmowie z jednym ze świadków — '+witnesses[who].name+'. Reakcja tej osoby została odnotowana, ale nie przesądza wyniku sprawy.';
 closing.hidden=false;
}
const oldArcRender=window.PS70_ARC.render;
window.PS70_ARC.render=function(){const out=oldArcRender.apply(this,arguments);render();return out;};
registerNavigationHook({name:'emotional-continuity',after:render});

/* SaveManager: buildSave hook. */
registerSaveHook({name:"31-emotional-continuity-save1", build(__save){const out=__save;if(out.investigationSim){out.investigationSim.emotional71={reflected:state().reflected.slice(-40),repeats:{...state().repeats}};}return out;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"31-emotional-continuity-load1", apply(data){const out=undefined,tags=validTags();
 const raw=data?.investigationSim?.emotional71?.reflected;
 const reflected=[...new Set((Array.isArray(raw)?raw:[]).filter(x=>typeof x==='string'&&tags.has(x)))].slice(-40);
 const repeats={};for(const tag of reflected){const n=Number(data?.investigationSim?.emotional71?.repeats?.[tag]);if(Number.isInteger(n)&&n>=0&&n<=99)repeats[tag]=n;}
 STATE.sim.emotional71={reflected,repeats};
 render();return out;
}});
const oldReset=simReset;
simReset=function(){const out=oldReset.apply(this,arguments);STATE.sim.emotional71=fresh();render();return out;};
state();render();
})();
