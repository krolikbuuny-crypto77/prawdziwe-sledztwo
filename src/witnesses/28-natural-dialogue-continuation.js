
/* Naturalny dialog: kontynuacja istniejącego, lokalnego silnika.
   Odpowiedzi nie tworzą dowodów ani nie obchodzą kontroli przesłuchań. */
(function(){
'use strict';
const priorAnswer=WitnessEngine.snapshotAnswer(), priorExport=WitnessEngine.snapshotExport(), priorRestore=WitnessEngine.snapshotRestore();
const normalize=s=>norm(String(s||'')).replace(/\s+/g,' ').trim();
const LIMIT=44, max=(s,n=450)=>String(s||'').trim().slice(0,n);
const witnesses=new Map(CONTENT.characters.map(c=>[c.id,c]));
const severe=/\b(?:zabil\w*|zaboj\w*|zamord\w*|morder\w*|sprawc\w*|przyznaj\w*|przyznal\w*|wymusz\w*|groz\w*|szantaz\w*|falszow\w*|sfalszow\w*|zataj\w*|oskarz\w*|konfront\w*)\b/;
const explicitEvidence=/\b(?:okaz\w*|pokaz\w*\s+(?:mi\s+)?(?:dowod\w*|dokument\w*|log\w*|protokol\w*)|cctv|tcms|t\s*17|metadan\w*|rejestr\s+kart\w*|nagran\w*|audyt\s+zrodel)\b/;
const refusal=/\b(?:odmow\w*|pelnomocnik\w*|pelno\s*mocnik\w*|przerwa\s+procedural\w*|nie\s+bede\s+dalej\s+odpowiadac|podtrzymuj\w*\s+odmow\w*)\b/;
const voc={
 MAREK:{dispute:['Nie przyjmuję tego uproszczenia.','To nie jest tak jednoznaczne, jak pan sugeruje.','Rozdzielmy odpowiedzialność kierownika od tego, co można udowodnić.'],soft:['Rozumiem, dlaczego pan o to pyta.','To dotyczy zmiany, za którą odpowiadałem.','Nie chcę odpowiadać za kogoś, lecz za własne czynności.'],check:['Tu ważna jest kolejność zdarzeń.','Najpierw trzeba oddzielić zapisy od obserwacji.','Nie chcę wyciągać wniosków ponad materiał.']},
 TOMASZ:{dispute:['Chwila. Tego nie powiedziałem.','Nie mieszajmy mojej dyspozycji z tym, czego nie widziałem.','Proszę mi nie przypisywać cudzych działań.'],soft:['Pamiętam ten moment.','Spróbuję to uporządkować.','To były różne chwile tej samej nocy.'],check:['Trzeba odtworzyć kolejność, nie samą godzinę.','W dyspozytorni nie widzi się całego placu.','Rejestr połączeń pokaże tylko część tego, co się działo.']},
 JANUSZ:{dispute:['Nie, proszę nie stawiać tego w ten sposób.','To są dwie różne rzeczy.','Nie można z brakującego podpisu robić dowodu przemocy.'],soft:['W warsztacie wszystko ma swoją kolejność.','Lena wracała do tematu usterek.','Powiem tylko tyle, za ile mogę ręczyć.'],check:['Najpierw sprawdźmy, co rzeczywiście zrobiono.','Karty pracy nie opisują każdego kroku.','Dokument trzeba zestawić z czynnościami.']},
 ELZBIETA:{dispute:['Nie mogę tego przyjąć jako faktu.','To byłoby zbyt daleko idące stwierdzenie.','Proszę rozróżnić niedopełnienie procedury od wiedzy o zdarzeniu.'],soft:['To dla mnie trudna część tej sprawy.','Pamiętam tę rozmowę z Leną.','Chcę powiedzieć dokładnie to, co wiem.'],check:['Szkic zgłoszenia to nie potwierdzenie wysyłki.','W tej sprawie znaczenie ma obieg dokumentu.','Najpierw trzeba ustalić, gdzie zgłoszenie się zatrzymało.']},
 KAMIL:{dispute:['Nie, to nie wynika z odczytów.','Chwileczkę, tak nie działają te zapisy.','Nie można mi przypisać czyjegoś ruchu na podstawie sesji.'],soft:['Mogę opowiedzieć o diagnostyce.','Te odczyty dobrze pamiętam.','O samej Lenie wiem znacznie mniej niż o wagonie.'],check:['Najważniejszy jest surowy zapis sesji.','Trzeba oddzielić alarm od autoryzowanego testu.','Log nie śledzi ludzi po całej zajezdni.']},
 MAGDALENA:{dispute:['Nie zgadzam się z takim wnioskiem.','Proszę nie utożsamiać sesji z obecnością człowieka.','Nie ma podstaw do tak stanowczego twierdzenia.'],soft:['Pozostańmy przy konkretnym zakresie audytu.','Mogę wyjaśnić ograniczenia tych danych.','Nie chcę wychodzić poza materiał, który znam.'],check:['Historia wersji jest ważniejsza od pojedynczego wydruku.','Samo otwarcie sesji nie potwierdza obecności.','Każda zmiana protokołu ma swój kontekst.']}
};
const male=c=>c.gender!=='f';
const F=c=>NPC94_FACTS[c.id]||{};
const D=c=>NPC9_CUSTOM[c.id]||{};
function memory(c){
 const s=NPC4_STATE[c.id];
 if(!s.npc68||!Array.isArray(s.npc68.threads))s.npc68={last:'',person:'',threads:[],counts:{},recentAnswers:[]};
 return s.npc68;
}
function questionParts(q){return q.split(/(?:\?|\s+oraz\s+|\s+i\s+(?=(?:kto|czy|gdzie|co|skad|dlaczego|po\s+co)\b))/).map(x=>x.trim()).filter(Boolean).slice(0,3);}
function tagQuestion(raw,c,st,attached){
 if(attached)return null;
 const q=normalize(raw);if(!q||q.length>1100||severe.test(q)||explicitEvidence.test(q))return null;
 const first=/\b(?:ty|ciebie|ci|panu|pani|twoj\w*|byles|bylas|miales|mialas|robiles|robilas|wiedziales|wiedzialas|widziales|widzialas)\b/.test(q);
 const lena=/\b(?:lena|leny|lene|lenie|rudnick\w*|ofiara)\b/.test(q);
 const victimPronoun=/\b(?:ona|jej|nia|niej)\b/.test(q);
 const directOthers=CONTENT.characters.some(x=>x.id!==c.id&&new RegExp('\\b(?:'+normalize(x.name.split(' ')[0])+'|'+normalize(x.name.split(' ').at(-1))+')\\b').test(q));
 const who=/\b(?:kto|ktos|swiadek|swiadkow\w*|potwierdzi|poswiadczy|widzial\w*)\b/.test(q);
 const where=/\b(?:gdzie|alibi|byles|bylas|przebywal\w*|robiles|robilas)\b/.test(q);
 const victimWhere=lena&&/\b(?:gdzie|sama|z\s+kim|kto\s+z\s+nia|dokad|ostatnio|poszla|widziano)\b/.test(q);
 const risk=/\b(?:uster\w*|zagrozen\w*|bezpieczen\w*|problem\w*|awari\w*|wagon\w*|tw\s*217|niezgodn\w*|bhp|ostrzezen\w*)\b/.test(q);
 const knowledge=/\b(?:wiedz\w*|wiedziales|wiedzialas|slyszal\w*|byl\w*\s+swiadom\w*|mowila|ostrzegal\w*)\b/.test(q);
 const action=/\b(?:co\s+(?:wtedy\s+|z\s+tym\s+)?zrobil\w*|czemu\s+(?:nic|nie)|dlaczego\s+(?:nic|nie)|jak\s+zareagowal\w*|po\s+co\s+(?:milczal\w*|czekal\w*)|nic\s+nie\s+zrobil\w*|odpuscil\w*)\b/.test(q);
 const deflect=/\b(?:umy\w*\s+rece|przymknal\w*\s+oko|udawal\w*\s+ze\s+nic|machnal\w*\s+reka|zamiotl\w*\s+pod\s+dywan|wykreca\w*|zaslania\w*\s+sie\s+papier\w*|ucieka\w*\s+od\s+odpowiedzialnosci|zbyl\w*\s+lene)\b/.test(q);
 const justify=/\b(?:czyli|wiec|skoro|przeciez|tak\s+naprawde|w\s+takim\s+razie)\b/.test(q);
 if(directOthers&&!/\b(?:co\s+o\s+nim\s+wiesz|co\s+o\s+niej\s+wiesz|widziales|widzialas|czy\s+znasz)\b/.test(q))return {kind:'other_location',topic:'source',person:''};
 // Never transpose a question about Lena into the witness's own alibi.
 if(victimWhere)return {kind:'victim_route',topic:'victim_last',person:'lena'};
 if(victimPronoun&&!lena&&/\b(?:sama|gdzie|ostatnio|poszla|widziales|widzialas)\b/.test(q)){
  if(st.person==='lena')return {kind:'victim_route',topic:'victim_last',person:'lena'};
  return {kind:'clarify',topic:'',person:''};
 }
 if(/\b(?:nikt\s+nic\s+nie\s+widzial|no\s+genialnie|no\s+jasne|bardzo\s+wygodne|jak\s+wygodnie)\b/.test(q))return {kind:'irony',topic:st.last||'source'};
 if(deflect||(knowledge&&action&&(first||justify))||(risk&&action&&(first||justify)))return {kind:'implied_blame',topic:'accountability'};
 if(/\b(?:mowiles|mowilas|powiedziales|powiedzialas|przed\s+chwila|najpierw\s+twierdziles|najpierw\s+twierdzilas)\b/.test(q)&&/\b(?:a\s+teraz|jednak|sprzeczn\w*|inaczej|nie\s+zgadza)\b/.test(q))return {kind:'contradiction',topic:'source'};
 // Multiple distinct questions are answered separately, but only when both subjects are explicit.
 if(where&&who&&!victimWhere&&(first||/\balibi\b/.test(q)))return {kind:'two_part_alibi',topic:'alibi'};
 if(risk&&knowledge&&/\b(?:co\s+z\s+tym\s+zrobil|jak\s+zareagowal|nic\s+nie\s+zrobil)\b/.test(q))return {kind:'two_part_risk',topic:'risk'};
 if(/\b(?:skad\s+(?:to\s+)?wiesz|skad\s+ta\s+pewnosc|co\s+to\s+potwierdza|kto\s+to\s+potwierdzi|na\s+jakiej\s+podstawie)\b/.test(q)&&st.last)return {kind:'source_follow',topic:st.last};
 if(/^(?:a\s+|i\s+)?(?:co\s+z\s+tym\s+zrobil\w*|to\s+co\s+zrobil\w*|co\s+dalej\s+z\s+tym)\??$/.test(q)&&['risk','action','accountability','report'].includes(st.last))return {kind:'action_follow',topic:'action'};
 if(/^(?:i\s+|a\s+)?(?:co\s+potem|a\s+potem|i\s+co\s+dalej|co\s+bylo\s+dalej|a\s+wczesniej)\??$/.test(q)&&st.last)return {kind:'sequence_follow',topic:st.last};
 if(/^(?:a\s+)?(?:dlaczego|czemu|po\s+co|a\s+po\s+co)\??$/.test(q)&&st.last)return {kind:'why_follow',topic:st.last};
 if(/\b(?:jak\s+z\s+tym\s+zyjesz|czy\s+ci\s+jej\s+szkoda|jak\s+sie\s+czujesz\s+po\s+jej\s+smierci|tesknisz\s+za\s+lena|czy\s+to\s+cie\s+ruszylo)\b/.test(q))return {kind:'emotions',topic:'feeling',person:'lena'};
 if(/\b(?:zamiast\s+o\s+papierach|bez\s+papierologii|nie\s+o\s+to\s+pytam|powiedz\s+wprost|konkretnie\s+co\s+zrobil)\b/.test(q))return {kind:'direct',topic:/\b(?:co\s+zrobil\w*|co\s+podjal\w*|jak\s+zareagowal\w*)\b/.test(q)?'action':(st.last||'accountability')};
 return null;
}
function phrase(c,group,topic){
 const m=memory(c),count=m.counts[topic]||0;
 const options=(voc[c.id]||voc.MAREK)[group];
 return options[count%options.length];
}
function distinct(a,b){return a&&b&&normalize(a)!==normalize(b)?a+' '+b:a||b||'';}
function formulate(c,intent){
 const f=F(c),d=D(c),m=memory(c),topic=intent.topic;
 const say=(group)=>phrase(c,group,topic);
 switch(intent.kind){
 case 'other_location':return say('check')+' Nie mam podstaw, by wskazać dokładne położenie innego pracownika. '+max(f.source,260);
 case 'victim_route':return say('soft')+' Nie potrafię potwierdzić, że Lena przez cały ten czas była sama. '+max(distinct(f.lastvictim,f.last),460);
 case 'clarify':return 'O kogo dokładnie pytasz i o który moment? Nie chcę przypisać niewłaściwej osobie cudzego alibi.';
 case 'irony':return say('dispute')+' '+max(m.last==='alibi'?f.alibi:m.last==='risk'?d.risk||f.responsibility:f.source,450);
 case 'implied_blame':{const seen=m.counts[topic]||0;const detail=seen%3===0?distinct(d.risk||f.responsibility,f.responsibility):seen%3===1?distinct(d.accountability||f.responsibility,f.verify):distinct(f.responsibility,d.risk);return say('dispute')+' '+max(detail,590);}
 case 'contradiction':{
   const prev=m.threads.slice().reverse().find(e=>!['contradiction','clarify'].includes(e.kind));
   return say('check')+(prev?' Wcześniej odnosił'+(male(c)?'em':'am')+' się do '+({risk:'zagrożenia',alibi:'mojej obecności',action:'swoich działań',victim_last:'ostatnich kontaktów z Leną'}[prev.topic]||'konkretnego zdarzenia')+'. ':' ')+'Jeśli chodzi o sprzeczność, proszę wskazać dwie konkretne wypowiedzi. Sama sugestia nie oznacza, że zmienił'+(male(c)?'em':'am')+' zeznanie.';
 }
 case 'two_part_alibi':return say('soft')+' '+max(f.alibi,330)+' '+max(f.witness,330);
 case 'two_part_risk':return say('check')+' '+max(d.risk||f.responsibility,340)+' '+max(d.accountability||f.responsibility,340);
 case 'source_follow':return say('check')+' '+max(topic==='victim_last'||topic==='victimContact'?distinct(f.source,f.lastvictim):topic==='alibi'?f.witness:topic==='risk'||topic==='report'?f.verify:f.source,560);
 case 'action_follow':return say('soft')+' '+max(d.accountability||f.responsibility,580);
 case 'sequence_follow':return topic==='feeling'?'Pytasz o wcześniejszy kontakt z Leną czy o to, co działo się po alarmie?':say('soft')+' '+max(topic==='victim_last'||topic==='victimContact'?f.lastvictim:topic==='alarm'?f.victim:topic==='risk'?d.accountability||f.responsibility:f.time,520);
 case 'why_follow':return topic==='feeling'?say('soft')+' '+max(f.emotion,500):say('check')+' Nie potrafię na podstawie samej rozmowy ustalić czyichś motywów. '+max(topic==='risk'||topic==='action'?f.responsibility:topic==='alibi'?f.verify:f.source,440);
 case 'emotions':return say('soft')+' '+max(f.emotion||d.feeling,610);
 case 'direct':return max(topic==='action'||topic==='accountability'?d.accountability||f.responsibility:topic==='alibi'?f.alibi:topic==='risk'?d.risk||f.responsibility:f.source,580);
 }
 return '';
}
function commit(c,base,answer,intent){
 const n=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id];if(!n||!s||!Array.isArray(n.semantic)||!Array.isArray(n.statements))return false;
 const turn=n.turn,forbidden=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE']);
 const sem=n.semantic.slice().reverse().find(x=>x.turn===turn&&x.answer===base&&!forbidden.has(x.status));
 const stmt=n.statements.slice().reverse().find(x=>x.turn===turn&&x.text===base&&!forbidden.has(x.status));
 if(sem){sem.answer=answer;sem.topic=intent.topic||'source';sem.focus='dialog-6.8';sem.source_ids=[];}
 else {n.semantic.push({turn,topic:intent.topic||'source',focus:'dialog-6.8',answer,status:'LIMITED_KNOWLEDGE',source:'ustne wyjaśnienie świadka',source_ids:[]});if(n.semantic.length>250)n.semantic.splice(0,n.semantic.length-250);}
 if(stmt){stmt.text=answer;stmt.topic=intent.topic||'source';stmt.source_ids=[];}
 else {n.statements.push({turn,topic:intent.topic||'source',text:answer,status:'LIMITED_KNOWLEDGE',source_ids:[]});if(n.statements.length>200)n.statements.splice(0,n.statements.length-200);}
 if(n.topics?.length)n.topics[n.topics.length-1]=intent.topic||'source';
 n.lastFocus={...(n.lastFocus||{}),topic:intent.topic||'source',focus:'dialog-6.8'};
 if(s.recent?.length){const r=s.recent.at(-1);r.topic=intent.topic;r.focus='dialog-6.8';r.answer=normalize(answer).slice(0,1550);r.variant='dialog-6.8';}
 if(s.npc5){if(s.npc5.recent?.length){const r=s.npc5.recent.at(-1);r.topic=intent.topic;r.answer=answer.slice(0,1400);r.mode='dialog-6.8';}s.npc5.anchor={topic:intent.topic,focus:'dialog-6.8',question:max(n.userClaims?.at(-1)?.text,180),answer:answer.slice(0,1400)};}
 if(s.npc57&&Array.isArray(s.npc57.episodes)){
  s.npc57.episodes=s.npc57.episodes.filter(x=>!(x.turn===turn&&x.answer===base));
  s.npc57.episodes.push({topic:intent.topic,question:max(n.userClaims?.at(-1)?.text,450),answer:answer.slice(0,1600),turn,protected:false,kind:'dialog-6.8'});
  if(s.npc57.episodes.length>80)s.npc57.episodes.splice(0,s.npc57.episodes.length-80);s.npc57.focus=intent.topic;
 }
 if(s.npc65){const x=s.npc65;x.lastTopic=intent.topic;x.lastQuestion=max(n.userClaims?.at(-1)?.text,400);x.lastAnswer=max(answer,1300);
  if(x.recent?.length&&x.recent.at(-1).question===x.lastQuestion)x.recent.at(-1).answer=max(answer,1300);
  else {if(!Array.isArray(x.recent))x.recent=[];x.recent.push({topic:intent.topic,question:x.lastQuestion,answer:max(answer,1300)});if(x.recent.length>36)x.recent.splice(0,x.recent.length-36);}
 }
 if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic:intent.topic,focus:'dialog-6.8',variant:'dialog-6.8'};
 return true;
}
function reply(c,raw,attached){
 const m=memory(c),intent=tagQuestion(raw,c,m,attached),old=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const base=priorAnswer(c,raw,attached),newConfrontation=(NPC9_MEMORY[c.id]?.confronted?.length||0)>old;
 if(attached||newConfrontation||refusal.test(normalize(base))||!intent)return base;
 const proposed=max(formulate(c,intent),1450);
 if(!proposed||proposed===base||!commit(c,base,proposed,intent))return base;
 const id=intent.topic||'source';m.counts[id]=Math.min(100000,(m.counts[id]||0)+1);m.last=id;
 if(intent.person)m.person=intent.person;
 const record={topic:id,kind:intent.kind,q:max(raw,230),a:max(proposed,850)};
 m.threads.push(record);if(m.threads.length>LIMIT)m.threads.splice(0,m.threads.length-LIMIT);
 m.recentAnswers.push(normalize(proposed).slice(0,450));if(m.recentAnswers.length>7)m.recentAnswers.shift();
 return proposed;
}
registerWitnessAnswerLayer("28-natural-dialogue-continuation",reply);
const ps3_28_natural_dialogue_continuation_npc4Export = function(){const output=priorExport();for(const c of CONTENT.characters){const m=NPC4_STATE[c.id]?.npc68;if(!m||!output[c.id])continue;
 output[c.id].npc68={last:max(m.last,45),person:max(m.person,35),threads:m.threads.slice(-LIMIT).map(x=>({topic:max(x.topic,45),kind:max(x.kind,45),q:max(x.q,230),a:max(x.a,850)})),counts:Object.fromEntries(Object.entries(m.counts).filter(([k,v])=>k.length<50&&Number.isSafeInteger(v)).slice(0,20)),recentAnswers:m.recentAnswers.slice(-7).map(x=>max(x,450))};}
 return output;};
registerWitnessExportLayer("28-natural-dialogue-continuation",ps3_28_natural_dialogue_continuation_npc4Export);
const ps3_28_natural_dialogue_continuation_npc4Restore = function(raw){priorRestore(raw);for(const c of CONTENT.characters){const z=raw?.[c.id]?.npc68;if(!z||typeof z!=='object')continue;
 const m=memory(c);m.last=typeof z.last==='string'?max(z.last,45):'';m.person=z.person==='lena'?'lena':'';
 m.threads=(Array.isArray(z.threads)?z.threads:[]).filter(x=>x&&typeof x.topic==='string'&&typeof x.kind==='string'&&typeof x.q==='string'&&typeof x.a==='string').slice(-LIMIT).map(x=>({topic:max(x.topic,45),kind:max(x.kind,45),q:max(x.q,230),a:max(x.a,850)}));
 m.counts={};for(const [k,v]of Object.entries(z.counts&&typeof z.counts==='object'?z.counts:{}).slice(0,20))if(k.length<50&&Number.isSafeInteger(v))m.counts[k]=Math.max(0,Math.min(100000,v));
 m.recentAnswers=(Array.isArray(z.recentAnswers)?z.recentAnswers:[]).filter(x=>typeof x==='string').slice(-7).map(x=>max(x,450));
 }};
registerWitnessRestoreLayer("28-natural-dialogue-continuation",ps3_28_natural_dialogue_continuation_npc4Restore);
})();

