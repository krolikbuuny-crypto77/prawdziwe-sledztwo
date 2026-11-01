/* RC45: read-only time gap analysis; never treats repeated sources as independent proof. */
(()=>{
 'use strict';if(!window.PS_RC41_TIMELINE||typeof TL_EVENTS==='undefined')return;
 const root=document.getElementById('ps41AutoTimeline');if(!root)return;
 const panel=document.createElement('section');panel.id='ps45TimeAnalysis';panel.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Oś czasu 3.0 · luki i niezależność źródeł';
 const intro=document.createElement('p');intro.textContent='Przerwy między znacznikami czasu nie są dowodem braku zdarzeń. Powtarzane relacje i dokumenty nie są automatycznie niezależnym potwierdzeniem.';
 const list=document.createElement('div');panel.append(title,intro,list);root.querySelector('.ps41-controls')?.insertAdjacentElement('afterend',panel);
 const minutes=iso=>{const d=Date.parse(iso+':00Z');return Number.isFinite(d)?d/60000:null;};
 function analyze(){const events=TL_EVENTS.filter(e=>e.sources.some(id=>STATE.found.has(id)&&byId[id])).sort((a,b)=>a.from.localeCompare(b.from));
  const gaps=[];for(let i=1;i<events.length;i++){const before=events[i-1],after=events[i];const gap=minutes(after.from)-minutes(before.until||before.from);
   if(gap>=40)gaps.push({from:before.id,to:after.id,minutes:gap});}
  const multi=events.filter(e=>e.sources.filter(id=>STATE.found.has(id)&&byId[id]).length>1).map(e=>({id:e.id,sources:e.sources.filter(id=>STATE.found.has(id)&&byId[id])}));
  return {events:events.length,gaps,multi};}
 function render(){if(STATE.tab!=='timeline')return;const d=analyze();list.replaceChildren();
  const p=document.createElement('p');p.textContent=`Odkryte punkty: ${d.events} · odcinki bez pośredniego znacznika (≥40 min): ${d.gaps.length} · punkty z wieloma dokumentami: ${d.multi.length}`;list.append(p);
  for(const gap of d.gaps.slice(0,10)){const x=document.createElement('p');x.className='ps-next-row';
   x.textContent=`Luka ${gap.minutes} min: ${TL_EVENTS.find(e=>e.id===gap.from)?.title} → ${TL_EVENTS.find(e=>e.id===gap.to)?.title}. Nie wiadomo, co zaszło w tym czasie.`;list.append(x);}
  for(const group of d.multi.slice(0,10)){const x=document.createElement('p');x.className='ps-next-row';x.textContent=`${TL_EVENTS.find(e=>e.id===group.id)?.title}: źródła ${group.sources.join(', ')} (liczba źródeł nie potwierdza ich niezależności)`;list.append(x);}
 }
 registerNavigationHook({name:'rc45-time-analysis',after:render});window.PS_RC45=Object.freeze({analyze,render});setInterval(()=>{if(STATE.tab==='timeline'&&!document.hidden)render();},5500);render();
})();
