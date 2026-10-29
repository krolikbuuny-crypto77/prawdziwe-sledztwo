/* Pakiet 6.14: kontrolowana realizacja wypowiedzi (bez nowych faktów).
 * Znaczenie pytania, bramki fabularne i dozwolone fakty rozstrzygają warstwy 1–73.
 * Ta końcowa warstwa zmienia wyłącznie zatwierdzone, semantycznie równoważne
 * sformułowania niewiedzy lub sposób podania POWTARZAJĄCEJ SIĘ treści.
 * Nie dotyka odpowiedzi powiązanych ze źródłami, konfrontacji i odmów.
 */
(function(){
'use strict';
if(typeof WitnessEngine==='undefined'||typeof NPC9_MEMORY==='undefined')return;
const beforeAnswer=WitnessEngine.snapshotAnswer();
const beforeExport=WitnessEngine.snapshotExport();
const beforeRestore=WitnessEngine.snapshotRestore();
const LIMIT=48;
const normText=s=>String(s||'').trim().replace(/\s+/g,' ');
const lower=s=>normText(s).toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return(n>>>0).toString(36);};
const array=x=>Array.isArray(x)?x:[];
// Każdy wariant zachowuje tę samą treść logiczną, nie dodaje osób, godzin ani zdarzeń.
// Podstawą dopasowania jest CAŁA gotowa wypowiedź, a nie pojedyncze słowa pytania.
const EQUIVALENTS=new Map([
 ['Nie umiem wskazać konkretnej przyczyny na podstawie tego, co pamiętam. Nie chcę jej wymyślać.',[
   'Nie pamiętam wystarczająco dużo, by wskazać konkretną przyczynę. Nie będę jej zgadywać.',
   'Nie mam podstaw, żeby nazwać konkretny powód. Nie chcę dopowiadać czegoś, czego nie pamiętam.',
   'Z mojej pamięci nie wynika pewna przyczyna. Nie znam tego powodu.',
   'Nie potrafię rzetelnie wyjaśnić przyczyny na podstawie własnej pamięci. To byłoby zgadywanie.'
 ]],
 ['Nie potrafię wskazać z pewnością, kto był odbiorcą tego zgłoszenia. Trzeba ustalić, czy istnieje potwierdzenie jego odbioru.',[
   'Nie wiem na pewno, do kogo dotarło to zgłoszenie. Należy sprawdzić, czy ktoś potwierdził jego odbiór.',
   'Nie wskażę odbiorcy bez pewności. Najpierw trzeba zweryfikować potwierdzenie odbioru zgłoszenia.',
   'Nie potrafię potwierdzić adresata zgłoszenia. Odpowiedzi należałoby szukać w potwierdzeniu odbioru, jeśli takie jest.',
   'Nie mam pewnej informacji o tym, kto odebrał zgłoszenie. Sprawdźmy, czy został ślad potwierdzenia odbioru.'
 ]],
 ['Nie potrafię podać dokładnego czasu tego zdarzenia bez ustalenia, o którą sytuację pytasz.',[
   'Najpierw ustalmy, które zdarzenie masz na myśli. Bez tego nie podam rzetelnej godziny.',
   'Nie wiem, o którą sytuację chodzi, więc dokładnej godziny nie wskażę.',
   'Doprecyzuj zdarzenie. Nie chcę podawać dokładnego czasu na chybił trafił.',
   'O jaką sytuację pytasz? Bez tego nie potrafię podać jej dokładnego czasu.'
 ]],
 ['Nie potrafię wskazać konkretnego źródła tej informacji bez doprecyzowania, o które zdarzenie pytasz.',[
   'O którą sytuację chodzi? Bez tego nie ustalę, skąd pochodzi dana informacja.',
   'Nie nazwę źródła informacji, dopóki nie wiem, o jakie zdarzenie pytasz.',
   'Żeby wskazać źródło, muszę wiedzieć, do którego zdarzenia się odnosisz.',
   'Doprecyzuj zdarzenie, a wtedy będzie można ustalić źródło tej informacji.'
 ]],
 ['Nie mam tego ustalonego. Trzeba wrócić do zapisu albo oględzin.',[
   'Nie mam pewnego ustalenia w tej sprawie. Odpowiedź trzeba sprawdzić w zapisach albo podczas oględzin.',
   'Nie mam jeszcze takiego ustalenia. Trzeba porównać zapisy lub wyniki oględzin.',
   'Nie chcę stawiać tu pewnej tezy. Najpierw trzeba porównać zapisy albo wyniki oględzin.'
 ]],
 ['Nie dysponuję ustaleniem, które pozwalałoby mi rzetelnie odpowiedzieć.',[
   'Nie mam wystarczających ustaleń, by udzielić pewnej odpowiedzi.',
   'Na podstawie tego, czym dysponuję, nie potrafię odpowiedzieć rzetelnie.',
   'Brakuje mi potwierdzonych ustaleń potrzebnych do odpowiedzi.'
 ]],
 ['Nie mogę tego potwierdzić na podstawie własnej wiedzy.',[
   'Nie mam osobistej wiedzy, która pozwala mi to potwierdzić.',
   'Nie mogę osobiście poświadczyć tej informacji.',
   'Z własnej wiedzy nie jestem w stanie tego poświadczyć.'
 ]],
 ['O którą osobę i jaki moment chodzi? Nie chcę przypisywać komuś działań bez pewności, o kogo pytasz.',[
   'Doprecyzuj osobę i moment. Inaczej mógłbym przypisać działanie niewłaściwej osobie.',
   'Kogo masz na myśli i kiedy? Bez tego nie chcę mówić o cudzych działaniach.',
   'Najpierw ustalmy, o kim i o jakiej chwili rozmawiamy. Nie będę nikomu przypisywać zachowań na podstawie domysłu.'
 ]],
 ['O kogo dokładnie pytasz i o który moment? Nie chcę przypisać niewłaściwej osobie cudzego alibi.',[
   'Kogo masz na myśli i w jakiej chwili? Nie chcę pomylić cudzych alibi.',
   'Musisz doprecyzować osobę oraz moment. W przeciwnym razie mógłbym pomylić alibi.',
   'Najpierw wskaż osobę i czas. Nie przypiszę nie temu człowiekowi cudzego alibi.'
 ]],
 ['Nie widziałem tego. Nie będę zgadywał.',[
   'Nie byłem tego świadkiem, więc nie chcę niczego zgadywać.',
   'Tego nie widziałem. Nie mogę przedstawić domysłu jako obserwacji.',
   'Nie mogę mówić, że coś zobaczyłem, skoro tego nie obserwowałem.'
 ]],
 ['Nie mam pewności. Sprawdźmy surowe dane, zanim coś stwierdzę.',[
   'Nie jestem tego pewien. Bez surowych danych nie chcę wyciągać wniosku.',
   'Nie przesądzam sprawy. Najpierw trzeba zweryfikować surowe dane.',
   'Potrzebuję surowych danych, żeby odpowiedzieć z pewnością. Nie będę zgadywał.'
 ]]
]);
const CHRONOLOGY='Nie potrafię z pewnością odtworzyć pełnej kolejności tych zdarzeń.';
const CHRONOLOGY_ALT=[
 'Nie mam pewnej pamięci całego przebiegu tych zdarzeń.',
 'Nie jestem w stanie wiarygodnie podać pełnej chronologii.',
 'Nie odtworzę z pamięci wszystkich zdarzeń we właściwej kolejności.',
 'Nie mogę zagwarantować dokładnej kolejności wszystkich wydarzeń.'
];
const FORBIDDEN_STATUS=new Set(['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL']);
const forbidden=/\b(?:okaz[aął]?\w* dowod\w*|skladam formalne zeznanie|przyznaje sie|podtrzymuje odmowe|odmawiam|konfrontacja dowodow|pelnomocnik)\b/i;
function state(id){
 const root=NPC4_STATE[id];
 if(!root.npc614||typeof root.npc614!=='object')root.npc614={hits:{},order:[],recent:[]};
 return root.npc614;
}
function optionsFor(raw){
 const source=normText(raw);
 const explicit=EQUIVALENTS.get(source);
 if(explicit)return [source,...explicit];
 if(source.startsWith(CHRONOLOGY+' '))return [source,...CHRONOLOGY_ALT.map(s=>s+source.slice(CHRONOLOGY.length))];
 return null;
}
// Named statements are already checked by all preceding interrogation layers.
// We rewrite them only if the current turn is not tied to evidence or a formal response.
function canRealize(c,question,attached,raw,oldConfronted){
 if(!c||!NPC4_STATE[c.id]||!NPC9_MEMORY[c.id]||attached||!raw||forbidden.test(raw))return false;
 const memory=NPC9_MEMORY[c.id];
 if((memory.confronted?.length||0)!==oldConfronted||simWitness(c).blocked)return false;
 const last=memory.semantic?.at(-1),statement=memory.statements?.at(-1);
 return !!(last&&statement&&last.turn===memory.turn&&statement.turn===memory.turn&&
     last.answer===raw&&statement.text===raw&&!array(last.source_ids).length&&
     !array(statement.source_ids).length&&!FORBIDDEN_STATUS.has(last.status));
}
function synchronize(c,old,text){
 const m=NPC9_MEMORY[c.id],s=NPC4_STATE[c.id];
 const sem=m.semantic.at(-1),statement=m.statements.at(-1);
 sem.answer=text;statement.text=text;
 const replace=(r,key,n)=>{if(r&&r[key]===old.slice(0,n))r[key]=text.slice(0,n);};
 replace(s.recent?.at(-1),'answer',1550);
 replace(s.npc5?.recent?.at(-1),'answer',1400);
 replace(s.npc5?.anchor,'answer',1400);
 replace(s.npc57?.episodes?.at(-1),'answer',1600);
 replace(s.npc65?.recent?.at(-1),'answer',1300);
 replace(s.npc65,'lastAnswer',1300);
 replace(s.npc68?.threads?.at(-1),'a',850);
 replace(s.npc89?.recent?.at(-1),'a',1200);
 replace(s.npc62,'a',1600);
}
function answer(c,question,attached){
 const oldConfronted=NPC9_MEMORY?.[c?.id]?.confronted?.length||0;
 const original=beforeAnswer(c,question,attached);
 if(!canRealize(c,question,attached,original,oldConfronted))return original;
 const candidates=optionsFor(original);
 if(!candidates||candidates.length<2)return original;
 const st=state(c.id),key=hash(normText(original));
 const used=Number.isSafeInteger(st.hits[key])?st.hits[key]:0;
 const recent=st.recent.slice(-2);
 const origin=(hash(c.id+'|'+lower(question)).split('').reduce((s,x)=>s+x.charCodeAt(0),0))%candidates.length;
 let pick=used===0?origin:(origin+used)%candidates.length;
 // Avoid returning the same wording in consecutive turns of the same theme.
 for(let n=0;n<candidates.length;n++){
  const next=(pick+n)%candidates.length;
  if(!recent.includes(hash(candidates[next]))){pick=next;break;}
 }
 const selected=candidates[pick];
 st.hits[key]=Math.min(100000,used+1);
 if(!st.order.includes(key))st.order.push(key);
 if(st.order.length>LIMIT){const remove=st.order.shift();delete st.hits[remove];}
 st.recent.push(hash(selected));if(st.recent.length>8)st.recent.shift();
 if(selected!==original)synchronize(c,original,selected);
 return selected;
}
registerWitnessAnswerLayer('74-grounded-response-variety',answer);
registerWitnessExportLayer('74-grounded-response-variety',function(){
 const out=beforeExport();
 for(const c of CONTENT.characters){if(!out[c.id])continue;
  const x=state(c.id);
  out[c.id].npc614={hits:Object.fromEntries(x.order.slice(-LIMIT).filter(k=>/^[a-z\d]{1,12}$/i.test(k)).map(k=>[k,Math.min(100000,Math.max(0,x.hits[k]||0))])),
   order:x.order.slice(-LIMIT),recent:x.recent.slice(-8)};
 }
 return out;
});
registerWitnessRestoreLayer('74-grounded-response-variety',function(data){
 beforeRestore(data);
 for(const c of CONTENT.characters){const x=state(c.id),saved=data?.[c.id]?.npc614;
  x.hits={};x.order=[];x.recent=[];
  if(!saved||typeof saved!=='object')continue;
  x.order=array(saved.order).filter(k=>typeof k==='string'&&/^[a-z\d]{1,12}$/i.test(k)).slice(-LIMIT);
  for(const k of x.order){const count=saved.hits?.[k];x.hits[k]=Number.isSafeInteger(count)?Math.max(0,Math.min(count,100000)):0;}
  x.recent=array(saved.recent).filter(k=>typeof k==='string'&&/^[a-z\d]{1,12}$/i.test(k)).slice(-8);
 }
});
window.PS614_VARIETY=Object.freeze({version:'6.14',eligible:raw=>!!optionsFor(raw),catalogueSize:EQUIVALENTS.size,
 stats:id=>{const x=state(id);return {phrases:x.order.length,turns:Object.values(x.hits).reduce((a,b)=>a+b,0),recent:x.recent.length};}});
})();
