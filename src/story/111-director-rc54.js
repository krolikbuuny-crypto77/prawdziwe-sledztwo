/* RC54 — cinematic pace strictly from unlocked scenes and real, already saved turns.
 * Display only; never creates testimony, evidence, psychological truth or new story gates. */
(()=>{
 'use strict';if(typeof STATE==='undefined'||!window.PS85_STORY)return;
 const host=document.getElementById('interview');if(!host)return;
 const panel=document.createElement('details');panel.id='ps54Director';panel.className='ps-next-panel';
 const heading=document.createElement('summary');heading.textContent='Rytm sceny · przesłuchanie';
 const intro=document.createElement('p');intro.textContent='Dyskretna inscenizacja na podstawie już przeprowadzonej rozmowy. Komentarz nie jest zeznaniem ani dowodem.';
 const caption=document.createElement('p');caption.id='ps54DirectorCaption';caption.setAttribute('aria-live','off');
 const path=document.createElement('div');path.className='ps54-path';
 const go=document.createElement('button');go.className='btn subtle';go.type='button';go.textContent='Zobacz odkryte przełomy';
 go.addEventListener('click',()=>showTab('deduction'));
 panel.append(heading,intro,caption,path,go);
 const point=host.querySelector('#ps43Confrontation')||host.querySelector('.chathead');point?.insertAdjacentElement('afterend',panel);
 const stageText={opening:'Rozmowa dopiero się rozpoczyna. Zacznij od pytań o konkretną obserwację.',
 followup:'Wracasz do szczegółów wcześniejszych odpowiedzi. Warto oddzielić pamięć świadka od zapisu dokumentowego.',
 deep:'Rozmowa jest długa. Teraz szczególnie istotne stają się niespójności, źródła i konkretne granice wiedzy.',
 breakthrough:'W aktach jest już sprawdzony przełom. Można wrócić do niego przed kolejnym pytaniem.'};
 function inspect(id=STATE.activeChar){
  const log=STATE.dialogues?.[id]||[];
  const turns=log.filter(m=>m?.role==='player').length;
  const unlocked=window.PS85_STORY.available().slice(0,10);
  const phase=unlocked.length?'breakthrough':turns>=12?'deep':turns>=3?'followup':'opening';
  return {phase,turns,available:unlocked.length};
 }
 function render(){if(STATE.tab!=='interview')return;const s=inspect();caption.textContent=stageText[s.phase];path.replaceChildren();
  const phases=[['Początek',s.turns>=1],['Doprecyzowania',s.turns>=3],['Długie przesłuchanie',s.turns>=12],['Zweryfikowany przełom',s.available>0]];
  for(const [label,done] of phases){const mark=document.createElement('span');mark.className=done?'ps54-step done':'ps54-step';mark.textContent=(done?'● ':'○ ')+label;path.append(mark);}
  go.disabled=!s.available;go.title=s.available?'Otwórz dostępne, zweryfikowane sceny':'Brak zweryfikowanych przełomów';
 }
 registerNavigationHook({name:'rc54-director',after:render});
 window.PS_RC54=Object.freeze({inspect,render});
 // Mirror can update STATE outside the navigation lifecycle.
 let last='';setInterval(()=>{if(document.hidden||STATE.tab!=='interview')return;const s=inspect();const key=STATE.activeChar+':'+s.turns+':'+s.available;if(key!==last){last=key;render();}},3900);
 render();
})();
