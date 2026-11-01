/* RC46: controller-authored annotations of actual transcript lines, co-op synced via signed SaveManager snapshot.
 * Spectator may propose question in RC39; cannot change authoritative game save. */
(()=>{
 'use strict';if(typeof registerSaveHook!=='function')return;
 const host=document.getElementById('notebook');if(!host)return;
 let records=[];
 const panel=document.createElement('section');panel.id='ps46Annotations';panel.className='ps-next-panel';
 const heading=document.createElement('h3');heading.textContent='Kooperacja 3.0 · znaczniki przesłuchań';
 const intro=document.createElement('p');intro.textContent='Oznacz realną wypowiedź jako ważną dla wspólnych notatek. Znacznik nie potwierdza treści i nie wpływa na werdykt. W pokoju edytuje osoba sterująca.';
 const witness=document.createElement('select');witness.setAttribute('aria-label','Świadek dla adnotacji');
 const turn=document.createElement('select');turn.setAttribute('aria-label','Wypowiedź do oznaczenia');
 const comment=document.createElement('input');comment.maxLength=180;comment.placeholder='Uzasadnienie (własna notatka)';
 const add=document.createElement('button');add.type='button';add.className='btn alt';add.textContent='Oznacz wypowiedź';
 const list=document.createElement('div');panel.append(heading,intro,witness,turn,comment,add,list);host.append(panel);
 const allowed=e=>e&&typeof e==='object'&&CONTENT.characters.some(c=>c.id===e.character)&&Number.isInteger(e.index)&&e.index>=1&&e.index<1600&&typeof e.quote==='string'&&e.quote.length<=300&&typeof e.comment==='string'&&e.comment.length<=180;
 function fill(){const old=witness.value;witness.replaceChildren();
  for(const c of CONTENT.characters){const o=document.createElement('option');o.value=c.id;o.textContent=c.name;witness.append(o);}
  witness.value=[...witness.options].some(o=>o.value===old)?old:STATE.activeChar;fillTurns();}
 function fillTurns(){const old=turn.value;turn.replaceChildren();(STATE.dialogues[witness.value]||[]).forEach((m,i)=>{if(m.role!=='npc'||i===0)return;
  const o=document.createElement('option');o.value=String(i);o.textContent='Wypowiedź '+i+': '+m.text.slice(0,95);turn.append(o);});
  if([...turn.options].some(o=>o.value===old))turn.value=old;add.disabled=!turn.value;}
 function editable(){return !window.PS_COOP?.active||window.PS_COOP.controller;}
 function render(){fill();list.replaceChildren();add.disabled=!turn.value||!editable();comment.disabled=!editable();
  const valid=records.filter(e=>{const m=STATE.dialogues[e.character]?.[e.index];return m?.role==='npc'&&m.text.startsWith(e.quote);});
  if(!valid.length){const p=document.createElement('p');p.textContent='Brak oznaczonych wypowiedzi.';list.append(p);}
  for(const rec of valid){const row=document.createElement('div');row.className='ps-next-row';
   const txt=document.createElement('p');txt.textContent=`${CONTENT.characters.find(c=>c.id===rec.character)?.name} · „${rec.quote}…” — ${rec.comment||'Do sprawdzenia'}`;
   const jump=document.createElement('button');jump.type='button';jump.className='btn subtle';jump.textContent='Pokaż';jump.addEventListener('click',()=>{
    STATE.activeChar=rec.character;showTab('interview');
    if(typeof CHAT_VISIBLE!=='undefined')CHAT_VISIBLE[rec.character]=1600;renderChat();
    document.querySelectorAll('#chatLog .bubble')[rec.index]?.scrollIntoView({block:'center'});
   });
   const rm=document.createElement('button');rm.type='button';rm.className='btn subtle';rm.textContent='Usuń';rm.disabled=!editable();rm.addEventListener('click',()=>{if(!editable())return;records=records.filter(x=>x!==rec);window.PS_COOP?.mark?.();render();});
   row.append(txt,jump,rm);list.append(row);}
 }
 witness.addEventListener('change',fillTurns);
 add.addEventListener('click',()=>{if(!editable()||records.length>=80)return;const m=STATE.dialogues[witness.value]?.[Number(turn.value)];if(m?.role!=='npc')return;
  const rec={character:witness.value,index:Number(turn.value),quote:m.text.slice(0,300),comment:comment.value.trim().slice(0,180)};
  if(records.some(e=>e.character===rec.character&&e.index===rec.index))return;
  records.push(rec);comment.value='';window.PS_COOP?.mark?.();render();});
 registerSaveHook({name:'rc46-transcript-annotations',build:data=>{data.rc46Annotations=records.map(e=>({...e}));},apply:data=>{records=Array.isArray(data.rc46Annotations)?data.rc46Annotations.filter(allowed).slice(-80).map(e=>({...e})):[];render();}});
 registerNavigationHook({name:'rc46-annotations',after:()=>{if(STATE.tab==='notebook')render();}});
 window.PS_RC46=Object.freeze({inspect:()=>records.map(x=>({...x})),render});render();
})();
