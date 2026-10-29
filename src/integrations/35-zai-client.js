/* Pakiet 6.5: Z.ai formułuje język świadka, nigdy zdarzenia ani wynik śledztwa.
   Ta warstwa musi być ostatnią warstwą wysyłania w manifest.json. */
(function(){
 'use strict';
 if(typeof simSendChat!=='function'||typeof STATE==='undefined'||!STATE.dialogues)return;
 const previous=WitnessEngine.snapshotSend();
 const by=id=>document.getElementById(id);
 const URL='/api/interview';
 const online=/^https?:$/.test(location.protocol);
 const normTokens=s=>String(norm(s)).split(/[^a-z0-9]+/).filter(Boolean);
 const numeric=s=>[...String(s).matchAll(/\b\d+(?::\d+)?(?:[.,]\d+)?\b/g)].map(m=>m[0]).sort().join('|');
 const negations=new Set(['nie','nigdy','brak','bez','zaden','zadna','zadnych','tylko','jedynie','nikogo','niczego','nikt']);
 const forbiddenNew=/\b(?:zabilem|zabilam|zamordowalem|zamordowalam|przyznaje\s+sie|ukrylem\s+cialo|widzialem\s+zabojstwo|zniszczylem\s+dowody)\b/;
 const uncertain=/\b(?:nie wiem|nie pamiętam|nie jestem pew|nie mogę potwierdzić|nie potrafię|chyba|może|możliwe|wydaje mi się|prawdopodobnie|według|podobno)\b/;
 const emergency=/\b(?:odmawiam|pelnomocnik|nie bede dalej odpowiadac|nie moge potwierdzic wniosku z tego materialu)\b/;
 function safeRewrite(canonical, proposed){
  if(typeof proposed!=='string'||proposed.length<12||proposed.length>1650||/[<>\u0000-\u0008\u000e-\u001f]/.test(proposed))return false;
  if(numeric(canonical)!==numeric(proposed))return false;
  const a=normTokens(canonical),b=normTokens(proposed);
  if(!a.length||!b.length)return false;
  const negative=x=>x.filter(t=>negations.has(t)).sort().join('|');
  if(negative(a)!==negative(b))return false;
  if(forbiddenNew.test(norm(proposed))&&!forbiddenNew.test(norm(canonical)))return false;
  const distinct=new Set(a.filter(x=>x.length>=5));
  const coverage=[...distinct].filter(x=>b.includes(x)).length/Math.max(1,distinct.size);
  const extra=new Set(b.filter(x=>x.length>=5&&!distinct.has(x)));
  // Wersja 6.5 nie rozluźnia bramek semantycznych przy parafrazie.
  return coverage>=0.85&&extra.size<=Math.max(3,Math.floor(distinct.size*.20));
 }
 function semanticGuard(source,proposed){
  if(typeof proposed!=='string'||proposed.length<12||proposed.length>1650||/[<>\u0000-\u0008\u000e-\u001f]/.test(proposed))return false;
  if(numeric(source)!==numeric(proposed))return false;
  if(uncertain.test(norm(source))&&!uncertain.test(norm(proposed)))return false;
  if(/\b(?:nie|nigdy|nikt|nikogo|niczego|zaden|zadna|bez|brak)\b/.test(norm(source)) &&
   !/\b(?:nie|nigdy|nikt|nikogo|niczego|zaden|zadna|bez|brak)\b/.test(norm(proposed)))return false;
  if(forbiddenNew.test(norm(proposed))&&!forbiddenNew.test(norm(source)))return false;
  // Walidacja znaczenia po stronie serwera pozostaje wymagana; te kontrole są drugą barierą.
  return true;
 }
 // Forma autonomicznego wyrażenia emocji: model wybiera gotową, zatwierdzoną
 // przez grę frazę. Rdzeń faktograficzny pozostaje dokładnie taki, jak lokalne zeznanie.
 const prefaces=Object.freeze({
  MAREK:['','Proszę to zapisać dokładnie. ','To nie jest proste pytanie. '],
  TOMASZ:['','Spróbuję to uporządkować. ','Tak to zapamiętałem. '],
  JANUSZ:['','Powiem bez owijania. ','Zostańmy przy faktach. '],
  ELZBIETA:['','Postaram się to wyjaśnić. ','Proszę mi pozwolić dokończyć. '],
  KAMIL:['','Od strony technicznej wygląda to tak. ','Po kolei. '],
  MAGDALENA:['','Precyzyjnie rzecz ujmując. ','Zaznaczę jedną rzecz. ']
 });
 let pending=null;
 const status=document.createElement('div');status.id='ps77-response-wait';status.setAttribute('aria-live','polite');
 status.style.cssText='font-size:12px;color:#a8afb1;padding:2px 4px;display:none';
 by('chatInput')?.closest('.chatfoot')?.appendChild(status);
 let inflight=false,cloudRetryAt=0,requestSerial=0;
 const sync=function(c,before,after){
  const m=NPC9_MEMORY?.[c.id],st=NPC4_STATE?.[c.id];
  const semantic=m?.semantic?.slice().reverse().find(x=>x.answer===before);
  if(semantic)semantic.answer=after;
  const stmt=m?.statements?.slice().reverse().find(x=>x.text===before);
  if(stmt)stmt.text=after;
  if(st?.recent?.length&&st.recent.at(-1).answer===norm(before))st.recent.at(-1).answer=norm(after).slice(0,1550);
  if(st?.npc65?.lastAnswer===before)st.npc65.lastAnswer=after.slice(0,1300);
  if(st?.npc68?.threads?.length&&st.npc68.threads.at(-1).a===before.slice(0,850))st.npc68.threads.at(-1).a=after.slice(0,850);
 };
 function showBusy(value){inflight=value;status.style.display=value?'block':'none';status.textContent=value?'Świadek przygotowuje odpowiedź…':'';
  const send=by('chatSend'),input=by('chatInput');if(send)send.disabled=value;if(input)input.disabled=value;
 }
 function send(){
  if(inflight)return;
  const c=CONTENT.characters.find(x=>x.id===STATE.activeChar),input=by('chatInput');
  const question=String(input?.value||'').trim(),attached=by('attachedDoc')?.value||'';
  const log=c?STATE.dialogues[c.id]:null,oldLen=log?.length||0;
  // Lokalny silnik rozstrzyga stan gry, lecz jego odpowiedź pozostaje ukryta
  // do zakończenia analizy Z.ai. Dzięki temu gracz nie widzi dwóch różnych zeznań.
  const wantsCloud=!!(c&&question&&!attached&&online&&navigator.onLine&&Date.now()>=cloudRetryAt);
  if(wantsCloud)pending={id:c.id,log,start:oldLen};
  let out;try{out=previous.apply(this,arguments);}catch(error){pending=null;throw error;}
  const finishLocal=()=>{
    if(c&&question&&!wantsCloud&&log?.length===oldLen+2&&log.at(-1)?.role==='npc'){
      window.PS617_SYNC?.enqueue?.({type:'record_local_turn',witnessId:c.id,question,response:log.at(-1).text});
    }
    if(pending&&pending.log===log){pending=null;if(STATE.activeChar===c?.id&&STATE.tab==='interview')renderChat();}
    return out;
  };
  if(!wantsCloud||!log||log.length!==oldLen+2)return finishLocal();
  const row=log.at(-1),answer=row?.text,mem=NPC9_MEMORY?.[c.id];
  if(!row||row.role!=='npc'||typeof answer!=='string'||answer.length<12||simWitness(c).blocked)return finishLocal();
  if(emergency.test(norm(answer))||['CONFESSION','CORRECTION_WITH_EVIDENCE'].includes(mem?.semantic?.at(-1)?.status))return finishLocal();
  if(window.PS_BREAKTHROUGH?.shouldKeepCanonical?.(c.id,question,attached))return finishLocal();
  const context=PS65_CONTEXT.read(c.id,answer,question,oldLen);
  if(!context)return finishLocal();
  const payload={version:3,witnessId:c.id,name:c.name,role:c.role,canonical:answer.slice(0,1900),
   question:question.slice(0,1600),context};
  // Lokalna odpowiedź jest zachowana w pamięci i będzie ujawniona tylko przy fallback.
  const serial=++requestSerial;showBusy(true);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),26000);
  fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl.signal})
   .then(r=>{if(!r.ok){
      cloudRetryAt=Date.now()+(r.status===429?3600000:r.status===404?86400000:120000);
      window.PS617_SYNC?.enqueue?.({type:'record_local_turn',witnessId:c.id,question,response:answer});
      return null;
    }return r.json();})
   .then(data=>{
    const text=typeof data?.text==='string'?data.text.trim():'';
    let next=answer;
    if(data?.serverCanonical===true){
      // Server-side authorisation is based on an independent bank of facts.
      // Client IDs no longer have to match server-owned fact IDs.
      if(data.decision==='answer'&&data.semanticVerified===true&&text&&
         !/[<>]/.test(text)&&text.length<=1650)next=text;
      else if(data.decision==='fallback'&&text&&text.length<=1650)next=text;
      // Server fallback and displayed testimony now match on successful HTTP calls.
    }else if(Array.isArray(data?.factIds)&&data.factIds.length){
      const ids=data.factIds,bank=context.knowledge.factBank||[];
      const picked=ids.map(id=>bank.find(f=>f.id===id));
      const valid=ids.length<=4&&picked.every(Boolean)&&new Set(ids).size===ids.length;
      if(data?.decision==='answer'&&valid){
       const grounded=picked.map(x=>x.text).join(' ');
       // Serwer musi potwierdzić niezależną ocenę SEMANTYCZNĄ,
       // inaczej wyświetlamy wyłącznie dokładne, wcześniej dopuszczone fakty.
       next=data.semanticVerified===true&&semanticGuard(grounded,text)?text:grounded;
      }
    }else{
      // Zgodność ze starszym API 6.6 (gdy backend i frontend są aktualizowane oddzielnie).
      const key=Number.isInteger(data?.prefaceKey)?data.prefaceKey:0;
      const prefix=(prefaces[c.id]||[''])[key]||'';
      const ids=Array.isArray(data?.sourceIds)?data.sourceIds:[data?.sourceId];
      const choices=ids.map(id=>context.knowledge.groundedOptions.find(x=>x.id===id));
      const valid=ids.length>0&&ids.length<=2&&choices.every(Boolean)&&new Set(ids).size===ids.length;
      const grounded=(data?.decision==='answer'&&valid)?choices.map(x=>x.text).join(' '):answer;
      next=prefix+(safeRewrite(grounded,text)?text:grounded);
    }
    if(next===answer)return;
    // Kontrola sceny, sesji, kolejności, oryginalnego wpisu i niezmiennego statusu.
    if(serial!==requestSerial||STATE.dialogues[c.id]!==log||log.at(-1)!==row||row.text!==answer||
      ['CONFESSION','CORRECTION_WITH_EVIDENCE'].includes(NPC9_MEMORY?.[c.id]?.semantic?.at(-1)?.status)||
      simWitness(c).blocked)return;
    row.text=next;
    // W trybie AI-first tekst prezentacyjny nie zmienia kanonicznego rejestru
    // zeznań ani wewnętrznych faktów. Historia widoczna graczowi pozostaje
    // zapisana osobno w STATE.dialogues.
    if(data?.serverCanonical!==true&&data?.primaryMode!==true)sync(c,answer,next);
    // Render w finally — dopiero po zatwierdzeniu odpowiedzi lub fallbacku.
   })
   .catch(()=>{cloudRetryAt=Date.now()+90000;window.PS617_SYNC?.enqueue?.({type:'record_local_turn',witnessId:c.id,question,response:answer});})
   .finally(()=>{clearTimeout(timer);if(serial===requestSerial){pending=null;showBusy(false);if(STATE.activeChar===c.id&&STATE.tab==='interview')renderChat();}});
  return out;
 }
 // Całą turę, również przy naciśnięciu Enter, kierujemy do tego samego
 // kontrolera. Historyczna obsługa Enter w core wywoływała sendChat bez Z.ai.
 by('chatInput')?.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.shiftKey||e.isComposing)return;
  e.preventDefault();e.stopImmediatePropagation();WitnessEngine.submit();
 },true);
 // Zmieniamy wyłącznie wizualizację oczekującej odpowiedzi, bez dotykania
 // kanonicznego zeznania, zapisów, walidatorów ani EventBus.
 const originalRender=renderChat;
 renderChat=function(){
  const result=originalRender.apply(this,arguments);
  if(pending&&STATE.activeChar===pending.id&&STATE.dialogues[pending.id]===pending.log&&
     pending.log.length>=pending.start+2&&pending.log.at(-1)?.role==='npc'){
   const bubble=by('chatLog')?.querySelector('.bubble.npc:last-child');
   if(bubble){
    const label=document.createElement('span');
    label.textContent=CONTENT.characters.find(c=>c.id===pending.id)?.name||'Świadek';
    const message=document.createElement('em');message.textContent='Formułuje odpowiedź…';
    bubble.replaceChildren(label,message);bubble.setAttribute('aria-busy','true');
   }
  }
  return result;
 };
 registerWitnessSendLayer('zai-cloud-fallback',send);
 window.PS77_AI=Object.freeze({mode:'zai_primary_semantics_v5',get busy(){return inflight;},safeRewrite,semanticGuard,context:PS65_CONTEXT.read});
})();
