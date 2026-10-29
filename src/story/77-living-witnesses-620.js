/* PAKIET 6.20: sceniczna ciaglosc przesluchan i dyskretne reakcje.
 * Wszystkie sygnaly sa pochodna JUZ ZAPISANEJ rozmowy i odkrytych dokumentow.
 * Brak nowych faktow, ukrytych licznikow zaufania, kar lub odblokowan.
 */
(function(){
'use strict';
if(!window.PS619_NARRATIVE||typeof STATE==='undefined'||typeof CONTENT==='undefined'||typeof WitnessEngine==='undefined')return;
const $=id=>document.getElementById(id);
const prose={
 MAREK:{first:'Marek odpowiada formalnie. Układa zdania tak, jakby nadal tłumaczył decyzję służbową.',source:'Marek przestaje zasłaniać się ogólną procedurą. Uważniej dobiera słowa o własnych decyzjach.',pressure:'Marek usztywnia się, ale nie przerywa wyjaśnień. Domaga się rozdzielenia oskarżenia od ustalonego faktu.',return:'Marek zauważa, że wracasz do tej samej decyzji. Jego odpowiedź pozostaje rzeczowa, choć wyraźnie ostrożniejsza.'},
 TOMASZ:{first:'Tomasz mówi krótko, z przerwami. Gdy nie pamięta szczegółu, wraca do zapisów dyspozytorni.',source:'Tomasz próbuje oddzielić własne polecenia od tego, czego tamtej nocy nie obserwował.',pressure:'Tomasz potrzebuje chwili na uporządkowanie kolejności. Sam nacisk nie przywróci brakującego wspomnienia.',return:'Tomasz rozpoznaje powracające pytanie. Znowu sprawdza, co pamięta, a co zna tylko z rejestru.'},
 JANUSZ:{first:'Janusz odpowiada wprost i bez ozdobników. Łatwiej mówi o wykonanej pracy niż o rubrykach protokołu.',source:'Janusz bierze oddech przed odpowiedzią o dokumentacji. Ustalenie czynności okazuje się ważniejsze od podpisu.',pressure:'Janusz reaguje szorstko na uogólnienie, ale pozostaje przy tym, co mógł sprawdzić w warsztacie.',return:'Janusz wraca do tej samej czynności, tym razem pilnując różnicy między pamięcią a protokołem.'},
 ELZBIETA:{first:'Elżbieta dobiera słowa precyzyjnie. Sprawy dotyczące Leny wyraźnie trudniej jej opisać urzędowym językiem.',source:'Elżbieta zatrzymuje się przy pytaniu o obieg ostrzeżenia. Oddziela intencję zgłoszenia od jego doręczenia.',pressure:'Elżbieta odpowiada ciszej, ale nie pozwala zastąpić ustaleń o procedurze zarzutem o sprawstwo.',return:'Elżbieta zauważa, że pytanie powraca. Ostrożniej rozróżnia to, co powiedziała Lenie, od tego, co zapisano.'},
 KAMIL:{first:'Kamil przechodzi od razu do konkretów technicznych. Pojęcia „karta”, „konto” i „osoba” nie są dla niego zamienne.',source:'Kamil wskazuje granicę pomiaru. Rejestr pozwala odtworzyć zdarzenie systemowe, ale nie zawsze człowieka.',pressure:'Kamil staje się bardziej dosadny. Kwestionowanie technicznego odczytu nie jest jeszcze dowodem celowej manipulacji.',return:'Kamil wraca do rozróżnienia, które już wyjaśniał. Tym razem mocniej zaznacza ograniczenie logów.'},
 MAGDALENA:{first:'Magdalena pilnuje kolejności pytań. Wypowiada się krótko, tak jakby każde zdanie mogło wrócić do protokołu.',source:'Magdalena ostrożnie odnosi się do dokumentów. Sam fakt rozbieżności nie pozwala jej pominąć pytań o odbiór.',pressure:'Magdalena ucina dygresję. Bez weryfikowalnego źródła nie podejmuje gry w domniemane przyznanie się.',return:'Magdalena pamięta wcześniejszą wersję pytania i niechętnie toleruje jego powtórzenie; nadal wymaga konkretnego źródła.'}
};
const nextQuestion={
 MAREK:{requires:['TEC-01','EVID_DISPATCH_REVISION'],text:'Kto podjął decyzję o zmianie dyspozycji TW-217 i na podstawie jakich informacji?'},
 TOMASZ:{requires:['EVID_DISPATCH_REVISION'],text:'Co osobiście pamiętasz z decyzji o zmianie kursu, a co wynika tylko z rejestru?'},
 JANUSZ:{requires:['TEC-03','TEC-04'],text:'Które czynności w warsztacie wykonano, a które jedynie odnotowano w protokole?'},
 ELZBIETA:{requires:['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION'],text:'Co potwierdza projekt zgłoszenia BHP, a czego nie potwierdza brak wysyłki?'},
 KAMIL:{requires:['EVID_RESOURCE_HANDOVER','EVID_T17_DOOR_EVENT'],text:'Co dokładnie oznacza zdarzenie karty T-17 i czego nie mówi o obecności konkretnej osoby?'},
 MAGDALENA:{requires:['TEC-15','EVID_ACCEPTANCE_RECORD'],text:'Jak wyjaśnisz rozbieżność L-2 i L-3 między podzespołem a dokumentem odbioru?'}
};
const focus={
 MAREK:[['TEC-01','TEC-03'],['EVID_DISPATCH_REVISION']],
 TOMASZ:[['EVID_DISPATCH_REVISION'],['DIG-01']],
 JANUSZ:[['TEC-03','TEC-04'],['EVID_WORK_ORDER_RAW']],
 ELZBIETA:[['EVID_BHP_DRAFT','EVID_OUTBOX_MISSING_SUBMISSION'],['DIG-01']],
 KAMIL:[['EVID_RESOURCE_HANDOVER','EVID_T17_DOOR_EVENT'],['TEC-15']],
 MAGDALENA:[['TEC-15','EVID_ACCEPTANCE_RECORD'],['EVID_CONFERENCE_SESSION']]
};
const norm=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/\s+/g,' ').trim();
function subject(q){const s=norm(q);return [
 [/(?:t-17|kart|identyfikator|sesj|dostep|logow)/,'access'],
 [/(?:l-2|l-3|podzespol|protokol|odbior|warsztat|usterk)/,'technical'],
 [/(?:godzin|kiedy|przed|po zmian|noc|dyzur|chronologi)/,'time'],
 [/(?:lena|ostrzez|bhp|wiadom|ostatni)/,'lena'],
 [/(?:alibi|obecno|widziales|widzielas|swia(d|d)ek)/,'presence']
 ].find(([r])=>r.test(s))?.[1]||'';}
function signals(id){
 const raw=STATE.dialogues?.[id]||[];
 const turns=raw.filter(x=>x?.role==='player').slice(-40);
 const questions=turns.map(x=>norm(String(x.text||'').split('\n[Okazano:')[0]));
 const topicCounts=new Map(),last=questions.at(-1)||'';
 for(const q of questions){const t=subject(q);if(t)topicCounts.set(t,(topicCounts.get(t)||0)+1);}
 const direct=questions.filter(q=>/(?:przyznaj sie|przyznajesz sie|sklamal|zabiles|zabilas|zamordowales|zamordowalas|to twoja wina|klamiesz)/.test(q)).length;
 const source=questions.filter(q=>/(?:skad wiesz|co potwierdz|jakie zrod|co sam widz|czy masz dowod|jak sprawdz)/.test(q)).length;
 const repeated=!!subject(last)&&(topicCounts.get(subject(last))||0)>=2;
 const unlocked=(focus[id]||[]).some(req=>req.every(doc=>STATE.found?.has(doc)));
 // Dostęp do dokumentów jest sprawdzany niezależnie od sugestii zawartych w pytaniu.
 const stage=turns.length<2?'first':repeated?'return':direct>source?'pressure':unlocked&&source>0?'source':'first';
 return {stage,questions:turns.length,returns:repeated,sourceQuestions:source,accusations:direct,sourceUnlocked:unlocked};
}
const panel=document.createElement('div');panel.id='ps620WitnessBeat';panel.className='ps620-witness-beat';panel.setAttribute('aria-label','Subtelna reakcja świadka');panel.hidden=true;
const prefix=document.createElement('span');prefix.className='ps620-beat-label';prefix.textContent='Zachowanie rozmówcy';
const content=document.createElement('p');content.id='ps620WitnessText';panel.append(prefix,content);
const ask=document.createElement('button');ask.type='button';ask.className='ps620-next btn alt';ask.textContent='Przygotuj pytanie z odkryć';ask.hidden=true;panel.append(ask);
const anchor=$('interview')?.querySelector('.chathead');anchor?.insertAdjacentElement('afterend',panel);
let lastKey='';
function render(){
 const id=STATE.activeChar;
 if(!anchor||!prose[id]){panel.hidden=true;return;}
 const s=signals(id),message=prose[id][s.stage];
 panel.hidden=false;
 const suggested=nextQuestion[id];
 ask.hidden=!suggested||!suggested.requires.every(doc=>STATE.found?.has(doc));
 if(!ask.hidden)ask.dataset.ps620Witness=id;
 if(lastKey!==id+':'+s.stage+':'+s.questions){
  content.textContent=message;
  panel.dataset.stance=s.stage;
  lastKey=id+':'+s.stage+':'+s.questions;
 }
}
// Rysowanie za pośrednictwem istniejących punktów życia UI; nie przepisujemy logiki rozmowy.
const originalInterrogation=typeof simRenderInterrogation==='function'?simRenderInterrogation:null;
if(originalInterrogation){simRenderInterrogation=function(){const result=originalInterrogation.apply(this,arguments);render();return result;};}
ask.addEventListener('click',()=>{
 const id=STATE.activeChar,suggested=nextQuestion[id],field=$('chatInput');
 if(!suggested||!suggested.requires.every(doc=>STATE.found?.has(doc))||!field||window.PS77_AI?.busy)return;
 if(field.value.trim()){
  if(typeof toast==='function')toast('Najpierw wyślij lub wyczyść przygotowane już pytanie.');
  field.focus();return;
 }
 field.value=suggested.text;
 field.focus({preventScroll:true});
});
registerNavigationHook({name:'narrative620-reaction-preview',after:render});
const originalSend=WitnessEngine.snapshotSend();
registerWitnessSendLayer('narrative620-post-turn',function(){const result=originalSend.apply(this,arguments);render();return result;});
window.PS620_SCENES=Object.freeze({signals,render,profiles:prose});
render();
})();
