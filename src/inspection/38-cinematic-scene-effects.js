
/* Wyłącznie dramaturgia wizualna. Bez ingerencji w dowody, zasoby ani wynik gry. */
(function(){
 'use strict';
 const doc=document, root=doc.documentElement;
 const prefsKey='ps82-cinematic-motion';
 const systemReduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
 let userEnabled=true;
 try{userEnabled=localStorage.getItem(prefsKey)!=='off';}catch(_){ }
 function allowMotion(){return userEnabled&&!(systemReduce&&systemReduce.matches)&&!doc.hidden;}
 function syncPreference(){root.classList.toggle('ps82-motion-off',!userEnabled);}
 syncPreference();
 // Jedna opcja w istniejących ustawieniach muzyki i efektów.
 const settings=doc.getElementById('ps80Settings');
 if(settings){
  const row=doc.createElement('label');row.className='ps80-checkrow';
  row.innerHTML='<input type="checkbox" id="ps82Motion"><span>Filmowe animacje interfejsu</span>';
  const note=settings.querySelector('.ps80-muted-note');
  settings.insertBefore(row,note||null);
  const toggle=row.querySelector('input');toggle.checked=userEnabled;
  toggle.addEventListener('change',()=>{
    userEnabled=toggle.checked;syncPreference();
    if(!userEnabled){photoContainer?.classList.remove('ps82-scan');sweep.classList.remove('ps82-run');}
    try{localStorage.setItem(prefsKey,userEnabled?'on':'off');}catch(_){}
  });
 }
 const sweep=doc.createElement('div');sweep.id='ps82SceneSweep';sweep.setAttribute('aria-hidden','true');doc.body.appendChild(sweep);
 const moment=doc.createElement('div');moment.id='ps82Moment';moment.setAttribute('role','status');moment.setAttribute('aria-live','polite');moment.innerHTML='<span class="ps82-kicker">AKTA ŚLEDZTWA</span><strong></strong><span class="ps82-sub"></span>';doc.body.appendChild(moment);
 let hideTimer=0;
 function reveal(title,detail){
  if(!allowMotion())return;
  clearTimeout(hideTimer);
  moment.querySelector('strong').textContent=title;
  moment.querySelector('.ps82-sub').textContent=detail;
  moment.classList.add('ps82-visible');
  hideTimer=setTimeout(()=>{moment.classList.remove('ps82-visible');},2600);
 }
 function pulseScene(){
  if(!allowMotion())return;
  sweep.classList.remove('ps82-run');
  void sweep.offsetWidth;
  sweep.classList.add('ps82-run');
 }
 // Bez opóźniania logiki showTab ani przejmowania istniejących listenerów.
 registerNavigationHook({name:'cinematic-scene-effects',after:({id,previousTab})=>{
    if(previousTab!==id && allowMotion()){
      pulseScene();
      const section=doc.getElementById(id);
      if(section&&section.classList.contains('section')&&typeof section.animate==='function'){
        section.animate([{opacity:.55,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.19,.6,.32,1)'});
      }
    }
  }});
 // Animowanie kart dokumentacji tylko podczas zmiany konkretnego wybranego materiału.
 const paper=doc.getElementById('docPaper');
 const index=doc.getElementById('docList');
 let shownDoc=null,docQueued=false;
 if(paper&&index){
  const renderObserver=new MutationObserver(()=>{
    if(docQueued)return;docQueued=true;
    queueMicrotask(()=>{
      docQueued=false;
      if(typeof STATE==='undefined'||STATE.tab!=='evidence')return;
      const selected=index.querySelector('[data-doc][aria-current="true"]');
      const id=selected?.getAttribute('data-doc')||'';
      if(!id||shownDoc===id)return;
      shownDoc=id;
      if(allowMotion()&&typeof paper.animate==='function'){
        paper.animate([{opacity:.58,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:290,easing:'ease-out'});
      }
    });
  });
  renderObserver.observe(paper,{childList:true});
 }
 // Filmowy przebłysk na ramce fotografii, bez przesuwania zdjęcia ani punktów interakcji.
 const photoContainer=doc.getElementById('et1Photos');
 const sceneImage=doc.getElementById('et1SceneImage');
 let photoTimer=0;
 if(photoContainer&&sceneImage){
  const photoObserver=new MutationObserver(()=>{
    if(!allowMotion()||typeof STATE==='undefined'||STATE.tab!=='inspection12')return;
    photoContainer.classList.remove('ps82-scan');
    void photoContainer.offsetWidth;
    photoContainer.classList.add('ps82-scan');
    clearTimeout(photoTimer);
    photoTimer=setTimeout(()=>photoContainer.classList.remove('ps82-scan'),780);
  });
  photoObserver.observe(sceneImage,{attributes:true,attributeFilter:['src']});
 }
 // Zdarzenia tylko po realnym pozyskaniu materiału lub weryfikacji dwóch wątków.
 doc.addEventListener('click',ev=>{
  if(!ev.isTrusted||!ev.target||typeof STATE==='undefined'||!(STATE.found instanceof Set))return;
  const el=ev.target.closest('button,[role="button"],a');if(!el)return;
  const initialCount=STATE.found.size;
  const checks=!!el.closest('[data-ps53-decide]');
  const oldChapters=checks&&window.PS69_STORY?new Set(PS69_STORY.available()):null;
  setTimeout(()=>{
    if(!allowMotion()||typeof STATE==='undefined'||!(STATE.found instanceof Set))return;
    if(checks&&oldChapters&&window.PS69_STORY){
      if(PS69_STORY.available().some(id=>!oldChapters.has(id))){reveal('Nowy przełom w śledztwie','Dwa niezależne ustalenia tworzą nowe powiązanie.');return;}
    }
    if(STATE.found.size>initialCount)reveal('Zabezpieczono nowy materiał','Materiał dołączono do akt sprawy.');
  },0);
 },true);
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden){moment.classList.remove('ps82-visible');sweep.classList.remove('ps82-run');}});
 // Publiczne, odczytowe API dla kontroli (bez elementów diagnostycznych w grze).
 window.PS82_VISUAL={get enabled(){return userEnabled;},get effective(){return !!allowMotion();}};
})();
