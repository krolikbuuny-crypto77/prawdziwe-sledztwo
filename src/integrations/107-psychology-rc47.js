/* RC47: displayed heuristics are transcript-based, never privileged mental states or facts. */
(()=>{
 'use strict';const host=document.getElementById('interview');if(!host)return;
 const box=document.createElement('section');box.id='ps47Psychology';box.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Psychologia rozmowy · sygnały z pytań';
 const note=document.createElement('p');note.textContent='Szacunek tonu na podstawie Twoich pytań, a nie odczyt rzeczywistego stanu psychicznego świadka. Nie zwiększa dostępnej wiedzy postaci.';
 const status=document.createElement('p');box.append(title,note,status);
 host.querySelector('.chathead')?.insertAdjacentElement('afterend',box);
 const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 function inspect(id=STATE.activeChar){const log=STATE.dialogues?.[id]||[];const questions=log.filter(m=>m.role==='player').map(m=>fold(m.text));
  const pressure=questions.filter(q=>/(klam|ukryw|oszuk|przecz|win|przyznaj)/.test(q)).length;
  const clarifications=questions.filter(q=>/(dlaczego|sprecyz|sprost|wczesniej|dokladnie|wytlumacz)/.test(q)).length;
  const sources=questions.filter(q=>/(dowod|dokument|potwierd|zrod|log|rejestr)/.test(q)).length;
  const fatigue=questions.length>=18?'długa':questions.length>=7?'rozwinięta':'wstępna';
  return {turns:questions.length,pressure,clarifications,sources,phase:fatigue};}
 function render(){if(STATE.tab!=='interview')return;const x=inspect();status.textContent=`Rozmowa ${x.phase} (${x.turns} pytań). Zarzuty/nacisk: ${x.pressure}; doprecyzowania: ${x.clarifications}; odwołania do źródeł: ${x.sources}. To opis sposobu prowadzenia rozmowy, nie ocena prawdziwości odpowiedzi.`;}
 registerNavigationHook({name:'rc47-psychology',after:render});
 setInterval(()=>{if(!document.hidden&&STATE.tab==='interview')render();},3900);
 window.PS_RC47=Object.freeze({inspect,render});render();
})();
