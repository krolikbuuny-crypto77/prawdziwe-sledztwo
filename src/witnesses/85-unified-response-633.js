/* 6.33 — one deterministic local scope, shared with Vercel.
 * Uses the single shared intent plan for conservative, source-grounded OFFLINE corrections.
 * It uses previously public witness facts. Confrontations, attached exhibits,
 * procedural refusals and server AI responses remain untouched.
 */
(function(){
 'use strict';
 if(typeof WitnessEngine==='undefined'||typeof NPC94_FACTS==='undefined'||typeof NPC9_MEMORY==='undefined')return;
 const previous=WitnessEngine.snapshotAnswer();
 const fold=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9: -]+/g,' ').replace(/\s+/g,' ').trim();
 const PROTECTED=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL']);
 // Only one parser decides the active intention. No parallel scope regexes.
 function classify(id,raw){
  const p=window.PS633_INTENT.analyzeQuestion(raw);
  if(!p.positiveQuestion||p.sensitive||p.inputLooksLikeInstruction||p.slots.compound)return null;
  if(!NPC94_FACTS[id])return null;
  const allowed={JANUSZ:['workshop_missing_entry','self_alibi'],ELZBIETA:['bhp_sent','self_alibi'],
   KAMIL:['test_authorization','self_alibi'],TOMASZ:['self_alibi','alarm_report'],
   MAREK:['self_alibi'],MAGDALENA:['self_alibi']};
  return (Array.isArray(allowed[id])?allowed[id].includes(p.primary):allowed[id]===p.primary)?p.primary:null;
 }
 const activeQuestion=input=>window.PS633_INTENT.analyzeQuestion(input).positiveQuestion;
 function reply(c,kind){
  const f=NPC94_FACTS[c.id];
  if(kind==='workshop_missing_entry')return 'Nie wiem, dlaczego tego wpisu brakuje. '+f.verify+' '+f.responsibility;
  if(kind==='bhp_sent')return 'Nie mogę potwierdzić, że zgłoszenie BHP zostało wysłane. '+f.verify;
  if(kind==='test_authorization')return 'Autoryzację testu trzeba sprawdzić w dokumentacji zgody na test, zestawiając numer sesji z surowymi logami. Sam wpis techniczny nie potwierdza, kto fizycznie był przy urządzeniu.';
  if(kind==='self_alibi')return c.id==='TOMASZ'?'Pracowałem w dyspozytorni. '+f.alibi:f.location+' '+f.alibi;
  if(kind==='alarm_report')return f.victim+' '+f.time;
  return '';
 }
 function rewrite(c,old,next,kind){
  const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],sem=m?.semantic?.at(-1),st=m?.statements?.at(-1);
  if(!sem||!st||sem.turn!==m.turn||st.turn!==m.turn||sem.answer!==old||st.text!==old||
     sem.source_ids?.length||st.source_ids?.length||PROTECTED.has(sem.status)||PROTECTED.has(st.status))return false;
  sem.answer=next;sem.topic=kind;sem.focus='unified-intent-6.33';st.text=next;st.topic=kind;
  if(m.topics?.length)m.topics[m.topics.length-1]=kind;
  if(m.lastFocus)m.lastFocus={...m.lastFocus,topic:kind,focus:'unified-intent-6.33'};
  const replace=(obj,key,len)=>{if(obj?.[key]===old.slice(0,len))obj[key]=next.slice(0,len);};
  const replaceNorm=(obj,key,len)=>{if(obj?.[key]===fold(old).slice(0,len))obj[key]=fold(next).slice(0,len);};
  replaceNorm(s.recent?.at(-1),'answer',1550);replace(s.npc5?.recent?.at(-1),'answer',1400);
  replace(s.npc5?.anchor,'answer',1400);replace(s.npc57?.episodes?.at(-1),'answer',1600);
  replace(s.npc65?.recent?.at(-1),'answer',1300);replace(s.npc65,'lastAnswer',1300);
  replace(s.npc68?.threads?.at(-1),'a',850);replace(s.npc89?.recent?.at(-1),'a',1200);replace(s.npc62,'a',1600);
  return true;
 }
 registerWitnessAnswerLayer('85-unified-question-routing-633',function(c,question,attached){
  const kind=c?classify(c.id,question):null;
  const confronted=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
  const old=previous(c,question,attached);
  if(!kind||!c||attached||simWitness(c).blocked||
      (NPC9_MEMORY[c.id]?.confronted?.length||0)!==confronted)return old;
  const next=reply(c,kind);
  if(!next||next===old||!rewrite(c,old,next,kind))return old;
  window.PS633_LAST={id:c.id,kind,changed:true};
  return next;
 });
 window.PS633_SCOPE=Object.freeze({classify,activeQuestion,version:'6.33'});
 window.PS632_SCOPE=window.PS633_SCOPE; // read-only compatibility facade for old QA tools
 window.PS626_INTENT=Object.freeze({focus:q=>{const k=window.PS633_INTENT.analyzeQuestion(q).primary;
  return ['self_alibi','alarm_report'].includes(k)?k:null;},
  relevant:(kind,text)=>kind==='self_alibi'?/(?:alibi|dyzur|biur|prac|obecnos|przebyw|miejsce|dyspozytor)/.test(fold(text)):
   kind==='alarm_report'?/(?:alarm|zglosz|02:02|znalaz|znalezien)/.test(fold(text)):true,version:'6.33'});
})();
