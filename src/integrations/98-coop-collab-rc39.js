/* RC39: both room members can propose questions and cast advisory votes. */
(()=>{
 'use strict';const coop=window.PS_COOP;if(!coop?.mountRoomPanel)return;
 const node=(tag,cls,label)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=label;return e;};
 const host=node('section','ps39-panel');host.id='ps39Panel';host.hidden=true;
 host.append(node('h3','', 'Wspólne uzgodnienia 2.0'));
 host.append(node('p','', 'Obie osoby mogą proponować pytania i wskazywać materiały. Głosy są opiniami graczy, nie zatwierdzają werdyktu.'));
 const form=node('form','ps39-form'),kind=node('select'),input=node('input'),send=node('button','btn alt','Dodaj propozycję');
 kind.setAttribute('aria-label','Typ propozycji');
 [['question','Pytanie do świadka'],['evidence','Materiał do ponownego sprawdzenia']].forEach(([value,title])=>{const o=node('option','',title);o.value=value;kind.append(o);});
 input.maxLength=350;input.required=true;input.placeholder='Zaproponuj konkretne działanie…';input.setAttribute('aria-label','Propozycja dla drugiego gracza');
 send.type='submit';form.append(kind,input,send);
 const votes=node('div','ps39-votes');const ready=node('button','btn alt','Jestem gotowy do finału'),review=node('button','btn subtle','Chcę jeszcze sprawdzić');
 ready.type=review.type='button';votes.append(ready,review);
 const log=node('div','ps39-log');log.setAttribute('role','log');
 const status=node('small','ps39-status');host.append(form,votes,status,log);coop.mountRoomPanel(host);
 let seen=new Set(),lastId=0,polling=false,sending=false;const recent=[];
 const identifier=()=>crypto.randomUUID?crypto.randomUUID():[1e7,1e3,4e3,8e3,1e11].join('-').replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
 function render(){log.replaceChildren();const current=new Map();
  for(const m of recent)if(m.kind==='vote')current.set(m.author,m.text);
  const head=node('p','ps39-vote-summary','Głosowanie (opinia): '+['Gospodarz','Gość'].map(w=>w+': '+(current.has(w)?current.get(w)==='ready'?'gotowy':'chce sprawdzić':'brak głosu')).join('; '));
  log.append(head);
  for(const m of recent.filter(x=>x.kind!=='vote').slice(-30)){
   const p=node('p','ps39-entry',(m.author==='Gospodarz'?'Gospodarz':'Gość')+': '+(m.kind==='question'?'Pytanie — ':'Materiał — ')+m.text);log.append(p);
  }
 }
 function append(item){if(!item||!Number.isSafeInteger(item.id)||seen.has(item.id))return;seen.add(item.id);lastId=Math.max(lastId,item.id);recent.push(item);while(recent.length>75)recent.shift();render();}
 async function fetchNew(){if(polling||!coop.active)return;polling=true;
  try{const response=await fetch('/api/coop-collab?after='+lastId,{credentials:'same-origin',cache:'no-store'});const data=await response.json();
   if(!response.ok||!data.ok)throw Error('Brak dostępu do uzgodnień');
   (data.items||[]).forEach(append);status.textContent='';
  }catch{status.textContent='Uzgodnienia niedostępne. Sprawdź migrację SQL 006.';}finally{polling=false;}
 }
 async function post(kind,text){if(sending||!coop.active)return;sending=true;send.disabled=true;
  try{const response=await fetch('/api/coop-collab',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:JSON.stringify({clientId:identifier(),kind,text})});
   const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'invalid');
   append(result.item);if(kind!=='vote')input.value='';status.textContent='';
  }catch(err){status.textContent=err.message==='collab_rate_limited'?'Zbyt wiele propozycji — spróbuj za chwilę.':'Nie zapisano propozycji.';}
  finally{sending=false;send.disabled=false;}
 }
 form.addEventListener('submit',event=>{event.preventDefault();void post(kind.value,input.value.trim().slice(0,350));});
 ready.addEventListener('click',()=>void post('vote','ready'));
 review.addEventListener('click',()=>void post('vote','review'));
 setInterval(()=>{host.hidden=!coop.active;if(coop.active&&!document.hidden)void fetchNew();},2700);
})();
