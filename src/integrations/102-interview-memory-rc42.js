/* RC42: read-only interrogation memory, derived from transcript; never alters NPC facts. */
(()=>{
 'use strict';
 if(typeof STATE==='undefined'||!document.getElementById('interview'))return;
 const box=document.createElement('section');box.id='ps42Memory';box.className='ps-next-panel';
 box.setAttribute('aria-label','Pamięć rozmowy ze świadkiem');
 const title=document.createElement('h3');title.textContent='Przesłuchania';
 const note=document.createElement('p');note.textContent='Powracające pytania i wątki z rzeczywistej rozmowy. To przypomnienie treści, nie dowód prawdziwości zeznania.';
 const info=document.createElement('p');info.id='ps42MemorySummary';
 const list=document.createElement('div');list.id='ps42MemoryItems';
 box.append(title,note,info,list);
 document.getElementById('interview').querySelector('.chathead')?.insertAdjacentElement('afterend',box);
 const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 const stop=new Set(['kiedy','gdzie','ktory','ktora','ktore','dlaczego','prosze','pan','pani','jest','bylo','miales','wtedy','tego','przy','mnie','czy','ten','tam','oraz','sie','nie','jak','od','do','co','o','w','z','ze']);
 function view(){const log=STATE.dialogues?.[STATE.activeChar]||[];
  const turns=log.map((m,i)=>({...m,i})).filter(x=>x.role==='player');
  const tokens=turns.map(x=>[...new Set((fold(x.text).match(/[a-ząćęłńóśźż]{4,}/g)||[]).filter(y=>!stop.has(y)).slice(0,35))]);
  const counts=new Map();tokens.forEach(t=>t.forEach(y=>counts.set(y,(counts.get(y)||0)+1)));
  const repeated=[...counts].filter(([_,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,6);
  return {turns,log,repeated};
 }
 // RC57.10.64: compare the actual player questions before rebuilding an idle
 // panel. Same-length edits and save imports are detected; NPC answers alone
 // do not change this question-based summary.
 let lastRendered=null;
 function questionsChanged(){
  const id=STATE.activeChar,log=STATE.dialogues?.[id]||[];
  if(!lastRendered||lastRendered.id!==id||lastRendered.log!==log||lastRendered.length!==log.length)return true;
  let i=0;
  for(const m of log){
   if(m.role!=='player')continue;
   if(i>=lastRendered.questions.length||lastRendered.questions[i++]!==m.text)return true;
  }
  return i!==lastRendered.questions.length;
 }
 function rememberQuestions(){
  const id=STATE.activeChar,log=STATE.dialogues?.[id]||[];
  lastRendered={id,log,length:log.length,questions:log.filter(m=>m.role==='player').map(m=>m.text)};
 }
 function render(){if(STATE.tab!=='interview')return;const v=view();
  rememberQuestions();
  info.textContent=`Zadane pytania: ${v.turns.length} · powracające hasła: ${v.repeated.length}`;
  list.replaceChildren();
  if(!v.turns.length){const p=document.createElement('p');p.textContent='Rozmowa jeszcze się nie rozpoczęła.';list.append(p);return;}
  for(const turn of v.turns.slice(-5).reverse()){
   const row=document.createElement('div');row.className='ps-next-row';
   const q=document.createElement('span');q.textContent=turn.text.slice(0,220);
   const btn=document.createElement('button');btn.className='btn subtle';btn.type='button';btn.textContent='Wróć do wątku';
   btn.addEventListener('click',()=>{
    if(window.PS_COOP?.active&&!window.PS_COOP.controller)return;
    const field=document.getElementById('chatInput');if(field){field.value='Chcę doprecyzować wcześniejszą odpowiedź na pytanie: „'+turn.text.slice(0,550).replace(/\s+/g,' ')+'”. Co dokładnie miałeś na myśli?';field.focus();}
   });row.append(q,btn);list.append(row);
  }
  if(v.repeated.length){const tag=document.createElement('small');tag.textContent='Wątki powracające: '+v.repeated.map(([a])=>a).join(' · ');list.prepend(tag);}
 }
 registerNavigationHook({name:'rc42-memory',after:()=>render()});
 const previous=typeof renderChat==='function'?renderChat:null;
 // Keep display in sync with server-driven and mirrored transcripts without monkey-patching owners.
 setInterval(()=>{if(!document.hidden&&STATE.tab==='interview'&&questionsChanged())render();},3400);
 window.PS_RC42=Object.freeze({inspect:view,render});render();
})();
