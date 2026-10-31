/* RC7 — advisory specialist AI panels. No game rule, evidence or verdict mutation. */
(()=>{'use strict';
 const labs={tcms:'TCMS / TW-217',msg:'Logi wiadomości',cctv:'Monitoring',forensic:'Ślady i próbki',access:'Dostęp i przejścia'};
 const $=id=>document.getElementById(id);
 const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const warn=(panel,msg)=>{panel.replaceChildren(make('p',msg));};
 const addLab=()=>{
  const root=$('ux5Hub')||$('labs');if(!root||root.querySelector('#psR7LabAI'))return;
  const section=make('section');section.id='psR7LabAI';section.className='notice';
  const head=make('h3','Notatka techniczna');
  const hint=make('p','Model komentuje wyłącznie zatwierdzone źródła. Nie tworzy nowych pomiarów ani nie zalicza zadań.');hint.className='small muted';
  const select=make('select');select.setAttribute('aria-label','Pracownia do analizy');
  for(const [key,value] of Object.entries(labs)){const option=make('option',value);option.value=key;select.append(option);}
  const button=make('button','Przygotuj notatkę');button.type='button';button.className='btn alt';
  const result=make('div');result.id='psR7LabResult';result.setAttribute('role','status');result.style.cssText='white-space:pre-wrap;line-height:1.6;margin-top:12px';
  section.append(head,hint,select,button,result);root.append(section);
  button.addEventListener('click',async()=>{
   button.disabled=true;warn(result,'Analizowanie zatwierdzonych materiałów…');
   try{
    const response=await fetch('/api/lab-narrative',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:JSON.stringify({lab:select.value})});
    const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data?.error==='lab_prerequisites_missing'?'Najpierw pozyskaj dokumenty potrzebne do tej pracowni.':'Notatka AI nie jest dostępna ('+(data?.error||response.status)+').');
    const a=data.note||{};const text=[a.summary, ...(a.findings||[]).map(x=>'• '+x.text+' [źródło: '+x.sourceId+']'),a.limitations?'Ograniczenia: '+a.limitations:'',a.journalEntry?'Wpis do dziennika (propozycja): '+a.journalEntry:''].filter(Boolean).join('\n\n');
    result.textContent=text||'Brak zatwierdzonych ustaleń.';
   }catch(e){warn(result,e.message||'Nie udało się połączyć z laboratorium AI.');}
   finally{button.disabled=false;}
  });
 };
 const addDefense=()=>{
  const root=$('ps54Hearing');if(!root||root.querySelector('#psR7DefenseAI')||!STATE?.final13?.submitted)return;
  const section=make('section');section.id='psR7DefenseAI';section.className='notice';
  const head=make('h3','Argumenty obrony');
  const hint=make('p','Sześć dodatkowych zarzutów do zatwierdzonego aktu. Opinia AI nie zmienia werdyktu ani wyniku procedury.');hint.className='small muted';
  const button=make('button','Wygeneruj 6 zarzutów obrony');button.type='button';button.className='btn alt';
  const result=make('div');result.setAttribute('role','status');result.style.cssText='white-space:pre-wrap;line-height:1.6;margin-top:12px';
  section.append(head,hint,button,result);root.append(section);
  button.addEventListener('click',async()=>{
   button.disabled=true;warn(result,'Obrona analizuje akt oskarżenia…');
   try{
    const response=await fetch('/api/defense-objections',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:'{}'});
    const data=await response.json();
    if(!response.ok||data.ok!==true)throw Error(data?.error==='indictment_not_approved'?'Poczekaj na zatwierdzenie aktu oskarżenia na serwerze.':'Obrona AI nie jest dostępna ('+(data?.error||response.status)+').');
    result.replaceChildren();
    for(const [i,item] of data.objections.entries()){
     const el=make('p',(i+1)+'. '+item.title+'\n'+item.argument+'\nŹródło: '+item.sourceId+'\nPytanie obrony: '+item.question);
     result.append(el);
    }
   }catch(e){warn(result,e.message||'Obrona AI jest niedostępna.');}
   finally{button.disabled=false;}
  });
 };
 const mount=()=>{addLab();addDefense();};
 const root=document.body;
 if(root){let pending=false;const observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;mount();});}});observer.observe(root,{childList:true,subtree:true});mount();}
})();
