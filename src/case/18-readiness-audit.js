
/* Prawdziwe Śledztwo — etap 6.0: audyt gotowości sprawy.
 * To panel diagnostyczny dla gracza, NIE obejście gry: nie generuje nowych dowodów,
 * nie zmienia przebiegu fabuły, zaufania, przesłuchań ani rozstrzygnięć.
 */
(function(){
 'use strict';
 const caseSection=document.getElementById('final');
 const hearing=document.getElementById('simHearing');
 if(!caseSection||!hearing||typeof ps54Review!=='function')return;
 const checkNames={
  proof:'Niezależne tezy dowodowe', roles:'Źródła aktu oskarżenia',
  time:'Spójność osi czasu', audit:'Weryfikacja użytych materiałów',
  defense:'Odpowiedzi na zarzuty obrony', person:'Spójność rekonstrukcji',
  disclosure:'Ujawnienie materiałów odciążających', procedure:'Przebieg przesłuchań',
  trust:'Rzetelność postępowania', charge:'Projekt aktu'
 };
 const audit=document.createElement('section');
 audit.id='ps60CaseAudit';audit.className='ps60-check';
 audit.setAttribute('aria-label','Kontrola kompletności materiału');
 audit.innerHTML='<div class="eyebrow">KONTROLA AKT</div><h3>Bilans śledztwa</h3><p class="ps60-help">Ten bilans pokazuje braki w uzasadnieniu. Nie zdradza rozwiązania ani nie wymaga znalezienia wszystkich 78 dokumentów. Możesz także skierować słabą sprawę do oceny obrony — z konsekwencjami.</p><div class="ps60-overview" id="ps60AuditSummary" aria-live="polite"></div><details id="ps60CheckDetails"><summary>Sprawdź stan poszczególnych obszarów</summary><div id="ps60AuditList" class="ps60-list"></div></details><div class="ps60-actions"><button type="button" class="btn alt" id="ps60AuditRefresh">Aktualizuj bilans</button><button type="button" class="btn subtle" id="ps60AuditExport">Zapisz bilans TXT</button></div>';
 hearing.before(audit);
 const style=document.createElement('style');
 style.textContent=`
 .ps60-check{border:1px solid #4a5a63;border-radius:9px;background:#131f28;padding:18px;margin:17px 0;min-width:0}
 .ps60-check h3{margin:6px 0 9px;font-size:20px}.ps60-help{font-size:12px;color:var(--muted);line-height:1.65}
 .ps60-overview{margin:14px 0;padding:12px;border-radius:7px;border:1px solid #40545a;background:#111b22;font-size:13px;line-height:1.6}
 .ps60-overview b{color:#e6c58e}.ps60-check details{border-top:1px solid #344650;padding:12px 0 0}
 .ps60-check summary{cursor:pointer;color:#e9c892;font-weight:650;font-size:13px;min-height:42px;display:list-item;padding:9px 3px}
 .ps60-list{display:grid;gap:8px;margin:12px 0}.ps60-item{display:grid;grid-template-columns:22px minmax(0,1fr) auto;align-items:start;gap:8px;padding:11px;background:#192730;border:1px solid #394b54;border-radius:7px}
 .ps60-indicator{color:#d0b37e;font-weight:750}.ps60-item.complete .ps60-indicator{color:#94d0ac}.ps60-item strong{font-size:12px}.ps60-item p{font-size:11px;color:#b5c0c6;margin:3px 0 0;line-height:1.5}
 .ps60-item button{background:#24333a;border:1px solid #55646a;color:#e6d5ae;border-radius:5px;padding:6px 8px;font-size:11px;min-height:34px;cursor:pointer}
 .ps60-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:13px}.ps60-actions button{min-height:42px}
 @media(max-width:600px){#inspection12 .et1-photo-controls{display:flex;flex-wrap:wrap;gap:8px}#inspection12 #et2EnlargeScene{position:static;transform:none;flex:1 1 100%;width:100%;max-width:100%;min-width:0;margin:0}}
 @media(max-width:590px){.ps60-check{padding:12px}.ps60-item{grid-template-columns:18px minmax(0,1fr)}.ps60-item button{grid-column:2;justify-self:start}.ps60-actions button{flex:1 1 135px}#chatInput{font-size:16px}}
 `;
 document.head.appendChild(style);
 const coreIds=['meeting','mechanism','alibi','identity','chronology'];
 function snapshot(){
  const assessed=ps54Review(),a=assessed.assessment,sim=STATE.sim,charged=STATE.final13;
  const owned=DOCS.filter(d=>STATE.found.has(d.id));
  const audited=owned.filter(d=>STATE.sim.verified.includes(d.id)).length;
  const proof=coreIds.filter(id=>a.cs[id]?.ready).length;
  const used=[...new Set([...(charged.links||[]).map(x=>x.id),...Object.values(sim.links||{}).flatMap(links=>(links||[]).map(x=>x.id)),charged.keystone].filter(Boolean))];
  const critical=used.filter(id=>SIM_DEGRADED[id]&&!simIsVerified(id));
  const overclaims=used.filter(id=>['overclaim','ignored'].includes(sim.auditJudgments?.[id]?.status));
  const timeline=a.timelineIssues.length;
  const timelinePlaced=TL_EVENTS.filter(e=>STATE.timeline11.entries?.[e.id]?.at).length;
  const trust=Math.round(sim.trust);
  const risk=assessed.risk||0;
  const checks=[
   {id:'charge',ok:!!charged.submitted,title:checkNames.charge,description:charged.submitted?'Projekt przedstawiono obronie.':'Najpierw przygotuj i przedstaw projekt aktu.',tab:'final'},
   {id:'proof',ok:proof===coreIds.length,title:checkNames.proof,description:proof+'/'+coreIds.length+' kluczowych tez z pełnymi drogami dowodowymi. Niezależnie oceń też wątek motywu.',tab:'deduction'},
   {id:'roles',ok:a.rolesReady&&a.keyLinked,title:checkNames.roles,description:a.rolesReady?(a.keyLinked?'Cztery role mają niezależne źródła, a dowód kluczowy jest przypisany.':'Sprawdź przypisanie dowodu kluczowego do roli osoby.'):'W każdej roli aktu potrzebne są dwa źródła z różnych rodzin.',tab:'final'},
   {id:'time',ok:timeline===0&&timelinePlaced>0,title:checkNames.time,description:timeline?timeline+' nierozwiązanych sprzeczności chronologicznych.':timelinePlaced?timelinePlaced+'/20 ułożonych zdarzeń. Dotychczas nie wykryto sprzeczności; sprawdź, czy nie pominięto istotnego czasu.':'Nie zapisano jeszcze zdarzeń. Brak sprzeczności w pustej osi nie jest jej weryfikacją.',tab:'timeline'},
   {id:'audit',ok:used.length>0&&critical.length===0&&overclaims.length===0&&!a.badKey&&risk===0,title:checkNames.audit,description:used.length+' użytych źródeł · '+critical.length+' krytycznych bez weryfikacji · '+overclaims.length+' przecenionych/pominiętych · '+risk+' innych zagrożeń. Brak wskazanych źródeł nie jest pozytywnym audytem.',tab:'deduction'},
   {id:'defense',ok:assessed.defense.all,title:checkNames.defense,description:assessed.defense.passed+'/6 argumentów popartych źródłami.',tab:'final'},
   {id:'person',ok:a.coherence&&a.strength>80&&!a.contradictory,title:checkNames.person,description:'Waga materiału '+a.strength+'%. Ocena wymaga zgodności osoby, mechanizmu i alibi, a nie tylko wysokiego wyniku.',tab:'final'},
   {id:'disclosure',ok:sim.process54?.disclosure==='disclose',title:checkNames.disclosure,description:sim.process54?.disclosure==='disclose'?'Materiały odciążające zostały uwzględnione.':'Określ sposób postępowania z wątpliwościami obrony.',tab:'final'},
   {id:'procedure',ok:assessed.violations<=2,title:checkNames.procedure,description:assessed.violations+' uchybień podczas przesłuchań. Nie należy wymuszać oświadczeń.',tab:'interview'},
   {id:'trust',ok:trust>=35,title:checkNames.trust,description:trust+'% zaufania prokuratorskiego. Nie wszystkie skutki błędów są odwracalne.',tab:'final'}
  ];
  return {checks,completed:checks.filter(c=>c.ok).length,total:checks.length,
   docs:owned.length,audited,coreReady:proof,defense:assessed.defense.passed,trust,time:sim.time,
   strongReady:assessed.ready&&sim.process54?.disclosure==='disclose'&&!!charged.submitted,
   verdict:sim.trial?.kind||null};
 }
 function render(){
  const s=snapshot(),summary=document.getElementById('ps60AuditSummary'),list=document.getElementById('ps60AuditList');
  if(!summary||!list)return s;
  summary.replaceChildren();
  const b=document.createElement('b');b.textContent=s.completed+'/'+s.total+' obszarów spełnionych';
  const p=document.createElement('div');p.textContent='Zdobyte dokumenty: '+s.docs+'/78 · sprawdzone: '+s.audited+' · obrona: '+s.defense+'/6.';
  const hint=document.createElement('div');hint.textContent=s.strongReady?'Materiał spełnia kontrolowane warunki mocnego aktu. Rozstrzygnięcie nadal wymaga świadomej decyzji.':'To nie jest blokada zakończenia. Nierozwiązane wątpliwości mogą zmienić finał.';
  summary.append(b,p,hint);
  list.replaceChildren();
  for(const row of s.checks){
   const article=document.createElement('div');article.className='ps60-item'+(row.ok?' complete':'');
   const flag=document.createElement('span');flag.className='ps60-indicator';flag.textContent=row.ok?'✓':'○';
   const detail=document.createElement('div');const heading=document.createElement('strong');heading.textContent=row.title;
   const description=document.createElement('p');description.textContent=row.description;detail.append(heading,description);
   const jump=document.createElement('button');jump.type='button';jump.textContent='Przejdź';jump.dataset.ps60Tab=row.tab;jump.setAttribute('aria-label','Otwórz: '+row.title);
   article.append(flag,detail,jump);list.appendChild(article);
  }
  return s;
 }
 function exportAudit(){const s=snapshot();const lines=[
  'PRAWDZIWE ŚLEDZTWO — OSTATNI KURS','BILANS KONTROLI AKT (ETAP 6.0)','',
  'Obszary: '+s.completed+'/'+s.total,'Zdobyte dokumenty: '+s.docs+'/78',
  'Sprawdzone zdobyte dokumenty: '+s.audited,'Obrona: '+s.defense+'/6',
  'Czas śledczy: '+s.time,'Zaufanie: '+s.trust+'%','',
  ...s.checks.map(c=>(c.ok?'[OK] ':'[DO UZUPEŁNIENIA] ')+c.title+'\n'+c.description+'\n'),
  'Bilans nie jest orzeczeniem sądu ani wskazaniem sprawcy.'
 ];
  const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Ostatni_kurs_bilans_sledztwa.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
 }
 audit.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.id==='ps60AuditRefresh'){render();return;}
  if(button.id==='ps60AuditExport'){exportAudit();return;}
  if(button.dataset.ps60Tab){showTab(button.dataset.ps60Tab);if(typeof ui14CloseMenu==='function')ui14CloseMenu();if(typeof ui14Update==='function')ui14Update();}
 });
 registerNavigationHook({name:'readiness-audit',after:({id})=>{if(id==='final')render();}});
 hearing.addEventListener('change',event=>{if(event.target.id==='ps54Disclosure')render();});
 const oldRender=simRenderHearing;
 simRenderHearing=function(){const result=oldRender.apply(this,arguments);render();return result;};
 
 /* SaveManager: applySave hook. */
registerSaveHook({name:"18-readiness-audit-load1", apply(d){const result=undefined;render();return result;}});
 const oldReset=simReset;
 simReset=function(){const result=oldReset.apply(this,arguments);render();return result;};
 render();
 window.PS60_QA={version:'6.0',snapshot,render,exportAudit};
})();

