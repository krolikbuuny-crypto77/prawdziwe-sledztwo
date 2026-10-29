
(function(){
 'use strict';
 const root=document.getElementById('final');
 if(!root||typeof fcChecks!=='function'||typeof showTab!=='function'||typeof STATE==='undefined')return;
 const gate=document.createElement('section');gate.id='psF1Gate';gate.setAttribute('aria-label','Etapy dostępności finału');
 const heading=root.querySelector('.sectionheading');heading.after(gate);
 const sections=[
  {name:'Przygotowanie',phase:0},{name:'Akt oskarżenia',phase:1},
  {name:'Konfrontacja',phase:2},{name:'Rozstrzygnięcie',phase:3}
 ];
 const tabs=['timeline','deduction','inspection12'];
 const descriptions=[
  'Ustal kolejność ważnych wydarzeń i sprawdź, które źródła potwierdzają ich czas.',
  'Zapisz własny wniosek, przypisz niezależne źródła i rozważ inne wyjaśnienie.',
  'Zbadaj miejsce znalezienia Leny i udokumentuj obserwacje.'
 ];
 const managed=[
  {node:root.querySelector('#fcProgress'),min:1},
  {node:root.querySelector('.fc-intro'),min:1},
  {node:root.querySelector('.fc-grid'),min:1},
  {node:root.querySelector('#fcDefense'),min:2},
  {node:root.querySelector('#fcVerdictPanel'),min:3},
  {node:root.querySelector('#simHearing'),min:2},
  {node:root.querySelector('#ps60CaseAudit'),min:2},
  {node:root.querySelector('#ps601Fundamenty'),min:2},
  {node:root.querySelector('#ps66Explain_final'),min:1},
  {node:root.querySelector('#ps70Afterword'),min:3},
  {node:root.querySelector('.notice'),min:1}
 ];
 function status(){
  const checks=fcChecks().map((c,i)=>({ok:!!c.ok,label:c.label,tab:tabs[i],desc:descriptions[i]}));
  const ready=checks.every(x=>x.ok),filed=!!STATE.final13?.submitted,trial=!!STATE.sim?.trial;
  const phase=filed?(trial?3:2):(ready?1:0);
  return {phase,ready,filed,trial,checks,done:checks.filter(x=>x.ok).length};
 }
 function escF1(str){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function render(){
  const s=status();
  for(const entry of managed){
   if(entry.node)entry.node.dataset.psF1Hidden=s.phase<entry.min?'1':'0';
  }
  const steps='<div class="psf1-steps" aria-label="Etapy finału">'+sections.map(x=>`<span class="${s.phase>x.phase?'done':s.phase===x.phase?'current':''}">${s.phase>x.phase?'✓ ':''}${escF1(x.name)}</span>`).join('')+'</div>';
  if(s.phase===0){
   const cards=s.checks.map((x,i)=>`<div class="psf1-card ${x.ok?'complete':''}"><span class="psf1-status">${x.ok?'✓ ZWERYFIKOWANO':'○ DO SPRAWDZENIA'}</span><b>${escF1(x.label)}</b><p>${escF1(x.desc)}</p>${x.ok?'':`<button type="button" class="btn alt" data-ps-f1-tab="${x.tab}">Przejdź do czynności</button>`}</div>`).join('');
   gate.innerHTML=`<div class="eyebrow">PRZYGOTOWANIE POSTĘPOWANIA</div><h3 class="psf1-title">Finał jeszcze przed Tobą</h3><p class="psf1-copy">Aby przedstawić własną wersję zdarzeń, najpierw zweryfikuj podstawowe ustalenia. Lista podejrzanych i rekonstrukcji w akcie oraz argumenty obrony pozostają ukryte do odpowiedniego etapu. Nie musisz kompletować wszystkich materiałów w grze.</p>${steps}<p class="psf1-count">Przygotowanie: ${s.done}/3</p><div class="psf1-grid">${cards}</div><div class="psf1-actions"><button type="button" class="btn" data-ps-f1-tab="${s.checks.find(c=>!c.ok)?.tab||'evidence'}">Kontynuuj dochodzenie</button><button type="button" class="btn alt" data-ps-f1-tab="evidence">Przejrzyj akta</button></div>`;
  }else{
   const message=s.phase===1?'Warunki przygotowania zostały spełnione. Teraz samodzielnie wybierz osobę, wersję zdarzenia i zdobyte dowody. Zarzuty obrony pozostają ukryte do chwili złożenia aktu.':s.phase===2?'Akt został złożony. Możesz teraz sprawdzić go w konfrontacji, rozpatrzyć zastrzeżenia obrony i przygotować rozstrzygnięcie.':'Postępowanie zostało rozstrzygnięte. Możesz przeczytać wynik, przeanalizować ograniczenia materiału i wrócić do wcześniejszych ustaleń.';
   const label=s.phase===1?'Etap I — Twój akt oskarżenia':s.phase===2?'Etap II — Konfrontacja':'Etap III — Rozstrzygnięcie';
   gate.innerHTML=`<div class="eyebrow">ODKRYWANY STOPNIOWO FINAŁ</div><h3 class="psf1-title">${label}</h3><p class="psf1-copy">${message}</p>${steps}<p class="psf1-status">Przygotowanie: ${s.done}/3 zweryfikowane</p>`;
  }
  root.dataset.psF1Phase=String(s.phase);
  gate.setAttribute('data-phase',String(s.phase));
  return s;
 }
 gate.addEventListener('click',e=>{
  const btn=e.target.closest('[data-ps-f1-tab]');if(!btn)return;
  showTab(btn.dataset.psF1Tab);
  const target=btn.dataset.psF1Tab==='inspection12'?document.getElementById('scDetail'):null;
  if(target)target.scrollIntoView({block:'start',behavior:'smooth'});
 });
 let queued=false;
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
 registerNavigationHook({name:'progressive-final-access',after:render});
 const previousRender=fcRender;
 fcRender=function(){const result=previousRender.apply(this,arguments);schedule();return result;};
 const previousHearing=simRenderHearing;
 simRenderHearing=function(){const result=previousHearing.apply(this,arguments);schedule();return result;};
 
 /* SaveManager: applySave hook. */
registerSaveHook({name:"45-progressive-final-access-load1", apply(data){const result=undefined;schedule();return result;}});
 const previousReset=fcReset;
 fcReset=function(){const result=previousReset.apply(this,arguments);schedule();return result;};
 const previousSimReset=simReset;
 simReset=function(){const result=previousSimReset.apply(this,arguments);schedule();return result;};
 root.addEventListener('click',schedule);
 root.addEventListener('change',schedule);
 window.PS_FINALE_STAGES={status,render,version:'1.0'};
 render();
})();
