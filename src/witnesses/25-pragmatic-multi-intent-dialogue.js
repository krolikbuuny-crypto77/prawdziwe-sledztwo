
/* Etap 6.5 — pragmatyka rozmowy: wieloczęściowe pytania, przypisanie cytatów,
   źródło wiedzy i fałszywe przesłanki. Nie zmienia logiki dowodów ani procesu.
   Odpowiedzi wyłącznie z istniejących, przypisanych świadkowi faktów. */
(function(){
'use strict';
const previousAnswer=WitnessEngine.snapshotAnswer(),previousExport=WitnessEngine.snapshotExport(),previousRestore=WitnessEngine.snapshotRestore();
const witnesses=new Map(CONTENT.characters.map(c=>[c.id,c]));
const norm65=s=>norm(String(s||'')).replace(/\s+/g,' ').trim();
const clamp=(s,n=440)=>String(s||'').trim().slice(0,n);
const evi=/\b(?:dowod\w*|okaz\w*|konfront\w*|protokol\w*|log\w*|tcms|cctv|t\s*17|karta\s+dostepu|metadane|nagran\w*|rejestr\w*|autoryzac\w*|biegly|przesluchan\w*)\b/;
const crime=/\b(?:zabil\w*|zaboj\w*|zamord\w*|morder\w*|sprawc\w*|przyznaj\w*\s+sie|groz\w*|szantaz\w*|sfalszow\w*|zataj\w*|oskarz\w*)\b/;
const female=c=>c.gender==='f';
const say=(c,masc,fem)=>female(c)?fem:masc;
const P={
 whereabouts:/\b(?:gdzie\s+(?:(?:wtedy|tej\s+nocy|w\s+nocy)\s+)?(?:byles|bylas|przebywales|przebywalas)|co\s+(?:robiles|robilas)\s+(?:wtedy|tej\s+nocy|po\s+alarmie)|masz\s+alibi|jakie\s+masz\s+alibi|kto\s+potwierdzi\s+twoja\s+obecnosc)\b/,
 corroboration:/\b(?:kto\s+(?:to|ci|cie|panu|pani|twoje\s+slowa|twoja\s+obecnosc)?\s*(?:potwierdzi|poswiadczy|widzial)|ktos\s+(?:cie|ciebie|pana|pania)\s+(?:widzial|potwierdzi)|masz\s+swiadka|jest\s+na\s+to\s+swiadek|kto\s+moze\s+to\s+potwierdzic)\b/,
 source:/\b(?:skad\s+(?:to\s+)?(?:wiesz|wiadomo|masz\s+pewnosc)|od\s+kogo\s+(?:to\s+)?(?:wiesz|uslyszal\w*)|sam\w*\s+to\s+(?:widziales|widzialas)|widziales\s+to\s+(?:osobiscie|sam)|widzialas\s+to\s+(?:osobiscie|sama)|wiesz\s+to\s+z\s+autopsji)\b/,
 risk:/\b(?:wiedziales|wiedzialas|slyszales|slyszalas|ostrzegala|ostrzegal|zdawales\s+sobie\s+sprawe|zdawalas\s+sobie\s+sprawe)\b.{0,75}\b(?:uster\w*|zagrozen\w*|niezgodn\w*|niebezpiecz\w*|problem\w*|len\w*|wagon\w*|tw\s*217)\b|\b(?:co\s+wiedziales|co\s+wiedzialas)\s+o\s+(?:awarii|zagrozeniu|usterce|problemie)\b/,
 action:/\b(?:co\s+(?:z\s+tym\s+)?(?:zrobiles|zrobilas|podjales|podjelas)|jak\s+(?:zareagowales|zareagowalas)|jakie\s+dzialania\s+podj\w*|dlaczego\s+(?:nie\s+zareagowales|nie\s+zareagowalas|nic\s+nie\s+zrobiles|nic\s+nie\s+zrobilas)|czemu\s+(?:nie\s+zareagowales|nie\s+zareagowalas)|jak\s+temu\s+zaradzil\w*)\b/,
 grief:/\b(?:co\s+(?:o\s+tym\s+)?myslisz|jak\s+to\s+przezywasz|jak\s+sie\s+z\s+tym\s+czujesz|czy\s+ci\s+przykro|jak\s+(?:przyjales|przyjelas)\s+wiadomosc)\b.{0,80}\b(?:smier\w*|trag\w*|len\w*|zgin\w*)\b|\b(?:trag\w*|smier\w*)\b.{0,60}\b(?:co\s+myslisz|jak\s+sie\s+czujesz)\b/,
 victimContact:/\b(?:kiedy\s+(?:ostatnio\s+)?(?:widziales|widzialas|spotkales|spotkalas|rozmawiales|rozmawialas)\s+(?:z\s+)?len\w*|co\s+(?:ci|panu|pani)\s+lena\s+(?:powiedziala|mowila)|o\s+czym\s+(?:rozmawiales|rozmawialas)\s+z\s+lena)\b/,
 alarm:/\b(?:co\s+(?:zrobiles|zrobilas|sie\s+stalo)\s+po\s+alarmie|o\s+ktorej\s+(?:byl|zglosil\w*)\s+alarm|kto\s+wezwal\s+pomoc|kto\s+znalazl\s+lene)\b/,
 report:/\b(?:raport\w*\s+bhp|zgloszen\w*\s+bhp|szkic\w*\s+bhp|wyslan\w*\s+zgloszen\w*|niewyslan\w*\s+raport\w*)\b/
};
const topicLabels={whereabouts:'moją obecność',corroboration:'potwierdzenie moich słów',source:'źródło informacji',risk:'moją wiedzę o zagrożeniu',action:'podjęte przeze mnie działania',grief:'śmierć Leny',victimContact:'kontakt z Leną',alarm:'zgłoszenie alarmowe',report:'zgłoszenie BHP'};
const order=['risk','action','whereabouts','corroboration','victimContact','source','alarm','report','grief'];
function mem(c){const x=NPC4_STATE[c.id];if(!x.npc65||!Array.isArray(x.npc65.recent))x.npc65={recent:[],lastTopic:'',lastQuestion:'',lastAnswer:''};return x.npc65;}
function facts(c,topic,question){const D=NPC9_CUSTOM[c.id]||{}, F=NPC94_FACTS[c.id]||{};
 switch(topic){
 case 'whereabouts':return F.alibi||D.time||'';
 case 'corroboration':return (D.verification||'')+' '+(D.time||'');
 case 'source':{
  const t=mem(c).lastTopic;
  if(t==='alarm'||t==='victimContact')return D.source||'';
  if(t==='risk'||t==='report')return (D.source||'')+' '+(D.verification||'');
  return D.source||'';
 }
 case 'risk':return D.risk||'';
 case 'action':return D.accountability||D.work||'';
 case 'grief':return D.feeling||F.emotion||'';
 case 'victimContact':return D.conversation||F.last||'';
 case 'alarm':return c.id==='TOMASZ'?'Znalazłem Lenę przy stanowisku numer trzy. Alarm zgłosiłem o 02:02. Nie widziałem chwili powstania obrażeń.':say(c,'O śmierci Leny dowiedziałem się po alarmie. Nie widziałem samego zdarzenia.','O śmierci Leny dowiedziałam się po alarmie. Nie widziałam samego zdarzenia.');
 case 'report':return c.id==='ELZBIETA'?D.verification:(D.risk||'')+' '+(D.verification||'');
 default:return '';
 }
}
// Whitelist, not keyword-only topic guessing: every selected issue needs a narrow predicate.
function segments(q){return q.split(/\s*(?:\?|;|\bi\b|\boraz\b|\ba\s+(?=kto\b|co\b|gdzie\b|skad\b|czemu\b|dlaczego\b|jak\b|czy\b))\s*/).map(t=>t.trim()).filter(Boolean);}
function subjects(q){const ref=norm65(q), named=[];
 for(const c of CONTENT.characters)if(new RegExp('\\b(?:'+norm65(c.name.split(' ')[0])+'|'+norm65(c.name.split(' ').at(-1))+')\\b').test(ref))named.push(c.id);
 return {victim:/\b(?:len\w*|rudnick\w*|ofiara|ofiary)\b/.test(ref),named};
}
function interpret(c,raw,attached){
 if(attached)return null;
 const q=norm65(raw);if(!q||q.length>900)return null;
 const isSevere=crime.test(q),hasEvidence=evi.test(q),parts=segments(q);
 const patient=subjects(q);
 const quoting=/\b(?:mowiles|mowilas|powiedziales|powiedzialas|twierdziles|twierdzilas|zeznales|zeznalas|przyznales|przyznalas)\b/.test(q);
 const firstPersonQuestion=/\b(?:ty|pan|pani|ciebie|twoja|twoje|byles|bylas|wiedziales|wiedzialas|zrobiles|zrobilas|widziales|widzialas|miales|mialas)\b/.test(q);
 // Protect formal allegations and documentary cross-examination.
 if(isSevere||hasEvidence)return null;
 // Referent safety: do not return another person's alibi when a question is about that person.
 if(patient.named.some(id=>id!==c.id) && !/\b(?:skad|widziales|widzialas|co\s+wiesz|co\s+slyszal\w*)\b/.test(q))return null;
 if(patient.victim&&/\b(?:gdzie\s+(?:byla|przebywala)|czy\s+(?:byla|chodzila)\s+sama|kto\s+z\s+nia\s+byl)\b/.test(q))return null;
 const unsupported=/(?:\bskoro\b|\bprzeciez\b|\bczyli\b|\bmowil\w*\b|\bprzyznal\w*\b|\bpowiedzial\w*\b)/.test(q);
 if(unsupported&&/\b(?:widziales|widzialas|ogladales|ogladalas)\b.{0,45}\b(?:jak\s+lena\s+umierala|sam\s+moment\s+smierci|atak\w*\s+na\s+lene)\b/.test(q))return {kind:'false_eye',topic:'alarm'};
 if(unsupported&&/\b(?:lena\s+byla\s+sama|lena\s+nikogo\s+nie\s+spotkala)\b/.test(q))return {kind:'false_alone',topic:'victimContact'};
 if(unsupported&&/\b(?:kazd\w*\s+(?:raport\w*|zgloszen\w*)\s+(?:byl\w*\s+)?wyslan\w*|wszystkie\s+zgloszen\w*\s+(?:zostal\w*\s+)?(?:wyslan\w*|dotarl\w*))\b/.test(q))return {kind:'false_report',topic:'report'};
 // Old and actual quotes need comparison: don't invent admissions.
 if(/\b(?:sprzecz\w*|klam\w*|wycofuj\w*|zmieniasz\s+wersj\w*|najpierw\s+twierdz\w*|mowiles\s+wczesniej\s+ze|mowilas\s+wczesniej\s+ze)\b/.test(q)&&quoting){return {kind:'compare',topic:'source'};}
 const found=[];
 for(const part of parts){for(const k of order){if(P[k].test(part)&&!found.includes(k)){found.push(k);break;}}}
 // Some two-question phrases omit a conjunction but retain two independent predicates.
 if(parts.length===1&&/\b(?:i|oraz)\b/.test(q)){
  for(const k of order)if(P[k].test(q)&&!found.includes(k))found.push(k);
 }
 if(found.length>=2)return {kind:'compound',topics:found.slice(0,2)};
 // Short follow-ups retain earlier subject but never assert an unverified person/act.
 const st=mem(c);
 if(st.lastTopic && /^(?:a\s+)?(?:kto\s+(?:to\s+)?potwierdzi|skad\s+(?:to\s+)?wiesz|kto\s+byl\s+swiadkiem|czym\s+to\s+sprawdzic)\??$/.test(q))return {kind:'follow_source',topic:st.lastTopic};
 if(st.lastTopic && /^(?:a\s+)?(?:co\s+z\s+tym\s+zrobiles|co\s+z\s+tym\s+zrobilas|i\s+co\s+dalej\s+z\s+tym)\??$/.test(q) &&['risk','report','action'].includes(st.lastTopic))return {kind:'follow_action',topic:'action'};
 if(/^(?:a\s+)?(?:o\s+kogo\s+chodzi|co\s+masz\s+na\s+mysli)\??$/.test(q))return null;
 if(/^(?:(?:i|a)\s+)?(?:co\s+z\s+nim|co\s+z\s+nia|co\s+on\s+zrobil|co\s+ona\s+zrobila|gdzie\s+on\s+byl|gdzie\s+ona\s+byla)\??$/.test(q))return {kind:'clarify',topic:''};
 if(/^(?:no\s+)?(?:swietnie|genialnie|no\s+jasne|jak\s+wygodnie|bardzo\s+wygodne|pieknie)\b/.test(q)&&/\b(?:nic\s+nie\s+wiesz|nic\s+nie\s+pamietasz|nikt\s+nic|przypad\w*|alibi)\b/.test(q))return {kind:'irony',topic:st.lastTopic};
 return found.length===1 ? {kind:'single',topic:found[0]} : null;
}
function compose(c,intent){
 if(intent.kind==='false_eye')return say(c,'Nie powiedziałem, że widziałem atak na Lenę. Mogę mówić tylko o tym, co sam zaobserwowałem.','Nie powiedziałam, że widziałam atak na Lenę. Mogę mówić tylko o tym, co sama zaobserwowałam.');
 if(intent.kind==='false_alone')return say(c,'Nie potwierdziłem, że Lena była sama przez cały czas. Nie miałem ciągłej obserwacji jej drogi.','Nie potwierdziłam, że Lena była sama przez cały czas. Nie miałam ciągłej obserwacji jej drogi.');
 if(intent.kind==='false_report')return 'Nie potwierdzam, że wszystkie zgłoszenia zostały wysłane. '+clamp(facts(c,'report'),510);
 if(intent.kind==='compare'){
  const last=mem(c).recent.filter(r=>r.topic!=='source').at(-1);
  return last ? 'Nie uznaję samego streszczenia za dowód sprzeczności. Wcześniej '+say(c,'odpowiadałem','odpowiadałam')+' na pytanie dotyczące '+(last.topic==='risk'?'zagrożenia':last.topic==='action'?'moich działań':last.topic==='whereabouts'?'mojej obecności':last.topic==='alarm'?'zgłoszenia alarmowego':last.topic==='report'?'zgłoszenia BHP':'konkretnego zdarzenia')+'. Proszę wskazać dwa dokładne zdania do porównania.' : 'Proszę przytoczyć dokładnie obie wypowiedzi i wskazać, gdzie się wykluczają. Nie potwierdzę sprzeczności na podstawie samej sugestii.';
 }
 if(intent.kind==='clarify')return 'O którą osobę i który moment chodzi? Nie chcę przypisać komuś zachowania, którego nie potrafię potwierdzić.';
 if(intent.kind==='irony')return 'Rozumiem ironię, ale nie chcę zastępować konkretnego faktu zgadywaniem. '+clamp(facts(c,intent.topic||'source'),400);
 if(intent.kind==='follow_source')return 'Jeśli pytasz o '+(topicLabels[intent.topic]||'poprzednią sprawę')+': '+clamp(facts(c,intent.topic==='alarm'?'alarm':'source'),560);
 if(intent.kind==='follow_action')return clamp(facts(c,'action'),630);
 if(intent.kind==='compound'){
  return intent.topics.map((topic,i)=>{
   const detail=clamp(facts(c,topic),490);if(!detail)return '';
   return (i===0?'Jeśli chodzi o ':'A jeśli chodzi o ')+(topicLabels[topic]||'tę kwestię')+': '+detail;
  }).filter(Boolean).join(' ').slice(0,1250);
 }
 // A high-confidence single-source question can override the base only if clearly misdirected.
 return '';
}
function protectedResponse(base){return /\b(?:odmow\w*|pelno\w*\s*mocnik\w*|pelnomocnik\w*|przerwa\s+proceduraln\w*|podtrzymuje\s+odmowe|nie\s+bede\s+dalej\s+odpowiadac|nie\s+bede\s+odpowiadac\s+w\s+tej\s+formie)\b/.test(norm65(base));}
function reconcile(c,base,answer,intent){
 const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],turn=m?.turn;
 if(!m||!Array.isArray(m.semantic)||!Array.isArray(m.statements))return false;
 const forbidden=new Set(['CORRECTION_WITH_EVIDENCE','CONFESSION']);
 let sem=[...m.semantic].reverse().find(r=>r.turn===turn&&r.answer===base&&!forbidden.has(r.status));
 let stmt=[...m.statements].reverse().find(r=>r.turn===turn&&r.text===base&&!forbidden.has(r.status));
 // Some safe conversational replies have no existing semantic record. Record the
 // spoken explanation as LIMITED_KNOWLEDGE only, never as verified proof.
 if(!sem){sem={turn,topic:'source',answer:base,status:'LIMITED_KNOWLEDGE',source:'ustne wyjaśnienie świadka',source_ids:[]};m.semantic.push(sem);if(m.semantic.length>250)m.semantic.splice(0,m.semantic.length-250);}
 if(!stmt){stmt={turn,topic:'source',text:base,status:'LIMITED_KNOWLEDGE',source_ids:[]};m.statements.push(stmt);if(m.statements.length>200)m.statements.splice(0,m.statements.length-200);}
 const topic=intent.topic||intent.topics?.[0]||'source',focus='natural-6.5-'+intent.kind;
 if(sem){sem.answer=answer;sem.topic=topic;sem.focus=focus;sem.source_ids=[];}
 if(stmt){stmt.text=answer;stmt.topic=topic;stmt.source_ids=[];}
 if(m.topics?.length)m.topics[m.topics.length-1]=topic;
 if(m.lastFocus)m.lastFocus={...m.lastFocus,topic,focus};
 if(s.recent?.length){const r=s.recent.at(-1);r.topic=topic;r.focus=focus;r.answer=norm65(answer).slice(0,1550);r.variant='natural-6.5';}
 if(s.npc5){if(s.npc5.recent?.length){const r=s.npc5.recent.at(-1);r.topic=topic;r.answer=answer.slice(0,1400);r.mode='natural-6.5';}s.npc5.anchor={topic,focus,question:clamp(m.userClaims?.at(-1)?.text,180),answer:answer.slice(0,1400)};}
 if(s.npc57){const st=s.npc57;if(st.episodes?.length){st.episodes=st.episodes.filter(e=>!(e.turn===turn&&e.answer===base));st.episodes.push({topic,question:clamp(m.userClaims?.at(-1)?.text,450),answer:answer.slice(0,1600),turn,protected:false,kind:'natural-6.5'});if(st.episodes.length>80)st.episodes.splice(0,st.episodes.length-80);}st.focus=topic;}
 if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic,focus,variant:'natural-6.5'};
 return true;
}
function nextAnswer(c,raw,attached){
 const intent=interpret(c,raw,attached), old=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const base=previousAnswer(c,raw,attached),changed=(NPC9_MEMORY[c.id]?.confronted?.length||0)>old;
 const st=mem(c);let answer=base;
 if(intent&&!changed&&!attached&&!protectedResponse(base)){
  const proposed=compose(c,intent);
  if(proposed&&proposed!==base&&reconcile(c,base,proposed,intent))answer=proposed;
 }
 const topic=intent?.topic||intent?.topics?.[0]||'';
 if(topic&&answer&&intent.kind!=='clarify'){
  st.lastTopic=topic;st.lastQuestion=clamp(raw,400);st.lastAnswer=clamp(answer,1300);
  st.recent.push({topic,question:clamp(raw,400),answer:clamp(answer,1300)});
  if(st.recent.length>36)st.recent.splice(0,st.recent.length-36);
 }else if(!intent&&/\b(?:alibi|gdzie\s+byles|gdzie\s+bylas|o\s+innej\s+sprawie|zmienmy\s+temat)\b/.test(norm65(raw)))st.lastTopic='';
 window.PS65_LAST={id:c.id,kind:intent?.kind||'fallback',topics:intent?.topics||[topic],replaced:answer!==base,formal:!!attached||changed};
 return answer;
}
registerWitnessAnswerLayer("25-pragmatic-multi-intent-dialogue",nextAnswer);
const ps3_25_pragmatic_multi_intent_dialogue_npc4Export = function(){const out=previousExport();for(const c of CONTENT.characters){const s=NPC4_STATE[c.id]?.npc65;if(s&&out[c.id])out[c.id].npc65={lastTopic:clamp(s.lastTopic,32),lastQuestion:clamp(s.lastQuestion,400),lastAnswer:clamp(s.lastAnswer,1300),recent:s.recent.slice(-36).map(r=>({topic:clamp(r.topic,35),question:clamp(r.question,400),answer:clamp(r.answer,1300)}))};}return out;};
registerWitnessExportLayer("25-pragmatic-multi-intent-dialogue",ps3_25_pragmatic_multi_intent_dialogue_npc4Export);
const ps3_25_pragmatic_multi_intent_dialogue_npc4Restore = function(raw){previousRestore(raw);for(const c of CONTENT.characters){const r=raw?.[c.id]?.npc65;if(!r||typeof r!=='object')continue;const s=mem(c);s.lastTopic=typeof r.lastTopic==='string'?clamp(r.lastTopic,32):'';s.lastQuestion=typeof r.lastQuestion==='string'?clamp(r.lastQuestion,400):'';s.lastAnswer=typeof r.lastAnswer==='string'?clamp(r.lastAnswer,1300):'';s.recent=(Array.isArray(r.recent)?r.recent:[]).filter(x=>x&&typeof x.topic==='string'&&typeof x.question==='string'&&typeof x.answer==='string').slice(-36).map(x=>({topic:clamp(x.topic,35),question:clamp(x.question,400),answer:clamp(x.answer,1300)}));}};
registerWitnessRestoreLayer("25-pragmatic-multi-intent-dialogue",ps3_25_pragmatic_multi_intent_dialogue_npc4Restore);
window.PS65_QA={version:'6.5',analyze:(id,text,attached)=>witnesses.has(id)?interpret(witnesses.get(id),text,attached):null,last:()=>window.PS65_LAST||null,state:id=>witnesses.has(id)?mem(witnesses.get(id)):null};
})();

