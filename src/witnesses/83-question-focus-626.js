/* 6.26: separate a witness's own whereabouts from Lena's last sighting;
 * separate emergency reporting from last contact with a living victim.
 * Local answers use ONLY existing, authored and previously admissible facts.
 */
(function(){
 'use strict';
 if(typeof WitnessEngine==='undefined'||typeof NPC94_FACTS==='undefined')return;
 const previous=WitnessEngine.snapshotAnswer();
 const plain=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9: -]+/g,' ').replace(/\s+/g,' ').trim();
 const PROTECTED=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL']);
 function focus(raw){
  const q=plain(raw),emergency=/(?:zglosz|zawiadom|powiadom|wezw|alarm|znalezien|znalaz|odkryc|odnalaz)/.test(q);
  const event=/(?:len[ayie]|rudnick|ofiar|cial|pomoc|alarm|znalezien|znalaz|smierc)/.test(q);
  const query=/(?:\bkto\b|ktorej|godzin|kiedy|komu|czy|o jakiej)/.test(q);
  const someoneElse=/(?:gdzie\s+(?:byla|przebywala)\s+(?:lena|ona)|gdzie\s+(?:byla|przebywala)\s+ofiara)/.test(q);
  const self=/(?:\balibi\b|twoj\w*\s+(?:pobyt|obecnosc|alibi)|swoj\w*\s+(?:pobyt|obecnosc)|\b(?:ty|pan|pani)\s+(?:byl|byla|przebywal)|\b(?:byles|bylas|przebywales|przebywalas)\b|gdzie\s+(?:byles|bylas|przebywales|przebywalas|pan|pani)|\b(?:twoje|pana|pani)\s+(?:miejsce|obecnosc)|co\s+(?:robiles|robilas)\s+(?:miedzy|od|o))/.test(q);
  if(emergency&&event&&query)return 'alarm_report';
  if(self&&!someoneElse)return 'self_alibi';
  return null;
 }
 function relevant(kind,text){
  const a=plain(text);
  if(kind==='alarm_report')return /(?:alarm|zglosz|zawiadom|wezw|znalaz|znalezion|odnalaz|powiadom|02:02)/.test(a)&&
   !(/(?:ostatni\w*\s+(?:raz|razem)|ostatni\w*\s+(?:widzial|spotkal))/.test(a)&&!/alarm|zglosz|02:02/.test(a));
  if(kind==='self_alibi')return /(?:\balibi\b|dyzur|zmian|biur|obecnos|przebyw|miejsce|stanowisk|warsztat|zajezd|prac|dyspozytor|sluzb|sesj|nie\s+(?:wiem|pamietam|potrafie|moge)|nie\s+potwierdz|polozen)/.test(a)&&
   !(/(?:len[ayie]|rudnick)/.test(a)&&!/(?:\bja\b|biur|zmian|dyzur|alibi|obecnosc|przebyw|miejsce|prac|polozen)/.test(a));
  return true;
 }
 function pick(c,kind,m){
  const f=NPC94_FACTS[c.id],history=(m.semantic||[]).slice(0,-1).slice(-4);
  const previousAnswers=history.map(x=>plain(x.answer));
  if(kind==='alarm_report'){
   const known=c.id==='TOMASZ'?f.victim+' '+f.time:f.victim+' '+f.source;
   if(previousAnswers.includes(plain(known)))return c.id==='TOMASZ'?f.time+' '+f.verify:f.source+' '+f.time;
   return known;
  }
  const present=f.location+' '+f.alibi;
  if(previousAnswers.includes(plain(present)))return f.alibi+' '+f.verify;
  return present;
 }
 function rewrite(c,old,next,kind){
  const mem=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],sem=mem.semantic.at(-1),st=mem.statements.at(-1);
  if(sem.answer!==old||st.text!==old)return false;
  sem.answer=next;st.text=next;sem.topic=kind;st.topic=kind;
  const replace=(o,k,n)=>{if(o?.[k]===old.slice(0,n))o[k]=next.slice(0,n)};
  const replaceNorm=(o,k,n)=>{if(o?.[k]===plain(old).slice(0,n))o[k]=plain(next).slice(0,n)};
  replaceNorm(s.recent?.at(-1),'answer',1550);
  replace(s.npc5?.recent?.at(-1),'answer',1400);replace(s.npc5?.anchor,'answer',1400);
  replace(s.npc57?.episodes?.at(-1),'answer',1600);
  replace(s.npc65?.recent?.at(-1),'answer',1300);replace(s.npc65,'lastAnswer',1300);
  replace(s.npc68?.threads?.at(-1),'a',850);replace(s.npc89?.recent?.at(-1),'a',1200);replace(s.npc62,'a',1600);
  return true;
 }
 registerWitnessAnswerLayer('83-question-focus-626',function(c,q,attached){
  const oldConfronted=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const kind=focus(q),out=previous(c,q,attached);
  if(!kind||!c||attached||simWitness(c).blocked||!NPC94_FACTS[c.id]||relevant(kind,out))return out;
  const mem=NPC9_MEMORY[c.id],sem=mem?.semantic?.at(-1),st=mem?.statements?.at(-1);
  if(!sem||!st||sem.turn!==mem.turn||st.turn!==mem.turn||
   oldConfronted!==(mem.confronted?.length||0)||PROTECTED.has(sem.status)||PROTECTED.has(st.status)||
   sem.source_ids?.length||st.source_ids?.length||sem.answer!==out||st.text!==out)return out;
  const next=pick(c,kind,mem);
  return rewrite(c,out,next,kind)?next:out;
 });
 window.PS626_INTENT=Object.freeze({focus,relevant,version:'6.26'});
})();
