/* Pakiet 6.17: lokalna rozgrywka jest dostępna offline, zaś serwer otrzymuje
 * jawny dziennik zdarzeń do niezależnej walidacji. Nigdy nie wysyłamy lokalnego
 * obiektu STATE jako automatycznie zatwierdzonej prawdy. */
(()=>{
 'use strict';
 const K='ps617-pending-actions';
 let queue=[];let rev=null;let busy=false;let disabled=false;let timer=0;let retryDelay=1200;let rejectedCount=0;
 let verifiedVerdict=null;let awaitingResume=!!document.getElementById('psResumeOffer');let resetPending=false;
 try{resetPending=localStorage.getItem('ps617-reset-pending')==='1';}catch{}
 try{queue=JSON.parse(localStorage.getItem(K)||'[]');if(!Array.isArray(queue))queue=[];}catch{queue=[];}
 queue=queue.filter(x=>x&&typeof x.id==='string'&&x.action&&typeof x.action==='object').slice(-100);
 const save=()=>{try{localStorage.setItem(K,JSON.stringify(queue.slice(-100)));}catch{}};
 const state=document.createElement('span');state.id='ps-server-state-status';
 state.setAttribute('aria-live','polite');
 state.style.cssText='font-size:11px;opacity:.7;padding:3px 6px;display:inline-block';
 state.textContent='Zapis lokalny; synchronizacja po połączeniu';
 (document.getElementById('saveBtn')?.parentElement||document.body).appendChild(state);
 const status=text=>{state.textContent=text;};
 function renderServerVerdict(){
  const panel=document.querySelector?.('#simHearingDetail .sim-trial-result');if(!panel)return;
  let node=panel.querySelector('.ps618-confirmation');
  if(!node){node=document.createElement('p');node.className='ps618-confirmation small muted';panel.appendChild(node);}
  node.textContent=verifiedVerdict?.serverApproved?
   'Zatwierdzenie serwera: '+String(verifiedVerdict.label||verifiedVerdict.kind||'sprawa oceniona')+'.':
   'To rozstrzygnięcie lokalne. Zatwierdzenie serwera nastąpi po synchronizacji poprawnych czynności.';
 }

 const key=()=>String(Date.now())+'-'+Math.random().toString(16).slice(2);
 function enqueue(action){
  queue.push({id:key(),action});queue=queue.slice(-100);save();schedule();
 }
 function schedule(delay=650){clearTimeout(timer);timer=setTimeout(sync,delay);}
 async function sync(){
  if(awaitingResume||busy||disabled||!navigator.onLine||!/^https?:$/.test(location.protocol))return;
  busy=true;
  try{
   if(resetPending){
    const cleared=await fetch('/api/game-session-reset',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:'{}'});
    if(!cleared.ok)throw Error('session-reset-unavailable');
    resetPending=false;try{localStorage.removeItem('ps617-reset-pending');}catch{}
    rev=null;
   }
   let r=await fetch('/api/game-state',{credentials:'same-origin',cache:'no-store'});
   if(r.status===404||r.status===503){status('Postęp lokalny — serwer nie jest skonfigurowany');disabled=r.status===404;return;}
   if(!r.ok)throw Error('state-read');
   let data=await r.json();if(!data.ok)throw Error('state-error');rev=data.revision;verifiedVerdict=data.state?.verdict||null;renderServerVerdict();
   if(!queue.length){status(rejectedCount?'Część wcześniejszych działań pozostała lokalna (wymaga weryfikacji)':'Postęp serwerowy aktywny · zapis lokalny dostępny');retryDelay=1200;return;}
   const batch=[];let bytes=90;
   for(const item of queue.slice(0,20)){
    const size=encodeURIComponent(JSON.stringify(item)).replace(/%[0-9A-F]{2}/g,"x").length+2;
    if(batch.length&&bytes+size>56000)break;
    batch.push(item);bytes+=size;
   }
   r=await fetch('/api/game-state',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-PS-Client':'game'},
    body:JSON.stringify({revision:rev,actions:batch})});
   if(r.status===409){status('Synchronizacja ponawiana…');retryDelay=1500;return;}
   if(!r.ok)throw Error('state-write');
   data=await r.json();if(!data.ok)throw Error('state-error');rev=data.revision;verifiedVerdict=data.state?.verdict||null;renderServerVerdict();
   const processed=new Set(batch.map(x=>x.id));
   const retryable=new Set(['puzzle_evidence_prerequisite_missing','stage_out_of_order','indictment_not_approved','timeline_anchors_missing']);
   const retryItems=batch.filter((x,i)=>!data.decisions[i]?.ok&&retryable.has(data.decisions[i]?.reason)&&Number(x.retries||0)<100).map(x=>({...x,retries:Number(x.retries||0)+1}));
   queue=[...queue.filter(x=>!processed.has(x.id)),...retryItems].slice(-100);save();
   const rejected=data.decisions.filter((x,i)=>!x.ok&&!retryItems.some(retry=>retry.id===batch[i]?.id)).length;rejectedCount+=rejected;retryDelay=retryItems.length?Math.min(60000,retryDelay*2):1200;
   status(rejected?'Postęp lokalny — część czynności wymaga dalszej weryfikacji':
    queue.length?'Synchronizowanie postępu…':'Zatwierdzony postęp zapisany na serwerze');
  }catch{status('Pracujesz lokalnie — synchronizacja zostanie ponowiona');retryDelay=Math.min(60000,retryDelay*2);}
  finally{busy=false;if((queue.length||resetPending)&&!disabled&&navigator.onLine)schedule(retryDelay);}
 }
 PS_EVENTS.on('evidenceCollected','ps617-server-proposal',e=>{
  if(!e.id||!['area-search','scene-inspection'].includes(e.origin))return;
  const action={type:'collect_evidence',docId:e.id,origin:e.origin};
  if(e.origin==='area-search')action.area=STATE.area;
  else{
   const item=STATE.scene12?.selected,step=STATE.scene12?.steps?.[item];
   action.spotId=item;action.room=STATE.scene12?.room;action.method=step?.method;action.answer=step?.answer;
  }
  enqueue(action);
 });
 // Wersja 6.18: tylko odpowiedzi gracza trafiają na serwer jako PROPOZYCJE.
 // Sam import lokalnego zapisu nie jest dowodem wykonania czynności.
 // Resume choice is explicit. A click outside the prompt must not reset the server session.

 window.addEventListener('online',()=>{disabled=false;schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();});
 if(!awaitingResume&&!resetPending){
  // Gra bez wybranego zapisu zaczyna NOWĄ sesję również w Supabase.
  resetPending=true;try{localStorage.setItem('ps617-reset-pending','1');}catch{}
  queue=[];save();
 }
 setTimeout(sync,650);
 document.addEventListener('click',e=>{
  const target=e.target.closest?.('[data-sim-continue],[data-ps54-trial]');if(!target)return;
  setTimeout(()=>{
   if(STATE.sim?.trial)enqueue({type:'request_verdict'});
   renderServerVerdict();
  },0);
 });
 window.PS617_SYNC=Object.freeze({
  enqueue,get approvedVerdict(){return verifiedVerdict;},get pending(){return queue.length;},get enabled(){return !disabled;},get rejected(){return rejectedCount;},
  resume(){awaitingResume=false;disabled=false;schedule();},
  resetSession(){
   awaitingResume=false;queue=[];save();resetPending=true;rev=null;verifiedVerdict=null;disabled=false;
   try{localStorage.setItem('ps617-reset-pending','1');}catch{}
   status('Nowa sesja lokalna — reset serwera po połączeniu');schedule();
  },retry:sync
 });
})();
