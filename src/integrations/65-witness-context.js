/* Pakiet 6.5: tylko informacje już dopuszczone przez lokalny silnik mogą trafić do AI.
   Profil psychologiczny jest opisowy; dowody, bramki i reakcje emocjonalne pozostają lokalne. */
const PS65_CONTEXT = (() => {
 'use strict';
 const clean=(v,n=500)=>String(v??'').replace(/[<>\u0000-\u001f]/g,' ').trim().slice(0,n);
 const bounded=(v)=>Math.max(0,Math.min(100,Number(v)||0));
 const people=Object.fromEntries(CONTENT.characters.map(c=>[c.id,c]));

 // Pakiet 6.7: osobny dziennik KANONICZNYCH odpowiedzi lokalnego silnika.
 // Tekst przeredagowany przez chmurę NIE staje się automatycznie nowym faktem.
 const approved=Object.fromEntries(CONTENT.characters.map(c=>[c.id,[]]));
 const logRefs=Object.fromEntries(CONTENT.characters.map(c=>[c.id,STATE.dialogues[c.id]]));
 const trim=(s,n=900)=>clean(s,n);
 function remember(id,answer,log){
  if(!Object.prototype.hasOwnProperty.call(approved,id))return;
  // Reset rozgrywki wymienia tablice dialogów (import ma własny hook poniżej).
  if(logRefs[id]!==log){approved[id]=[];logRefs[id]=log;}
  const text=trim(answer,1400);
  if(!text)return;
  const items=approved[id];
  if(items.at(-1)?.text===text)return;
  items.push({text,turn:items.length?items.at(-1).turn+1:1});
  if(items.length>36)items.splice(0,items.length-36);
 }
 const certainty=text=>/\b(?:nie wiem|nie jestem pew|nie pamiętam|nie potrafię|nie mogę potwierdzić|chyba|wydaje mi się|być może|możliwe|prawdopodobnie|nie widziałem|nie widziałam)\b/i.test(text)?'qualified':'statement';
 function clauses(text){
  // Segmentuj tylko na granicach zdań, nie rozcinaj wypowiedzi w środku zależności.
  const chunks=trim(text,1500).split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/u).map(x=>trim(x,380)).filter(x=>x.length>=12);
  return chunks.length?chunks.slice(0,5):[trim(text,380)].filter(x=>x.length>=12);
 }
 function facts(canonical,voice,id,question){
  const bank=[],seen=new Set();let bytes=0;
  function add(text,origin,source){
   for(const clause of clauses(text)){
    const key=clause.toLocaleLowerCase('pl').replace(/\s+/g,' ');
    const size=new TextEncoder().encode(clause).length;
    if(seen.has(key)||bank.length>=36||bytes+size>8300)continue;
    seen.add(key);bytes+=size;
    bank.push({id:'f'+bank.length,text:clause,origin,source,certainty:certainty(clause)});
   }
  }
  add(canonical,'current','turn');
  for(const key of ['opening','alibi','what_happened','last_seen','witness'])add(voice[key]||'','public','public-'+key);
  // Pakiet 6.8: wcześniejsze, zatwierdzone lokalnie zeznania na temat pytania.
  // Są to cytowane słowa świadka, nie dowody ani nowe fakty przyznane przez AI.
  for(const x of window.PS68_MEMORY?.approvedAnchors(id,question,7)||[])add(x.a,'prior-local','journal-'+x.turn);
  for(const x of approved[id].slice(-26).reverse())add(x.text,'prior-local','journal-'+x.turn);
  return window.PS611_NLU?.rankFacts(bank,question)||bank;
 }
 // Rozszerzenie formatu zapisów bez zmiany v2 SaveManager ani starej struktury.
 registerSaveHook({name:'stage67-approved-testimony',
  build(data){data.ps67={version:1,approved:Object.fromEntries(Object.entries(approved).map(([id,rows])=>[id,rows.slice(-36)]))};},
  apply(data){
   const entries=data?.ps67?.version===1?data.ps67.approved:null;
   for(const id of Object.keys(approved)){
    approved[id]=Array.isArray(entries?.[id])?entries[id].slice(-36).filter(x=>x&&typeof x.text==='string'&&Number.isSafeInteger(x.turn)&&x.turn>0)
       .map(x=>({text:trim(x.text,1400),turn:x.turn})):[];
    logRefs[id]=STATE.dialogues[id];
   }
  }
 });

 function read(id, canonical, question, previousTurns){
  const c=people[id], p=NPC9_PROFILES[id], s=NPC4_STATE[id], m=NPC9_MEMORY[id];
  if(!c||!p||!s||!m||typeof canonical!=='string')return null;
  const dialogue=(STATE.dialogues[id]||[]);
  remember(id,canonical,dialogue);
  const publicLines=dialogue.filter(x=>x.role==='npc' && typeof x.text==='string').slice(-7)
     .map(x=>clean(x.text,550));
  const heard=dialogue.filter(x=>x.role==='player'||x.role==='npc').slice(-12)
     .map(x=>({role:x.role==='npc'?'witness':'investigator',text:clean(x.text,420)}));
  const otherNames=CONTENT.characters.filter(x=>x.id!==id);
  const corpus=(heard.map(x=>x.text).join(' ')).toLocaleLowerCase('pl');
  // Nie przesyłaj nieujawnionych opisów relacji z profilu (mogą zawierać fabularne sekrety).
  // W modelu pojawiają się tylko osoby rzeczywiście przywołane w dialogu, bez ukrytej motywacji.
  const relations=otherNames.filter(x=>corpus.includes(x.name.toLocaleLowerCase('pl')))
    .slice(0,4).map(x=>({person:x.name,role:clean(x.role,80),context:'Osoba wspomniana w dotychczasowej rozmowie; charakter relacji wymaga potwierdzenia wypowiedzią świadka.'}));
  const psych=typeof ps52Witness==='function'?ps52Witness(c):null;
  const issueRecords=psych?.issues||{};
  const contradictions=(p.confrontations||[]).filter(x=>issueRecords[x.id]?.resolved)
    .map(x=>({topic:clean(PS52_THREADS?.[x.id]?.title||x.id,100),status:'sprostowanie już dokonane'})).slice(0,8);
  const br=window.PS_BREAKTHROUGH?.state(id);
  const phase=['neutral','fractured','reconsidering','guarded','closed'].includes(br?.phase)?br.phase:'neutral';
  const explicitEvidence=(Array.isArray(m.shown)?m.shown:[]).filter(x=>{
    const identifier=typeof x==='string'?x:x?.id;
    return typeof identifier==='string'&&STATE.found.has(identifier);
  }).slice(-8).map(x=>clean(typeof x==='string'?x:x.id,100));
  // Wybór odpowiedzi poprzedza formułowanie języka przez AI.
  // Bank zawiera WYŁĄCZNIE bezpieczne wypowiedzi otwarcia/alibi/obserwacji,
  // kanoniczną odpowiedź z bieżącej tury i fakty JUŻ wypowiedziane.
  // Nigdy nie przesyłamy surowego NPC9.knowledge, sekretów relacji ani przełomów.
  const options=[{id:'turn',text:clean(canonical,1900),kind:'current'}];
  const seen=new Set([clean(canonical,1900)]);
  const voice=p.voice_examples||{};
  for(const key of ['opening','alibi','what_happened','last_seen','witness']){
   const line=clean(voice[key],750);
   if(line&& !seen.has(line)) {options.push({id:'public-'+key,text:line,kind:'public'});seen.add(line);}
  }
  // Earlier testimony is usable only because the witness has ALREADY said it.
  // The local engine continues to own all unlocks and evidence gates.
  for(const [i,line] of publicLines.entries()){
   if(line&&!seen.has(line)){options.push({id:'said-'+i,text:line,kind:'said'});seen.add(line);}
  }
  // Hidden NPC9.knowledge entries, future facts, unrevealed contradictions and notes never leave the browser.
  return {
   schema:'ps-witness-context/1',
   identity:{id:c.id,name:clean(c.name,80),role:clean(c.role,100)},
   personality:{temperament:clean(p.temperament,320),diction:(p.diction||[]).slice(0,3).map(x=>clean(x,220)),
    speakingStyle:(NPC4_TRAITS[id]?.voice||[]).slice(0,3).map(x=>clean(x,130))},
   knowledge:{currentGroundedAnswer:clean(canonical,1900),alreadySaid:publicLines,
    groundedOptions:options,
    factBank:facts(canonical,voice,id,question),
    documentsShown:explicitEvidence,limits:[
     'Nie zgaduj, kto popełnił przestępstwo, i nie opisuj scen, których świadek nie obserwował.',
     'Jeśli wiedza pochodzi z dokumentu albo relacji, oddziel ją od własnej obserwacji.',
     'Nie ujawniaj przyszłych dowodów, nieukończonych konfrontacji ani cudzych zeznań.'
    ]},
   relations,
   emotions:{stress:bounded(s.tension),trust:bounded(s.rapport),fatigue:bounded(s.fatigue),mood:clean(s.mood,70),
    stance:clean(s.stance,30),tone:clean(s.lastTone,40)},
   psychology:{blocked:!!simWitness(c).blocked,phase,
    tactic:clean(psych?.tactic||'free',30),contradictions,pressureCount:Math.max(0,Math.min(100,s.pressures||0))},
   memory:{turn:Math.max(0,Math.min(100000,m.turn||0)),focus:clean(m.lastFocus?.topic||s.lastTopic||'',65),
    conversation:heard,longTerm:(window.PS68_MEMORY?.context(id,question)||[]).slice(0,6),previousTurns:Math.max(0,Math.min(100000,previousTurns||0))},
   request:{question:clean(question,1600),semanticPlan:window.PS611_NLU?.analyze(question)||null}
  };
 }
 return Object.freeze({read,inspect:()=>Object.fromEntries(Object.entries(approved).map(([id,rows])=>[id,rows.length]))});
})();
window.PS65_CONTEXT=PS65_CONTEXT;
