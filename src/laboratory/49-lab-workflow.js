
(function(){
 'use strict';
 const labs=document.getElementById('labs'),legacy=document.getElementById('labCards'),oldAudit=document.getElementById('cross3Panel');
 if(!labs||!legacy||!oldAudit||document.getElementById('ux5Hub')||typeof STATE==='undefined')return;
 const by=id=>document.getElementById(id);
 const defs=[
  {key:'tcms',name:'TCMS',short:'Diagnostyka wagonu i chronologia sesji',inputs:TCMS_INPUT,gate:()=>TCMS_INPUT.filter(x=>STATE.found.has(x)).length>=2,outputs:TCMS_OUT},
  {key:'msg',name:'Deszyfrator',short:'Odtwarzanie korespondencji i metadanych',inputs:MSG_INPUT,gate:()=>MSG_INPUT.filter(x=>STATE.found.has(x)).length>=2,outputs:MSG_OUTPUT},
  {key:'cctv',name:'CCTV',short:'Synchronizacja nagrań z trzech kamer',inputs:CCTV_INPUT,gate:()=>CCTV_INPUT.every(x=>STATE.found.has(x)),outputs:CCTV_OUT},
  {key:'forensic',name:'Kryminalistyka',short:'Porównanie próbek, urazów i śladów',inputs:FO_INPUT,gate:()=>FO_INPUT.filter(x=>STATE.found.has(x)).length>=2,outputs:FO_OUTPUT},
  {key:'access',name:'Dostęp i trasy',short:'Czytniki kart i możliwe przemieszczenia',inputs:ACCESS_SECRET.inputs,gate:()=>ACCESS_SECRET.gate_inputs.filter(x=>STATE.found.has(x)).length>=2,outputs:ACCESS_SECRET.outputs}
 ];
 const hub=document.createElement('div');hub.className='ux5-hub';hub.id='ux5Hub';hub.innerHTML='<div class="ux5-top"><div><div class="eyebrow">PRACOWNIE ANALITYCZNE</div><h3>Wybierz analizę na podstawie zebranych materiałów</h3><p>Każdą pracownię można otworzyć w dowolnym momencie. Źródła do rozpoczęcia analizy i komplet źródeł wymaganych do zatwierdzenia raportu to osobne warunki. Gra nie uzupełnia dowodów za Ciebie.</p></div><div id="ux5Summary" class="ux5-summary" aria-live="polite"></div></div><div id="ux5Ready" class="ux5-group"></div><div id="ux5Waiting" class="ux5-group"></div><div id="ux5Done" class="ux5-group"></div>';
 const parent=by('ps62LabStatus')||legacy;parent.before(hub);
 const audit=document.createElement('details');audit.className='ux5-audit';audit.id='ux5Audit';audit.innerHTML='<summary>Audyt przekrojowy i konfrontacje po raportach</summary><p class="ux5-audit-note">Po ukończeniu analizy zestaw jej wynik z niezależnym źródłem. To osobne działanie, nie zastępuje żadnej z pięciu minigier.</p>';
 oldAudit.before(audit);audit.appendChild(oldAudit);
 const panels=['tcmsPanel','msgPanel','cctvPanel','forensicPanel','accessPanel'];
 const producer=id=>defs.findIndex(d=>d.outputs.includes(id));
 const docLabel=id=>byId[id]?.title||'Materiał '+id;
 const isOwned=id=>STATE.found.has(id);
 function overview(){return defs.map((d,index)=>{const have=d.inputs.filter(isOwned);const missing=d.inputs.filter(id=>!isOwned(id));const done=!!STATE[d.key]?.solved;
  return {...d,index,have,missing,done,ready:!done&&d.gate(),attempts:STATE[d.key]?.attempts||0};
 });}
 function btn(label,act,code,klass='btn alt'){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.className=klass;b.dataset.ux5Action=act;b.dataset.ux5Index=String(code);return b;
 }
 function goSource(id){
  const p=producer(id);if(p>=0){openLab(p);return;}
  showTab('search');
  // Korzystamy wyłącznie z istniejącej wyszukiwarki i jej bramek dostępu.
  const all=by('searchAreas')?.querySelector('[data-ps3-all]')||document.querySelector('#search .ps3-all-area');
  if(all)all.click();
  const field=by('searchQuery');if(field)field.value=docLabel(id);
  by('searchBtn')?.click();
  by('searchResults')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function renderCard(s){
  const card=document.createElement('article');card.className='ux5-card '+(s.done?'done':s.ready?'ready':'waiting');
  const top=document.createElement('div');top.className='ux5-card-top';
  const title=document.createElement('div'),badge=document.createElement('span');badge.className='ux5-badge';
  title.innerHTML='<span class="ux5-serial">PRACOWNIA '+String(s.index+1).padStart(2,'0')+'</span>';
  const h=document.createElement('h5');h.textContent=s.name;title.appendChild(h);
  badge.textContent=s.done?'Raport zatwierdzony':s.ready?'Można rozpocząć':'Brak źródeł';top.append(title,badge);
  const description=document.createElement('p');description.textContent=s.short;
  const count=document.createElement('div');count.className='ux5-count';count.innerHTML='Posiadane źródła: <strong>'+s.have.length+' / '+s.inputs.length+'</strong>';
  const bar=document.createElement('div');bar.className='ux5-bar';bar.setAttribute('role','progressbar');bar.setAttribute('aria-label','Posiadane źródła '+s.name);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(s.inputs.length));bar.setAttribute('aria-valuenow',String(s.have.length));bar.innerHTML='<span style="width:'+Math.round(100*s.have.length/s.inputs.length)+'%"></span>';
  const explanation=document.createElement('small');explanation.textContent=s.done?'Zakończono minigrę i zatwierdzono raport.':s.ready&&s.missing.length?'Analizę można rozpocząć. Do zatwierdzenia raportu mogą być potrzebne kolejne źródła.':s.ready?'Źródła wejściowe zebrane. Ukończ analizę i zatwierdź raport.':'Najpierw zdobądź wymagane źródła. Możesz też otworzyć pracownię, aby poznać procedurę.';
  card.append(top,description,count,bar,explanation);
  if(s.missing.length){
    const det=document.createElement('details');det.className='ux5-missing';
    const summary=document.createElement('summary');summary.textContent='Brakujące materiały ('+s.missing.length+')';det.appendChild(summary);
    const list=document.createElement('ul');
    for(const id of s.missing){const li=document.createElement('li');const span=document.createElement('span');span.textContent=docLabel(id);const p=producer(id);const b=btn(p>=0?'Otwórz pracownię':'Znajdź materiał','source',id,'btn alt');b.dataset.ux5Source=id;li.append(span,b);list.appendChild(li);}det.appendChild(list);card.appendChild(det);
  }
  const actions=document.createElement('div');actions.className='ux5-actions';actions.appendChild(btn(s.done?'Przejrzyj raport':s.ready?'Rozpocznij analizę':'Zobacz pracownię','open',s.index,s.ready?'btn':'btn alt'));
  if(!s.ready&&!s.done&&s.missing.length){const first=s.missing.find(id=>producer(id)<0)||s.missing[0];const locate=btn('Gdzie szukać?','source',first,'btn subtle');locate.dataset.ux5Source=first;actions.appendChild(locate);}
  card.appendChild(actions);return card;
 }
 function section(id,title,note,group){const el=by(id);el.replaceChildren();const head=document.createElement('div');head.className='ux5-group-head';const h=document.createElement('h4');h.textContent=title;const span=document.createElement('span');span.textContent=group.length+' z 5';head.append(h,span);el.appendChild(head);
   if(!group.length){const empty=document.createElement('div');empty.className='ux5-empty';empty.textContent=note;el.appendChild(empty);return;}
   const grid=document.createElement('div');grid.className='ux5-grid';group.forEach(x=>grid.appendChild(renderCard(x)));el.appendChild(grid);
 }
 function render(){const all=overview(),done=all.filter(x=>x.done),ready=all.filter(x=>x.ready),waiting=all.filter(x=>!x.done&&!x.ready);
  by('ux5Summary').textContent=ready.length+' gotowe do rozpoczęcia · '+waiting.length+' oczekuje · '+done.length+' raportów';
  section('ux5Ready','Możesz rozpocząć','Żadna z pracowni nie ma jeszcze wymaganej liczby źródeł.',ready);
  section('ux5Waiting','Potrzebujesz kolejnych dowodów','Wszystkie dostępne pracownie można już rozpocząć.',waiting);
  section('ux5Done','Zatwierdzone raporty','Po zakończeniu analizy i zatwierdzeniu raportu znajdziesz go tutaj.',done);
  // Nie odsłaniamy treści audytu zanim nie powstanie pierwszy raport.
  audit.hidden=done.length===0;
  if(audit.hidden)audit.open=false;
  return {ready:ready.map(x=>x.key),waiting:waiting.map(x=>x.key),done:done.map(x=>x.key),labs:all.map(x=>({key:x.key,have:x.have.length,total:x.inputs.length,missing:[...x.missing]}))};
 }
 function openLab(index){
  const button=legacy.querySelector('[data-open-lab="'+index+'"]');if(!button)return;
  button.click();
  panels.forEach((id,i)=>{
   const panel=by(id);if(!panel)return;
   let nav=panel.querySelector('.ux5-active-nav');
   if(!nav){nav=document.createElement('div');nav.className='ux5-active-nav';const txt=document.createElement('span');txt.textContent='Pracownia: '+defs[i].name;const back=document.createElement('button');back.type='button';back.className='btn alt';back.textContent='Wróć do listy';back.dataset.ux5Action='back';nav.append(txt,back);panel.prepend(nav);}
  });
  render();
 }
 hub.addEventListener('click',e=>{const target=e.target.closest('[data-ux5-action]');if(!target)return;
  if(target.dataset.ux5Action==='open')openLab(Number(target.dataset.ux5Index));
  if(target.dataset.ux5Action==='source')goSource(target.dataset.ux5Source||target.dataset.ux5Index);
 });
 labs.addEventListener('click',e=>{if(e.target.closest('[data-ux5-action="back"]'))hub.scrollIntoView({behavior:'smooth',block:'start'});});
 registerNavigationHook({name:'lab-workflow',after:({id})=>{if(id==='labs')render();}});
 
 /* SaveManager: applySave hook. */
registerSaveHook({name:"49-lab-workflow-load1", apply(data){const result=undefined;render();return result;}});
 const olderReset=psReset;
 psReset=function(){const result=olderReset.apply(this,arguments);render();return result;};
 // Po zatwierdzeniu raportu aktualizujemy grupy bez ingerencji w walidatory.
 labs.addEventListener('click',e=>{
  const trigger=e.target.closest('button');if(!trigger||trigger.dataset.ux5Action)return;
  queueMicrotask(()=>{if(STATE.tab==='labs')render();});
 },false);
 render();
 window.UX5_LABS={status:render,open:openLab,find:goSource};
})();
