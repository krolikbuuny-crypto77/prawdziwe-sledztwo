
/* Prawdziwe Śledztwo 5.7 — pamięć długiej rozmowy i korekta założeń.
 * Nie stwierdza winy, nie przyznaje dowodów, nie modyfikuje kosztów ani bramek procesowych.
 */
(function(){
'use strict';
const beforeAnswer=WitnessEngine.snapshotAnswer(), beforeSave=WitnessEngine.snapshotExport(), beforeLoad=WitnessEngine.snapshotRestore();
const IDS=new Set(CONTENT.characters.map(c=>c.id));
const LIMIT=80;
const normalize=q=>norm(String(q||'')).replace(/\s+/g,' ').trim();
const test=(q,r)=>r.test(q);
const strictEvidence=/\b(?:dowod\w*|pokaz\w*\s+(?:dokument|raport|protokol)|konfront\w*|zabiles|zabilas|zabil|zabojstw\w*|zamordow\w*|morderstw\w*|przyznaj\w*\s+sie|groz\w*|szantaz\w*|areszt\w*|falszow\w*|sklam\w*|klamiesz|matacz\w*|oskarz\w*|zataj\w*|odczyt\w*|rejestr\w*|logow\w*|protokol\w*)\b/;
const personVictim=/\b(?:lena|lene|leny|lenie|rudnick\w*|ofiara|ofiare|ofiary|ona|niej|jej)\b/;
const docTopic=/\b(?:raport\w*\s+bhp|bhp|zgloszen\w*\s+zagrozen|karta\s+t\s*17|t\s*17|rejestr\w*\s+kart|tcms|log\w*\s+tcms|kamera\w*|cctv|protokol\w*\s+odbioru|podzesp\w*\s+l\s*2|audyt\w*)\b/;
const topics=[
 ['alibi',/\b(?:alibi|moja\s+obecnosc|twoja\s+obecnosc|gdzie\s+(?:byles|bylas)|kto\s+(?:cie|ciebie|pana|pania)\s+widzial)\b/],
 ['discovery',/\b(?:odnalezien\w*|znalezien\w*|znalaz\w*\s+lene|stanowisk\w*\s+(?:nr\s*)?3|alarm\w*\s+o\s+02|kto\s+znalaz\w*)\b/],
 ['grief',/\b(?:smierc\w*\s+leny|traged\w*|zaloba|przezyw\w*|smut\w*|co\s+myslisz\s+o\s+lenie)\b/],
 ['conversation',/\b(?:rozmow\w*\s+z\s+lena|rozmaw\w*\s+z\s+lena|co\s+lena\s+(?:mowila|powiedziala)|ostatni\w*\s+kontakt)\b/],
 ['bhp',/\b(?:raport\w*\s+bhp|bhp|rejestr\w*\s+zagrozen|zgloszen\w*\s+zagrozen)\b/],
 ['card',/\b(?:kart\w*\s+t\s*17|karta\s+dostepu|przepustk\w*)\b/],
 ['tcms',/\b(?:tcms|log\w*\s+techniczn\w*|diagnostyk\w*\s+tw|tw\s*217)\b/],
 ['audit',/\b(?:audyt\w*|protokol\w*\s+odbior\w*|podzesp\w*)\b/],
 ['work',/\b(?:prac\w*|dyzur\w*|zmian\w*|obowiazk\w*|grafik\w*)\b/],
 ['victim',/\b(?:lena|leny|lene|lenie|rudnick\w*)\b/]
];
function topicFor(q){for(const [id,re] of topics)if(test(q,re))return id;return null;}
const switchPattern=/\b(?:wrocmy|wracajac|wroc|powrocmy|porozmawiajmy|pogadajmy|przejdzmy|zmienmy\s+temat|teraz\s+(?:o|do)|cofnijmy\s+sie|jeszcze\s+raz\s+o)\b|^(?:a\s+)?co\s+z\s+(?:raportem|karta|alibi|bhp|dokumentem|aud ytem|len a)/;
const recallPattern=/\b(?:przypomnij|przypomni\w*|mowiles\s+wczesniej|mowilas\s+wczesniej|powiedzial\w*\s+wczesniej|wspominal\w*\s+wczesniej|co\s+(?:mowiles|mowilas)\s+o|wrocmy\s+do\s+tego\s+co)\b/;
const followPattern=/^(?:a|i|no|to)?\s*(?:co\s+(?:potem|dalej)|i\s+co\s+dalej|skad\s+(?:to\s+)?wiesz|dlaczego|czemu|kto\s+to\s+potwierdzi|o\s+ktorej|gdzie\s+dokladnie|na\s+pewno|a\s+wtedy)\??$/;
const sarcasmPattern=/\b(?:no\s+genialnie|no\s+swietnie|no\s+pieknie|swietna\s+robota|brawo|gratulacje|co\s+za\s+zbieg\s+okolicznosci|jakie\s+to\s+wygodne|no\s+jasne|jasne\s+oczywiscie|cudownie|idealne\s+alibi|piekne\s+alibi|wszystko\s+jasne\s+oczywiscie)\b/;
const sarcasmStrong=/\b(?:nikt\s+nic\s+nie\s+widzial|nikt\s+nic\s+nie\s+wie|nic\s+nie\s+wiesz|niczego\s+nie\s+pamietasz|idealne\s+alibi|piekne\s+alibi|nagle\s+wszyscy\s+zapomnieli)\b/;
function assumption(q){
 const attributed=/\b(?:skoro|twierdziles|twierdzilas|powiedziales|powiedzialas|mowiles|mowilas|przyznales|przyznalas|czyli\s+wedlug\s+ciebie|wychodzi\s+na\s+to|to\s+znaczy\s+ze|a\s+wiec)\b/;
 if(!attributed.test(q))return null;
 if(/\b(?:widziales|widzialas|obserwowales|obserwowalas|przyznales|przyznalas)\b/.test(q) && /\b(?:jak\s+(?:lena|ona|ja)\s+(?:zginela|umierala|umarl|zostala\s+zabita)|moment\w*\s+(?:smierci|zabojstwa|ataku)|kto\s+(?:ja|lene)\s+zaatakowal)\b/.test(q))return 'eyewitness';
 if(/\b(?:lena|ona|ofiara)\s+byla\s+sama|\blena\s+nikogo\s+nie\s+miala|\bna\s+pewno\s+byla\s+sama/.test(q))return 'victim_alone';
 if(/\b(?:nie\s+wychodziles|nie\s+wychodzilas|caly\s+czas\s+(?:byles|bylas)|ani\s+na\s+chwile\s+nie\s+wyszedles|nieprzerwanie\s+(?:byles|bylas)|cale\s+twoje\s+alibi\s+potwierdzone)\b/.test(q))return 'unbroken_alibi';
 if(/\b(?:kamer\w*\s+(?:pokazal\w*|zarejestrowal\w*)|na\s+nagraniu\s+widac)\b.*\b(?:zabojstw\w*|atak\w*|sprawc\w*)\b/.test(q))return 'camera_conclusion';
 if(/\b(?:wiesz|powiedziales|powiedzialas|przyznales|przyznalas)\b.*\b(?:kto\s+zabil|kto\s+zamordowal|sprawca\s+jest)\b/.test(q))return 'culprit_conclusion';
 return null;
}
function getStore(c){
 const st=NPC4_STATE[c.id];
 if(!st.npc57||!Array.isArray(st.npc57.episodes))st.npc57={episodes:[],focus:'',turn:0};
 return st.npc57;
}
function topicEvidence(q){
 if(/\b(?:raport|bhp|tcms|protokol|karta|audyt|nagranie|kamera|dokument)\b/.test(q))return true;
 return false;
}
function fact(c,topic){
 const F=NPC94_FACTS[c.id]||{},G=NPC9_CUSTOM[c.id]||{};
 switch(topic){
 case 'alibi':return F.alibi||'';
 case 'work':return G.work||F.location||'';
 case 'discovery':return c.id==='TOMASZ'?'Znalazłem Lenę przy stanowisku numer trzy. Alarm zgłosiłem o 02:02. Nie widziałem chwili powstania obrażeń.':'Zgłoszenie alarmowe dotyczyło znalezienia Leny przy stanowisku numer trzy. Nie obserwowałem bezpośrednio jej śmierci.';
 case 'grief':return F.emotion||'';
 case 'conversation':return G.conversation||F.last||'';
 case 'victim':return F.last||G.lena||'';
 default:return '';
 }
}
function female(c,s){if(c.gender!=='f')return s;return s.replace(/twierdziłem/g,'twierdziłam').replace(/stwierdziłem/g,'stwierdziłam').replace(/widziałem/g,'widziałam').replace(/obserwowałem/g,'obserwowałam').replace(/potwierdziłem/g,'potwierdziłam').replace(/miałem/g,'miałam').replace(/powiedziałem/g,'powiedziałam').replace(/mogę sam potwierdzić/g,'mogę sama potwierdzić');}
function correct(c,type){
 let text='';
 switch(type){
 case 'eyewitness': text='Nie twierdziłem, że widziałem chwilę śmierci Leny ani sprawcę ataku. Znam tylko ten fragment zdarzeń, który mogę sam potwierdzić.';break;
 case 'victim_alone': text='Nie stwierdziłem, że Lena na pewno była sama. Nie miałem ciągłej obserwacji jej drogi; to pozostaje do sprawdzenia.';break;
 case 'unbroken_alibi': text='Nie twierdziłem, że ktoś obserwował mnie bez przerwy. '+(NPC94_FACTS[c.id]?.alibi||'Nie mam potwierdzenia każdej minuty swojej obecności.');break;
 case 'camera_conclusion': text='Nie potwierdziłem, że kamera zarejestrowała sam atak. Zakres i jakość nagrania trzeba sprawdzić osobno; samo moje zdanie tego nie dowodzi.';break;
 case 'culprit_conclusion': text='Nie przedstawiłem ustalenia, kto zabił Lenę. Nie wolno zamieniać przypuszczenia w pewnik bez niezależnych dowodów.';break;
 }
 return female(c,text);
}
function ironic(c,q,topic){
 const intro=c.id==='KAMIL'?'Rozumiem ironię, ale trzymajmy się danych. ':c.id==='MAGDALENA'?'To nie zastępuje weryfikacji materiału. ':'Rozumiem, że brzmi to niewystarczająco. ';
 if(/\balibi\b/.test(q)||topic==='alibi')return intro+(NPC94_FACTS[c.id]?.alibi||'Nie posiadam potwierdzenia każdej minuty.');
 if(/\b(?:nikt\s+nic|nic\s+nie\s+wiesz|zapomnieli)\b/.test(q))return female(c,intro+'Mogę wyjaśnić, co widziałem osobiście i czego nie potrafię potwierdzić. Proszę wskazać konkretny moment.');
 return intro+'Nie chcę zastępować faktów domysłami. O który szczegół pytasz?';
}
function safeEpisode(ep){return ep&&typeof ep.topic==='string'&&typeof ep.question==='string'&&typeof ep.answer==='string'&&ep.answer.length<2100&&ep.question.length<500&&!ep.protected;}
function recover(c,topic){const data=getStore(c);
 const prior=[...data.episodes].reverse().find(x=>x.topic===topic&&safeEpisode(x)&&!['recall','premise','irony','culprit_question'].includes(x.kind));
 if(!prior)return null;
 // Never replay testimony superseded by a formal correction.
 const mem=NPC9_MEMORY[c.id];
 if(mem?.confronted?.length&&['card','bhp','audit','tcms'].includes(topic))return null;
 return prior;
}
function reconcile(c,base,answer,topic,focus){
 if(!answer||base===answer)return;
 const mem=NPC9_MEMORY[c.id],st=NPC4_STATE[c.id];
 if(!Array.isArray(mem.semantic))mem.semantic=[];
 if(!Array.isArray(mem.statements))mem.statements=[];
 const semantic=[...(mem.semantic||[])].reverse().find(r=>r.turn===mem.turn&&r.answer===base&&!['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(r.status)) || [...(mem.semantic||[])].reverse().find(r=>r.turn===mem.turn&&!['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(r.status));
 if(semantic){semantic.answer=answer;semantic.topic=topic;semantic.focus=focus;semantic.source_ids=[];}
 else if(Array.isArray(mem.semantic))mem.semantic.push({turn:mem.turn,topic,focus,person:null,answer,source:'wcześniejsza wypowiedź świadka / brak nowego źródła',certainty:'ograniczona do dostępnej wiedzy',status:'LIMITED_KNOWLEDGE',source_ids:[]});
 const stat=[...(mem.statements||[])].reverse().find(r=>r.turn===mem.turn&&r.text===base&&!['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(r.status)) || [...(mem.statements||[])].reverse().find(r=>r.turn===mem.turn&&!['CORRECTION_WITH_EVIDENCE','CONFESSION'].includes(r.status));
 if(stat){stat.text=answer;stat.topic=topic;}
 else if(Array.isArray(mem.statements))mem.statements.push({turn:mem.turn,topic,text:answer,status:'LIMITED_KNOWLEDGE',source_ids:[],confidence:'ograniczona'});
 if(mem.topics?.length)mem.topics[mem.topics.length-1]=topic;
 if(mem.lastFocus)mem.lastFocus={...mem.lastFocus,topic:topic==='discovery'?'what_happened':topic,focus};
 if(st?.recent?.length){const last=st.recent.at(-1);last.topic=topic;last.focus=focus;last.answer=normalize(answer).slice(0,1550);last.variant='natural-5.7';}
 const n5=st?.npc5;
 if(n5){
  if(n5.recent?.length){let r=n5.recent.at(-1);r.topic=topic;r.answer=answer.slice(0,1400);r.mode='natural-5.7';}
  n5.anchor={topic:topic==='discovery'?'what_happened':topic,focus,question:String(mem.userClaims?.at(-1)?.text||'').slice(0,180),answer:answer.slice(0,1400)};
 }
 if(window.NPC4_LAST?.id===c.id)window.NPC4_LAST={...window.NPC4_LAST,topic,focus,variant:'natural-5.7'};
}
function check(c,raw,attached){
 if(attached)return {type:'protected'};
 const q=normalize(raw);
 if(!q||q.length>700)return {type:'fallback'};
 const directDiscovery=/\b(?:znalazles|znalazlas|znalazl\s+pan|znalazla\s+pani|odnalazles|odnalazlas)\s+(?:lene|ja|ofiare)\b/.test(q);
 if(directDiscovery&&!strictEvidence.test(q))return {type:'discovery_direct',topic:'discovery'};
 const directAccusation=/\b(?:czy\s+(?:ty\s+|pan\s+|pani\s+)?zabil\w*|to\s+ty\s+zabil\w*|kto\s+zabil\w*\s+lene|kim\s+jest\s+zabojca)\b/.test(q);
 if(directAccusation)return {type:'culprit_question',topic:'victim'};
 const hidden=assumption(q);
 if(hidden)return {type:'premise',premise:hidden,topic:personVictim.test(q)?'victim_last':'alibi'};
 const talkTopic=topicFor(q),switchTopic=switchPattern.test(q)?talkTopic:null;
 const memory=getStore(c);
 const lastTopic=memory.focus||'';
 const wantRecall=recallPattern.test(q)&&talkTopic;
 if(wantRecall)return {type:'recall',topic:talkTopic};
 if(switchTopic)return {type:'switch',topic:switchTopic};
 const ironic=sarcasmPattern.test(q)&&sarcasmStrong.test(q);
 // Clear accusations / documentary confrontations stay in the evidence-aware engine.
 if(strictEvidence.test(q))return {type:'protected',topic:talkTopic};
 if(ironic)return {type:'irony',topic:talkTopic||lastTopic||'general'};
 return {type:followPattern.test(q)?'follow':'fallback',topic:talkTopic};
}
function run(c,raw,attached){
 const store=getStore(c),intent=check(c,raw,attached);
 const before=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const base=beforeAnswer(c,raw,attached);
 const after=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const formal=after>before;
 let answer=base,focus='direct',topic=intent.topic||NPC9_MEMORY[c.id]?.lastFocus?.topic||'general';
 if(!attached&&!formal){
  if(intent.type==='discovery_direct'){
   answer=fact(c,'discovery');focus='finding_company';
  }else if(intent.type==='culprit_question'){
   answer=/\bkto\s+zabil\b|\bkim\s+jest\s+zabojca\b/.test(normalize(raw))?'Nie widziałem chwili śmierci Leny ani sprawcy. Nie mam podstaw, aby wskazać winnego tylko na podstawie domysłów.':'To poważny zarzut. Nie przyznaję się do zabójstwa. Jeśli ma pan konkretny materiał, proszę go przedstawić i sprawdzić.';answer=female(c,answer);focus='unproven_accusation';
  }else if(intent.type==='premise'){
   answer=correct(c,intent.premise);focus='false_premise';
  }else if(intent.type==='irony'){
   answer=ironic(c,normalize(raw),topic);focus='irony';
  }else if(intent.type==='recall'){
   const ep=recover(c,topic);
   if(ep){const start=c.gender==='f'?'Wcześniej powiedziałam':'Wcześniej powiedziałem';answer=start+': „'+ep.answer.replace(/[\s.]+$/,'').slice(0,700)+'”.';focus='verified_recall';}
   else {answer=(c.gender==='f'?'Nie wskazywałam':'Nie wskazywałem')+' wcześniej potwierdzonego ustalenia w tym temacie. Możemy je teraz omówić, ale nie będę udawać, że już o nim zeznawałem.';focus='missing_recall';}
  }else if(intent.type==='switch'){
   const known=fact(c,topic);
   if(known&&!topicEvidence(normalize(raw))){answer=known;focus='topic_return';}
   // Documents still have their original information/evidence gates.
  }
 }
 if(formal||attached)answer=base;
 if(answer!==base)reconcile(c,base,answer,topic,focus);
 const newStore=getStore(c);
 if(['switch','recall','premise','irony','discovery_direct','culprit_question'].includes(intent.type))newStore.focus=topic;
 else if(intent.type==='fallback'&&intent.topic)newStore.focus=intent.topic;
 else if(intent.type==='follow'&&newStore.focus){
  // The older language engine may reset its lastFocus on a very short follow-up.
  // Keep the high-confidence long-term conversation topic as separate metadata.
  topic=newStore.focus;
 }
 if(!newStore.focus&&topic!=='general')newStore.focus=topic;
 const protectedAnswer=!!attached||formal||/\b(?:przyznaj|zabil|zabojstw|kto\s+zabil)\b/.test(normalize(raw));
 if(intent.type!=='follow'&&topic&&topic!=='general'&&answer&&typeof answer==='string'){
  newStore.episodes.push({topic,question:String(raw).slice(0,450),answer:answer.slice(0,1600),turn:NPC9_MEMORY[c.id]?.turn||0,protected:protectedAnswer,kind:intent.type});
  if(newStore.episodes.length>LIMIT)newStore.episodes.splice(0,newStore.episodes.length-LIMIT);
 }
 newStore.turn=(Number(newStore.turn)||0)+1;
 window.PS57_LAST={person:c.id,type:intent.type,topic,focus,overridden:answer!==base,formal,stored:newStore.episodes.length};
 return answer;
}
registerWitnessAnswerLayer("17-long-conversation-memory",run);
const ps3_17_long_conversation_memory_npc4Export = function(){
 const save=beforeSave();
 for(const c of CONTENT.characters){const s=NPC4_STATE[c.id]?.npc57;
  if(s&&save[c.id])save[c.id].npc57={focus:s.focus.slice(0,50),turn:Math.min(s.turn,100000),episodes:s.episodes.slice(-LIMIT).filter(safeEpisode).map(x=>({topic:x.topic.slice(0,50),question:x.question.slice(0,450),answer:x.answer.slice(0,1600),turn:x.turn,protected:false,kind:String(x.kind||'').slice(0,30)}))};
 }
 return save;
};
registerWitnessExportLayer("17-long-conversation-memory",ps3_17_long_conversation_memory_npc4Export);
const ps3_17_long_conversation_memory_npc4Restore = function(raw){
 beforeLoad(raw);
 for(const c of CONTENT.characters){const s=getStore(c),stored=raw?.[c.id]?.npc57;
  if(!stored||typeof stored!=='object')continue;
  s.focus=typeof stored.focus==='string'?stored.focus.slice(0,50):'';
  s.turn=Number.isSafeInteger(stored.turn)?Math.min(100000,Math.max(0,stored.turn)):0;
  s.episodes=(Array.isArray(stored.episodes)?stored.episodes:[]).filter(safeEpisode).slice(-LIMIT).map(x=>({topic:x.topic.slice(0,50),question:x.question.slice(0,450),answer:x.answer.slice(0,1600),turn:Number.isSafeInteger(x.turn)?x.turn:0,protected:false,kind:typeof x.kind==='string'?x.kind.slice(0,30):''}));
 }
};
registerWitnessRestoreLayer("17-long-conversation-memory",ps3_17_long_conversation_memory_npc4Restore);
window.PS57_QA={version:'5.7',analyze:(id,raw,attached)=>{const c=CONTENT.characters.find(x=>x.id===id);return c?check(c,raw,attached):null;},inspect:id=>IDS.has(id)?getStore(CONTENT.characters.find(c=>c.id===id)):null,last:()=>window.PS57_LAST||null,topics:topics.map(t=>t[0])};
})();

