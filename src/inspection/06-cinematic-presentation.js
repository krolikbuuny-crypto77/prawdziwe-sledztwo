
/* Cinematic Crime Scene v2: presentation only. Does not grant evidence or bypass procedures. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const root=$('inspection12'), photos=$('et1Photos'), stage=photos?.querySelector('.et1-photo-stage');
 if(!root||!photos||!stage||!$('et1SceneImage'))return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const names=['Wgląd ogólny','Perspektywa boczna','Zbliżenie strefy'];
 const state={light:'normal',flashlight:false,immersive:false,audio:null,assets:null,lastRoom:'',lastSpot:'',lastFrame:-1,lastCount:-1,lastDetailVersion:0,paintedDetailVersion:-1,queued:false};
 function game(){return typeof STATE!=='undefined'?STATE:null;}
 function data(){return game()?.scene12||{};}
 function inRoom(){return data().room||'bay';}
 function selected(){return data().selected||'';}
 function spot(){return typeof SC_BY_SPOT!=='undefined'?SC_BY_SPOT[selected()]||null:null;}
 function room(){return typeof SC_ROOMS!=='undefined'?SC_ROOMS.find(r=>r.id===inRoom())||null:null;}
 function shots(){
   if(!state.assets)state.assets=window.PS_PHOTO_ASSETS||{};
   return state.assets.views?.[inRoom()]||[];
 }
 function frame(){const yaw=Number(window.PS_ETAP2_QA?.current?.().yaw??60);return Math.min(2,Math.max(0,Math.floor(((yaw%360+360)%360)/120)));}
 function resetAudioUI(){const b=$('ciSound');if(b){b.setAttribute('aria-pressed','false');b.textContent='◯ Dźwięki otoczenia';}}
 function silence(){
   const a=state.audio;state.audio=null;
   if(!a){resetAudioUI();return;}
   clearInterval(a.timer);
   try{a.master.gain.setTargetAtTime(0,a.ctx.currentTime,.07);}catch(e){}
   try{a.nodes.forEach(n=>{if(typeof n.stop==='function')n.stop();});}catch(e){}
   Promise.resolve(a.ctx.close()).catch(()=>{});
   resetAudioUI();
 }
 function tick(){
   const a=state.audio;
   if(!a||a.ctx.state!=='running'||!root.classList.contains('active')||document.hidden)return;
   try{
     const t=a.ctx.currentTime;
     const o=a.ctx.createOscillator(),g=a.ctx.createGain();
     o.type='triangle';o.frequency.setValueAtTime(390+Math.random()*180,t);
     o.frequency.exponentialRampToValueAtTime(180,t+.11);
     g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.012,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.13);
     o.connect(g);g.connect(a.master);o.start(t);o.stop(t+.15);o.onended=()=>{o.disconnect();g.disconnect();};
   }catch(e){}
 }
 async function soundOn(){
   if(state.audio)return;
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC){$('ciSound').textContent='Dźwięk niedostępny';return;}
   let ctx;
   try{
     ctx=new AC();
     const master=ctx.createGain();master.gain.value=.0001;master.connect(ctx.destination);
     const hum=ctx.createOscillator();hum.type='sine';hum.frequency.value=54;
     const humGain=ctx.createGain();humGain.gain.value=.15;hum.connect(humGain);humGain.connect(master);
     const high=ctx.createOscillator();high.type='sine';high.frequency.value=108;
     const highGain=ctx.createGain();highGain.gain.value=.025;high.connect(highGain);highGain.connect(master);
     const size=Math.round(ctx.sampleRate*2),buf=ctx.createBuffer(1,size,ctx.sampleRate),channel=buf.getChannelData(0);
     let smooth=0;
     for(let i=0;i<size;i++){const white=Math.random()*2-1;smooth=(smooth*.982)+(white*.018);channel[i]=smooth*.28;}
     const noise=ctx.createBufferSource();noise.buffer=buf;noise.loop=true;
     const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;
     const noiseGain=ctx.createGain();noiseGain.gain.value=.20;noise.connect(lp);lp.connect(noiseGain);noiseGain.connect(master);
     const nodes=[hum,high,noise];nodes.forEach(n=>n.start());
     const audio={ctx,master,nodes,timer:null};state.audio=audio;
     await ctx.resume();
     if(state.audio!==audio){await ctx.close();return;}
     master.gain.setTargetAtTime(.22,ctx.currentTime,.6);
     audio.timer=setInterval(tick,7900);
     const b=$('ciSound');if(b){b.setAttribute('aria-pressed','true');b.textContent='◉ Wyłącz dźwięki';}
   }catch(e){if(state.audio?.ctx===ctx)state.audio=null;try{await ctx?.close();}catch(_){}resetAudioUI();}
 }
 function leaveFocus(){
   state.immersive=false;document.body.classList.remove('ci-immersive');
   const b=$('ciFocus');if(b){b.setAttribute('aria-pressed','false');b.textContent='▣ Widok kinowy';}
 }
 function apply(){
   root.dataset.ciLight=state.light;
   root.classList.toggle('ci-flashlight-on',state.flashlight);
   for(const b of root.querySelectorAll('[data-ci-light]'))b.setAttribute('aria-pressed',String(b.dataset.ciLight===state.light));
   const fl=$('ciFlash');if(fl){fl.setAttribute('aria-pressed',String(state.flashlight));fl.textContent=state.flashlight?'◉ Latarka: włączona':'◎ Latarka punktowa';}
 }
 function install(){
   const actions=root.querySelector('.et1-actions');if(!actions)return;
   if(!$('ciPanel')){
     const div=document.createElement('div');div.id='ciPanel';
     div.innerHTML='<div class="ci-masthead"><div><span class="ci-eyebrow">DOKUMENTACJA MIEJSCA</span><div class="ci-heading">Oględziny fotograficzne</div></div><span class="ci-counter" id="ciRoomProgress">STREFA 01 / 07</span></div><div class="ci-toolbar" aria-label="Narzędzia fotograficznych oględzin"><button type="button" class="ci-tool" data-ci-light="normal" aria-pressed="true">Światło neutralne</button><button type="button" class="ci-tool" data-ci-light="trace" aria-pressed="false">Kontrast</button><button type="button" class="ci-tool" data-ci-light="uv" aria-pressed="false">UV — symulacja</button><button type="button" class="ci-tool" id="ciFlash" aria-pressed="false">◎ Latarka punktowa</button><button type="button" class="ci-tool" id="ciSound" aria-pressed="false">◯ Dźwięki otoczenia</button><button type="button" class="ci-tool ci-spacer" id="ciFocus" aria-pressed="false">▣ Widok kinowy</button></div><div class="ci-note"><span aria-hidden="true">ⓘ</span><span>Filtry i latarka są efektem wizualnym, nie metodą ujawniania nowych dowodów. Odnalezienie śladu nadal wymaga badania, interpretacji i zabezpieczenia.</span></div>';
     actions.insertBefore(div,actions.firstChild);
     div.querySelectorAll('[data-ci-light]').forEach(b=>b.addEventListener('click',()=>{state.light=b.dataset.ciLight;apply();}));
     $('ciFlash').addEventListener('click',()=>{state.flashlight=!state.flashlight;apply();});
     $('ciSound').addEventListener('click',()=>state.audio?silence():soundOn());
     $('ciFocus').addEventListener('click',()=>{state.immersive=!state.immersive;document.body.classList.toggle('ci-immersive',state.immersive);const b=$('ciFocus');b.setAttribute('aria-pressed',String(state.immersive));b.textContent=state.immersive?'✕ Zamknij widok kinowy':'▣ Widok kinowy';root.scrollIntoView({block:'start'});});
   }
   const help=actions.querySelector('.et1-mode-help');if(help)help.textContent='Wybierz oznaczony obszar lub dokumentację strefy, następnie przeprowadź badanie.';
   if(!$('ciFilmstrip')){
     const status=document.createElement('div');status.id='ciSceneStatus';status.className='ci-scene-status';
     status.innerHTML='<span><b id="ciRoomName">Strefa</b> · <span id="ciRoomStats">0 / 0</span> zbadanych punktów</span><span id="ciShotLabel">Ujęcie 1 / 3</span>';
     const strip=document.createElement('div');strip.className='ci-filmstrip';strip.id='ciFilmstrip';strip.setAttribute('aria-label','Wybierz filmowy kadr oględzin');
     const controls=photos.querySelector('.et1-photo-controls');
     if(controls){controls.after(status,strip);}
   }
   for(const className of ['ci-stage-atmosphere','ci-stage-grain','ci-stage-flashlight']){
     if(!stage.querySelector('.'+className)){const layer=document.createElement('div');layer.className=className;stage.appendChild(layer);}
   }
   stage.addEventListener('pointermove',ev=>{if(!state.flashlight)return;const rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;stage.style.setProperty('--ci-x',((ev.clientX-rect.left)/rect.width*100).toFixed(1)+'%');stage.style.setProperty('--ci-y',((ev.clientY-rect.top)/rect.height*100).toFixed(1)+'%');},{passive:true});
   const inspector=root.querySelector('.sc-inspector'),detail=$('scDetail');
   if(inspector&&detail&&!$('ciFocusCard')){const card=document.createElement('div');card.id='ciFocusCard';inspector.insertBefore(card,detail);}
   apply();
 }
 function filmstrip(){
   const el=$('ciFilmstrip'),full=shots(),views=state.assets.thumbs?.[inRoom()]||full,current=frame(),r=inRoom();if(!el)return;
   if(state.lastRoom!==r){
     el.replaceChildren();
     views.forEach((url,i)=>{
       const b=document.createElement('button');b.type='button';b.className='ci-shot';b.dataset.ciShot=String(i);
       const img=document.createElement('img');img.src=url;img.loading='lazy';img.decoding='async';img.alt='Perspektywa '+(i+1)+' — '+(room()?.title||r);
       const txt=document.createElement('span');const h=document.createElement('b');h.textContent='UJĘCIE '+String(i+1).padStart(2,'0');
       const sm=document.createElement('small');sm.textContent=names[i]||'Kadr fotograficzny';txt.append(h,sm);b.append(img,txt);
       b.addEventListener('click',()=>{window.PS_ETAP2_QA?.turn?.([60,180,300][i]||60);queuePaint();});el.appendChild(b);
     });
   }
   el.querySelectorAll('[data-ci-shot]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.ciShot)===current)));
 }
 function focus(){
   const el=$('ciFocusCard');if(!el)return;
   const s=spot(),r=room(),done=s&&(data().inspected||[]).includes(s.id);
   const challenge=s&&typeof SC_CHALLENGES!=='undefined'?SC_CHALLENGES[s.id]:null;
   const hasMethod=s&&challenge&&data().steps?.[s.id]?.method===challenge.method;
   const secured=!!(s?.doc&&STATE.found.has(s.doc));
   const guidance=!s?'Wybierz oznaczony obszar albo dokumentację strefy.':done?(s.doc?(secured?'Materiał jest już zabezpieczony w aktach.':'Zbadano i oceniono obserwację. Pozostało zabezpieczenie materiału do akt.'):'Obserwacja została zbadana. Możesz dodać notatkę lub przejść dalej.'):hasMethod?'Metoda dobrana. Teraz oceń obserwację w panelu poniżej.':'Dobierz metodę badania i oceń ustalenie — samo kliknięcie punktu nie dodaje dowodów.';
   el.innerHTML='<span class="ci-eyebrow">KARTA MIEJSCA · PROTOKÓŁ OGLĘDZIN</span><div class="ci-focus-row"><div><div class="ci-focus-title">'+esc(s?.title||'Wybierz obiekt do zbadania')+'</div><div class="ci-focus-meta">'+esc(r?.title||'Zajezdnia')+'</div></div><span class="ci-focus-state '+(done?'done':'')+'">'+(secured?'✓ Zabezpieczono':done?'✓ Zbadano · do zabezpieczenia':'⌖ Do oględzin')+'</span></div><div class="ci-focus-observation">'+esc(s?.look||'Korzystaj z kadrów 4K i planu strefy, aby znaleźć materiał wymagający inspekcji.')+'</div><div class="ci-focus-action"><span>'+esc(guidance)+'</span><button type="button" id="ciGoDetail" '+(!s?'disabled':'')+'>Przejdź do procedury</button></div>';
   el.querySelector('#ciGoDetail')?.addEventListener('click',()=>{const target=$('scDetail');if(!target)return;target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});target.querySelector('button:not(:disabled)')?.focus({preventScroll:true});});
 }
 function paint(){
   state.queued=false;if(!root.classList.contains('active'))return;
   const r=inRoom(),id=selected(),f=frame(),count=(data().inspected||[]).filter(x=>typeof SC_BY_SPOT!=='undefined'&&SC_BY_SPOT[x]?.room===r).length;
   const detailed=state.paintedDetailVersion!==state.lastDetailVersion;
   if(r!==state.lastRoom||f!==state.lastFrame){filmstrip();state.lastFrame=f;}
   if(id!==state.lastSpot||r!==state.lastRoom||count!==state.lastCount||detailed){focus();state.lastSpot=id;state.lastCount=count;state.paintedDetailVersion=state.lastDetailVersion;}
   state.lastRoom=r;
   const roomName=$('ciRoomName');if(roomName)roomName.textContent=room()?.title||r;
   const length=typeof SC_SPOTS!=='undefined'?SC_SPOTS.filter(s=>s.room===r).length:0;
   if($('ciRoomStats'))$('ciRoomStats').textContent=count+' / '+length;
   if($('ciShotLabel'))$('ciShotLabel').textContent='Ujęcie '+(f+1)+' / '+shots().length;
   const all=typeof SC_ROOMS!=='undefined'?SC_ROOMS.length:7;
   const ri=typeof SC_ROOMS!=='undefined'?SC_ROOMS.findIndex(x=>x.id===r)+1:1;
   if($('ciRoomProgress'))$('ciRoomProgress').textContent='STREFA '+String(ri).padStart(2,'0')+' / '+String(all).padStart(2,'0');
 }
 function queuePaint(){if(state.queued)return;state.queued=true;requestAnimationFrame(paint);}
 function attach(){
   const title=$('scRoomTitle'),detail=$('scDetail'),img=$('et1SceneImage');
   if(title)new MutationObserver(queuePaint).observe(title,{childList:true,subtree:true,characterData:true});
   if(detail)new MutationObserver(()=>{state.lastDetailVersion++;queuePaint();}).observe(detail,{childList:true});
   if(img){new MutationObserver(queuePaint).observe(img,{attributes:true,attributeFilter:['src']});img.addEventListener('load',()=>{img.classList.remove('ci-enter');void img.offsetWidth;img.classList.add('ci-enter');},{passive:true});}
   document.addEventListener('click',ev=>{const tab=ev.target.closest?.('[data-tab],[data-go]');if(tab&&tab.getAttribute('data-tab')!=='inspection12'&&tab.getAttribute('data-go')!=='inspection12'){if(state.audio)silence();if(state.immersive)leaveFocus();}else if(tab)queuePaint();});
   document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&state.immersive){leaveFocus();return;}if(ev.altKey&&root.classList.contains('active')&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'')&&(ev.key==='ArrowLeft'||ev.key==='ArrowRight')){ev.preventDefault();window.PS_ETAP2_QA?.turn?.(([60,180,300][(frame()+(ev.key==='ArrowRight'?1:2))%3]));queuePaint();}});
   document.addEventListener('visibilitychange',()=>{if(!state.audio)return;const ctx=state.audio.ctx;if(document.hidden)ctx.suspend().catch(()=>{});else if(root.classList.contains('active'))ctx.resume().catch(()=>{});});
   window.addEventListener('pagehide',silence,{once:true});
 }
 install();attach();queuePaint();
 window.PS_CINEMA_QA={status:()=>({enabled:!!$('ciPanel'),room:inRoom(),frame:frame(),light:state.light,flashlight:state.flashlight,audio:!!state.audio,immersive:state.immersive,shots:$('ciFilmstrip')?.children.length||0}),stopAudio:silence};
})();
