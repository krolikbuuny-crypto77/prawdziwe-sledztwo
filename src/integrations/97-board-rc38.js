/* RC38: player-authored connections, NOT new story evidence or facts. */
(()=>{
 'use strict';
 const host=document.getElementById('notebook');if(!host||typeof registerSaveHook!=='function')return;
 const panel=document.createElement('section');panel.id='ps38Board';panel.className='ps38-board surface padded';
 const title=document.createElement('h3');title.textContent='Tablica śledcza 2.0';
 const note=document.createElement('p');note.textContent='Łącz wyłącznie odkryte dokumenty i zapisuj własne hipotezy. Sprzeczność jest oznaczeniem gracza, nie ustalonym faktem.';
 const form=document.createElement('form');form.className='ps38-form';
 const from=document.createElement('select'),to=document.createElement('select');
 from.setAttribute('aria-label','Pierwszy dokument');to.setAttribute('aria-label','Drugi dokument');
 const kind=document.createElement('select');kind.setAttribute('aria-label','Rodzaj powiązania');
 [['link','Powiązanie'],['conflict','Podejrzana sprzeczność'],['verify','Do sprawdzenia']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;kind.append(o);});
 const comment=document.createElement('textarea');comment.rows=2;comment.maxLength=450;comment.placeholder='Dlaczego łączysz te materiały? (własna hipoteza)';comment.setAttribute('aria-label','Uzasadnienie hipotezy');
 const add=document.createElement('button');add.className='btn alt';add.type='submit';add.textContent='Dodaj do tablicy';
 form.append(from,to,kind,comment,add);
 const list=document.createElement('div');list.className='ps38-connections';list.setAttribute('aria-live','polite');
 panel.append(title,note,form,list);host.append(panel);
 const allowed=new Set(['link','conflict','verify']);let entries=[];
 const plain=e=>e&&typeof e==='object'&&typeof e.a==='string'&&typeof e.b==='string'&&e.a!==e.b&&byId[e.a]&&byId[e.b]&&allowed.has(e.kind)&&typeof e.note==='string';
 const name=id=>String(byId[id]?.title||byId[id]?.name||id).slice(0,100);
 function options(){const valid=[...STATE.found].filter(id=>byId[id]).sort();
  for(const sel of [from,to]){
   const selected=sel.value;sel.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Wybierz odkryty dokument';sel.append(empty);
   for(const id of valid){const o=document.createElement('option');o.value=id;o.textContent=name(id);sel.append(o);}
   sel.value=valid.includes(selected)?selected:'';
  }
  add.disabled=valid.length<2;
 }
 function render(){options();list.replaceChildren();
  const visible=entries.filter(e=>STATE.found.has(e.a)&&STATE.found.has(e.b));
  if(!visible.length){const empty=document.createElement('p');empty.textContent='Nie dodano jeszcze powiązań. Wybierz dwa odkryte dokumenty.';list.append(empty);return;}
  for(const [i,e] of visible.entries()){
   const row=document.createElement('article');row.className='ps38-connection';
   const heading=document.createElement('strong');heading.textContent=(e.kind==='conflict'?'SPRZECZNOŚĆ DO WERYFIKACJI':e.kind==='verify'?'DO SPRAWDZENIA':'POWIĄZANIE')+' · '+name(e.a)+' / '+name(e.b);
   const p=document.createElement('p');p.textContent=e.note||'Bez opisu';
   const b=document.createElement('button');b.type='button';b.className='btn subtle';b.textContent='Usuń';b.addEventListener('click',()=>{if(window.PS_COOP?.active&&!window.PS_COOP.controller)return;entries.splice(entries.indexOf(e),1);render();window.PS_COOP?.mark?.();});
   row.append(heading,p,b);list.append(row);
  }
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();if(window.PS_COOP?.active&&!window.PS_COOP.controller)return;
  if(!STATE.found.has(from.value)||!STATE.found.has(to.value)||from.value===to.value||entries.length>=80)return;
  entries.push({a:from.value,b:to.value,kind:kind.value,note:comment.value.trim().slice(0,450)});
  comment.value='';render();window.PS_COOP?.mark?.();
 });
 registerSaveHook({name:'rc38-investigation-board',build(data){data.rc38Board=entries.map(e=>({...e}));},apply(data){entries=Array.isArray(data.rc38Board)?data.rc38Board.filter(plain).slice(-80).map(e=>({a:e.a,b:e.b,kind:e.kind,note:e.note.slice(0,450)})):[];render();}});
 registerNavigationHook({name:'rc38-board-navigation',after:()=>{if(STATE.tab==='notebook')render();}});
 window.PS_RC38_BOARD=Object.freeze({inspect:()=>entries.map(e=>({...e})),render});render();
})();
