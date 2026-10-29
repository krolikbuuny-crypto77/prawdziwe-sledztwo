
/* Bieg sprawy 7.0. Fabuła jest wnioskiem z już zapisanych działań.
   Bez zegarów, bramek, fikcyjnych dowodów, kar i ingerencji w werdykt. */
(function(){
'use strict';
if(typeof STATE==='undefined'||!window.PS69_STORY||typeof ps53Entry!=='function')return;
const by=id=>document.getElementById(id);
const beats=[
 {id:'work',lead:'Zbieżność decyzji i dokumentacji warsztatu zmienia sposób patrzenia na nocną zmianę. Nadal nie ustala, kto skrzywdził Lenę.'},
 {id:'warning',lead:'Obieg ostrzeżeń i procedura odbioru nie składają się w jedną wersję zdarzeń. Trzeba odróżnić zaniedbanie od przemocy.'},
 {id:'access',lead:'Karta dostępu i sesja zdalna tworzą dwa ślady, które nie mogą same zastąpić identyfikacji człowieka.'},
 {id:'lastcontact',lead:'Zmiana kursu poprzedza późniejszy kontakt z Leną. Złączenie tych zdarzeń w jedną historię wymaga niezależnych potwierdzeń.'},
 {id:'mechanism',lead:'Zestawienie ostatniego kontaktu i charakteru obrażeń przybliża rekonstrukcję, ale nadal wymaga sprawdzenia osoby i przebiegu zdarzenia.'}
];
const beatBy=new Map(beats.map(x=>[x.id,x]));
const originalNames=Object.fromEntries((window.PS69_STORY.chapters||[]).map(x=>[x.id,x.title]));
function validBeats(){return window.PS69_STORY.available().filter(id=>beatBy.has(id));}
function fresh(){return {discovered:[],revision:1};}
function store(){if(!STATE.sim.story70)STATE.sim.story70=fresh();return STATE.sim.story70;}
const h=document.createElement('section');h.id='ps70Pulse';h.setAttribute('aria-label','Bieg sprawy');h.innerHTML='<div class="ps70-head"><div class="eyebrow">BIEG SPRAWY</div><small id="ps70StageText"></small></div><h3 id="ps70StageTitle"></h3><p id="ps70StageProse"></p><p class="ps70-latest" id="ps70Latest" hidden></p><div class="ps70-trail" aria-hidden="true"><i></i><i></i><i></i><i></i><span id="ps70StageLabel"></span></div>';
const dashboard=by('overview')?.querySelector('.ui14-dashboard');
if(dashboard)dashboard.insertAdjacentElement('afterend',h);else by('overview')?.append(h);
const finale=document.createElement('section');finale.id='ps70Afterword';finale.hidden=true;finale.setAttribute('aria-label','Po zakończeniu sprawy');
finale.innerHTML='<div class="eyebrow">EPILOG</div><h3 id="ps70AfterTitle"></h3><p id="ps70AfterText"></p><p class="ps70-afternote" id="ps70AfterNote"></p>';
by('final')?.append(finale);
function stats(){
 const careful=(typeof PS53_ARCS!=='undefined'?PS53_ARCS:[]).filter(a=>{
  const x=ps53Entry(a.id);return x.choice==='careful'&&typeof ps53PathReady==='function'&&ps53PathReady(a,x.path);
 }).length;
 const available=validBeats(),filed=!!STATE.final13?.submitted,verdict=STATE.sim.trial||null;
 return {careful,available,filed,verdict};
}
function phase(s){
 if(s.verdict)return 4;
 if(s.filed)return 3;
 if(s.available.length>=2||s.careful>=4)return 2;
 if(s.careful>=1||s.available.length)return 1;
 return 0;
}
const phases=[
 ['Początek dochodzenia','Z pozoru odrębne informacje o nocnej zmianie i tragedii Leny nie tworzą jeszcze jednej wersji wydarzeń. Każdy ślad wymaga własnego źródła.'],
 ['Pierwsze pęknięcia','Poszczególne zapisy zaczynają się różnić. Wyjaśnienie jednego uchybienia nie oznacza jeszcze wyjaśnienia śmierci Leny.'],
 ['Powiązania, które zmieniają sens','Niezależnie ustalone okoliczności zaczynają się łączyć. Im bardziej spójna staje się rekonstrukcja, tym ważniejsze są dowody, które nie pasują do przyjętej hipotezy.'],
 ['Waga oskarżenia','Śledztwo wkracza w etap odpowiedzialności za sformułowane zarzuty. Dowody muszą wytrzymać kontrolę obrony, nie tylko opowiadać przekonującą historię.'],
 ['Po rozstrzygnięciu','Zapadła decyzja, ale znaczenie każdego dokumentu pozostaje ograniczone jego pochodzeniem i zakresem. Finał nie unieważnia przemilczanych lub nierozpoznanych kwestii.']
];
const epilogues={
 solid:['Cena prawidłowo złożonych akt','Przedstawione dowody przetrwały weryfikację, a zastrzeżenia obrony zostały rozpatrzone. W zajezdni pozostaną jednak decyzje, których nie usprawiedliwi nawet procesowo mocny finał.'],
 weak:['Historia niedokończona','Zebrane materiały wyjaśniają część nocy, lecz nie uzasadniają całego oskarżenia. Niepewność jest tutaj uczciwsza niż pozorna pewność.'],
 acquittal:['Granice podejrzenia','Sprzeczności i brak pewnej identyfikacji przeważyły nad przekonującymi poszlakami. To, że ktoś miał powód do milczenia, nie wystarczy, by przypisać mu śmierć Leny.'],
 returned:['Sprawa pozostaje otwarta','Akta wracają do uzupełnienia. To trudniejsza droga niż szybka decyzja, ale pozwala jeszcze sprawdzić to, czego dotąd nie potwierdzono.'],
 excluded:['Koszt proceduralnych skrótów','Uchybienia w traktowaniu materiałów podważyły wynik postępowania. Nawet trafna intuicja nie zastąpi prawidłowo zebranych i ujawnionych dowodów.'],
 miscarriage:['Cena błędnego oskarżenia','Nieujawnione sprzeczności i pominięte źródła doprowadziły do krzywdzącego rozstrzygnięcia. Historia Leny pozostała niewyjaśniona, a postępowanie stworzyło kolejną niesprawiedliwość.']
};
function appendDiscovery(){
 const state=store(),verified=new Set(validBeats());
 state.discovered=Array.isArray(state.discovered)?state.discovered.filter(id=>verified.has(id)):[];
 for(const id of validBeats())if(!state.discovered.includes(id))state.discovered.push(id);
 return state.discovered;
}
function render(){
 const s=stats(),n=phase(s),ordered=appendDiscovery(),last=ordered.at(-1),beat=beatBy.get(last);
 if(!h.isConnected)return;
 by('ps70StageTitle').textContent=phases[n][0];
 by('ps70StageProse').textContent=phases[n][1];
 by('ps70StageText').textContent=s.verdict?'Sprawa rozpatrzona':s.filed?'Akt przekazany do oceny':s.available.length?'Zweryfikowane powiązania: '+s.available.length:'Ustalenia w toku';
 by('ps70StageLabel').textContent=['Ślady','Sprzeczności','Powiązania','Oskarżenie','Finał'][n];
 h.querySelectorAll('.ps70-trail i').forEach((el,i)=>el.classList.toggle('passed',i<n));
 const focus=by('ps70Latest');
 focus.hidden=!beat;
 if(beat)focus.textContent='Z ustaleń: '+(originalNames[last]||'Nowe powiązanie')+'. '+beat.lead;
 const trial=s.verdict;finale.hidden=!trial;
 if(trial){const ep=epilogues[trial.kind]||['Akta po decyzji','Wynik dochodzenia pokazuje granice dostępnych ustaleń i konsekwencje wybranego sposobu prowadzenia sprawy.'];
  by('ps70AfterTitle').textContent=ep[0];by('ps70AfterText').textContent=ep[1];
  const specials=[];
  if(s.available.includes('warning'))specials.push('Rozbieżności zgłoszeń i odbiorów pozostają osobnym problemem bezpieczeństwa.');
  if(s.available.includes('access'))specials.push('Ślad cyfrowy i fizyczna obecność nie stały się tym samym dowodem.');
  if(s.available.includes('mechanism'))specials.push('Analiza obrażeń wymagała oddzielenia mechanizmu od identyfikacji osoby.');
  by('ps70AfterNote').textContent=specials[0]||'W aktach pozostaje zapis kolejnych decyzji śledczego — także tych, które nie doprowadziły do rozstrzygnięcia.';
 }
}
// Update after meaningful actions only, rather than polling or timed cutscenes.
let restoring=false;
const oldStory=ps53Render;
ps53Render=function(){const out=oldStory.apply(this,arguments);if(!restoring)render();return out;};
const oldHearing=simRenderHearing;
simRenderHearing=function(){const out=oldHearing.apply(this,arguments);if(!restoring)render();return out;};
registerNavigationHook({name:'investigation-pacing',after:()=>{if(!restoring)render();}});

/* SaveManager: buildSave hook. */
registerSaveHook({name:"30-investigation-pacing-save1", build(__save){const data=__save;if(data.investigationSim){const s=store();data.investigationSim.story70={discovered:s.discovered.slice(-5),revision:1};}return data;}});

/* SaveManager: applySave hook. */
registerSaveHook({name:"30-investigation-pacing-load1", beforeApply(){restoring=true;},onApplyError(){restoring=false;},apply(d){restoring=false;
 const available=new Set(validBeats()),raw=d?.investigationSim?.story70;
 const older=(Array.isArray(raw?.discovered)?raw.discovered:[]).filter(x=>typeof x==='string'&&available.has(x));
 STATE.sim.story70={discovered:[...new Set([...older,...validBeats()])],revision:1};
 render();
}});
const oldReset=simReset;
simReset=function(){const out=oldReset.apply(this,arguments);STATE.sim.story70=fresh();render();return out;};
// Loading a past save can unlock several beats; no artificial fanfare is played.
STATE.sim.story70=fresh();render();
window.PS70_ARC={snapshot:()=>{const s=stats();return {phase:phase(s),careful:s.careful,breakthroughs:s.available.slice(),verdict:s.verdict?.kind||null};},render};
})();
