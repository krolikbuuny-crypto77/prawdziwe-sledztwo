
(function(){
 'use strict';
 if(typeof STATE==='undefined'||typeof showTab!=='function'||typeof buildSave!=='function'||typeof applySave!=='function')return;
 const overview=document.getElementById('overview');
 const hero=overview?.querySelector('.hero');
 if(!hero)return;
 const info=[
  {tab:'evidence',title:'Przeczytaj akta',desc:'Otwórz jeden z dostępnych dokumentów. Sprawdź, co jest ustalone, a co pozostaje hipotezą.',label:'Otwórz akta'},
  {tab:'inspection12',title:'Sprawdź miejsce',desc:'Wybierz strefę, odszukaj punkt, dobierz metodę i zabezpiecz pierwszy materiał.',label:'Przejdź do oględzin'},
  {tab:'interview',title:'Porozmawiaj ze świadkiem',desc:'Wybierz dowolną osobę i zadaj jej własne pytanie o noc zdarzenia.',label:'Otwórz przesłuchania'}
 ];
 const stateDefault=()=>({dismissed:false,readIds:[]});
 let guide=stateDefault();
 const box=document.createElement('section');box.id='ps2Welcome';box.setAttribute('aria-label','Pierwsze kroki w dochodzeniu');hero.after(box);
 const contexts={};
 for(const id of ['evidence','inspection12','interview']){
  const host=document.getElementById(id),head=host?.querySelector('.sectionheading, .ev-header');
  if(!host||!head)continue;
  const el=document.createElement('div');el.className='ps2-context';el.hidden=true;el.setAttribute('aria-live','polite');head.after(el);contexts[id]=el;
 }
 function anyInterview(){return CONTENT.characters.some(c=>(STATE.dialogues[c.id]||[]).some(m=>m.role==='player'));}
 function securedScene(){return (STATE.scene12?.inspected||[]).some(id=>{const h=SC_BY_SPOT[id];return h?.doc&&STATE.found.has(h.doc);});}
 function completed(){return [guide.readIds.some(id=>STATE.found.has(id)), securedScene(),anyInterview()];}
 function hasLegacyProgress(){
  return STATE.found.size>INITIAL.length+1 || (STATE.scene12?.inspected||[]).length>0 || anyInterview() ||
   Object.values(STATE.timeline11?.entries||{}).some(x=>x?.at) || (STATE.deduction?.cards||[]).length>0 || !!STATE.final13?.submitted;
 }
 function safeText(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
 function status(){const done=completed(),next=done.findIndex(x=>!x);return {done,next,finished:next<0,dismissed:guide.dismissed};}
 function render(){
  const s=status(),show=!s.dismissed&&!s.finished;
  overview.classList.toggle('ps2-active',show);
  document.body.classList.toggle('ps2-welcome-visible',show&&STATE.tab==='overview');
  box.hidden=!show;
  if(show){
   const n=s.done.filter(Boolean).length;
   box.innerHTML=`<div class="ps2-head"><div><div class="ps2-eyebrow">POCZĄTEK ŚLEDZTWA · ${n}/3</div><h2>Trzy pierwsze czynności</h2><p class="ps2-lead">Zanim zaczniesz łączyć zeznania i dowody, poznaj podstawowe narzędzia. Możesz wykonywać je w dowolnej kolejności lub pominąć wprowadzenie. Nie zmienia ono zasad ani trudności sprawy.</p></div></div><div class="ps2-steps">${info.map((x,i)=>`<div class="ps2-step ${s.done[i]?'is-done':s.next===i?'is-next':''}"><span>${s.done[i]?'✓ WYKONANO':s.next===i?'TERAZ · '+(i+1)+'/3':'KROK '+(i+1)+'/3'}</span><b>${safeText(x.title)}</b><p>${safeText(x.desc)}</p>${s.done[i]?'':`<button class="btn ${i===s.next?'':'alt'}" type="button" data-ps2-go="${x.tab}">${safeText(x.label)}</button>`}</div>`).join('')}</div><div class="ps2-controls"><span>Nie musisz zebrać wszystkich dowodów, by zakończyć śledztwo.</span><button type="button" class="btn subtle" data-ps2-skip="1">Pomiń wprowadzenie — pełny pulpit</button></div>`;
  }
  for(const [id,el] of Object.entries(contexts)){
   el.hidden=!show;
   if(!show)continue;
   const index=info.findIndex(x=>x.tab===id),completedHere=s.done[index];
   let line= id==='evidence'?'Wybierz dowolny dokument ze spisu. Samo wejście do akt nie oznacza przeczytania dokumentu.':id==='inspection12'?'Wybierz strefę i odszukaj punkt, a po poprawnym badaniu użyj „Zabezpiecz do akt”.':'Zadaj samodzielnie jedno pytanie wybranej osobie. Nie ma narzuconego pytania ani świadka.';
   let next=s.done[index]?s.next:index;
   el.innerHTML=`<div class="ps2-context-copy"><b>${completedHere?'✓ Pierwszy krok w tej sekcji wykonany':'Pierwsze kroki · '+info[index].title}</b><p>${completedHere?'Możesz kontynuować tę czynność albo przejść do innej.':line}</p></div><button type="button" class="btn alt" data-ps2-go="${next>=0?info[next].tab:id}">${completedHere?'Następny krok':'Wróć do planu'}</button>`;
   if(!completedHere)el.querySelector('[data-ps2-go]').dataset.ps2Go='overview';
  }
  return s;
 }
 function route(tab){
  if(!['overview','evidence','inspection12','interview'].includes(tab))return;
  showTab(tab);
  if(tab==='inspection12'&&STATE.scene12?.room!=='bay')scPickRoom('bay');
  if(tab==='overview')requestAnimationFrame(()=>box?.scrollIntoView({block:'start',behavior:'smooth'}));
  if(tab==='evidence')requestAnimationFrame(()=>document.getElementById('docList')?.scrollIntoView({block:'nearest',behavior:'smooth'}));
  if(tab==='interview'&&window.innerWidth>850)document.getElementById('chatInput')?.focus({preventScroll:true});
 }
 function captureRead(id){
  if(!id||!STATE.found.has(id)||!byId[id]||guide.readIds.includes(id))return;
  guide.readIds=[...guide.readIds,id].slice(-12);
  render();
 }
 box.addEventListener('click',e=>{
  const go=e.target.closest('[data-ps2-go]');if(go){route(go.dataset.ps2Go);return;}
  if(e.target.closest('[data-ps2-skip]')){guide.dismissed=true;render();}
 });
 for(const el of Object.values(contexts))el.addEventListener('click',e=>{const go=e.target.closest('[data-ps2-go]');if(go)route(go.dataset.ps2Go);});
 document.getElementById('docList')?.addEventListener('click',e=>{const b=e.target.closest('[data-doc]');if(b)captureRead(b.dataset.doc);});
 document.getElementById('docPaper')?.addEventListener('click',e=>{
  const b=e.target.closest('[data-ev-dir]');if(!b)return;
  const ds=evFilteredDocs(),idx=ds.findIndex(d=>d.id===activeDoc),next=ds[idx+Number(b.dataset.evDir)];
  if(next)captureRead(next.id);
 });
 document.getElementById('chatSend')?.addEventListener('click',()=>queueRender());
 document.getElementById('chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey)queueRender();});
 document.getElementById('inspection12')?.addEventListener('click',queueRender);
 document.getElementById('inspection12')?.addEventListener('change',queueRender);
 function queueRender(){requestAnimationFrame(render);}
 registerNavigationHook({name:'first-steps-introduction',after:queueRender});
 
 /* SaveManager: buildSave hook. */
registerSaveHook({name:"46-first-steps-introduction-save1", build(__save){const d=__save;d.intro2={dismissed:!!guide.dismissed,readIds:guide.readIds.filter(id=>STATE.found.has(id)).slice(-12)};return d;}});
 
 /* SaveManager: applySave hook. */
registerSaveHook({name:"46-first-steps-introduction-load1", apply(d){const ret=undefined;
  if(d?.intro2&&typeof d.intro2==='object'){
   guide={dismissed:!!d.intro2.dismissed,readIds:[...new Set(Array.isArray(d.intro2.readIds)?d.intro2.readIds:[])].filter(id=>typeof id==='string'&&byId[id]&&STATE.found.has(id)).slice(-12)};
  }else guide={dismissed:hasLegacyProgress(),readIds:[]};
  queueRender();return ret;
 }});
 const formerClear=psClearSave;
 psClearSave=function(){const ret=formerClear.apply(this,arguments);guide=stateDefault();queueRender();return ret;};
 window.PS_INTRO2={status,render,route,skip:()=>{guide.dismissed=true;render();},version:'2.0'};
 render();
})();
