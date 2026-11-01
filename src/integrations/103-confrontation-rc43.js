/* RC43: confrontation requires an actual previously recorded NPC statement.
 * A quoted testimony is NOT a new fact; server knowledge gates remain sovereign. */
(()=>{
 'use strict';if(typeof STATE==='undefined')return;
 const host=document.getElementById('interview');if(!host)return;
 const wrap=document.createElement('section');wrap.id='ps43Confrontation';wrap.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Konfrontacja zeznań';
 const hint=document.createElement('p');hint.textContent='Wybierz rzeczywiście wypowiedziane zdanie innego świadka. Cytat pozostaje niezweryfikowaną relacją; samo przytoczenie nie odblokowuje dowodów.';
 const source=document.createElement('select');source.setAttribute('aria-label','Źródłowy świadek');
 const quote=document.createElement('select');quote.setAttribute('aria-label','Fragment istniejącego zeznania');
 const preview=document.createElement('blockquote');preview.className='ps-next-quote';
 const add=document.createElement('button');add.type='button';add.className='btn alt';add.textContent='Wstaw pytanie do przesłuchania';
 wrap.append(title,hint,source,quote,preview,add);
 const layout=host.querySelector('.charactergrid');if(layout)layout.insertAdjacentElement('afterend',wrap);else host.append(wrap);
 const val=(v,n=400)=>String(v||'').replace(/[\u0000-\u001f]+/g,' ').slice(0,n);
 function options(){const existing=source.value;source.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='Wybierz innego świadka';source.append(blank);
  for(const c of CONTENT.characters){if(c.id===STATE.activeChar)continue;
   if(!(STATE.dialogues[c.id]||[]).slice(1).some(m=>m.role==='npc'))continue;
   const opt=document.createElement('option');opt.value=c.id;opt.textContent=c.name;source.append(opt);}
  if([...source.options].some(o=>o.value===existing))source.value=existing;
  updateQuotes();}
 function updateQuotes(){const id=source.value,old=quote.value;quote.replaceChildren();
  const log=STATE.dialogues?.[id]||[];
  log.slice(1).forEach((m,i)=>{if(m.role!=='npc'||typeof m.text!=='string')return;
   const o=document.createElement('option');o.value=String(i+1);o.textContent=val(m.text,105);quote.append(o);});
  if([...quote.options].some(o=>o.value===old))quote.value=old;
  else if(quote.options.length)quote.selectedIndex=0;
  refresh();}
 function refresh(){const m=STATE.dialogues?.[source.value]?.[Number(quote.value)];
  preview.textContent=m?.role==='npc'?m.text.slice(0,1100):'Nie wybrano zeznania.';
  add.disabled=!m||m.role!=='npc'||(window.PS_COOP?.active&&!window.PS_COOP.controller);}
 source.addEventListener('change',updateQuotes);quote.addEventListener('change',refresh);
 add.addEventListener('click',()=>{const witness=CONTENT.characters.find(c=>c.id===source.value),m=STATE.dialogues?.[source.value]?.[Number(quote.value)],field=document.getElementById('chatInput');
  if(!witness||m?.role!=='npc'||!field||source.value===STATE.activeChar||(window.PS_COOP?.active&&!window.PS_COOP.controller))return;
  const quoted=val(m.text.replace(/\[[^\]]*Okazano:[^\]]*\]/g,''),420);
  field.value=`W przesłuchaniu ${witness.name} padły słowa: „${quoted}”. To niezweryfikowana wypowiedź. Co możesz powiedzieć o tej rozbieżności w granicach własnej wiedzy?`;
  field.focus();field.scrollIntoView({behavior:'smooth',block:'center'});
 });
 registerNavigationHook({name:'rc43-confrontation',after:()=>{if(STATE.tab==='interview')options();}});
 window.PS_RC43=Object.freeze({refresh:options});options();
})();
