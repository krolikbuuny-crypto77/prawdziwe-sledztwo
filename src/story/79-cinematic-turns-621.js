/* Pakiet 6.21: filmowe przedstawienie istniejących ośmiu przełomów.
 * Wyłącznie prezentacja. Żadnej zmiany etapów, faktów, wyborów ani zapisu.
 */
(function(){
'use strict';
if(!window.PS85_STORY)return;
const curtain=document.getElementById('ps85Curtain');
const title=document.getElementById('ps85FilmTitle');
const text=document.getElementById('ps85FilmText');
const kind=document.getElementById('ps85FilmKind');
const stage=curtain?.querySelector('.ps85-stage');
if(!curtain||!title||!text||!kind||!stage)return;
const titles={
 'Kurs, który wyprzedził papier':['paper','Zderzenie dyspozycji i dokumentów'],
 'Ostrzeżenie, które nie zatrzymało obiegu':['warning','Ostrzeżenie bez potwierdzenia'],
 'Przepustka nie ma twarzy':['cold','Ślad systemowy, nie obserwacja'],
 'Między powrotem a wiadomością':['night','Przerwa w nocnej chronologii'],
 'Kontakt to nie opis śmierci':['night','Granice ustaleń'],
 'Nie jeden błąd, lecz dwa łańcuchy':['warning','Dwa obiegi informacji'],
 'Alibi złożone z cudzych zegarów':['cold','Różne rodzaje zapisu'],
 'Ostatnia wiadomość nie ma sprawcy':['night','Ustalenia i niedopowiedzenia']
};
const subtitle=document.createElement('p');subtitle.id='ps621StageAtmosphere';subtitle.className='ps621-stage-atmosphere';subtitle.setAttribute('aria-hidden','true');
text.insertAdjacentElement('afterend',subtitle);
const sound=document.createElement('button');sound.type='button';sound.className='ps621-sound-toggle';sound.textContent='Dźwięk scen: wyłączony';sound.setAttribute('aria-pressed','false');sound.setAttribute('aria-label','Włącz lub wyłącz dyskretne dźwięki scen');
const close=curtain.querySelector('#ps85Close');close?.insertAdjacentElement('beforebegin',sound);
let enabled=false,ctx=null,lastCue='',lastFrame='';
function audioCue(){
 if(!enabled||curtain.hidden||document.hidden)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  if(!ctx)ctx=new C();if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(94,now);osc.frequency.exponentialRampToValueAtTime(70,now+.32);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.014,now+.025);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.39);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.42);
 }catch(_){/* Audio opcjonalne. */}
}
function render(){
 if(curtain.hidden){lastFrame='';return;}
 const t=titles[title.textContent];if(!t){stage.removeAttribute('data-ps621-mood');subtitle.textContent='';return;}
 stage.dataset.ps621Mood=t[0];subtitle.textContent=t[1];
 const identity=title.textContent+'|'+kind.textContent;
 if(identity!==lastFrame){
  lastFrame=identity;
  if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   stage.classList.remove('ps621-frame-enter');void stage.offsetWidth;stage.classList.add('ps621-frame-enter');
  }
  audioCue();
 }
}
sound.addEventListener('click',()=>{
 enabled=!enabled;sound.textContent='Dźwięk scen: '+(enabled?'włączony':'wyłączony');sound.setAttribute('aria-pressed',String(enabled));
 if(enabled)audioCue();
});
const observer=new MutationObserver(render);
observer.observe(curtain,{attributes:true,attributeFilter:['hidden']});
observer.observe(title,{childList:true,characterData:true,subtree:true});
observer.observe(kind,{childList:true,characterData:true,subtree:true});
window.PS621_CINEMA=Object.freeze({status:()=>({enabled,active:!curtain.hidden,mood:stage.dataset.ps621Mood||'',caption:subtitle.textContent}),render});
})();
