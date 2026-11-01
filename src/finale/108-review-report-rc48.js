/* RC48: evidence-bounded final report; export only, no mutation to STATE or verdict. */
(()=>{
 'use strict';const host=document.getElementById('final');if(!host)return;
 const panel=document.createElement('section');panel.id='ps48FinalReport';panel.className='ps-next-panel';
 const head=document.createElement('h3');head.textContent='Raport śledczego 2.0';
 const note=document.createElement('p');note.textContent='Raport odróżnia zdobyte dokumenty, relacje świadków i hipotezy graczy. Nie zastępuje istniejącej oceny werdyktu.';
 const output=document.createElement('div'),download=document.createElement('button');download.type='button';download.className='btn alt';download.textContent='Pobierz szczegółowy raport (.txt)';
 panel.append(head,note,output,download);host.append(panel);
 function report(){const lines=['PRAWDZIWE ŚLEDZTWO — RAPORT ANALITYCZNY RC48','Wszystkie dane dotyczą fikcyjnej sprawy.',''];
  const verdict=STATE.sim?.trial;lines.push('WERDYKT (NIEZMIENIONY): '+(typeof verdict?.kind==='string'?verdict.kind:'jeszcze nie wydano'),'');
  const docs=[...STATE.found].filter(id=>byId[id]);lines.push('DOKUMENTY ODKRYTE: '+docs.length);
  docs.sort().slice(0,250).forEach(id=>lines.push('- ['+id+'] '+String(byId[id].title||id).slice(0,180)));lines.push('');
  lines.push('ZDARZENIA POTWIERDZONE ZAPISAMI (NIE Z DOMYSŁÓW):');
  const known=TL_EVENTS.filter(e=>e.sources.some(id=>STATE.found.has(id)&&byId[id]));
  for(const e of known){const ids=e.sources.filter(id=>STATE.found.has(id)&&byId[id]);lines.push('- '+e.from+(e.until?' – '+e.until:'')+' · '+e.title+' · źródła: '+ids.join(', ')+' · ograniczenie: '+e.caution);}
  lines.push('','PRZESŁUCHANIA (RELACJE, NIE POTWIERDZENIA):');
  for(const c of CONTENT.characters){const log=STATE.dialogues[c.id]||[];lines.push('- '+c.name+': '+log.filter(m=>m.role==='player').length+' pytań; '+log.filter(m=>m.role==='npc').length+' wypowiedzi');}
  const notes=String(STATE.notes||'').slice(0,8000);lines.push('','NOTATKI GRACZA (HIPOTEZY):',notes||'Brak');
  const board=window.PS_RC38_BOARD?.inspect?.()||[];lines.push('','POWIĄZANIA WŁASNE GRACZY:');
  for(const b of board.slice(0,80))if(STATE.found.has(b.a)&&STATE.found.has(b.b))lines.push('- '+b.kind+' · '+b.a+' / '+b.b+' · '+b.note);
  const marks=window.PS_RC46?.inspect?.()||[];lines.push('','ADNOTACJE DO ZEZNANIA:');for(const mark of marks.slice(0,80))lines.push('- '+mark.character+' #'+mark.index+' · '+mark.comment);
  lines.push('','UWAGA: relacje i notatki nie stanowią samodzielnego dowodu; raport nie odblokowuje finału.');return lines.join('\n');}
 function render(){if(STATE.tab!=='final')return;const docs=[...STATE.found].filter(id=>byId[id]).length;
  output.textContent=`Dokumenty: ${docs} · świadkowie: ${CONTENT.characters.length} · werdykt: ${STATE.sim?.trial?.kind||'jeszcze nie wydano'}.`;
 }
 download.addEventListener('click',()=>{if(window.PS_COOP?.active&&!window.PS_COOP.controller)return;
  const blob=new Blob([report()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Prawdziwe_Sledztwo_Raport_RC48.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 registerNavigationHook({name:'rc48-analytical-report',after:render});window.PS_RC48=Object.freeze({report,render});render();
})();
