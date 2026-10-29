/* Pakiet 6.2: kontekst pytań następczych i naprawianie niezrozumiałych odpowiedzi.
 * Warstwa językowa: nie zmienia faktów, presji, relacji ani przyznanych dowodów.
 * Działa offline i daje pierwszeństwo formalnym zeznaniom oraz dowodom. */
(function(){
'use strict';
const priorAnswer=WitnessEngine.snapshotAnswer();
const priorExport=WitnessEngine.snapshotExport();
const priorRestore=WitnessEngine.snapshotRestore();
const ids=new Set(CONTENT.characters.map(c=>c.id));
const canon=x=>norm(String(x||'')).replace(/\s+/g,' ').trim();
const take=(x,n)=>String(x||'').trim().slice(0,n);
const forbidden=/\b(?:dowod\w*|dokument\w*|protokol\w*|raport\w*|rejestr\w*|bhp|tcms|cctv|nagran\w*|kamer\w*|karta\s+dostepu|kart\w*\s+t\s*17|metadan\w*|autoryzac\w*|konfront\w*|oskarz\w*|zabil\w*|zamord\w*|zaboj\w*|sprawc\w*|przyzna\w*|grozil\w*|zataj\w*|szantaz\w*|falsz\w*|klam\w*|sprzecz\w*|odmawiam|pelnomocnik)\b/;
const formal=/\b(?:odmawiam|pelnomocnik|nie\s+bede\s+dalej\s+odpowiadac|przerwac\s+przesluchanie|nie\s+jest\s+jeszcze\s+sprawdzon\w*|brak\s+potwierdzenia\s+tozsamosci)\b/;
const severe=/\b(?:powiedziales\s+wczesniej|powiedzialas\s+wczesniej|zeznal\w*|przypomnij\s+(?:zeznanie|zeznania)|klam\w*|zab\w*|kto\s+jest\s+winny)\b/;
const subjects=CONTENT.characters.map(c=>({id:c.id, tokens:c.name.split(/\s+/).map(canon).filter(t=>t.length>2)}));
const maxHistory=16;
const initial=()=>({topic:'',q:'',a:'',turn:0,recent:[],hits:{}});
function state(c){
 const p=NPC4_STATE[c.id];
 if(!p.npc62||!Array.isArray(p.npc62.recent))p.npc62=initial();
 return p.npc62;
}
function namedOther(c,q){
 return subjects.some(x=>x.id!==c.id&&x.tokens.some(t=>new RegExp('\\b'+t+'\\b').test(q)));
}
function topic(q){
 if(/\b(?:alibi|twoja\s+obecnosc|swoja\s+obecnosc|gdzie\s+(?:wtedy\s+)?(?:byles|bylas|przebywales|przebywalas)|gdzie\s+(?:tej\s+|tamtej\s+)?nocy\s+(?:byles|bylas)|gdzie\s+(?:(?:noca|tej\s+nocy|tamtej\s+nocy)\s+)?(?:siedziales|siedzialas|przebywales|przebywalas|byles|bylas)|w\s+ktorym\s+miejscu\s+(?:byles|bylas))\b/.test(q))return 'alibi';
 if(/\b(?:kto\s+(?:cie|ciebie|pana|pania|to)\s+(?:widzial|potwierdzi|poswiadczy)|kto\s+moze\s+to\s+(?:potwierdzic|poswiadczyc)|masz\s+jakiegos\s+swiadka|kto\s+byl\s+twoim\s+swiadkiem)\b/.test(q))return 'witness';
 if(/\b(?:co\s+(?:z\s+tym\s+)?(?:zrobiles|zrobilas|podjales|podjelas)|jak\s+(?:zareagowales|zareagowalas)|co\s+zrobil\w*\s+pozniej)\b/.test(q))return 'action';
 if(/\b(?:zagrozen\w*|usterk\w*|ostrzezen\w*|ryzyk\w*)\b/.test(q))return 'risk';
 if(/\b(?:czym\s+sie\s+zajmowales|czym\s+sie\s+zajmowalas|jak\s+wygladala\s+twoja\s+praca|jakie\s+miales\s+obowiazki|jakie\s+mialas\s+obowiazki)\b/.test(q))return 'work';
 return '';
}
const simplify=/^(?:(?:a|i|no)\s+)?(?:mozesz\s+(?:mi\s+)?(?:to\s+)?(?:wyjasnic|powiedziec|wytlumaczyc)\s+(?:po\s+ludzku|prosciej|normalnie|bez\s+zargonu)|powiedz\s+(?:to\s+)?(?:po\s+ludzku|normalnie|prosciej|jasniej)|co\s+to\s+tak\s+po\s+ludzku\s+znaczy|nie\s+rozumiem\s+(?:tego|co\s+masz\s+na\s+mysli)|wytlumacz\s+(?:mi\s+)?to\s+po\s+prostu|a\s+innymi\s+slowami|rozwin\s+to\s+prosciej)\??$/;
const implications=/^(?:(?:a|i|no)\s+)?(?:co\s+(?:tak\s+naprawde|w\s+praktyce|konkretnie)\s+(?:z\s+tego|z\s+tych\s+slow)\s+wynika|co\s+z\s+tego\s+wynika|co\s+to\s+oznacza\s+w\s+praktyce|co\s+to\s+wedlug\s+ciebie\s+znaczy|jaki\s+z\s+tego\s+wniosek)\??$/;
const retry=/^(?:(?:a|i|no)\s+)?(?:powiedz\s+(?:to\s+)?konkretniej|mow\s+konkretniej|przejdz\s+do\s+sedna|powiedz\s+to\s+wprost|bez\s+ogolnikow|nie\s+owijaj\s+w\s+bawelne|chce\s+konkretow|krotko\s+i\s+na\s+temat|bez\s+tych\s+ogolnikow)\??$/;
const vaguePerson=/^(?:a\s+)?(?:gdzie\s+ona\s+wtedy\s+byla|gdzie\s+on\s+wtedy\s+byl|co\s+on\s+zrobil|co\s+ona\s+zrobila|a\s+co\s+z\s+nia|a\s+co\s+z\s+nim)\??$/;
const resetWords=/\b(?:nie\s+o\s+to\s+(?:pytam|pytalem|pytalam|chodzi)|pytam\s+o\s+cos\s+innego|tylko\s+(?:powiedz|wyjasnij)|interesuje\s+mnie\s+(?:to|raczej))\b/;
function redirect(q){
 if(!resetWords.test(q))return '';
 // Only an explicit new topic is allowed to displace the earlier answer.
 if(/\b(?:gdzie\s+(?:byles|bylas|przebywales|przebywalas)|twoje\s+alibi|o\s+alibi|twoja\s+obecnosc)\b/.test(q))return 'alibi';
 if(/\b(?:kto\s+(?:to|cie|ciebie)\s+(?:potwierdzi|widzial)|kto\s+moze\s+to\s+potwierdzic|swiadk\w*)\b/.test(q))return 'witness';
 if(/\b(?:co\s+(?:z\s+tym\s+)?(?:zrobiles|zrobilas)|jak\s+(?:zareagowales|zareagowalas)|twoje\s+dzialania)\b/.test(q))return 'action';
 return '';
}
function source(c,key){
 const d=NPC9_CUSTOM[c.id]||{},f=NPC94_FACTS[c.id]||{};
 switch(key){
  case 'alibi':return f.alibi||'';
  case 'witness':return f.witness||'';
  case 'action':return d.accountability||f.responsibility||'';
  case 'risk':return d.risk||'';
  case 'work':return d.work||f.location||'';
  default:return '';
 }
}
function shortAnswer(s){
 // Extract literal sentences; never synthesize times, names or causal claims.
 const original=take(s,1250).replace(/\s+/g,' ').trim();
 if(!original)return '';
 const sentences=original.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];
 return sentences.slice(0,2).join(' ').replace(/\s+/g,' ').trim().slice(0,420);
}
// Plain-language summaries are limited to already established personal alibis.
const plainAlibi={
 MAREK:'Kierowałem nocną zmianą. Pracowałem głównie w biurze, ale wychodziłem też służbowo.',
 TOMASZ:'Pracowałem w dyspozytorni. Później poszedłem do stanowiska trzeciego, gdzie znalazłem Lenę.',
 JANUSZ:'Pracowałem w warsztacie przy naprawach. Nie pamiętam każdej minuty.',
 ELZBIETA:'Zajmowałam się zgłoszeniami BHP. Nie obserwowałam placu przez całą noc.',
 KAMIL:'Prowadziłem diagnostykę TW-217. Nie przebywałem cały czas w jednym miejscu.',
 MAGDALENA:'Sprawdzałam dokumentację. Aktywność sesji nie mówi, gdzie fizycznie byłam.'
};
const openings={
 MAREK:['Krótko mówiąc: ','Najprościej: ','Mogę to ująć konkretniej: '],
 TOMASZ:['Najkrócej: ','Powiem prościej: ','Z tego, co pamiętam: '],
 JANUSZ:['Mówiąc bez ogródek: ','Krótko: ','Sprowadza się to do tego: '],
 ELZBIETA:['Powiem to prościej: ','W skrócie: ','Ujmę to precyzyjniej: '],
 KAMIL:['Bez technicznego żargonu: ','Krótko: ','Mówiąc prościej: '],
 MAGDALENA:['Zwięźle: ','Mówiąc dokładniej: ','Najprościej: ']
};
function nextIntro(c,st,kind){const k=st.hits[kind]||0;return openings[c.id][k%3];}
function special(c,q,st){
 if(resetWords.test(q)&&st.a&&/\b(?:co\s+(?:zrobiles|zrobilas)\s+dalej|co\s+bylo\s+dalej|co\s+sie\s+stalo\s+potem)\b/.test(q))
  return {kind:'sequence-clarification',text:'Który moment masz na myśli: dalszy przebieg mojej zmiany czy działania po alarmie?'};
 const r=redirect(q);
 if(r){const value=source(c,r);return value?{kind:'redirect',topic:r,text:value}:null;}
 if(vaguePerson.test(q))return {kind:'referent',text:'O którą osobę pytasz i o jaki moment? Nie chcę pomylić jej zachowania z czyimś alibi.'};
 if(!st.a)return null;
 if(simplify.test(q)||retry.test(q))return {kind:'simplify',text:st.topic==='alibi'?plainAlibi[c.id]:shortAnswer(st.a)};
 if(implications.test(q))return {kind:'implications',text:shortAnswer(st.a)};
 return null;
}
function sync(c,before,after){
 if(before===after)return true;
 const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id],turn=m?.turn;
 if(!m||!s)return false;
 const protectedStatus=new Set(['CORRECTION_WITH_EVIDENCE','CONFESSION']);
 const sem=(m.semantic||[]).slice().reverse().find(x=>x.turn===turn&&x.answer===before);
 const stmt=(m.statements||[]).slice().reverse().find(x=>x.turn===turn&&x.text===before);
 if(!sem&&!stmt)return false;
 if((sem&&(protectedStatus.has(sem.status)||(sem.source_ids||[]).length))||
    (stmt&&(protectedStatus.has(stmt.status)||(stmt.source_ids||[]).length)))return false;
 if(sem){sem.answer=after;sem.focus='dialogue-6.2';}
 if(stmt)stmt.text=after;
 if(s.recent?.length&&s.recent.at(-1).answer===canon(before).slice(0,1550))s.recent.at(-1).answer=canon(after).slice(0,1550);
 if(s.npc5?.recent?.length&&s.npc5.recent.at(-1).answer===before.slice(0,1400))s.npc5.recent.at(-1).answer=after.slice(0,1400);
 if(s.npc5?.anchor?.answer===before.slice(0,1400))s.npc5.anchor.answer=after.slice(0,1400);
 if(s.npc57?.episodes?.length&&s.npc57.episodes.at(-1).answer===before.slice(0,1600)&&!s.npc57.episodes.at(-1).protected)s.npc57.episodes.at(-1).answer=after.slice(0,1600);
 if(s.npc65?.recent?.length&&s.npc65.recent.at(-1).answer===before.slice(0,1300))s.npc65.recent.at(-1).answer=after.slice(0,1300);
 if(s.npc65?.lastAnswer===before.slice(0,1300))s.npc65.lastAnswer=after.slice(0,1300);
 if(s.npc68?.threads?.length&&s.npc68.threads.at(-1).a===before.slice(0,850))s.npc68.threads.at(-1).a=after.slice(0,850);
 if(s.npc89?.recent?.length&&s.npc89.recent.at(-1).a===before.slice(0,1200))s.npc89.recent.at(-1).a=after.slice(0,1200);
 if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,focus:'dialogue-6.2'};
 return true;
}
function answer(c,question,attached){
 if(!c||!ids.has(c.id))return priorAnswer(c,question,attached);
 const st=state(c),q=canon(question),key=!namedOther(c,q)&&topic(q)||'';
 const oldConfronted=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const response=priorAnswer(c,question,attached);
 const newConfrontation=(NPC9_MEMORY[c.id]?.confronted?.length||0)>oldConfronted;
 const m=NPC9_MEMORY[c.id];
 const current=m?.semantic?.slice().reverse().find(x=>x.turn===m.turn);
 const locked=!!attached||newConfrontation||!q||q.length>500||forbidden.test(q)||severe.test(q)||
   formal.test(canon(response))||['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(current?.status)||
   typeof npc9Tone==='function'&&npc9Tone(question)==='pressure';
 if(locked)return response;
 const offer=special(c,q,st);
 let chosen=response;
 if(offer&&offer.text){
  const previousTopic=st.topic;
  const intro=nextIntro(c,st,offer.kind);
  let next=['referent','sequence-clarification'].includes(offer.kind)?offer.text:intro+offer.text;
  if(offer.kind==='implications')next+=' To opis mojej wiedzy, nie dowód na cudze działania.';
  if(next.length<=1500&&sync(c,response,next)){
   chosen=next;
   st.hits[offer.kind]=Math.min(100000,(st.hits[offer.kind]||0)+1);
   if(offer.topic){st.topic=offer.topic;st.q=take(question,400);st.a=take(chosen,900);st.turn=m?.turn||0;}
   else {st.topic=previousTopic;}
  }
 }
 // Keep the last substantive turn as an anchor. Elliptical questions do not displace it.
 if(key&&!offer&&chosen&&chosen.length>15&&!formal.test(canon(chosen))){
  st.topic=key;st.q=take(question,400);st.a=take(chosen,900);st.turn=m?.turn||0;
 }
 st.recent.push({q:take(question,300),a:take(chosen,450),kind:offer?.kind||key||''});
 if(st.recent.length>maxHistory)st.recent.splice(0,st.recent.length-maxHistory);
 return chosen;
}
registerWitnessAnswerLayer('62-contextual-dialogue',answer);
registerWitnessExportLayer('62-contextual-dialogue',function(){
 const out=priorExport();
 for(const c of CONTENT.characters){const st=NPC4_STATE[c.id]?.npc62;if(!st||!out[c.id])continue;
  out[c.id].npc62={topic:take(st.topic,30),q:take(st.q,400),a:take(st.a,900),turn:Math.max(0,Math.min(100000,st.turn||0)),
   hits:Object.fromEntries(Object.entries(st.hits).filter(([k,v])=>k.length<40&&Number.isSafeInteger(v)).slice(0,8)),
   recent:st.recent.slice(-maxHistory).map(r=>({q:take(r.q,300),a:take(r.a,450),kind:take(r.kind,30)}))};
 }
 return out;
});
registerWitnessRestoreLayer('62-contextual-dialogue',function(raw){
 priorRestore(raw);
 for(const c of CONTENT.characters){
  const r=raw?.[c.id]?.npc62,st=state(c);
  if(!r||typeof r!=='object'){NPC4_STATE[c.id].npc62=initial();continue;}
  st.topic=typeof r.topic==='string'?take(r.topic,30):'';
  st.q=typeof r.q==='string'?take(r.q,400):'';
  st.a=typeof r.a==='string'?take(r.a,900):'';
  st.turn=Number.isSafeInteger(r.turn)?Math.max(0,Math.min(r.turn,100000)):0;
  st.hits={};for(const [k,v]of Object.entries(r.hits&&typeof r.hits==='object'&&!Array.isArray(r.hits)?r.hits:{}).slice(0,8))if(k.length<40&&Number.isSafeInteger(v))st.hits[k]=Math.max(0,Math.min(100000,v));
  st.recent=(Array.isArray(r.recent)?r.recent:[]).filter(x=>x&&typeof x.q==='string'&&typeof x.a==='string'&&typeof x.kind==='string').slice(-maxHistory).map(x=>({q:take(x.q,300),a:take(x.a,450),kind:take(x.kind,30)}));
 }
});
window.PS62_DIALOGUE=Object.freeze({version:'6.2',inspect:id=>{
 const c=CONTENT.characters.find(c=>c.id===id);if(!c)return null;
 const s=state(c);return {topic:s.topic,turn:s.turn,recent:s.recent.length,hits:{...s.hits}};
}});
})();
