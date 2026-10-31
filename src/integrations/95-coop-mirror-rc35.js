/* RC35: private two-player shared-screen mode. One controller, one viewer.
 * Vercel receives a locally generated UI snapshot only for mirroring.
 * All evidence and verdict authorization remains with the original server rules.
 */
(()=>{
 'use strict';
 if(!window.PS_SAVE_MANAGER||!window.PS_COOP_VIEW)return;
 const endpoint='/api/coop';
 const safe=s=>String(s||'').slice(0,180);
 let active=false,connecting=true,controller=false,owner=false,players=0,version=0,code='',busy=false,applying=false,dirty=false,lastPublish=0;
 let nextPoll=0,formOpen=false,formValue='',pendingOps=false,taking=false;
 let lastRenderKey='';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const root=el('aside','ps-coop-bar');root.setAttribute('aria-label','Wspólna gra dwóch śledczych');
 const toolbar=el('div','ps-coop-toolbar');root.appendChild(toolbar);
 // RC35.2: the existing document capture guards restrict the observer.
 // A full-screen shield would also cover the in-flow chat/room controls.
 // RC35.2: mount the controls INSIDE the normal layout, below the sticky header.
 // They now reserve their own space instead of hiding navigation and game panels.
 const main=document.querySelector('.layout > .main');
 const content=main?.querySelector('#mainContent');
 if(main&&content){main.insertBefore(root,content);}else{document.body.prepend(root);}
 
 const label=el('span','ps-coop-info');const actions=el('div','ps-coop-actions');const message=el('span','ps-coop-message');
 toolbar.append(label,actions,message);
 const button=(text,callback,secondary=false)=>{const b=el('button',secondary?'ps-coop-btn secondary':'ps-coop-btn',text);b.type='button';b.addEventListener('click',callback);return b;};
 let controlStatus;
 const notify=(text)=>{message.textContent=text;if(controlStatus)controlStatus.textContent=text;};
 const chatUuid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,x=>{const n=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (x==='x'?n:(n&3)|8).toString(16);});
 // RC35.1: private, token-free player chat, fully separate from game/AI history.
 // RC35.5: persistent bottom dock, separate from the page-top room/join controls.
 // It never becomes part of the mirrored gameplay snapshot.
 const bottomDock=el('div','ps-coop-bottom-dock');bottomDock.hidden=true;
 const controlDock=el('div','ps-coop-control-dock');
 const controlInfo=el('span','ps-coop-control-info');
 const controlActions=el('div','ps-coop-control-actions');
 controlStatus=el('span','ps-coop-control-status');controlStatus.setAttribute('role','status');
 controlDock.append(controlInfo,controlActions,controlStatus);
 const chatDock=el('div','ps-coop-chat-dock');
 const chatDockToggle=button('Czat graczy',showChat,true);chatDockToggle.classList.add('ps-coop-chat-toggle');
 chatDockToggle.setAttribute('aria-controls','ps-coop-chat-panel');
 chatDock.append(chatDockToggle);
 bottomDock.append(controlDock,chatDock);document.body.append(bottomDock);
 const chatPanel=el('section','ps-coop-chat-panel');chatPanel.hidden=true;chatPanel.id='ps-coop-chat-panel';
 const chatTitle=el('div','ps-coop-chat-title','Rozmowa graczy · tylko dla tego pokoju');
 const chatItems=el('div','ps-coop-chat-items');chatItems.setAttribute('role','log');chatItems.setAttribute('aria-live','polite');
 const chatStatus=el('div','ps-coop-chat-status');chatStatus.setAttribute('role','status');
 const chatForm=el('form','ps-coop-chat-form');
 const chatField=el('textarea','ps-coop-chat-input');chatField.setAttribute('aria-label','Wiadomość do drugiego gracza');
 chatField.placeholder='Napisz do drugiego śledczego…';chatField.maxLength=600;chatField.rows=2;
 const chatSend=el('button','ps-coop-btn','Wyślij');chatSend.type='submit';
 chatForm.append(chatField,chatSend);chatPanel.append(chatTitle,chatItems,chatStatus,chatForm);chatDock.insertBefore(chatPanel,chatDockToggle);
 let chatOpen=false,chatBusy=false,chatSending=false,lastChatId=0,chatUnread=0,chatIds=new Set();
 function resetChat(){lastChatId=0;chatUnread=0;chatIds.clear();chatItems.replaceChildren();chatStatus.textContent='';}
 function showChat(){chatOpen=!chatOpen;chatPanel.hidden=!active||!chatOpen;if(chatOpen){chatUnread=0;chatItems.scrollTop=chatItems.scrollHeight;chatField.focus();void pollChat();}lastRenderKey='';redraw();}
 function addChatRow(m){
  if(!m||!Number.isSafeInteger(m.id)||m.id<=0||chatIds.has(m.id)||typeof m.text!=='string')return;
  chatIds.add(m.id);if(chatIds.size>240){const old=chatIds.values().next().value;chatIds.delete(old);}
  lastChatId=Math.max(lastChatId,m.id);
  const nearBottom=chatItems.scrollHeight-chatItems.scrollTop-chatItems.clientHeight<65;
  const row=el('div','ps-coop-chat-row'+(m.own?' mine':''));
  const meta=el('div','ps-coop-chat-meta',(m.author==='Gospodarz'?'Gospodarz':'Gość')+' · '+new Date(m.createdAt).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}));
  const content=el('div','ps-coop-chat-text',m.text);row.append(meta,content);chatItems.append(row);
  while(chatItems.children.length>150)chatItems.firstChild.remove();
  if(nearBottom||chatItems.children.length===1)chatItems.scrollTop=chatItems.scrollHeight;
  if(!m.own&&!chatOpen)chatUnread=Math.min(99,chatUnread+1);
 }
 async function pollChat(){
  if(!active||chatBusy)return;chatBusy=true;
  try{const response=await fetch('/api/coop-chat?after='+lastChatId,{credentials:'same-origin',cache:'no-store'});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok)throw Error(data?.error||'chat_offline');
   (data.messages||[]).forEach(addChatRow);chatStatus.textContent='';
   if(!chatOpen&&data.messages?.length){lastRenderKey='';redraw();}
  }catch(err){chatStatus.textContent=err.message==='chat_storage_unavailable'?'Czat wymaga migracji SQL 005 lub połączenia z bazą.':'Nie można odświeżyć czatu.';}
  finally{chatBusy=false;}
 }
 async function sendChat(event){
  event.preventDefault();if(!active||chatSending)return;
  const text=chatField.value.trim();if(!text||text.length>600)return;
  chatSending=true;chatSend.disabled=true;chatStatus.textContent='Wysyłanie…';
  try{const response=await fetch('/api/coop-chat',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-PS-Client':'game'},
    body:JSON.stringify({clientId:chatUuid(),text})});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok)throw Error(data?.error||'chat_offline');
   chatField.value='';addChatRow(data.message);chatStatus.textContent='';
  }catch(err){chatStatus.textContent=err.message==='chat_rate_limited'?'Wiadomości wysyłane zbyt szybko. Spróbuj za chwilę.':'Nie wysłano wiadomości — ponów próbę.';}
  finally{chatSending=false;chatSend.disabled=false;chatField.focus();}
 }
 chatForm.addEventListener('submit',sendChat);
 chatField.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();chatForm.requestSubmit();}});
 function redraw(){
  document.body.classList.toggle('ps-coop-observer',active&&!controller);
  document.body.classList.toggle('ps-coop-chat-open',active&&chatOpen);
  const key=[active,connecting,controller,owner,players,code,chatOpen,chatUnread,formOpen].join('|');
  if(key===lastRenderKey)return;
  lastRenderKey=key;
  toolbar.classList.toggle('ps-coop-active',active);
  bottomDock.hidden=!active;controlDock.hidden=!active;
  controlInfo.textContent=players===1?'Pokój: oczekiwanie na drugiego gracza':controller?'Sterujesz wspólną grą':'Steruje drugi gracz';
  controlActions.replaceChildren();
  if(!controller&&active){const takeBtn=button(taking?'Przejmowanie…':'Przejmij sterowanie',take);takeBtn.disabled=taking;takeBtn.classList.add('ps-coop-take-action');controlActions.append(takeBtn);}
  chatDockToggle.textContent='Czat graczy'+(chatUnread?' ('+chatUnread+')':'')+(chatOpen?' ▲':' ▼');
  chatDockToggle.setAttribute('aria-expanded',String(chatOpen));
  label.textContent=connecting?'Pokój: sprawdzanie…':active?`Wspólna gra · ${players}/2 · ${controller?'sterujesz':'oglądasz ekran'}`:'Wspólna gra (2 osoby)';
  actions.replaceChildren();
  if(!active){actions.append(button('Utwórz pokój',create),button('Dołącz',()=>{formOpen=!formOpen;redraw();},true));}
  else{
   // Chat and takeover live in persistent bottom controls.
   if(code&&owner)actions.append(button('Kod: '+code,()=>navigator.clipboard?.writeText(code).then(()=>notify('Kod skopiowany')).catch(()=>notify('Kod: '+code)),true));
   // The bottom dock is the single visible controller switch.
   actions.append(button(owner?'Zamknij pokój':'Opuść pokój',leave,true));
  }
  chatPanel.hidden=!active||!chatOpen;
  const old=root.querySelector('.ps-coop-join');old?.remove();
  if(!active&&formOpen){const form=el('form','ps-coop-join');const field=el('input','ps-coop-input');field.setAttribute('aria-label','Kod pokoju');field.placeholder='9-znakowy kod';field.maxLength=14;field.required=true;field.value=formValue;
   field.addEventListener('input',()=>{formValue=field.value.toUpperCase();});
   form.append(field,button('Połącz',()=>{},false));const submit=form.querySelector('button');submit.type='submit';submit.replaceWith(submit);
   form.addEventListener('submit',ev=>{ev.preventDefault();formValue=field.value;join();});root.appendChild(form);
  }
 }
 function frame(){return {save:window.PS_SAVE_MANAGER.build(),view:window.PS_COOP_VIEW.capture()};}
 async function call(action,fields={}){
  const res=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-PS-Client':'game'},body:JSON.stringify({action,...fields})});
  const data=await res.json().catch(()=>({ok:false,error:'invalid_response'}));
  if(!res.ok||!data.ok){const e=Error(safe(data.error||'HTTP '+res.status));e.status=res.status;throw e;}
  return data;
 }
 function accept(data){
  if(!data?.ok)return;
  const wasController=controller,wasActive=active;
  const incomingVersion=Number(data.version)||0;
  // Out-of-order polling must not revoke control that was just transferred.
  if(wasActive&&incomingVersion<version)return;
  active=true;controller=!!data.controller;owner=!!data.owner;players=data.players||1;
  const changed=incomingVersion!==version;version=incomingVersion;
  if(!controller&&changed&&data.frame?.save&&!applying){
   applying=true;
   try{window.PS_SAVE_MANAGER.apply(data.frame.save);window.PS_COOP_VIEW.apply(data.frame.view);dirty=false;}
   catch(err){notify('Nie można odtworzyć widoku: '+safe(err.message));}
   finally{applying=false;}
  }
  if(!wasController&&controller&&data.frame?.save){
   // Do not overwrite the last controller's progress on a control handoff.
   applying=true;
   try{window.PS_SAVE_MANAGER.apply(data.frame.save);window.PS_COOP_VIEW.apply(data.frame.view);}
   catch(error){notify('Sterowanie przekazano. Widok odśwież za chwilę: '+safe(error.message));}
   finally{applying=false;}
  }
  if(!wasActive){resetChat();void pollChat();}
  redraw();
 }
 async function create(){
  if(busy)return;busy=true;notify('Tworzenie pokoju…');
  try{const data=await call('create',{frame:frame()});code=data.code;
   try{localStorage.setItem('ps-coop-owner-code',code);}catch{}
   window.PS617_SYNC?.coopJoined?.();accept(data);dirty=false;notify('Wyślij kod drugiej osobie.');}
  catch(err){
   const messages={
    coop_rooms_table_missing_or_cache_stale:'Nie znaleziono tabeli pokoi w Supabase. Uruchom SQL 004 i odśwież schemat bazy.',
    game_sessions_table_missing_or_cache_stale:'Nie znaleziono tabeli sesji gry. Sprawdź migrację SQL 001.',
    coop_rooms_permission_denied:'Brak uprawnień serwera do tabeli pokoi. Sprawdź klucz service_role w Vercel.',
    supabase_not_configured:'Brak konfiguracji Supabase lub sekretu sesji w Vercel.',
    coop_session_commit_failed:'Nie zatwierdzono nowej sesji gry. Sprawdź funkcję ps_commit_session w Supabase.'
   };
   notify(messages[err.message]||'Nie utworzono pokoju: '+safe(err.message));
  }finally{busy=false;}
 }
 async function join(){
  if(busy)return;busy=true;notify('Dołączanie…');
  try{const data=await call('join',{code:formValue});
   formOpen=false;window.PS617_SYNC?.coopJoined?.();accept(data);notify('Dołączono do wspólnego śledztwa.');}
  catch(err){notify('Nie dołączono: '+safe(err.message));}finally{busy=false;}
 }
 async function take(){
  if(!active||controller||taking)return;
  taking=true;lastRenderKey='';redraw();notify('Przejmowanie sterowania…');
  try{
   // Manual control actions must not silently disappear while a background poll runs.
   for(let attempt=0;attempt<4;attempt++){
    try{
     const data=await call('take');accept(data);dirty=false;
     notify('Sterowanie zostało przekazane. Możesz działać.');return;
    }catch(error){
     if(error.status===423){notify('Trwa odpowiedź AI. Przejmowanie będzie dostępne po jej zakończeniu.');return;}
     if(error.status!==409||attempt===3)throw error;
     await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));
    }
   }
  }catch(error){notify('Nie udało się przejąć sterowania: '+safe(error.message));}
  finally{taking=false;lastRenderKey='';redraw();}
 }
 async function leave(){
  if(busy||!confirm(owner?'Zamknąć pokój dla obojga graczy?':'Opuścić wspólną grę?'))return;
  busy=true;try{await call('leave');try{localStorage.removeItem('ps-coop-owner-code');}catch{}location.reload();}
  catch(err){notify('Nie udało się opuścić: '+safe(err.message));busy=false;}
 }
 async function publish(){
  if(!active||!controller||busy||applying||!dirty||Date.now()-lastPublish<850)return;
  busy=true;
  try{const data=await call('frame',{version,frame:frame()});accept(data);dirty=false;lastPublish=Date.now();}
  catch(err){
   if(err.status===409){
    // Joining changes the room revision too. Keep local changes; refresh the
    // revision and publish in the next cycle iff control is still ours.
    dirty=true;pendingOps=true;
   }else if(err.status===423){dirty=false;pendingOps=true;}
   else notify('Opóźnienie synchronizacji: '+safe(err.message));
  }finally{busy=false;}
  if(pendingOps){pendingOps=false;await refresh();}
 }
 async function refresh(){
  if(connecting||!active||busy||applying)return;
  busy=true;
  try{const response=await fetch(endpoint+'?since='+version,{credentials:'same-origin',cache:'no-store'});
   const data=await response.json().catch(()=>null);
   if(response.status===401||response.status===403||response.status===404){active=false;controller=false;dirty=false;document.body.classList.remove('ps-coop-observer');notify('Pokój zamknięty. Odśwież stronę.');redraw();return;}
   if(data?.ok)accept(data);else notify('Serwer pokoju chwilowo niedostępny.');
  }catch{notify('Trwa oczekiwanie na połączenie…');}finally{busy=false;}
 }
 async function beforeInterview(){
  if(!active)return true;
  if(!controller)return false;
  dirty=true;
  for(let i=0;i<4&&controller;i++){
   if(busy||Date.now()-lastPublish<900){
    await new Promise(resolve=>setTimeout(resolve,Math.max(180,920-(Date.now()-lastPublish))));
   }
   await publish();
   if(!dirty)return true;
  }
  return false;
 }
 const mark=()=>{if(active&&controller&&!applying)dirty=true;};
 // In a shared session new-game resets and JSON imports require closing the
 // room first. Never silently reset the durable shared game for both players.
 document.addEventListener('click',event=>{
  if(!active||root.contains(event.target))return;
  if(event.target.closest?.('#resetBtn,#loadBtn,#loadFile')){
   event.preventDefault();event.stopImmediatePropagation();
   notify('Aby rozpocząć nową grę lub wczytać inny zapis, najpierw zamknij pokój.');
  }
 },true);
 // Prevent spectator-origin gameplay mutations, including hidden form submits.
 for(const type of ['click','pointerdown','keydown','input','change','submit']){
  document.addEventListener(type,event=>{
   if(!active||controller||root.contains(event.target)||bottomDock.contains(event.target))return;
   if(type==='keydown'&&['Tab','Escape','Shift','Control','Alt','Meta'].includes(event.key))return;
   event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
  },true);
 }
 for(const type of ['click','input','change','keyup'])document.addEventListener(type,event=>{if(root.contains(event.target)||bottomDock.contains(event.target))return;mark();},true);
 window.addEventListener('scroll',mark,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)refresh();});
 // Existing navigation and post-AI rendering pass through these named hooks.
 if(typeof registerNavigationHook==='function')registerNavigationHook({name:'rc35-coop-navigation',after:mark});
 const pull=async()=>{
  try{
   const response=await fetch(endpoint+'?since='+version,{credentials:'same-origin',cache:'no-store'});
   if(response.ok){const data=await response.json();
    if(data.ok){if(data.owner){try{code=localStorage.getItem('ps-coop-owner-code')||'';}catch{}}
     window.PS617_SYNC?.coopJoined?.();accept(data);notify('Połączono z pokojem.');}
   }
  }catch{notify('Pokoje niedostępne. Możesz grać samodzielnie.');}
  finally{connecting=false;redraw();window.PS617_SYNC?.retry?.();}
 };
 window.PS_COOP=Object.freeze({get active(){return active;},get controller(){return controller;},get connecting(){return connecting;},get dirty(){return dirty;},get busy(){return busy;},mark,flush:publish,refresh,beforeInterview});
 redraw();pull();
 setInterval(()=>{if(document.hidden||connecting)return;if(!busy&&active){if(controller&&dirty)publish();else refresh();}},1500);
 setInterval(()=>{if(active&&!document.hidden&&chatOpen)void pollChat();},2000);
 setInterval(()=>{if(active&&!document.hidden&&!chatOpen)void pollChat();},6500);
})();
