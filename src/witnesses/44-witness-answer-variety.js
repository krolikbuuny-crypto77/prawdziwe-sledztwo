
/* Poprawka 4 · lokalna naturalność przesłuchań (bez API).
   Stan narracji, dowody, bramki informacyjne, presja i blokady rozmów
   pozostają w pierwotnym silniku. Ta warstwa poprawia wyłącznie
   odpowiedzi jawnie mieszczące się w wiedzy konkretnego świadka. */
(function(){
'use strict';
if(typeof npc4Answer!=='function'||typeof npc4Export!=='function'||typeof npc4Restore!=='function')return;
const previousAnswer=WitnessEngine.snapshotAnswer(),previousExport=WitnessEngine.snapshotExport(),previousRestore=WitnessEngine.snapshotRestore();
const LIMIT=24;
const clean=s=>norm(String(s||'')).replace(/\s+/g,' ').trim();
const limit=(s,n)=>String(s||'').slice(0,n);
const sensitive=/\b(?:zabil\w*|zamordow\w*|morder\w*|zaboj\w*|sprawc\w*|przyznaj\w*|przyznales|przyznalas|sfalszow\w*|klam\w*|grozil\w*|szantaz\w*|sprzeczn\w*|oskarz\w*|konfront\w*|okaz\w*|zataj\w*|udowodnil\w*|mam\s+dowod|poprzednio\s+zeznal\w*)\b/;
const evidenceId=/\b(?:evid[_-]|dig[_-]|adm[_-]|tcms[_-]|cctv[_-]|bhp[_-]|t\s*[-–]?\s*17)\b/;
const official=/\b(?:odmawiam|pelnomocnik|nie\s+bede\s+dalej\s+odpowiadac|przerwac\s+przesluchanie|nie\s+jest\s+jeszcze\s+sprawdzony|brak\s+potwierdzenia\s+tozsamosci)\b/;
const fact=(c,key)=>String(NPC9_CUSTOM[c.id]?.[key]||'').trim();
const fMore=(c,key)=>String(NPC94_FACTS[c.id]?.[key]||'').trim();
function state(c){
 const st=NPC4_STATE[c.id];
 if(!st.npc89||!Array.isArray(st.npc89.recent))st.npc89={recent:[],focus:'',hits:{}};
 return st.npc89;
}
function topic(c,q,st){
 const lena=/\b(?:lena|leny|lene|lenie|rudnick\w*|ofiara|ofiary|poszkodowan\w*)\b/.test(q);
 const personal=/\b(?:rodzin\w*|dzieci|dziecko|partner\w*|maz|zona|malzenstw\w*|hobby|wakacj\w*|weekend\w*|po\s+pracy|prywatn\w*|zainteresowan\w*|czas\s+wolny)\b/.test(q);
 if(personal&&!/\b(?:alibi|zajezdn|pracy\s+tej\s+nocy|zmianie\s+nocnej|lena|leny)\b/.test(q))return 'private';
 if(c.id==='TOMASZ'&&lena&&/\b(?:znalaz\w*|odnalaz\w*|zauwaz\w*|zobacz\w*|natknal\w*|pierwszy\s+ujrzal\w*|co\s+zrobil\w*\s+gdy\w*)\b/.test(q))return 'discovery';
 const digital=/\b(?:log\w*|karta\s+(?:wejsciow\w*|dostep\w*)|sesj\w*|tcms|zapis\w*\s+(?:systemu|sesji)|autoryzac\w*|dane\s+cyfrowe|wydruk)\b/.test(q);
 const attribution=/\b(?:dowod\w*|potwierdz\w*|oznacz\w*|wskaz\w*|obecn\w*|byl\w*|osob\w*|czlowiek\w*|tozsamos\w*|kto\s+uzy\w*|lokalizac\w*)\b/.test(q);
 if((c.id==='KAMIL'||c.id==='MAGDALENA')&&digital&&attribution)return 'digital_limit';
 if(/\b(?:smierc\w*|tragiczn\w*|traged\w*|zgin\w*|nie\s+zyje|odejsc\w*|zal\s+ci|brakuj\w*\s+ci)\b/.test(q)&&/\b(?:mysl\w*|czuj\w*|przezyw\w*|radz\w*|ruszyl\w*|przykro|boli\w*|smut\w*|emocj\w*|wspomin\w*|teskn\w*|reakc\w*)\b/.test(q))return 'feelings';
 if(/\b(?:co\s+(?:cie|pana|pania)\s+najbardziej\s+boli|jak\s+(?:sie\s+)?z\s+tym\s+zyjesz|jak\s+to\s+przezywasz|czy\s+cie\s+to\s+ruszylo)\b/.test(q))return 'feelings';
 if(lena&&/\b(?:relacj\w*|znal\w*|blisko|przyjazn\w*|lubil\w*|kontakt\w*|rozmawial\w*|jak\s+sie\s+ukladal\w*|co\s+o\s+niej\s+mysl\w*)\b/.test(q))return 'relations';
 if(/\b(?:kto\s+(?:to\s+)?potwierdzi|jak\s+to\s+sprawdzic|skad\s+to\s+wiesz|czym\s+to\s+potwierdzisz|co\s+moze\s+potwierdzic)\b/.test(q))return 'verify';
 if(/^(?:a\s+|i\s+|no\s+i\s+)?(?:co\s+potem|co\s+dalej|i\s+co\s+dalej|co\s+bylo\s+dalej|a\s+potem|i\s+co\s+sie\s+stalo|jak\s+to\s+sie\s+skonczylo)\??$/.test(q))return 'follow';
 if(lena&&/\b(?:o\s+czym\s+rozmawial\w*|co\s+(?:ci|panu|pani)\s+powiedziala|co\s+jej\s+powiedz\w*|ostatnia\s+rozmow\w*)\b/.test(q))return 'conversation';
 if(/\b(?:czemu\s+|dlaczego\s+)\w*\s*(?:len\w*|bal\w*|ukrywal\w*|zamilkl\w*)/.test(q))return 'motive_unknown';
 return '';
}
const FEEL={
 MAREK:[
 'Lena nie żyje, a ja prowadziłem tę zmianę. To dla mnie ciężkie, ale moje poczucie odpowiedzialności nie zastąpi ustaleń.',
 'Wracam do tego, że odpowiadałem za organizację pracy. Nie umiem zmienić tego, co się stało, mogę za to wyjaśnić własne decyzje.',
 'Nie mam gotowej odpowiedzi na to, jak się po tym czuję. Za nocną zmianę odpowiadałem, ale nie widziałem chwili śmierci Leny.'
 ],
 TOMASZ:[
 'Pierwszy zobaczyłem Lenę przy stanowisku. To obraz, do którego wracam, choć wiem, że nie widziałem samego zdarzenia.',
 'Nie jest łatwo o tym mówić. Znalazłem ją i zgłosiłem alarm; nie mogę powiedzieć, co działo się przedtem.',
 'Najtrudniejsze jest wspomnienie tego, co zobaczyłem przy stanowisku trzecim. Resztę trzeba odtworzyć ze źródeł.'
 ],
 JANUSZ:[
 'Nieraz uważałem, że Lena przesadza z pytaniami o wagon. Po jej śmierci wracam do tamtych sporów inaczej.',
 'Żałuję, że nasze rozmowy o wagonie były tak ostre. To jednak nie daje mi wiedzy o samej tragedii.',
 'Kiedyś kłóciłem się z Leną o TW-217. Dziś nie umiem traktować tych sporów jak czegoś nieważnego.'
 ],
 ELZBIETA:[
 'Wracam do naszej rozmowy o bezpieczeństwie. Zastanawiam się, czy jej obawy potraktowałam dość poważnie.',
 'Najtrudniej mi myśleć o tym, że Lena próbowała wyjaśnić ryzyko, a ja nie dopilnowałam wszystkiego tak, jak chciałam.',
 'Nie przestaję wspominać rozmowy z Leną. Poczucie winy nie oznacza jednak, że wiem, jak doszło do jej śmierci.'
 ],
 KAMIL:[
 'Ruszyło mnie to. A kiedy z odczytu komputera od razu robi się zarzut wobec człowieka, dodatkowo mnie to złości.',
 'Nie jestem obojętny wobec śmierci Leny. Znam logi, ale nie pozwolę udawać, że mówią, kto ją skrzywdził.',
 'Gadaliśmy z Leną o rozbieżnościach w danych. Teraz wracam do tych rozmów, choć nie widziałem tego, co się stało.'
 ],
 MAGDALENA:[
 'Śmierć Leny była tragedią. Wolałabym, aby moje emocje nie przesłaniały tego, co rzeczywiście da się ustalić.',
 'To trudne, ale nie będę przedstawiać uczuć jako dowodu. Nie obserwowałam samego zdarzenia.',
 'Przykro mi z powodu śmierci Leny. Mogę rzetelnie mówić o dokumentacji, nie o tym, czego nie widziałam.'
 ]
};
const leads={MAREK:['Powiem konkretnie: ','Najważniejsze jest to: ','Z mojej strony wygląda to tak: '],TOMASZ:['Pamiętam tyle: ','Powiem, co wiem: ','W tej części mogę być precyzyjny: '],JANUSZ:['Sprowadza się to do jednego: ','W warsztacie patrzyłem na to tak: ','To mogę wyjaśnić: '],ELZBIETA:['Przypomnę istotną rzecz: ','Dla mnie ważne jest to, że ','Powiem to inaczej: '],KAMIL:['W danych wygląda to tak: ','Trzeba rozdzielić dwie rzeczy: ','Technicznie rzecz biorąc: '],MAGDALENA:['W tym zakresie mogę potwierdzić: ','Oddzielmy dwie kwestie: ','Mogę to sprecyzować: ']};
function alternative(c,kind,st,raw){
 const n=st.hits[kind]||0;
 const pre=leads[c.id][n%3];
 if(kind==='discovery')return n%2===0?'Gdy zobaczyłem Lenę przy stanowisku numer trzy, zgłosiłem alarm o 02:02. Nie widziałem chwili, w której doznała obrażeń.':'Znalazłem Lenę przy stanowisku nr 3. Potem zgłosiłem alarm o 02:02; co działo się wcześniej, tego nie widziałem.';
 if(kind==='digital_limit'){
  if(c.id==='KAMIL')return n%2===0?'Nie. Log pokazuje zdarzenia techniczne i sesje, nie dowodzi sam w sobie, kto fizycznie stał przy urządzeniu. '+fact(c,'verification'):'Wpis w systemie nie jest równoznaczny z obecnością konkretnego człowieka. '+fact(c,'documents')+' '+fact(c,'source');
  return n%2===0?'Nie. Zapis sesji potwierdza aktywność połączenia, a nie nieprzerwaną obecność konkretnej osoby. '+fact(c,'verification'):'Nie można utożsamiać sesji komputera z położeniem osoby. '+fact(c,'time')+' '+fact(c,'source');
 }
 if(kind==='feelings')return FEEL[c.id][n%3];
 if(kind==='relations')return pre+fact(c,'relations')+(n%2?' '+fact(c,'conversation'):'');
 if(kind==='conversation')return pre+fact(c,'conversation');
 if(kind==='verify')return pre+fact(c,'verification');
 if(kind==='private'){
  const personal={MAREK:'Wolę nie mieszać życia prywatnego z tym przesłuchaniem. O swojej pracy i decyzjach tej nocy mogę mówić.',TOMASZ:'O sprawach domowych nie chcę opowiadać. Mogę wrócić do dyspozytorni i tego, co zobaczyłem.',JANUSZ:'To moja prywatna sprawa. O zmianie i kartach warsztatowych nie mam zamiaru milczeć.',ELZBIETA:'To osobiste pytanie. Wolałabym zostać przy naszej rozmowie z Leną i zgłoszeniu BHP.',KAMIL:'Prywatne rzeczy zostawiłbym na boku. O diagnostyce i logach mogę mówić konkretnie.',MAGDALENA:'Nie widzę związku tego pytania z dokumentacją. O audycie mogę odpowiedzieć dokładnie.'};
  return personal[c.id];
 }
 if(kind==='motive_unknown')return 'Nie wiem, co Lena w tamtej chwili myślała ani dlaczego podjęła konkretną decyzję. '+fact(c,'conversation');
 if(kind==='follow'&&st.focus==='discovery'&&c.id==='TOMASZ')return 'Po znalezieniu Leny zgłosiłem alarm o 02:02. Nie obserwowałem tego, co wydarzyło się przed moim przybyciem.';
 if(kind==='follow'&&['relations','conversation'].includes(st.focus))return pre+fact(c,'conversation');
 if(kind==='follow'&&['digital_limit','verify'].includes(st.focus))return pre+fact(c,'verification');
 return '';
}
function similarity(a,b){
 const setA=new Set(clean(a).split(' ').filter(x=>x.length>3));
 const setB=new Set(clean(b).split(' ').filter(x=>x.length>3));
 if(!setA.size||!setB.size)return 0;
 let common=0;for(const x of setA)if(setB.has(x))common++;
 return 2*common/(setA.size+setB.size);
}
function sync(c,before,after){
 if(before===after)return;
 const mem=NPC9_MEMORY[c.id],st=NPC4_STATE[c.id];
 const forbidden=new Set(['CORRECTION_WITH_EVIDENCE','CONFESSION']);
 const sem=[...(mem?.semantic||[])].reverse().find(x=>x.turn===mem.turn&&x.answer===before&&!forbidden.has(x.status)&&!(x.source_ids||[]).length);
 const stmt=[...(mem?.statements||[])].reverse().find(x=>x.turn===mem.turn&&x.text===before&&!forbidden.has(x.status)&&!(x.source_ids||[]).length);
 if(sem)sem.answer=after;
 if(stmt)stmt.text=after;
 if(st?.recent?.length&&st.recent.at(-1).answer===clean(before).slice(0,1550))st.recent.at(-1).answer=clean(after).slice(0,1550);
 if(st?.npc5?.recent?.length&&st.npc5.recent.at(-1).answer===before.slice(0,1400))st.npc5.recent.at(-1).answer=after.slice(0,1400);
 if(st?.npc5?.anchor?.answer===before.slice(0,1400))st.npc5.anchor.answer=after.slice(0,1400);
 if(st?.npc57?.episodes?.length){const last=st.npc57.episodes.at(-1);if(last.answer===before.slice(0,1600)&&!last.protected)last.answer=after.slice(0,1600);}
 if(st?.npc65?.recent?.length&&st.npc65.recent.at(-1).answer===before.slice(0,1300))st.npc65.recent.at(-1).answer=after.slice(0,1300);
 if(st?.npc65?.lastAnswer===before.slice(0,1300))st.npc65.lastAnswer=after.slice(0,1300);
 if(st?.npc68?.threads?.length&&st.npc68.threads.at(-1).a===before.slice(0,850))st.npc68.threads.at(-1).a=after.slice(0,850);
}
function answer(c,raw,attached){
 const st=state(c),q=clean(raw),before=NPC9_MEMORY[c.id]?.confronted?.length||0;
 const base=previousAnswer(c,raw,attached),after=NPC9_MEMORY[c.id]?.confronted?.length||0;
 if(!q||attached||after>before||sensitive.test(q)||evidenceId.test(q)||official.test(clean(base))||
    /\b(?:co\s+powiedziales\s+wczesniej|co\s+powiedzialas\s+wczesniej|powtorz\w*|przypomnij\w*|czy\s+naprawde\s+powiedz\w*)\b/.test(q))return base;
 // A sourced testimony or formal concession is never rewritten.
 const cur=NPC9_MEMORY[c.id]?.semantic?.at(-1);
 if(cur&&cur.turn===NPC9_MEMORY[c.id].turn&&['CONFESSION','CORRECTION_WITH_EVIDENCE'].includes(cur.status))return base;
 const kind=topic(c,q,st),recent=st.recent.slice(-8);
 const repeating=recent.some(r=>r.q===q||similarity(r.q,q)>0.82&&r.kind===kind);
 let revised=kind?alternative(c,kind,st,raw):'';
 if(kind==='follow'&&!st.focus)revised='';
 // For unclassified questions the original engine is the source of truth.
 // On a repeated well-grounded answer, vary delivery only if a safe topic is known.
 if(!revised&&repeating&&st.focus&&kind!=='private')revised=alternative(c,st.focus,st,raw);
 if(!revised||revised.length>1600||similarity(revised,base)>.97)revised=base;
 if(revised!==base)sync(c,base,revised);
 const chosen=revised;
 const effective=kind&&kind!=='follow'?kind:(st.focus||'');
 if(effective){st.focus=effective;st.hits[effective]=Math.min(100000,(st.hits[effective]||0)+1);}
 st.recent.push({q:limit(q,430),kind:effective||kind||'',a:limit(chosen,1200)});
 if(st.recent.length>LIMIT)st.recent.splice(0,st.recent.length-LIMIT);
 return chosen;
}
registerWitnessAnswerLayer("44-witness-answer-variety",answer);
const ps3_44_witness_answer_variety_npc4Export = function(){
 const data=previousExport();
 for(const c of CONTENT.characters){const st=NPC4_STATE[c.id]?.npc89;
  if(!st||!data[c.id])continue;
  data[c.id].npc89={focus:limit(st.focus,35),hits:Object.fromEntries(Object.entries(st.hits||{}).filter(([k,v])=>k.length<45&&Number.isSafeInteger(v)).slice(0,20)),recent:st.recent.slice(-LIMIT).map(r=>({q:limit(r.q,430),kind:limit(r.kind,35),a:limit(r.a,1200)}))};
 }
 return data;
};
registerWitnessExportLayer("44-witness-answer-variety",ps3_44_witness_answer_variety_npc4Export);
const ps3_44_witness_answer_variety_npc4Restore = function(data){
 previousRestore(data);
 for(const c of CONTENT.characters){const z=data?.[c.id]?.npc89;if(!z||typeof z!=='object')continue;
  const st=state(c);st.focus=typeof z.focus==='string'?limit(z.focus,35):'';
  st.hits={};for(const [k,v]of Object.entries(z.hits&&typeof z.hits==='object'?z.hits:{}).slice(0,20))if(k.length<45&&Number.isSafeInteger(v))st.hits[k]=Math.min(100000,Math.max(0,v));
  st.recent=(Array.isArray(z.recent)?z.recent:[]).filter(r=>r&&typeof r.q==='string'&&typeof r.kind==='string'&&typeof r.a==='string').slice(-LIMIT).map(r=>({q:limit(r.q,430),kind:limit(r.kind,35),a:limit(r.a,1200)}));
 }
};
registerWitnessRestoreLayer("44-witness-answer-variety",ps3_44_witness_answer_variety_npc4Restore);
window.PS89_QA=Object.freeze({version:'4',classify:(id,q)=>{const c=CONTENT.characters.find(x=>x.id===id);return c?topic(c,clean(q),state(c)):null;},state:id=>{const c=CONTENT.characters.find(x=>x.id===id);if(!c)return null;const m=state(c);return {focus:m.focus,recent:m.recent.length,hits:{...m.hits}};}});
})();
