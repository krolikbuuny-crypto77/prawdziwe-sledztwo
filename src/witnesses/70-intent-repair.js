/* Pakiet 6.10 — pierwszeństwo znaczenia pytania przed historycznymi heurystykami.
 * Nie zmienia dowodów, przełomów, warunków procesowych ani faktów. Zawsze wykonuje
 * wcześniejszy silnik; poprawia jedynie bezpieczne, nieformalne wypowiedzi.
 */
(function(){
 'use strict';
 const previous = WitnessEngine.snapshotAnswer();
 const normalize = x => norm(String(x||''));
 const take = (x,max=1300) => String(x||'').trim().slice(0,max);
 const safeKinds = Object.freeze(['personalObservation','epistemicChallenge','directAccusation']);
 const denial = /\b(?:nie pytam o|nie chodzi mi o|zamiast|tylko o to co|sam\w* widzia|sama widzia)\b/;
 const saw = /\b(?:sam\w* widzial\w*|sam\w* widzi\w*|osobiscie widzial\w*|osobista obserwacj\w*|wlasna obserwacj\w*|na wlasne oczy|co (?:ty |pan |pani )?(?:sam\w* )?(?:widziales|widzialas|widzial|widziala)|czy (?:ty |pan |pani )?(?:sam\w* )?(?:widziales|widzialas|widzial|widziala))\b/;
 const directCrime = /\b(?:zabiles|zabilas|zamordowales|zamordowalas)\b.{0,48}\b(?:len\w*|rudnick\w*)\b|\b(?:ty|pan|pani)\b.{0,30}\b(?:zabil|zabila|zamordowal|zamordowala)\b.{0,48}\b(?:len\w*|rudnick\w*)\b|\b(?:przyznajesz sie|przyznaje sie|przyznal\w* sie|przyznac sie)\b.{0,55}\b(?:zabojst\w*|morderst\w*|zamordowan\w*|zabici\w*)\b|\b(?:jestes|jest pan|jest pani)\b.{0,30}\b(?:zabojca|morderca)\b/;
 const knowledgeChallenge = /\b(?:jak|skad|dlaczego|czemu)\b.{0,75}\b(?:mozesz|moze|masz|miec|byc|wiesz|twierdz\w*)\b.{0,90}\b(?:pewnos\w*|pewny|pewna|wiedziec|wiesz|twierdz\w*)\b/;
 const noObservation = /\b(?:skoro|chociaz|jezeli|jesli|przeciez|ale)\b.{0,110}\b(?:nie obserwowal\w*|nie widzial\w*|nie byles|nie bylas|nie bylo cie|nie stal\w*|nie sledzil\w*|nie patrzyl\w*)\b/;
 const noWitnessing = /\b(?:nie obserwowal\w*|nie widzial\w*)\b.{0,80}\b(?:nikt|nikogo|wszedl|wchodzil|tam)\b/;
 const certainEntry = /\b(?:nikt|nikogo|nikt tam|nikt nie|nikt sie)\b.{0,35}\b(?:wszedl|wchodzil|wchodzil|byl|pojawil|widzial)\b/;
 function classify(question){
  const q=normalize(question); if(!q||q.length>1100)return null;
  const k=window.PS633_INTENT?.analyzeQuestion(question);
  if(k){return {direct_accusation:'directAccusation',direct_observation:'personalObservation',knowledge_source:'epistemicChallenge'}[k.primary]||null;}
  if(directCrime.test(q)&&!/^\s*(?:kto|co|dlaczego|skad)\b/.test(q))return 'directAccusation';
  if((noObservation.test(q)||noWitnessing.test(q))&&
     (knowledgeChallenge.test(q)||certainEntry.test(q)||/\b(?:skoro|sprzecznosc)\b/.test(q)))return 'epistemicChallenge';
  if((saw.test(q)||denial.test(q)&&/\b(?:widz\w*|obserwacj\w*)\b/.test(q))&&
     !/\b(?:kto zabil|zabojc\w*|sprawc\w*)\b/.test(q))return 'personalObservation';
  return null;
 }
 function protectedAnswer(c,attached,beforeConfronted,base){
  if(attached||!c||!NPC4_STATE?.[c.id]||!NPC9_MEMORY?.[c.id]||simWitness(c).blocked)return true;
  const m=NPC9_MEMORY[c.id],last=(m.semantic||[]).at(-1);
  if((m.confronted?.length||0)>beforeConfronted)return true;
  if(last&&['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(last.status))return true;
  if(last?.source_ids?.length)return true;
  const s=normalize(base);
  if(/\b(?:odmawiam|pelnomocnik|przerwa proceduralna|podtrzymuje odmowe|nie bede dalej odpowiadac|konfrontacj\w* z dowod\w*|przyznaje sie)\b/.test(s))return true;
  return false;
 }
 const starts={MAREK:'Proszę rozróżnić dwie rzeczy. ',TOMASZ:'To trzeba rozdzielić. ',JANUSZ:'Powiem wprost. ',ELZBIETA:'To istotne rozróżnienie. ',KAMIL:'Technicznie rzecz biorąc, ',MAGDALENA:'Precyzyjnie rzecz ujmując, '};
 function reply(c,kind,question){
  const data=NPC9_CUSTOM[c.id]||{},isFemale=['ELZBIETA','MAGDALENA'].includes(c.id);
  if(kind==='personalObservation'){
   const q=normalize(question),aboutLena=/\b(?:len\w*|rudnick\w*|ja wtedy|jej wtedy)\b/.test(q);
   const fact=aboutLena?(data.victim_last||data.observations):(data.observations||data.source);
   if(!fact)return '';
   const lead= isFemale?'Odpowiem o tym, co sama widziałam, a nie o tym, co zapisano w aktach. ':'Odpowiem o tym, co sam widziałem, a nie o tym, co zapisano w aktach. ';
   return take(lead+fact,1500);
  }
  if(kind==='epistemicChallenge'){
   const fact=take(data.observations||data.source,600);
   const correction=isFemale?'Nie mogę twierdzić z całą pewnością, że nikt tam nie wszedł, jeśli nie obserwowałam tego miejsca przez cały czas. ':'Nie mogę twierdzić z całą pewnością, że nikt tam nie wszedł, jeśli nie obserwowałem tego miejsca przez cały czas. ';
   return take((starts[c.id]||'')+correction+(fact?'To, co mogę powiedzieć o własnej obserwacji: '+fact:''),1500);
  }
  if(kind==='directAccusation'){
   // Odpowiedź wyraża obecne stanowisko, nie obiektywną niewinność; nie zastępuje
   // formalnego przyznania ani konfrontacji wymagającej dowodów.
   const stand={MAREK:'Nie przyznaję się do zabójstwa Leny. Proszę oddzielić moje decyzje służbowe od takiego zarzutu.',
    TOMASZ:'Nie przyznaję się do zabójstwa Leny. Jeśli mnie o to oskarżasz, pytaj wprost i przedstaw podstawy.',
    JANUSZ:'Nie przyznaję się. Kłótnia z Leną to nie jest przyznanie się do jej zabójstwa.',
    ELZBIETA:'Nie przyznaję się do zabójstwa Leny. To poważny zarzut i chcę wiedzieć, na czym go opierasz.',
    KAMIL:'Nie przyznaję się do zabójstwa Leny. Moja praca przy wagonie nie jest odpowiedzią na taki zarzut.',
    MAGDALENA:'Nie przyznaję się do zabójstwa Leny. Proszę wskazać, jakie fakty mają uzasadniać to oskarżenie.'};
   return stand[c.id]||'';
  }
  return '';
 }
 function reconcile(c,before,after,kind){
  if(before===after)return true;
  const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],turn=m?.turn;
  if(!m||!s)return false;
  const sem=[...(m.semantic||[])].reverse().find(x=>x.turn===turn&&x.answer===before);
  const stmt=[...(m.statements||[])].reverse().find(x=>x.turn===turn&&x.text===before);
  if(!sem&&!stmt)return false;
  const locked=x=>x&&(x.source_ids?.length||['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(x.status));
  if(locked(sem)||locked(stmt))return false;
  const topic={personalObservation:'observation',epistemicChallenge:'knowledge-limit',directAccusation:'accusation'}[kind];
  if(sem){sem.answer=after;sem.topic=topic;sem.focus='intent-6.10';}
  if(stmt){stmt.text=after;stmt.topic=topic;}
  if(Array.isArray(m.topics)&&m.topics.length)m.topics[m.topics.length-1]=topic;
  if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus:'intent-6.10'};
  const recent=s.recent?.at(-1);
  if(recent&&recent.answer===normalize(before).slice(0,1550)){recent.answer=normalize(after).slice(0,1550);recent.topic=topic;recent.focus='intent-6.10';}
  const npc5=s.npc5?.recent?.at(-1);if(npc5&&npc5.answer===before.slice(0,1400)){npc5.answer=after.slice(0,1400);npc5.topic=topic;}
  if(s.npc5?.anchor?.answer===before.slice(0,1400))s.npc5.anchor={...s.npc5.anchor,answer:after.slice(0,1400),topic};
  const ep=s.npc57?.episodes?.at(-1);if(ep&&ep.answer===before.slice(0,1600)&&!ep.protected){ep.answer=after.slice(0,1600);ep.topic=topic;}
  if(s.npc65?.lastAnswer===before.slice(0,1300))s.npc65.lastAnswer=after.slice(0,1300);
  const rs=s.npc65?.recent?.at(-1);if(rs&&rs.answer===before.slice(0,1300)){rs.answer=after.slice(0,1300);rs.topic=topic;}
  const r62=s.npc62;if(r62?.a===before)r62.a=after;
  const r68=s.npc68?.threads?.at(-1);if(r68?.a===before.slice(0,850))r68.a=after.slice(0,850);
  const r89=s.npc89?.recent?.at(-1);if(r89?.a===before.slice(0,1200))r89.a=after.slice(0,1200);
  if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic,focus:'intent-6.10'};
  return true;
 }
 function answer(c,question,attached){
  const kind=classify(question);
  const before=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const base=previous(c,question,attached);
  if(!kind||protectedAnswer(c,attached,before,base))return base;
  const replacement=reply(c,kind,question);
  if(!replacement||replacement===base||!reconcile(c,base,replacement,kind))return base;
  window.PS610_LAST={witness:c.id,kind,changed:true};
  return replacement;
 }
 registerWitnessAnswerLayer('70-meaning-first-intent',answer);
 window.PS610_INTENT=Object.freeze({classify,kinds:safeKinds,last:()=>window.PS610_LAST||null});
})();
