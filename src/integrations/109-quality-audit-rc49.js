/* RC49: read-only on-device diagnostics; never modifies proof, session or progression. */
(()=>{
 'use strict';const host=document.getElementById('notebook');if(!host||!window.PS_SAVE_MANAGER)return;
 const section=document.createElement('section');section.id='ps49Diagnostics';section.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Audyt jakości RC49';
 const para=document.createElement('p');para.textContent='Lokalna kontrola spójności bieżącego zapisu, dowodów i rozmów. Nie łączy się z usługami AI i nie ocenia winy.';
 const button=document.createElement('button');button.type='button';button.className='btn alt';button.textContent='Sprawdź bieżący stan';
 const results=document.createElement('div');results.setAttribute('role','status');section.append(title,para,button,results);host.append(section);
 function audit(){const checks=[];
  const add=(name,pass)=>checks.push({name,pass:!!pass});
  try{const save=PS_SAVE_MANAGER.build();PS_SAVE_MANAGER.verify(save);add('SHA-256 zapisu i odczyt metadanych',true);add('Zgodność wersji zapisu',save.version===11&&save.saveMeta?.schemaVersion===2);}catch{add('SHA-256 zapisu i metadane',false);}
  add('Wyłącznie znane ID dokumentów',[...STATE.found].every(id=>byId[id]));
  add('Przesłuchania przypisane do świadków',CONTENT.characters.every(c=>Array.isArray(STATE.dialogues[c.id])));
  add('Zgodne role wypowiedzi',CONTENT.characters.every(c=>(STATE.dialogues[c.id]||[]).every(m=>['player','npc'].includes(m.role)&&typeof m.text==='string')));
  add('Przedział czasowy ręcznych notatek',STATE.events.every(e=>typeof e.at==='string'&&/^2026-11-(17|18)T\d\d:\d\d$/.test(e.at)));
  add('Moduł osi czasu',!!window.PS_RC41_TIMELINE?.inspect);
  add('Weryfikacja przełomów',!!window.PS85_STORY?.available);
  add('Niezależny silnik werdyktu',!!window.PS_RC40_FINALE?.snapshot);
  add('Uzgodnienia kooperacyjne dostępne lokalnie',!!window.PS_COOP?.refresh);
  return checks;}
 function render(){const a=audit();results.replaceChildren();for(const c of a){const p=document.createElement('p');p.textContent=(c.pass?'OK · ':'UWAGA · ')+c.name;results.append(p);}
  results.prepend(Object.assign(document.createElement('strong'),{textContent:`${a.filter(x=>x.pass).length}/${a.length} kontroli zaliczonych` }));}
 button.addEventListener('click',render);
 registerNavigationHook({name:'rc49-quality-dashboard',after:()=>{if(STATE.tab==='notebook')render();}});
 window.PS_RC49=Object.freeze({audit,render});
})();
