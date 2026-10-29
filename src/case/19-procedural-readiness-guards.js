
/* Wersja 6.0.1 — poprawka krytyczna P0: trzy samodzielne filary dochodzenia
 * muszą być faktycznie zweryfikowane przed przyznaniem pełnego sukcesu.
 * Niedokończone filary nie blokują słabszych zakończeń.
 * Nie przyznaje dowodów, nie edytuje danych źródłowych ani nie zdradza rozwiązania. */
(function(){
 'use strict';
 if(typeof fcChecks!=='function'||typeof ps54Review!=='function'||typeof simRenderHearing!=='function')return;
 const areas=[
  {key:0,tab:'timeline',label:'Chronologia zdarzeń'},
  {key:1,tab:'deduction',label:'Własna argumentacja'},
  {key:2,tab:'inspection12',label:'Oględziny miejsca'}
 ];
 function review(){
  const checks=fcChecks();
  const entries=areas.map(a=>({...a,ok:!!checks[a.key]?.ok,description:String(checks[a.key]?.help||'Zweryfikuj ustalenia w odpowiednim module.')}));
  return {entries,passed:entries.filter(e=>e.ok).length,complete:entries.every(e=>e.ok)};
 }
 const oldReview=ps54Review;
 ps54Review=function(){
  const base=oldReview.apply(this,arguments),p0=review();
  if(!p0.complete){
   base.assessment.weakReasons=[...base.assessment.weakReasons,...p0.entries.filter(e=>!e.ok).map(e=>'Niedokończony filar śledztwa: '+e.label+'.')];
  }
  return {...base,ready:base.ready&&p0.complete,investigationP0:p0};
 };
 // Starszy panel aktu miał niezależny komunikat "Akt obroniony".
 // Obydwa panele muszą respektować ten sam warunek sukcesu.
 const oldCompletion=fcCompletion;
 fcCompletion=function(){return oldCompletion.apply(this,arguments)&&review().complete;};
 const audit=document.getElementById('ps60CaseAudit');
 const hearing=document.getElementById('simHearing');
 const panel=document.createElement('section');
 panel.id='ps601Fundamenty';
 panel.className='ps601-panel';
 panel.setAttribute('aria-label','Warunki pełnego sukcesu śledztwa');
 panel.innerHTML='<div class="eyebrow">WARUNKI PEŁNEGO SUKCESU</div><h3>Trzy filary dochodzenia</h3><p class="ps601-note">Wysoki wynik z samych akt i obrony nie zastępuje sprawdzenia miejsca zdarzenia, chronologii ani własnej dedukcji. Każdy z tych etapów trzeba wykonać w grze. Sprawę można jednak skierować do oceny również z brakami — finał uwzględni ich konsekwencje.</p><div id="ps601Status" class="ps601-summary" role="status" aria-live="polite"></div><div id="ps601Rows" class="ps601-rows"></div>';
 if(audit)audit.after(panel);else if(hearing)hearing.before(panel);
 const css=document.createElement('style');
 css.textContent=`
 .ps601-panel{border:1px solid #57636b;border-radius:9px;background:#14212a;padding:17px;margin:15px 0;min-width:0}
 .ps601-panel h3{font-size:20px;margin:6px 0 10px}.ps601-note{font-size:12px;line-height:1.65;color:var(--muted)}
 .ps601-summary{font-size:13px;margin:13px 0;padding:11px 12px;background:#111a21;border:1px solid #3e515c;border-radius:7px}
 .ps601-rows{display:grid;gap:8px}.ps601-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px;border:1px solid #364751;border-radius:7px;background:#17252d}
 .ps601-row strong{font-size:13px}.ps601-row p{font-size:11px;line-height:1.5;color:var(--muted);margin-top:4px}
 .ps601-row.verified{border-color:#42634f}.ps601-row .ps601-symbol{color:#e7b982;margin-right:7px}.ps601-row.verified .ps601-symbol{color:#8ac6a2}
 .ps601-row button{border:1px solid #657782;background:#283941;color:#f0d5a6;border-radius:6px;padding:8px 11px;min-height:39px;cursor:pointer}
 @media(max-width:520px){.ps601-panel{padding:12px}.ps601-row{grid-template-columns:minmax(0,1fr)}.ps601-row button{justify-self:start}}
 `;
 document.head.append(css);
 function render(){
  const p0=review(),status=document.getElementById('ps601Status'),rows=document.getElementById('ps601Rows');
  if(!status||!rows)return p0;
  status.textContent=p0.complete?'3/3 filary potwierdzone — brak ograniczenia P0 dla pełnego sukcesu.':'Zweryfikowano '+p0.passed+'/3 filary. Pełny sukces nie zostanie przyznany, dopóki nie uzupełnisz braków.';
  rows.replaceChildren();
  for(const r of p0.entries){
   const card=document.createElement('div');card.className='ps601-row'+(r.ok?' verified':'');
   const content=document.createElement('div');const title=document.createElement('strong');
   const symbol=document.createElement('span');symbol.className='ps601-symbol';symbol.textContent=r.ok?'✓':'○';
   title.append(symbol,document.createTextNode(r.label));
   const hint=document.createElement('p');hint.textContent=r.ok?'Etap sprawdzony na podstawie zapisanych ustaleń.':r.description;
   content.append(title,hint);
   const button=document.createElement('button');button.type='button';button.textContent='Przejdź';button.dataset.ps601Tab=r.tab;
   card.append(content,button);rows.append(card);
  }
  return p0;
 }
 panel.addEventListener('click',e=>{const btn=e.target.closest('button[data-ps601-tab]');if(!btn)return;showTab(btn.dataset.ps601Tab);});
 function invalidateIfNecessary(){
  if(STATE.sim?.trial?.kind==='solid'&&!STATE.sim.trial?.qualification&&!review().complete)STATE.sim.trial=null;
 }
 const oldRender=simRenderHearing;
 simRenderHearing=function(){invalidateIfNecessary();const result=oldRender.apply(this,arguments);render();return result;};
 registerNavigationHook({name:'procedural-readiness-guards',before:invalidateIfNecessary,after:({id})=>{if(id==='final'){invalidateIfNecessary();render();}}});
 
 /* SaveManager: applySave hook. */
registerSaveHook({name:"19-procedural-readiness-guards-load1", apply(data){const result=undefined;invalidateIfNecessary();render();return result;}});
 window.PS601_P0={review,render};
 render();
})();

