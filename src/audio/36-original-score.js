
const PS80_TRACK_CALM='/assets/audio/9afd7ae2925be868f1274275.mp3';
const PS80_TRACK_TENSE='/assets/audio/ab06358dcc3b2b510fc7d295.mp3';
(function(){
  'use strict';
  const byId = id => document.getElementById(id);
  const toolbar = byId('ps80AudioBar');
  if (!toolbar) return;
  const toggle = byId('ps80MusicToggle');
  const settingsButton = byId('ps80MusicOptions');
  const panel = byId('ps80Settings');
  const volumeSlider = byId('ps80Volume');
  const volumeLabel = byId('ps80VolumeText');
  const effectsToggle = byId('ps80Effects');
  const trackLabel = byId('ps80TrackName');
  const tracks = {calm: PS80_TRACK_CALM, tense: PS80_TRACK_TENSE};
  const titles = {calm:'Nocne akta', tense:'Cień zajezdni'};
  const saved = (() => {try{return JSON.parse(localStorage.getItem('ps80-sound-settings') || '{}');}catch(_){return {};}})();
  const clamp = value => Math.min(1,Math.max(0,value));
  let volume = clamp(Number.isFinite(+saved.volume) ? +saved.volume : 0.44);
  let effectsEnabled = saved.effects !== false;
  let musicEnabled = false;
  let currentTrack = null;
  let requestId = 0;
  let audioContext = null;
  const players = {};
  const animations = new WeakMap();
  const MUSIC_FADE_MS = 950;
  const FADE_OUT_MS = 720;

  function getPlayer(key){
    if (!players[key]) {
      const player = new Audio();
      player.loop = true;
      player.preload = 'none';
      player.src = tracks[key];
      player.volume = 0;
      player.hidden = true;
      player.id = 'ps80-music-' + key;
      player.setAttribute('aria-hidden','true');
      document.body.appendChild(player);
      players[key] = player;
    }
    return players[key];
  }
  function cancelFade(player){
    const id = animations.get(player);
    if (id !== undefined) cancelAnimationFrame(id);
    animations.delete(player);
  }
  function fadeTo(player, target, duration, onComplete){
    cancelFade(player);
    const from = player.volume;
    const destination = clamp(target);
    const start = performance.now();
    if (duration <= 0 || Math.abs(from - destination) < 0.0005) {
      player.volume = destination;
      if(onComplete) onComplete();
      return;
    }
    const tick = time => {
      const progress = clamp((time - start) / duration);
      const easing = progress*progress*(3-2*progress);
      player.volume = clamp(from + (destination-from)*easing);
      if(progress < 1) animations.set(player,requestAnimationFrame(tick));
      else {animations.delete(player); if(onComplete) onComplete();}
    };
    animations.set(player, requestAnimationFrame(tick));
  }
  function selectedTrack(){
    const tab = typeof STATE !== 'undefined' ? STATE.tab : 'overview';
    return ['interview','inspection12','deduction','final','labs'].includes(tab) ? 'tense' : 'calm';
  }
  function updateInterface(){
    toggle.setAttribute('aria-pressed',String(musicEnabled));
    toggle.setAttribute('aria-label',musicEnabled?'Wyłącz muzykę':'Włącz muzykę');
    const label=toggle.querySelector('.ps80-label');
    if(label)label.textContent=musicEnabled?'Muzyka gra':'Włącz muzykę';
    trackLabel.textContent=titles[selectedTrack()];
    volumeSlider.value=String(Math.round(volume*100));
    volumeLabel.textContent=Math.round(volume*100)+'%';
    effectsToggle.checked=effectsEnabled;
  }
  function saveSettings(){
    try{localStorage.setItem('ps80-sound-settings',JSON.stringify({volume,effects:effectsEnabled}));}catch(_){}
  }
  function fadeOutMusic(){
    const id=++requestId;
    musicEnabled=false;
    currentTrack=null;
    updateInterface();
    for(const player of Object.values(players)) {
      fadeTo(player,0,FADE_OUT_MS,()=>{if(!musicEnabled && id===requestId)player.pause();});
    }
  }
  async function updateMusic(){
    if(!musicEnabled || document.hidden)return;
    const key=selectedTrack();
    trackLabel.textContent=titles[key];
    const newPlayer=getPlayer(key);
    const id=++requestId;
    if(currentTrack===key && !newPlayer.paused){
      fadeTo(newPlayer,volume,270);
      return;
    }
    // Start the incoming track at silence; keep the old one audible until play() succeeds.
    const previous=currentTrack ? players[currentTrack] : null;
    if(newPlayer.paused)newPlayer.volume=0;
    try {
      if(newPlayer.paused)await newPlayer.play();
      if(id!==requestId)return; // A newer selection owns this player.
      if(!musicEnabled || document.hidden) {
        if(currentTrack!==key) {newPlayer.pause();newPlayer.volume=0;}
        return;
      }
      currentTrack=key;
      fadeTo(newPlayer,volume,MUSIC_FADE_MS);
      if(previous && previous!==newPlayer)fadeTo(previous,0,MUSIC_FADE_MS,()=>{
        if(currentTrack!==key || players[currentTrack]!==previous)previous.pause();
      });
      // When a rapid switch reuses a previously fading player, retire all other tracks.
      for(const [otherKey,player] of Object.entries(players)) {
        if(otherKey!==key && player!==previous && !player.paused)fadeTo(player,0,MUSIC_FADE_MS,()=>{if(currentTrack!==otherKey)player.pause();});
      }
    }catch(_){
      if(id===requestId){musicEnabled=false;currentTrack=null;updateInterface();
        if(typeof toast==='function')toast('Przeglądarka zablokowała odtwarzanie muzyki. Użyj przycisku ponownie.');}
    }
  }
  function playInterfaceSound(){
    if(!effectsEnabled || document.hidden || volume<=0)return;
    try{
      if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();
      if(audioContext.state==='suspended')audioContext.resume();
      const now=audioContext.currentTime;
      const oscillator=audioContext.createOscillator();
      const gain=audioContext.createGain();
      oscillator.type='sine';
      oscillator.frequency.setValueAtTime(660,now);
      oscillator.frequency.exponentialRampToValueAtTime(370,now+0.055);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(0.008*volume+0.0001,now+0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.095);
      oscillator.connect(gain);gain.connect(audioContext.destination);
      oscillator.start(now);oscillator.stop(now+0.11);
    }catch(_){}
  }
  toggle.addEventListener('click',()=>{
    if(musicEnabled)fadeOutMusic();
    else{musicEnabled=true;updateInterface();updateMusic();}
  });
  settingsButton.addEventListener('click',()=>{
    panel.hidden=!panel.hidden;
    settingsButton.setAttribute('aria-expanded',String(!panel.hidden));
  });
  document.addEventListener('pointerdown',event=>{
    if(!toolbar.contains(event.target)){
      panel.hidden=true;
      settingsButton.setAttribute('aria-expanded','false');
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!panel.hidden){panel.hidden=true;settingsButton.setAttribute('aria-expanded','false');settingsButton.focus();}
  });
  volumeSlider.addEventListener('input',()=>{
    volume=clamp(Number(volumeSlider.value)/100);
    volumeLabel.textContent=Math.round(volume*100)+'%';
    saveSettings();
    if(musicEnabled && currentTrack)fadeTo(players[currentTrack],volume,190);
  });
  effectsToggle.addEventListener('change',()=>{effectsEnabled=effectsToggle.checked;saveSettings();});
  document.addEventListener('click',event=>{
    if(event.target.closest('#nav button,.ui14-module,#chatSend'))playInterfaceSound();
  },true);
  registerNavigationHook({name:'original-score',after:()=>{
    if(musicEnabled)updateMusic();
    else trackLabel.textContent=titles[selectedTrack()];
  }});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      ++requestId;
      for(const p of Object.values(players)){cancelFade(p);p.pause();}
    }else if(musicEnabled)updateMusic();
  });
  document.addEventListener('pagehide',()=>{
    ++requestId;
    for(const player of Object.values(players)){cancelFade(player);player.pause();}
  });
  updateInterface();
  window.PS80_SOUND={
    get playing(){return musicEnabled&&!document.hidden && Object.values(players).some(p=>!p.paused);},
    get track(){return selectedTrack();},
    get effects(){return effectsEnabled;},
    get volume(){return volume;},
    get activeCount(){return Object.values(players).filter(p=>!p.paused).length;},
    get levels(){return Object.fromEntries(Object.entries(players).map(([key,p])=>[key,Math.round(p.volume*100)/100]));}
  };
})();

