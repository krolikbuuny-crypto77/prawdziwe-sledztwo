/* RC44: cinematic breakthroughs index; only existing gate-verified PS85 scenes. */
(()=>{
 'use strict';if(!window.PS85_STORY)return;
 const parent=document.getElementById('deduction');if(!parent)return;
 const panel=document.createElement('section');panel.id='ps44Scenes';panel.className='ps-next-panel';
 const title=document.createElement('h3');title.textContent='Przełomy śledztwa · powrót do scen';
 const desc=document.createElement('p');desc.textContent='Sceny wynikają tylko z istniejących, zweryfikowanych powiązań. Ponowne obejrzenie nie zmienia zapisu, dowodów ani werdyktu.';
 const items=document.createElement('div');panel.append(title,desc,items);parent.append(panel);
 const names={work:'Dyspozycja i dokumentacja',warning:'Ostrzeżenie i obieg zgłoszeń',access:'Przepustka i zapis sesji',lastcontact:'Luka między kontaktami',mechanism:'Granice ustaleń medycznych',faultline:'Dwa łańcuchy informacji',presence:'Zegary nie są alibi',boundary:'Granice ostatniej wiadomości'};
 function render(){if(STATE.tab!=='deduction')return;items.replaceChildren();
  const available=window.PS85_STORY.available();const read=new Set(window.PS85_STORY.read());
  for(const id of available){const b=document.createElement('button');b.type='button';b.className='btn subtle';b.textContent=(read.has(id)?'Odczytana · ':'Nowy przełom · ')+(names[id]||id);
   b.addEventListener('click',()=>window.PS85_STORY.open(id));items.append(b);}
  if(!available.length){const p=document.createElement('p');p.textContent='Nowe sceny pojawią się po zweryfikowaniu wymaganych powiązań.';items.append(p);}
 }
 registerNavigationHook({name:'rc44-scene-index',after:render});window.PS_RC44=Object.freeze({render});render();
})();
