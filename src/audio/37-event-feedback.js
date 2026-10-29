
/* Dźwięki zdarzeń — autorskie barwy syntezowane w Web Audio.
   Reagują na rzeczywiste działania, nie wpływają na stan dochodzenia. */
(function(){
 'use strict';
 const AC=window.AudioContext||window.webkitAudioContext;
 const settings=()=>window.PS80_SOUND;
 const validTypes=new Set(['paper','evidence','breakthrough']);
 let ctx=null,noise=null,noiseRate=0;
 const lastPlayed={paper:-Infinity,evidence:-Infinity,breakthrough:-Infinity};
 const cooldown={paper:130,evidence:340,breakthrough:1500};
 function permitted(){
  const cfg=settings();return !!(AC&&cfg&&cfg.effects&&cfg.volume>0&&!document.hidden);
 }
 function ensureContext(){
  if(!permitted())return null;
  try{
   if(!ctx||ctx.state==='closed'){ctx=new AC();noise=null;noiseRate=0;}
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   return ctx;
  }catch(_){return null;}
 }
 function monoNoise(c){
  if(noise&&noiseRate===c.sampleRate)return noise;
  const n=Math.ceil(c.sampleRate*.28),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
  let seed=0x17AFB251,last=0;
  for(let i=0;i<n;i++){
   seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
   const white=(seed>>>0)/2147483647-1;
   last=.88*last+.12*white;
   d[i]=(white-last)*.55;
  }
  noise=b;noiseRate=c.sampleRate;return b;
 }
 function tone(c,{at,freq,to=freq,dur,level,wave='sine',attack=.008}){
  const o=c.createOscillator(),g=c.createGain();
  o.type=wave;
  o.frequency.setValueAtTime(Math.max(25,freq),at);
  if(to!==freq)o.frequency.exponentialRampToValueAtTime(Math.max(25,to),at+dur);
  g.gain.setValueAtTime(.00001,at);
  g.gain.linearRampToValueAtTime(Math.max(.00002,level),at+Math.min(attack,dur*.33));
  g.gain.exponentialRampToValueAtTime(.00001,at+dur);
  o.connect(g).connect(c.destination);o.start(at);o.stop(at+dur+.012);
 }
 function rustle(c,at,level,delay=0,duration=.19){
  const src=c.createBufferSource(),band=c.createBiquadFilter(),gain=c.createGain();
  src.buffer=monoNoise(c);band.type='bandpass';band.frequency.value=delay?1180:1650;band.Q.value=.56;
  const t=at+delay;
  gain.gain.setValueAtTime(.00001,t);
  gain.gain.linearRampToValueAtTime(level*.67,t+.019);
  gain.gain.linearRampToValueAtTime(level,t+.07);
  gain.gain.exponentialRampToValueAtTime(.00001,t+duration);
  src.connect(band).connect(gain).connect(c.destination);
  src.start(t,0,duration+.015);src.stop(t+duration+.018);
 }
 function sound(type){
  if(!validTypes.has(type)||!permitted())return;
  const t=performance.now();
  if(t-lastPlayed[type]<cooldown[type])return;
  const c=ensureContext();if(!c)return;
  lastPlayed[type]=t;
  const now=c.currentTime+.008,vol=Math.max(.07,Math.min(1,settings().volume));
  // Soft, paper-like noise with no sharp transients.
  if(type==='paper'){
   rustle(c,now,.038*vol,0,.17);
   rustle(c,now,.023*vol,.062,.16);
   tone(c,{at:now+.015,freq:400,to:245,dur:.13,level:.006*vol,wave:'triangle'});
  }
  // Mechanical evidence latch followed by a restrained confirmation note.
  else if(type==='evidence'){
   rustle(c,now,.018*vol,0,.085);
   tone(c,{at:now,freq:420,to:248,dur:.085,level:.025*vol,wave:'triangle',attack:.004});
   tone(c,{at:now+.095,freq:660,to:580,dur:.24,level:.013*vol,attack:.014});
  }
  // A quiet three-note unresolved chord; no imposed emotional verdict.
  else{
   tone(c,{at:now,freq:146.8,to:146.8,dur:.86,level:.016*vol,wave:'sine',attack:.13});
   tone(c,{at:now+.065,freq:293.66,dur:.93,level:.014*vol,attack:.17});
   tone(c,{at:now+.18,freq:369.99,dur:1.09,level:.011*vol,attack:.19});
   tone(c,{at:now+.30,freq:554.37,dur:1.17,level:.008*vol,attack:.16});
  }
  document.dispatchEvent(new CustomEvent('ps81:cue',{detail:{type}}));
 }
 const docTarget=(el)=>!!el.closest('#docList [data-doc],#docPaper [data-ev-dir],#openAcquired,#searchResults button');
 // Capture before the built-in handlers run. Compare AFTER the click; failure
 // messages, viewing old evidence and opening a saved session do not win rewards.
 function observe(ev){
  if(!ev.isTrusted && ev.type==='click')return; // ignore injected/test click scripts
  if(typeof STATE==='undefined'||!(STATE.found instanceof Set))return;
  const element=ev.target&&ev.target.closest?ev.target:null;
  if(!element)return;
  const fileOpened=docTarget(element);
  const verifies=!!element.closest('[data-ps53-decide]');
  const foundBefore=STATE.found.size;
  const oldBreakthroughs=verifies&&window.PS69_STORY?new Set(PS69_STORY.available()):null;
  if(!fileOpened&&!verifies&&ev.type==='keydown'&&element.id!=='searchQuery')return;
  if(!fileOpened&&!verifies&&ev.type==='click'){
   // Ignore navigation and non-investigative taps. Every successful acquisition
   // still passes through one of the supported interactive game surfaces.
   if(!element.closest('button,[role="button"],a,select,input'))return;
  }
  setTimeout(()=>{
   if(typeof STATE==='undefined'||!(STATE.found instanceof Set))return;
   if(verifies&&oldBreakthroughs&&window.PS69_STORY){
    const newly=PS69_STORY.available().some(id=>!oldBreakthroughs.has(id));
    if(newly){sound('breakthrough');return;}
   }
   if(STATE.found.size>foundBefore){sound('evidence');return;}
   if(fileOpened&&STATE.tab==='evidence'){sound('paper');}
  },0);
 }
 document.addEventListener('click',observe,true);
 document.addEventListener('keydown',ev=>{
  if(ev.key==='Enter'&&!ev.repeat&&ev.target?.id==='searchQuery')observe(ev);
 },true);
 // Do not start audio on page load, restore, or while the tab is hidden.
 document.addEventListener('pagehide',()=>{if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{});});
})();
