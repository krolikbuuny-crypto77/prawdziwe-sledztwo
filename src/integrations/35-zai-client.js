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
 let inflight=false,requestSerial=0,cloudFailure='';
 let retryTurn=null;
 const TURN_STORAGE='ps_ai_retry_turn_v636';
 const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const uuid=()=>window.crypto?.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
  const b=window.crypto?.getRandomValues?.(new Uint8Array(1))?.[0]??Math.floor(Math.random()*256);
  return (c==='x'?b%16:(b%4+8)).toString(16);
 });
 function restoreDraftObject(target,before,after){
  if(!target||!before||!after)return;
  for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
   if(equal(before[key],after[key])||!equal(target[key],after[key]))continue;
   if(Object.prototype.hasOwnProperty.call(before,key))target[key]=copy(before[key]);else delete target[key];
  }
 }
 function takeDraft(c){return {n4:copy(NPC4_STATE?.[c.id]),n9:copy(NPC9_MEMORY?.[c.id]),
  sim:copy(STATE.sim),events:copy(STATE.events),stage:copy(window.stage3?.export?.())};}
 function rollbackDraft(c,before,after){
  restoreDraftObject(NPC4_STATE?.[c.id],before.n4,after.n4);
  restoreDraftObject(NPC9_MEMORY?.[c.id],before.n9,after.n9);
  restoreDraftObject(STATE.sim,before.sim,after.sim);
  if(equal(STATE.events,after.events)&&!equal(before.events,after.events))STATE.events=copy(before.events);
  if(window.stage3?.restore&&equal(window.stage3.export?.(),after.stage)&&!equal(before.stage,after.stage))window.stage3.restore(before.stage);
  if(typeof simRenderInterrogation==='function')simRenderInterrogation();
  if(typeof simRenderTop==='function')simRenderTop();
 }
 function loadRetry(){try{const x=JSON.parse(sessionStorage.getItem(TURN_STORAGE)||'null');return x&&typeof x.question==='string'&&typeof x.id==='string'?x:null;}catch{return null;}}
 function saveRetry(x){retryTurn=x;try{if(x)sessionStorage.setItem(TURN_STORAGE,JSON.stringify(x));else sessionStorage.removeItem(TURN_STORAGE);}catch(_){}}
 retryTurn=loadRetry();
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
 // W trakcie przesłuchania nie pokazuj graczowi informacji o silniku AI.
 // Czekanie sygnalizuje wyłącznie neutralna wypowiedź w dymku rozmowy.
 // Komunikaty błędów pozostają widoczne, aby nie ukrywać problemów technicznych.
 function showBusy(value){inflight=value;status.style.display=(!value&&!!cloudFailure)?'block':'none';status.textContent=value?'':cloudFailure;
  const send=by('chatSend'),input=by('chatInput');if(send)send.disabled=value;if(input)input.disabled=value;
 }
 function send(){
  if(inflight)return;
  if(window.PS617_SYNC?.restoring){cloudFailure='Trwa przywracanie wcześniejszych rozmów. Spróbuj ponownie po synchronizacji.';showBusy(false);return;}
  const c=CONTENT.characters.find(x=>x.id===STATE.activeChar),input=by('chatInput');
  const question=String(input?.value||'').trim(),attached=by('attachedDoc')?.value||'';
  const log=c?STATE.dialogues[c.id]:null,oldLen=log?.length||0;
  // Lokalny silnik rozstrzyga stan gry, lecz jego odpowiedź pozostaje ukryta
  // do zakończenia analizy Z.ai. Dzięki temu gracz nie widzi dwóch różnych zeznań.
  // Cloud may interpret an already verified presented document, but never
  // an unsupported exhibit or a scripted breakthrough/correction.
  const attachmentOK=!attached||(STATE.found.has(attached)&&
   (typeof simIsVerified!=='function'||simIsVerified(attached))&&
   STATE.sim.auditJudgments?.[attached]?.status!=='overclaim');
  cloudFailure='';
  if(question.length>1600){cloudFailure='Pytanie jest za długie (maksymalnie 1600 znaków). Skróć je, nie zostanie ucięte automatycznie.';showBusy(false);return;}
  if(!online||!navigator.onLine){cloudFailure='Połącz z internetem, aby przesłuchać świadka przez AI.';showBusy(false);return;}
  if(!attachmentOK){cloudFailure='Materiał musi być pozyskany i zweryfikowany przed konfrontacją.';showBusy(false);return;}
  const wantsCloud=!!(c&&question&&attachmentOK&&online&&navigator.onLine);
  if(wantsCloud)pending={id:c.id,log,start:oldLen};
  const beforeDraft=c?takeDraft(c):null;
  let out;try{out=previous.apply(this,arguments);}catch(error){pending=null;throw error;}
  const afterDraft=c?takeDraft(c):null;
  const procedural=!!(c&&(simWitness(c).blocked||
   emergency.test(norm(log?.at(-1)?.text||''))||
   ['CONFESSION','CORRECTION_WITH_EVIDENCE','PROCEDURAL_REFUSAL'].includes(NPC9_MEMORY?.[c.id]?.semantic?.at(-1)?.status)||
   window.PS_BREAKTHROUGH?.shouldKeepCanonical?.(c.id,question,attached)));
  const finishLocal=()=>{
    if(c&&question&&log?.length===oldLen+2&&log.at(-1)?.role==='npc'){
      const finalText=log.at(-1).text;
      log.at(-1).ai=psAiMeta({provider:'local',model:'witness-engine-local',fallbackReason:'local_or_scripted_turn',durationMs:0});
      PS65_CONTEXT.finalize?.(c.id,finalText,finalText,log);
      window.PS617_SYNC?.enqueue?.({type:'record_local_turn',witnessId:c.id,question,response:finalText});
    }
    if(pending&&pending.log===log){pending=null;if(STATE.activeChar===c?.id&&STATE.tab==='interview')renderChat();}
    return out;
  };
  if(!wantsCloud||!log||log.length!==oldLen+2){
   if(procedural||!question)return finishLocal();
   if(log?.length>=oldLen+2)log.splice(oldLen,log.length-oldLen);
   rollbackDraft(c,beforeDraft,afterDraft);PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);
   window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
   if(input)input.value=question;
   cloudFailure='Nie można rozpocząć tej rozmowy przez AI. Ponów pytanie.';pending=null;showBusy(false);
   if(typeof renderChat==='function')renderChat();return out;
  }
  const row=log.at(-1),answer=row?.text,mem=NPC9_MEMORY?.[c.id];
  if(procedural)return finishLocal();
  if(!row||row.role!=='npc'||typeof answer!=='string'||answer.length<12){
   log.splice(oldLen,2);rollbackDraft(c,beforeDraft,afterDraft);
   PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
   if(input)input.value=question;pending=null;
   cloudFailure='Brak bezpiecznej podstawy odpowiedzi AI. Ponów pytanie.';
   showBusy(false);renderChat();return out;
  }
  const context=PS65_CONTEXT.read(c.id,answer,question,oldLen);
  if(!context){
   log.splice(oldLen,2);rollbackDraft(c,beforeDraft,afterDraft);PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);
   window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
   if(input)input.value=question;pending=null;
   cloudFailure='Nie udało się przygotować bezpiecznego kontekstu dla AI. Ponów pytanie.';showBusy(false);renderChat();return out;
  }
  // The synchronous legacy engine runs only in a speculative sandbox. Capture
  // its facts and proposed effects, then discard ALL provisional progression
  // before the network request starts. Only an accepted cloud answer commits.
  const playerDraft=log.at(-2);
  log.splice(oldLen,2);
  rollbackDraft(c,beforeDraft,afterDraft);
  PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);
  window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
  if(typeof psSchedule==='function')psSchedule();
  const unchanged=()=>log.length===oldLen&&
   equal(NPC4_STATE?.[c.id],beforeDraft.n4)&&equal(NPC9_MEMORY?.[c.id],beforeDraft.n9)&&
   equal(STATE.sim,beforeDraft.sim)&&equal(STATE.events,beforeDraft.events)&&
   equal(window.stage3?.export?.(),beforeDraft.stage);
  const commitDraft=()=>{
   if(!unchanged())return false;
   restoreDraftObject(NPC4_STATE?.[c.id],afterDraft.n4,beforeDraft.n4);
   restoreDraftObject(NPC9_MEMORY?.[c.id],afterDraft.n9,beforeDraft.n9);
   restoreDraftObject(STATE.sim,afterDraft.sim,beforeDraft.sim);
   if(!equal(beforeDraft.events,afterDraft.events))STATE.events=copy(afterDraft.events);
   if(window.stage3?.restore&&!equal(beforeDraft.stage,afterDraft.stage))window.stage3.restore(afterDraft.stage);
   log.push(playerDraft,row);
   return true;
  };
  const prior=retryTurn&&retryTurn.witnessId===c.id&&retryTurn.question===question&&retryTurn.evidenceId===attached?retryTurn:null;
  const turnId=prior?.id||uuid();
  saveRetry({id:turnId,witnessId:c.id,question,evidenceId:attached});
  const payload={version:3,witnessId:c.id,name:c.name,role:c.role,canonical:answer.slice(0,1900),
   question,presentedEvidenceId:attached||null,context,turnId};
  // Local draft is provisional only; it must never be displayed as a free-form reply.
  const serial=++requestSerial;showBusy(true);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),290000);
  let cloudAccepted=false;
  const unavailable=(message)=>{
   if(serial!==requestSerial||STATE.dialogues[c.id]!==log)return;
   // No provisional response is in STATE or the transcript while awaiting AI.
   // On rejected responses, keep the initial state and restore the input.
   if(log.length===oldLen+2&&log.at(-1)===row){
    log.splice(oldLen,2);rollbackDraft(c,beforeDraft,afterDraft);
    PS65_CONTEXT?.discardUnanswered?.(c.id,oldLen+2);
    window.PS68_MEMORY?.discardUnanswered?.(c.id,oldLen+2);
   }
   if(input)input.value=question;
   cloudFailure=message||'AI nie odpowiedziało. Ponów pytanie.';
   if(typeof psSchedule==='function')psSchedule();
  };
  // Newly obtained evidence must be approved by Supabase before a cloud confrontation.
  (async()=>{
   // Establish the signed Supabase session cookie BEFORE sending a payable AI
   // request. If the POST response is lost, the next retry still uses the same
   // session and durable turnId. Do not spend AI tokens without a handshake.
   const handshake=await fetch('/api/game-state',{method:'GET',credentials:'same-origin',cache:'no-store',signal:ctrl.signal});
   if(!handshake.ok)throw Object.assign(Error('session_not_ready'),{sessionNotReady:true});
   if(attached&&window.PS617_SYNC?.ensureEvidence){
    const approved=await window.PS617_SYNC.ensureEvidence(attached,3000);
    if(!approved)throw Object.assign(Error('evidence_not_yet_approved'),{localOnly:true});
   }
   return fetch(URL,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload),signal:ctrl.signal});
  })()
   .then(async r=>{if(!r.ok){
      let detail=null;
      try{detail=await r.json();}catch{} // No raw upstream content is ever displayed.
      const error=String(detail?.error||'');
      const reasons=String(detail?.fallbackReason||'').split(';').filter(x=>/^(?:gemini|zai|groq)_(?:timeout|rate_limited|authorization_failed|upstream_unavailable|not_configured|request_failed|rejected_by_validation|budget_exhausted|model_not_available)$/.test(x));
      const labels={model_not_available:'model niedostępny',gemini:'Gemini Flash',zai:'Z.ai',groq:'Groq',timeout:'przekroczony czas',rate_limited:'limit dostawcy',authorization_failed:'brak autoryzacji',upstream_unavailable:'błąd dostawcy',not_configured:'brak konfiguracji',request_failed:'błąd żądania',rejected_by_validation:'odrzucona odpowiedź',budget_exhausted:'brak czasu na próbę'};
      // Show a safe, finite reason code; no questions, prompts or private data.
      const attempts=Array.isArray(detail?.qualityDiagnostics?.attempts)?detail.qualityDiagnostics.attempts:[];
      const rejected=attempts.filter(x=>x&&x.provider==='gemini'&&x.result==='rejected');
      const lastCode=String(rejected.at(-1)?.code||'');
      const reasonLabels={bad_fact_ids:'zły wybór faktów',poor_style:'niewłaściwa forma',hard_guard:'niezgodność ze źródłem',not_entailed:'niepotwierdzona treść',not_relevant:'odpowiedź nie na temat',not_complete:'niepełna odpowiedź',missing_question_part:'pominięta część pytania',semantic_repetition:'powtórzenie wcześniejszej odpowiedzi',repeated_previous_reply:'powtórzenie',presented_evidence_ignored:'pominięty dowód',server_guard:'niezgodność końcowa'};
      const providerStatus=reasons.map(x=>{const sep=x.indexOf('_');const k=x.slice(sep+1);
       return labels[x.slice(0,sep)]+': '+labels[k]+(x.startsWith('gemini_rejected_by_validation')&&reasonLabels[lastCode]?' ('+reasonLabels[lastCode]+')':'');}).join(', ');
      const message=r.status===409?'Dowód nie jest jeszcze zatwierdzony. Ponów pytanie po synchronizacji.':
       r.status===429?'Limit zapytań przesłuchań został osiągnięty. Ponów później.':
       error==='Shared rate limiter unavailable'?'Limit zapytań Supabase jest niedostępny. Sprawdź migrację SQL 003 i ustawienia serwera.':
       error==='Server session not configured'?'Sesja Supabase nie jest skonfigurowana na Vercel.':
       error==='Server testimony history unavailable'?'Serwer nie może odczytać historii przesłuchań z Supabase.':
       error==='Testimony history conflict'?'Nie udało się zapisać odpowiedzi w Supabase. Ponów pytanie.':
       r.status===503&&providerStatus?'AI nie zwróciło zatwierdzonej odpowiedzi. '+providerStatus+'. Ponów pytanie.':
       'AI jest chwilowo niedostępne (HTTP '+r.status+'). Ponów pytanie.';
      unavailable(message);
      return null;
    }return r.json();})
   .then(data=>{
    if(!data)return;
    // RC29: the browser must accept the SAME server-approved providers as
    // /api/interview, not only the historical Gemini provider. Never trust a
    // provider name alone: require the server's canonical/verification flags,
    // the exact turn ID and the existing text-safety checks.
    const auditedProviders=new Set(['gemini','groq','mistral','zai','apinex-luna','apinex-minimax','apinex-mimo','apinex-glm','apinex-deepseek','apinex-glmx','apinex-muse','apinex-gemini','apinex-deepseekpro','apinex-glmpro']);
    const isAudited=auditedProviders.has(data?.provider)&&data?.semanticVerified===true;
    // Server-authored local fallback is a separate, explicitly marked type.
    // It is not misrepresented as having passed the cloud semantic audit.
    const isLocalAuthored=data?.provider==='local'&&data?.localVerified===true&&data?.semanticVerified===false;
    if(data?.decision!=='answer'||data?.serverCanonical!==true||(!isAudited&&!isLocalAuthored)){
     unavailable('Nie otrzymano zatwierdzonej odpowiedzi AI. Ponów pytanie.');return;
    }
    const text=typeof data?.text==='string'?data.text.trim():'';
    const serverApproved=data.serverCanonical===true&&data.decision==='answer'&&
     (isAudited||isLocalAuthored)&&data.turnId===turnId&&text.length>=12&&text.length<=1650&&
     !/[<>\u0000-\u0008\u000e-\u001f]/.test(text);
    if(!serverApproved){unavailable('Odrzucono nieprawidłową odpowiedź AI. Ponów pytanie.');return;}
    if(serial!==requestSerial||STATE.dialogues[c.id]!==log||row.text!==answer||
       !commitDraft()){
     unavailable('Stan przesłuchania zmienił się podczas odpowiedzi AI. Ponów pytanie.');return;
    }
    row.text=text;
    row.ai=psAiMeta(data);
    // Gemini controls only visual expression, never approved gameplay stress/trust.
    const face=document.querySelector('#witnessStage .wp-stage');
    if(face&&STATE.activeChar===c.id&&/^(neutral|focused|uncertain|tense|guarded|surprised|sad|relieved|controlled|irritated)$/.test(data.emotion||'')){
      face.dataset.ps637AiEmotion=data.emotion;
      face.dataset.ps622Emotion=data.emotion;
      face.querySelectorAll('.wp-mouth-curve').forEach(path=>{
       const mouth={neutral:'M143 192Q159 191 176 192',focused:'M144 193Q159 191 175 193',uncertain:'M144 193Q159 197 175 193',tense:'M145 193Q159 190 174 193',guarded:'M143 193Q159 193 175 192',surprised:'M149 193Q160 200 171 193',sad:'M144 194Q159 199 176 194',relieved:'M144 192Q159 197 175 192',controlled:'M145 193Q159 192 174 193',irritated:'M146 192Q159 190 173 192'};
       path.setAttribute('d',mouth[data.emotion]);
      });
    }
    PS65_CONTEXT.read(c.id,answer,question,oldLen);
    window.PS68_MEMORY?.recordApproved?.(c.id,question,answer);
    cloudAccepted=true;
    saveRetry(null);
    // The server owns the exact wording and has already checked semantics.
    // Never silently substitute the provisional local testimony.
    // Render w finally — dopiero po zatwierdzeniu odpowiedzi lub fallbacku.
   })
   .catch(error=>{
    unavailable(error?.sessionNotReady?'Sesja serwerowa nie jest gotowa. Ponów pytanie.':error?.localOnly?'Dowód oczekuje na zatwierdzenie przez serwer. Ponów pytanie.':
     'Połączenie z AI zostało przerwane. Ponów pytanie.');
   })
   .finally(()=>{
    clearTimeout(timer);
    if(serial===requestSerial){
     if(cloudAccepted&&STATE.dialogues[c.id]===log&&log.at(-1)===row){
      PS65_CONTEXT.finalize?.(c.id,answer,row.text,log);
      window.PS68_MEMORY?.finalize?.(c.id,question,answer,row.text,log);
      // A late cloud answer must also be included in local export/autosave.
      if(typeof psSchedule==='function')psSchedule();
     }
     pending=null;showBusy(false);
     if(STATE.activeChar===c.id&&STATE.tab==='interview')renderChat();
    }
   });
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
 by('chatInput')?.setAttribute('maxlength','1600');
 registerWitnessSendLayer('zai-cloud-fallback',send);
 window.PS77_AI=Object.freeze({mode:'ai_required_gemini_rc7',get busy(){return inflight;},
  get lastDiagnostic(){const rows=STATE.dialogues[STATE.activeChar]||[];
   return rows.slice().reverse().find(x=>x.role==='npc'&&x.ai)?.ai||null;},
  safeRewrite,semanticGuard,context:PS65_CONTEXT.read});
})();
