
/* Seven distinct room ambiences. Two reusable players mix with a real crossfade.
   Gameplay and evidence state are never modified. */
(function(){
  'use strict';
  const byId=id=>document.getElementById(id);
  const enabledInput=byId('ps83Enable');
  const volumeSlider=byId('ps83Volume');
  const volumeLabel=byId('ps83VolumeText');
  const roomLabel=byId('ps83RoomName');
  if(!enabledInput || !volumeSlider || !roomLabel)return;
  const sourceMap={
    'bay':'/assets/audio/0269d6b0195c52a46d67ff52.mp3',
    'workshop':'/assets/audio/7a6b567a467471ab0caf5006.mp3',
    'dispatch':'/assets/audio/2560f8b666fda2f3d582522a.mp3',
    'audit':'/assets/audio/0dcd059a431db9a055cff7db.mp3',
    'office':'/assets/audio/e384013a7e5ce74c211505b5.mp3',
    'passage':'/assets/audio/4562602eb8bea2babfbef446.mp3',
    'lab':'/assets/audio/2bbd8da3a6f02d349d842a08.mp3',
   };
  const roomNames={bay:'Stanowisko nr 3',workshop:'Warsztat TW-217',dispatch:'Dyspozytornia',audit:'Pokój dokumentacji',office:'Biuro BHP',passage:'Korytarz południowy',lab:'Depozyt śladów'};
  const stored=(()=>{try{return JSON.parse(localStorage.getItem('ps83-ambience-settings')||'{}');}catch(_){return {};}})();
  const clamp=value=>Math.min(1,Math.max(0,value));
  let enabled=stored.enabled!==false;
  let volume=clamp(Number.isFinite(+stored.volume)?+stored.volume:0.35);
  let activated=false;
  let activePlayer=null;
  let playingRoom=null;
  let generation=0;
  const ROOM_FADE_MS=1150;
  const EXIT_FADE_MS=950;
  const LEVEL_MULTIPLIER=0.54;  // keep environmental audio below narration/music
  const MAX_LEVEL=0.6;
  const players=[new Audio(),new Audio()];
  const fades=new WeakMap();
  players.forEach(player=>{
    player.preload='none';player.loop=true;player.volume=0;
    player.dataset.room='';player.setAttribute('aria-hidden','true');
  });
  function cancelFade(player){
    const handle=fades.get(player);
    if(handle!==undefined)cancelAnimationFrame(handle);
    fades.delete(player);
  }
  function fadeTo(player,target,duration,finished){
    cancelFade(player);
    const from=player.volume,to=clamp(target),start=performance.now();
    if(duration<=0 || Math.abs(from-to)<0.0005){player.volume=to;if(finished)finished();return;}
    function tick(timestamp){
      const phase=clamp((timestamp-start)/duration);
      const smooth=phase*phase*(3-2*phase);
      player.volume=clamp(from+(to-from)*smooth);
      if(phase<1)fades.set(player,requestAnimationFrame(tick));
      else {fades.delete(player);if(finished)finished();}
    }
    fades.set(player,requestAnimationFrame(tick));
  }
  function clearPlayer(player){
    cancelFade(player);
    player.pause();player.volume=0;
    if(player.dataset.room){
      player.removeAttribute('src');player.dataset.room='';player.load();
    }
  }
  function currentRoom(){
    if(typeof STATE==='undefined' || STATE.tab!=='inspection12')return null;
    const key=STATE.scene12&&STATE.scene12.room;
    return Object.prototype.hasOwnProperty.call(sourceMap,key)?key:'bay';
  }
  function saveSettings(){
    try{localStorage.setItem('ps83-ambience-settings',JSON.stringify({enabled,volume}));}catch(_){}
  }
  function syncInspectionButton(){
    const button=byId('ciSound');
    if(!button)return;
    const playing=enabled&&activated&&volume>0&&currentRoom()!==null;
    button.setAttribute('aria-pressed',String(playing));
    button.textContent=playing?'◉ Wyłącz dźwięki':'◯ Dźwięki otoczenia';
  }
  function updateUi(){
    enabledInput.checked=enabled;
    volumeSlider.value=String(Math.round(volume*100));
    volumeLabel.textContent=Math.round(volume*100)+'%';
    const key=currentRoom();
    roomLabel.textContent=key ? roomNames[key] : 'Cisza poza oględzinami';
    syncInspectionButton();
  }
  function fadeOutAll(){
    const ticket=++generation;
    activePlayer=null;
    playingRoom=null;
    for(const player of players){
      if(player.paused){if(player.dataset.room)clearPlayer(player);continue;}
      fadeTo(player,0,EXIT_FADE_MS,()=>{
        if(ticket===generation && player!==activePlayer)clearPlayer(player);
      });
    }
  }
  async function updateAmbience(){
    updateUi();
    const room=activated&&enabled&&volume>0&&!document.hidden?currentRoom():null;
    if(!room){fadeOutAll();return;}
    const ticket=++generation;
    const targetVolume=Math.min(MAX_LEVEL,volume*LEVEL_MULTIPLIER);
    if(room===playingRoom && activePlayer && !activePlayer.paused){
      fadeTo(activePlayer,targetVolume,260);
      return;
    }
    // Reuse a previously fading track when the user quickly returns to that room.
    let incoming=players.find(player=>player.dataset.room===room && !player.paused);
    if(!incoming){
      incoming=players.find(player=>player!==activePlayer) || players[0];
      clearPlayer(incoming);
      incoming.src=sourceMap[room];
      incoming.dataset.room=room;
      incoming.volume=0;
    }
    try{
      if(incoming.paused)await incoming.play();
      if(ticket!==generation)return; // Do not interrupt a newer transition.
      if(!enabled || !activated || currentRoom()!==room){
        if(incoming!==activePlayer)clearPlayer(incoming);
        return;
      }
      activePlayer=incoming;
      playingRoom=room;
      fadeTo(incoming,targetVolume,ROOM_FADE_MS);
      for(const outgoing of players){
        if(outgoing===incoming || outgoing.paused)continue;
        fadeTo(outgoing,0,ROOM_FADE_MS,()=>{
          if(outgoing!==activePlayer && !outgoing.paused)clearPlayer(outgoing);
        });
      }
    }catch(_){
      if(ticket===generation && incoming!==activePlayer)clearPlayer(incoming);
      // Playback may need another user gesture. Never report success prematurely.
    }
  }
  enabledInput.addEventListener('change',()=>{
    enabled=enabledInput.checked;
    if(enabled)activated=true;
    saveSettings();updateAmbience();
  });
  volumeSlider.addEventListener('input',()=>{
    volume=clamp(Number(volumeSlider.value)/100);
    if(enabled)activated=true;
    saveSettings();updateAmbience();
  });
  // Keep the existing in-scene toggle, but take exclusive ownership of its event.
  // The original cinematic renderer creates a synthetic oscillator on this button;
  // clone the button to prevent both sound engines playing simultaneously.
  const oldButton=byId('ciSound');
  if(oldButton){
    const button=oldButton.cloneNode(true);
    oldButton.replaceWith(button);
    button.addEventListener('click',()=>{
      enabled=!(enabled&&activated);
      activated=true;
      saveSettings();updateAmbience();
    });
  }
  // A click into Oględziny can unlock the ambient audio without turning music on.
  // The setting remains independent of the music toggle and can be disabled anytime.
  document.addEventListener('click',event=>{
    if(!activated && enabled && event.target.closest('[data-tab="inspection12"],[data-go="inspection12"],[data-sc-room]')){
      activated=true;updateAmbience();
    }
  });
  registerNavigationHook({name:'depot-ambience',after:updateAmbience});
  if(typeof scPickRoom==='function'){
    const previous=scPickRoom;
    scPickRoom=function(...args){const result=previous.apply(this,args);updateAmbience();return result;};
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      ++generation;
      players.forEach(clearPlayer);
      activePlayer=null;playingRoom=null;
    }else if(activated)updateAmbience();
  });
  document.addEventListener('pagehide',()=>{++generation;players.forEach(clearPlayer);});
  document.addEventListener('pageshow',event=>{if(event.persisted&&activated)updateAmbience();});
  updateUi();
  window.PS83_AMBIENCE={
    get enabled(){return enabled;},
    get volume(){return volume;},
    get armed(){return activated;},
    get playing(){return players.some(player=>!player.paused);},
    get room(){return currentRoom();},
    get playingRoom(){return playingRoom;},
    get activeCount(){return players.filter(player=>!player.paused).length;},
    get levels(){return players.map(player=>({room:player.dataset.room,volume:Math.round(player.volume*1000)/1000,paused:player.paused}));}
  };
})();

