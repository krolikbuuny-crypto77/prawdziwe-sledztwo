
/* Etap 6.1 — rozumienie zarzutu proceduralnego, założeń i ciągłości tematu.
 * Odpowiedzi pochodzą z istniejących kart wiedzy postaci. Nie dodaje faktów,
 * źródeł, przyznań, korekt dowodowych ani punktów procesu.
 */
(function(){
'use strict';
const prevAnswer=WitnessEngine.snapshotAnswer(),prevExport=WitnessEngine.snapshotExport(),prevRestore=WitnessEngine.snapshotRestore();
const normQ=t=>norm(String(t||'')).replace(/\s+/g,' ').trim().replace(/\btragiedia\b|\btragednia\b/g,'tragedia');
const chars=new Map(CONTENT.characters.map(c=>[c.id,c]));
const HARD=/\b(?:zabil\w*|zabojstw\w*|zamordow\w*|morderstw\w*|winna\w*\s+smierci|winny\w*\s+smierci|sprawc\w*\s+smierci|areszt\w*|przyznaj\w*\s+sie|sfalszow\w*|falszow\w*|szantaz\w*|groz\w*|wymusz\w*|mordow\w*|cctv|tcms|t\s*17|dowod\w*|konfront\w*|oskarz\w*|pokaz\w*\s+(?:raport|dokument|protokol)|zatail\w*|zataj\w*)\b/;
const OTHER=/\b(?:marek|nowicki|tomasz|krawczyk|janusz|wojcik|kamil|brzozowski|elzbieta|zieba|magdalena|kaczmarek)\b/;
const KNOW=/\b(?:wiedz\w*|wiedziales|wiedzialas|wiedzial\w*|slyszal\w*|orientowal\w*|zdawal\w*\s+sobie\s+sprawe|byl\w*\s+swiadom\w*|wiedza|informowan\w*|ostrzeg\w*|mowil\w*\s+ci|mowil\w*\s+panu|zglosil\w*\s+ci|wiedz\w*\s+o)\b/;
const INACTION=/\b(?:nic\s+(?:nie\s+)?zrobil\w*|nic\s+z\s+tym\s+nie\s+zrobil\w*|bezczyn\w*|nie\s+zareagowal\w*|zignorowal\w*|olal\w*|zlekcewazyl\w*|nie\s+pomogl\w*|nie\s+podjal\w*|nie\s+interweniowal\w*|nie\s+przekazal\w*|nie\s+zglosil\w*|odpuscil\w*|przemilczal\w*|czemu\s+(?:nie|nic)|dlaczego\s+(?:nie|nic)|po\s+co\s+milczal\w*|pozwolil\w*\s+na\s+to)\b/;
const RISK=/\b(?:uster\w*|bezpiecz\w*|zglosz\w*|zagroz\w*|problem\w*|niezgodn\w*|wagon\w*|tw\s*217|len\w*|bhp|przeglad\w*|podzesp\w*|nieprawidlow\w*)\b/;
const PRESUP=/\b(?:skoro|czyli|wiec|przeciez|a\s+wiec|wychodzi\s+na\s+to|rozumiem\s+ze|twierdz\w*|mowil\w*|powiedzial\w*|tak\s+czy\s+nie|w takim razie|to\s+znaczy\s+ze)\b/;
const NO_ACTION=/\b(?:nic\s+nie\s+zrobil\w*|nie\s+zrobil\w*\s+nic|nic\s+z\s+tym|nie\s+zareagowal\w*|nie\s+pomogl\w*|nie\s+zglosil\w*|nie\s+interweniowal\w*)\b/;
const FOCUSED=/\b(?:co\s+(?:z\s+tym\s+)?(?:zrobil\w*|podjal\w*|przekazal\w*)|jak\s+zareagowal\w*|co\s+dalej\s+z\s+tym|jak\s+(?:wygladal\w*|sprawdzil\w*)\s+to)\b/;
const CORRECTION=/\b(?:przyznal\w*|skorygowal\w*|zmienil\w*\s+zeznan\w*|sprostowal\w*)\b/;
const refsOther=q=>OTHER.test(q) && !/\b(?:o\s+(?:marku|tomaszu|januszu|kamilu|elzbiecie|magdalenie))\b/.test(q);
const words=(t)=>t.trim().split(/\s+/).filter(Boolean).length;
function memory(c){const st=NPC4_STATE[c.id];if(!st.npc61||typeof st.npc61!=='object')st.npc61={focus:'',lastQuestion:'',turn:0};return st.npc61;}
function findIntent(c,raw,attached){
 if(attached)return null;
 const q=normQ(raw);if(!q||q.length>500||HARD.test(q)||CORRECTION.test(q))return null;
 // Don't claim firsthand knowledge of another employee from the speaker's role profile.
 if(refsOther(q)&&!new RegExp('\\b'+normQ(c.name.split(' ')[0])+'\\b').test(q))return null;
 const own=/\b(?:ty|ci|cie|ciebie|twoj\w*|pan|pani|panu|pania|byles|bylas|wiedziales|wiedzialas|wiedzial\w*|zrobiles|zrobilas|zareagowales|zareagowalas|miales|mialas)\b/.test(q);
 const st=memory(c),returning=/\b(?:wrocmy|wracajac|przypomnij|jeszcze\s+raz|a\s+co\s+z|to\s+dlaczego|a\s+czemu)\b/.test(q);
 // First priority: leading facts and an attributed omission, not an admission of guilt.
 if(KNOW.test(q) && (INACTION.test(q)||/\b(?:o\s+wszystkim|wszystko|caly\s+czas)\b/.test(q)) && (own||PRESUP.test(q)))return {type:'knowledge_omission',topic:'risk',focus:'knowledge_limits'};
 if(PRESUP.test(q)&&RISK.test(q)&&/\b(?:wszystko\s+(?:bylo|jest)\s+(?:w\s+porzadku|dobrze)|zadnego\s+problemu|lena\s+przesadzala|nic\s+sie\s+nie\s+dzialo)\b/.test(q))return {type:'false_calm',topic:'risk',focus:'unverified_claim'};
 if((own||st.focus==='risk')&&INACTION.test(q)&&(RISK.test(q)||st.focus==='risk'||PRESUP.test(q)))return {type:'inaction_assumption',topic:'risk',focus:'unverified_inactivity'};
 if((own||st.focus==='risk')&&KNOW.test(q)&&RISK.test(q)&&!NO_ACTION.test(q))return {type:'knowledge_scope',topic:'risk',focus:'knowledge_limits'};
 if((own||st.focus==='risk')&&FOCUSED.test(q)&&(RISK.test(q)||st.focus==='risk')&& !/\b(?:po\s+alarmie|po\s+odnalezieniu|po\s+znalezieniu)\b/.test(q))return {type:'action_followup',topic:'risk',focus:'procedural_actions'};
 if((own||st.focus==='risk')&&/\b(?:odpowiada\w*|odpowiedzialn\w*|wina|zaniedban\w*)\b/.test(q)&&RISK.test(q)&&!/\b(?:smierc\w*|zabojstw\w*|morderstw\w*)\b/.test(q))return {type:'accountability',topic:'risk',focus:'responsibility'};
 if(/\b(?:wymiguj\w*|unikasz\s+odpowiedzi|nie\s+odpowiada\w*|znowu\s+o\s+dokumentach|przestan\s+zmieniac\s+temat|nie\s+o\s+to\s+pytalem)\b/.test(q)&&st.focus==='risk')return {type:'challenge',topic:'risk',focus:'question_clarification'};
 if(returning&&RISK.test(q)&&!/\b(?:rapport|dokument|protokol|nagranie|konfront)\b/.test(q))return {type:'topic_return',topic:'risk',focus:'topic_return'};
 if(/^(?:i\s+)?(?:co\s+(?:z\s+tym\s+)?zrobiles|co\s+zrobilas|i\s+co\s+z\s+tym|co\s+potem\s+z\s+tym|ale\s+dlaczego|a\s+dlaczego|to\s+czemu|i\s+co\s+dalej)\??$/.test(q)&&st.focus==='risk')return {type:'action_followup',topic:'risk',focus:'procedural_actions'};
 return null;
}
function createAnswer(c,intent){
 const data=NPC9_CUSTOM[c.id]||{},p=intent.type;
 const intros={
 MAREK:'Nie powiedziałem, że wiedziałem o wszystkim, co działo się podczas zmiany.',
 TOMASZ:'Nie miałem pełnego obrazu tego, co działo się poza dyspozytornią.',
 JANUSZ:'Znałem część problemów z TW-217, nie każdą późniejszą okoliczność.',
 ELZBIETA:'Wiedziałam o zgłaszanym ryzyku, ale nie o każdym późniejszym zdarzeniu.',
 KAMIL:'Znałem sygnały z diagnostyki, nie cały przebieg nocy.',
 MAGDALENA:'Znałam zastrzeżenia dotyczące dokumentacji, nie każdy ruch pracowników.'
 };
 const reduce=t=>String(t||'').trim().slice(0,410);
 if(p==='knowledge_omission'||p==='inaction_assumption')return (
   intros[c.id]+' '+(p==='knowledge_omission'||p==='inaction_assumption'?'Nie można też zakładać, że nie podjęto żadnego działania, zanim sprawdzi się jego dokumentację. ':'')+
   reduce(data.risk)+' '+reduce(data.accountability)
 ).trim().slice(0,1250);
 if(p==='knowledge_scope')return (intros[c.id]+' '+reduce(data.risk)).trim();
 if(p==='false_calm')return ('Nie twierdzę, że wszystko było w porządku. '+reduce(data.risk)+' '+reduce(data.verification)).slice(0,1100);
 if(p==='action_followup'){
  const actions={
   MAREK:'Organizowałem zmianę i odpowiadałem za jej rozliczenie. Czy zastrzeżenia Leny trafiły we właściwym czasie do dokumentacji, trzeba sprawdzić w rejestrach. Nie będę zapewniał, że każdy etap został wykonany prawidłowo.',
   TOMASZ:'Wydawałem dyspozycje dotyczące ruchu. Moje reakcje można porównać z rejestrem łączności i poleceń. Nie twierdzę, że z pamięci odtworzę każdą decyzję.',
   JANUSZ:'Odpowiadałem za organizację prac warsztatu i karty napraw. To, co rzeczywiście wykonano przy TW-217, trzeba zestawić z surowym zleceniem i autoryzacją testu.',
   ELZBIETA:'Zajmowałam się procedurą BHP. Mogłam lepiej dopilnować drogi zgłoszenia; czy konkretne ostrzeżenie zostało wysłane, wynika ze statusu dokumentu i potwierdzenia odbioru.',
   KAMIL:'Prowadziłem diagnostykę TW-217. Zakres mojego działania wynika z surowych logów sesji i jej autoryzacji. Sam alarm nie mówi, co działo się później z Leną.',
   MAGDALENA:'Odpowiadałam za przegląd dokumentacji audytu. Jeśli chodzi o określoną czynność, trzeba wskazać pozycję protokołu i historię zmian; nie potwierdzę ogólnego zarzutu bezczynności.'
  };return actions[c.id];
 }
 if(p==='accountability')return (reduce(data.accountability)+' '+reduce(data.risk)).trim().slice(0,1100);
 if(p==='challenge')return ('Pytanie jest jasne: czy znałem zagrożenie i co należało do moich obowiązków. '+reduce(data.accountability)+' '+reduce(data.verification)).slice(0,900).replace('czy znałem zagrożenie',c.gender==='f'?'czy znałam zagrożenie':'czy znałem zagrożenie');
 if(p==='topic_return')return (reduce(data.risk)+' '+reduce(data.verification)).trim();
 return '';
}
function safeChange(c,base,answer,intent){
 if(!answer||answer===base)return false;
 const mem=NPC9_MEMORY[c.id],st=NPC4_STATE[c.id];if(!mem)return false;
 const prohibited=new Set(['CORRECTION_WITH_EVIDENCE','CONFESSION']);
 const semantic=Array.isArray(mem.semantic)?mem.semantic:[];
 const rec=[...semantic].reverse().find(x=>x.turn===mem.turn&&x.answer===base&&!prohibited.has(x.status));
 if(rec){rec.answer=answer;rec.topic=intent.topic;rec.focus=intent.focus;rec.source_ids=[];}
 else if(Array.isArray(mem.semantic))mem.semantic.push({turn:mem.turn,topic:intent.topic,focus:intent.focus,person:null,answer,source:'ustne wyjaśnienie świadka',certainty:'zakres wiedzy świadka',status:'LIMITED_KNOWLEDGE',source_ids:[]});
 const statement=[...(mem.statements||[])].reverse().find(x=>x.turn===mem.turn&&x.text===base&&!prohibited.has(x.status));
 if(statement){statement.text=answer;statement.topic=intent.topic;}
 else if(Array.isArray(mem.statements))mem.statements.push({turn:mem.turn,topic:intent.topic,text:answer,status:'LIMITED_KNOWLEDGE',source_ids:[]});
 if(mem.topics?.length)mem.topics[mem.topics.length-1]=intent.topic;
 mem.lastFocus={...(mem.lastFocus||{}),topic:intent.topic,focus:intent.focus};
 if(st.recent?.length){const r=st.recent[st.recent.length-1];r.topic=intent.topic;r.focus=intent.focus;r.answer=normQ(answer).slice(0,1550);r.variant='natural-6.1';}
 if(st.npc5){const last=st.npc5.recent?.at(-1);if(last){last.topic=intent.topic;last.answer=answer.slice(0,1400);last.mode='natural-6.1';}
 st.npc5.anchor={topic:intent.topic,focus:intent.focus,question:String(mem.userClaims?.at(-1)?.text||'').slice(0,180),answer:answer.slice(0,1400)};}
 const old=st.npc57;if(old){old.focus=intent.topic;if(Array.isArray(old.episodes)){old.episodes=old.episodes.filter(e=>!(e.turn===mem.turn&&e.answer===base));old.episodes.push({topic:intent.topic,question:String(mem.userClaims?.at(-1)?.text||'').slice(0,450),answer:answer.slice(0,1600),turn:mem.turn,protected:false,kind:'source-based-6.1'});if(old.episodes.length>80)old.episodes.splice(0,old.episodes.length-80);}}
 if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic:intent.topic,focus:intent.focus,variant:'natural-6.1'};
 return true;
}
function answer(c,raw,attached){
 const intent=findIntent(c,raw,attached);
 const oldConfronted=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const base=prevAnswer(c,raw,attached);
 const m=memory(c);m.turn=Math.min(100000,m.turn+1);
 if(!intent){if(!attached&&/\b(?:alibi|gdzie\s+byles|gdzie\s+bylas|kto\s+znalazl|smierc\w*)\b/.test(normQ(raw)))m.focus='';return base;}
 if(attached||(NPC9_MEMORY[c.id]?.confronted?.length||0)>oldConfronted)return base;
 // Leave any procedural refusal, locked interrogation or direct evidence answer unchanged.
 if(/\b(?:odmow\w*|pelonomocnik\w*|pelnomocnik\w*|przerwa\s+proceduraln\w*|nie\s+bede\s+dalej\s+odpowiadac)\b/.test(normQ(base)))return base;
 const chosen=createAnswer(c,intent);
 const applied=safeChange(c,base,chosen,intent);
 if(applied){m.focus=intent.topic;m.lastQuestion=String(raw).slice(0,350);window.PS61_LAST={id:c.id,type:intent.type,answer:chosen};}
 return applied?chosen:base;
}
registerWitnessAnswerLayer("22-procedural-dialogue",answer);
const ps3_22_procedural_dialogue_npc4Export = function(){const all=prevExport();for(const c of CONTENT.characters){const m=NPC4_STATE[c.id]?.npc61;if(m&&all[c.id])all[c.id].npc61={focus:m.focus.slice(0,35),lastQuestion:m.lastQuestion.slice(0,350),turn:Math.min(100000,m.turn)};}return all;};
registerWitnessExportLayer("22-procedural-dialogue",ps3_22_procedural_dialogue_npc4Export);
const ps3_22_procedural_dialogue_npc4Restore = function(raw){prevRestore(raw);for(const c of CONTENT.characters){const r=raw?.[c.id]?.npc61;if(!r||typeof r!=='object')continue;const m=memory(c);m.focus=r.focus==='risk'?'risk':'';m.lastQuestion=typeof r.lastQuestion==='string'?r.lastQuestion.slice(0,350):'';m.turn=Number.isSafeInteger(r.turn)?Math.max(0,Math.min(100000,r.turn)):0;}};
registerWitnessRestoreLayer("22-procedural-dialogue",ps3_22_procedural_dialogue_npc4Restore);
window.PS61_QA={version:'6.1',analyze:(id,q,attached)=>{const c=chars.get(id);return c?findIntent(c,q,attached):null;},state:id=>chars.has(id)?memory(chars.get(id)):null,last:()=>window.PS61_LAST||null};
})();

